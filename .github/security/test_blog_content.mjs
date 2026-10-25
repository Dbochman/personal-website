import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requirePlainMarkdown } from './blog-content-check.mjs';

test('normal post metadata, links, fenced code and literal inline code remain content', () => {
  requirePlainMarkdown('---\ntitle: Example\ndraft: false\n---\n# Heading\n\n[link](/blog)\n\n' +
    '```js\nimport fs from "node:fs";\n{danger()}\n```\n\n`<Component />` and **text**.');
});
for (const source of [
  'import fs from "node:fs"\n\nHello',
  'export const x = 1\n\nHello',
  '{process.exit()}', 'Text {danger()} here', '<Component />',
  '<div>hello</div>', '<script>alert(1)</script>',
  '> nested {danger()}', '- list\n  <Component />',
]) {
  test(`rejects executable/HTML syntax: ${source.slice(0, 35)}`, () => {
    assert.throws(() => requirePlainMarkdown(source));
  });
}
