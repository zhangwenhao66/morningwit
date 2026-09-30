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
	{
		slug: 'how-to-solve-star-battle-puzzles',
		category: 'Star Battle',
		title: 'How to solve Star Battle puzzles: a 6x6 from the first mark',
		description:
			'Start with the smallest region, then count rows and columns. A 6x6 Star Battle board solved move by move, with how often each idea is needed at 6x6 and 8x8.',
		published: '2026-09-30',
		updated: '2026-09-30',
		coreSummary:
			'Start with a region whose open squares all sit in one row or column, and cross out the rest of that line. Then count how many lines a group of regions fits inside. Once regions are down to one square, place the stars.',
		sections: [
			{
				heading: 'Where to look first',
				body: [
					'The rules fit in two lines, for the version of the puzzle with one star per line. Every row, column and bold region holds exactly one star, and no two stars may touch, not even at a corner.',
					'The smallest regions tell you the most, so start there. On the 6x6 board below, region A is two squares wide and one tall. Its star has to be in row 1, so no other region can put a star in row 1. Cross out the rest of the row.',
					'Region C does the same in column 6, because all its open squares sit in that column. Neither move places a star, but both shrink the board. The solver calls this move "confined". It came up at least once on 197 of 200 generated boards at 8x8.',
				],
				image: {
					src: '/images/star-battle-6-1000-step0-1.svg',
					alt: 'A 6x6 Star Battle board split into six lettered regions. The two squares of region A, in the top left corner of row 1, are outlined in red.',
				},
			},
			{
				heading: 'The move that opens the board',
				body: [
					'Two moves in, the board looks stuck, with no region down to one square. Look at columns instead.',
					'Region A sits in columns 1 and 2. So does region D, the yellow one, every square of it. Two regions, two columns. Each region needs a star, so between them they fill both columns, and no other region can put a star in column 1 or 2. Cross out every other square in those columns.',
					'The solver calls this "group". It is the first move again, counting two regions against two lines.',
				],
				image: {
					src: '/images/star-battle-6-1000-step2-1.svg',
					alt: 'The same board with crosses along row 1 and column 6 from the first two moves. Every square of regions A and D in columns 1 and 2 is outlined in red.',
				},
			},
			{
				heading: 'The rest is bookkeeping',
				body: [
					'After the group move, region E has one open square, row 5 column 3, so the star goes there. Region B is now confined to row 2 and clears the rest of that row. Then C, B, F, D and A each run out of options but one square, in turn. Ten moves in all: four cross-outs and six placements.',
					'The finished board has six stars, one per row, column and region, none touching.',
				],
				image: {
					src: '/images/star-battle-6-1000-step9-2.svg',
					alt: 'The finished 6x6 board with six stars: row 1 column 2, row 2 column 4, row 3 column 6, row 4 column 1, row 5 column 3 and row 6 column 5. Several other squares are crossed out.',
				},
			},
			{
				heading: 'How often the group move shows up',
				body: [
					'On small boards you can often skip it. The solver tries the simpler moves first, and across 200 generated boards per size it ended up using the group move on 39 of the 6x6 boards (19.5%) and 78 of the 8x8 boards (39%). These counts come from solver runs, not from people playing. So on 8x8, expect to need group counting about two times in five.',
				],
			},
			{
				heading: 'When you are stuck',
				body: [
					'Run the checks in this order: a region confined to one row or column, then N regions that fit inside N lines, then any region with one open square. If none fires, look at touching. A star crosses out the eight squares around it, and that can leave another region with a single choice.',
					'Try the same sequence on the [Star Battle page](/play/star-battle/). The hints work in three steps: where to look, what pattern is there, and only then the star.',
				],
			},
		],
		faq: [
			{
				question: 'Where should I start on a Star Battle puzzle?',
				answer:
					'Look for a region that is boxed into a single line, and small ones usually are. Its star must land in that line, so nothing else in that line can hold one.',
			},
			{
				question: 'Can two stars touch diagonally?',
				answer: 'No. Stars cannot sit in cells that share an edge or a corner.',
			},
			{
				question: 'How do I know a group move applies?',
				answer:
					'Count the regions and the lines. If N regions fit entirely inside N rows or N columns, their stars fill those lines and everything else in them can go.',
			},
			{
				question: 'Do you ever have to guess?',
				answer:
					'Not on this site. The board above was completed by the solver with these moves and no guessing, and the boards here are generated so that logic is enough.',
			},
		],
		sources: [
			{ label: 'Star Battle Rules and Info, The Art of Puzzles (GM Puzzles)', url: 'https://www.gmpuzzles.com/blog/star-battle-rules-and-info/' },
		],
	},
];
