/**
 * One-time migration script: JSON kanban boards → Markdown content collections
 *
 * Converts:
 *   public/data/roadmap-board.json → content/kanban/roadmap/
 *   public/data/house-board.json   → content/kanban/house/
 *   public/data/roadmap-archive.json → merged into roadmap with column: archived
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = './public/data';
const OUTPUT_DIR = './content/kanban';

// Migration stats
const stats = {
  boards: 0,
  cards: 0,
  archivedCards: 0,
  conflicts: [],
  warnings: [],
  skipped: [],
};

/**
 * Normalize date to ISO 8601 UTC format
 * Handles both date-only (2026-01-19) and full ISO (2026-01-19T00:00:00.000Z)
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  // Already full ISO format
  if (dateStr.includes('T')) {
    // Ensure it ends with Z (UTC)
    if (!dateStr.endsWith('Z')) {
      return dateStr + 'Z';
    }
    return dateStr;
  }

  // Date-only format - convert to midnight UTC
  return `${dateStr}T00:00:00.000Z`;
}

/**
 * Generate a kebab-case filename from card id
 */
function cardFilename(cardId) {
  return `${cardId}.md`;
}

/**
 * Ensure checklist items have unique IDs
 * Generate IDs if missing: {cardId}-{index}
 */
function normalizeChecklist(checklist, cardId) {
  if (!checklist || checklist.length === 0) return [];

  return checklist.map((item, index) => ({
    id: item.id || `${cardId}-${index + 1}`,
    text: item.text,
    completed: item.completed ?? false,
  }));
}

/**
 * Convert card to markdown with YAML frontmatter
 */
function cardToMarkdown(card, columnId) {
  const frontmatter = {
    id: card.id,
    title: card.title,
    column: columnId,
  };

  // Optional fields
  if (card.summary) frontmatter.summary = card.summary;
  if (card.labels && card.labels.length > 0) frontmatter.labels = card.labels;
  if (card.checklist && card.checklist.length > 0) {
    frontmatter.checklist = normalizeChecklist(card.checklist, card.id);
  }
  if (card.planFile) frontmatter.planFile = card.planFile;
  if (card.color) frontmatter.color = card.color;
  if (card.prStatus) frontmatter.prStatus = card.prStatus;

  // Required dates - normalize to ISO 8601
  frontmatter.createdAt = normalizeDate(card.createdAt) || new Date().toISOString();
  if (card.updatedAt) frontmatter.updatedAt = normalizeDate(card.updatedAt);

  // Archive-specific
  if (card.archivedAt) frontmatter.archivedAt = normalizeDate(card.archivedAt);
  if (card.archiveReason) frontmatter.archiveReason = card.archiveReason;

  // History (can be large)
  if (card.history && card.history.length > 0) {
    frontmatter.history = card.history.map(h => ({
      ...h,
      timestamp: normalizeDate(h.timestamp),
    }));
  }

  // Build YAML frontmatter
  const yamlContent = toYaml(frontmatter);

  // Body is the description
  const body = card.description || '';

  return `---\n${yamlContent}---\n\n${body}\n`;
}

/**
 * Convert board metadata to _board.md format
 */
function boardToMarkdown(board, columns) {
  const frontmatter = {
    id: board.id,
    title: board.title,
    createdAt: normalizeDate(board.createdAt) || new Date().toISOString(),
    updatedAt: normalizeDate(board.updatedAt) || new Date().toISOString(),
    columns: columns.map(col => {
      const def = { id: col.id, title: col.title };
      if (col.description) def.description = col.description;
      if (col.color) def.color = col.color;
      return def;
    }),
  };

  const yamlContent = toYaml(frontmatter);
  const body = `Board configuration for ${board.title}.`;

  return `---\n${yamlContent}---\n\n${body}\n`;
}

/**
 * Simple YAML serializer for frontmatter
 * Handles strings, numbers, booleans, arrays, and objects
 */
function toYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  let result = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;

      // Check if array contains objects
      if (typeof value[0] === 'object') {
        result += `${pad}${key}:\n`;
        for (const item of value) {
          // First key of object gets the dash
          const entries = Object.entries(item);
          if (entries.length > 0) {
            const [firstKey, firstVal] = entries[0];
            result += `${pad}  - ${firstKey}: ${formatValue(firstVal)}\n`;
            for (let i = 1; i < entries.length; i++) {
              const [k, v] = entries[i];
              if (v !== undefined && v !== null) {
                result += `${pad}    ${k}: ${formatValue(v)}\n`;
              }
            }
          }
        }
      } else {
        // Simple array (strings, numbers)
        result += `${pad}${key}:\n`;
        for (const item of value) {
          result += `${pad}  - ${formatValue(item)}\n`;
        }
      }
    } else if (typeof value === 'object') {
      result += `${pad}${key}:\n`;
      result += toYaml(value, indent + 1);
    } else {
      result += `${pad}${key}: ${formatValue(value)}\n`;
    }
  }

  return result;
}

/**
 * Format a value for YAML output
 */
