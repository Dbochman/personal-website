#!/usr/bin/env node
/**
 * Sync recent git commits into the kanban changelog column.
 *
 * Hybrid behavior:
 *   1. If a commit matches an existing card (by `PR #N` label or slug-equals-id),
 *      move that card to the `changelog` column.
 *   2. Otherwise, if the commit is `feat:`, `fix:`, `perf:`, or carries a
 *      `[changelog]` tag, create a new card directly in `changelog`.
 *   3. Everything else (chore/deps/docs/ci/style/test/refactor without flag,
 *      dependabot, daily analytics, [skip-changelog]) is ignored.
 *
 * Usage:
 *   node scripts/sync-changelog.js --range=<sha1>..<sha2>      (preferred)
 *   node scripts/sync-changelog.js --since=<sha>               (sha..HEAD)
 *   node scripts/sync-changelog.js --commits=<sha1>,<sha2>,... (explicit list)
 *   node scripts/sync-changelog.js --dry-run                   (print, don't write)
 *   node scripts/sync-changelog.js --board=roadmap             (default: roadmap)
 *
 * Exits 0 on success even when no actions are taken.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = './content/kanban';
const TARGET_COLUMN = 'changelog';

const SKIPPED_TYPES = new Set(['chore', 'deps', 'docs', 'ci', 'build', 'style', 'test', 'refactor']);
const NEW_CARD_TYPES = new Set(['feat', 'fix', 'perf']);

const TYPE_LABEL = {
  feat: 'Feature',
  fix: 'Bugfix',
  perf: 'Performance',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { board: 'roadmap', dryRun: false };
  for (const arg of args) {
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      out[k] = v ?? true;
    }
  }
  return out;
}

function toISOString(value) {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: 'utf-8' }).trim();
}

function resolveCommitRange(opts) {
  if (opts.commits) return opts.commits.split(',').filter(Boolean);

  let range;
  if (opts.range) range = opts.range;
  else if (opts.since) range = `${opts.since}..HEAD`;
  else range = 'HEAD~1..HEAD';

  const out = git(`log --format=%H --no-merges ${range}`);
  return out.split('\n').filter(Boolean);
}

function getCommitInfo(sha) {
  // %an = author name, %ae = author email, %s = subject, %b = body, %aI = author date ISO
  const fmt = '%an%x09%ae%x09%aI%x09%s%x1e%b';
  const out = execSync(`git log -1 --format=${JSON.stringify(fmt)} ${sha}`, { encoding: 'utf-8' });
  const [meta, body = ''] = out.split('\x1e');
  const [authorName, authorEmail, rawDate, subject] = meta.split('\t');
  // Normalize to UTC ISO so the kanban schema's date validator (which
  // requires `Z` or no offset) accepts it. %aI includes a timezone offset.
  const date = new Date(rawDate).toISOString();
  return { sha, authorName, authorEmail, date, subject, body: body.trim() };
}

// Lazily-built map: historical-blog-path → current-slug. Populated on first
// call by walking each current blog post's --follow history backward.
let _blogRenameMap = null;
function getBlogRenameMap() {
  if (_blogRenameMap) return _blogRenameMap;
  _blogRenameMap = new Map();
  try {
    const currentFiles = execSync('ls content/blog/*.txt 2>/dev/null', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    for (const currentPath of currentFiles) {
      const slug = currentPath.replace(/^content\/blog\//, '').replace(/\.txt$/, '');
      try {
        const paths = execSync(
          `git log --follow --format= --name-only -- "${currentPath}"`,
          { encoding: 'utf-8' }
        )
          .trim()
          .split('\n')
          .filter(Boolean);
        for (const p of new Set(paths)) {
          if (/^content\/blog\/[^/]+\.txt$/.test(p)) _blogRenameMap.set(p, slug);
        }
      } catch {
        /* skip this file */
      }
    }
  } catch {
    /* empty map */
  }
  return _blogRenameMap;
}

function resolveCurrentBlogSlug(originalSlug) {
  const file = `content/blog/${originalSlug}.txt`;
  if (existsSync(file)) return originalSlug;
  const map = getBlogRenameMap();
  return map.get(file) || originalSlug;
}

