// Word box: twelve letters, three on each of four sides.
// A word needs at least three letters, every letter must be on the box, and two letters in a row
// may not sit on the same side. The next word starts with the last letter of the one before.
// The aim is to use all twelve letters in as few words as possible.
//
// This file is the solver. It works on lowercase letters and knows nothing about the page.

import { shuffle, type Rng } from './rng.ts';

export const FULL = (1 << 12) - 1;

export interface Entry {
	word: string;
	/** In the word list but not a familiar everyday word. Only used to rank suggestions. */
	obscure: boolean;
}

/** One word per line, lowercase. A leading "~" marks a less familiar word (see tools/build-wordlist.py). */
export function parseWords(text: string): Entry[] {
	const out: Entry[] = [];
	for (const raw of text.split('\n')) {
		const line = raw.trim();
		if (!line) continue;
		const obscure = line[0] === '~';
		const word = obscure ? line.slice(1) : line;
		if (/^[a-z]{3,}$/.test(word)) out.push({ word, obscure });
	}
	return out;
}

export type BoxCheck = { ok: true; sides: string[] } | { ok: false; error: string };

/** Four strings of three letters each, twelve different letters in all. */
export function checkBox(input: string[]): BoxCheck {
	if (input.length !== 4) return { ok: false, error: 'A box has four sides.' };
	const sides = input.map((s) => s.trim().toLowerCase());
	for (let i = 0; i < 4; i++) {
		if (!/^[a-z]{3}$/.test(sides[i])) return { ok: false, error: `Side ${i + 1} needs exactly three letters, a to z.` };
	}
	const all = sides.join('');
	const seen = new Set<string>();
	for (const ch of all) {
		if (seen.has(ch)) return { ok: false, error: `The letter ${ch.toUpperCase()} appears twice. All twelve letters are different.` };
		seen.add(ch);
	}
	return { ok: true, sides };
}

export interface Playable {
	word: string;
	obscure: boolean;
	mask: number;
	first: number;
	last: number;
}

function positions(sides: string[]): Map<string, number> {
	const pos = new Map<string, number>();
	sides.forEach((s, side) => [...s].forEach((ch, k) => pos.set(ch, side * 3 + k)));
	return pos;
}

/** Can this word be played on this box? Returns its letter mask and end positions, or null. */
export function fits(word: string, pos: Map<string, number>): { mask: number; first: number; last: number } | null {
	if (word.length < 3) return null;
	let mask = 0;
	let prevSide = -1;
	let first = -1;
	let last = -1;
	for (let i = 0; i < word.length; i++) {
		const p = pos.get(word[i]);
		if (p === undefined) return null;
		const side = Math.floor(p / 3);
		if (side === prevSide) return null;
		prevSide = side;
		mask |= 1 << p;
		if (i === 0) first = p;
		last = p;
	}
	return { mask, first, last };
}

export function playable(sides: string[], entries: Entry[]): Playable[] {
	const pos = positions(sides);
	const out: Playable[] = [];
	for (const e of entries) {
		const f = fits(e.word, pos);
		if (f) out.push({ word: e.word, obscure: e.obscure, ...f });
	}
	return out;
}

export interface Solution {
	words: string[];
	obscure: number;
	letters: number;
}

export const MAX_RESULTS = 400;
/** Three-word chains can be numerous; the search stops after this many (only used when short chains are scarce). */
const MAX_THREE_WORD = 200000;

/**
 * Every chain of up to `maxWords` words that uses all twelve letters, best first:
 * fewer words, then fewer less-familiar words, then fewer letters, then alphabetical.
 * Returns at most `limit` answers (the best ones); the page only needs a few dozen.
 * One- and two-word chains are always searched in full, so the first answer is the true best of them.
 */
export function solve(sides: string[], entries: Entry[], maxWords = 3, limit = MAX_RESULTS): Solution[] {
	const list = playable(sides, entries);
	const byFirst: Playable[][] = Array.from({ length: 12 }, () => []);
	for (const p of list) byFirst[p.first].push(p);
	const found: Solution[] = [];
	const push = (chain: Playable[]): void => {
		found.push({ words: chain.map((c) => c.word), obscure: chain.filter((c) => c.obscure).length, letters: chain.reduce((n, c) => n + c.word.length, 0) });
	};
	for (const a of list) {
		if (a.mask === FULL) push([a]);
	}
	if (maxWords >= 2) {
		for (const a of list) {
			const need = FULL & ~a.mask;
			if (need === 0) continue;
			for (const b of byFirst[a.last]) {
				if (b === a) continue;
				if ((b.mask & need) === need) push([a, b]);
			}
		}
	}
	const twoOrFewer = found.length;
	if (maxWords >= 3 && twoOrFewer < 20) {
		outer: for (const a of list) {
			const needA = FULL & ~a.mask;
			for (const b of byFirst[a.last]) {
				if (b === a) continue;
				const need = needA & ~b.mask;
				if (need === 0) continue;
				for (const c of byFirst[b.last]) {
					if (c === a || c === b) continue;
					if ((c.mask & need) === need) push([a, b, c]);
					if (found.length - twoOrFewer >= MAX_THREE_WORD) break outer;
				}
			}
		}
	}
	found.sort((x, y) => x.words.length - y.words.length || x.obscure - y.obscure || x.letters - y.letters || x.words.join(' ').localeCompare(y.words.join(' ')));
	return found.slice(0, limit);
}