function formatValue(val) {
  if (typeof val === 'string') {
    // Quote strings that contain special characters or look like other types
    if (
      val.includes(':') ||
      val.includes('#') ||
      val.includes('\n') ||
      val.includes('"') ||
      val.includes("'") ||
      val.startsWith(' ') ||
      val.endsWith(' ') ||
      val === 'true' ||
      val === 'false' ||
      val === 'null' ||
      /^\d+$/.test(val)
    ) {
      // Use double quotes and escape internal double quotes
      return `"${val.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return val;
  }
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  return String(val);
}

/**
 * Process a single board JSON file
 */
async function processBoard(boardId, boardPath, archiveCards = []) {
  console.log(`\n📋 Processing board: ${boardId}`);

  const boardJson = await readFile(boardPath, 'utf-8');
  const board = JSON.parse(boardJson);

  // Determine board ID from file or content
  const actualBoardId = board.id || boardId;
  const outputDir = join(OUTPUT_DIR, actualBoardId);

  // Create output directory
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  // Track card IDs for duplicate detection
  const cardIds = new Set();
  const processedCards = [];

  // Extract column definitions and cards
  const columns = [];

  for (const col of board.columns) {
    columns.push({
      id: col.id,
      title: col.title,
      description: col.description,
      color: col.color,
    });

    // Process cards in this column
    for (const card of col.cards) {
      if (cardIds.has(card.id)) {
        stats.conflicts.push(`Duplicate card ID in ${actualBoardId}: ${card.id}`);
        continue;
      }
      cardIds.add(card.id);
      processedCards.push({ card, columnId: col.id });
    }
  }

  // Add archived column if we have archive cards
  if (archiveCards.length > 0) {
    const hasArchivedColumn = columns.some(c => c.id === 'archived');
    if (!hasArchivedColumn) {
      columns.push({ id: 'archived', title: 'Archived' });
    }

    // Process archive cards
    for (const card of archiveCards) {
      if (cardIds.has(card.id)) {
        stats.conflicts.push(`Archive card ID conflicts with existing: ${card.id}`);
        stats.warnings.push(`Skipping archive card ${card.id} (already exists in board)`);
        continue;
      }
      cardIds.add(card.id);
      processedCards.push({ card, columnId: 'archived' });
      stats.archivedCards++;
    }
  }

  // Write _board.md
  const boardMd = boardToMarkdown(
    { id: actualBoardId, title: board.title, createdAt: board.createdAt, updatedAt: board.updatedAt },
    columns
  );
  await writeFile(join(outputDir, '_board.md'), boardMd);
  console.log(`  ✓ Created _board.md with ${columns.length} columns`);

  // Write individual card files
  for (const { card, columnId } of processedCards) {
    const cardMd = cardToMarkdown(card, columnId);
    const filename = cardFilename(card.id);
    await writeFile(join(outputDir, filename), cardMd);
    stats.cards++;
  }

  console.log(`  ✓ Created ${processedCards.length} card files`);
  stats.boards++;
}

/**
 * Load archive data if it exists
 */
async function loadArchive(archivePath) {
  if (!existsSync(archivePath)) {
    return [];
  }

  try {
    const archiveJson = await readFile(archivePath, 'utf-8');
    const archive = JSON.parse(archiveJson);
    return archive.cards || [];
  } catch (err) {
    stats.warnings.push(`Failed to load archive: ${err.message}`);
    return [];
  }
}

/**
 * Print migration report
 */
function printReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION REPORT');
  console.log('='.repeat(60));
  console.log(`Boards processed:  ${stats.boards}`);
  console.log(`Cards migrated:    ${stats.cards}`);
  console.log(`Archive cards:     ${stats.archivedCards}`);

  if (stats.conflicts.length > 0) {
    console.log(`\n⚠️  CONFLICTS (${stats.conflicts.length}):`);
    stats.conflicts.forEach(c => console.log(`   - ${c}`));
  }

  if (stats.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${stats.warnings.length}):`);
    stats.warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (stats.skipped.length > 0) {
    console.log(`\n⏭️  SKIPPED (${stats.skipped.length}):`);
    stats.skipped.forEach(s => console.log(`   - ${s}`));
  }

  console.log('='.repeat(60));

  if (stats.conflicts.length > 0) {
    console.log('\n❌ Migration completed with conflicts. Review above.');
    process.exit(1);
  } else {
    console.log('\n✅ Migration completed successfully!');
    console.log(`   Output: ${OUTPUT_DIR}/`);
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🔄 Starting kanban migration: JSON → Markdown');
  console.log(`   Source: ${DATA_DIR}`);
  console.log(`   Target: ${OUTPUT_DIR}`);

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  // Process roadmap board with archive
  const roadmapPath = join(DATA_DIR, 'roadmap-board.json');
  const roadmapArchivePath = join(DATA_DIR, 'roadmap-archive.json');

  if (existsSync(roadmapPath)) {
    const archiveCards = await loadArchive(roadmapArchivePath);
    if (archiveCards.length > 0) {
      console.log(`\n📦 Loaded ${archiveCards.length} cards from roadmap archive`);
    }
    await processBoard('roadmap', roadmapPath, archiveCards);
  } else {
    stats.skipped.push('roadmap-board.json not found');
  }

  // Process house board (no archive)
  const housePath = join(DATA_DIR, 'house-board.json');

  if (existsSync(housePath)) {
    await processBoard('house', housePath);
  } else {
    stats.skipped.push('house-board.json not found');
  }

  // Print report
  printReport();
}

// Run migration
migrate().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
