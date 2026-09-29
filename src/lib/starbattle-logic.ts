// A human-style solver for one-star Star Battle.
// It works the way a person does: place a star, cross out what it rules out, then look for
// a pattern. Every step is recorded with a plain-language reason, so the same steps power
// the in-game hints, the difficulty grade and the worked examples in the guides.
//
// Techniques, easiest first (the number is the grade a board needs):
//   1  Last spot     A region, row or column has one square left, so the star goes there.
//   2  Confined      All of a region's squares sit in one row or column (or the reverse):
//                    the rest of that row, column or region is crossed out.
//   3  Group         n regions fit inside n rows or columns (or the reverse): everything
//                    else in those lines is crossed out. Tried for n = 2 and 3.

import type { StarPuzzle } from './starbattle.ts';
import { regionLetter, generate } from './starbattle.ts';

export type Cell = [number, number];

export interface LogicStep {
	technique: 'last-spot' | 'confined' | 'group';
	grade: 1 | 2 | 3;
	kind: 'place' | 'cross-out';
	message: string;
	/** The reasoning without the answer square, for the second nudge. Same as `message` when nothing is given away. */
	idea?: string;
	/** Squares to highlight when the step is shown. */
	focus: Cell[];
	/** Squares that get a star (kind = place). */
	place?: Cell;
	/** Squares crossed out (kind = cross-out). */
	cross?: Cell[];
	region?: number;
}

export interface LogicResult {
	steps: LogicStep[];
	solved: boolean;
	/** Hardest technique that was needed, 0 if nothing could be done. */
	grade: number;
	stars: Cell[];
}

const key = (r: number, c: number): string => `${r},${c}`;

interface Board {
	n: number;
	regions: number[][];
	/** cand[r][c] is true while a star could still go there. */
	cand: boolean[][];
	stars: Cell[];
}

function newBoard(p: StarPuzzle): Board {
	const n = p.size;
	return { n, regions: p.regions, cand: Array.from({ length: n }, () => Array<boolean>(n).fill(true)), stars: [] };
}

const rowName = (r: number): string => `row ${r + 1}`;
const colName = (c: number): string => `column ${c + 1}`;
const plural = (k: number, word: string): string => `${k} ${word}${k === 1 ? '' : 's'}`;

function cellsOfRegion(b: Board, g: number): Cell[] {
	const out: Cell[] = [];
	for (let r = 0; r < b.n; r++) for (let c = 0; c < b.n; c++) if (b.regions[r][c] === g) out.push([r, c]);
	return out;
}

function open(b: Board, cells: Cell[]): Cell[] {
	return cells.filter(([r, c]) => b.cand[r][c]);
}

function starRows(b: Board): Set<number> {
	return new Set(b.stars.map((s) => s[0]));
}
function starCols(b: Board): Set<number> {
	return new Set(b.stars.map((s) => s[1]));
}
function starRegions(b: Board): Set<number> {
	return new Set(b.stars.map((s) => b.regions[s[0]][s[1]]));
}

/** Put a star down and cross out everything it rules out. Returns the squares newly crossed out. */
function placeStar(b: Board, r: number, c: number): Cell[] {
	b.stars.push([r, c]);
	const g = b.regions[r][c];
	const gone: Cell[] = [];
	for (let i = 0; i < b.n; i++)
		for (let j = 0; j < b.n; j++) {
			if (!b.cand[i][j]) continue;
			const rules = i === r || j === c || b.regions[i][j] === g || (Math.abs(i - r) <= 1 && Math.abs(j - c) <= 1);
			if (rules) {
				b.cand[i][j] = false;
				if (!(i === r && j === c)) gone.push([i, j]);
			}
		}
	b.cand[r][c] = false;
	return gone;
}

function cross(b: Board, cells: Cell[]): Cell[] {
	const gone: Cell[] = [];
	for (const [r, c] of cells)
		if (b.cand[r][c]) {
			b.cand[r][c] = false;
			gone.push([r, c]);
		}
	return gone;
}

function subsets<T>(items: T[], k: number): T[][] {
	const out: T[][] = [];
	const walk = (start: number, cur: T[]): void => {
		if (cur.length === k) {
			out.push(cur.slice());
			return;
		}
		for (let i = start; i < items.length; i++) {
			cur.push(items[i]);
			walk(i + 1, cur);
			cur.pop();
		}
	};
	walk(0, []);
	return out;
}

