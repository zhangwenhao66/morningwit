import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from './starbattle.ts';
import { solveByLogic, nextLogicStep } from './starbattle-logic.ts';

test('every logic step is consistent with the true solution', () => {
	let solvedCount = 0;
	const total = 24;
	for (let s = 1; s <= total; s++) {
		const size = 6 + (s % 4);
		const p = generate(size, s * 37);
		const res = solveByLogic(p);
		for (const step of res.steps) {
			if (step.place) assert.equal(p.solution[step.place[0]], step.place[1], `bad star, size ${size} seed ${s}`);
			if (step.cross) for (const [r, c] of step.cross) assert.notEqual(p.solution[r], c, `crossed out a true star, size ${size} seed ${s}`);
		}
		if (res.solved) solvedCount++;
	}
	// The solver is allowed to fail on some boards, but a solver that solves almost nothing is broken.
	assert.ok(solvedCount >= total / 3, `solved only ${solvedCount}/${total}`);
});

test('nextLogicStep continues from the players stars and never contradicts the solution', () => {
	const p = generate(7, 4242);
	const step = nextLogicStep(p, []);
	assert.ok(step);
	if (step.place) assert.equal(p.solution[step.place[0]], step.place[1]);
	// a placed correct star still gives a valid next step or null, never a wrong star
	const one: [number, number][] = [[0, p.solution[0]]];
	const next = nextLogicStep(p, one);
	if (next?.place) assert.equal(p.solution[next.place[0]], next.place[1]);
});

test('two stars that rule each other out give no step', () => {
	const p = generate(6, 1);
	assert.equal(nextLogicStep(p, [[0, 0], [1, 1]]), null);
});

import { generateLogical } from './starbattle-logic.ts';

test('generateLogical only returns boards the solver can finish, deterministically', () => {
	for (const [size, seed] of [[6, 1], [7, 2], [8, 20260929], [9, 5]] as const) {
		const p = generateLogical(size, seed);
		const res = solveByLogic(p);
		assert.ok(res.solved, `size ${size}`);
		assert.deepEqual(p.regions, generateLogical(size, seed).regions);
	}
});

test('a correct dot moves the hint on, a wrong dot is ignored', () => {
	const p = generateLogical(7, 31);
	const first = nextLogicStep(p, []);
	assert.ok(first);
	if (first.kind === 'cross-out' && first.cross) {
		const again = nextLogicStep(p, [], 3, first.cross);
		assert.notDeepEqual(again?.cross, first.cross);
	}
	// dotting a true star square must not change the hint
	const wrongDot: [number, number] = [0, p.solution[0]];
	assert.deepEqual(nextLogicStep(p, [], 3, [wrongDot])?.message, first.message);
});
