import {
	generateSudoku,
	checkSudoku,
	boardFrom,
	nextSudokuStep,
	applyStep,
	bit,
	digitsOf,
	PEERS,
	rowOf,
	colOf,
	boxOf,
	cellName,
	type Grid,
	type Level,
	type SudokuPuzzle,
	type SudokuStep,
} from '../lib/sudoku.ts';
import { hashSeed, todayKey } from '../lib/rng.ts';
import { read, write, markGoing, markDone } from './store.ts';
import { createTimer, createHintStack, showBanner, hideBanner, arrowMove, formatTime } from './game-shell.ts';

interface Saved {
	grid: Grid;
	notes: number[];
	elapsed: number;
	hints: number;
	done: boolean;
}

const LEVELS: Level[] = ['easy', 'medium', 'hard'];

export function mountSudoku(root: HTMLElement): void {
	const boardEl = root.querySelector<HTMLElement>('#board')!;
	const banner = root.querySelector<HTMLElement>('#banner')!;
	const timerEl = root.querySelector<HTMLElement>('#timer-readout')!;
	const timerBtn = root.querySelector<HTMLButtonElement>('#timer-toggle')!;
	const undoBtn = root.querySelector<HTMLButtonElement>('#undo')!;
	const clearBtn = root.querySelector<HTMLButtonElement>('#clear')!;
	const newBtn = root.querySelector<HTMLButtonElement>('#new-puzzle');
	const todayBtn = root.querySelector<HTMLButtonElement>('#todays');
	const statLine = root.querySelector<HTMLElement>('#stat-line');
	const hintRoot = root.querySelector<HTMLElement>('#hints')!;
	const padEl = root.querySelector<HTMLElement>('#pad')!;
	const pencilBtn = root.querySelector<HTMLButtonElement>('#pencil')!;
	const autoNotesBtn = root.querySelector<HTMLButtonElement>('#auto-notes')!;

	const date = todayKey();
	let level: Level = read<Level>('sudoku:level', 'medium');
	if (!LEVELS.includes(level)) level = 'medium';

	let seed = 0;
	let puzzle: SudokuPuzzle;
	let grid: Grid = [];
	let notes: number[] = [];
	let history: Array<{ grid: Grid; notes: number[] }> = [];
	let done = false;
	let cursor = 0;
	let pencil = false;
	let hintCells: Set<number> = new Set();

	const timer = createTimer(timerEl, timerBtn);
	const hints = createHintStack(
		hintRoot,
		(lv) => {
			const conflicts = checkSudoku(grid).conflicts;
			if (conflicts.size > 0) {
				return {
					message: lv === 3 ? 'Fix the striped squares first. A hint on top of a mistake would mislead you.' : 'Something on the board breaks a rule. Look at the striped squares first.',
					cells: lv === 1 ? Array.from(conflicts).map(String) : [],
				};
			}
			const b = boardFrom(grid);
			if (!b) return null;
			// Replay the eliminations a person would make first, up to and including the next placement.
			const chain: SudokuStep[] = [];
			for (let k = 0; k < 8; k++) {
				const s = nextSudokuStep(b);
				if (!s) break;
				chain.push(s);
				if (s.place) break;
				applyStep(b, s);
			}
			if (chain.length === 0) return { message: 'This position needs a technique the hints do not cover yet. Try the notes button and look for a pattern.', cells: [] };
			const last = chain[chain.length - 1];
			if (lv === 1) return { message: 'Look at the highlighted squares.', cells: last.focus.map(String) };
			if (lv === 2) return { message: last.idea, cells: last.focus.map(String) };
			const text = chain.map((s) => s.message).join(' Then: ');
			return { message: text, cells: last.place ? [String(last.place.i)] : (last.eliminate ?? []).map((e) => String(e.i)) };
		},
		(cells) => {
			hintCells = new Set(cells.map(Number));
			if (grid.length && boardEl.children.length === 81) paint();
		},
		() => save(),
	);

	const dailySeed = (): number => hashSeed(`morningwit-sudoku-${level}-${date}`);
	const key = (): string => `s:sudoku:${level}:${seed}`;
	const save = (): void => {
		write(key(), { grid, notes, elapsed: timer.elapsed(), hints: hints.used(), done } satisfies Saved);
		write(`sudoku:seed:${level}`, seed);
	};

	function load(newSeed: number): void {
		seed = newSeed;
		puzzle = generateSudoku(seed, level);
		const saved = read<Saved | null>(key(), null);
		if (saved && saved.grid.length === 81) {
			grid = saved.grid;
			notes = saved.notes;
			timer.set(saved.elapsed);
			hints.setUsed(saved.hints);
			done = saved.done;
		} else {
			grid = puzzle.givens.slice();
			notes = Array<number>(81).fill(0);
			timer.set(0);
			hints.setUsed(0);
			done = false;
		}
		history = [];
		cursor = grid.findIndex((v, i) => v === 0 && puzzle.givens[i] === 0);
		if (cursor < 0) cursor = 0;
		hideBanner(banner);
		buildBoard();
		hints.cover();
		paint();
		if (done) finish(false);
		else timer.run();
	}

	function buildBoard(): void {
		boardEl.className = 'board sudoku';
		boardEl.innerHTML = '';
		boardEl.setAttribute('role', 'grid');
		boardEl.setAttribute('aria-label', 'Sudoku, 9 by 9');
		for (let i = 0; i < 81; i++) {
			const b = document.createElement('button');
			b.type = 'button';
			b.className = 'cell';
			b.dataset.i = String(i);
			b.setAttribute('role', 'gridcell');
			if (colOf(i) % 3 === 2 && colOf(i) !== 8) b.classList.add('br');
			if (rowOf(i) % 3 === 2 && rowOf(i) !== 8) b.classList.add('bb');
			boardEl.appendChild(b);
		}
	}

	function paint(): void {
		const res = checkSudoku(grid);
		const sel = grid[cursor];
		for (let i = 0; i < 81; i++) {
			const el = boardEl.children[i] as HTMLButtonElement;
			const locked = puzzle.givens[i] !== 0;
			const v = grid[i];
			el.dataset.locked = String(locked);
			el.dataset.conflict = String(res.conflicts.has(i));
			el.dataset.hint = String(hintCells.has(i));
			el.dataset.selected = String(i === cursor);
			el.dataset.peer = String(i !== cursor && PEERS[cursor].includes(i));
			el.dataset.same = String(sel !== 0 && v === sel && i !== cursor);
			el.tabIndex = i === cursor ? 0 : -1;
			if (v) el.textContent = String(v);
			else {
				el.textContent = '';
				if (notes[i]) {
					const n = document.createElement('div');
					n.className = 'notes';
					n.setAttribute('aria-hidden', 'true');
					for (let d = 1; d <= 9; d++) {
						const s = document.createElement('span');
						s.textContent = notes[i] & bit(d) ? String(d) : '';
						n.appendChild(s);
					}
					el.appendChild(n);
				}
			}
			const noteText = !v && notes[i] ? `, notes ${digitsOf(notes[i]).join(' ')}` : '';
			el.setAttribute('aria-label', `${cellName(i)}, ${v ? v : 'empty'}${locked ? ', given' : ''}${noteText}`);
		}
		padEl.querySelectorAll<HTMLButtonElement>('button[data-d]').forEach((btn) => {
			const d = Number(btn.dataset.d);
			btn.dataset.done = String(grid.filter((x) => x === d).length >= 9);
		});
		pencilBtn.setAttribute('aria-pressed', String(pencil));
		undoBtn.disabled = history.length === 0 || done;
		if (statLine) statLine.textContent = `${level[0].toUpperCase()}${level.slice(1)}`;
	}

	function snapshot(): void {
		history.push({ grid: grid.slice(), notes: notes.slice() });
		if (history.length > 300) history.shift();
	}

	function enter(d: number): void {
		if (done || puzzle.givens[cursor] !== 0) return;
		snapshot();
		if (pencil) {
			if (grid[cursor] !== 0) return void history.pop();
			notes[cursor] ^= bit(d);
		} else {
			if (grid[cursor] === d) {
				grid[cursor] = 0;
			} else {
				grid[cursor] = d;
				notes[cursor] = 0;
				for (const p of PEERS[cursor]) notes[p] &= ~bit(d);
			}
		}
		afterChange();
	}

	function erase(): void {
		if (done || puzzle.givens[cursor] !== 0) return;
		if (grid[cursor] === 0 && notes[cursor] === 0) return;
		snapshot();
		grid[cursor] = 0;
		notes[cursor] = 0;
		afterChange();
	}

	function afterChange(): void {
		hints.cover();
		hintCells = new Set();
		markGoing('sudoku');
		paint();
		if (checkSudoku(grid).solved) finish(true);
		else save();
	}

	function finish(fresh: boolean): void {
		done = true;
		timer.pause();
		const h = hints.used();
		showBanner(banner, 'Solved. Every digit found its place.', `${formatTime(timer.elapsed())} · ${h === 0 ? 'no hints' : h === 1 ? '1 hint' : `${h} hints`}`);
		if (fresh) markDone('sudoku', date);
		save();
		paint();
	}

	boardEl.addEventListener('click', (e) => {
		const t = (e.target as HTMLElement).closest<HTMLButtonElement>('.cell');
		if (!t) return;
		cursor = Number(t.dataset.i);
		paint();
		(boardEl.children[cursor] as HTMLElement).focus();
	});

	boardEl.addEventListener('keydown', (e) => {
		const r = rowOf(cursor);
		const c = colOf(cursor);
		const mv = arrowMove(e.key, r, c, 9);
		if (mv) {
			e.preventDefault();
			cursor = mv[0] * 9 + mv[1];
			paint();
			(boardEl.children[cursor] as HTMLElement).focus();
			return;
		}
		if (/^[1-9]$/.test(e.key)) enter(Number(e.key));
		else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') erase();
		else if (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'n') {
			pencil = !pencil;
			paint();
		} else return;
		e.preventDefault();
		(boardEl.children[cursor] as HTMLElement).focus();
	});

	padEl.addEventListener('click', (e) => {
		const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-d]');
		if (btn) enter(Number(btn.dataset.d));
	});
	pencilBtn.addEventListener('click', () => {
		pencil = !pencil;
		paint();
	});
	root.querySelector<HTMLButtonElement>('#erase')?.addEventListener('click', erase);
	autoNotesBtn.addEventListener('click', () => {
		if (done) return;
		snapshot();
		const b = boardFrom(grid);
		if (!b) return void history.pop();
		notes = b.cand.slice();
		afterChange();
	});

	function undo(): void {
		const prev = history.pop();
		if (!prev || done) return;
		grid = prev.grid;
		notes = prev.notes;
		hints.cover();
		hintCells = new Set();
		paint();
		save();
	}
	undoBtn.addEventListener('click', undo);
	document.addEventListener('keydown', (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
			e.preventDefault();
			undo();
		}
	});
	clearBtn.addEventListener('click', () => {
		if (done) return;
		snapshot();
		grid = puzzle.givens.slice();
		notes = Array<number>(81).fill(0);
		hints.cover();
		hintCells = new Set();
		paint();
		save();
	});

	const seg = root.querySelector<HTMLElement>('#seg-diff');
	seg?.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
		b.setAttribute('aria-pressed', String(b.dataset.v === level));
		b.onclick = () => {
			level = b.dataset.v as Level;
			write('sudoku:level', level);
			seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String((x as HTMLElement).dataset.v === level)));
			timer.pause();
			load(read<number | null>(`sudoku:seed:${level}`, null) ?? dailySeed());
		};
	});
	newBtn?.addEventListener('click', () => {
		timer.pause();
		load(Math.floor(Math.random() * 2 ** 31));
	});
	todayBtn?.addEventListener('click', () => {
		timer.pause();
		load(dailySeed());
	});
	load(read<number | null>(`sudoku:seed:${level}`, null) ?? dailySeed());
	window.addEventListener('pagehide', save);
}