function getAddedBlogPosts(sha) {
  // List files added in this commit under content/blog/*.txt
  try {
    // -M detects renames so a rename isn't counted as an add.
    const out = execSync(
      `git diff-tree --no-commit-id --name-only --diff-filter=A -M -r ${sha}`,
      { encoding: 'utf-8' }
    ).trim();
    if (!out) return [];
    return out
      .split('\n')
      .filter((f) => /^content\/blog\/[^/]+\.txt$/.test(f))
      .map((f) => f.replace(/^content\/blog\//, '').replace(/\.txt$/, ''))
      .map(resolveCurrentBlogSlug);
  } catch {
    return [];
  }
}

function parseConventional(subject) {
  // type(scope)!: subject  →  { type, scope, breaking, message }
  const m = subject.match(/^([a-z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  if (!m) return null;
  return { type: m[1], scope: m[2] || null, breaking: !!m[3], message: m[4] };
}

function extractPrNumber(subject) {
  const m = subject.match(/\(#(\d+)\)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

function classifyCommit(commit) {
  const { authorName, authorEmail, subject, body } = commit;
  const text = `${subject}\n${body}`;

  if (authorName === 'dependabot[bot]' || authorEmail.includes('dependabot')) {
    return { action: 'skip', reason: 'dependabot' };
  }
  if (/\[skip[- ]?changelog\]/i.test(text) || /\[skip ci\]/i.test(text)) {
    return { action: 'skip', reason: 'flag' };
  }
  if (/^chore:\s*daily analytics/i.test(subject) || /^chore:\s*weekly/i.test(subject)) {
    return { action: 'skip', reason: 'automated-update' };
  }
  if (/^chore\(changelog\)/i.test(subject)) {
    return { action: 'skip', reason: 'self-commit' };
  }

  const conv = parseConventional(subject);
  const hasFlag = /\[changelog\]/i.test(text);

  // Always try to match existing cards first, regardless of type.
  // The classifier here only decides what to do when no match is found.
  if (!conv) {
    return { action: 'try-match-only', conv: null, hasFlag };
  }

  if (NEW_CARD_TYPES.has(conv.type) || hasFlag) {
    return { action: 'try-match-or-create', conv, hasFlag };
  }
  if (SKIPPED_TYPES.has(conv.type) && !hasFlag) {
    return { action: 'try-match-only', conv, hasFlag };
  }
  return { action: 'try-match-or-create', conv, hasFlag };
}

async function loadBoardMeta(boardId) {
  const boardPath = join(CONTENT_DIR, boardId, '_board.md');
  if (!existsSync(boardPath)) throw new Error(`Board not found: ${boardId}`);
  const content = await readFile(boardPath, 'utf-8');
  const { data } = matter(content);
  return data;
}

async function loadCards(boardId) {
  const boardDir = join(CONTENT_DIR, boardId);
  const files = await readdir(boardDir);
  const cards = [];
  for (const file of files) {
    if (!file.endsWith('.md') || file === '_board.md') continue;
    const content = await readFile(join(boardDir, file), 'utf-8');
    const { data, content: body } = matter(content);
    cards.push({ ...data, description: body.trim() || undefined, _file: file });
  }
  return cards;
}

function findMatchingCard(cards, commit, conv) {
  const prNum = extractPrNumber(commit.subject);
  if (prNum) {
    const byPr = cards.find((c) =>
      (c.labels || []).some((l) => new RegExp(`^PR #${prNum}\\b`).test(l))
    );
    if (byPr) return { card: byPr, via: `PR #${prNum} label` };
  }

  // Fall back to slug match against subject (with conventional prefix stripped).
  const subjectForSlug = conv ? conv.message : commit.subject;
  // Strip trailing PR suffix before slugifying.
  const cleaned = subjectForSlug.replace(/\s*\(#\d+\)\s*$/, '').trim();
  const slug = slugify(cleaned);
  if (slug) {
    const byId = cards.find((c) => c.id === slug);
    if (byId) return { card: byId, via: 'slug match' };
  }
  return null;
}

async function saveCardMarkdown(boardId, card) {
  const boardDir = join(CONTENT_DIR, boardId);
  if (!existsSync(boardDir)) await mkdir(boardDir, { recursive: true });

  const fm = {
    id: card.id,
    title: card.title,
    column: card.column,
  };
  if (card.summary) fm.summary = card.summary;
  if (card.labels?.length) fm.labels = card.labels;
  if (card.checklist?.length) fm.checklist = card.checklist;
  if (card.planFile) fm.planFile = card.planFile;
  if (card.color) fm.color = card.color;
  if (card.prStatus) fm.prStatus = card.prStatus;
  if (card.archivedAt) fm.archivedAt = toISOString(card.archivedAt);
  if (card.archiveReason) fm.archiveReason = card.archiveReason;
  fm.createdAt = toISOString(card.createdAt) || new Date().toISOString();
  if (card.updatedAt) fm.updatedAt = toISOString(card.updatedAt);
  if (card.history?.length) {
    fm.history = card.history.map((h) => ({ ...h, timestamp: toISOString(h.timestamp) }));
  }

  const file = join(boardDir, `${card.id}.md`);
  await writeFile(file, matter.stringify(card.description || '', fm));
  return file;
}

async function buildBlogPostCard(slug, commit, columnTitle) {
  const file = join('./content/blog', `${slug}.txt`);
  let title = slug;
  let description = '';
  if (existsSync(file)) {
    try {
      const content = await readFile(file, 'utf-8');
      const { data } = matter(content);
      if (data.title) title = data.title;
      if (data.description) description = data.description;
    } catch {
      /* fall through with slug as title */
    }
  }

  return {
    id: slug,
    title: `Blog: ${title}`,
    column: TARGET_COLUMN,
    labels: ['Blog'],
    createdAt: commit.date,
    updatedAt: commit.date,
    history: [
      { type: 'column', timestamp: commit.date, columnId: TARGET_COLUMN, columnTitle },
    ],
    description: description || `Published [${title}](/blog/${slug}).\n`,
  };
}

function buildNewCard({ commit, conv, hasFlag, columnTitle }) {
  const prNum = extractPrNumber(commit.subject);
  const subjectForSlug = conv ? conv.message : commit.subject;
  const cleaned = subjectForSlug.replace(/\s*\(#\d+\)\s*$/, '').trim();
  const id = slugify(cleaned);
  if (!id) return null;

  const labels = [];
  if (conv && TYPE_LABEL[conv.type]) labels.push(TYPE_LABEL[conv.type]);
  if (conv?.breaking) labels.push('Breaking');
  if (prNum) labels.push(`PR #${prNum}`);
  if (hasFlag && !labels.length) labels.push('Tagged');

  const description = commit.body
    ? `${commit.body}\n`
    : `${cleaned}\n`;

  return {
    id,
    title: cleaned,
    column: TARGET_COLUMN,
    labels,
    createdAt: commit.date,
    updatedAt: commit.date,
    history: [
      { type: 'column', timestamp: commit.date, columnId: TARGET_COLUMN, columnTitle },
    ],
    description,
  };
}

function moveCardToChangelog(card, commit, columnTitle) {
  card.column = TARGET_COLUMN;
  card.updatedAt = commit.date;
  card.history = card.history || [];
  card.history.push({
    type: 'column',
    timestamp: commit.date,
    columnId: TARGET_COLUMN,
    columnTitle,
  });
  return card;
}

async function main() {
  const opts = parseArgs();
  const boardId = opts.board;

  const meta = await loadBoardMeta(boardId);
  const targetColumn = meta.columns.find((c) => c.id === TARGET_COLUMN);
  if (!targetColumn) {
    throw new Error(`Board "${boardId}" has no column with id "${TARGET_COLUMN}"`);
  }

  const shas = resolveCommitRange(opts);
  if (shas.length === 0) {
    console.log('No commits to process.');
    return;
  }

  const cards = await loadCards(boardId);
  const cardsById = new Map(cards.map((c) => [c.id, c]));

  const actions = [];
  for (const sha of shas) {
    const commit = getCommitInfo(sha);

    // Blog posts: any commit that adds a content/blog/*.txt file gets a card
    // per added post, regardless of commit type or skip rules.
    const addedPosts = getAddedBlogPosts(sha);
    if (addedPosts.length > 0) {
      for (const slug of addedPosts) {
        if (cardsById.has(slug)) {
          actions.push({ sha, subject: commit.subject, action: 'noop', reason: 'blog card exists', card: slug });
          continue;
        }
        const card = await buildBlogPostCard(slug, commit, targetColumn.title);
        cardsById.set(card.id, card);
        actions.push({ sha, subject: commit.subject, action: 'create', card: card.id, via: 'blog post' });
      }
      continue;
    }

    const cls = classifyCommit(commit);

    if (cls.action === 'skip') {
      actions.push({ sha, subject: commit.subject, action: 'skip', reason: cls.reason });
      continue;
    }

    const match = findMatchingCard([...cardsById.values()], commit, cls.conv);
    if (match) {
      if (match.card.column === TARGET_COLUMN) {
        actions.push({ sha, subject: commit.subject, action: 'noop', reason: 'already in changelog', via: match.via });
        continue;
      }
      moveCardToChangelog(match.card, commit, targetColumn.title);
      actions.push({ sha, subject: commit.subject, action: 'move', card: match.card.id, via: match.via });
      continue;
    }

    if (cls.action === 'try-match-only') {
      actions.push({ sha, subject: commit.subject, action: 'skip', reason: 'no match, type filtered' });
      continue;
    }

    const newCard = buildNewCard({ commit, conv: cls.conv, hasFlag: cls.hasFlag, columnTitle: targetColumn.title });
    if (!newCard) {
      actions.push({ sha, subject: commit.subject, action: 'skip', reason: 'cannot derive id' });
      continue;
    }
    if (cardsById.has(newCard.id)) {
      // Defensive: a card with the same id already exists but earlier match missed it.
      // Treat it like a move.
      const existing = cardsById.get(newCard.id);
      if (existing.column !== TARGET_COLUMN) {
        moveCardToChangelog(existing, commit, targetColumn.title);
        actions.push({ sha, subject: commit.subject, action: 'move', card: existing.id, via: 'late-id collision' });
      } else {
        actions.push({ sha, subject: commit.subject, action: 'noop', reason: 'id collision in changelog', card: existing.id });
      }
      continue;
    }
    cardsById.set(newCard.id, newCard);
    actions.push({ sha, subject: commit.subject, action: 'create', card: newCard.id });
  }

  console.log(`\nProcessed ${shas.length} commit(s):\n`);
  const counts = { skip: 0, noop: 0, move: 0, create: 0 };
  for (const a of actions) {
    counts[a.action] = (counts[a.action] || 0) + 1;
    const tag = a.action.padEnd(7);
    const reason = a.reason ? ` [${a.reason}]` : '';
    const via = a.via ? ` (via ${a.via})` : '';
    const cardRef = a.card ? ` → ${a.card}` : '';
    console.log(`  ${tag} ${a.sha.slice(0, 7)}  ${a.subject}${cardRef}${via}${reason}`);
  }
  console.log(`\nSummary: ${counts.move} move, ${counts.create} create, ${counts.noop} noop, ${counts.skip} skip\n`);

  if (opts.dryRun) {
    console.log('Dry run — no files written.');
    return;
  }

  // Write only cards that were actually changed.
  const written = new Set();
  for (const a of actions) {
    if (a.action !== 'move' && a.action !== 'create') continue;
    const card = cardsById.get(a.card);
    if (!card) continue;
    if (written.has(card.id)) continue;
    const file = await saveCardMarkdown(boardId, card);
    written.add(card.id);
    console.log(`✓ Wrote ${file}`);
  }

  if (written.size > 0) {
    // Bump board updatedAt so precompiled output picks up changes.
    const boardPath = join(CONTENT_DIR, boardId, '_board.md');
    const boardContent = await readFile(boardPath, 'utf-8');
    const { content: body, data: bm } = matter(boardContent);
    bm.updatedAt = new Date().toISOString();
    await writeFile(boardPath, matter.stringify(body, bm));
    console.log(`✓ Bumped ${boardPath}`);
  } else {
    console.log('No card files needed updating.');
  }
}

main().catch((err) => {
  console.error(`\n❌ ${err.stack || err.message}`);
  process.exit(1);
});