/** Independent check of an answer: every rule, from scratch. Used by the tests and before showing anything. */
export function verifyChain(sides: string[], words: string[]): boolean {
	const pos = positions(sides);
	let mask = 0;
	for (let i = 0; i < words.length; i++) {
		const f = fits(words[i], pos);
		if (!f) return false;
		if (i > 0 && words[i - 1][words[i - 1].length - 1] !== words[i][0]) return false;
		mask |= f.mask;
	}
	return mask === FULL;
}

export interface WordBoxHint {
	message: string;
}

/** Letters of the opening word to show at level 2: at least the first, never the whole word. */
function prefixLen(len: number): number {
	return Math.max(1, Math.min(3, len - 3));
}

/**
 * Three layers of help built from the best answer. Level 2 never shows the whole opening word,
 * and nothing past the opening word is ever given here.
 * `solutions` must come from `solve` (best first).
 */
export function hintFor(solutions: Solution[], level: 1 | 2 | 3): WordBoxHint | null {
	const best = solutions[0];
	if (!best) return null;
	const n = best.words.length;
	const same = solutions.filter((s) => s.words.length === n).length;
	const open = best.words[0];
	const last = open[open.length - 1];
	const start = open.slice(0, prefixLen(open.length)).toUpperCase();
	if (n === 1) {
		if (level === 1) return { message: `One long word can use all twelve letters. It has ${open.length} letters.` };
		if (level === 2) return { message: `It starts with "${start}".` };
		return { message: `The word is ${open.toUpperCase()}.` };
	}
	if (level === 1) {
		return {
			message: `The shortest answers use ${n} words (${same === 1 ? 'there is one' : same >= MAX_RESULTS ? 'there are many' : `there are ${same}`}). In the answer listed first, the opening word has ${open.length} letters.`,
		};
	}
	if (level === 2) {
		// A long opening word can show its last letter too; a short one would be given away.
		if (open.length >= 6) {
			return { message: `That opening word starts with "${start}" and ends with ${last.toUpperCase()}. The next word has to start with ${last.toUpperCase()}.` };
		}
		return { message: `That opening word starts with "${start}". The next word has to start with the letter that ends it.` };
	}
	return { message: `The opening word is ${open.toUpperCase()}. Continue from ${last.toUpperCase()} and see what the remaining letters allow.` };
}

/**
 * A solvable box, for trying the tool: two ordinary words that join and cover twelve different letters,
 * then a random legal split of those letters onto four sides. Deterministic for a given rng.
 */
export function makeBox(rng: Rng, entries: Entry[]): { sides: string[]; words: [string, string] } {
	const common = entries.filter((e) => !e.obscure && e.word.length >= 4 && e.word.length <= 9);
	const byFirst = new Map<string, Entry[]>();
	for (const e of common) {
		const arr = byFirst.get(e.word[0]) ?? [];
		arr.push(e);
		byFirst.set(e.word[0], arr);
	}
	for (let attempt = 0; attempt < 4000; attempt++) {
		const a = common[Math.floor(rng() * common.length)];
		const pool = byFirst.get(a.word[a.word.length - 1]);
		if (!pool) continue;
		const b = pool[Math.floor(rng() * pool.length)];
		if (b === a) continue;
		const letters = new Set([...a.word, ...b.word]);
		if (letters.size !== 12) continue;
		const sides = splitSides([...letters], [a.word, b.word], rng);
		if (sides) return { sides, words: [a.word, b.word] };
	}
	throw new Error('could not build a word box from this word list');
}

/** Put twelve letters on four sides, three each, so no two neighbours in either word share a side. */
function splitSides(letters: string[], words: string[], rng: Rng): string[] | null {
	const bad = new Map<string, Set<string>>();
	for (const ch of letters) bad.set(ch, new Set());
	for (const w of words) {
		for (let i = 0; i + 1 < w.length; i++) {
			bad.get(w[i])!.add(w[i + 1]);
			bad.get(w[i + 1])!.add(w[i]);
		}
	}
	const order = shuffle(letters, rng).sort((x, y) => bad.get(y)!.size - bad.get(x)!.size);
	const groups: string[][] = [[], [], [], []];
	const place = (i: number): boolean => {
		if (i === order.length) return true;
		const ch = order[i];
		const tries = shuffle([0, 1, 2, 3], rng);
		for (const g of tries) {
			if (groups[g].length >= 3) continue;
			if (groups[g].some((o) => bad.get(ch)!.has(o))) continue;
			groups[g].push(ch);
			if (place(i + 1)) return true;
			groups[g].pop();
		}
		return false;
	};
	if (!place(0)) return null;
	return groups.map((g) => shuffle(g, rng).join(''));
}
