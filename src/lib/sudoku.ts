// Classic 9x9 Sudoku: generator (unique solution), and a human-style solver that names the
// technique behind every move. The same steps drive the hints, the difficulty grade, and the
// worked examples in the guides.
//
// Grades (hardest technique a board needs):
//   1 singles            naked single, hidden single
//   2 locked candidates  pointing and claiming
//   3 subsets            naked pair/triple, hidden pair
//   4 X-Wing

import { makeRng, shuffle, type Rng } from './rng.ts';

/** 81 cells, row by row, 0 = empty. */
export type Grid = number[];

const ALL = 0x1ff;
export const bit = (d: number): number => 1 << (d - 1);
const popcount = (m: number): number => {
	let c = 0;
	for (; m; m &= m - 1) c++;
	return c;
};
export const digitsOf = (m: number): number[] => {
	const out: number[] = [];
	for (let d = 1; d <= 9; d++) if (m & bit(d)) out.push(d);
	return out;
};

export const rowOf = (i: number): number => Math.floor(i / 9);
export const colOf = (i: number): number => i % 9;
export const boxOf = (i: number): number => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

export const ROWS: number[][] = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c));
export const COLS: number[][] = Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c));
export const BOXES: number[][] = Array.from({ length: 9 }, (_, b) => {
	const r0 = Math.floor(b / 3) * 3;
	const c0 = (b % 3) * 3;
	const out: number[] = [];
	for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push((r0 + r) * 9 + c0 + c);
	return out;
});
export const UNITS: number[][] = [...ROWS, ...COLS, ...BOXES];

export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
	const s = new Set<number>([...ROWS[rowOf(i)], ...COLS[colOf(i)], ...BOXES[boxOf(i)]]);
	s.delete(i);
	return [...s];
});

export const cellName = (i: number): string => `row ${rowOf(i) + 1}, column ${colOf(i) + 1}`;
const rc = (i: number): string => `r${rowOf(i) + 1}c${colOf(i) + 1}`;
export { rc as shortName };

/* ---------- solving by search (uniqueness) ---------- */

function initialMasks(g: Grid): number[] | null {
	const cand = Array<number>(81).fill(ALL);
	for (let i = 0; i < 81; i++) {
		if (g[i] === 0) continue;
		const b = bit(g[i]);
		if (!(cand[i] & b)) return null;
		cand[i] = b;
		for (const p of PEERS[i]) {
			if (g[p] === g[i]) return null;
			cand[p] &= ~b;
		}
	}
	return cand;
}

/** Count solutions up to `limit`. */
export function countSolutions(g: Grid, limit = 2): number {
	const start = initialMasks(g);
	if (!start) return 0;
	let found = 0;
	const walk = (cand: number[]): void => {
		if (found >= limit) return;
		// propagate singles
		const c = cand.slice();
		let changed = true;
		while (changed) {
			changed = false;
			for (let i = 0; i < 81; i++) {
				if (c[i] === 0) return;
				if (popcount(c[i]) === 1) {
					for (const p of PEERS[i]) {
						if (c[p] & c[i]) {
							if (c[p] === c[i]) return;
							c[p] &= ~c[i];
							changed = true;
						}
					}
				}
			}
		}
		let best = -1;
		let bestN = 10;
		for (let i = 0; i < 81; i++) {
			const n = popcount(c[i]);
			if (n > 1 && n < bestN) {
				best = i;
				bestN = n;
				if (n === 2) break;
			}
		}
		if (best === -1) {
			found++;
			return;
		}
		for (const d of digitsOf(c[best])) {
			const next = c.slice();
			next[best] = bit(d);
			walk(next);
			if (found >= limit) return;
		}
	};
	walk(start);
	return found;
}

function randomFull(rng: Rng): Grid {
	const g: Grid = Array<number>(81).fill(0);
	const cand = (i: number): number[] => {
		let m = ALL;
		for (const p of PEERS[i]) if (g[p]) m &= ~bit(g[p]);
		return digitsOf(m);
	};
	const fill = (i: number): boolean => {
		if (i === 81) return true;
		for (const d of shuffle(cand(i), rng)) {
			g[i] = d;
			if (fill(i + 1)) return true;
		}
		g[i] = 0;
		return false;
	};
	fill(0);
	return g;
}

