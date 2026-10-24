import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { publicationBrowserEndpoint } from '../../scripts/prerender-browser.mjs';
import { readFileSync } from 'node:fs';

describe('isolated publication browser', () => {
  it('defaults to installed Chrome and accepts explicit loopback ports', () => {
    assert.equal(publicationBrowserEndpoint(undefined), null);
    assert.equal(publicationBrowserEndpoint('http://127.0.0.1:9222'), 'http://127.0.0.1:9222/');
    assert.equal(publicationBrowserEndpoint('http://localhost:9222'), 'http://localhost:9222/');
  });
  it('rejects remote endpoints, credentials, implicit ports and unexpected URL parts', () => {
    for (const value of ['https://example.com:9222', 'http://example.com:9222',
      'http://127.0.0.1', 'http://user:password@127.0.0.1:9222',
      'http://127.0.0.1:9222/?token=secret', 'http://127.0.0.1:9222/#fragment',
      'http://127.0.0.1:9222/other', 'file:///tmp/browser']) {
      assert.throws(() => publicationBrowserEndpoint(value));
    }
  });
  it('closes only owned browser context and preview server', () => {
    const source = readFileSync(new URL('../../scripts/prerender.mjs', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /pkill|execAsync|previewProcess/);
    assert.ok(source.includes("preview: { host: '127.0.0.1', port: 0, open: false }"));
    assert.ok(source.includes('context = await browser.newContext()'));
    assert.ok(source.includes('await context?.close()'));
    assert.ok(source.includes('await previewServer?.close()'));
  });
});
