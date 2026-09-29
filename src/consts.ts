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

/** No ad code is loaded anywhere. AdSense is on hold (account rejected 2026-09-06). */
export const ADS_ENABLED = false;

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