/* ---------- human-style solver ---------- */

export type Technique = 'naked-single' | 'hidden-single' | 'pointing' | 'claiming' | 'naked-subset' | 'hidden-pair' | 'x-wing' | 'skyscraper' | 'y-wing';

export interface SudokuStep {
	technique: Technique;
	/** 5 (Skyscraper, Y-Wing) is never used by the game: generation and hints stop at 4. It exists for guides and tools. */
	grade: 1 | 2 | 3 | 4 | 5;
	/** A digit goes into a cell. */
	place?: { i: number; d: number };
	/** Candidates removed (pencil marks that can go). */
	eliminate?: Array<{ i: number; d: number }>;
	focus: number[];
	message: string;
	/** What to notice, without the answer. */
	idea: string;
}

export interface SudokuLogicResult {
	steps: SudokuStep[];
	solved: boolean;
	grade: number;
	grid: Grid;
}

export interface Board {
	grid: Grid;
	cand: number[];
}

export function boardFrom(g: Grid): Board | null {
	const cand = initialMasks(g);
	return cand ? { grid: g.slice(), cand } : null;
}

function place(b: Board, i: number, d: number): void {
	b.grid[i] = d;
	b.cand[i] = 0;
	for (const p of PEERS[i]) b.cand[p] &= ~bit(d);
}

const unitName = (u: number): string => (u < 9 ? `row ${u + 1}` : u < 18 ? `column ${u - 8}` : `box ${u - 17}`);
const unitKind = (u: number): 'row' | 'column' | 'box' => (u < 9 ? 'row' : u < 18 ? 'column' : 'box');
const list = (xs: string[]): string => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

function nakedSingle(b: Board): SudokuStep | null {
	for (let i = 0; i < 81; i++) {
		if (b.grid[i] === 0 && popcount(b.cand[i]) === 1) {
			const d = digitsOf(b.cand[i])[0];
			return {
				technique: 'naked-single',
				grade: 1,
				place: { i, d },
				focus: [i, ...PEERS[i].filter((p) => b.grid[p] !== 0)],
				message: `Every other digit is already used by a neighbour of ${cellName(i)}, in its row, column or box. Only ${d} is left, so ${d} goes there.`,
				idea: `Look at ${cellName(i)}. Cross off every digit its row, column and box already contain.`,
			};
		}
	}
	return null;
}

function hiddenSingle(b: Board): SudokuStep | null {
	for (const kind of [2, 0, 1]) {
		// boxes first: they are the easiest for people to scan
		const units = kind === 2 ? BOXES : kind === 0 ? ROWS : COLS;
		for (let ui = 0; ui < 9; ui++) {
			const u = units[ui];
			const uIdx = kind === 2 ? 18 + ui : kind === 0 ? ui : 9 + ui;
			for (let d = 1; d <= 9; d++) {
				if (u.some((i) => b.grid[i] === d)) continue;
				const spots = u.filter((i) => b.grid[i] === 0 && b.cand[i] & bit(d));
				if (spots.length === 1) {
					const i = spots[0];
					return {
						technique: 'hidden-single',
						grade: 1,
						place: { i, d },
						focus: u,
						message: `In ${unitName(uIdx)}, the digit ${d} has only one square where it can go: ${cellName(i)}.`,
						idea: `Pick the digit ${d} in ${unitName(uIdx)}. Which squares in it can still hold a ${d}?`,
					};
				}
			}
		}
	}
	return null;
}

