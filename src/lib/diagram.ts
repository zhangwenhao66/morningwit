// SVG diagrams for guides. Plain strings, no dependencies, colours that work on white and on the dark theme.

import { rowOf, colOf, type Grid } from './sudoku.ts';
import { EMPTY, type Grid as BinGrid } from './binairo.ts';
import { regionLetter } from './starbattle.ts';

const INK = '#2a2540';
const LINE = '#cfc3b3';

export interface SudokuDiagramOptions {
	/** Show a dot for every square where this digit is still a candidate. */
	candidatesOf?: { digit: number; cells: number[] };
	/** Squares outlined as the pattern (for example the four X-Wing corners). */
	highlight?: number[];
	/** Squares that get a cross (candidates that can be removed). */
	cross?: number[];
	/** Light bands behind whole rows or columns, to show which lines matter. */
	bandRows?: number[];
	bandCols?: number[];
	size?: number;
	title: string;
	desc: string;
}

/** A 9x9 Sudoku with the given digits, and optionally the candidates of one digit marked. */
export function sudokuSvg(grid: Grid, o: SudokuDiagramOptions): string {
	const cell = 40;
	const pad = 12;
	const w = pad * 2 + cell * 9;
	const parts: string[] = [];
	parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" role="img" aria-labelledby="t d">`);
	parts.push(`<title id="t">${esc(o.title)}</title><desc id="d">${esc(o.desc)}</desc>`);
	parts.push(`<rect width="${w}" height="${w}" rx="16" fill="#fffbf5"/>`);
	for (const r of o.bandRows ?? []) parts.push(`<rect x="${pad}" y="${pad + r * cell}" width="${cell * 9}" height="${cell}" fill="#8ec5ff" opacity=".28"/>`);
	for (const c of o.bandCols ?? []) parts.push(`<rect x="${pad + c * cell}" y="${pad}" width="${cell}" height="${cell * 9}" fill="#8ec5ff" opacity=".28"/>`);
	for (let i = 0; i <= 9; i++) {
		const thick = i % 3 === 0;
		const p = pad + i * cell;
		parts.push(`<line x1="${pad}" y1="${p}" x2="${pad + cell * 9}" y2="${p}" stroke="${thick ? INK : LINE}" stroke-width="${thick ? 2.5 : 1}"/>`);
		parts.push(`<line x1="${p}" y1="${pad}" x2="${p}" y2="${pad + cell * 9}" stroke="${thick ? INK : LINE}" stroke-width="${thick ? 2.5 : 1}"/>`);
	}
	for (let i = 0; i < 81; i++) {
		const cx = pad + colOf(i) * cell + cell / 2;
		const cy = pad + rowOf(i) * cell + cell / 2;
		if (grid[i]) {
			parts.push(`<text x="${cx}" y="${cy + 7}" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-weight="700" font-size="22" fill="${INK}">${grid[i]}</text>`);
		}
	}
	if (o.candidatesOf) {
		for (const i of o.candidatesOf.cells) {
			const cx = pad + colOf(i) * cell + cell / 2;
			const cy = pad + rowOf(i) * cell + cell / 2;
			parts.push(`<circle cx="${cx}" cy="${cy}" r="8" fill="#ffb38a" stroke="${INK}" stroke-width="1.5"/>`);
			parts.push(`<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-weight="700" font-size="11" fill="${INK}">${o.candidatesOf.digit}</text>`);
		}
	}
	for (const i of o.highlight ?? []) {
		const x = pad + colOf(i) * cell + 3;
		const y = pad + rowOf(i) * cell + 3;
		parts.push(`<rect x="${x}" y="${y}" width="${cell - 6}" height="${cell - 6}" rx="8" fill="none" stroke="#ff7a6b" stroke-width="3.5"/>`);
	}
	for (const i of o.cross ?? []) {
		const cx = pad + colOf(i) * cell + cell / 2;
		const cy = pad + rowOf(i) * cell + cell / 2;
		parts.push(`<path d="M${cx - 7} ${cy - 7}L${cx + 7} ${cy + 7}M${cx + 7} ${cy - 7}L${cx - 7} ${cy + 7}" stroke="#b23a2b" stroke-width="3" stroke-linecap="round"/>`);
	}
	parts.push('</svg>');
	return parts.join('');
}