/** Cross-out steps: the idea is the observation, the message adds the conclusion. */
function withIdea(step: LogicStep | null): LogicStep | null {
	if (step && step.idea === undefined) {
		// The observation is everything before the first ", so" or the first full stop; the conclusion stays for the last nudge.
		const cut = step.message.search(/, so |\. /);
		step.idea = cut > 0 ? `${step.message.slice(0, cut)}.` : step.message;
	}
	return step;
}

function stepLastSpot(b: Board): LogicStep | null {
	const rows = starRows(b);
	const cols = starCols(b);
	const regs = starRegions(b);
	for (let g = 0; g < b.n; g++) {
		if (regs.has(g)) continue;
		const cs = open(b, cellsOfRegion(b, g));
		if (cs.length === 1) {
			const [r, c] = cs[0];
			return {
				technique: 'last-spot',
				grade: 1,
				kind: 'place',
				region: g,
				place: [r, c],
				focus: cellsOfRegion(b, g),
				message: `Region ${regionLetter(g)} has only one square left where a star can go: row ${r + 1}, column ${c + 1}.`,
				idea: `Region ${regionLetter(g)} has only one open square left. Everything else in it is ruled out.`,
			};
		}
	}
	for (let r = 0; r < b.n; r++) {
		if (rows.has(r)) continue;
		const cs = open(b, Array.from({ length: b.n }, (_, c): Cell => [r, c]));
		if (cs.length === 1) {
			const [, c] = cs[0];
			return {
				technique: 'last-spot',
				grade: 1,
				kind: 'place',
				place: [r, c],
				focus: Array.from({ length: b.n }, (_, k): Cell => [r, k]),
				message: `${cap(rowName(r))} has only one square left where a star can go: column ${c + 1}.`,
				idea: `${cap(rowName(r))} has only one open square left. Everything else in it is ruled out.`,
			};
		}
	}
	for (let c = 0; c < b.n; c++) {
		if (cols.has(c)) continue;
		const cs = open(b, Array.from({ length: b.n }, (_, r): Cell => [r, c]));
		if (cs.length === 1) {
			const [r] = cs[0];
			return {
				technique: 'last-spot',
				grade: 1,
				kind: 'place',
				place: [r, c],
				focus: Array.from({ length: b.n }, (_, k): Cell => [k, c]),
				message: `${cap(colName(c))} has only one square left where a star can go: row ${r + 1}.`,
				idea: `${cap(colName(c))} has only one open square left. Everything else in it is ruled out.`,
			};
		}
	}
	return null;
}

function cap(s: string): string {
	return s[0].toUpperCase() + s.slice(1);
}

