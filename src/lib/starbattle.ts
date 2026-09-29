// Star Battle, one-star version.
// Rules: put one star in every row, every column and every region.
// Stars may not touch, not even at a corner.
//
// Cell state: 0 empty, 1 star, 2 dot (player's "no star here" note).

import { makeRng, shuffle, type Rng } from './rng.ts';

export interface StarPuzzle {
	size: number;
	regions: number[][]; // region index 0..size-1 per cell
	solution: number[]; // solution[r] = column of the star in row r
}

export type Marks = number[][];

export function emptyMarks(size: number): Marks {
	return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

export function regionLetter(i: number): string {
	return String.fromCharCode(65 + i);
}

/** Count solutions (stop at limit). */
export function countSolutions(regions: number[][], limit = 2): number {
	const n = regions.length;
	const colUsed = Array<boolean>(n).fill(false);
	const regUsed = Array<boolean>(n).fill(false);
	let found = 0;
	function walk(r: number, prevCol: number): void {
		if (found >= limit) return;
		if (r === n) {
			found++;
			return;
		}
		for (let c = 0; c < n; c++) {
			if (colUsed[c] || Math.abs(c - prevCol) <= 1) continue;
			const reg = regions[r][c];
			if (regUsed[reg]) continue;
			colUsed[c] = regUsed[reg] = true;
			walk(r + 1, c);
			colUsed[c] = regUsed[reg] = false;
			if (found >= limit) return;
		}
	}
	walk(0, -10);
	return found;
}

function randomPlacement(n: number, rng: Rng): number[] | null {
	const cols = Array<number>(n).fill(-1);
	const used = Array<boolean>(n).fill(false);
	function walk(r: number): boolean {
		if (r === n) return true;
		for (const c of shuffle(Array.from({ length: n }, (_, i) => i), rng)) {
			if (used[c]) continue;
			if (r > 0 && Math.abs(cols[r - 1] - c) <= 1) continue;
			cols[r] = c;
			used[c] = true;
			if (walk(r + 1)) return true;
			used[c] = false;
			cols[r] = -1;
		}
		return false;
	}
	return walk(0) ? cols : null;
}

function growRegions(n: number, stars: number[], rng: Rng): number[][] {
	const reg = Array.from({ length: n }, () => Array<number>(n).fill(-1));
	const frontier: Array<[number, number]> = [];
	for (let r = 0; r < n; r++) {
		reg[r][stars[r]] = r; // region r starts at the star of row r
		frontier.push([r, stars[r]]);
	}
	let left = n * n - n;
	while (left > 0) {
		// pick a random already-owned cell and try to take one free neighbour
		const [r, c] = frontier[Math.floor(rng() * frontier.length)];
		const dirs = shuffle(
			[
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			],
			rng,
		);
		for (const [dr, dc] of dirs) {
			const nr = r + dr;
			const nc = c + dc;
			if (nr < 0 || nc < 0 || nr >= n || nc >= n || reg[nr][nc] !== -1) continue;
			reg[nr][nc] = reg[r][c];
			frontier.push([nr, nc]);
			left--;
			break;
		}
	}
	return reg;
}

/** Deterministic: the same seed always yields the same puzzle. */
export function generate(size: number, seed: number): StarPuzzle {
	for (let attempt = 0; attempt < 5000; attempt++) {
		const rng = makeRng((seed + attempt * 7919) >>> 0);
		const stars = randomPlacement(size, rng);
		if (!stars) continue;
		const regions = growRegions(size, stars, rng);
		if (countSolutions(regions, 2) === 1) return { size, regions, solution: stars };
	}
	throw new Error(`no unique Star Battle found for size ${size} seed ${seed}`);
}

export interface StarCheck {
	conflicts: Set<string>;
	stars: number;
	solved: boolean;
}

export function check(regions: number[][], marks: Marks): StarCheck {
	const n = regions.length;
	const conflicts = new Set<string>();
	const list: Array<[number, number]> = [];
	for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (marks[r][c] === 1) list.push([r, c]);

	for (let i = 0; i < list.length; i++) {
		for (let j = i + 1; j < list.length; j++) {
			const [r1, c1] = list[i];
			const [r2, c2] = list[j];
			const clash =
				r1 === r2 || c1 === c2 || regions[r1][c1] === regions[r2][c2] || (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1);
			if (clash) {
				conflicts.add(`${r1},${c1}`);
				conflicts.add(`${r2},${c2}`);
			}
		}
	}
	return { conflicts, stars: list.length, solved: list.length === n && conflicts.size === 0 };
}

export interface StarHint {
	level: 1 | 2 | 3;
	message: string;
	cell?: [number, number];
	region?: number;
}

/** Cells where a star could still go, given the stars already on the board. */
function candidates(p: StarPuzzle, marks: Marks): boolean[][] {
	const n = p.size;
	const stars: Array<[number, number]> = [];
	for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (marks[r][c] === 1) stars.push([r, c]);
	const rowDone = new Set(stars.map((s) => s[0]));
	const colDone = new Set(stars.map((s) => s[1]));
	const regDone = new Set(stars.map((s) => p.regions[s[0]][s[1]]));
	return Array.from({ length: n }, (_, r) =>
		Array.from({ length: n }, (_, c) => {
			if (marks[r][c] === 2 || marks[r][c] === 1) return false;
			if (rowDone.has(r) || colDone.has(c) || regDone.has(p.regions[r][c])) return false;
			return !stars.some(([sr, sc]) => Math.abs(sr - r) <= 1 && Math.abs(sc - c) <= 1);
		}),
	);
}

export function nextHint(p: StarPuzzle, marks: Marks, level: 1 | 2 | 3): StarHint {
	const n = p.size;
	// A star that disagrees with the solution poisons every deduction. Say so first.
	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			if (marks[r][c] === 1 && p.solution[r] !== c) {
				return {
					level,
					message:
						level === 1
							? 'Before going on, one of the stars on the board is in the wrong place.'
							: `The star in row ${r + 1} does not belong there. Lift it and try that row again.`,
					cell: level === 3 ? [r, c] : undefined,
				};
			}
		}
	}
	const cand = candidates(p, marks);
	// The unfilled region with the fewest places left is the best place to look.
	let best = -1;
	let bestCount = 99;
	const regStars = new Set<number>();
	for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (marks[r][c] === 1) regStars.add(p.regions[r][c]);
	for (let g = 0; g < n; g++) {
		if (regStars.has(g)) continue;
		let count = 0;
		for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (p.regions[r][c] === g && cand[r][c]) count++;
		if (count < bestCount) (best = g, (bestCount = count));
	}
	if (best === -1) return { level, message: 'Every region has a star. Check the board for touching stars.' };
	let row = -1;
	for (let r = 0; r < n && row === -1; r++) if (p.regions[r][p.solution[r]] === best) row = r;
	const letter = regionLetter(best);
	if (level === 1) return { level, region: best, message: `Region ${letter} is the tightest spot on the board. Start there.` };
	if (level === 2)
		return {
			level,
			region: best,
			message: `Region ${letter} has ${bestCount === 1 ? 'one place' : `${bestCount} places`} left for its star. Its star sits in row ${row + 1}.`,
		};
	return { level, region: best, cell: [row, p.solution[row]], message: `Region ${letter}'s star goes in row ${row + 1}, column ${p.solution[row] + 1}.` };
}