// ---- Star Battle ----

const REGION_FILL = ['#ffe3d6', '#e0f0da', '#dbe8ff', '#fff2c2', '#efdcff', '#d7f1f1', '#ffdcec', '#e8e4d4', '#e4e8c8', '#f5d9c8'];

export interface StarDiagramOptions {
	stars?: Array<[number, number]>;
	/** Squares that are crossed out. */
	crossed?: Array<[number, number]>;
	/** Squares outlined as the pattern under discussion. */
	highlight?: Array<[number, number]>;
	title: string;
	desc: string;
}

/** A Star Battle board: regions shaded and lettered (never colour alone), thick lines between regions. */
export function starBattleSvg(p: { size: number; regions: number[][] }, o: StarDiagramOptions): string {
	const n = p.size;
	const cell = n > 8 ? 36 : 42;
	const pad = 12;
	const w = pad * 2 + cell * n;
	const at = (r: number, c: number): [number, number] => [pad + c * cell, pad + r * cell];
	const out: string[] = [];
	out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" role="img" aria-labelledby="t d">`);
	out.push(`<title id="t">${esc(o.title)}</title><desc id="d">${esc(o.desc)}</desc>`);
	out.push(`<rect width="${w}" height="${w}" rx="16" fill="#fffbf5"/>`);
	const seen = new Set<number>();
	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			const reg = p.regions[r][c];
			const [x, y] = at(r, c);
			out.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${REGION_FILL[reg % REGION_FILL.length]}" stroke="${LINE}" stroke-width="1"/>`);
			if (!seen.has(reg)) {
				seen.add(reg);
				out.push(`<text x="${x + 4}" y="${y + 12}" font-family="Figtree, system-ui, sans-serif" font-weight="700" font-size="10" fill="${INK}" opacity=".7">${regionLetter(reg)}</text>`);
			}
		}
	}
	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			const [x, y] = at(r, c);
			if (c + 1 < n && p.regions[r][c] !== p.regions[r][c + 1]) out.push(`<line x1="${x + cell}" y1="${y}" x2="${x + cell}" y2="${y + cell}" stroke="${INK}" stroke-width="3"/>`);
			if (r + 1 < n && p.regions[r][c] !== p.regions[r + 1][c]) out.push(`<line x1="${x}" y1="${y + cell}" x2="${x + cell}" y2="${y + cell}" stroke="${INK}" stroke-width="3"/>`);
		}
	}
	out.push(`<rect x="${pad}" y="${pad}" width="${cell * n}" height="${cell * n}" fill="none" stroke="${INK}" stroke-width="3"/>`);
	for (const [r, c] of o.crossed ?? []) {
		const [x, y] = at(r, c);
		const cx = x + cell / 2;
		const cy = y + cell / 2;
		out.push(`<path d="M${cx - 6} ${cy - 6}L${cx + 6} ${cy + 6}M${cx + 6} ${cy - 6}L${cx - 6} ${cy + 6}" stroke="#b23a2b" stroke-width="2.5" stroke-linecap="round"/>`);
	}
	for (const [r, c] of o.stars ?? []) {
		const [x, y] = at(r, c);
		out.push(starPath(x + cell / 2, y + cell / 2 + 1, cell * 0.34));
	}
	for (const [r, c] of o.highlight ?? []) {
		const [x, y] = at(r, c);
		out.push(`<rect x="${x + 2}" y="${y + 2}" width="${cell - 4}" height="${cell - 4}" rx="7" fill="none" stroke="#ff7a6b" stroke-width="3.5"/>`);
	}
	out.push('</svg>');
	return out.join('');
}

