// Worked examples for Star Battle and Binairo guides, computed from the solvers (nothing typed by hand).
// Usage:
//   node tools/puzzle-example.ts star   --size 8 --seed 3 [--tech confined] [--step 7] [--out public/images] [--write]
//   node tools/puzzle-example.ts binairo --size 8 --seed 5 [--tech sandwich] [--step 4] [--out public/images] [--write]
// Without --write it only prints the solver's steps and the facts a guide may quote.
// With --write it also draws the board before and after the chosen step (or the first step of --tech).
// Stat mode: `--stats 200 [--from 1000]` prints how many boards of that size need each technique.

import { writeFileSync, mkdirSync } from 'node:fs';
import { generateLogical as star, solveByLogic, type Cell as SCell } from '../src/lib/starbattle-logic.ts';
import { generateLogical as bin, solveBinairoByLogic } from '../src/lib/binairo-logic.ts';
import { cloneGrid, EMPTY, symbolName, type Difficulty } from '../src/lib/binairo.ts';
import { starBattleSvg, binairoSvg } from '../src/lib/diagram.ts';

const args = process.argv.slice(2);
const kind = args[0];
const opt = (k: string, d: string): string => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const size = Number(opt('--size', '8'));
const seed = Number(opt('--seed', '1'));
const tech = opt('--tech', '');
const stepOpt = opt('--step', '');
const out = opt('--out', 'public/images');
const write = args.includes('--write');
const stats = Number(opt('--stats', '0'));
const from = Number(opt('--from', '1000'));
const level = opt('--difficulty', 'medium') as Difficulty;

if (kind !== 'star' && kind !== 'binairo') {
	console.error('first argument must be star or binairo');
	process.exit(2);
}

if (stats > 0) {
	const count: Record<string, number> = {};
	let solved = 0;
	for (let s = from; s < from + stats; s++) {
		const used = new Set<string>();
		if (kind === 'star') {
			const p = star(size, s);
			const r = solveByLogic(p);
			if (r.solved) solved++;
			r.steps.forEach((t) => used.add(t.technique));
		} else {
			const p = bin(size, s, level);
			const r = solveBinairoByLogic(p.givens);
			if (r.solved) solved++;
			r.steps.forEach((t) => used.add(t.technique));
		}
		used.forEach((t) => (count[t] = (count[t] ?? 0) + 1));
	}
	console.log(JSON.stringify({ kind, size, boards: stats, from, solved, boardsUsingTechnique: count }, null, 1));
	process.exit(0);
}

mkdirSync(out, { recursive: true });

if (kind === 'star') {
	const p = star(size, seed);
	const res = solveByLogic(p);
	res.steps.forEach((s, i) => console.log(i, s.technique, s.kind, s.message));
	const idx = stepOpt !== '' ? Number(stepOpt) : res.steps.findIndex((s) => s.technique === tech);
	console.log({ seed, size, solved: res.solved, grade: res.grade, steps: res.steps.length, chosen: idx });
	if (write && idx >= 0) {
		const stars: SCell[] = [];
		const crossed: SCell[] = [];
		for (let i = 0; i < idx; i++) {
			const s = res.steps[i];
			if (s.kind === 'place' && s.place) stars.push(s.place);
			else if (s.cross) crossed.push(...s.cross);
		}
		const st = res.steps[idx];
		const base = `${out}/star-battle-${size}-${seed}-step${idx}`;
		writeFileSync(`${base}-1.svg`, starBattleSvg(p, { stars, crossed, highlight: st.focus, title: `Star Battle ${size} by ${size}, before the step`, desc: st.idea ?? st.message }));
		const after = st.kind === 'place' && st.place ? { stars: [...stars, st.place], crossed } : { stars, crossed: [...crossed, ...(st.cross ?? [])] };
		writeFileSync(`${base}-2.svg`, starBattleSvg(p, { ...after, highlight: st.focus, title: `Star Battle ${size} by ${size}, after the step`, desc: st.message }));
		console.log('wrote', `${base}-1.svg`, `${base}-2.svg`, JSON.stringify({ message: st.message, focus: st.focus, place: st.place, cross: st.cross }));
	}
} else {
	const p = bin(size, seed, level);
	const res = solveBinairoByLogic(p.givens);
	res.steps.forEach((s, i) => console.log(i, s.technique, `r${s.r + 1}c${s.c + 1}=${symbolName(s.value)}`, s.message));
	const idx = stepOpt !== '' ? Number(stepOpt) : res.steps.findIndex((s) => s.technique === tech);
	console.log({ seed, size, difficulty: level, solved: res.solved, grade: res.grade, steps: res.steps.length, chosen: idx });
	if (write && idx >= 0) {
		const g = cloneGrid(p.givens);
		for (let i = 0; i < idx; i++) g[res.steps[i].r][res.steps[i].c] = res.steps[i].value;
		const fixed: SCell[] = [];
		p.givens.forEach((row, r) => row.forEach((v, c) => v !== EMPTY && fixed.push([r, c])));
		const st = res.steps[idx];
		const base = `${out}/binairo-${size}-${seed}-step${idx}`;
		writeFileSync(`${base}-1.svg`, binairoSvg(g, { fixed, highlight: st.focus, title: `Binairo ${size} by ${size}, before the step`, desc: st.idea }));
		const g2 = cloneGrid(g);
		g2[st.r][st.c] = st.value;
		writeFileSync(`${base}-2.svg`, binairoSvg(g2, { fixed, highlight: [[st.r, st.c]], title: `Binairo ${size} by ${size}, after the step`, desc: st.message }));
		console.log('wrote', `${base}-1.svg`, `${base}-2.svg`, JSON.stringify({ message: st.message, focus: st.focus }));
	}
}
