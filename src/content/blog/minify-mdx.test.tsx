// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compile } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import { minifyMdxFunctionBody } from '../../../scripts/minify-mdx';

const components = {
  MermaidDiagram: ({ code }: { code: string }) => <pre>{code}</pre>,
};

function renderBody(body: string): string {
  const { default: Content } = new Function(body)(runtime) as {
    default: ComponentType<{ components: typeof components }>;
  };
  return renderToStaticMarkup(createElement(Content, { components }));
}

describe('serialized MDX minification', () => {
  it.each([
    '# A heading\n\nUnicode café 🌲 and **bold** with [a link](https://example.com).',
    '| Name | Value |\n| --- | --- |\n| Example | 42 |\n\n- [x] Done\n- [ ] Pending',
    '```js\nconst text = "quotes and \\\\ slashes";\nconsole.log(text);\n```',
    '<MermaidDiagram code={`flowchart TD\n  A[Start] --> B[Finish]`} />',
  ])('preserves rendered output for %s', async (source) => {
    const compiled = String(await compile(source, {
      outputFormat: 'function-body',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypePrism],
    }));
    const minified = await minifyMdxFunctionBody(compiled);
    expect(minified.length).toBeLessThan(compiled.length);
    // Generated modules serialize this string before the browser executes it.
    expect(renderBody(JSON.parse(JSON.stringify(minified)))).toBe(renderBody(compiled));
  });

  it('preserves the function-body arguments and strict-mode contract', async () => {
    const minified = await minifyMdxFunctionBody('"use strict"; return { value: arguments[0], receiver: this };');
    const execute = new Function(minified);
    const value = { text: 'unchanged' };
    expect(execute(value)).toEqual({ value, receiver: undefined });
  });
});
