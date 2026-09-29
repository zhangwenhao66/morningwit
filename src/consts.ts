export const SITE_TITLE = 'Morningwit';
export const SITE_TAGLINE = 'Small logic puzzles and gentle hints for the morning.';
export const SITE_DESCRIPTION =
	'Play free logic puzzles like Binairo and Star Battle, keep a daily streak, and get step-by-step hints that never spoil more than you ask for.';
export const SITE_ORIGIN = 'https://morningwit.com';
export const CONTACT_EMAIL = 'contact@morningwit.com';

/**
 * When false, every page carries noindex (and public/robots.txt should disallow everything).
 * Flipped to true on 2026-09-29 after Owen approved the look and the custom domain went live.
 */
export const INDEXABLE = true;

/**
 * Ads are Adsterra standard banners only: a 300x250 box and a native banner. No popunders, social bar or smartlinks.
 * AdSense is on hold (account rejected 2026-09-06). Site 6086617 in the Adsterra dashboard, units 31478888 (native) and 31478889 (300x250).
 * Nothing loads for visitors who decline or who have Global Privacy Control on; see the consent script in Layout.astro.
 */
export const ADS_ENABLED = true;
/**
 * Off on purpose (2026-09-30): in the first test the native banner served dating bait with suggestive thumbnails on a puzzle site,
 * even with adult ads switched off in the Adsterra dashboard. The 300x250 box is the only unit shown. Turn on to try it again.
 */
export const NATIVE_ADS = false;
export const ADSTERRA = {
	nativeHost: 'pl31579387.profitableratecpmnetwork.com',
	nativeKey: '9a5985a073ddaf4f28f61132e7997f62',
	rectKey: '7316a09c84e195d0287d43809b3bb4d4',
} as const;

export const GAMES = [
	{
		slug: 'binairo',
		name: 'Binairo',
		short: 'Fill the grid with suns and moons. No three in a row.',
		href: '/play/binairo/',
	},
	{
		slug: 'sudoku',
		name: 'Sudoku',
		short: 'Classic 9x9 with notes and hints that name the technique.',
		href: '/play/sudoku/',
	},
	{
		slug: 'star-battle',
		name: 'Star Battle',
		short: 'One star per row, column and region. Stars never touch.',
		href: '/play/star-battle/',
	},
] as const;
