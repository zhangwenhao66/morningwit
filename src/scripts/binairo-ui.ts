import { generate, check, nextHint, EMPTY, cloneGrid, type Grid, type Difficulty, type BinairoPuzzle } from '../lib/binairo.ts';
import { hashSeed, todayKey } from '../lib/rng.ts';
import { read, write, markGoing, markDone } from './store.ts';
import { createTimer, createHintStack, showBanner, hideBanner, arrowMove, formatTime } from './game-shell.ts';

interface Saved {
	grid: Grid;
	elapsed: number;
	hints: number;
	done: boolean;
}

const SIZES = [6, 8, 10];
const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];

export function mountBinairo(root: HTMLElement, opts: { daily?: boolean } = {}): void {
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

	const date = todayKey();
	let size = opts.daily ? 8 : read<number>('binairo:size', 8);
	let diff: Difficulty = opts.daily ? 'medium' : read<Difficulty>('binairo:diff', 'medium');
	if (!SIZES.includes(size)) size = 8;
	if (!DIFFS.includes(diff)) diff = 'medium';

	let seed = 0;
	let puzzle: BinairoPuzzle;
	let grid: Grid;
	let history: Grid[] = [];
	let done = false;
	let cursor: [number, number] = [0, 0];
	let hintCells: Set<string> = new Set();

	const timer = createTimer(timerEl, timerBtn);
	const hints = createHintStack(
		hintRoot,
		(level) => {
			const h = nextHint(grid, puzzle.solution, level);
			if (!h) return null;
			const cells = level === 1 ? Array.from({ length: size }, (_, c) => `${h.r},${c}`) : [`${h.r},${h.c}`];
			return { message: h.message, cells };
		},
		(cells) => {
			hintCells = new Set(cells);
			// createHintStack covers itself once at construction, before any board exists.
			if (grid && boardEl.children.length === size * size) paint();
		},
		() => save(),
	);

	function dailySeed(): number {
		return hashSeed(`morningwit-binairo-${size}-${diff}-${date}`);
	}
	function key(): string {
		return `s:binairo:${size}:${diff}:${seed}`;
	}
	function save(): void {
		write(key(), { grid, elapsed: timer.elapsed(), hints: hints.used(), done } satisfies Saved);
		if (!opts.daily) write(`binairo:seed:${size}:${diff}`, seed);
	}

	function load(newSeed: number): void {
		seed = newSeed;
		puzzle = generate(size, seed, diff);
		const saved = read<Saved | null>(key(), null);
		if (saved && saved.grid.length === size) {
			grid = saved.grid;
			timer.set(saved.elapsed);
			hints.setUsed(saved.hints);
			done = saved.done;
		} else {
			grid = cloneGrid(puzzle.givens);
			timer.set(0);
			hints.setUsed(0);
			done = false;
		}
		history = [];
		cursor = [0, 0];
		hideBanner(banner);
		buildBoard();
		hints.cover();
		paint();
		if (done) finish(false);
		else timer.run();
	}

	function buildBoard(): void {
		boardEl.style.setProperty('--n', String(size));
		boardEl.innerHTML = '';
		boardEl.setAttribute('role', 'grid');
		boardEl.setAttribute('aria-label', `Binairo, ${size} by ${size}`);
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				const b = document.createElement('button');
				b.type = 'button';
				b.className = 'cell';
				b.dataset.r = String(r);
				b.dataset.c = String(c);
				b.setAttribute('role', 'gridcell');
				boardEl.appendChild(b);
			}
		}
	}

	function cellEl(r: number, c: number): HTMLButtonElement {
		return boardEl.children[r * size + c] as HTMLButtonElement;
	}

	function paint(): void {
		const res = check(grid);
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				const el = cellEl(r, c);
				const v = grid[r][c];
				const locked = puzzle.givens[r][c] !== EMPTY;
				el.dataset.locked = String(locked);
				el.dataset.conflict = String(res.conflicts.has(`${r},${c}`));
				el.dataset.hint = String(hintCells.has(`${r},${c}`));
				el.dataset.cursor = 'false';
				el.tabIndex = r === cursor[0] && c === cursor[1] ? 0 : -1;
				el.innerHTML =
					v === 1
						? '<svg class="sun" aria-hidden="true"><use href="#i-sun"></use></svg>'
						: v === 0
							? '<svg class="moon" aria-hidden="true"><use href="#i-moon"></use></svg>'
							: '';
				const name = v === 1 ? 'sun' : v === 0 ? 'moon' : 'empty';
				el.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, ${name}${locked ? ', given' : ''}`);
			}
		}
		undoBtn.disabled = history.length === 0 || done;
		if (statLine) statLine.textContent = `${size} × ${size} · ${diff}`;
	}

	function put(r: number, c: number, v: number): void {
		if (done || puzzle.givens[r][c] !== EMPTY || grid[r][c] === v) return;
		history.push(cloneGrid(grid));
		if (history.length > 200) history.shift();
		grid[r][c] = v;
		hints.cover();
		hintCells = new Set();
		markGoing('binairo');
		if (opts.daily) markGoing('daily');
		paint();
		const res = check(grid);
		if (res.solved) finish(true);
		else save();
	}

	function cycle(r: number, c: number): void {
		const v = grid[r][c];
		put(r, c, v === EMPTY ? 1 : v === 1 ? 0 : EMPTY);
	}

	function finish(fresh: boolean): void {
		done = true;
		timer.pause();
		const t = timer.elapsed();
		const h = hints.used();
		showBanner(banner, 'Solved. Nicely done.', `${formatTime(t)} · ${h === 0 ? 'no hints' : h === 1 ? '1 hint' : `${h} hints`}`);
		if (fresh) {
			markDone('binairo', date);
			if (opts.daily) markDone('daily', date);
		}
		save();
		paint();
	}

	boardEl.addEventListener('click', (e) => {
		const t = (e.target as HTMLElement).closest<HTMLButtonElement>('.cell');
		if (!t) return;
		const r = Number(t.dataset.r);
		const c = Number(t.dataset.c);
		cursor = [r, c];
		cycle(r, c);
		cellEl(r, c).focus();
	});

	boardEl.addEventListener('keydown', (e) => {
		const t = (e.target as HTMLElement).closest<HTMLButtonElement>('.cell');
		if (!t) return;
		const r = Number(t.dataset.r);
		const c = Number(t.dataset.c);
		const mv = arrowMove(e.key, r, c, size);
		if (mv) {
			e.preventDefault();
			cursor = mv;
			paint();
			cellEl(mv[0], mv[1]).focus();
			return;
		}
		if (e.key === '1' || e.key.toLowerCase() === 's') put(r, c, 1);
		else if (e.key === '0' || e.key.toLowerCase() === 'm') put(r, c, 0);
		else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '.') put(r, c, EMPTY);
		else if (e.key === ' ' || e.key === 'Enter') cycle(r, c);
		else return;
		e.preventDefault();
		cellEl(r, c).focus();
	});

	function undo(): void {
		const prev = history.pop();
		if (!prev || done) return;
		grid = prev;
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
		history.push(cloneGrid(grid));
		grid = cloneGrid(puzzle.givens);
		hints.cover();
		hintCells = new Set();
		paint();
		save();
	});

	function segment(id: string, values: Array<string | number>, current: string | number, onPick: (v: string) => void): void {
		const el = root.querySelector<HTMLElement>(id);
		if (!el) return;
		el.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
			b.setAttribute('aria-pressed', String(b.dataset.v === String(current)));
			b.onclick = () => {
				onPick(b.dataset.v!);
				el.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String((x as HTMLElement).dataset.v === b.dataset.v)));
			};
		});
	}

	if (!opts.daily) {
		const settle = (): void => {
			write('binairo:size', size);
			write('binairo:diff', diff);
			const resumed = read<number | null>(`binairo:seed:${size}:${diff}`, null);
			timer.pause();
			load(resumed ?? dailySeed());
		};
		segment('#seg-size', SIZES, size, (v) => {
			size = Number(v);
			settle();
		});
		segment('#seg-diff', DIFFS, diff, (v) => {
			diff = v as Difficulty;
			settle();
		});
		newBtn?.addEventListener('click', () => {
			timer.pause();
			load(Math.floor(Math.random() * 2 ** 31));
		});
		todayBtn?.addEventListener('click', () => {
			timer.pause();
			load(dailySeed());
		});
		const resumed = read<number | null>(`binairo:seed:${size}:${diff}`, null);
		load(resumed ?? dailySeed());
	} else {
		load(dailySeed());
	}
	window.addEventListener('pagehide', save);
}