function starPath(cx: number, cy: number, R: number): string {
	const pts: string[] = [];
	for (let k = 0; k < 10; k++) {
		const rad = k % 2 === 0 ? R : R * 0.45;
		const a = -Math.PI / 2 + (k * Math.PI) / 5;
		pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
	}
	return `<polygon points="${pts.join(' ')}" fill="#f2b21a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

// ---- Binairo ----

export interface BinairoDiagramOptions {
	/** Squares that were given at the start (drawn on a darker tile). */
	fixed?: Array<[number, number]>;
	highlight?: Array<[number, number]>;
	title: string;
	desc: string;
}

/** A Binairo board: 1 is a sun (round with rays), 0 is a moon (crescent). Shapes differ, so colour is never the only cue. */
export function binairoSvg(grid: BinGrid, o: BinairoDiagramOptions): string {
	const n = grid.length;
	const cell = n > 8 ? 34 : 42;
	const pad = 12;
	const w = pad * 2 + cell * n;
	const out: string[] = [];
	out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" role="img" aria-labelledby="t d">`);
	out.push(`<title id="t">${esc(o.title)}</title><desc id="d">${esc(o.desc)}</desc>`);
	out.push(`<rect width="${w}" height="${w}" rx="16" fill="#fffbf5"/>`);
	const fixed = new Set((o.fixed ?? []).map(([r, c]) => r * n + c));
	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			const x = pad + c * cell;
			const y = pad + r * cell;
			out.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fixed.has(r * n + c) ? '#efe6d8' : '#fffdf9'}" stroke="${LINE}" stroke-width="1"/>`);
			const v = grid[r][c];
			const cx = x + cell / 2;
			const cy = y + cell / 2;
			if (v === 1) out.push(sunPath(cx, cy, cell * 0.24));
			else if (v !== EMPTY) out.push(moonPath(cx, cy, cell * 0.3));
		}
	}
	out.push(`<rect x="${pad}" y="${pad}" width="${cell * n}" height="${cell * n}" fill="none" stroke="${INK}" stroke-width="3"/>`);
	for (const [r, c] of o.highlight ?? []) {
		const x = pad + c * cell;
		const y = pad + r * cell;
		out.push(`<rect x="${x + 2}" y="${y + 2}" width="${cell - 4}" height="${cell - 4}" rx="7" fill="none" stroke="#ff7a6b" stroke-width="3.5"/>`);
	}
	out.push('</svg>');
	return out.join('');
}

function sunPath(cx: number, cy: number, R: number): string {
	let rays = '';
	for (let k = 0; k < 8; k++) {
		const a = (k * Math.PI) / 4;
		rays += `M${(cx + R * 1.35 * Math.cos(a)).toFixed(1)} ${(cy + R * 1.35 * Math.sin(a)).toFixed(1)}L${(cx + R * 1.75 * Math.cos(a)).toFixed(1)} ${(cy + R * 1.75 * Math.sin(a)).toFixed(1)}`;
	}
	return `<circle cx="${cx}" cy="${cy}" r="${R.toFixed(1)}" fill="#ffc83d" stroke="${INK}" stroke-width="1.6"/><path d="${rays}" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
}

function moonPath(cx: number, cy: number, R: number): string {
	// Outer edge: the long way round a circle of radius R, from the upper right to the lower right.
	// Inner edge: a shallower arc back, so the shape is a crescent with a filled body.
	const a = (50 * Math.PI) / 180;
	const x = (cx + R * Math.cos(a)).toFixed(1);
	const y1 = (cy - R * Math.sin(a)).toFixed(1);
	const y2 = (cy + R * Math.sin(a)).toFixed(1);
	return `<path d="M${x} ${y1}A${R.toFixed(1)} ${R.toFixed(1)} 0 1 0 ${x} ${y2}A${(R * 0.9).toFixed(1)} ${(R * 0.9).toFixed(1)} 0 0 1 ${x} ${y1}Z" fill="#9fb0ff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
