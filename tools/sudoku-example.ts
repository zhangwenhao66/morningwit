// Worked examples and frequency numbers for Sudoku technique guides, computed from the solver.
// Usage:
//   node tools/sudoku-example.ts --tech hidden-pair [--level hard] [--start 1] [--size 3] [--write] [--out public/images]
//   node tools/sudoku-example.ts --stats 200 [--level hard] [--from 1000]
//   node tools/sudoku-example.ts --tech skyscraper --raw 24 [--start 1] [--write]     (boards the game would never serve)
//   node tools/sudoku-example.ts --stats 300 --raw 24 [--from 1000]                   (how often each grade is enough)
// --raw N uses random one-solution boards with about N givens instead of the game's boards. Skyscraper (grade 5) is
// never used by the game, so its examples and numbers only make sense on raw boards the four-grade solver gets stuck on.
// Techniques: naked-single hidden-single pointing claiming naked-subset hidden-pair x-wing.
// For naked-subset, --size 2 or 3 picks pairs or triples (the number of squares in the group).
// Without --write it prints the facts a guide may quote. With --write it also draws two boards, before and after
// the step, with the pencil marks of the squares involved (removed candidates struck through in red).

import { writeFileSync, mkdirSync } from 'node:fs';
import { generateSudoku, rawPuzzle, boardFrom, nextSudokuStep, applyStep, digitsOf, cellName, solveSudokuByLogic, type Level, type SudokuStep } from '../src/lib/sudoku.ts';
import { sudokuSvg } from '../src/lib/diagram.ts';

const args = process.argv.slice(2);
const opt = (k: string, d: string): string => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const level = opt('--level', 'hard') as Level;
const tech = opt('--tech', '');
const start = Number(opt('--start', '1'));
const size = Number(opt('--size', '0'));
const out = opt('--out', 'public/images');
const write = args.includes('--write');
const stats = Number(opt('--stats', '0'));
const from = Number(opt('--from', '1000'));
const raw = Number(opt('--raw', '0'));
const maxGrade = Number(opt('--max-grade', tech === 'skyscraper' ? '5' : '4'));
const boardFor = (sd: number): { givens: number[] } => (raw ? rawPuzzle(sd, raw) : generateSudoku(sd, level));

const keyOf = (s: SudokuStep): string => (s.technique === 'naked-subset' || s.technique === 'hidden-pair' ? `${s.technique}:${s.focus.length}` : s.technique);

if (stats > 0) {
	const count: Record<string, number> = {};
	let solved = 0;
	let byGrade4 = 0;
	let onlyWithSkyscraper = 0;
	for (let sd = from; sd < from + stats; sd++) {
		const givens = boardFor(sd).givens;
		const r = solveSudokuByLogic(givens, raw ? 5 : maxGrade);
		if (r.solved) solved++;
		if (raw) {
			const r4 = solveSudokuByLogic(givens, 4);
			if (r4.solved) byGrade4++;
			else if (r.solved) onlyWithSkyscraper++;
		}
		new Set(r.steps.map(keyOf)).forEach((k) => (count[k] = (count[k] ?? 0) + 1));
	}
	const extra = raw ? { rawClues: raw, solvedWithinGrade4: byGrade4, needSkyscraperToFinish: onlyWithSkyscraper, notSolvedEvenWithSkyscraper: stats - solved } : { level };
	console.log(JSON.stringify({ ...extra, boards: stats, from, solved, boardsUsingTechnique: count }, null, 1));
	process.exit(0);
}

if (!tech) {
	console.error('give --tech <technique> or --stats N');
	process.exit(2);
}

for (let sd = start; sd < start + 600; sd++) {
	const p = boardFor(sd);
	const b = boardFrom(p.givens);
	if (!b) continue;
	let step: SudokuStep | null;
	let guard = 0;
	while ((step = nextSudokuStep(b, maxGrade)) && guard++ < 500) {
		if (step.technique === tech && (size === 0 || step.focus.length === size) && (step.eliminate?.length ?? 0) > 0) {
			const cells = [...new Set([...step.focus, ...(step.eliminate ?? []).map((e) => e.i)])];
			const pencilBefore = cells.map((i) => ({ cell: i, digits: digitsOf(b.cand[i]) }));
			const removedBy = new Map<number, number[]>();
			for (const e of step.eliminate ?? []) removedBy.set(e.i, [...(removedBy.get(e.i) ?? []), e.d]);
			const pencilAfter = cells.map((i) => ({ cell: i, digits: digitsOf(b.cand[i]), removed: removedBy.get(i) ?? [] }));
			const facts = {
				seed: sd,
				source: raw ? `raw board, about ${raw} givens` : `game ${level} board`,
				technique: tech,
				group: step.focus.map(cellName),
				eliminated: (step.eliminate ?? []).map((e) => `${cellName(e.i)} loses ${e.d}`),
				message: step.message,
			};
			console.log(JSON.stringify(facts, null, 1));
			if (write) {
				mkdirSync(out, { recursive: true });
				const base = `${out}/sudoku-${tech}${size ? size : ''}-${sd}`;
				const grid = b.grid.slice();
				writeFileSync(`${base}-1.svg`, sudokuSvg(grid, { pencil: pencilBefore, highlight: step.focus, title: `Sudoku before ${tech} step`, desc: step.idea }));
				writeFileSync(`${base}-2.svg`, sudokuSvg(grid, { pencil: pencilAfter, highlight: step.focus, title: `Sudoku after ${tech} step`, desc: step.message }));
				console.log('wrote', `${base}-1.svg`, `${base}-2.svg`);
			}
			process.exit(0);
		}
		applyStep(b, step);
	}
}
console.log(`no ${tech}${size ? ' of size ' + size : ''} found in 600 ${raw ? 'raw ' + raw + '-clue' : level} boards from seed ${start}`);
process.exit(1);
