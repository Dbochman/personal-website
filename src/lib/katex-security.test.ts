// @vitest-environment node
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

// Resolve the exact dependency used by Mermaid, even if npm later nests it.
const require = createRequire(import.meta.url);
const mermaidRequire = createRequire(require.resolve('mermaid'));
const katex = mermaidRequire('katex') as {
  renderToString: (source: string, options?: Record<string, unknown>) => string;
};

describe('Mermaid KaTeX security override', () => {
  it('renders fractions and superscripts with Mermaid’s MathML options', () => {
    const html = katex.renderToString(String.raw`\frac{a^2}{b}`, {
      throwOnError: true, displayMode: true, output: 'mathml',
    });
    expect(html).toContain('<math');
    expect(html).toContain('<mfrac>');
    expect(html).toContain('<msup>');
  });

  it('does not inherit trust from a polluted settings prototype', () => {
    const options = Object.assign(Object.create({ trust: true }), {
      throwOnError: true, displayMode: true, output: 'htmlAndMathml',
    });
    const html = katex.renderToString(String.raw`\href{https://example.com}{unsafe}`, options);
    expect(html).not.toContain('href="https://example.com"');
    expect(html).not.toContain('<a ');
  });
});
