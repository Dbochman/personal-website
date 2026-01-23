/**
 * Markdown serialization for kanban boards
 * Converts board data to markdown files with YAML frontmatter
 */

import type { KanbanBoard, KanbanCard, KanbanColumn } from './types';

/**
 * Convert Date objects or date strings to ISO string format
 * gray-matter may parse unquoted dates as Date objects, so we ensure strings
 */
function toISOString(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return String(value);
}

/**
 * Escape YAML string values that contain special characters
 */
function escapeYamlString(value: string): string {
  // Check for non-ASCII characters (any character > 127)
  const hasNonAscii = /[^\x00-\x7F]/.test(value);

  // If the string contains special characters, non-ASCII, or starts with special chars, quote it
  if (
    hasNonAscii ||
    value.includes(':') ||
    value.includes('#') ||
    value.includes('"') ||
    value.includes("'") ||
    value.includes('\n') ||
    value.startsWith(' ') ||
    value.startsWith('-') ||
    value.startsWith('[') ||
    value.startsWith('{') ||
    /^[0-9]/.test(value) ||
    value === 'true' ||
    value === 'false' ||
    value === 'null'
  ) {
    // Use double quotes and escape internal quotes and newlines
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }
  return value;
}

/**
 * Serialize board metadata to _board.md content
 */
export function serializeBoardMeta(board: KanbanBoard): string {
  const lines: string[] = ['---'];

  lines.push(`id: ${board.id}`);
  lines.push(`title: ${escapeYamlString(board.title)}`);
  lines.push(`createdAt: "${toISOString(board.createdAt)}"`);
  lines.push(`updatedAt: "${toISOString(board.updatedAt)}"`);

  // Columns as YAML array
  lines.push('columns:');
  for (const col of board.columns) {
    lines.push(`  - id: ${col.id}`);
    lines.push(`    title: ${escapeYamlString(col.title)}`);
    if (col.description) {
      lines.push(`    description: ${escapeYamlString(col.description)}`);
    }
    if (col.color && col.color !== 'default') {
      lines.push(`    color: ${col.color}`);
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(`Board configuration for ${board.title}.`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Serialize a card to markdown content with YAML frontmatter
 */
export function serializeCard(card: KanbanCard, columnId: string): string {
  const lines: string[] = ['---'];

  lines.push(`id: ${card.id}`);
  lines.push(`title: ${escapeYamlString(card.title)}`);
  lines.push(`column: ${columnId}`);

  // Optional fields
  if (card.summary) {
    lines.push(`summary: ${escapeYamlString(card.summary)}`);
  }

  if (card.labels && card.labels.length > 0) {
    lines.push('labels:');
    for (const label of card.labels) {
      lines.push(`  - ${escapeYamlString(label)}`);
    }
  }

  if (card.checklist && card.checklist.length > 0) {
    lines.push('checklist:');
    for (const item of card.checklist) {
      lines.push(`  - id: ${item.id}`);
      lines.push(`    text: ${escapeYamlString(item.text)}`);
      lines.push(`    completed: ${item.completed}`);
    }
  }

  if (card.planFile) {
    lines.push(`planFile: ${escapeYamlString(card.planFile)}`);
  }

  if (card.color && card.color !== 'default') {
    lines.push(`color: ${card.color}`);
  }

  if (card.prStatus) {
    lines.push(`prStatus: ${card.prStatus}`);
  }

  // Timestamps - ensure ISO format with quotes
  lines.push(`createdAt: "${toISOString(card.createdAt) || new Date().toISOString()}"`);

  if (card.updatedAt) {
    lines.push(`updatedAt: "${toISOString(card.updatedAt)}"`);
  }

  // Archive fields
  if (card.archivedAt) {
    lines.push(`archivedAt: "${toISOString(card.archivedAt)}"`);
  }

  if (card.archiveReason) {
    lines.push(`archiveReason: ${escapeYamlString(card.archiveReason)}`);
  }

  // History array
  if (card.history && card.history.length > 0) {
    lines.push('history:');
    for (const entry of card.history) {
      lines.push(`  - type: ${entry.type}`);
      lines.push(`    timestamp: "${toISOString(entry.timestamp)}"`);
      if (entry.columnId) {
        lines.push(`    columnId: ${entry.columnId}`);
      }
      if (entry.columnTitle) {
        lines.push(`    columnTitle: ${escapeYamlString(entry.columnTitle)}`);
      }
      if (entry.from !== undefined) {
        lines.push(`    from: ${escapeYamlString(entry.from)}`);
      }
      if (entry.to !== undefined) {
        lines.push(`    to: ${escapeYamlString(entry.to)}`);
      }
    }
  }

  lines.push('---');

  // Body is the description
  if (card.description) {
    lines.push('');
    lines.push(card.description);
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Serialize an entire board to a map of file paths to content
 */
export function serializeBoard(
  board: KanbanBoard,
  boardId: string
): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];

  // Board metadata file
  files.push({
    path: `content/kanban/${boardId}/_board.md`,
    content: serializeBoardMeta(board),
  });

  // Card files
  for (const column of board.columns) {
    for (const card of column.cards) {
      files.push({
        path: `content/kanban/${boardId}/${card.id}.md`,
        content: serializeCard(card, column.id),
      });
    }
  }

  return files;
}

/**
 * Get list of all card IDs in a board
 */
export function getAllCardIds(board: KanbanBoard): string[] {
  return board.columns.flatMap((col) => col.cards.map((card) => card.id));
}
