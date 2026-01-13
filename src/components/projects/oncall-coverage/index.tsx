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
          <SelectTrigger className="w-full sm:w-80">
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
        {/* Coverage levels heatmap (not for follow-the-sun or weekly-rotation) */}
        {!['follow-the-sun', 'weekly-rotation'].includes(model.id) && (
          <CoverageHeatmap coverage={model.coverage} />
        )}

        {/* Daily view - 24 hours (not for weekly-rotation) */}
        {model.id !== 'weekly-rotation' && (
          <DailyHeatmap coverage={model.coverage} team={model.team} />
        )}

        {/* Weekly view - 7 days (only for shift-based models) */}
        {!['follow-the-sun', 'weekly-rotation'].includes(model.id) && (
          <WeeklyHeatmap coverage={model.coverage} team={model.team} />
        )}

        {/* Monthly rotation view - 30 days (not for follow-the-sun) */}
        {model.id !== 'follow-the-sun' && (
          <MonthlyHeatmap team={model.team} rotationWeeks={model.rotationWeeks} />
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
