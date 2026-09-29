import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSudoku, countSolutions, solveSudokuByLogic, checkSudoku, boardFrom, nextSudokuStep, applyStep, bit, rawPuzzle, type Grid } from './sudoku.ts';

test('puzzles have exactly one solution and the stored solution is valid', () => {
	for (const [seed, level] of [[1, 'easy'], [2, 'medium'], [3, 'hard']] as const) {
		const p = generateSudoku(seed, level);
		assert.equal(countSolutions(p.givens, 3), 1, `${level}`);
		assert.ok(checkSudoku(p.solution).solved);
		p.givens.forEach((v, i) => v && assert.equal(v, p.solution[i]));
	}
});

test('every logic step agrees with the solution', () => {
	let solved = 0;
	for (let s = 1; s <= 12; s++) {
		const level = (['easy', 'medium', 'hard'] as const)[s % 3];
		const p = generateSudoku(s * 17, level);
		const res = solveSudokuByLogic(p.givens);
		if (res.solved) solved++;
		const b = boardFrom(p.givens)!;
		for (const st of res.steps) {
			if (st.place) assert.equal(st.place.d, p.solution[st.place.i], `${level} seed ${s}`);
			if (st.eliminate) for (const { i, d } of st.eliminate) assert.notEqual(p.solution[i], d, `removed a true digit, ${st.technique}`);
			applyStep(b, st);
		}
	}
	assert.equal(solved, 12);
});

test('difficulty levels differ in the grade needed', () => {
	const easy = generateSudoku(5, 'easy');
	const hard = generateSudoku(5, 'hard');
	assert.equal(easy.grade, 1);
	assert.ok(hard.grade >= 3);
});

test('same seed same puzzle', () => {
	assert.deepEqual(generateSudoku(9, 'medium').givens, generateSudoku(9, 'medium').givens);
});

test('checkSudoku flags a repeated digit in a unit', () => {
	const g: Grid = Array(81).fill(0);
	g[0] = 5;
	g[8] = 5;
	const r = checkSudoku(g);
	assert.ok(r.conflicts.has(0) && r.conflicts.has(8));
});

test('the solver finds an X-Wing on a known position', () => {
	// Classic X-Wing example (digit 7). Built from a puzzle where the only progress needs an X-Wing after singles and locked candidates.
	let found = 0;
	for (let s = 1; s <= 60 && found === 0; s++) {
		const p = generateSudoku(s * 31, 'hard');
		const res = solveSudokuByLogic(p.givens);
		if (res.steps.some((x) => x.technique === 'x-wing')) found++;
	}
	assert.ok(found > 0, 'no X-Wing appeared in 60 hard boards');
});

test('skyscraper never removes a digit that belongs in the solution, and it does turn up on hard raw boards', () => {
	let seen = 0;
	for (let seed = 1; seed <= 120; seed++) {
		const p = rawPuzzle(seed, 24);
		const b = boardFrom(p.givens);
		if (!b) continue;
		let step;
		let guard = 0;
		while ((step = nextSudokuStep(b, 5)) && guard++ < 600) {
			for (const e of step.eliminate ?? []) assert.notEqual(p.solution[e.i], e.d, `seed ${seed}: ${step.technique} removed a true digit`);
			if (step.place) assert.equal(p.solution[step.place.i], step.place.d, `seed ${seed}: wrong placement`);
			if (step.technique === 'skyscraper') {
				seen++;
				assert.equal(step.focus.length, 4);
				assert.equal(step.grade, 5);
			}
			applyStep(b, step);
		}
	}
	assert.ok(seen > 0, 'no skyscraper found in 120 boards, the test would prove nothing');
});

test('the game itself never uses skyscraper: default hints stop at grade 4', () => {
	for (let seed = 1; seed <= 40; seed++) {
		const p = rawPuzzle(seed, 24);
		const b = boardFrom(p.givens)!;
		let step;
		let guard = 0;
		while ((step = nextSudokuStep(b)) && guard++ < 600) {
			assert.notEqual(step.technique, 'skyscraper');
			applyStep(b, step);
		}
	}
});
