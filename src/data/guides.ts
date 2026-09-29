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

export const guides: Guide[] = [];
