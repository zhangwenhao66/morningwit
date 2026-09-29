import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sudokuSvg, starBattleSvg, binairoSvg } from './diagram.ts';
import { generateLogical as starPuzzle } from './starbattle-logic.ts';
import { generateLogical as binPuzzle } from './binairo-logic.ts';

test('sudoku diagram is well-formed and escapes text', () => {
	const g = Array<number>(81).fill(0);
	g[0] = 5;
	const svg = sudokuSvg(g, { title: 'A & B', desc: '<x>', candidatesOf: { digit: 7, cells: [10, 20] }, highlight: [10], cross: [20], bandRows: [1] });
	assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
	assert.ok(svg.includes('A &amp; B') && svg.includes('&lt;x&gt;'));
	assert.equal((svg.match(/<circle/g) ?? []).length, 2);
	assert.ok(!svg.includes('—') && !svg.includes('–'));
});

test('star battle diagram letters every region, draws stars and crosses, and has no dashes', () => {
	const p = starPuzzle(6, 3);
	const svg = starBattleSvg(p, { title: 'Board & stars', desc: 'x', stars: [[0, p.solution[0]]], crossed: [[1, 0]], highlight: [[2, 2]] });
	assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
	assert.equal((svg.match(/<polygon/g) ?? []).length, 1);
	for (let i = 0; i < 6; i++) assert.ok(svg.includes(`>${String.fromCharCode(65 + i)}</text>`), `region ${i} lettered`);
	assert.ok(svg.includes('Board &amp; stars'));
	assert.ok(!svg.includes('—') && !svg.includes('–'));
});

test('binairo diagram uses different shapes for the two symbols', () => {
	const p = binPuzzle(6, 5);
	const svg = binairoSvg(p.solution, { title: 't', desc: 'd', fixed: [[0, 0]], highlight: [[1, 1]] });
	const suns = p.solution.flat().filter((v) => v === 1).length;
	const moons = p.solution.flat().filter((v) => v === 0).length;
	assert.equal((svg.match(/<circle/g) ?? []).length, suns);
	assert.equal((svg.match(/A[\d.]+ [\d.]+ 0 1 0/g) ?? []).length, moons);
	assert.ok(!svg.includes('—') && !svg.includes('–'));
});

test('sudoku pencil marks draw each digit and strike the removed ones', () => {
	const g = Array<number>(81).fill(0);
	const svg = sudokuSvg(g, { title: 't', desc: 'd', pencil: [{ cell: 10, digits: [2, 5, 7], removed: [5] }, { cell: 11, digits: [1] }] });
	assert.equal((svg.match(/>[1-9]<\/text>/g) ?? []).length, 4);
	assert.equal((svg.match(/stroke="#b23a2b" stroke-width="1.6"/g) ?? []).length, 1);
	assert.ok(!svg.includes('—') && !svg.includes('–'));
});
