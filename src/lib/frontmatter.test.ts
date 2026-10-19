// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter';

describe('YAML frontmatter', () => {
  it('retains dates, quoted strings, nested lists, multiline text and Markdown', () => {
    const source = `---
title: "Notes: a résumé & a café"
date: 2026-10-19
updated: '2026-10-19'
draft: false
summary: |
  First line.
  Second line.
checklist:
  - id: task-1
    completed: true
history:
  - timestamp: 2026-10-19T12:00:00Z
    type: moved
---

# Body

---

<Callout>Keep this MDX intact.</Callout>
`;
    const parsed = parseFrontmatter(source);
    expect(parsed.data).toMatchObject({
      title: 'Notes: a résumé & a café',
      date: new Date('2026-10-19'),
      updated: '2026-10-19',
      draft: false,
      summary: 'First line.\nSecond line.\n',
      checklist: [{ id: 'task-1', completed: true }],
      history: [{ timestamp: new Date('2026-10-19T12:00:00Z'), type: 'moved' }],
    });
    expect(parsed.content).toBe('\n# Body\n\n---\n\n<Callout>Keep this MDX intact.</Callout>\n');
    expect(parseFrontmatter(stringifyFrontmatter(parsed.content, parsed.data))).toEqual(parsed);
  });

  it('accepts BOM, CRLF and YAML language markers without rewriting the body', () => {
    expect(parseFrontmatter('\uFEFF---yaml\r\ntitle: Test\r\n---\r\n\r\nBody\r\n'))
      .toEqual({ data: { title: 'Test' }, content: '\r\nBody\r\n' });
    expect(parseFrontmatter('---yml\ntitle: Test\n---')).toEqual({ data: { title: 'Test' }, content: '' });
  });

  it('handles missing and empty frontmatter', () => {
    expect(parseFrontmatter('# Body\n---\n')).toEqual({ data: {}, content: '# Body\n---\n' });
    expect(parseFrontmatter('---\n# comment\n---\nBody')).toEqual({ data: {}, content: 'Body' });
    expect(stringifyFrontmatter('Body', {})).toBe('Body\n');
  });

  it.each(['First\n\n', 'First\n\n\n', 'First\n  \n', '   '])(
    'preserves trailing whitespace in a final YAML scalar: %j',
    summary => {
      const { data, content } = parseFrontmatter(stringifyFrontmatter('Body\n', { summary }));
      expect(data.summary).toBe(summary);
      expect(content).toBe('Body\n');
    },
  );

  it.each([
    ['---\ntitle: Test', 'Unclosed'],
    ['---\ntitle: [unclosed\n---\n', 'unexpected end'],
    ['---\n- item\n---\n', 'mapping'],
    ['---\njust a string\n---\n', 'mapping'],
    ['---\n2026-10-19\n---\n', 'mapping'],
    ['---\ntitle: one\ntitle: two\n---\n', 'duplicated mapping key'],
    ['---\nfn: !!js/function "function () {}"\n---\n', 'unknown tag'],
  ])('rejects invalid or unsafe metadata: %s', (source, message) => {
    expect(() => parseFrontmatter(source)).toThrow(message);
  });

  it('does not evaluate JavaScript frontmatter or mutate prototypes', () => {
    const source = '---javascript\nthrow new Error("must not execute");\n---\nBody';
    expect(parseFrontmatter(source)).toEqual({ data: {}, content: source });
    const parsed = parseFrontmatter('---\n__proto__: {polluted: true}\n---\n');
    expect(Object.prototype.hasOwnProperty.call(parsed.data, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(parsed.data)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted')).toBe(false);
  });

  it('round-trips all checked-in blog and kanban metadata and bodies', () => {
    const files = ['content/blog', 'content/kanban'].flatMap(dir =>
      readdirSync(dir, { recursive: true, encoding: 'utf8' })
        .filter(file => /\.(txt|md)$/.test(file))
        .map(file => `${dir}/${file}`),
    );
    expect(files.length).toBeGreaterThan(100);
    for (const file of files) {
      const { data, content } = parseFrontmatter(readFileSync(file, 'utf8'));
      const roundTrip = parseFrontmatter(stringifyFrontmatter(content, data));
      expect(roundTrip.data, file).toEqual(data);
      expect(roundTrip.content, file).toBe(content.endsWith('\n') ? content : `${content}\n`);
    }
  });

  it('keeps native Node kanban add/move commands working in an isolated board', () => {
    const directory = mkdtempSync(join(tmpdir(), 'frontmatter-cli-'));
    const board = join(directory, 'content/kanban/test');
    try {
      mkdirSync(board, { recursive: true });
      writeFileSync(join(board, '_board.md'), stringifyFrontmatter('Board notes', {
        id: 'test', title: 'Test', columns: [{ id: 'ideas', title: 'Ideas' }, { id: 'done', title: 'Done' }],
      }));
      const run = (...args: string[]) => {
        const result = spawnSync(process.execPath, [resolve('scripts/kanban-cli.js'), ...args], {
          // Inherit stdio so this integration test also runs in Linux sandboxes
          // that restrict the socket operations used by synchronous stdio pipes.
          cwd: directory, stdio: 'inherit', timeout: 5000,
        });
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
      };
      run('add', '--board=test', '--column=ideas', '--title=Migration test',
        '--description=Keep **Markdown** intact.', '--labels=Security,Test');
      run('move', '--board=test', '--card=migration-test', '--to=done');
      const { data, content } = parseFrontmatter(readFileSync(join(board, 'migration-test.md'), 'utf8'));
      expect(data).toMatchObject({ id: 'migration-test', column: 'done', labels: ['Security', 'Test'] });
      expect(data.history).toHaveLength(2);
      expect(content).toBe('Keep **Markdown** intact.\n');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
