#!/usr/bin/env node
/**
 * Kanban CLI - Manage kanban cards from the command line
 *
 * PHASE 2 NOTE: This CLI now writes only to markdown files.
 * JSON files are no longer updated. Run "npm run precompile-kanban" after changes.
 *
 * Usage:
 *   node scripts/kanban-cli.js add --board=roadmap --column=ideas --title="My Card"
 *   node scripts/kanban-cli.js move --board=roadmap --card=my-card --to=todo
 *   node scripts/kanban-cli.js list --board=roadmap [--column=ideas]
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = './content/kanban';

// Convert Date objects or date strings to ISO string format
function toISOString(value) {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return String(value);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || true;
    }
  }

  return { command, options };
}

// Generate a URL-friendly slug from title
function slugify(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  if (!slug) {
    throw new Error(
      `Cannot generate ID from title "${title}". Title must contain at least one alphanumeric character, or use --id to specify an explicit ID.`
    );
  }

  return slug;
}

// Load board metadata from _board.md
async function loadBoardMeta(boardId) {
  const boardPath = join(CONTENT_DIR, boardId, '_board.md');
  if (!existsSync(boardPath)) {
    throw new Error(`Board not found: ${boardId}`);
  }
  const content = await readFile(boardPath, 'utf-8');
  const { data: meta } = matter(content);
  return meta;
}

// Load all cards from markdown files
async function loadCards(boardId) {
  const boardDir = join(CONTENT_DIR, boardId);
  const files = await readdir(boardDir);
  const cardFiles = files.filter((f) => f.endsWith('.md') && f !== '_board.md');

  const cards = [];
  for (const file of cardFiles) {
    const content = await readFile(join(boardDir, file), 'utf-8');
    const { data: frontmatter, content: description } = matter(content);
    cards.push({
      ...frontmatter,
      description: description.trim() || undefined,
    });
  }
  return cards;
}

// Load full board structure from markdown
async function loadBoard(boardId) {
  const meta = await loadBoardMeta(boardId);
  const cards = await loadCards(boardId);

  // Group cards by column
  const columns = meta.columns.map((col) => ({
    ...col,
    cards: cards.filter((c) => c.column === col.id),
  }));

  return {
    ...meta,
    columns,
  };
}

// Update board metadata _board.md
async function updateBoardMeta(boardId, meta) {
  const boardPath = join(CONTENT_DIR, boardId, '_board.md');
  const content = await readFile(boardPath, 'utf-8');
  const { content: body } = matter(content);

  // Update updatedAt
  meta.updatedAt = new Date().toISOString();

  const newContent = matter.stringify(body, meta);
  await writeFile(boardPath, newContent);
}

// Create/update markdown file for card
async function saveCardMarkdown(boardId, card, columnId) {
  const boardDir = join(CONTENT_DIR, boardId);
  if (!existsSync(boardDir)) {
    await mkdir(boardDir, { recursive: true });
  }

  const frontmatter = {
    id: card.id,
    title: card.title,
    column: columnId,
  };

  if (card.summary) frontmatter.summary = card.summary;
  if (card.labels?.length) frontmatter.labels = card.labels;
  if (card.checklist?.length) frontmatter.checklist = card.checklist;
  if (card.planFile) frontmatter.planFile = card.planFile;
  if (card.color) frontmatter.color = card.color;
  if (card.prStatus) frontmatter.prStatus = card.prStatus;
  if (card.archivedAt) frontmatter.archivedAt = toISOString(card.archivedAt);
  if (card.archiveReason) frontmatter.archiveReason = card.archiveReason;

  // Ensure dates are always ISO strings (gray-matter may parse as Date objects)
  frontmatter.createdAt = toISOString(card.createdAt) || new Date().toISOString();
  if (card.updatedAt) frontmatter.updatedAt = toISOString(card.updatedAt);

  if (card.history?.length) {
    frontmatter.history = card.history.map((h) => ({
      ...h,
      timestamp: toISOString(h.timestamp),
    }));
  }

  const content = matter.stringify(card.description || '', frontmatter);
  const filePath = join(boardDir, `${card.id}.md`);
  await writeFile(filePath, content);
  return filePath;
}

// === COMMANDS ===

async function addCard(options) {
  const { board, column, title, description, labels } = options;

  if (!board) throw new Error('--board is required');
  if (!column) throw new Error('--column is required');
  if (!title) throw new Error('--title is required');

  const boardMeta = await loadBoardMeta(board);
  const targetColumn = boardMeta.columns.find((c) => c.id === column);

  if (!targetColumn) {
    const validColumns = boardMeta.columns.map((c) => c.id).join(', ');
    throw new Error(`Column "${column}" not found. Valid columns: ${validColumns}`);
  }

  // Generate card ID
  const cardId = slugify(title);
  const now = new Date().toISOString();

  // Check for ID collision
  const existingCards = await loadCards(board);
  if (existingCards.some((c) => c.id === cardId)) {
    throw new Error(`Card with ID "${cardId}" already exists`);
  }

  const card = {
    id: cardId,
    title,
    description: description || '',
    labels: labels ? labels.split(',').map((l) => l.trim()) : [],
    createdAt: now,
    history: [
      {
        type: 'column',
        timestamp: now,
        columnId: column,
        columnTitle: targetColumn.title,
      },
    ],
  };

  // Create markdown file only (no JSON)
  const mdPath = await saveCardMarkdown(board, card, column);
  console.log(`✓ Created: ${mdPath}`);

  console.log(`\n✅ Card "${title}" added to ${targetColumn.title}`);
  console.log(`   ID: ${cardId}`);
  console.log(`\n💡 Run "npm run precompile-kanban" to update precompiled data`);
}

async function moveCard(options) {
  const { board, card: cardId, to: targetColumnId } = options;

  if (!board) throw new Error('--board is required');
  if (!cardId) throw new Error('--card is required');
  if (!targetColumnId) throw new Error('--to is required');

  const boardMeta = await loadBoardMeta(board);
  const cards = await loadCards(board);

  // Find card
  const card = cards.find((c) => c.id === cardId);
  if (!card) {
    throw new Error(`Card "${cardId}" not found in board "${board}"`);
  }

  // Find target column
  const targetColumn = boardMeta.columns.find((c) => c.id === targetColumnId);
  if (!targetColumn) {
    const validColumns = boardMeta.columns.map((c) => c.id).join(', ');
    throw new Error(`Column "${targetColumnId}" not found. Valid columns: ${validColumns}`);
  }

  const sourceColumnId = card.column;
  if (sourceColumnId === targetColumnId) {
    console.log(`Card is already in "${targetColumnId}" column`);
    return;
  }

  // Update card
  const now = new Date().toISOString();
  card.column = targetColumnId;
  card.updatedAt = now;

  if (!card.history) card.history = [];
  card.history.push({
    type: 'column',
    timestamp: now,
    columnId: targetColumnId,
    columnTitle: targetColumn.title,
  });

  // Save updated markdown
  const mdPath = await saveCardMarkdown(board, card, targetColumnId);
  console.log(`✓ Updated: ${mdPath}`);

  console.log(`\n✅ Card "${card.title}" moved to ${targetColumn.title}`);
  console.log(`\n💡 Run "npm run precompile-kanban" to update precompiled data`);
}

async function listCards(options) {
  const { board, column } = options;

  if (!board) throw new Error('--board is required');

  const boardData = await loadBoard(board);

  console.log(`\n📋 ${boardData.title || board}\n`);

  for (const col of boardData.columns) {
    if (column && col.id !== column) continue;

    console.log(`${col.title} (${col.cards.length})`);
    console.log('─'.repeat(40));

    for (const card of col.cards) {
      const labels = card.labels?.length ? ` [${card.labels.join(', ')}]` : '';
      console.log(`  • ${card.id}: ${card.title}${labels}`);
    }
    console.log('');
  }
}

// === MAIN ===

async function main() {
  const { command, options } = parseArgs();

  try {
    switch (command) {
      case 'add':
        await addCard(options);
        break;
      case 'move':
        await moveCard(options);
        break;
      case 'list':
        await listCards(options);
        break;
      case 'help':
      case undefined:
        console.log(`
Kanban CLI - Manage kanban cards (markdown-only mode)

Commands:
  add     Add a new card
  move    Move a card between columns
  list    List cards in a board

Examples:
  node scripts/kanban-cli.js add --board=roadmap --column=ideas --title="My Feature"
  node scripts/kanban-cli.js add --board=roadmap --column=ideas --title="My Card" --labels="Small,Feature"
  node scripts/kanban-cli.js move --board=roadmap --card=my-card --to=in-progress
  node scripts/kanban-cli.js list --board=roadmap
  node scripts/kanban-cli.js list --board=roadmap --column=ideas

Note: After making changes, run "npm run precompile-kanban" to update precompiled data.
        `);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Run with "help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
