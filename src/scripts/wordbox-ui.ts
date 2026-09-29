// The word box page: four inputs of three letters, a drawing of the box, layered hints and a list of answers.
// Everything runs in the browser. The word list is one static file that is fetched the first time it is needed.

import { read, write } from './store.ts';
import { createHintStack, showBanner, hideBanner } from './game-shell.ts';
import { checkBox, parseWords, solve, hintFor, makeBox, type Entry, type Solution } from '../lib/wordbox.ts';
import { makeRng } from '../lib/rng.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const POS: Array<[number, number]> = [
	[100, 50], [150, 50], [200, 50], // top, left to right
	[250, 100], [250, 150], [250, 200], // right, top to bottom
	[100, 250], [150, 250], [200, 250], // bottom, left to right
	[50, 100], [50, 150], [50, 200], // left, top to bottom
];
const PAGE = 20;

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number>, text?: string): SVGElementTagNameMap[K] {
	const n = document.createElementNS(SVG_NS, name);
	for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
	if (text !== undefined) n.textContent = text;
	return n;
}

export function mountWordBox(root: HTMLElement): void {
	const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('.wb-field input'));
	const svg = root.querySelector<SVGSVGElement>('#wb-svg')!;
	const status = root.querySelector<HTMLElement>('#wb-status')!;
	const banner = root.querySelector<HTMLElement>('#banner')!;
	const answersBox = root.querySelector<HTMLElement>('#wb-answers')!;
	const list = root.querySelector<HTMLOListElement>('#wb-list')!;
	const reveal = root.querySelector<HTMLButtonElement>('#wb-reveal')!;
	const more = root.querySelector<HTMLButtonElement>('#wb-more')!;
	const example = root.querySelector<HTMLButtonElement>('#wb-example')!;
	const clear = root.querySelector<HTMLButtonElement>('#wb-clear')!;
	const hintsRoot = root.querySelector<HTMLElement>('#hints')!;
	const live = root.querySelector<HTMLElement>('#wb-hint-live')!;

	let entries: Entry[] | null = null;
	let loading: Promise<Entry[]> | null = null;
	let solutions: Solution[] = [];
	let shown = 0;
	let selected: string[] | null = null;
	let timer: number | undefined;
	let token = 0;

	function loadWords(): Promise<Entry[]> {
		if (entries) return Promise.resolve(entries);
		if (!loading) {
			loading = fetch('/data/words.txt')
				.then((r) => {
					if (!r.ok) throw new Error(`word list: ${r.status}`);
					return r.text();
				})
				.then((t) => {
					entries = parseWords(t);
					return entries;
				})
				.finally(() => {
					loading = null;
				});
		}
		return loading;
	}

	const letters = (): string[] => inputs.map((i) => i.value.replace(/[^a-zA-Z]/g, '').toLowerCase());

	/** Draw the box. `path` is an optional list of words to trace across it. */
	function draw(path: string[] | null): void {
		const vals = letters();
		const flat = vals.join('');
		svg.replaceChildren();
		const t = el('title', { id: 'wb-t' }, 'Word box');
		const d = el('desc', { id: 'wb-d' }, flat.length ? `Letters by side: top ${vals[0]}, right ${vals[1]}, bottom ${vals[2]}, left ${vals[3]}.` : 'Empty box. Type the letters above.');
		svg.append(t, d, el('rect', { class: 'frame', x: 50, y: 50, width: 200, height: 200, rx: 14 }));
		const where = new Map<string, number>();
		vals.forEach((s, side) => [...s].forEach((ch, k) => where.set(ch, side * 3 + k)));
		if (path) {
			let n = 0;
			for (const word of path) {
				const pts = [...word].map((ch) => where.get(ch)).filter((p): p is number => p !== undefined);
				if (pts.length !== word.length) continue;
				svg.append(el('polyline', { class: 'path', points: pts.map((p) => POS[p].join(',')).join(' ') }));
				n++;
				const [x, y] = POS[pts[0]];
				const dx = x === 50 ? -26 : x === 250 ? 26 : 0;
				const dy = y === 50 ? -24 : y === 250 ? 30 : 0;
				svg.append(el('text', { class: 'step', x: x + dx, y: y + dy + 4 }, String(n)));
			}
		}
		for (let side = 0; side < 4; side++) {
			for (let k = 0; k < 3; k++) {
				const p = side * 3 + k;
				const ch = vals[side][k];
				const [x, y] = POS[p];
				svg.append(el('circle', { class: ch ? 'node' : 'node empty', cx: x, cy: y, r: 17 }));
				if (ch) svg.append(el('text', { class: 'letter', x, y: y + 6 }, ch.toUpperCase()));
			}
		}
	}

	const hints = createHintStack(
		hintsRoot,
		(level) => {
			const h = hintFor(solutions, level);
			const message = h ? h.message : 'There is no answer to hint from yet.';
			live.textContent = message;
			return { message, cells: h && level === 3 ? ['open'] : [] };
		},
		(cells) => {
			if (cells.includes('open') && solutions[0]) draw([solutions[0].words[0]]);
			else draw(selected);
		},
		() => {},
	);

	/** Redraw the list. `focusAt` puts keyboard focus back on that item, since the old buttons are replaced. */
	function renderAnswers(focusAt?: number): void {
		list.replaceChildren();
		solutions.slice(0, shown).forEach((s, i) => {
			const li = document.createElement('li');
			const b = document.createElement('button');
			b.type = 'button';
			b.setAttribute('aria-pressed', selected && selected.join() === s.words.join() ? 'true' : 'false');
			b.textContent = s.words.map((w) => w.toUpperCase()).join('  ›  ');
			b.setAttribute('aria-label', `${s.words.join(', then ')}, ${s.words.length} ${s.words.length === 1 ? 'word' : 'words'}`);
			const c = document.createElement('span');
			c.setAttribute('aria-hidden', 'true');
			c.className = 'count';
			c.textContent = `${s.words.length} ${s.words.length === 1 ? 'word' : 'words'}`;
			b.append(c);
			b.addEventListener('click', () => {
				selected = s.words;
				draw(selected);
				renderAnswers(i);
			});
			li.append(b);
			list.append(li);
		});
		more.hidden = shown >= solutions.length;
		if (focusAt !== undefined) list.querySelectorAll<HTMLButtonElement>('button')[focusAt]?.focus();
	}

	async function run(): Promise<void> {
		const my = ++token;
		const check = checkBox(letters());
		solutions = [];
		selected = null;
		hints.cover();
		hintsRoot.inert = true;
		live.textContent = '';
		answersBox.hidden = true;
		reveal.hidden = false;
		list.replaceChildren();
		draw(null);
		const v = letters();
		if (!check.ok) {
			const filled = v.every((s) => s.length === 3);
			status.textContent = filled ? '' : 'Type all twelve letters to get answers.';
			if (filled) showBanner(banner, 'Check the letters', check.error);
			else hideBanner(banner);
			return;
		}
		hideBanner(banner);
		write('wordbox:letters', v);
		status.textContent = entries ? 'Working on it…' : 'Loading the word list (about 350 KB, once)…';
		let list_: Entry[];
		try {
			list_ = await loadWords();
		} catch {
			if (my === token) status.textContent = 'The word list did not load. Check your connection and change a letter to try again.';
			return;
		}
		if (my !== token) return;
		solutions = solve(check.sides, list_);
		if (solutions.length === 0) {
			status.textContent = 'No answer with up to three words uses all twelve letters from this word list. Check the letters for a typo.';
			return;
		}
		const best = solutions[0].words.length;
		const same = solutions.filter((s) => s.words.length === best).length;
		const many = solutions.length >= 400;
		const kind = `${best} ${best === 1 ? 'word' : 'words'}`;
		status.textContent = many
			? `Lots of answers, and the best ones come first. The shortest use ${kind}.`
			: `${solutions.length} ${solutions.length === 1 ? 'answer' : 'answers'} found. The shortest use ${kind} (${same} of them).`;
		shown = Math.min(PAGE, solutions.length);
		hintsRoot.inert = false;
	}

	function schedule(): void {
		window.clearTimeout(timer);
		timer = window.setTimeout(() => void run(), 250);
	}

	inputs.forEach((input, i) => {
		input.addEventListener('input', () => {
			input.value = input.value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
			draw(null);
			if (input.value.length === 3 && inputs[i + 1]) inputs[i + 1].focus();
			schedule();
		});
		input.addEventListener('paste', (e) => {
			const text = (e.clipboardData?.getData('text') ?? '').replace(/[^a-zA-Z]/g, '').toUpperCase();
			if (text.length <= 3) return;
			e.preventDefault();
			// A whole box pasted at once: spread it over the four sides, starting from this field.
			let at = 0;
			for (let k = i; k < inputs.length && at < text.length; k++, at += 3) inputs[k].value = text.slice(at, at + 3);
			draw(null);
			schedule();
		});
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Backspace' && input.value === '' && inputs[i - 1]) inputs[i - 1].focus();
			if (e.key === 'Enter') {
				window.clearTimeout(timer);
				void run();
			}
		});
	});

	reveal.addEventListener('click', () => {
		if (solutions.length === 0) return;
		answersBox.hidden = false;
		reveal.hidden = true;
		renderAnswers(0);
	});
	more.addEventListener('click', () => {
		const first = shown;
		shown = Math.min(shown + PAGE, solutions.length);
		renderAnswers(first);
	});
	example.addEventListener('click', async () => {
		if (!entries) status.textContent = 'Loading the word list (about 350 KB, once)…';
		try {
			const list_ = await loadWords();
			const box = makeBox(makeRng(Math.floor(Math.random() * 4294967296)), list_);
			inputs.forEach((i, n) => (i.value = box.sides[n].toUpperCase()));
			void run();
		} catch {
			status.textContent = 'The word list did not load. Check your connection and try again.';
		}
	});
	clear.addEventListener('click', () => {
		inputs.forEach((i) => (i.value = ''));
		write('wordbox:letters', ['', '', '', '']);
		void run();
		inputs[0].focus();
	});

	const stored = read<unknown>('wordbox:letters', null);
	const saved: string[] = Array.isArray(stored) ? stored.map((x) => (typeof x === 'string' ? x : '')) : ['', '', '', ''];
	inputs.forEach((i, n) => (i.value = (saved[n] ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()));
	draw(null);
	if (saved.join('').length === 12) void run();
	else status.textContent = 'Type all twelve letters to get answers.';
}
