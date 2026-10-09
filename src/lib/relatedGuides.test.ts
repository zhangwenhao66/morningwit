import test from 'node:test';
import assert from 'node:assert/strict';
import { guides } from '../data/guides.ts';
import { pickRelatedGuides, verifyRelatedGuidesCoverage } from './relatedGuides.ts';

test('every guide retains an inbound recommendation as the library grows', () => {
  for (const count of [2, 5, 20]) {
    const sample = Array.from({ length: count }, (_, i) => ({ ...guides[0], slug: `guide-${i}`, category: i === 1 ? 'Star Battle' : 'Sudoku strategy' }));
    const coverage = verifyRelatedGuidesCoverage(sample);
    assert.deepEqual(coverage.neverLinked, []);
    assert.deepEqual(coverage.emptySidebar, []);
    for (const guide of sample) {
      const related = pickRelatedGuides(sample, guide);
      assert.ok(related.length <= 3);
      assert.ok(related.every((other) => other.slug !== guide.slug));
      assert.equal(new Set(related.map((other) => other.slug)).size, related.length);
    }
  }
});
