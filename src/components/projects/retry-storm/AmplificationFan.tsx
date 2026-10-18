import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  amplificationCeiling,
  drainableLoadLimitPct,
  formatMultiplier,
  maxAttempts,
  type SimConfig,
} from './simulation';

const LAYER_NAMES: Record<number, string[]> = {
  1: ['Caller'],
  2: ['Frontend', 'Backend'],
  3: ['Browser', 'Frontend', 'Backend'],
};

export function AmplificationFan({ config }: { config: SimConfig }) {
  const attempts = maxAttempts(config);
  const ceiling = amplificationCeiling(config);
  const limit = drainableLoadLimitPct(config);
  const budgetCaps = config.retryBudgetPct > 0 && ceiling < attempts;
  const activeDots = budgetCaps ? Math.ceil(ceiling) : attempts;
  const names = LAYER_NAMES[config.layers] ?? LAYER_NAMES[1];
  const safe = config.loadPct < limit;

  return (
    <div className="space-y-3">
      <ol aria-label="Call chain" className="flex flex-wrap items-center gap-1 text-xs">
        <li className="rounded-md border bg-muted/40 px-2 py-1">User</li>
        {names.map((name) => (
          <li key={name} className="flex items-center gap-1">
            <ChevronRight aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
            <span className="rounded-md border bg-muted/40 px-2 py-1">
              {name}{' '}
              <span className="font-mono font-semibold">×{config.attemptsPerLayer}</span>
            </span>
          </li>
        ))}
        <li className="flex items-center gap-1">
          <ChevronRight aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
          <span className="rounded-md border border-foreground/30 bg-foreground/5 px-2 py-1 font-medium">
            Dependency
          </span>
        </li>
      </ol>

      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="grid shrink-0 gap-0.5"
          style={{ gridTemplateColumns: `repeat(${Math.min(8, attempts)}, 0.625rem)` }}
        >
          {Array.from({ length: attempts }, (_, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-xs border"
              style={
                i === 0
                  ? { backgroundColor: 'hsl(var(--chart-1))', borderColor: 'hsl(var(--chart-1))' }
                  : i < activeDots
                    ? { backgroundColor: 'hsl(var(--chart-5))', borderColor: 'hsl(var(--chart-5))' }
                    : { borderColor: 'hsl(var(--chart-5) / 0.5)' }
              }
            />
          ))}
        </div>
        <p className="text-sm">
          Up to <strong className="font-mono">{attempts}</strong> attempt{attempts === 1 ? '' : 's'} per user
          request
          {config.layers > 1 && (
            <span className="text-muted-foreground">
              {' '}
              ({config.attemptsPerLayer}
              <sup>{config.layers}</sup>)
            </span>
          )}
          {budgetCaps && (
            <>
              , but the {config.retryBudgetPct}% budget holds sustained load to about{' '}
              <strong className="font-mono">{formatMultiplier(ceiling)}</strong>
            </>
          )}
          .
        </p>
      </div>

      <p
        className={cn(
          'rounded-md border px-3 py-2 text-sm',
          safe
            ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
        )}
      >
        {config.shedAbandoned ? (
          <>
            Model bound: with abandoned work shed, the backlog can drain whenever demand stays below
            capacity.
          </>
        ) : (
          <>
            Model bound: when everything fails, demand can reach{' '}
            <strong>{formatMultiplier(ceiling)}</strong> normal, so the backlog is guaranteed to drain
            only below <strong>{Math.floor(limit * 10) / 10}% load</strong>. You are at{' '}
            <strong>{config.loadPct}%</strong>
            {safe
              ? '.'
              : ', so in this model a long enough trigger leaves it stuck. Real systems differ in the details.'}
          </>
        )}
      </p>
    </div>
  );
}
