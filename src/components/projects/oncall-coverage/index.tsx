import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COVERAGE_MODELS, getModelById } from './models';
import { CoverageHeatmap } from './CoverageHeatmap';
import { DailyHeatmap } from './DailyHeatmap';
import { WeeklyHeatmap } from './WeeklyHeatmap';
import { MonthlyHeatmap } from './MonthlyHeatmap';
import { BusinessHoursTimeline } from './BusinessHoursTimeline';
import { MetricsPanel } from './MetricsPanel';
import { TeamList } from './TeamList';
import { Tradeoffs } from './Tradeoffs';

export default function OncallCoverage() {
  const [selectedModelId, setSelectedModelId] = useState(COVERAGE_MODELS[0].id);
  const model = getModelById(selectedModelId) ?? COVERAGE_MODELS[0];

  return (
    <div className="space-y-6">
      {/* Intro */}
      <p className="text-muted-foreground">
        Compare different on-call coverage models to find the right fit for your team.
        Select a model to see how it distributes coverage, burden, and tradeoffs.
      </p>

      {/* Model selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-sm font-medium shrink-0">Coverage Model:</label>
        <Select value={selectedModelId} onValueChange={setSelectedModelId}>
          <SelectTrigger className="w-full sm:w-80" aria-label="Select coverage model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COVERAGE_MODELS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model description */}
      <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
        {model.description}
      </p>

      {/* Visualizations */}
      <div className="space-y-6">
        {/* Coverage levels heatmap (not for follow-the-sun, weekly-rotation, or 12-hour-shifts) */}
        {!['follow-the-sun', 'weekly-rotation', '12-hour-shifts'].includes(model.id) && (
          <CoverageHeatmap coverage={model.coverage} />
        )}

        {/* Daily view - 24 hours (not for weekly-rotation or business-hours) */}
        {!['weekly-rotation', 'business-hours'].includes(model.id) && (
          <DailyHeatmap coverage={model.coverage} team={model.team} />
        )}

        {/* Business hours timeline (only for business-hours model) */}
        {model.id === 'business-hours' && (
          <BusinessHoursTimeline
            etPrimaryHours={{ start: 14, end: 19 }}
            ptPrimaryHours={{ start: 19, end: 25 }}
            overlapHours={{ start: 17, end: 22 }}
          />
        )}

        {/* Weekly view - 7 days (only for models where it adds value) */}
        {!['follow-the-sun', 'weekly-rotation', '12-hour-shifts', 'business-hours'].includes(model.id) && (
          <WeeklyHeatmap coverage={model.coverage} team={model.team} />
        )}

        {/* Monthly rotation view - 30 days */}
        {!['follow-the-sun', 'business-hours', '12-hour-shifts'].includes(model.id) && (
          <MonthlyHeatmap
            team={model.team}
            rotationWeeks={model.rotationWeeks}
            rotationType={model.rotationType}
          />
        )}

        {/* Metrics */}
        <MetricsPanel metrics={model.metrics} />

        {/* Team */}
        <TeamList team={model.team} />

        {/* Tradeoffs */}
        <Tradeoffs tradeoffs={model.tradeoffs} />
      </div>
    </div>
  );
}
