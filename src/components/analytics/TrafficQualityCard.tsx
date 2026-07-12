import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DitherComposition } from '@/components/dither-kit/meter';
import { Bot, Monitor, AlertTriangle, Users, Info } from 'lucide-react';
import {
  analyzeTrafficQuality,
  getTrafficTypeBadge,
  type TrafficSummary,
} from '@/lib/analytics/traffic-classification';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrafficQualityCardProps {
  topPages: Array<{
    page: string;
    sessions: number;
    users: number;
    pageViews: number;
  }>;
}

export function TrafficQualityCard({ topPages }: TrafficQualityCardProps) {
  const analysis: TrafficSummary = useMemo(
    () => analyzeTrafficQuality(topPages),
    [topPages]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          Traffic Quality
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Estimates traffic quality based on URL patterns and
                  session/user ratios. CI traffic from automated tests and bot
                  probes are flagged.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Human</p>
              <p className="text-sm font-medium tabular-nums">
                {analysis.humanSessions.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
              <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CI</p>
              <p className="text-sm font-medium tabular-nums">
                {analysis.ciSessions.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30">
              <Bot className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bot</p>
              <p className="text-sm font-medium tabular-nums">
                {analysis.botSessions.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Synthetic</p>
              <p className="text-sm font-medium tabular-nums">
                {analysis.syntheticSessions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Dithered traffic composition */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Traffic Composition</span>
            <span className="tabular-nums">{analysis.humanPercentage.toFixed(1)}% human</span>
          </div>
          <DitherComposition
            total={analysis.totalSessions}
            ariaLabel={`Tracked traffic composition: ${analysis.humanSessions.toLocaleString()} human, ${analysis.ciSessions.toLocaleString()} CI, ${analysis.botSessions.toLocaleString()} bot, ${analysis.syntheticSessions.toLocaleString()} synthetic sessions`}
            segments={[
              { key: 'human', label: 'Human', value: analysis.humanSessions, color: 'green', variant: 'gradient' },
              { key: 'ci', label: 'CI', value: analysis.ciSessions, color: 'blue', variant: 'dotted' },
              { key: 'bot', label: 'Bot', value: analysis.botSessions, color: 'red', variant: 'hatched' },
              { key: 'synthetic', label: 'Synthetic', value: analysis.syntheticSessions, color: 'orange', variant: 'dotted' },
            ]}
          />
        </div>

        {/* Flagged Pages */}
        {analysis.flaggedPages.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Flagged Pages
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {analysis.flaggedPages.slice(0, 5).map((page) => (
                <div
                  key={page.page}
                  className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${getTrafficTypeBadge(page.trafficType)}`}
                    >
                      {page.trafficType}
                    </span>
                    <span className="font-mono truncate max-w-[150px]">
                      {page.page}
                    </span>
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    {page.sessions.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            {analysis.flaggedPages.length > 5 && (
              <p className="text-xs text-muted-foreground">
                +{analysis.flaggedPages.length - 5} more flagged
              </p>
            )}
          </div>
        )}

        {/* No issues message */}
        {analysis.flaggedPages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No synthetic traffic detected in top pages
          </p>
        )}
      </CardContent>
    </Card>
  );
}
