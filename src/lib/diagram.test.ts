import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sudokuSvg } from './diagram.ts';

test('sudoku diagram is well-formed and escapes text', () => {
	const g = Array<number>(81).fill(0);
	g[0] = 5;
	const svg = sudokuSvg(g, { title: 'A & B', desc: '<x>', candidatesOf: { digit: 7, cells: [10, 20] }, highlight: [10], cross: [20], bandRows: [1] });
	assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
	assert.ok(svg.includes('A &amp; B') && svg.includes('&lt;x&gt;'));
	assert.equal((svg.match(/<circle/g) ?? []).length, 2);
	assert.ok(!svg.includes('—') && !svg.includes('–'));
});
