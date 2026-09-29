// A human-style solver for Binairo. Every move comes with the reason a person would give.
//
// Techniques (the number is the grade a board needs):
//   1  Simple rules   pair needs a cap, sandwich, and "this line already has its share"
//   2  Only way       list every way the empty squares of one line can be filled without
//                     breaking a rule. If a square gets the same symbol in all of them, it is fixed.
//   3  No twins       same as "only way", but also drop any fill that would make the line an
//                     exact copy of a finished line.

import { EMPTY, check, cloneGrid, symbolName, generate, type Grid, type Difficulty, type BinairoPuzzle } from './binairo.ts';

export type Cell = [number, number];

export interface BinairoStep {
	technique: 'pair' | 'sandwich' | 'share' | 'only-way' | 'no-twins';
	grade: 1 | 2 | 3;
	r: number;
	c: number;
	value: number;
	message: string;
	/** Reasoning without the answer, for the second nudge. */
	idea: string;
	focus: Cell[];
}

export interface BinairoLogicResult {
	steps: BinairoStep[];
	solved: boolean;
	grade: number;
	grid: Grid;
}

const rowWord = (r: number): string => `row ${r + 1}`;
const colWord = (c: number): string => `column ${c + 1}`;
const cap = (s: string): string => s[0].toUpperCase() + s.slice(1);

function lineCells(n: number, axis: 'row' | 'col', i: number): Cell[] {
	return Array.from({ length: n }, (_, k): Cell => (axis === 'row' ? [i, k] : [k, i]));
}
function lineValues(g: Grid, axis: 'row' | 'col', i: number): number[] {
	return axis === 'row' ? g[i].slice() : g.map((r) => r[i]);
}
function lineName(axis: 'row' | 'col', i: number): string {
	return axis === 'row' ? rowWord(i) : colWord(i);
}

function simpleStep(g: Grid): BinairoStep | null {
	const n = g.length;
	const half = n / 2;
	for (const axis of ['row', 'col'] as const) {
		for (let i = 0; i < n; i++) {
			const cells = lineCells(n, axis, i);
			const v = lineValues(g, axis, i);
			const name = lineName(axis, i);
			// pair needs a cap
			for (let k = 0; k + 1 < n; k++) {
				if (v[k] !== EMPTY && v[k] === v[k + 1]) {
					const opp = 1 - v[k];
					for (const j of [k - 1, k + 2]) {
						if (j >= 0 && j < n && v[j] === EMPTY) {
							const [r, c] = cells[j];
							return {
								technique: 'pair',
								grade: 1,
								r,
								c,
								value: opp,
								focus: [cells[k], cells[k + 1], cells[j]],
								message: `Two ${symbolName(v[k])}s sit side by side in ${name}. A third would make three in a row, so the square next to them (row ${r + 1}, column ${c + 1}) is a ${symbolName(opp)}.`,
								idea: `Two ${symbolName(v[k])}s sit side by side in ${name}. Think about what may go on either end of the pair.`,
							};
						}
					}
				}
			}
			// sandwich
			for (let k = 0; k + 2 < n; k++) {
				if (v[k] !== EMPTY && v[k] === v[k + 2] && v[k + 1] === EMPTY) {
					const [r, c] = cells[k + 1];
					const opp = 1 - v[k];
					return {
						technique: 'sandwich',
						grade: 1,
						r,
						c,
						value: opp,
						focus: [cells[k], cells[k + 1], cells[k + 2]],
						message: `A ${symbolName(v[k])}, an empty square, then another ${symbolName(v[k])} in ${name}. Putting a ${symbolName(v[k])} in the middle would make three in a row, so row ${r + 1}, column ${c + 1} is a ${symbolName(opp)}.`,
						idea: `Look at the empty square between two ${symbolName(v[k])}s in ${name}. What would happen if it matched them?`,
					};
				}
			}
			// share
			for (const sym of [0, 1]) {
				if (v.filter((x) => x === sym).length === half) {
					const k = v.findIndex((x) => x === EMPTY);
					if (k !== -1) {
						const [r, c] = cells[k];
						return {
							technique: 'share',
							grade: 1,
							r,
							c,
							value: 1 - sym,
							focus: cells,
							message: `${cap(name)} already has all ${half} of its ${symbolName(sym)}s, so every empty square left in it is a ${symbolName(1 - sym)}. That includes row ${r + 1}, column ${c + 1}.`,
							idea: `${cap(name)} already holds its full share of ${symbolName(sym)}s. Count them.`,
						};
					}
				}
			}
		}
	}
	return null;
}

