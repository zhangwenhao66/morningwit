import type { Guide } from '../data/guides';

const MAX = 3;

/**
 * "Keep going" list on /learn/<slug>/ (used by src/pages/learn/[slug].astro and
 * tools/verify-related-guides-coverage.mjs, so the page and the coverage check
 * cannot drift apart).
 *
 * Same-category guides first, then the rest in guides.ts order (Array.sort is
 * stable). Never empty as long as the site has at least two guides, which is
 * why check_singleton_category.py (category counts only) is a false alarm here.
 * The catch: the fixed first-N cut-off means guides late in guides.ts may get
 * no inbound link at all once the library grows; the coverage script reports
 * that as neverLinked.
 */
export function pickRelatedGuides<T extends Guide>(allGuides: T[], current: T, max = MAX): T[] {
	return allGuides
		.filter((g) => g.slug !== current.slug)
		.sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category))
		.slice(0, max);
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
