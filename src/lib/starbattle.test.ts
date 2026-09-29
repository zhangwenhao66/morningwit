import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, countSolutions, emptyMarks, generate, nextHint } from './starbattle.ts';

test('generated puzzles are connected-region, unique-solution boards', () => {
	for (const [size, seed] of [
		[6, 3],
		[7, 12],
		[8, 20260929],
	] as const) {
		const p = generate(size, seed);
		assert.equal(countSolutions(p.regions, 3), 1);
		// every region index 0..size-1 appears
		const seen = new Set(p.regions.flat());
		assert.equal(seen.size, size);
		// stored solution passes check
		const marks = emptyMarks(size);
		p.solution.forEach((c, r) => (marks[r][c] = 1));
		assert.ok(check(p.regions, marks).solved);
	}
});

test('regions are contiguous', () => {
	const p = generate(8, 5);
	for (let g = 0; g < 8; g++) {
		const cells: Array<[number, number]> = [];
		p.regions.forEach((row, r) => row.forEach((v, c) => v === g && cells.push([r, c])));
		const seen = new Set<string>([cells[0].join()]);
		const stack = [cells[0]];
		while (stack.length) {
			const [r, c] = stack.pop()!;
			for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
				const k = `${r + dr},${c + dc}`;
				if (!seen.has(k) && cells.some(([a, b]) => `${a},${b}` === k)) (seen.add(k), stack.push([r + dr, c + dc]));
			}
		}
		assert.equal(seen.size, cells.length, `region ${g} is one piece`);
	}
});

test('same seed same board', () => {
	assert.deepEqual(generate(7, 9).regions, generate(7, 9).regions);
});

test('check flags touching stars and shared lines', () => {
	const p = generate(6, 1);
	const m = emptyMarks(6);
	m[0][0] = 1;
	m[1][1] = 1; // diagonal touch
	const res = check(p.regions, m);
	assert.ok(res.conflicts.has('0,0') && res.conflicts.has('1,1'));
	const m2 = emptyMarks(6);
	m2[0][0] = 1;
	m2[0][4] = 1; // same row
	assert.equal(check(p.regions, m2).conflicts.size, 2);
});

test('hints escalate and stay consistent with the solution', () => {
	const p = generate(8, 77);
	const empty = emptyMarks(8);
	const h3 = nextHint(p, empty, 3);
	assert.ok(h3.cell);
	assert.equal(p.solution[h3.cell[0]], h3.cell[1]);
	assert.ok(!/column/.test(nextHint(p, empty, 1).message));

	const wrong = emptyMarks(8);
	const c = p.solution[0] === 0 ? 5 : 0;
	wrong[0][c] = 1;
	assert.match(nextHint(p, wrong, 1).message, /wrong place/);
});

test('no one-square or board-swallowing regions', () => {
	for (const [size, seed] of [[6, 1], [7, 2], [8, 3], [9, 4], [8, 20260929]] as const) {
		const p = generate(size, seed);
		const sizes = Array<number>(size).fill(0);
		for (const row of p.regions) for (const g of row) sizes[g]++;
		assert.ok(Math.min(...sizes) >= 2, `size ${size}: ${sizes}`);
		assert.ok(Math.max(...sizes) <= size * 3, `size ${size}: ${sizes}`);
	}
});
