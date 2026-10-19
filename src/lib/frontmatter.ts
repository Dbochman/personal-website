import { load, dump } from 'js-yaml';

/** YAML-only frontmatter shared by browser utilities and Node 24 content scripts. */
export function parseFrontmatter(source: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const text = source.replace(/^\uFEFF/, '');
  const opening = /^---(?:yaml|yml)?[\t ]*(?:\r?\n|$)/.exec(text);
  if (!opening) return { data: {}, content: text };

  const rest = text.slice(opening[0].length);
  const closing = /^---[\t ]*(?:\r?\n|$)/m.exec(rest);
  if (!closing) throw new Error('Unclosed YAML frontmatter');

  // js-yaml 4's default schema is safe and retains timestamp -> Date behavior.
  // Unlike gray-matter, this helper never evaluates JavaScript frontmatter.
  const data: unknown = load(rest.slice(0, closing.index));
  if (data != null && (typeof data !== 'object' || Array.isArray(data) || data instanceof Date)) {
    throw new Error('YAML frontmatter must be a mapping');
  }
  return {
    data: (data ?? {}) as Record<string, unknown>,
    content: rest.slice(closing.index + closing[0].length),
  };
}

/** Keep the Markdown body intact and serialize dates, lists and nested metadata. */
export function stringifyFrontmatter(content: string, data: Record<string, unknown>): string {
  // dump includes the terminating newline. Do not trim: |+ block scalars may
  // contain meaningful trailing blank lines or spaces before that newline.
  const yaml = dump(data);
  const header = yaml === '{}\n' ? '' : `---\n${yaml}---\n`;
  return header + (content.endsWith('\n') ? content : `${content}\n`);
}
