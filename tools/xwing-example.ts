// Finds a real X-Wing in a generated Sudoku and writes two diagrams for the guide.
// Usage: node tools/xwing-example.ts [--start 1] [--out public/images]
// Prints the facts the guide may quote. Everything here is computed from the solver, not typed by hand.

import { writeFileSync, mkdirSync } from 'node:fs';
import { generateSudoku, boardFrom, nextSudokuStep, applyStep, bit, cellName, type SudokuStep } from '../src/lib/sudoku.ts';
import { sudokuSvg } from '../src/lib/diagram.ts';

const args = process.argv.slice(2);
const opt = (k: string, d: string): string => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const start = Number(opt('--start', '1'));
const out = opt('--out', 'public/images');

for (let s = start; s < start + 400; s++) {
	const p = generateSudoku(s, 'hard');
	const b = boardFrom(p.givens);
	if (!b) continue;
	let step: SudokuStep | null;
	let guard = 0;
	while ((step = nextSudokuStep(b)) && guard++ < 500) {
		if (step.technique === 'x-wing' && step.eliminate) {
			const d = step.eliminate[0].d;
			const cands = b.cand.map((m, i) => (b.grid[i] === 0 && m & bit(d) ? i : -1)).filter((i) => i >= 0);
			const rowsUsed = new Set(step.focus.map((i) => Math.floor(i / 9)));
			const colsUsed = new Set(step.focus.map((i) => i % 9));
			const meta = {
				seed: s,
				digit: d,
				rows: [...rowsUsed].map((r) => r + 1),
				cols: [...colsUsed].map((c) => c + 1),
				corners: step.focus.map(cellName),
				eliminate: step.eliminate.map((e) => cellName(e.i)),
				message: step.message,
				candidateCount: cands.length,
				baseAxis: step.message.startsWith('In rows') ? 'rows' : 'columns',
			};
			mkdirSync(out, { recursive: true });
			const base = `sudoku-x-wing-${s}`;
			const rowsList = [...rowsUsed];
			const colsList = [...colsUsed];
			// Which lines carry the pattern: the two lines that hold exactly the four corners.
			// The message names the base lines first ("In rows 2 and 8..." or "In columns 6 and 7...").
			const baseIsRows = step.message.startsWith('In rows');
			const bandRows = baseIsRows ? rowsList : [];
			const bandCols = baseIsRows ? [] : colsList;
			for (const e of step.eliminate) if (p.solution[e.i] === e.d) throw new Error('X-Wing would remove a true digit');
			writeFileSync(
				`${out}/${base}-1.svg`,
				sudokuSvg(b.grid, {
					title: `Where a ${d} can still go`,
					desc: `A Sudoku board with every square that can still hold a ${d} marked. Four of them, highlighted, form a rectangle.`,
					candidatesOf: { digit: d, cells: cands },
					highlight: step.focus,
					bandRows,
					bandCols,
				}),
			);
			writeFileSync(
				`${out}/${base}-2.svg`,
				sudokuSvg(b.grid, {
					title: `Squares that lose the digit ${d}`,
					desc: `The same board. The X-Wing rectangle is highlighted and the other candidates for ${d} in its two lines are crossed out.`,
					candidatesOf: { digit: d, cells: cands },
					highlight: step.focus,
					cross: step.eliminate.map((e) => e.i),
					bandRows,
					bandCols,
				}),
			);
			console.log(JSON.stringify({ ...meta, files: [`${base}-1.svg`, `${base}-2.svg`], givens: p.givens.join('') }, null, 1));
			process.exit(0);
		}
		applyStep(b, step);
	}
}
console.error('no X-Wing found in 400 seeds');
process.exit(1);
