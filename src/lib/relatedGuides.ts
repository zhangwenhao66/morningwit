import type { Guide } from '../data/guides';

const MAX = 3;

/**
 * "Keep going" list on /learn/<slug>/ (used by src/pages/learn/[slug].astro and
 * tools/verify-related-guides-coverage.mjs, so the page and the coverage check
 * cannot drift apart).
 *
 * Same-category suggestions fill the list, with one place reserved for the
 * next guide in library order. That ring gives every guide an inbound link as
 * the library grows (2026-10-09: the fifth guide orphaned Star Battle).
 */
export function pickRelatedGuides<T extends Guide>(allGuides: T[], current: T, max = MAX): T[] {
	if (max <= 0 || allGuides.length < 2) return [];
	const next = allGuides[(allGuides.findIndex((g) => g.slug === current.slug) + 1) % allGuides.length];
	const preferred = allGuides
		.filter((g) => g.slug !== current.slug && g.slug !== next.slug)
		.sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category))
		.slice(0, max - 1);
	return [...preferred, next];
}

export interface RelatedGuidesCoverageReport {
	total: number;
	linkedTo: number;
	coveragePct: number;
	emptySidebar: string[];
	neverLinked: string[];
}

/** emptySidebar = pages with no "Keep going" section; neverLinked = guides no other page links to. */
export function verifyRelatedGuidesCoverage<T extends Guide>(allGuides: T[], max = MAX): RelatedGuidesCoverageReport {
	const linkedTo = new Set<string>();
	const emptySidebar: string[] = [];
	for (const guide of allGuides) {
		const related = pickRelatedGuides(allGuides, guide, max);
		if (related.length === 0) emptySidebar.push(guide.slug);
		for (const r of related) linkedTo.add(r.slug);
	}
	const neverLinked = allGuides.map((g) => g.slug).filter((slug) => !linkedTo.has(slug));
	return {
		total: allGuides.length,
		linkedTo: linkedTo.size,
		coveragePct: allGuides.length > 0 ? (linkedTo.size / allGuides.length) * 100 : 100,
		emptySidebar,
		neverLinked,
	};
}
