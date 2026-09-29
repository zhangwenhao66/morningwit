// Everything the player saves lives in this browser only (localStorage).
// Every call is wrapped: private windows and blocked storage must not break a game.

import { todayKey } from '../lib/rng.ts';

const P = 'mw:v1:';

export function read<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(P + key);
		return raw === null ? fallback : (JSON.parse(raw) as T);
	} catch {
		return fallback;
	}
}

export function write(key: string, value: unknown): void {
	try {
		localStorage.setItem(P + key, JSON.stringify(value));
	} catch {
		/* storage unavailable: play on without saving */
	}
}

export function remove(key: string): void {
	try {
		localStorage.removeItem(P + key);
	} catch {
		/* ignore */
	}
}

export type DayStatus = 'going' | 'done';

function dayBefore(key: string): string {
	const [y, m, d] = key.split('-').map(Number);
	return todayKey(new Date(y, m - 1, d - 1));
}

interface Streak {
	last: string;
	count: number;
}

export function markGoing(game: string, date = todayKey()): void {
	const cur = read<DayStatus | null>(`day:${game}:${date}`, null);
	if (cur !== 'done') write(`day:${game}:${date}`, 'going');
}

/** Record a solved puzzle; keeps a per-game streak and an overall streak. */
export function markDone(game: string, date = todayKey()): void {
	write(`day:${game}:${date}`, 'done');
	for (const scope of [game, 'all']) {
		const s = read<Streak>(`streak:${scope}`, { last: '', count: 0 });
		if (s.last === date) continue;
		write(`streak:${scope}`, { last: date, count: s.last === dayBefore(date) ? s.count + 1 : 1 });
	}
}

/** Streak still counts if the last solve was today or yesterday. */
export function streakOf(scope: string, date = todayKey()): number {
	const s = read<Streak>(`streak:${scope}`, { last: '', count: 0 });
	return s.last === date || s.last === dayBefore(date) ? s.count : 0;
}

export function statusOf(game: string, date = todayKey()): DayStatus | null {
	return read<DayStatus | null>(`day:${game}:${date}`, null);
}
