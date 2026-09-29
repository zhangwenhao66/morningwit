import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderInline } from './inline.ts';

test('escapes html and keeps only links and bold', () => {
	assert.equal(renderInline('a <script>x</script>'), 'a &lt;script&gt;x&lt;/script&gt;');
	assert.equal(renderInline('see [the rules](/fair-hints/) now'), 'see <a href="/fair-hints/">the rules</a> now');
	assert.match(renderInline('[x](https://example.com/a)'), /rel="noopener" target="_blank"/);
	assert.equal(renderInline('**hi**'), '<strong>hi</strong>');
});

test('rejects javascript: urls', () => {
	assert.ok(!renderInline('[x](javascript:alert(1))').includes('<a '));
});
