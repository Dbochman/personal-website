import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render, flowchartOptions as defaults } from './flowchart-renderer';

const flowchartOptions = { ...defaults, measurer: { width: (text: string, size: number) => text.length * size * 0.5 } };

const project = readFileSync('src/components/projects/incident-command-diagrams/index.tsx', 'utf8');
const post = readFileSync('content/blog/2026-01-24-retrospectives-that-actually-change-things.txt', 'utf8');
const sources = [...project.matchAll(/code:\s*`([\s\S]*?)`/g), ...post.matchAll(/code=\{`([\s\S]*?)`\}/g)]
  .map(match => match[1]);

describe('flowchart-only Pele renderer', () => {
  it('renders all four production sources and preserves every source node', () => {
    expect(sources).toHaveLength(4);
    for (const source of sources) {
      const { svg, type, width, height } = render(source, flowchartOptions);
      const doc = new DOMParser().parseFromString(svg, 'text/html');
      expect(type).toBe('flowchart');
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      const sourceIds = [...source.matchAll(/\b([A-Z])(?:\[|\{)/g)].map(match => match[1]);
      for (const id of new Set(sourceIds)) {
        expect(doc.querySelector(`.pele-node[data-id="${id}"]`)).not.toBeNull();
      }
      expect(doc.querySelectorAll('a, image, script, foreignObject')).toHaveLength(0);
    }
  });

  it('escapes HTML labels and disables diagram-authored links', () => {
    const source = 'flowchart TD\n A["<img src=x onerror=alert(1)>"] --> B[Done]\n click A "javascript:alert(1)"';
    const { svg, links } = render(source, flowchartOptions);
    const doc = new DOMParser().parseFromString(svg, 'text/html');
    expect(doc.querySelectorAll('script, img, image, foreignObject, a, [onerror], [onclick]')).toHaveLength(0);
    expect(links).toEqual([]);
  });

  it('keeps accessibility metadata with diagram-specific IDs', () => {
    const { svg } = render('flowchart TD\n accTitle: Response steps\n accDescr: Triage then resolve\n A --> B', {
      ...flowchartOptions, idPrefix: 'example',
    });
    const doc = new DOMParser().parseFromString(svg, 'text/html');
    expect(doc.querySelector('title')?.textContent).toBe('Response steps');
    expect(doc.querySelector('desc')?.textContent).toBe('Triage then resolve');
    expect(doc.querySelector('title')?.id).toContain('example');
  });

  it('fails clearly on malformed source or an unregistered diagram type', () => {
    expect(() => render('flowchart TD\n A[unfinished', flowchartOptions)).toThrow();
    expect(() => render('sequenceDiagram\n A->>B: Hello', flowchartOptions)).toThrow(/not supported/i);
  });
});