/** Pointing: within a box a digit sits in one line only, so it is gone from the rest of that line. Claiming is the reverse. */
function lockedCandidates(b: Board): SudokuStep | null {
	for (let bi = 0; bi < 9; bi++) {
		for (let d = 1; d <= 9; d++) {
			const cells = BOXES[bi].filter((i) => b.grid[i] === 0 && b.cand[i] & bit(d));
			if (cells.length < 2) continue;
			const rows = new Set(cells.map(rowOf));
			const cols = new Set(cells.map(colOf));
			const lines: Array<[number[], string, number]> = [];
			if (rows.size === 1) lines.push([ROWS[[...rows][0]], `row ${[...rows][0] + 1}`, [...rows][0]]);
			if (cols.size === 1) lines.push([COLS[[...cols][0]], `column ${[...cols][0] + 1}`, 9 + [...cols][0]]);
			for (const [line, name] of lines) {
				const out = line.filter((i) => boxOf(i) !== bi && b.grid[i] === 0 && b.cand[i] & bit(d));
				if (out.length) {
					return {
						technique: 'pointing',
						grade: 2,
						eliminate: out.map((i) => ({ i, d })),
						focus: cells,
						message: `In box ${bi + 1}, every square that can still take a ${d} lies in ${name}. The box needs its ${d} there, so no other square in ${name} can be a ${d}.`,
						idea: `In box ${bi + 1}, look at where a ${d} can still go. They all line up.`,
					};
				}
			}
		}
	}
	for (let ui = 0; ui < 18; ui++) {
		const u = ui < 9 ? ROWS[ui] : COLS[ui - 9];
		for (let d = 1; d <= 9; d++) {
			const cells = u.filter((i) => b.grid[i] === 0 && b.cand[i] & bit(d));
			if (cells.length < 2) continue;
			const boxes = new Set(cells.map(boxOf));
			if (boxes.size !== 1) continue;
			const bi = [...boxes][0];
			const out = BOXES[bi].filter((i) => !u.includes(i) && b.grid[i] === 0 && b.cand[i] & bit(d));
			if (out.length) {
				return {
					technique: 'claiming',
					grade: 2,
					eliminate: out.map((i) => ({ i, d })),
					focus: cells,
					message: `In ${unitName(ui)}, every square that can still take a ${d} is inside box ${bi + 1}. So the ${d} of box ${bi + 1} must be in ${unitName(ui)}, and the other squares of that box cannot be a ${d}.`,
					idea: `In ${unitName(ui)}, look at where a ${d} can still go. They all sit in one box.`,
				};
			}
		}
	}
	return null;
}

function subsets<T>(items: T[], k: number): T[][] {
	const out: T[][] = [];
	const walk = (s: number, cur: T[]): void => {
		if (cur.length === k) return void out.push(cur.slice());
		for (let i = s; i < items.length; i++) (cur.push(items[i]), walk(i + 1, cur), cur.pop());
	};
	walk(0, []);
	return out;
}

/** Naked pair or triple: n squares in a unit that together hold only n digits. */
function nakedSubset(b: Board): SudokuStep | null {
	for (const n of [2, 3]) {
		for (let ui = 0; ui < 27; ui++) {
			const u = UNITS[ui];
			const open = u.filter((i) => b.grid[i] === 0 && popcount(b.cand[i]) >= 2 && popcount(b.cand[i]) <= n);
			for (const group of subsets(open, n)) {
				const m = group.reduce((a, i) => a | b.cand[i], 0);
				if (popcount(m) !== n) continue;
				const out: Array<{ i: number; d: number }> = [];
				for (const i of u) {
					if (group.includes(i) || b.grid[i] !== 0) continue;
					for (const d of digitsOf(b.cand[i] & m)) out.push({ i, d });
				}
				if (out.length) {
					const ds = digitsOf(m);
					return {
						technique: 'naked-subset',
						grade: 3,
						eliminate: out,
						focus: group,
						message: `${list(group.map(cellName))} can only hold ${list(ds.map(String))} between them. Those ${n} squares use up ${n} digits, so ${list(ds.map(String))} can be crossed out of the other squares in ${unitName(ui)}.`,
						idea: `In ${unitName(ui)}, some squares have very few candidates. Do ${n} of them share the same ${n} digits?`,
					};
				}
			}
		}
	}
	return null;
}

