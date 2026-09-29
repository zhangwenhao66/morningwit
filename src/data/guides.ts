// Every page under /learn/ comes from this list. The publishing task adds entries here.
// Same shape as the other sites' guides.ts so the shared checks in run_checks.py can read it.
//
// Body strings allow only two kinds of markup: [text](url) links and **bold**.
// Anything else is shown as plain text. No raw HTML.

export interface SectionImage {
	/** Path under public/, e.g. '/images/x-wing-example.svg'. */
	src: string;
	alt: string;
	/** Attribution + license, supports markdown links. Omit for self-made diagrams. */
	credit?: string;
}

export interface GuideSection {
	heading: string;
	body: string[];
	image?: SectionImage;
}

export interface FaqItem {
	question: string;
	answer: string;
}

export interface Source {
	label: string;
	url: string;
}

export interface Guide {
	slug: string;
	/** Topic group, e.g. "Binairo", "Star Battle", "Sudoku strategy". One group is one cluster. */
	category: string;
	title: string;
	description: string;
	/** Original publication date (YYYY-MM-DD). Falls back to `updated` when unset. */
	published?: string;
	updated: string;
	/** One or two sentences with the direct answer, shown first on the page. */
	coreSummary: string;
	sections: GuideSection[];
	faq?: FaqItem[];
	sources?: Source[];
	image?: string;
	imageAlt?: string;
	imageCredit?: string;
}

export function categorySlug(category: string): string {
	return category
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export const guides: Guide[] = [
	{
		slug: 'x-wing-sudoku',
		category: 'Sudoku strategy',
		title: 'X-Wing in Sudoku: how to spot it and what it clears',
		description:
			'An X-Wing lets you cross a digit out of two whole lines at once. This guide shows why it holds and how to scan for it, with a real board and the four candidates it removes.',
		published: '2026-09-29',
		updated: '2026-09-29',
		coreSummary:
			'An X-Wing is four squares that form a rectangle. One digit has exactly two possible squares in each of two lines, and those squares sit in the same two crossing lines. The digit has to fill one diagonal pair of the rectangle, so it can be crossed out of every other square in the two crossing lines.',
		sections: [
			{
				heading: 'What you are looking for',
				body: [
					'Pick one digit and look only at where it can still go. In two different columns, that digit has exactly two candidate squares each, and both columns use the same two rows. The four squares are the corners of a rectangle. That is an X-Wing.',
					'The pattern works just as well on its side: two rows where the digit has two spots each, both in the same two columns.',
					'On the board below the digit is 9. Columns 6 and 7 each have two squares that can still hold a 9, and in both columns they are in rows 2 and 8. The four highlighted squares are the rectangle.',
				],
				image: {
					src: '/images/sudoku-x-wing-24-1.svg',
					alt: 'A Sudoku board with every square that can still take a 9 marked with a small circle. Four of them, in rows 2 and 8 of columns 6 and 7, are outlined as a rectangle.',
				},
			},
			{
				heading: 'Why it works',
				body: [
					'Column 6 needs exactly one 9, and it can only go in row 2 or row 8. Say it goes in row 2. Then column 7 cannot put its own 9 in row 2, so it has to use row 8. If column 6 puts its 9 in row 8, column 7 takes row 2.',
					'Either way, row 2 gets one of these two 9s and row 8 gets the other. Both rows have their 9 taken care of, so any other 9 in row 2 or row 8 would be a second 9 in the same row. Every other candidate 9 in those two rows can go.',
					'You never have to work out which diagonal is right. The pattern removes candidates while the answer is still open, which is why it helps on a stuck board.',
				],
			},
			{
				heading: 'What it clears on this board',
				body: [
					'In the first picture, apart from the rectangle, row 2 still lists a 9 in columns 3 and 4, and row 8 lists one in columns 4 and 9. Those four candidates are crossed out in the second picture.',
					'The X-Wing places nothing by itself. It only removes pencil marks.',
				],
				image: {
					src: '/images/sudoku-x-wing-24-2.svg',
					alt: 'The same Sudoku board with the rectangle still outlined and four other candidate 9s in rows 2 and 8 crossed out.',
				},
			},
			{
				heading: 'How to scan for one',
				body: [
					'You do not need to hunt for rectangles by eye. Take one digit and go down the columns, counting how many squares can still hold it. Ignore any column with zero, one, or three or more. Among the columns with exactly two, look for a pair whose squares share the same two rows. Then do the same across the rows.',
					'It helps to mark candidates for a single digit across the whole board first, the way the pictures here do. The rectangle is easy to see when only 9s are on show. The auto-notes button on the [Sudoku page](/play/sudoku/) fills in every candidate, and you can ignore all but one digit at a time.',
				],
			},
			{
				heading: 'Mistakes that break it',
				body: [
					'A line with three candidate squares is not an X-Wing, because the argument above needs exactly two choices per line.',
					'The squares also have to line up. Columns 6 and 7 must use the same two rows. If one column uses rows 2 and 8 and the other uses rows 2 and 9, there is no rectangle.',
					'The last mistake is crossing out in the wrong place. In this column-based X-Wing the digit comes out of the two rows. In a row-based one it comes out of the two columns.',
				],
			},
			{
				heading: 'How often you will need it',
				body: [
					'You will need it rarely at first. Of 200 hard boards the game generated, 7 needed an X-Wing. The rest finished with singles, locked candidates and pairs. So the practical order is to run through those first, and reach for an X-Wing when a board has stalled and you would otherwise have to guess.',
				],
			},
		],
		faq: [
			{
				question: 'Does an X-Wing place a digit?',
				answer:
					'No. It removes candidates. Afterwards a square may be left with one candidate, or a digit may have one home in a row, column or box, and that is when it gets placed.',
			},
			{
				question: 'Can an X-Wing use rows as well as columns?',
				answer: 'Yes. The board here uses columns as the base lines and crosses out squares in two rows. Swap rows and columns and everything works the same way.',
			},
			{
				question: 'What is a Swordfish?',
				answer: 'It is the same idea stretched to three lines and three crossing lines. It is harder to see, so learn the X-Wing first.',
			},
		],
		sources: [
			{ label: 'X-Wing Strategy, SudokuWiki', url: 'https://www.sudokuwiki.org/X_Wing_Strategy' },
			{ label: 'Sudoku X-Wing, Learn-Sudoku', url: 'https://www.learn-sudoku.com/x-wing.html' },
		],
	},
];
