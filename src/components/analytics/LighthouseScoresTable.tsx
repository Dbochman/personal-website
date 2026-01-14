import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LighthousePageScore } from './types';

interface LighthouseScoresTableProps {
  data: LighthousePageScore[];
}

function ScoreBadge({ score }: { score: number }) {
  const status = score >= 90 ? 'good' : score >= 70 ? 'warning' : 'critical';

  return (
    <span className={cn(
      'inline-flex items-center justify-center w-10 h-6 rounded text-xs font-medium',
      {
        'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400': status === 'good',
        'bg-amber-500/20 text-amber-600 dark:text-amber-400': status === 'warning',
        'bg-red-500/20 text-red-600 dark:text-red-400': status === 'critical',
      }
    )}>
      {score}
    </span>
  );
}

export function LighthouseScoresTable({ data }: LighthouseScoresTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lighthouse Scores by Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lighthouse Scores by Page</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Page</th>
                <th className="text-center py-2 font-medium">Perf</th>
                <th className="text-center py-2 font-medium">A11y</th>
                <th className="text-center py-2 font-medium">SEO</th>
                <th className="text-center py-2 font-medium">BP</th>
                <th className="text-right py-2 font-medium">LCP</th>
                <th className="text-right py-2 font-medium">CLS</th>
              </tr>
            </thead>
            <tbody>
              {data.map((page) => (
                <tr key={page.page} className="border-b border-border/50">
                  <td className="py-2">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {page.page}
                    </a>
                  </td>
                  <td className="text-center py-2">
                    <ScoreBadge score={page.performance} />
                  </td>
                  <td className="text-center py-2">
                    <ScoreBadge score={page.accessibility} />
                  </td>
                  <td className="text-center py-2">
                    <ScoreBadge score={page.seo} />
                  </td>
                  <td className="text-center py-2">
                    <ScoreBadge score={page.bestPractices} />
                  </td>
                  <td className="text-right py-2 font-mono text-xs">{page.lcp}</td>
                  <td className="text-right py-2 font-mono text-xs">{page.cls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
