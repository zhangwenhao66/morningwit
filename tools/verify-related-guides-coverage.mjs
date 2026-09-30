#!/usr/bin/env node
// Verifies src/lib/relatedGuides.ts gives every guide a non-empty related-guides
// sidebar AND at least one inbound link from someone else's sidebar (no orphan
// pages), across the full current guides.ts. The page template imports the same
// function, so this measures what visitors get. Run after changing the selection
// logic or adding guides. run_checks.py runs it automatically (pre step of
// check_singleton_category.py) and feeds the result to that check.
//
// Usage:
//   node tools/verify-related-guides-coverage.mjs
//   node tools/verify-related-guides-coverage.mjs --json > coverage.json
//
// Exit code: 0 if emptySidebar and neverLinked are both empty, 1 otherwise.
import { guides } from '../src/data/guides.ts';
import { verifyRelatedGuidesCoverage } from '../src/lib/relatedGuides.ts';

const report = verifyRelatedGuidesCoverage(guides);
const asJson = process.argv.includes('--json');

if (asJson) {
	console.log(JSON.stringify(report, null, 2));
} else {
	console.log(
		`total=${report.total} linkedTo=${report.linkedTo} coverage=${report.coveragePct.toFixed(1)}%`,
	);
	console.log('emptySidebar (page renders no related-guides section):', report.emptySidebar);
	console.log('neverLinked (orphan: nobody links to this guide):', report.neverLinked);
}

const ok = report.emptySidebar.length === 0 && report.neverLinked.length === 0;
if (!asJson) {
	console.log(ok ? '\nPASS: 100% coverage, no orphan pages.' : '\nFAIL: see lists above.');
}
process.exit(ok ? 0 : 1);
