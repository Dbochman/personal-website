import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CoverageSlot } from './types';
import { DAYS_SHORT } from './types';

interface CoverageHeatmapProps {
  coverage: CoverageSlot[][];
}

export function CoverageHeatmap({ coverage }: CoverageHeatmapProps) {
  const hourLabels = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle as="h2" className="text-base">Weekly Coverage Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Hour labels */}
          <div className="flex">
            <div className="w-10 shrink-0" />
            <div className="flex-1 flex">
              {hourLabels.map((hour) => (
                <div
                  key={hour}
                  className="text-[10px] text-muted-foreground"
                  style={{ width: `${(3 / 24) * 100}%` }}
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {/* Days - start with Monday */}
          {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => (
            <div key={dayIndex} className="flex items-center">
              <div className="w-10 shrink-0 text-xs text-muted-foreground">
                {DAYS_SHORT[dayIndex]}
              </div>
              <div className="flex-1 flex h-7 rounded overflow-hidden">
                {coverage[dayIndex]?.map((slot, hour) => {
                  const memberCount = slot.coveringMembers.length;
                  let bgColor = 'bg-red-500/80'; // Gap
                  if (memberCount === 1) {
                    bgColor = 'bg-yellow-500/80'; // Single coverage
                  } else if (memberCount >= 2) {
                    bgColor = 'bg-green-500/80'; // Good coverage
                  }

                  return (
                    <div
                      key={hour}
                      className={`
                        flex-1 border-r border-background/30 last:border-r-0
                        ${slot.covered ? bgColor : 'bg-red-500/80'}
                        transition-colors
                      `}
                      title={`${DAYS_SHORT[dayIndex]} ${hour}:00 UTC\n${
                        slot.covered
                          ? `Covered by: ${slot.coveringMembers.join(', ')}`
                          : 'No coverage'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-xs text-muted-foreground">
            <span>Times in UTC</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500/80" />
              <span>2+ people</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-500/80" />
              <span>1 person</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500/80" />
              <span>Gap</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
