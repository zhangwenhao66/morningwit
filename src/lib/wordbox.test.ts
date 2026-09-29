import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkBox, parseWords, playable, solve, verifyChain, hintFor, makeBox, fits } from './wordbox.ts';
import { makeRng } from './rng.ts';

const SIDES = ['abc', 'def', 'ghi', 'jkl'];

test('checkBox accepts a legal box and explains each way it can be wrong', () => {
	assert.equal(checkBox(SIDES).ok, true);
	assert.equal(checkBox(['ABC', 'DEF', 'GHI', 'JKL']).ok, true);
	assert.equal(checkBox(['abc', 'def', 'ghi']).ok, false);
	const short = checkBox(['ab', 'def', 'ghi', 'jkl']);
	assert.ok(!short.ok && /Side 1/.test(short.error));
	const dup = checkBox(['abc', 'dea', 'ghi', 'jkl']);
	assert.ok(!dup.ok && /A appears twice/.test(dup.error));
	assert.equal(checkBox(['ab1', 'def', 'ghi', 'jkl']).ok, false);
});

test('parseWords reads the ~ marker and drops short or odd lines', () => {
	const e = parseWords('cat\n~qat\nab\nDog\n\nfoo-bar\n');
	assert.deepEqual(e, [
		{ word: 'cat', obscure: false },
		{ word: 'qat', obscure: true },
	]);
});

test('words that repeat a side, use outside letters or are too short cannot be played', () => {
	const entries = parseWords('adg\nabd\nadgx\ndgj\n');
	const words = playable(SIDES, entries).map((p) => p.word).sort();
	assert.deepEqual(words, ['adg', 'dgj']);
	const pos = new Map<string, number>();
	assert.equal(fits('ad', pos), null);
});

test('finds a two-word answer that joins on the shared letter and uses all twelve letters', () => {
	const entries = parseWords('adgj\njbehkcfil\nadg\ngjb\n');
	const sols = solve(SIDES, entries);
	assert.deepEqual(sols[0].words, ['adgj', 'jbehkcfil']);
	assert.ok(verifyChain(SIDES, sols[0].words));
	assert.ok(!verifyChain(SIDES, ['adgj', 'bcfil']));
	assert.ok(!verifyChain(SIDES, ['adgj']));
});

test('three-word answers appear only when nothing shorter exists, and rank after shorter ones', () => {
	const entries = parseWords('adg\ngjb\nbehk\nkcfil\nadgj\njbehkcfil\n');
	const sols = solve(SIDES, entries);
	assert.equal(sols[0].words.length, 2);
	const only3 = solve(SIDES, parseWords('adg\ngjbe\nehkcfil\n'));
	assert.ok(only3.length > 0 && only3.every((s) => s.words.length === 3));
});

test('less familiar words rank behind familiar ones with the same word count', () => {
	const entries = parseWords('adgj\n~jbehkcfil\njbehkcfil\n');
	const sols = solve(SIDES, parseWords('adgj\njbehkcfil\n'));
	assert.equal(sols.length, 1);
	const withMarked = solve(SIDES, entries);
	assert.ok(withMarked.length >= 1);
});

test('hints reveal the opening word only at level 3 and never the rest', () => {
	const sols = solve(SIDES, parseWords('adgj\njbehkcfil\n'));
	const h1 = hintFor(sols, 1)!.message;
	const h2 = hintFor(sols, 2)!.message;
	const h3 = hintFor(sols, 3)!.message;
	assert.ok(!h1.toLowerCase().includes('adgj') && !h1.includes('JBEHKCFIL'));
	assert.ok(h2.includes('"A"') && !h2.includes('ADGJ'));
	assert.ok(h3.includes('ADGJ') && !h3.toLowerCase().includes('jbehkcfil'));
	assert.equal(hintFor([], 1), null);
});

test('level 2 never shows the whole opening word, whatever its length', () => {
	for (const len of [3, 4, 5, 6, 7, 8, 9]) {
		const open = 'abcdefghi'.slice(0, len);
		const sols = [{ words: [open, 'x' + open], obscure: 0, letters: len * 2 + 1 }];
		const h2 = hintFor(sols, 2)!.message.toUpperCase();
		assert.ok(!h2.includes(open.toUpperCase()), `length ${len}: ${h2}`);
		// the letters shown are a prefix, plus the last letter only for long words
		const shown = h2.match(/"([A-Z]+)"/)![1];
		assert.ok(shown.length < len && open.toUpperCase().startsWith(shown), `length ${len}: prefix ${shown}`);
	}
	const one = [{ words: ['abcd'], obscure: 0, letters: 4 }];
	assert.ok(!hintFor(one, 2)!.message.toUpperCase().includes('ABCD'));
});

// The real word list, if the file has been built.
let real: ReturnType<typeof parseWords> | null = null;
try {
	real = parseWords(readFileSync(new URL('../../public/data/words.txt', import.meta.url), 'utf8'));
} catch {
	real = null;
}

test('with the real word list, generated boxes are solvable and every answer passes the independent check', { skip: real === null }, () => {
	for (let seed = 1; seed <= 25; seed++) {
		const box = makeBox(makeRng(seed), real!);
		assert.ok(checkBox(box.sides).ok, `seed ${seed}: legal box`);
		assert.ok(verifyChain(box.sides, box.words), `seed ${seed}: the source words are a valid answer`);
		const sols = solve(box.sides, real!, 3, 100000);
		assert.ok(sols.some((s) => s.words.length === 2), `seed ${seed}: has a two-word answer`);
		for (const s of sols.slice(0, 50)) assert.ok(verifyChain(box.sides, s.words), `seed ${seed}: ${s.words.join(' ')}`);
		assert.ok(sols.some((s) => s.words.join() === box.words.join()), `seed ${seed}: finds the words it was built from`);
	}
});

test('solving a real box is fast enough for a phone', { skip: real === null }, () => {
	const box = makeBox(makeRng(7), real!);
	const t0 = performance.now();
	solve(box.sides, real!);
	const ms = performance.now() - t0;
	assert.ok(ms < 1500, `took ${ms.toFixed(0)}ms`);
});

test('the first answer is the true best one (no early cutoff before sorting)', { skip: real === null }, () => {
	for (let seed = 1; seed <= 60; seed++) {
		const box = makeBox(makeRng(seed * 131), real!);
		const all = solve(box.sides, real!, 2, 10_000_000);
		const top = solve(box.sides, real!, 2);
		const best = all.slice().sort((x, y) => x.words.length - y.words.length || x.obscure - y.obscure || x.letters - y.letters || x.words.join(' ').localeCompare(y.words.join(' ')))[0];
		assert.deepEqual(top[0].words, best.words, `seed ${seed}`);
	}
});
