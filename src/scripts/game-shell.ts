// Pieces every game shares: timer, undo history, the three-layer hint stack, the "solved" banner.

import { read, write } from './store.ts';

export function formatTime(ms: number): string {
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export interface Timer {
	elapsed(): number;
	set(ms: number): void;
	run(): void;
	pause(): void;
}

/** Counts while the tab is visible. The readout can be hidden; the preference is remembered. */
export function createTimer(readout: HTMLElement, toggle: HTMLButtonElement): Timer {
	let base = 0;
	let startedAt: number | null = null;
	let tick: number | undefined;
	let shown = read<boolean>('timer:shown', true);

	function now(): number {
		return base + (startedAt === null ? 0 : Date.now() - startedAt);
	}
	function paint(): void {
		readout.textContent = shown ? formatTime(now()) : '--:--';
		toggle.setAttribute('aria-pressed', String(shown));
		toggle.setAttribute('aria-label', shown ? 'Hide timer' : 'Show timer');
	}
	toggle.addEventListener('click', () => {
		shown = !shown;
		write('timer:shown', shown);
		paint();
	});
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) pause();
		else if (running) run();
	});
	let running = false;
	function run(): void {
		running = true;
		if (startedAt === null && !document.hidden) startedAt = Date.now();
		window.clearInterval(tick);
		tick = window.setInterval(paint, 500);
		paint();
	}
	function pause(): void {
		if (startedAt !== null) {
			base += Date.now() - startedAt;
			startedAt = null;
		}
		window.clearInterval(tick);
		paint();
	}
	return {
		elapsed: now,
		set(ms) {
			base = ms;
			startedAt = null;
			paint();
		},
		run,
		pause: () => {
			running = false;
			pause();
		},
	};
}

export interface HintResult {
	message: string;
	/** Cells to outline for this level ("r,c" keys). */
	cells?: string[];
}

export interface HintStack {
	/** The board changed: hints are stale, cover them again. */
	cover(): void;
	used(): number;
	setUsed(n: number): void;
}

/**
 * Three stacked cards, all covered. A card only opens after the one before it.
 * The text is worked out at the moment you open it, from the board as it is now.
 */
export function createHintStack(
	root: HTMLElement,
	provide: (level: 1 | 2 | 3) => HintResult | null,
	highlight: (cells: string[]) => void,
	onUsed: (n: number) => void,
): HintStack {
	const cards = Array.from(root.querySelectorAll<HTMLButtonElement>('.hint-card'));
	let used = 0;

	function cover(): void {
		cards.forEach((c, i) => {
			c.dataset.covered = 'true';
			c.disabled = i > 0;
			const body = c.querySelector('.body');
			if (body) body.textContent = '';
		});
		highlight([]);
	}
	cards.forEach((card, i) => {
		card.addEventListener('click', () => {
			if (card.dataset.covered !== 'true' || card.disabled) return;
			const level = (i + 1) as 1 | 2 | 3;
			const result = provide(level);
			const body = card.querySelector('.body');
			if (body) body.textContent = result ? result.message : 'The board is already full. Check it for red cells.';
			card.dataset.covered = 'false';
			highlight(result?.cells ?? []);
			if (cards[i + 1]) cards[i + 1].disabled = false;
			used++;
			onUsed(used);
		});
	});
	cover();
	return {
		cover,
		used: () => used,
		setUsed(n) {
			used = n;
		},
	};
}

export function showBanner(el: HTMLElement, title: string, detail: string): void {
	el.innerHTML = '';
	const t = document.createElement('span');
	t.textContent = title;
	const d = document.createElement('small');
	d.textContent = detail;
	el.append(t, d);
	el.classList.add('show');
}

export function hideBanner(el: HTMLElement): void {
	el.classList.remove('show');
	el.textContent = '';
}

/** Move a roving-tabindex cursor with the arrow keys. */
export function arrowMove(key: string, r: number, c: number, n: number): [number, number] | null {
	if (key === 'ArrowUp') return [Math.max(0, r - 1), c];
	if (key === 'ArrowDown') return [Math.min(n - 1, r + 1), c];
	if (key === 'ArrowLeft') return [r, Math.max(0, c - 1)];
	if (key === 'ArrowRight') return [r, Math.min(n - 1, c + 1)];
	return null;
}