/** All ways to fill the empty squares of one line so that no three match and each symbol appears n/2 times. */
function completions(v: number[]): number[][] {
	const n = v.length;
	const half = n / 2;
	const out: number[][] = [];
	const cur = v.slice();
	const walk = (i: number, zeros: number, ones: number): void => {
		if (zeros > half || ones > half) return;
		if (i === n) {
			out.push(cur.slice());
			return;
		}
		const options = v[i] === EMPTY ? [0, 1] : [v[i]];
		for (const s of options) {
			if (i >= 2 && cur[i - 1] === s && cur[i - 2] === s) continue;
			cur[i] = s;
			walk(i + 1, zeros + (s === 0 ? 1 : 0), ones + (s === 1 ? 1 : 0));
		}
		cur[i] = v[i];
	};
	walk(0, 0, 0);
	return out;
}

function forcedStep(g: Grid, allowTwins: boolean): BinairoStep | null {
	const n = g.length;
	for (const axis of ['row', 'col'] as const) {
		// finished lines, for the "no twins" filter
		const finished: Array<{ i: number; v: number[] }> = [];
		for (let i = 0; i < n; i++) {
			const v = lineValues(g, axis, i);
			if (!v.includes(EMPTY)) finished.push({ i, v });
		}
		for (let i = 0; i < n; i++) {
			const v = lineValues(g, axis, i);
			const empties = v.filter((x) => x === EMPTY).length;
			if (empties === 0) continue;
			let opts = completions(v);
			let twin: { i: number } | null = null;
			if (allowTwins) {
				const before = opts.length;
				const keep = opts.filter((o) => !finished.some((f) => f.i !== i && f.v.every((x, k) => x === o[k])));
				if (keep.length < before) {
					const dropped = opts.find((o) => finished.some((f) => f.i !== i && f.v.every((x, k) => x === o[k])));
					const match = finished.find((f) => dropped && f.v.every((x, k) => x === dropped[k]));
					twin = match ? { i: match.i } : null;
				}
				opts = keep;
			}
			if (opts.length === 0) continue;
			for (let k = 0; k < n; k++) {
				if (v[k] !== EMPTY) continue;
				const s = opts[0][k];
				if (opts.every((o) => o[k] === s)) {
					const [r, c] = lineCells(n, axis, i)[k];
					const name = lineName(axis, i);
					// Only report a "no twins" step when the plain rules were not enough for this square.
					if (allowTwins) {
						const plain = completions(v);
						if (plain.every((o) => o[k] === s)) continue;
						return {
							technique: 'no-twins',
							grade: 3,
							r,
							c,
							value: s,
							focus: lineCells(n, axis, i).concat(twin ? lineCells(n, axis, twin.i) : []),
							message: `${cap(name)} cannot end up identical to ${lineName(axis, twin?.i ?? 0)}, which is already finished. Ruling that out leaves one way to fill ${name}, and row ${r + 1}, column ${c + 1} becomes a ${symbolName(s)}.`,
							idea: `${cap(name)} is close to a copy of ${lineName(axis, twin?.i ?? 0)}. Two lines may never match exactly.`,
						};
					}
					return {
						technique: 'only-way',
						grade: 2,
						r,
						c,
						value: s,
						focus: lineCells(n, axis, i),
						message: `Try filling in what is left of ${name}. Only one arrangement keeps three-in-a-row and the counts in check, and it puts a ${symbolName(s)} at row ${r + 1}, column ${c + 1}.`,
						idea: `Look at all the empty squares left in ${name} together. Only one arrangement of them keeps every rule.`,
					};
				}
			}
		}
	}
	return null;
}

function nextStep(g: Grid, maxGrade: number): BinairoStep | null {
	return simpleStep(g) ?? (maxGrade >= 2 ? forcedStep(g, false) : null) ?? (maxGrade >= 3 ? forcedStep(g, true) : null);
}

export function solveBinairoByLogic(givens: Grid, maxGrade = 3): BinairoLogicResult {
	const g = cloneGrid(givens);
	const steps: BinairoStep[] = [];
	let guard = 0;
	while (guard++ < 400) {
		const s = nextStep(g, maxGrade);
		if (!s) break;
		steps.push(s);
		g[s.r][s.c] = s.value;
	}
	const done = check(g).solved;
	return { steps, solved: done, grade: steps.reduce((m, s) => Math.max(m, s.grade), 0), grid: g };
}

/** The next deduction from the board the player has now, or null if the board already breaks a rule. */
export function nextBinairoStep(current: Grid, maxGrade = 3): BinairoStep | null {
	if (check(current).conflicts.size > 0) return null;
	return nextStep(current, maxGrade);
}

/**
 * Same as `generate`, but keeps trying seeds derived from `seed` until the board can be finished
 * with the techniques above, so nobody has to guess. Deterministic for a given seed.
 */
export function generateLogical(size: number, seed: number, difficulty: Difficulty = 'medium'): BinairoPuzzle {
	for (let k = 0; k < 400; k++) {
		const p = generate(size, (seed + k * 104729) >>> 0, difficulty);
		if (solveBinairoByLogic(p.givens).solved) return p;
	}
	throw new Error(`no logic-solvable Binairo found for size ${size} seed ${seed}`);
}