/** Region sits entirely in one line, or a line sits entirely in one region. */
function stepConfined(b: Board): LogicStep | null {
	const regs = starRegions(b);
	const rows = starRows(b);
	const cols = starCols(b);
	for (let g = 0; g < b.n; g++) {
		if (regs.has(g)) continue;
		const cs = open(b, cellsOfRegion(b, g));
		if (cs.length < 2) continue;
		const rs = new Set(cs.map((x) => x[0]));
		const ccs = new Set(cs.map((x) => x[1]));
		if (rs.size === 1) {
			const r = cs[0][0];
			const rest = open(b, Array.from({ length: b.n }, (_, c): Cell => [r, c])).filter(([i, j]) => b.regions[i][j] !== g);
			if (rest.length) {
				return {
					technique: 'confined',
					grade: 2,
					kind: 'cross-out',
					region: g,
					cross: rest,
					focus: cs,
					message: `Every open square in region ${regionLetter(g)} is in ${rowName(r)}, so region ${regionLetter(g)}'s star will use up that row. Cross out the other squares in ${rowName(r)}.`,
				};
			}
		}
		if (ccs.size === 1) {
			const c = cs[0][1];
			const rest = open(b, Array.from({ length: b.n }, (_, r): Cell => [r, c])).filter(([i, j]) => b.regions[i][j] !== g);
			if (rest.length) {
				return {
					technique: 'confined',
					grade: 2,
					kind: 'cross-out',
					region: g,
					cross: rest,
					focus: cs,
					message: `Every open square in region ${regionLetter(g)} is in ${colName(c)}, so region ${regionLetter(g)}'s star will use up that column. Cross out the other squares in ${colName(c)}.`,
				};
			}
		}
	}
	for (let r = 0; r < b.n; r++) {
		if (rows.has(r)) continue;
		const cs = open(b, Array.from({ length: b.n }, (_, c): Cell => [r, c]));
		if (cs.length < 2) continue;
		const gs = new Set(cs.map(([i, j]) => b.regions[i][j]));
		if (gs.size === 1) {
			const g = b.regions[cs[0][0]][cs[0][1]];
			const rest = open(b, cellsOfRegion(b, g)).filter(([i]) => i !== r);
			if (rest.length) {
				return {
					technique: 'confined',
					grade: 2,
					kind: 'cross-out',
					region: g,
					cross: rest,
					focus: cs,
					message: `Every open square in ${rowName(r)} belongs to region ${regionLetter(g)}, so that row's star is region ${regionLetter(g)}'s star. Cross out the rest of region ${regionLetter(g)}.`,
				};
			}
		}
	}
	for (let c = 0; c < b.n; c++) {
		if (cols.has(c)) continue;
		const cs = open(b, Array.from({ length: b.n }, (_, r): Cell => [r, c]));
		if (cs.length < 2) continue;
		const gs = new Set(cs.map(([i, j]) => b.regions[i][j]));
		if (gs.size === 1) {
			const g = b.regions[cs[0][0]][cs[0][1]];
			const rest = open(b, cellsOfRegion(b, g)).filter(([, j]) => j !== c);
			if (rest.length) {
				return {
					technique: 'confined',
					grade: 2,
					kind: 'cross-out',
					region: g,
					cross: rest,
					focus: cs,
					message: `Every open square in ${colName(c)} belongs to region ${regionLetter(g)}, so that column's star is region ${regionLetter(g)}'s star. Cross out the rest of region ${regionLetter(g)}.`,
				};
			}
		}
	}
	return null;
}

const NUM_WORD = ['', 'one', 'two', 'three'];

/** n regions fit inside n lines, or n lines fit inside n regions. */
function stepGroup(b: Board): LogicStep | null {
	const regs = starRegions(b);
	const rows = starRows(b);
	const cols = starCols(b);
	const freeRegions = Array.from({ length: b.n }, (_, g) => g).filter((g) => !regs.has(g));
	for (const axis of ['row', 'col'] as const) {
		const lineDone = axis === 'row' ? rows : cols;
		const freeLines = Array.from({ length: b.n }, (_, i) => i).filter((i) => !lineDone.has(i));
		const lineCells = (i: number): Cell[] =>
			Array.from({ length: b.n }, (_, k): Cell => (axis === 'row' ? [i, k] : [k, i]));
		const name = axis === 'row' ? rowName : colName;
		const idx = (cell: Cell): number => (axis === 'row' ? cell[0] : cell[1]);

		for (const k of [2, 3]) {
			// k regions whose open squares all lie in k lines
			for (const gs of subsets(freeRegions, k)) {
				const cells = gs.flatMap((g) => open(b, cellsOfRegion(b, g)));
				const lines = new Set(cells.map(idx));
				if (lines.size !== k) continue;
				const gset = new Set(gs);
				const rest = [...lines].flatMap((i) => open(b, lineCells(i))).filter(([r, c]) => !gset.has(b.regions[r][c]));
				if (rest.length) {
					const L = [...lines].sort((x, y) => x - y);
					return {
						technique: 'group',
						grade: 3,
						kind: 'cross-out',
						cross: rest,
						focus: cells,
						message: `Regions ${gs.map(regionLetter).join(', ')} together fit inside ${plural(k, axis === 'row' ? 'row' : 'column')} (${L.map((i) => i + 1).join(', ')}). Their ${NUM_WORD[k]} stars will fill those ${axis === 'row' ? 'rows' : 'columns'}, so cross out every other square in them.`,
					};
				}
			}
			// k lines whose open squares all lie in k regions
			for (const ls of subsets(freeLines, k)) {
				const cells = ls.flatMap((i) => open(b, lineCells(i)));
				const gs = new Set(cells.map(([r, c]) => b.regions[r][c]));
				if (gs.size !== k) continue;
				const lset = new Set(ls);
				const rest = [...gs].flatMap((g) => open(b, cellsOfRegion(b, g))).filter((cell) => !lset.has(idx(cell)));
				if (rest.length) {
					return {
						technique: 'group',
						grade: 3,
						kind: 'cross-out',
						cross: rest,
						focus: cells,
						message: `${cap(axis === 'row' ? 'rows' : 'columns')} ${ls.map((i) => i + 1).join(', ')} can only get their stars from regions ${[...gs].sort((x, y) => x - y).map(regionLetter).join(', ')}. Those regions have no star to spare, so cross out their squares outside these ${axis === 'row' ? 'rows' : 'columns'}.`,
					};
				}
			}
		}
	}
	return null;
}

