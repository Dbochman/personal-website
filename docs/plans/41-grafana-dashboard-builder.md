# Grafana Dashboard JSON Builder

## Goal
Create Grafana dashboard JSON through a visual editor with panel previews and export-ready output.

## Non-Goals
- Live data rendering from Grafana datasources.
- Full compatibility with every Grafana panel type.

## Users & Use Cases
- Engineers building dashboards without hand-editing JSON.
- Teams creating reusable dashboard templates.

## Functional Requirements
- Dashboard settings (title, tags, time range).
- Panel type picker (time series, stat, gauge, table, text).
- Grid layout with drag-and-drop positioning.
- Panel editor for queries, legends, units, thresholds.
- Export JSON with Grafana schema version 38+.
- Preset dashboards for common use cases.

## UX Requirements
- Canvas-first layout with inline panel previews.
- Panel editor docked below or side based on screen size.
- JSON preview with copy/download.

## Async Implementation
- Debounced JSON generation (200ms) on edits.
- Use a Web Worker to validate panel configs and layout constraints.
- Cancel stale JSON builds when edits arrive.
- Preview updates via `startTransition` to avoid jank during drag.

## Data Model
```typescript
interface Panel {
  id: number;
  type: 'timeseries' | 'stat' | 'gauge' | 'table' | 'text';
  title: string;
  gridPos: { x: number; y: number; w: number; h: number };
  targets: Target[];
  fieldConfig: FieldConfig;
  options: Record<string, unknown>;
}

interface Dashboard {
  title: string;
  tags: string[];
  timezone: string;
  schemaVersion: number;
  panels: Panel[];
}
```

## Error Handling & Empty States
- No panels: show prompt and starter templates.
- Invalid panel settings: highlight field and keep last valid JSON.

## Performance Targets
- JSON generation under 150ms for up to 50 panels.
- Dragging stays responsive under 30 panels.

## Test Plan
- Unit tests for JSON generation and panel IDs.
- UI tests for drag layout and export.

## Dependencies
- `dnd-kit` for drag-and-drop.
- Existing UI components.
