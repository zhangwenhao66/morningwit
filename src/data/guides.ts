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
	{
		slug: 'hidden-pairs-sudoku',
		category: 'Sudoku strategy',
		title: 'Hidden pairs in Sudoku: three boards to try before the answer',
		description:
			'A hidden pair is two digits that fit in only the same two squares of a row, column or box. Try three real boards, then check the answers and how rarely the move is needed.',
		published: '2026-10-07',
		updated: '2026-10-07',
		coreSummary:
			'A hidden pair is two digits that, within one row, column or box, fit in only the same two squares. Those squares must hold exactly those two digits, so every other candidate in them can be crossed out.',
		sections: [
			{
				heading: 'What to look for',
				body: [
					'Pick a row, column or box and find two digits that each have just two places left in it, the same two places for both. Those squares are the hidden pair. They usually list other candidates too, and that is what hides the pair. Those extras are what you remove.',
				],
			},
			{
				heading: 'Try it first',
				body: [
					'Here are three boards. For each, the text says where the two digits can still go and what the squares list, and you decide what has to go before reading the answer.',
					'On Board 1, the digits 1 and 4 fit only in row 8, in column 2 and column 6. Column 2 lists 1, 3 and 4. Column 6 lists 1, 4, 5 and 7.',
					'On Board 2, the digits 5 and 6 fit only in row 1, in column 3 and column 5. Column 3 lists 2, 5, 6, 7 and 9. Column 5 lists 5, 6 and 9.',
					'On Board 3, the digits 4 and 9 fit only in column 8, in row 1 and row 2. Row 1 lists 4, 5, 6, 7, 8 and 9. Row 2 lists 1, 4, 5, 6, 7 and 9.',
				],
			},
			{
				heading: 'Board 1, a row',
				body: [
					'Row 8 needs a 1 and a 4, and those two squares are the only places left for them. So the squares hold exactly 1 and 4. The square in column 2 loses its 3, and the one in column 6 loses its 5 and 7. Three candidates gone.',
					'The pictures show pencil marks only for the two squares involved. The rest of each board is left bare.',
				],
				image: {
					src: '/images/sudoku-hidden-pair-4-2.svg',
					alt: 'A Sudoku board with two squares in row 8 outlined. The left one keeps the candidates 1 and 4 with the 3 crossed out. The right one keeps 1 and 4 with the 5 and 7 crossed out.',
				},
			},
			{
				heading: 'Board 2',
				body: [
					'Board 2 is the same move in a row. The square in column 3 loses 2, 7 and 9, and the one in column 5 loses 9. Both squares end up as 5 and 6.',
				],
				image: {
					src: '/images/sudoku-hidden-pair-8-2.svg',
					alt: 'A Sudoku board with two squares in row 1 outlined, in columns 3 and 5. Both keep the candidates 5 and 6. The 2, 7 and 9 in the left square and the 9 in the right square are crossed out.',
				},
			},
			{
				heading: 'Board 3, a column, and the biggest clear-out',
				body: [
					'This one runs down column 8 and removes eight candidates. The square in row 1 loses 5, 6, 7 and 8, and the one in row 2 loses 1, 5, 6 and 7. Both squares end up as 4 and 9.',
				],
				image: {
					src: '/images/sudoku-hidden-pair-133-2.svg',
					alt: 'A Sudoku board with two squares at the top of column 8 outlined. Both keep the candidates 4 and 9, and eight other candidates between them are crossed out.',
				},
			},
			{
				heading: 'Why it holds',
				body: [
					'Back to Board 1: row 8 needs a 1, and only two squares can take it. It needs a 4, and only the same two squares can take it. Two digits and two squares, so each square gets one of them and nothing else fits.',
					'It is the mirror image of a naked pair. A naked pair says two squares list only two candidates between them. A hidden pair says two digits have only two squares between them. In both, the same two squares end up holding the same two digits.',
				],
			},
			{
				heading: 'Where it goes wrong',
				body: [
					'Both digits must be confined to the same two squares. If the 1 fits in two squares of the row and the 4 in three, there is no pair. If a third square can also take the 1, the argument is gone.',
					'A common slip is crossing out the pair digits themselves. In the answers above the 1s and 4s stay and everything else in those squares goes.',
					'And scan by digit across a unit, not square by square. In Board 1 column 6 lists 1, 4, 5 and 7, so looking at that square alone you would never call it a pair.',
				],
			},
			{
				heading: 'How often you need it',
				body: [
					'Of 200 hard boards the game generated, the solver used a hidden pair on 9 (4.5%), so you will rarely need it. It used naked pairs on 166 (83%) and pointing on 171 (85.5%). The solver tries simpler moves first, so these counts say how often a board needed the move at all, not how often it could be spotted.',
					'When you are stuck, run through singles, pointing and naked pairs, then come back here. You can practise on the same kind of board on the [Sudoku page](/play/sudoku/). For another pattern that only clears candidates, see [X-Wing](/learn/x-wing-sudoku/).',
				],
			},
		],
		faq: [
			{
				question: 'What is the difference between a hidden pair and a naked pair?',
				answer:
					'In a naked pair the squares themselves are bare: two squares, two candidates. In a hidden pair the squares look crowded, but two of their digits have nowhere else to go in that group of nine squares. The end result is the same, two squares holding two digits.',
			},
			{
				question: 'Does a hidden pair place a digit?',
				answer: 'Not by itself. It removes candidates. A placement may follow once a square is down to one candidate or a digit has one home left.',
			},
			{
				question: 'Can a hidden pair sit in a box?',
				answer: 'Yes. Rows, columns and boxes all work. The boards here use a row and a column.',
			},
			{
				question: 'Is there a hidden triple?',
				answer: 'Yes, the same idea with three digits and three squares. It is harder to spot, and the solver on this site does not use it.',
			},
		],
		sources: [{ label: 'Hidden Pairs, Learn-Sudoku', url: 'https://www.learn-sudoku.com/hidden-pairs.html' }],
	},
	{
		slug: 'how-to-solve-hard-sudoku-without-guessing',
		category: 'Sudoku strategy',
		title: 'How to solve a hard Sudoku without guessing, one board from start to finish',
		description:
			'On hard boards, singles and pointing get you most of the way and a pair or triple usually finishes the job. Follow one real board from 26 givens to the end, with counts from 200.',
		published: '2026-10-08',
		updated: '2026-10-08',
		coreSummary:
			"Work in a fixed order: singles first, then pointing and claiming, then pairs and triples. On 200 hard boards from this site's game, none finished on singles, pointing and claiming alone, 193 finished once pairs, triples and hidden pairs were allowed, and the last 7 needed an X-Wing. No board needed a guess.",
		sections: [
			{
				heading: 'Which moves hard boards use',
				body: [
					"Hard boards add a few moves that easy ones never need. Here is how often a solver working through 200 hard boards from this site's game (seeds 1000 to 1199) needed each move at least once.",
					'Singles, naked and hidden, appeared on all 200 boards. Pointing appeared on 171 (85.5%), naked pairs on 166 (83%), claiming on 98 (49%), naked triples on 49 (24.5%), hidden pairs on 9 (4.5%) and X-Wing on 7 (3.5%).',
					'The solver always tries the simpler move first, so these counts show how often a board needed a move at all, not how often you could spot one. All 200 boards finished with these moves and no trial and error.',
					'That list is also your search order. Check singles, then pointing and claiming, then pairs, and only then look for anything rarer.',
				],
			},
			{
				heading: 'One board from the start',
				body: [
					'Board 1000 from that run has 26 givens and 55 empty squares.',
					'The first stretch is plain: naked and hidden singles go in one after another. Along the way the solver found three pointing moves, each time a digit confined to one line of a box wiping that digit from the rest of the line. By step 34 it had placed 31 digits, and 24 squares were still empty.',
				],
				image: {
					src: '/images/sudoku-hard-1000-1.svg',
					alt: 'A 9 by 9 Sudoku at the start, with 26 digits given and 55 empty squares.',
				},
			},
			{
				heading: 'Where it stalled, and the move that freed it',
				body: [
					'At that point no single, pointing or claiming move was left. This is where people reach for a guess. The top-middle box has a way out.',
					'Two squares in it, row 2 column 5 and row 3 column 6, can hold only 1 and 9. Those two squares must use up the 1 and the 9 between them, so neither digit can sit anywhere else in the box. The other three empty squares lose five candidates in all, and row 2 column 4 is left with just the 5.',
					'That is a naked pair, the only move of its kind on the whole board.',
				],
				image: {
					src: '/images/sudoku-hard-1000-2.svg',
					alt: 'The same Sudoku with 24 empty squares. In the top-middle box the two outlined squares hold only 1 and 9, and the 1s and 9s in the other three empty squares of the box are crossed out in red.',
				},
			},
			{
				heading: 'After the pair',
				body: [
					'The 5 went in, and the rest of the board followed. Steps 36 to 59 were all naked singles, 24 digits in a row with no choices left. The whole board took 59 steps: 55 digits placed, three pointing moves and one pair.',
					'Singles did 55 of those 59 steps. The pair mattered only because it came at the moment singles ran dry.',
				],
			},
			{
				heading: 'How far the ordered list goes',
				body: [
					'On the same 200 hard boards, a solver limited to singles, pointing and claiming finished none of them. Allowing naked pairs and triples and hidden pairs, it finished 193. The last 7 also needed an X-Wing, covered in [the X-Wing guide](/learn/x-wing-sudoku/).',
					'On boards like these, the gap between stuck and solved is almost always a pair or a triple, so look there before anything exotic. If the pair is hiding, [the hidden pairs guide](/learn/hidden-pairs-sudoku/) has three boards to practise on.',
					'Those numbers say which techniques a board needs. For where its moves actually go, and how few of them remove anything, see [how to solve Sudoku quickly](/learn/how-to-solve-sudoku-quickly/).',
				],
			},
			{
				heading: 'When the list runs out',
				body: [
					'Boards from the game are checked so that a person-style solver can finish them. Puzzles from elsewhere carry no such promise. In a separate test of 300 random one-solution boards requested with 24 givens, the same solver with its four levels of technique finished 190. Adding Skyscraper and Y-Wing finished another 34, and 76 stayed unsolved. If you hit one of those, the cause may be a pattern outside this list rather than something you missed.',
					'For everyday hard boards the habit is simple: after every removal, rescan for singles before you reach for a new idea. You can try it on a board with named hints on the [Sudoku page](/play/sudoku/).',
				],
			},
		],
		faq: [
			{
				question: 'Can every hard Sudoku be solved without guessing?',
				answer:
					'Every one of the 200 hard boards tested here could, using singles, pointing, claiming, pairs, triples, hidden pairs and X-Wing. Puzzles from other sources can need patterns beyond that list.',
			},
			{
				question: 'What should I try first on a hard Sudoku?',
				answer: 'Singles. Rescan for new ones after each removal, and only when they run out do the heavier patterns come in.',
			},
			{
				question: 'How many steps does a hard Sudoku take?',
				answer: 'About 60 on the game\'s hard boards. Board 1000 took 59: 55 digits placed and four removals. Most of the work is singles.',
			},
			{
				question: 'Is a naked pair a guess?',
				answer: 'No. The two squares can hold only the same two digits, so those digits cannot appear elsewhere in the unit. Nothing is tried and undone.',
			},
		],
		sources: [{ label: 'Naked Pairs, Learn-Sudoku', url: 'https://www.learn-sudoku.com/naked-pairs.html' }],
	},

