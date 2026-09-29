// Binairo (also sold as Takuzu / Binary Puzzle).
// Rules: every cell is 0 or 1. No three equal digits in a row or column.
// Each row and column holds the same number of 0s and 1s. No two rows are
// identical and no two columns are identical.
//
// Cell values: -1 empty, 0, 1.

import { makeRng, shuffle, type Rng } from './rng.ts';

export type Grid = number[][];

export interface BinairoPuzzle {
	size: number;
	givens: Grid; // -1 where the player has to fill in
	solution: Grid;
}

export const EMPTY = -1;

/** Player-facing name of a cell value: 1 is a sun, 0 is a moon. */
export function symbolName(v: number): string {
	return v === 1 ? 'sun' : 'moon';
}

export function emptyGrid(size: number): Grid {
	return Array.from({ length: size }, () => Array<number>(size).fill(EMPTY));
}

export function cloneGrid(g: Grid): Grid {
	return g.map((r) => r.slice());
}

function lineOf(g: Grid, index: number, axis: 'row' | 'col'): number[] {
	return axis === 'row' ? g[index] : g.map((r) => r[index]);
}

/** Would placing `value` at (r, c) break a local rule? Ignores emptiness elsewhere. */
export function placementOk(g: Grid, r: number, c: number, value: number): boolean {
	const n = g.length;
	const half = n / 2;
	const row = g[r].slice();
	row[c] = value;
	const col = g.map((x, i) => (i === r ? value : x[c]));
	for (const line of [row, col]) {
		let ones = 0;
		let zeros = 0;
		for (let i = 0; i < n; i++) {
			if (line[i] === 1) ones++;
			else if (line[i] === 0) zeros++;
			if (i >= 2 && line[i] !== EMPTY && line[i] === line[i - 1] && line[i] === line[i - 2]) return false;
		}
		if (ones > half || zeros > half) return false;
	}
	return true;
}

function linesEqualFull(a: number[], b: number[]): boolean {
	for (let i = 0; i < a.length; i++) if (a[i] === EMPTY || a[i] !== b[i]) return false;
	return true;
}

/** Duplicate check for completed rows/columns. */
function duplicatesOk(g: Grid, r: number, c: number): boolean {
	const n = g.length;
	const row = g[r];
	if (!row.includes(EMPTY)) {
		for (let i = 0; i < n; i++) if (i !== r && linesEqualFull(row, g[i])) return false;
	}
	const col = lineOf(g, c, 'col');
	if (!col.includes(EMPTY)) {
		for (let j = 0; j < n; j++) if (j !== c && linesEqualFull(col, lineOf(g, j, 'col'))) return false;
	}
	return true;
}

/** Count solutions, stopping at `limit`. Fills `g` temporarily and restores it. */
export function countSolutions(g: Grid, limit = 2): number {
	const n = g.length;
	let found = 0;

	// Pick the empty cell with the fewest legal values (0 / 1 / both).
	function pick(): { r: number; c: number; opts: number[] } | null | 'dead' {
		let best: { r: number; c: number; opts: number[] } | null = null;
		for (let r = 0; r < n; r++) {
			for (let c = 0; c < n; c++) {
				if (g[r][c] !== EMPTY) continue;
				const opts: number[] = [];
				for (const v of [0, 1]) if (placementOk(g, r, c, v)) opts.push(v);
				if (opts.length === 0) return 'dead';
				if (!best || opts.length < best.opts.length) best = { r, c, opts };
				if (best.opts.length === 1) return best;
			}
		}
		return best;
	}

	function walk(): void {
		if (found >= limit) return;
		const next = pick();
		if (next === 'dead') return;
		if (next === null) {
			// full grid: check duplicate lines
			for (let i = 0; i < n; i++) {
				if (!duplicatesOk(g, i, i)) return;
			}
			found++;
			return;
		}
		for (const v of next.opts) {
			g[next.r][next.c] = v;
			if (duplicatesOk(g, next.r, next.c)) walk();
			g[next.r][next.c] = EMPTY;
			if (found >= limit) return;
		}
	}

	walk();
	return found;
}