/** Hidden pair: two digits that appear in only two squares of a unit. Other candidates in those squares go. */
function hiddenPair(b: Board): SudokuStep | null {
	for (let ui = 0; ui < 27; ui++) {
		const u = UNITS[ui];
		const where = (d: number): number[] => u.filter((i) => b.grid[i] === 0 && b.cand[i] & bit(d));
		const ds = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !u.some((i) => b.grid[i] === d) && where(d).length === 2);
		for (const [d1, d2] of subsets(ds, 2) as [number, number][]) {
			const w1 = where(d1);
			const w2 = where(d2);
			if (w1[0] !== w2[0] || w1[1] !== w2[1]) continue;
			const keep = bit(d1) | bit(d2);
			const out: Array<{ i: number; d: number }> = [];
			for (const i of w1) for (const d of digitsOf(b.cand[i] & ~keep)) out.push({ i, d });
			if (out.length) {
				return {
					technique: 'hidden-pair',
					grade: 3,
					eliminate: out,
					focus: w1,
					message: `In ${unitName(ui)}, the digits ${d1} and ${d2} can only go in ${cellName(w1[0])} and ${cellName(w1[1])}. Those two squares must hold exactly ${d1} and ${d2}, so every other candidate can be crossed out of them.`,
					idea: `In ${unitName(ui)}, follow the digits ${d1} and ${d2}. Where can each one still go?`,
				};
			}
		}
	}
	return null;
}

/** X-Wing: a digit is limited to the same two columns in two rows (or the reverse). It is gone from the rest of those columns. */
function xWing(b: Board): SudokuStep | null {
	for (let d = 1; d <= 9; d++) {
		for (const byRow of [true, false]) {
			const lines = byRow ? ROWS : COLS;
			const cross = byRow ? COLS : ROWS;
			const spots: number[][] = lines.map((line) =>
				b.grid.some((v, i) => v === d && line.includes(i))
					? []
					: line.filter((i) => b.grid[i] === 0 && b.cand[i] & bit(d)).map((i) => (byRow ? colOf(i) : rowOf(i))),
			);
			for (let a = 0; a < 9; a++) {
				if (spots[a].length !== 2) continue;
				for (let c = a + 1; c < 9; c++) {
					if (spots[c].length !== 2 || spots[c][0] !== spots[a][0] || spots[c][1] !== spots[a][1]) continue;
					const out: Array<{ i: number; d: number }> = [];
					for (const x of spots[a]) {
						for (const i of cross[x]) {
							const l = byRow ? rowOf(i) : colOf(i);
							if (l !== a && l !== c && b.grid[i] === 0 && b.cand[i] & bit(d)) out.push({ i, d });
						}
					}
					if (out.length) {
						const corners = [a, c].flatMap((l) => spots[a].map((x) => (byRow ? l * 9 + x : x * 9 + l)));
						const lineWord = byRow ? 'rows' : 'columns';
						const crossWord = byRow ? 'columns' : 'rows';
						return {
							technique: 'x-wing',
							grade: 4,
							eliminate: out,
							focus: corners,
							message: `In ${lineWord} ${a + 1} and ${c + 1}, the digit ${d} can only go in ${crossWord} ${spots[a][0] + 1} and ${spots[a][1] + 1}. Whichever way the two ${d}s fall, they use up both ${crossWord}, so no other square in ${crossWord} ${spots[a][0] + 1} or ${spots[a][1] + 1} can be a ${d}.`,
							idea: `Follow the digit ${d} through ${lineWord} ${a + 1} and ${c + 1}. Each has only two places left for it, and they are in the same ${crossWord}.`,
						};
					}
				}
			}
		}
	}
	return null;
}

/**
 * Skyscraper: a digit has exactly two places in each of two rows (or columns), and one place of each sits in the same
 * column (or row). The other two places, the "roof", cannot both be wrong: if the shared column holds the digit in one
 * row it cannot in the other, so the other row's digit lands on its roof square. Either way one roof square holds it,
 * so any square that sees both roof squares cannot. The four pattern squares themselves are never touched.
 */