{
  slug: "skyscraper-sudoku",
  category: "Sudoku strategy",
  title: "Skyscraper Sudoku: prove the move with two possible cases",
  description: "See why a Skyscraper removes candidates in Sudoku. Two conditional diagrams prove the move on a generated board, with the exact cells to cross out.",
  published: "2026-10-09",
  updated: "2026-10-09",
  coreSummary: "A Skyscraper uses one digit with exactly two candidate cells in each of two rows or columns. One candidate from each line shares a crossing line. At least one of the other two cells, the roofs, must hold the digit, so you can remove it from any outside cell that sees both roofs.",
  sections: [
    {
      heading: "Four cells, with one end lined up",
      body: [
        "On the example board, row 4 has only two places for 2: r4c6 and r4c7. Row 9 also has only two: r9c4 and r9c7. Here r4c6 means row 4, column 6; count from the top and left.",
        "The two cells in column 7 are the bases. The other two cells, r4c6 and r9c4, are the roofs. Focus on the candidate 2. Each cell can still contain other digits.",
        "This position comes from the Morningwit raw generator, seed 3, requested with 24 givens. It actually produced 26 givens because the generator keeps a unique solution. The diagram shows the later position where the logic solver finds a Skyscraper, after earlier moves. These raw boards are outside the set served by the game."
      ],
      image: {
        src: "/images/sudoku-skyscraper-3-1.svg",
        alt: "Sudoku position with the four Skyscraper cells outlined. Rows 4 and 9 each have two candidates for 2, sharing column 7."
      }
    },
    {
      heading: "Case A: put 2 in the upper base",
      body: [
        "Suppose r4c7 is 2. Column 7 cannot contain another 2, so r9c7 cannot be 2. Row 9 has only one place left for it: r9c4, the lower roof.",
        "The filled 2s in this diagram are conditional placements for the proof. They are not instructions to fill those cells on your board."
      ],
      image: {
        src: "/images/skyscraper-case-a.svg",
        alt: "Conditional case A: a 2 in row 4 column 7 forces a 2 in row 9 column 4. The four original pattern cells remain outlined."
      }
    },
    {
      heading: "Case B leaves the upper roof",
      body: [
        "Now suppose r4c7 is not 2. Since row 4 has exactly two places for that digit, r4c6 must be 2. That is the upper roof. The lower row is still undecided.",
        "These cases cover both possibilities for r4c7. Case A forces the lower roof; case B forces the upper roof. Therefore at least one roof holds 2. The argument does not say which one, or that exactly one roof is true."
      ],
      image: {
        src: "/images/skyscraper-case-b.svg",
        alt: "Conditional case B: ruling out 2 in row 4 column 7 forces a 2 in row 4 column 6. Row 9 remains undecided."
      }
    },
    {
      heading: "The two pencil marks you can cross out",
      body: [
        "A cell sees another cell when they share a row, column or 3 by 3 box. Any outside cell seeing both roofs would clash with a 2 whichever roof is true.",
        "On this board, r6c4 sees the upper roof r4c6 through the center box and the lower roof r9c4 through column 4. Remove its candidate 2.",
        "The other removal is r8c6: it sees r4c6 through column 6 and r9c4 through the bottom-middle box. Remove its 2 as well. Both removals were checked against the generated unique solution: neither cell contains 2 in that solution.",
        "After removing the two candidates, look again for singles. The Skyscraper itself does not choose a roof or place a digit."
      ],
      image: {
        src: "/images/sudoku-skyscraper-3-2.svg",
        alt: "The original position with candidate 2 crossed out in row 6 column 4 and row 8 column 6. Neither roof has been filled."
      }
    },
    {
      heading: "Where this proof breaks",
      body: [
        "If either starting row has a third candidate for 2, the forced move in the proof can fail. Recount the whole row, including candidates outside the highlighted boxes.",
        "A target must see both roofs. Sharing a unit with just one roof is insufficient. Leave the four pattern cells alone when applying the elimination.",
        "The pattern also works after swapping rows and columns. Unlike the [X-Wing rectangle](/learn/x-wing-sudoku/), these two roofs are in different crossing lines. This is a different scan from checking both ends of a rectangle."
      ]
    },
    {
      heading: "How often the solver found it",
      body: [
        "A run of sudoku-example.ts on 300 raw boards, seeds 1000 through 1299, requested 24 givens per board. The solver used a Skyscraper in 33 of those solving paths. Its ordering tries simpler techniques first and includes Y-Wing at grade 5, so the count covers solving paths that used the technique. It does not count every pattern present on the boards.",
        "Of those 300 boards, 190 finished within grade 4. Allowing both Skyscraper and Y-Wing finished another 34; 76 still remained unsolved by that set of techniques. The extra 34 cannot be attributed to Skyscraper alone. These figures do not describe the difficulty mix in the [Morningwit Sudoku game](/play/sudoku/), whose generator filters for completion within grade 4."
      ]
    }
  ],
  faq: [
    {
      question: "Do the four cells need only two pencil marks each?",
      answer: "No. Count the places where your chosen digit fits along each whole starting line: there must be two in one line and two in the other. Other digits in those cells do not affect that count."
    },
    {
      question: "Can both roofs contain the digit?",
      answer: "The basic proof guarantees at least one roof. It does not guarantee exactly one. Apply the common-peer elimination without choosing a roof."
    },
    {
      question: "Is trying both cases the same as guessing?",
      answer: "The cases prove one elimination that holds regardless of the upper base. You do not commit to either branch or enter its hypothetical digits on the puzzle."
    }
  ],
  sources: [
    {
      label: "HoDoKu: Single Digit Patterns, Skyscraper",
      url: "https://hodoku.sourceforge.net/en/tech_sdp.php#sk"
    }
  ]
},

