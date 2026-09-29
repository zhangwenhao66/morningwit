import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, cloneGrid } from './binairo.ts';
import { solveBinairoByLogic, nextBinairoStep } from './binairo-logic.ts';

test('every logic step agrees with the stored solution', () => {
	let solved = 0;
	let total = 0;
	for (const size of [6, 8, 10]) {
		for (let s = 1; s <= 12; s++) {
			const p = generate(size, s * 13, 'medium');
			const res = solveBinairoByLogic(p.givens);
			total++;
			if (res.solved) solved++;
			for (const st of res.steps) assert.equal(st.value, p.solution[st.r][st.c], `size ${size} seed ${s}`);
		}
	}
	assert.ok(solved >= total / 3, `solved only ${solved}/${total}`);
});

test('nextBinairoStep is null when the board already breaks a rule', () => {
	const p = generate(6, 3, 'easy');
	const g = cloneGrid(p.givens);
	// force a visible conflict: three in a row
	g[0][0] = 1;
	g[0][1] = 1;
	g[0][2] = 1;
	assert.equal(nextBinairoStep(g), null);
});

import { generateLogical } from './binairo-logic.ts';

test('generateLogical returns boards the solver can finish, deterministically, at every setting', () => {
	for (const [size, diff] of [[6, 'easy'], [8, 'medium'], [8, 'hard'], [10, 'medium']] as const) {
		const p = generateLogical(size, 20260929, diff);
		assert.ok(solveBinairoByLogic(p.givens).solved, `${size} ${diff}`);
		assert.deepEqual(p.givens, generateLogical(size, 20260929, diff).givens);
	}
});