export function skyscraper(b: Board): SudokuStep | null {
	for (let d = 1; d <= 9; d++) {
		for (const byRow of [true, false]) {
			const lines = byRow ? ROWS : COLS;
			const spots: number[][] = lines.map((line) =>
				b.grid.some((v, i) => v === d && line.includes(i))
					? []
					: line.filter((i) => b.grid[i] === 0 && b.cand[i] & bit(d)).map((i) => (byRow ? colOf(i) : rowOf(i))),
			);
			for (let a = 0; a < 9; a++) {
				if (spots[a].length !== 2) continue;
				for (let c = a + 1; c < 9; c++) {
					if (spots[c].length !== 2) continue;
					const shared = spots[a].filter((x) => spots[c].includes(x));
					if (shared.length !== 1) continue;
					const base = shared[0];
					const xa = spots[a].find((x) => x !== base)!;
					const xc = spots[c].find((x) => x !== base)!;
					const at = (line: number, cross: number): number => (byRow ? line * 9 + cross : cross * 9 + line);
					const roofA = at(a, xa);
					const roofC = at(c, xc);
					const pattern = new Set([at(a, base), at(c, base), roofA, roofC]);
					const out: Array<{ i: number; d: number }> = [];
					for (let i = 0; i < 81; i++) {
						if (pattern.has(i) || b.grid[i] !== 0 || !(b.cand[i] & bit(d))) continue;
						if (PEERS[i].includes(roofA) && PEERS[i].includes(roofC)) out.push({ i, d });
					}
					if (!out.length) continue;
					const lineWord = byRow ? 'rows' : 'columns';
					const crossWord = byRow ? 'column' : 'row';
					return {
						technique: 'skyscraper',
						grade: 5,
						eliminate: out,
						focus: [at(a, base), at(c, base), roofA, roofC],
						message: `In ${lineWord} ${a + 1} and ${c + 1}, the digit ${d} has only two places each, and one place in each is in ${crossWord} ${base + 1}. Both of those cannot hold a ${d}, so at least one of the two end squares, ${cellName(roofA)} and ${cellName(roofC)}, must. A square that sees both of them cannot be a ${d}.`,
						idea: `Follow the digit ${d} through ${lineWord} ${a + 1} and ${c + 1}. Each has two places left, and one place in each sits in the same ${crossWord}.`,
					};
				}
			}
		}
	}
	return null;
}

/**
 * Y-Wing (also called XY-Wing): a pivot square holds exactly two candidates, A and B. Two more squares that see the pivot
 * hold exactly A and C, and B and C. If the pivot is A, the first of them must be C; if the pivot is B, the second must be C.
 * Either way one of the two ends is C, so any square that sees both of them cannot be C.
 */
export function yWing(b: Board): SudokuStep | null {
	for (let pivot = 0; pivot < 81; pivot++) {
		if (b.grid[pivot] !== 0 || popcount(b.cand[pivot]) !== 2) continue;
		const [a, bb] = digitsOf(b.cand[pivot]);
		const ends = PEERS[pivot].filter((i) => b.grid[i] === 0 && popcount(b.cand[i]) === 2);
		for (const p1 of ends) {
			if (!(b.cand[p1] & bit(a)) || b.cand[p1] & bit(bb)) continue;
			const c = digitsOf(b.cand[p1]).find((d) => d !== a)!;
			for (const p2 of ends) {
				if (p2 === p1) continue;
				if (b.cand[p2] !== (bit(bb) | bit(c))) continue;
				const out: Array<{ i: number; d: number }> = [];
				for (let i = 0; i < 81; i++) {
					if (i === pivot || i === p1 || i === p2 || b.grid[i] !== 0 || !(b.cand[i] & bit(c))) continue;
					if (PEERS[i].includes(p1) && PEERS[i].includes(p2)) out.push({ i, d: c });
				}
				if (!out.length) continue;
				return {
					technique: 'y-wing',
					grade: 5,
					eliminate: out,
					focus: [pivot, p1, p2],
					message: `${cellName(pivot)} can only be ${a} or ${bb}. If it is ${a}, then ${cellName(p1)} (${a} or ${c}) must be ${c}. If it is ${bb}, then ${cellName(p2)} (${bb} or ${c}) must be ${c}. Either way one of those two squares is a ${c}, so a square that sees both of them cannot be a ${c}.`,
					idea: `Look at ${cellName(pivot)}, which has only two candidates left, and at the two squares it sees that also have two candidates each.`,
				};
			}
		}
	}
	return null;
}

