import { generate, check, nextHint, emptyMarks, regionLetter, type Marks, type StarPuzzle } from '../lib/starbattle.ts';
import { hashSeed, todayKey } from '../lib/rng.ts';
import { read, write, markGoing, markDone } from './store.ts';
import { createTimer, createHintStack, showBanner, hideBanner, arrowMove, formatTime } from './game-shell.ts';

interface Saved {
	marks: Marks;
	elapsed: number;
	hints: number;
	done: boolean;
}

const SIZES = [6, 7, 8, 9];
const HUES = [18, 42, 92, 158, 196, 248, 292, 338, 70];

const STAR = '<svg class="star" aria-hidden="true"><use href="#i-star"></use></svg>';

export function mountStarBattle(root: HTMLElement, opts: { daily?: boolean } = {}): void {
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
	let size = opts.daily ? 8 : read<number>('star:size', 7);
	if (!SIZES.includes(size)) size = 7;

	let seed = 0;
	let puzzle: StarPuzzle;
	let marks: Marks;
	let history: Marks[] = [];
	let done = false;
	let cursor: [number, number] = [0, 0];
	let hintCells: Set<string> = new Set();

	const clone = (m: Marks): Marks => m.map((r) => r.slice());
	const timer = createTimer(timerEl, timerBtn);
	const hints = createHintStack(
		hintRoot,
		(level) => {
			const h = nextHint(puzzle, marks, level);
			const cells: string[] = [];
			if (h.cell) cells.push(`${h.cell[0]},${h.cell[1]}`);
			else if (h.region !== undefined) {
				for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (puzzle.regions[r][c] === h.region) cells.push(`${r},${c}`);
			}
			return { message: h.message, cells };
		},
		(cells) => {
			hintCells = new Set(cells);
			// createHintStack covers itself once at construction, before any board exists.
			if (marks && boardEl.children.length === size * size) paint();
		},
		() => save(),
	);

	const dailySeed = (): number => hashSeed(`morningwit-star-${size}-${date}`);
	const key = (): string => `s:star:${size}:${seed}`;

	function save(): void {
		write(key(), { marks, elapsed: timer.elapsed(), hints: hints.used(), done } satisfies Saved);
		if (!opts.daily) write(`star:seed:${size}`, seed);
	}

	function load(newSeed: number): void {
		seed = newSeed;
		puzzle = generate(size, seed);
		const saved = read<Saved | null>(key(), null);
		if (saved && saved.marks.length === size) {
			marks = saved.marks;
			timer.set(saved.elapsed);
			hints.setUsed(saved.hints);
			done = saved.done;
		} else {
			marks = emptyMarks(size);
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
		boardEl.className = 'board stars';
		boardEl.style.setProperty('--n', String(size));
		boardEl.innerHTML = '';
		boardEl.setAttribute('role', 'grid');
		boardEl.setAttribute('aria-label', `Star Battle, ${size} by ${size}`);
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				const b = document.createElement('button');
				b.type = 'button';
				b.className = 'cell';
				b.dataset.r = String(r);
				b.dataset.c = String(c);
				b.setAttribute('role', 'gridcell');
				const g = puzzle.regions[r][c];
				b.style.background = `hsl(${HUES[g % HUES.length]} 75% 86%)`;
				const edge = (dr: number, dc: number): string => {
					const nr = r + dr;
					const nc = c + dc;
					const other = nr < 0 || nc < 0 || nr >= size || nc >= size ? -1 : puzzle.regions[nr][nc];
					return other === g ? '1px solid rgba(42,37,64,.22)' : '3px solid #2a2540';
				};
				b.style.borderTop = edge(-1, 0);
				b.style.borderBottom = edge(1, 0);
				b.style.borderLeft = edge(0, -1);
				b.style.borderRight = edge(0, 1);
				boardEl.appendChild(b);
			}
		}
	}

	const cellEl = (r: number, c: number): HTMLButtonElement => boardEl.children[r * size + c] as HTMLButtonElement;

	function paint(): void {
		const res = check(puzzle.regions, marks);
		// A letter marks the top-left cell of each region so hints can name it.
		const first = new Set<string>();
		const seen = new Set<number>();
		for (let r = 0; r < size; r++)
			for (let c = 0; c < size; c++) {
				const g = puzzle.regions[r][c];
				if (!seen.has(g)) (seen.add(g), first.add(`${r},${c}`));
			}
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				const el = cellEl(r, c);
				const v = marks[r][c];
				const k = `${r},${c}`;
				el.dataset.conflict = String(res.conflicts.has(k));
				el.dataset.hint = String(hintCells.has(k));
				el.tabIndex = r === cursor[0] && c === cursor[1] ? 0 : -1;
				const letter = first.has(k) ? `<span class="letter" aria-hidden="true">${regionLetter(puzzle.regions[r][c])}</span>` : '';
				el.innerHTML = letter + (v === 1 ? STAR : v === 2 ? '<span class="dot"></span>' : '');
				const name = v === 1 ? 'star' : v === 2 ? 'marked empty' : 'empty';
				el.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, region ${regionLetter(puzzle.regions[r][c])}, ${name}`);
			}
		}
		undoBtn.disabled = history.length === 0 || done;
		if (statLine) statLine.textContent = `${size} × ${size} · one star each`;
	}

	function put(r: number, c: number, v: number): void {
		if (done || marks[r][c] === v) return;
		history.push(clone(marks));
		if (history.length > 200) history.shift();
		marks[r][c] = v;
		hints.cover();
		hintCells = new Set();
		markGoing('star-battle');
		if (opts.daily) markGoing('daily');
		paint();
		if (check(puzzle.regions, marks).solved) finish(true);
		else save();
	}

	const cycle = (r: number, c: number): void => put(r, c, marks[r][c] === 0 ? 2 : marks[r][c] === 2 ? 1 : 0);

	function finish(fresh: boolean): void {
		done = true;
		timer.pause();
		const h = hints.used();
		showBanner(banner, 'Solved. Every star found a home.', `${formatTime(timer.elapsed())} · ${h === 0 ? 'no hints' : h === 1 ? '1 hint' : `${h} hints`}`);
		if (fresh) {
			markDone('star-battle', date);
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
		const k = e.key.toLowerCase();
		if (k === 's' || k === '*') put(r, c, 1);
		else if (k === 'd' || k === 'x' || k === '.') put(r, c, 2);
		else if (e.key === 'Backspace' || e.key === 'Delete') put(r, c, 0);
		else if (e.key === ' ' || e.key === 'Enter') cycle(r, c);
		else return;
		e.preventDefault();
		cellEl(r, c).focus();
	});

	function undo(): void {
		const prev = history.pop();
		if (!prev || done) return;
		marks = prev;
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
		history.push(clone(marks));
		marks = emptyMarks(size);
		hints.cover();
		hintCells = new Set();
		paint();
		save();
	});

	if (!opts.daily) {
		const seg = root.querySelector<HTMLElement>('#seg-size');
		seg?.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
			b.setAttribute('aria-pressed', String(Number(b.dataset.v) === size));
			b.onclick = () => {
				size = Number(b.dataset.v);
				write('star:size', size);
				seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String((x as HTMLElement).dataset.v === b.dataset.v)));
				timer.pause();
				load(read<number | null>(`star:seed:${size}`, null) ?? dailySeed());
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
		load(read<number | null>(`star:seed:${size}`, null) ?? dailySeed());
	} else {
		load(dailySeed());
	}
	window.addEventListener('pagehide', save);
}
