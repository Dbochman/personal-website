#!/usr/bin/env node
/**
 * Kanban CLI - Manage kanban cards from the command line
 *
 * Usage:
 *   node scripts/kanban-cli.js add --board=roadmap --column=ideas --title="My Card"
 *   node scripts/kanban-cli.js move --board=roadmap --card=my-card --to=todo
 *   node scripts/kanban-cli.js sync --board=roadmap [--direction=json-to-md|md-to-json]
 *   node scripts/kanban-cli.js list --board=roadmap [--column=ideas]
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const DATA_DIR = './public/data';
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

// Load board JSON
async function loadBoardJson(boardId) {
  const path = join(DATA_DIR, `${boardId}-board.json`);
  if (!existsSync(path)) {
    throw new Error(`Board not found: ${boardId}`);
  }
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content);
}

// Save board JSON
async function saveBoardJson(boardId, board) {
  const path = join(DATA_DIR, `${boardId}-board.json`);
  board.updatedAt = new Date().toISOString();
  await writeFile(path, JSON.stringify(board, null, 2) + '\n');
}

// Create markdown file for card
async function createCardMarkdown(boardId, card, columnId) {
  const boardDir = join(CONTENT_DIR, boardId);
  if (!existsSync(boardDir)) {
    await mkdir(boardDir, { recursive: true });
  }

  const frontmatter = {
    id: card.id,
    title: card.title,
    column: columnId,
  };

  if (card.labels?.length) frontmatter.labels = card.labels;
  if (card.checklist?.length) frontmatter.checklist = card.checklist;
  if (card.planFile) frontmatter.planFile = card.planFile;
  if (card.color) frontmatter.color = card.color;
  if (card.prStatus) frontmatter.prStatus = card.prStatus;
  if (card.summary) frontmatter.summary = card.summary;
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

// Update markdown file column
async function updateCardMarkdownColumn(boardId, cardId, newColumnId, columnTitle) {
  const filePath = join(CONTENT_DIR, boardId, `${cardId}.md`);
  if (!existsSync(filePath)) {
    console.warn(`  Warning: Markdown file not found: ${filePath}`);
    return null;
  }

  const content = await readFile(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  // Update column
  frontmatter.column = newColumnId;
  frontmatter.updatedAt = new Date().toISOString();

  // Add history entry
  if (!frontmatter.history) frontmatter.history = [];
  frontmatter.history.push({
    type: 'column',
    timestamp: frontmatter.updatedAt,
    columnId: newColumnId,
    columnTitle: columnTitle,
  });

  const newContent = matter.stringify(body, frontmatter);
  await writeFile(filePath, newContent);
  return filePath;
}

// === COMMANDS ===

async function addCard(options) {
  const { board, column, title, description, labels } = options;

  if (!board) throw new Error('--board is required');
  if (!column) throw new Error('--column is required');
  if (!title) throw new Error('--title is required');

  const boardData = await loadBoardJson(board);
  const targetColumn = boardData.columns.find((c) => c.id === column);

  if (!targetColumn) {
    const validColumns = boardData.columns.map((c) => c.id).join(', ');
    throw new Error(`Column "${column}" not found. Valid columns: ${validColumns}`);
  }

  // Generate card
  const cardId = slugify(title);
  const now = new Date().toISOString();

  // Check for ID collision
  for (const col of boardData.columns) {
    if (col.cards.some((c) => c.id === cardId)) {
      throw new Error(`Card with ID "${cardId}" already exists`);
    }
  }

  const card = {
    id: cardId,
    title,
    description: description || '',
    labels: labels ? labels.split(',').map((l) => l.trim()) : [],
    createdAt: now.split('T')[0], // Date only for JSON
  };

  // Add to JSON
  targetColumn.cards.push(card);
  await saveBoardJson(board, boardData);
  console.log(`✓ Added to JSON: ${board}-board.json`);

  // Create markdown (with full ISO date)
  card.createdAt = now;
  const mdPath = await createCardMarkdown(board, card, column);
  console.log(`✓ Created markdown: ${mdPath}`);

  console.log(`\n✅ Card "${title}" added to ${column} column`);
  console.log(`   ID: ${cardId}`);

  // Remind to precompile
  console.log(`\n💡 Run "npm run precompile-kanban" to update precompiled data`);
}

async function moveCard(options) {
  const { board, card: cardId, to: targetColumnId } = options;

  if (!board) throw new Error('--board is required');
  if (!cardId) throw new Error('--card is required');
  if (!targetColumnId) throw new Error('--to is required');

  const boardData = await loadBoardJson(board);

  // Find card and source column
  let sourceColumn = null;
  let card = null;
  let cardIndex = -1;

  for (const col of boardData.columns) {
    const idx = col.cards.findIndex((c) => c.id === cardId);
    if (idx !== -1) {
      sourceColumn = col;
      card = col.cards[idx];
      cardIndex = idx;
      break;
    }
  }

  if (!card) {
    throw new Error(`Card "${cardId}" not found in board "${board}"`);
  }

  // Find target column
  const targetColumn = boardData.columns.find((c) => c.id === targetColumnId);
  if (!targetColumn) {
    const validColumns = boardData.columns.map((c) => c.id).join(', ');
    throw new Error(`Column "${targetColumnId}" not found. Valid columns: ${validColumns}`);
  }

  if (sourceColumn.id === targetColumnId) {
    console.log(`Card is already in "${targetColumnId}" column`);
    return;
  }

  // Move in JSON
  const now = new Date().toISOString();
  sourceColumn.cards.splice(cardIndex, 1);

  // Add history entry
  if (!card.history) card.history = [];
  card.history.push({
    type: 'column',
    timestamp: now,
    columnId: targetColumnId,
    columnTitle: targetColumn.title,
  });
  card.updatedAt = now;

  targetColumn.cards.push(card);
  await saveBoardJson(board, boardData);
  console.log(`✓ Moved in JSON: ${sourceColumn.id} → ${targetColumnId}`);

  // Update markdown
  const mdPath = await updateCardMarkdownColumn(board, cardId, targetColumnId, targetColumn.title);
  if (mdPath) {
    console.log(`✓ Updated markdown: ${mdPath}`);
  }

  console.log(`\n✅ Card "${card.title}" moved to ${targetColumn.title}`);
  console.log(`\n💡 Run "npm run precompile-kanban" to update precompiled data`);
}

async function listCards(options) {
  const { board, column } = options;

  if (!board) throw new Error('--board is required');

  const boardData = await loadBoardJson(board);

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

async function syncBoard(options) {
  const { board, direction = 'json-to-md' } = options;

  if (!board) throw new Error('--board is required');

  if (direction === 'json-to-md') {
    console.log(`🔄 Syncing JSON → Markdown for ${board}...`);

    const boardData = await loadBoardJson(board);
    let created = 0;
    let updated = 0;

    for (const col of boardData.columns) {
      for (const card of col.cards) {
        const mdPath = join(CONTENT_DIR, board, `${card.id}.md`);

        if (existsSync(mdPath)) {
          // Update existing - compare all fields including description body
          const content = await readFile(mdPath, 'utf-8');
          const { data: frontmatter, content: mdBody } = matter(content);

          // Compare all relevant fields - simpler to just regenerate if any differ
          const needsUpdate =
            frontmatter.column !== col.id ||
            frontmatter.title !== card.title ||
            (mdBody.trim() || undefined) !== (card.description || undefined) ||
            JSON.stringify(frontmatter.labels || []) !== JSON.stringify(card.labels || []) ||
            JSON.stringify(frontmatter.checklist || []) !== JSON.stringify(card.checklist || []) ||
            JSON.stringify(frontmatter.history || []) !== JSON.stringify(card.history || []) ||
            frontmatter.summary !== card.summary ||
            frontmatter.planFile !== card.planFile ||
            frontmatter.prStatus !== card.prStatus ||
            frontmatter.color !== card.color ||
            frontmatter.archivedAt !== card.archivedAt ||
            frontmatter.archiveReason !== card.archiveReason;

          if (needsUpdate) {
            await createCardMarkdown(board, card, col.id);
            updated++;
          }
        } else {
          // Create new
          await createCardMarkdown(board, card, col.id);
          created++;
        }
      }
    }

    console.log(`✅ Sync complete: ${created} created, ${updated} updated`);
  } else if (direction === 'md-to-json') {
    console.log(`🔄 Syncing Markdown → JSON for ${board}...`);
    console.log(`   (Not yet implemented - run migration script instead)`);
  } else {
    throw new Error(`Invalid direction: ${direction}. Use "json-to-md" or "md-to-json"`);
  }

  console.log(`\n💡 Run "npm run precompile-kanban" to update precompiled data`);
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
      case 'sync':
        await syncBoard(options);
        break;
      case 'help':
      case undefined:
        console.log(`
Kanban CLI - Manage kanban cards

Commands:
  add     Add a new card
  move    Move a card between columns
  list    List cards in a board
  sync    Sync JSON and Markdown files

Examples:
  node scripts/kanban-cli.js add --board=roadmap --column=ideas --title="My Feature"
  node scripts/kanban-cli.js add --board=roadmap --column=ideas --title="My Card" --labels="Small,Feature"
  node scripts/kanban-cli.js move --board=roadmap --card=my-card --to=in-progress
  node scripts/kanban-cli.js list --board=roadmap
  node scripts/kanban-cli.js list --board=roadmap --column=ideas
  node scripts/kanban-cli.js sync --board=roadmap
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