/** Run the solver from a given position (stars placed, squares crossed out by the player are ignored). */
export function solveByLogic(p: StarPuzzle, maxGrade = 3): LogicResult {
	const b = newBoard(p);
	const steps: LogicStep[] = [];
	let guard = 0;
	while (b.stars.length < b.n && guard++ < 400) {
		let step: LogicStep | null = stepLastSpot(b);
		if (!step && maxGrade >= 2) step = withIdea(stepConfined(b));
		if (!step && maxGrade >= 3) step = withIdea(stepGroup(b));
		if (!step) break;
		steps.push(step);
		if (step.kind === 'place' && step.place) placeStar(b, step.place[0], step.place[1]);
		else if (step.cross) cross(b, step.cross);
	}
	const grade = steps.reduce((m, s) => Math.max(m, s.grade), 0);
	return { steps, solved: b.stars.length === b.n, grade, stars: b.stars };
}

/**
 * The next step a player could take from the stars they have placed.
 * `placed` are the player's stars; `dots` are their crossed-out squares (trusted only where they are correct).
 * Returns null when the placed stars conflict or the solver needs a trick it does not have.
 */
export function nextLogicStep(p: StarPuzzle, placed: Cell[], maxGrade = 3, dots: Cell[] = []): LogicStep | null {
	const b = newBoard(p);
	for (const [r, c] of placed) {
		if (!b.cand[r][c]) return null; // two stars that rule each other out
		placeStar(b, r, c);
	}
	// The player's own dots count only where they are right, so a wrong note never derails a hint.
	for (const [r, c] of dots) if (p.solution[r] !== c) b.cand[r][c] = false;
	// A cross-out step only helps if it teaches something, so replay cross-outs silently until a placement.
	let guard = 0;
	let first: LogicStep | null = null;
	while (b.stars.length < b.n && guard++ < 400) {
		let step: LogicStep | null = stepLastSpot(b);
		if (!step && maxGrade >= 2) step = withIdea(stepConfined(b));
		if (!step && maxGrade >= 3) step = withIdea(stepGroup(b));
		if (!step) return first;
		if (!first) first = step;
		if (step.kind === 'place') return first.kind === 'place' ? step : first;
		if (step.cross) cross(b, step.cross);
	}
	return first;
}

export function gradeName(grade: number): string {
	return grade <= 1 ? 'Easy' : grade === 2 ? 'Medium' : grade === 3 ? 'Hard' : 'Needs a trick we do not cover';
}

export { key as cellKey };

export interface LogicalPuzzle extends StarPuzzle {
	/** Hardest technique needed (2 = confined regions, 3 = groups). */
	grade: number;
}

/**
 * Same as `generate`, but keeps trying seeds derived from `seed` until the board can be finished
 * by the techniques above. So a player never needs to guess. Deterministic for a given seed.
 */
export function generateLogical(size: number, seed: number, maxGrade = 3): LogicalPuzzle {
	for (let k = 0; k < 400; k++) {
		const p = generate(size, (seed + k * 104729) >>> 0);
		const res = solveByLogic(p, maxGrade);
		if (res.solved) return { ...p, grade: res.grade };
	}
	throw new Error(`no logic-solvable Star Battle found for size ${size} seed ${seed}`);
}