{
  slug: "snyder-notation-sudoku",
  category: "Sudoku basics",
  title: "Snyder notation in Sudoku: one board written two ways",
  description: "Snyder notation writes a candidate only where a digit has exactly two possible squares in its box. See one generated board marked both ways, and the counts from 60 more boards.",
  published: "2026-10-12",
  updated: "2026-10-12",
  coreSummary: "Snyder notation is a way of writing pencil marks in which you note a digit inside a 3 by 3 box only when that digit has exactly two possible squares left in the box. Every digit with three or more places to go stays off the board.",
  sections: [
    {
      heading: "The whole rule",
      body: [
        "Full pencil marks means writing, in every empty square, every digit that can still go there. Snyder notation cuts that down with one test, applied box by box. Pick a digit and count the squares inside the box where it could still go. If the answer is exactly two, write the digit in both squares. If it is three or more, write nothing.",
        "That is the entire method. It is named after Thomas Snyder, an American solver and puzzle author who has won the [World Sudoku Championship](https://en.wikipedia.org/wiki/Thomas_Snyder) three times, and the guides that cover it credit him with developing it.",
        "There is no single canonical statement of the rule, and the guides differ at the edges. A few write the test wider and also keep digits that have three squares open. Most use the two-square form, which is the one used here."
      ]
    },
    {
      heading: "Every candidate, all 154 of them",
      body: [
        "The first board is full pencil marks: every empty square carrying its complete candidate list, stacked in the corner, 154 small digits in all.",
        "Nothing you might want later has been thrown away. On a board this open, that is the problem."
      ],
      image: {
        src: "/images/sudoku-snyder-1-1.svg",
        alt: "A generated medium Sudoku at its starting position with full pencil marks. The 32 given digits are large, and every empty square carries its complete candidate list in small digits, 154 in all."
      }
    },
    {
      heading: "The same board in Snyder notation",
      body: [
        "The second board applies the test box by box. All 32 givens are untouched. The small digits drop from 154 to 30.",
        "Seven of the nine boxes contribute at least one mark. The top left and bottom right boxes contribute none, because no digit in those two boxes had exactly two squares open."
      ],
      image: {
        src: "/images/sudoku-snyder-1-2.svg",
        alt: "The same Sudoku starting position with Snyder marks only. The 32 givens are unchanged, and just 30 small digits appear, written only where a digit has exactly two possible squares in its box."
      }
    },
    {
      heading: "Why the count falls so far",
      body: [
        "One board is a single case, so the same test was run over 60 medium boards at their starting positions. Full pencil marks averaged 160.3 digits per board, the lowest 146 and the highest 179. Snyder notation averaged 25.4, between 10 and 40. The marks that survive come to about 16% of the full set.",
        "The arithmetic does most of the explaining. A box holds nine squares, and in a fresh medium puzzle most boxes are still loose. Over the same 60 boards, 26% of the digit and box pairs had exactly two squares open and got marked. Another 10% had just one square open, which is a hidden single waiting to be placed rather than a question of notation. The remaining 64% sat in three or more squares and got nothing written.",
        "The board above is a medium board from the site's own Sudoku generator, the same one behind the game. The averages come from running the same box-by-box test over 60 medium boards, counting one mark for each digit written in each square."
      ]
    },
    {
      heading: "What it drops, and what that costs you",
      body: [
        "Every digit with three or more possible squares is missing, and some of them matter. A pattern that runs along a whole row or column, an [X-Wing](/learn/x-wing-sudoku/) for instance, needs to know every square a digit can occupy. Snyder marks alone do not tell you that. The guides that teach the method describe it as a starting notation for easier boards. One of them notes that it stops helping on sparse or expert grids until you begin placing digits.",
        "A second problem sits inside a single box. Because you have not written every candidate, a square can look like it has only one option left when several others are still possible. A square is only a single once every other digit that could go there has been accounted for, and Snyder marks do not account for them."
      ]
    },
    {
      heading: "Two things that go wrong",
      body: [
        "The two squares have to sit inside the same box. A digit with two possible squares in a row but four inside its box does not qualify, and writing it in produces a mark that means nothing.",
        "Marks also go stale. When you place a digit it stops being a candidate in its row, column and box, so a digit that had three squares inside a box can drop to two and now deserves a mark it did not have a moment ago."
      ]
    },
    {
      heading: "When to switch",
      body: [
        "While the grid is loose, Snyder marks are usually enough and they keep the board readable. Once a move needs the full candidate map, stop adding marks and write the whole box out instead of patching around the gaps.",
        "The [Sudoku game here](/play/sudoku/) has a pencil notes button and an auto-notes button. Auto-notes writes every candidate for you, which is the full-notation shortcut. Play a medium board with the pencil on and count what you write by hand, then compare that with the 30 marks above.",
        "For a board where the full map is the whole point, see [how to solve a hard Sudoku without guessing](/learn/how-to-solve-hard-sudoku-without-guessing/). A pattern that only removes candidates, and needs the complete list to work at all, is covered in [hidden pairs](/learn/hidden-pairs-sudoku/). For how much of a solve those candidate-removing moves account for, see [how to solve Sudoku quickly](/learn/how-to-solve-sudoku-quickly/)."
      ]
    }
  ],
  faq: [
    {
      question: "Is Snyder notation a solving technique?",
      answer: "No. It changes what you write down and nothing else. Every deduction still comes from the ordinary techniques, and the notation only decides which candidates are visible when you look for them."
    },
    {
      question: "Do I mark a digit that fits in two squares of a row but not of its box?",
      answer: "No. The box is what the rule counts. A digit confined to two squares in a row may still have four squares open inside its box, and it gets no mark until the box count itself falls to two."
    },
    {
      question: "Is Snyder notation faster than full pencil marks?",
      answer: "On the starting positions of 60 medium boards it wrote about 16% as many digits, 25.4 against 160.3. Whether that makes solving faster depends on how often you need the candidates it left out."
    },
    {
      question: "Who is Snyder notation named after?",
      answer: "It takes Thomas Snyder's name. He is an American puzzle author and a three-time winner of the world Sudoku title, and he is credited with developing the method."
    }
  ],
  sources: [
    { label: "Thomas Snyder, Wikipedia", url: "https://en.wikipedia.org/wiki/Thomas_Snyder" },
    { label: "How to Use Snyder Notation in Sudoku, Minimal Sudoku", url: "https://www.minimal-sudoku.com/learn/snyder" },
    { label: "How to Use Snyder Notation in Sudoku, SudokuBliss", url: "https://sudokubliss.com/guides/snyder-notation" },
    { label: "Snyder Notation Sudoku, Sudoku Challenges", url: "https://blog.sudokuchallenges.com/learn-to-play/intermediate-sudoku/snyder-notation-sudoku/" }
  ]
},
{
  slug: "how-to-solve-sudoku-quickly",
  category: "Sudoku basics",
  title: "How to solve Sudoku quickly: most of it is placing digits",
  description: "Across 600 generated boards, hard Sudoku puzzles took 59.6 solver moves and only 4.7 of them removed candidates. The rest is placing digits, which is where a faster solve comes from.",
  published: "2026-10-13",
  updated: "2026-10-13",
  coreSummary: "Almost every move in a Sudoku is a digit going into a square. Across 600 boards from this site's own generator, the solver took 41.0 moves on easy, 51.3 on medium and 59.6 on hard, and even the hard boards spent only 4.7 of those moves removing candidates. Solving faster is mostly about placing digits quickly, not about collecting techniques.",
  sections: [
    {
      heading: "Every square gets filled once",
      body: [
        "A Sudoku has 81 squares. Take away the digits printed at the start, and what is left is the number of times you will place a digit. Each empty square gets filled once, and no square gets filled twice.",
        "How much placing is left depends on the printed digits. Over 200 easy boards this site's generator printed 40 of them on average, which leaves 41 empty squares, and the solver finished those boards in 41 moves. Over 200 medium boards it printed 32, leaving 49 squares, and the solver needed 51.3 moves. Over 200 hard boards it printed 26, leaving 55, and the solver needed 59.6.",
        "On the easy boards the placement count is exact. Forty-one empty squares, forty-one placements. The extra moves on the medium and hard boards are the ones that write nothing into the grid."
      ]
    },
    {
      heading: "The moves that remove candidates are rare",
      body: [
        "A move that removes candidates crosses a digit out of a square so that a later placement becomes visible. It puts no digit into the grid. These are the moves the technique guides are built around, and on a finished board they are the smallest part of it.",
        "Easy boards needed none of them. The solver never had to eliminate anything to finish an easy board, because every move it made was a placement. Medium boards averaged 2.3 elimination moves and hard boards 4.7. On a hard board that is under five moves out of about sixty, close to one move in thirteen.",
        "The technique you have been meaning to learn still matters, because on a hard board the last few squares often wait on one of those eliminations. It is just not where the clock goes.",
        "These are move counts, not stopwatch times. They show where a board's work sits, not how long any single move takes you, and a slow move costs more than a fast one."
      ]
    },
    {
      heading: "How much sits on the board",
      body: [
        "The other half of the speed problem is how much sits on the board while you look at it. More empty squares and fewer printed digits means more candidates to read on every pass.",
        "Counting every candidate at the starting position, the same 600 boards carried about 99 on easy, about 159 on medium and about 205 on hard. The board below is a hard board from the site's own generator, seed 1000, with all 200 of its starting candidates written in."
      ],
      image: {
        src: "/images/sudoku-speed-load-1000.svg",
        alt: "A hard Sudoku board from this site's generator at its starting position, with full pencil marks. The 26 given digits are large and 55 empty squares each carry a list of small candidate digits, 200 in all."
      }
    },
    {
      heading: "What saves time",
      body: [
        "Place what is already on the board. On a hard board 55 of the 59.6 moves are placements, so the move you make most is the one worth practising. Before you hunt for a pattern, look for a square with a single candidate left and put the digit in.",
        "Eliminations unlock squares, but they are 4.7 of the 59.6 moves on hard and 2.3 of the 51.3 on medium. Reaching for a technique to fill a square is usually reaching past a placement that was already sitting there.",
        "On an easy board you can skip elimination entirely. The solver finished all 200 easy boards without one elimination move, so when the board is easy the next digit is already on the grid.",
        "Write less when the board is dense. A hard board starts with about 205 candidates against about 99 on an easy one, more than twice as much to read on the same scan. [Snyder notation](/learn/snyder-notation-sudoku/) is one way to cut what you write down."
      ]
    },
    {
      heading: "Two habits worth dropping",
      body: [
        "Studying technique names is not the same as scanning better. The counts put elimination moves under five per hard board, so time spent learning a fifth elimination pattern buys less than time spent getting quicker at spotting a square with one candidate left.",
        "Writing every candidate on an easy board is work you will not use. Those boards took no elimination moves at all, so the full list never gets read, and every extra digit is one more thing to check on the next pass."
      ]
    },
    {
      heading: "What to read next",
      body: [
        "If a hard board is stalling you, the guide on [how to solve a hard Sudoku without guessing](/learn/how-to-solve-hard-sudoku-without-guessing/) lists which techniques those boards actually need and how often. For one of the eliminations that does earn its place, see [hidden pairs](/learn/hidden-pairs-sudoku/), and for a pattern that needs the full candidate map, see [X-Wing](/learn/x-wing-sudoku/).",
        "The numbers above come from the solver behind [the Sudoku game here](/play/sudoku/). Play a hard board with the pencil on, and watch how often you place a digit against how often you cross one out."
      ]
    }
  ],
  faq: [
    {
      question: "How many moves does a Sudoku take?",
      answer: "Over 200 boards of each level, the counts ran 41.0, 51.3 and 59.6 for easy, medium and hard. Nearly all of those moves are digits going in; the rest are eliminations, and a tougher puzzle only adds a handful of them."
    },
    {
      question: "Is it faster to solve with or without pencil marks?",
      answer: "Marks cost you writing and save you guesswork. The trade shifts as puzzles get denser, since a hard starting position carries roughly 205 candidates to read, and trimming your marks can pay off there."
    },
    {
      question: "Do I need advanced techniques to solve quickly?",
      answer: "For the most part, no. The solver's own run needed only 4.7 elimination moves on an average hard puzzle, out of roughly sixty moves total. Techniques matter on the squares that refuse to fall, not across the whole solve."
    },
    {
      question: "Why do hard boards take more moves?",
      answer: "Because a hard puzzle gives you fewer clues to start with, 26 against 40 for an easy one. That leaves more squares to fill, and it throws in a few eliminations as well."
    }
  ],
  sources: [
    { label: "Sudoku techniques, Conceptis", url: "https://www.conceptispuzzles.com/index.aspx?uri=puzzle/sudoku/techniques" },
    { label: "Sudoku Assistant, Solving Techniques, St. Olaf College", url: "https://www.stolaf.edu/people/hansonr/sudoku/explain.htm" }
  ]
},
];
