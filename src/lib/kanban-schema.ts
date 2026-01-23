/**
 * Zod schemas for kanban card and board validation
 * Used by precompile script to validate frontmatter
 */

import { z } from 'zod';

// ISO 8601 date string validation with preprocessing for Date objects
// gray-matter may parse unquoted dates as Date objects, so we coerce them
const isoDateString = z.preprocess(
  (val) => {
    if (val instanceof Date) return val.toISOString();
    return val;
  },
  z.string().refine(
    (val) => {
      // Accept both full ISO (2026-01-19T00:00:00.000Z) and date-only (2026-01-19)
      const fullIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
      return fullIso.test(val) || dateOnly.test(val);
    },
    { message: 'Invalid date format. Expected ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)' }
  )
);

// Checklist item schema
export const ChecklistItemSchema = z.object({
  id: z.string().min(1, 'Checklist item id is required'),
  text: z.string().min(1, 'Checklist item text is required'),
  completed: z.boolean().default(false),
});

// Card history entry schema
export const CardChangeSchema = z.object({
  type: z.enum(['column', 'title', 'description', 'labels']),
  timestamp: isoDateString,
  // For column changes
  columnId: z.string().optional(),
  columnTitle: z.string().optional(),
  // For field changes
  from: z.string().optional(),
  to: z.string().optional(),
});

// PR status enum
export const PrStatusSchema = z.enum(['passing', 'failing', 'pending']);

// Column color enum
export const ColumnColorSchema = z.enum([
  'default',
  'yellow',
  'orange',
  'purple',
  'blue',
  'green',
  'red',
  'pink',
]);

// Card frontmatter schema (what goes in markdown YAML)
export const KanbanCardFrontmatterSchema = z.object({
  id: z.string().min(1, 'Card id is required'),
  title: z.string().min(1, 'Card title is required'),
  column: z.string().min(1, 'Card column is required'),
  summary: z.string().optional(),
  labels: z.array(z.string()).default([]),
  checklist: z.array(ChecklistItemSchema).default([]),
  planFile: z.string().optional(),
  color: ColumnColorSchema.optional(),
  prStatus: PrStatusSchema.optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString.optional(),
  // Archive-specific fields
  archivedAt: isoDateString.optional(),
  archiveReason: z.string().optional(),
  // History is stored but may be large
  history: z.array(CardChangeSchema).default([]),
}).superRefine((data, ctx) => {
  // Validate checklist ID uniqueness within card
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

// Column definition schema (in _board.md)
export const ColumnDefinitionSchema = z.object({
  id: z.string().min(1, 'Column id is required'),
  title: z.string().min(1, 'Column title is required'),
  description: z.string().optional(),
  color: ColumnColorSchema.optional(),
});

// Board metadata schema (in _board.md frontmatter)
export const KanbanBoardMetaSchema = z.object({
  id: z.string().min(1, 'Board id is required'),
  title: z.string().min(1, 'Board title is required'),
  createdAt: isoDateString,
  updatedAt: isoDateString,
  columns: z.array(ColumnDefinitionSchema).min(1, 'At least one column is required'),
});

// Types derived from schemas
export type KanbanCardFrontmatter = z.infer<typeof KanbanCardFrontmatterSchema>;
export type KanbanBoardMeta = z.infer<typeof KanbanBoardMetaSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type CardChange = z.infer<typeof CardChangeSchema>;
export type ColumnDefinition = z.infer<typeof ColumnDefinitionSchema>;