/** A random complete valid grid. */
function randomSolution(size: number, rng: Rng): Grid {
	const g = emptyGrid(size);
	const cells: Array<[number, number]> = [];
	for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push([r, c]);

	function fill(i: number): boolean {
		if (i === cells.length) return true;
		const [r, c] = cells[i];
		for (const v of shuffle([0, 1], rng)) {
			if (!placementOk(g, r, c, v)) continue;
			g[r][c] = v;
			if (duplicatesOk(g, r, c) && fill(i + 1)) return true;
			g[r][c] = EMPTY;
		}
		return false;
	}

	if (!fill(0)) throw new Error('could not build a Binairo grid');
	return g;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Share of cells kept as givens once uniqueness allows removal. */
const KEEP: Record<Difficulty, number> = { easy: 0.5, medium: 0.4, hard: 0.0 };

export function generate(size: number, seed: number, difficulty: Difficulty = 'medium'): BinairoPuzzle {
	if (size % 2 !== 0 || size < 4) throw new Error('Binairo needs an even size of at least 4');
	const rng = makeRng(seed);
	const solution = randomSolution(size, rng);
	const givens = cloneGrid(solution);
	const order = shuffle(
		Array.from({ length: size * size }, (_, i) => i),
		rng,
	);
	const floor = Math.ceil(size * size * KEEP[difficulty]);
	let kept = size * size;
	for (const idx of order) {
		if (kept <= floor) break;
		const r = Math.floor(idx / size);
		const c = idx % size;
		const old = givens[r][c];
		givens[r][c] = EMPTY;
		const probe = cloneGrid(givens);
		if (countSolutions(probe, 2) !== 1) givens[r][c] = old;
		else kept--;
	}
	return { size, givens, solution };
}

export interface CheckResult {
	/** Cells that break a rule right now (by "r,c"). */
	conflicts: Set<string>;
	complete: boolean;
	solved: boolean;
}

export function check(g: Grid): CheckResult {
	const n = g.length;
	const conflicts = new Set<string>();
	const half = n / 2;
	let empties = 0;

	for (let axis = 0; axis < 2; axis++) {
		for (let i = 0; i < n; i++) {
			const line = axis === 0 ? g[i] : g.map((r) => r[i]);
			const at = (k: number): string => (axis === 0 ? `${i},${k}` : `${k},${i}`);
			let ones = 0;
			let zeros = 0;
			for (let k = 0; k < n; k++) {
				if (line[k] === 1) ones++;
				else if (line[k] === 0) zeros++;
				if (k >= 2 && line[k] !== EMPTY && line[k] === line[k - 1] && line[k] === line[k - 2]) {
					conflicts.add(at(k));
					conflicts.add(at(k - 1));
					conflicts.add(at(k - 2));
				}
			}
			if (ones > half) for (let k = 0; k < n; k++) if (line[k] === 1) conflicts.add(at(k));
			if (zeros > half) for (let k = 0; k < n; k++) if (line[k] === 0) conflicts.add(at(k));
		}
	}
	for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (g[r][c] === EMPTY) empties++;

	for (let a = 0; a < n; a++) {
		for (let b = a + 1; b < n; b++) {
			if (linesEqualFull(g[a], g[b])) for (let k = 0; k < n; k++) (conflicts.add(`${a},${k}`), conflicts.add(`${b},${k}`));
			const ca = g.map((r) => r[a]);
			const cb = g.map((r) => r[b]);
			if (linesEqualFull(ca, cb)) for (let k = 0; k < n; k++) (conflicts.add(`${k},${a}`), conflicts.add(`${k},${b}`));
		}
	}
	return { conflicts, complete: empties === 0, solved: empties === 0 && conflicts.size === 0 };
}

export interface Hint {
	level: 1 | 2 | 3;
	r: number;
	c: number;
	value: number;
	message: string;
}

/**
 * A staged hint. Finds a cell that has only one legal value, then reports it
 * at three levels: which area to look at, which rule applies, the value itself.
 */
export function nextHint(g: Grid, solution: Grid, level: 1 | 2 | 3): Hint | null {
	const n = g.length;
	let forced: { r: number; c: number; value: number; reason: string } | null = null;

	for (let r = 0; r < n && !forced; r++) {
		for (let c = 0; c < n && !forced; c++) {
			if (g[r][c] !== EMPTY) continue;
			const can = [0, 1].filter((v) => placementOk(g, r, c, v));
			if (can.length === 1) {
				const v = can[0];
				const other = 1 - v;
				const why = explainBlock(g, r, c, other);
				forced = { r, c, value: v, reason: why };
			}
		}
	}
	if (!forced) {
		// Fall back to the stored solution so the player is never stuck.
		for (let r = 0; r < n && !forced; r++) {
			for (let c = 0; c < n && !forced; c++) {
				if (g[r][c] === EMPTY) forced = { r, c, value: solution[r][c], reason: 'Only one choice fits when you look at the whole board.' };
			}
		}
	}
	if (!forced) return null;

	const message =
		level === 1
			? `Look at row ${forced.r + 1}. One empty square there has only one symbol that fits.`
			: level === 2
				? `Row ${forced.r + 1}, column ${forced.c + 1}: ${forced.reason}`
				: `Row ${forced.r + 1}, column ${forced.c + 1} is a ${symbolName(forced.value)}.`;
	return { level, r: forced.r, c: forced.c, value: forced.value, message };
}

function explainBlock(g: Grid, r: number, c: number, blocked: number): string {
	const n = g.length;
	const half = n / 2;
	const row = g[r];
	const col = g.map((x) => x[c]);
	const label = symbolName(blocked);
	const tri = (line: number[], k: number): boolean => {
		for (let s = Math.max(0, k - 2); s <= Math.min(n - 3, k); s++) {
			const win = [0, 1, 2].map((d) => (s + d === k ? blocked : line[s + d]));
			if (win.every((x) => x === blocked)) return true;
		}
		return false;
	};
	if (tri(row, c)) return `a ${label} here would make three ${label}s in a row across the row.`;
	if (tri(col, r)) return `a ${label} here would make three ${label}s in a line down the column.`;
	if (row.filter((x) => x === blocked).length >= half) return `this row already has all of its ${label}s.`;
	if (col.filter((x) => x === blocked).length >= half) return `this column already has all of its ${label}s.`;
	return `a ${label} here would leave two rows or two columns identical.`;
}
