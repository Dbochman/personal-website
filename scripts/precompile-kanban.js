/**
 * Precompile kanban markdown files at build time
 * Reads content/kanban/{boardId}/*.md and outputs to src/generated/kanban/{boardId}.js
 *
 * Usage:
 *   node scripts/precompile-kanban.js           # Normal mode
 *   node scripts/precompile-kanban.js --strict  # Fail on warnings (for CI)
 */

import { readdir, readFile, writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import matter from 'gray-matter';
import { z } from 'zod';

const CONTENT_DIR = './content/kanban';
const OUTPUT_DIR = './src/generated/kanban';

// Check for strict mode
const strictMode = process.argv.includes('--strict');

// Stats for reporting
const stats = {
  boards: 0,
  cards: 0,
  errors: [],
  warnings: [],
};

// ============================================================================
// Zod Schemas (inline to avoid import issues in Node.js scripts)
// ============================================================================

// ISO 8601 date string with preprocessing for Date objects
// gray-matter may parse unquoted dates as Date objects, so we coerce them
const isoDateString = z.preprocess(
  (val) => {
    if (val instanceof Date) return val.toISOString();
    return val;
  },
  z.string().refine(
    (val) => {
      const fullIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
      return fullIso.test(val) || dateOnly.test(val);
    },
    { message: 'Invalid date format. Expected ISO 8601' }
  )
);

const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  completed: z.boolean().default(false),
});

// Forward-compatible schema: string type instead of enum, passthrough for unknown fields
// This allows future history types (title changes, checklist updates) without breaking older precompile
const CardChangeSchema = z.object({
  type: z.string(), // Not enum - allows future types
  timestamp: isoDateString,
  columnId: z.string().optional(),
  columnTitle: z.string().optional(),
  from: z.union([z.string(), z.array(z.string())]).optional(), // Array for multi-value changes
  to: z.union([z.string(), z.array(z.string())]).optional(),
  action: z.string().optional(), // For checklist: add, remove, toggle
  itemId: z.string().optional(), // For checklist item changes
  itemText: z.string().optional(), // For checklist item changes
}).passthrough(); // Allow unknown fields for forward compatibility

const PrStatusSchema = z.enum(['passing', 'failing', 'pending']);
const ColumnColorSchema = z.enum(['default', 'yellow', 'orange', 'purple', 'blue', 'green', 'red', 'pink']);

const KanbanCardFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  column: z.string().min(1),
  summary: z.string().max(200).optional(),
  description: z.string().max(5000).optional(), // Now in frontmatter (safe from YAML boundary issues)
  // Labels: max 50 chars each, max 20 labels, silently deduplicate
  labels: z.array(z.string().max(50))
    .max(20)
    .default([])
    .transform(labels => [...new Set(labels)]),
  checklist: z.array(ChecklistItemSchema).default([]),
  planFile: z.string().optional(),
  color: ColumnColorSchema.optional(),
  prStatus: PrStatusSchema.optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString.optional(),
  archivedAt: isoDateString.optional(),
  archiveReason: z.string().max(500).optional(),
  history: z.array(CardChangeSchema).default([]),
}).superRefine((data, ctx) => {
  const checklistIds = data.checklist.map((item) => item.id);
  const duplicates = checklistIds.filter((id, index) => checklistIds.indexOf(id) !== index);
  if (duplicates.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate checklist IDs: ${[...new Set(duplicates)].join(', ')}`,
      path: ['checklist'],
    });
  }
});

const ColumnDefinitionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  color: ColumnColorSchema.optional(),
});

const KanbanBoardMetaSchema = z.object({
  schemaVersion: z.number().int().min(1), // Required, no default - forces explicit migration
  id: z.string().min(1),
  title: z.string().min(1),
  createdAt: isoDateString,
  updatedAt: isoDateString,
  columns: z.array(ColumnDefinitionSchema).min(1),
}).superRefine((data, ctx) => {
  if (data.schemaVersion === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Missing schemaVersion - run migration to add schema version',
      path: ['schemaVersion'],
    });
  }
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format Zod errors into readable messages
 */
function formatZodErrors(errors, file) {
  return errors.map((err) => {
    const path = err.path.join('.');
    return `  ${file}: ${path ? path + ': ' : ''}${err.message}`;
  });
}

/**
 * Process a single board directory
 */
async function processBoard(boardDir) {
  const boardId = basename(boardDir);
  console.log(`\n📋 Processing board: ${boardId}`);

  // Read _board.md for metadata
  const boardMetaPath = join(boardDir, '_board.md');
  if (!existsSync(boardMetaPath)) {
    stats.errors.push(`Missing _board.md in ${boardId}`);
    return null;
  }

  const boardContent = await readFile(boardMetaPath, 'utf-8');
  const { data: boardMeta } = matter(boardContent);

  // Validate board metadata
  const boardResult = KanbanBoardMetaSchema.safeParse(boardMeta);
  if (!boardResult.success) {
    stats.errors.push(...formatZodErrors(boardResult.error.errors, `${boardId}/_board.md`));
    return null;
  }

  const board = boardResult.data;
  const columnIds = new Set(board.columns.map((c) => c.id));

  // Read all card files
  const files = await readdir(boardDir);
  const cardFiles = files.filter((f) => f.endsWith('.md') && f !== '_board.md');

  const cards = [];
  const cardIds = new Set();

  for (const file of cardFiles) {
    const filePath = join(boardDir, file);
    const content = await readFile(filePath, 'utf-8');
    const { data: frontmatter, content: description } = matter(content);

    // Validate card frontmatter
    const cardResult = KanbanCardFrontmatterSchema.safeParse(frontmatter);
    if (!cardResult.success) {
      stats.errors.push(...formatZodErrors(cardResult.error.errors, `${boardId}/${file}`));
      continue;
    }

    const card = cardResult.data;

    // Check for duplicate card IDs
    if (cardIds.has(card.id)) {
      stats.errors.push(`  ${boardId}/${file}: Duplicate card ID "${card.id}"`);
      continue;
    }
    cardIds.add(card.id);

    // Validate column reference
    if (!columnIds.has(card.column)) {
      stats.errors.push(
        `  ${boardId}/${file}: Unknown column "${card.column}". Valid columns: ${[...columnIds].join(', ')}`
      );
      continue;
    }

    // Prefer description from frontmatter, fall back to body for backwards compatibility
    const finalDescription = card.description || description.trim() || undefined;
    cards.push({
      ...card,
      description: finalDescription,
    });

    stats.cards++;
  }

  // Sort cards by createdAt for deterministic output (default for most columns)
  cards.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  console.log(`  ✓ Validated ${cards.length} cards`);

  /**
   * Get the completion date from a card's history (last move to changelog column)
   * Falls back to createdAt if no history exists
   */
  function getCompletedAt(card) {
    if (!card.history || card.history.length === 0) {
      return card.createdAt;
    }
    // Find the last move to changelog column
    const changelogMoves = card.history.filter(
      (h) => h.type === 'column' && h.columnId === 'changelog'
    );
    if (changelogMoves.length > 0) {
      return changelogMoves[changelogMoves.length - 1].timestamp;
    }
    // Fall back to last history entry or createdAt
    return card.history[card.history.length - 1].timestamp || card.createdAt;
  }

  // Build board structure matching KanbanBoard type
  const columns = board.columns.map((colDef) => {
    let columnCards = cards.filter((c) => c.column === colDef.id);

    // Sort changelog column by completion date (newest first) to match Change Log Explorer
    if (colDef.id === 'changelog') {
      columnCards.sort((a, b) => new Date(getCompletedAt(b)).getTime() - new Date(getCompletedAt(a)).getTime());
    }

    return {
      id: colDef.id,
      title: colDef.title,
      description: colDef.description,
      color: colDef.color,
      cards: columnCards.map((c) => {
        // Remove column field from card (it's implicit from the column)
        const { column, ...cardWithoutColumn } = c;
        return cardWithoutColumn;
      }),
    };
  });

  const result = {
    schemaVersion: board.schemaVersion,
    id: board.id,
    title: board.title,
    columns,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };

  stats.boards++;
  return result;
}

/**
 * Main precompile function
 */
async function precompileKanban() {
  console.log('🔄 Precompiling kanban boards...');

  // Check if content directory exists
  if (!existsSync(CONTENT_DIR)) {
    console.log(`⚠️  Content directory not found: ${CONTENT_DIR}`);
    console.log('   Run "node scripts/migrate-kanban-to-md.js" first.');
    process.exit(1);
  }

  // Clean output directory
  if (existsSync(OUTPUT_DIR)) {
    await rm(OUTPUT_DIR, { recursive: true });
  }
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Find all board directories
  const entries = await readdir(CONTENT_DIR, { withFileTypes: true });
  const boardDirs = entries.filter((e) => e.isDirectory()).map((e) => join(CONTENT_DIR, e.name));

  if (boardDirs.length === 0) {
    console.log('⚠️  No board directories found in', CONTENT_DIR);
    process.exit(1);
  }

  console.log(`📝 Found ${boardDirs.length} board(s) to compile`);

  const manifest = {};

  // Process each board
  for (const boardDir of boardDirs) {
    const board = await processBoard(boardDir);
    if (board) {
      // Write board JS file
      const outputFile = join(OUTPUT_DIR, `${board.id}.js`);
      const outputContent = `// Auto-generated - do not edit
// Source: content/kanban/${board.id}/
export const board = ${JSON.stringify(board, null, 2)};
`;
      await writeFile(outputFile, outputContent);
      console.log(`  ✓ Wrote: ${board.id}.js`);

      manifest[board.id] = {
        file: `${board.id}.js`,
        title: board.title,
        cardCount: board.columns.reduce((sum, col) => sum + col.cards.length, 0),
      };
    }
  }

  // Write manifest
  const manifestContent = `// Auto-generated manifest of precompiled kanban boards
export const kanbanManifest = ${JSON.stringify(manifest, null, 2)};
`;
  await writeFile(join(OUTPUT_DIR, 'manifest.js'), manifestContent);

  // Print report
  console.log('\n' + '='.repeat(50));
  console.log('📊 PRECOMPILE REPORT');
  console.log('='.repeat(50));
  console.log(`Boards:  ${stats.boards}`);
  console.log(`Cards:   ${stats.cards}`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ ERRORS (${stats.errors.length}):`);
    stats.errors.forEach((e) => console.log(e));
  }

  if (stats.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${stats.warnings.length}):`);
    stats.warnings.forEach((w) => console.log(w));
  }

  console.log('='.repeat(50));

  // Exit with error if there were issues
  if (stats.errors.length > 0) {
    console.log('\n❌ Precompilation failed with errors');
    process.exit(1);
  }

  if (strictMode && stats.warnings.length > 0) {
    console.log('\n❌ Precompilation failed (strict mode): warnings present');
    process.exit(1);
  }

  console.log(`\n✅ Precompilation complete!`);
  console.log(`   ${Object.keys(manifest).length} board(s) compiled to ${OUTPUT_DIR}`);
}

// Run precompilation
precompileKanban().catch((err) => {
  console.error('\n❌ Precompilation failed:', err);
  process.exit(1);
});
