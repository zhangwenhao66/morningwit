import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, countSolutions, generate, cloneGrid, nextHint, EMPTY } from './binairo.ts';

test('generated puzzles have exactly one solution and match the stored solution', () => {
	for (const [size, seed] of [
		[6, 1],
		[6, 99],
		[8, 7],
		[8, 20260929],
	] as const) {
		const p = generate(size, seed, 'medium');
		assert.equal(countSolutions(cloneGrid(p.givens), 3), 1, `size ${size} seed ${seed}`);
		assert.ok(check(p.solution).solved, 'stored solution is valid');
		for (let r = 0; r < size; r++)
			for (let c = 0; c < size; c++)
				if (p.givens[r][c] !== EMPTY) assert.equal(p.givens[r][c], p.solution[r][c]);
	}
});

test('same seed gives the same puzzle, different seed differs', () => {
	const a = generate(8, 42, 'easy');
	const b = generate(8, 42, 'easy');
	const c = generate(8, 43, 'easy');
	assert.deepEqual(a.givens, b.givens);
	assert.notDeepEqual(a.givens, c.givens);
});

test('difficulty leaves fewer clues', () => {
	const count = (g: number[][]) => g.flat().filter((x) => x !== EMPTY).length;
	const easy = generate(8, 5, 'easy');
	const hard = generate(8, 5, 'hard');
	assert.ok(count(hard.givens) < count(easy.givens));
});

test('check flags three in a row, count overflow and duplicate lines', () => {
	const g = [
		[1, 1, 1, EMPTY],
		[EMPTY, EMPTY, EMPTY, EMPTY],
		[EMPTY, EMPTY, EMPTY, EMPTY],
		[EMPTY, EMPTY, EMPTY, EMPTY],
	];
	const res = check(g);
	assert.ok(res.conflicts.has('0,0') && res.conflicts.has('0,2'));
	assert.equal(res.solved, false);

	const dup = [
		[0, 1, 0, 1],
		[0, 1, 0, 1],
		[1, 0, 1, 0],
		[1, 0, 1, 0],
	];
	const d = check(dup);
	assert.ok(d.conflicts.size > 0 && d.complete && !d.solved);
});

test('hints only name a cell with one legal value and get more specific', () => {
	const p = generate(6, 11, 'medium');
	for (const level of [1, 2, 3] as const) {
		const h = nextHint(p.givens, p.solution, level);
		assert.ok(h);
		assert.equal(h.value, p.solution[h.r][h.c]);
	}
	const h1 = nextHint(p.givens, p.solution, 1)!;
	const h3 = nextHint(p.givens, p.solution, 3)!;
	assert.ok(!/is a (sun|moon)\./.test(h1.message));
	assert.ok(/is a (sun|moon)\./.test(h3.message));
});