function nextStepFor(b: Board, maxGrade: number): SudokuStep | null {
	return (
		nakedSingle(b) ??
		hiddenSingle(b) ??
		(maxGrade >= 2 ? lockedCandidates(b) : null) ??
		(maxGrade >= 3 ? (nakedSubset(b) ?? hiddenPair(b)) : null) ??
		(maxGrade >= 4 ? xWing(b) : null) ??
		(maxGrade >= 5 ? (skyscraper(b) ?? yWing(b)) : null)
	);
}

export function applyStep(b: Board, s: SudokuStep): void {
	if (s.place) place(b, s.place.i, s.place.d);
	if (s.eliminate) for (const { i, d } of s.eliminate) b.cand[i] &= ~bit(d);
}

export function nextSudokuStep(b: Board, maxGrade = 4): SudokuStep | null {
	return nextStepFor(b, maxGrade);
}

export function solveSudokuByLogic(g: Grid, maxGrade = 4): SudokuLogicResult {
	const b = boardFrom(g);
	if (!b) return { steps: [], solved: false, grade: 0, grid: g };
	const steps: SudokuStep[] = [];
	let guard = 0;
	while (guard++ < 2000) {
		if (b.grid.every((v) => v !== 0)) break;
		const s = nextStepFor(b, maxGrade);
		if (!s) break;
		steps.push(s);
		applyStep(b, s);
	}
	return { steps, solved: b.grid.every((v) => v !== 0), grade: steps.reduce((m, s) => Math.max(m, s.grade), 0), grid: b.grid };
}

/* ---------- generation ---------- */

export interface SudokuPuzzle {
	givens: Grid;
	solution: Grid;
	grade: number;
}

function carve(full: Grid, rng: Rng, target: number): Grid {
	const g = full.slice();
	let clues = 81;
	for (const i of shuffle(Array.from({ length: 81 }, (_, k) => k), rng)) {
		if (clues <= target) break;
		const old = g[i];
		g[i] = 0;
		if (countSolutions(g, 2) !== 1) g[i] = old;
		else clues--;
	}
	return g;
}

/** A random one-solution board with about `clues` givens and no check on which technique solves it. For tools and tests. */
export function rawPuzzle(seed: number, clues: number): { givens: Grid; solution: Grid } {
	const rng = makeRng(seed >>> 0);
	const full = randomFull(rng);
	return { givens: carve(full, rng, clues), solution: full };
}

export type Level = 'easy' | 'medium' | 'hard';
const LEVELS: Record<Level, { clues: number; min: number; max: number }> = {
	easy: { clues: 40, min: 1, max: 1 },
	medium: { clues: 32, min: 2, max: 3 },
	hard: { clues: 26, min: 3, max: 4 },
};

/** A puzzle with exactly one solution whose hardest needed technique fits the level. Deterministic per seed. */
export function generateSudoku(seed: number, level: Level = 'medium'): SudokuPuzzle {
	const spec = LEVELS[level];
	let fallback: SudokuPuzzle | null = null;
	for (let k = 0; k < 300; k++) {
		const rng = makeRng((seed + k * 104729) >>> 0);
		const full = randomFull(rng);
		const givens = carve(full, rng, spec.clues);
		const res = solveSudokuByLogic(givens, spec.max);
		if (!res.solved) continue;
		const p: SudokuPuzzle = { givens, solution: full, grade: res.grade };
		if (res.grade >= spec.min) return p;
		fallback ??= p;
	}
	if (fallback) return fallback;
	throw new Error(`no ${level} Sudoku found for seed ${seed}`);
}

export function checkSudoku(g: Grid): { conflicts: Set<number>; complete: boolean; solved: boolean } {
	const conflicts = new Set<number>();
	for (const u of UNITS) {
		const seen = new Map<number, number>();
		for (const i of u) {
			const v = g[i];
			if (!v) continue;
			if (seen.has(v)) (conflicts.add(i), conflicts.add(seen.get(v)!));
			else seen.set(v, i);
		}
	}
	const complete = g.every((v) => v !== 0);
	return { conflicts, complete, solved: complete && conflicts.size === 0 };
}
