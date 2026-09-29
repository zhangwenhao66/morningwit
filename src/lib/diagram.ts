// SVG diagrams for guides. Plain strings, no dependencies, colours that work on white and on the dark theme.

import { rowOf, colOf, type Grid } from './sudoku.ts';

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

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
