import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckSquare, Square, FileText, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChangelogEntry } from '@/hooks/useChangelogData';

const REPO_URL = 'https://github.com/Dbochman/personal-website';

interface ExpandedDetailsProps {
  entry: ChangelogEntry;
}

/**
 * Parse PR label to extract PR number
 */
function parsePrLabel(label: string): number | null {
  const match = label.match(/^PR #(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

export function ExpandedDetails({ entry }: ExpandedDetailsProps) {
  const [planContent, setPlanContent] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Fetch plan file content if exists
  useEffect(() => {
    if (!entry.planFile) return;

    setLoadingPlan(true);
    fetch(`${REPO_URL}/raw/main/${entry.planFile}`)
      .then((res) => {
        if (!res.ok) throw new Error('Plan not found');
        return res.text();
      })
      .then((text) => {
        // Extract first few paragraphs as summary (skip frontmatter and title)
        const lines = text.split('\n');
        let summary = '';
        let paragraphCount = 0;

        // Check if file has frontmatter (starts with ---)
        const hasFrontmatter = lines[0]?.trim() === '---';
        let inFrontmatter = hasFrontmatter;
        let passedFrontmatter = !hasFrontmatter; // If no frontmatter, we're already past it

        for (const line of lines) {
          // Handle frontmatter
          if (line.trim() === '---') {
            if (inFrontmatter) {
              // Exiting frontmatter
              inFrontmatter = false;
              passedFrontmatter = true;
            }
            continue;
          }

          // Skip lines inside frontmatter
          if (inFrontmatter) continue;

          // Skip until we've passed frontmatter
          if (!passedFrontmatter) continue;

          // Skip title line
          if (line.startsWith('# ')) continue;

          // Skip empty lines at the beginning
          if (!summary && !line.trim()) continue;

          // Stop after 2 paragraphs or 10 lines
          if (line.trim() === '') {
            paragraphCount++;
            if (paragraphCount >= 2) break;
          }

          summary += line + '\n';
          if (summary.split('\n').length >= 10) break;
        }

        setPlanContent(summary.trim());
      })
      .catch(() => setPlanContent(null))
      .finally(() => setLoadingPlan(false));
  }, [entry.planFile]);

  // Filter column changes from history for timeline
  const columnHistory = (entry.history || []).filter((h) => h.type === 'column');

  // Get PR labels
  const prLabels = entry.labels.filter((l) => l.startsWith('PR #'));

  return (
    <div className="space-y-4 pt-2 border-t">
      {/* PR Links */}
      {prLabels.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Pull Requests</h4>
          <div className="flex flex-wrap gap-2">
            {prLabels.map((label) => {
              const prNumber = parsePrLabel(label);
              if (!prNumber) return null;
              return (
                <a
                  key={label}
                  href={`${REPO_URL}/pull/${prNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Badge variant="outline" className="hover:bg-primary/10">
                    {label}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Badge>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan File */}
      {entry.planFile && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <a
              href={`${REPO_URL}/blob/main/${entry.planFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline"
            >
              {entry.planFile}
            </a>
          </div>
          {loadingPlan ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading plan summary...
            </div>
          ) : (
            planContent && (
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
                  {planContent}
                </pre>
              </div>
            )
          )}
        </div>
      )}

      {/* Checklist */}
      {entry.checklist && entry.checklist.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Checklist ({entry.checklist.filter((i) => i.completed).length}/{entry.checklist.length} complete)
          </h4>
          <ul className="space-y-1">
            {entry.checklist.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                {item.completed ? (
                  <CheckSquare className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <span className={item.completed ? 'text-muted-foreground line-through' : ''}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* History Timeline */}
      {columnHistory.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Journey</h4>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {columnHistory.map((change, index) => (
              <span key={`${change.timestamp}-${index}`} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="text-xs opacity-70">
                    {format(new Date(change.timestamp), 'MMM d')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {change.columnTitle}
                  </Badge>
                </span>
                {index < columnHistory.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
