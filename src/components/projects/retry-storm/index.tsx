import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  CloudLightning,
  Copy,
  Link2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AmplificationFan } from './AmplificationFan';
import { LoadChart } from './LoadChart';
import { OptionControl, RangeControl } from './controls';
import { envoyRetryConfig } from './envoy';
import { buildTakeaways, chartSummary, describeOutcome, type Tone } from './insights';
import { PRESETS, matchPreset } from './presets';
import {
  BASE_DELAY_OPTIONS_MS,
  BUDGET_OPTIONS_PCT,
  HEALTHY_CAPACITY_RPS,
  HORIZON_S,
  INCIDENT_START_S,
  LIMITS,
  MAX_DELAY_OPTIONS_MS,
  MODEL_LIMITS,
  TICK_S,
  TIMEOUT_OPTIONS_MS,
  buildLadder,
  findTippingPointS,
  formatMs,
  formatMultiplier,
  simulate,
  type SimConfig,
  type SimSummary,
} from './simulation';
import { configsEqual, writeConfig } from './url-state';
import { useUrlConfig } from './useUrlConfig';

const count = new Intl.NumberFormat('en-US');

const TONE_STYLES: Record<Tone, string> = {
  good: 'border-green-500/30 bg-green-500/10',
  warn: 'border-amber-500/40 bg-amber-500/10',
  bad: 'border-red-500/40 bg-red-500/10',
};

const TONE_ICON_STYLES: Record<Tone, string> = {
  good: 'text-green-600 dark:text-green-400',
  warn: 'text-amber-600 dark:text-amber-400',
  bad: 'text-red-600 dark:text-red-400',
};

const TONE_ICONS = { good: CheckCircle2, warn: AlertTriangle, bad: CloudLightning } as const;

const SOURCES = [
  {
    href: 'https://sre.google/sre-book/addressing-cascading-failures/',
    label: 'Google SRE book: Addressing Cascading Failures',
  },
  {
    href: 'https://sre.google/sre-book/handling-overload/',
    label: 'Google SRE book: Handling Overload (per-client retry budget)',
  },
  {
    href: 'https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf',
    label: 'Bronson et al., Metastable Failures in Distributed Systems (HotOS 2021)',
  },
  {
    href: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/',
    label: "Amazon Builders' Library: Timeouts, retries, and backoff with jitter",
  },
  {
    href: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/',
    label: 'AWS Architecture Blog: Exponential Backoff and Jitter',
  },
  {
    href: 'https://brooker.co.za/blog/2022/08/11/backoff.html',
    label: 'Marc Brooker: What is Backoff For?',
  },
  {
    href: 'https://github.com/grpc/proposal/blob/master/A6-client-retries.md',
    label: 'gRPC A6: Client Retries (retry throttling)',
  },
  {
    href: 'https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter',
    label: 'Envoy router filter: retry semantics',
  },
  {
    href: 'https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/route/v3/route_components.proto',
    label: 'Envoy RouteAction: route timeout (includes all retries) and retry_policy',
  },
];

function outcomeLabel(summary: SimSummary): { text: string; tone: Tone } {
  switch (summary.outcome) {
    case 'unaffected':
      return { text: 'No impact', tone: 'good' };
    case 'recovered':
      return {
        text: `Recovered +${summary.recoveryLagS}s`,
        tone: (summary.recoveryLagS ?? 0) <= 2 ? 'good' : 'warn',
      };
    case 'draining':
      return { text: `Draining at ${HORIZON_S}s`, tone: 'warn' };
    case 'metastable':
      return { text: `Not recovered by ${HORIZON_S}s`, tone: 'bad' };
  }
}

type CopyTarget = 'link' | 'envoy';

type CopyState =
  | { target: CopyTarget; status: 'copied' }
  | { target: CopyTarget; status: 'failed'; text: string }
  | null;

function useCopy() {
  const [state, setState] = useState<CopyState>(null);
  useEffect(() => {
    if (state?.status !== 'copied') return;
    const timer = setTimeout(() => setState(null), 2000);
    return () => clearTimeout(timer);
  }, [state]);
  const copy = useCallback(async (target: CopyTarget, text: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      setState({ target, status: 'copied' });
    } catch {
      // Insecure contexts, denied permissions and older browsers all land here.
      setState({ target, status: 'failed', text });
    }
  }, []);
  return { state, copy };
}

/** Shown when the clipboard is unavailable: the text, pre-selected for manual copy. */
function CopyFallback({ label, text, multiline }: { label: string; text: string; multiline?: boolean }) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, [text]);
  const className =
    'w-full rounded-md border bg-background px-3 py-2 font-mono text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <div className="w-full space-y-2">
      <p role="alert" className="text-sm text-amber-800 dark:text-amber-300">
        Couldn&rsquo;t copy automatically. The text below is selected; press Ctrl+C (&#8984;C on Mac) to
        copy it.
      </p>
      {multiline ? (
        <textarea
          ref={ref}
          readOnly
          aria-label={label}
          value={text}
          rows={8}
          onFocus={(event) => event.currentTarget.select()}
          className={className}
        />
      ) : (
        <input
          ref={ref}
          readOnly
          aria-label={label}
          value={text}
          onFocus={(event) => event.currentTarget.select()}
          className={className}
        />
      )}
    </div>
  );
}

export default function RetryStormSimulator() {
  const [config, setConfig] = useUrlConfig();
  const { state: copyState, copy } = useCopy();
  const copied = copyState?.status === 'copied' ? copyState.target : null;
  const copyFailure = copyState?.status === 'failed' ? copyState : null;

  const update = useCallback(<K extends keyof SimConfig>(key: K, value: SimConfig[K]) => {
    setConfig((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, [setConfig]);

  const result = useMemo(() => simulate(config), [config]);
  const verdict = useMemo(() => describeOutcome(config, result.summary), [config, result.summary]);

  // The ladder and tipping point re-run the model ~15 times; let them lag a
  // slider drag instead of blocking it.
  const deferredConfig = useDeferredValue(config);
  const ladder = useMemo(
    () =>
      buildLadder(deferredConfig).map((rung) => ({
        ...rung,
        summary: simulate(rung.config).summary,
      })),
    [deferredConfig]
  );
  const tippingPointS = useMemo(() => findTippingPointS(deferredConfig), [deferredConfig]);
  const takeaways = useMemo(
    () => buildTakeaways(config, result.summary, tippingPointS),
    [config, result.summary, tippingPointS]
  );
  const envoyYaml = useMemo(() => envoyRetryConfig(config), [config]);

  const activePreset = matchPreset(config);
  const { summary } = result;
  const VerdictIcon = TONE_ICONS[verdict.tone];
  const retriesEnabled = config.attemptsPerLayer > 1;

  const shareUrl = () => {
    const params = writeConfig(new URLSearchParams(window.location.search), config).toString();
    return `${window.location.origin}${window.location.pathname}${params ? `?${params}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="retry-storm-scenarios" className="space-y-3">
        <p className="text-sm text-muted-foreground">
          A dependency serves {count.format(HEALTHY_CAPACITY_RPS)} requests per second until something
          knocks it down at {INCIDENT_START_S}s. Pick an incident, then change how clients retry and see
          whether the system recovers on its own once capacity comes back.
        </p>
        <h2 id="retry-storm-scenarios" className="text-sm font-semibold">
          Scenarios
        </h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={activePreset?.id === preset.id ? 'default' : 'outline'}
              aria-pressed={activePreset?.id === preset.id}
              onClick={() => setConfig(preset.config)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
        <p className="text-sm">
          {activePreset ? activePreset.blurb : 'Custom configuration. Pick a scenario to reset.'}
        </p>
      </section>

      <div
        role="status"
        aria-live="polite"
        className={cn('flex gap-3 rounded-lg border p-4', TONE_STYLES[verdict.tone])}
      >
        <VerdictIcon aria-hidden="true" className={cn('mt-0.5 h-5 w-5 shrink-0', TONE_ICON_STYLES[verdict.tone])} />
        <div className="min-w-0 space-y-1">
          <p className="font-semibold leading-snug" data-testid="retry-storm-verdict">
            {verdict.title}
          </p>
          <p className="text-sm text-muted-foreground">{verdict.detail}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle as="h2" className="text-lg">
            Load at the dependency
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Stacked: what clients send. Lines: what the dependency can serve, and how much of it reaches
            a caller who is still waiting.
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <LoadChart
            series={result.series}
            incidentEndS={summary.incidentEndS}
            summaryText={chartSummary(config, summary, verdict)}
          />
        </CardContent>
      </Card>

      <dl className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Peak load"
          value={formatMultiplier(summary.peakAmplification)}
          detail="normal demand, at the dependency"
        />
        <Metric
          label="Failed requests"
          value={`${summary.failedPct}%`}
          detail={`${count.format(summary.failedRequests)} of ${count.format(summary.freshRequests)} in ${HORIZON_S}s`}
        />
        <Metric
          label="Wasted work"
          value={`${summary.wastedWorkPct}%`}
          detail="served after the caller gave up"
        />
        <Metric
          label="Tipping point"
          value={tippingPointS === null ? `None ≤ ${LIMITS.outageS.max}s` : `${tippingPointS}s`}
          detail={
            tippingPointS === null
              ? `every simulated trigger up to ${LIMITS.outageS.max}s recovers in this model`
              : `shortest trigger whose backlog is still growing at ${HORIZON_S}s, in this model`
          }
        />
      </dl>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
            <CardTitle as="h2" className="text-lg">
              The incident
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
            <RangeControl
              label="Normal load"
              value={config.loadPct}
              {...LIMITS.loadPct}
              format={(v) => `${v}% of capacity`}
              onChange={(v) => update('loadPct', v)}
            />
            <RangeControl
              label="Trigger duration"
              value={config.outageS}
              {...LIMITS.outageS}
              format={(v) => `${v}s`}
              onChange={(v) => update('outageS', v)}
            />
            <RangeControl
              label="Capacity during trigger"
              value={config.degradedCapacityPct}
              {...LIMITS.degradedCapacityPct}
              format={(v) => (v === 0 ? 'Hard down' : `${v}%`)}
              onChange={(v) => update('degradedCapacityPct', v)}
            />
            <OptionControl
              label="Client timeout per attempt"
              value={config.timeoutMs}
              options={TIMEOUT_OPTIONS_MS.map((ms) => ({ value: ms, label: formatMs(ms) }))}
              onChange={(v) => update('timeoutMs', v)}
              hint="Once the queue holds more than one timeout of work, every response arrives too late."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
            <CardTitle as="h2" className="text-lg">
              Retry policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
            <OptionControl
              label="Attempts per layer"
              value={config.attemptsPerLayer}
              options={[1, 2, 3, 4].map((n) => ({ value: n, label: n === 1 ? '1 (off)' : String(n) }))}
              onChange={(v) => update('attemptsPerLayer', v)}
            />
            <OptionControl
              label="Layers that retry"
              value={config.layers}
              options={[1, 2, 3].map((n) => ({ value: n, label: String(n) }))}
              onChange={(v) => update('layers', v)}
            />
            <AmplificationFan config={config} />
            <OptionControl
              label="Backoff"
              value={config.backoff}
              options={[
                { value: 'none', label: 'Immediate' },
                { value: 'exponential', label: 'Exponential + jitter' },
              ]}
              onChange={(v) => update('backoff', v)}
            />
            {config.backoff === 'exponential' && (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                <OptionControl
                  label="Base delay"
                  value={config.baseDelayMs}
                  options={BASE_DELAY_OPTIONS_MS.map((ms) => ({ value: ms, label: formatMs(ms) }))}
                  onChange={(v) => update('baseDelayMs', v)}
                />
                <OptionControl
                  label="Max delay"
                  value={config.maxDelayMs}
                  options={MAX_DELAY_OPTIONS_MS.map((ms) => ({ value: ms, label: formatMs(ms) }))}
                  onChange={(v) => update('maxDelayMs', v)}
                />
              </div>
            )}
            <OptionControl
              label="Retry budget"
              value={config.retryBudgetPct}
              options={BUDGET_OPTIONS_PCT.map((pct) => ({ value: pct, label: pct === 0 ? 'Off' : `${pct}%` }))}
              onChange={(v) => update('retryBudgetPct', v)}
              hint="Retries allowed per layer, as a share of first attempts over a rolling 10s window."
            />
            <div className="flex items-start gap-3">
              <Checkbox
                id="retry-storm-shed"
                checked={config.shedAbandoned}
                onCheckedChange={(checked) => update('shedAbandoned', checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="retry-storm-shed">Server sheds abandoned work</Label>
                <p className="text-xs text-muted-foreground">
                  Drop queued requests whose caller has already timed out (deadline propagation).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
          <CardTitle as="h2" className="text-lg">
            Same incident, one defense at a time
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Each row keeps the changes above it. Load a row to see its chart.
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <ol aria-label="Defense comparison" className="divide-y rounded-md border">
            {ladder.map((rung) => {
              const outcome = outcomeLabel(rung.summary);
              const current = configsEqual(rung.config, config);
              return (
                <li
                  key={rung.id}
                  className={cn(
                    // Mobile: label and action on one row, result underneath.
                    // Wider: label | result | action.
                    'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 p-3 [grid-template-areas:"label_action"_"result_result"]',
                    'sm:grid-cols-[minmax(0,1fr)_auto_4.5rem] sm:[grid-template-areas:"label_result_action"]',
                    current && 'bg-muted/50'
                  )}
                >
                  <div className="min-w-0 [grid-area:label]">
                    <p className="text-sm font-medium">{rung.label}</p>
                    <p className="text-xs text-muted-foreground">{rung.detail}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 [grid-area:result] sm:justify-end">
                    <Badge
                      variant="outline"
                      className={cn('whitespace-nowrap', TONE_STYLES[outcome.tone])}
                    >
                      {outcome.text}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono text-foreground">{rung.summary.failedPct}%</span> failed
                      {' · '}
                      <span className="font-mono text-foreground">
                        {formatMultiplier(rung.summary.peakAmplification)}
                      </span>{' '}
                      peak
                    </p>
                  </div>
                  {current ? (
                    <span className="justify-self-end text-xs font-medium text-muted-foreground [grid-area:action]">
                      Current
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-self-end [grid-area:action]"
                      aria-label={`Load policy: ${rung.label.replace(/^\+ /, '')}`}
                      onClick={() => setConfig(rung.config)}
                    >
                      Load
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
          <CardTitle as="h2" className="text-lg">
            What to change
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <ul className="space-y-3">
            {takeaways.map((takeaway) => (
              <li key={takeaway.id} className="text-sm">
                <p className="font-medium">{takeaway.title}</p>
                <p className="text-muted-foreground">{takeaway.body}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Collapsible className="rounded-lg border">
          <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium">
            Envoy starting point for this policy
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 px-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Fragments for specific parts of an Envoy v3 config: fields of a route&rsquo;s{' '}
              <code className="text-xs">RouteAction</code>
              {retriesEnabled && config.retryBudgetPct > 0 && (
                <>
                  , plus a field of the upstream <code className="text-xs">Cluster</code>
                </>
              )}
              . This is not a standalone file; merge it into your own config and review it there.
              Comments flag where Envoy and this model differ.
            </p>
            {retriesEnabled && (
              <ul className="list-disc space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 py-2 pl-8 pr-3 text-sm">
                <li>
                  Only retry requests that are safe to replay: idempotent operations, or writes carrying an
                  idempotency key the server deduplicates. <code className="text-xs">5xx</code> and{' '}
                  <code className="text-xs">reset</code> can retry a request the upstream already received.
                </li>
                <li>
                  Envoy&rsquo;s route <code className="text-xs">timeout</code> includes every retry and
                  defaults to 15s. The fragment sets one that covers this policy&rsquo;s attempts and
                  backoff; a shorter one silently cuts later retries off.
                </li>
              </ul>
            )}
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
              <code>{envoyYaml}</code>
            </pre>
            <Button type="button" variant="outline" size="sm" onClick={() => copy('envoy', envoyYaml)}>
              {copied === 'envoy' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied === 'envoy' ? 'Copied' : 'Copy YAML'}
            </Button>
            {copyFailure?.target === 'envoy' && (
              <CopyFallback label="Envoy YAML" text={copyFailure.text} multiline />
            )}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="rounded-lg border">
          <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium">
            How the model works, and what it leaves out
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 px-4 pb-4 text-sm">
            <p>
              This is a deterministic simulation for building intuition. It does not predict what your
              production system will do. Every {Math.round(TICK_S * 1000)}ms step, users send{' '}
              {config.loadPct}% of capacity in new requests, and retries that are due join them in one FIFO
              queue. The dependency serves the head of the queue at its current capacity. Attempts still
              waiting when the client timeout fires are abandoned. The client may retry them, but unless the
              server sheds abandoned work, the request stays in the queue and still costs capacity when it is
              eventually served.
            </p>
            <p>
              Two kinds of numbers appear on this page. Observed results (the verdict, the defense rows,
              the tipping point) come from a finite {HORIZON_S}s run: &ldquo;not recovered&rdquo; means the
              backlog was still growing when the run ended. The tipping point re-runs the scenario with longer
              and longer triggers to find the shortest one where that happens. Model bounds (the worst-case
              amplification and the load below which the backlog always drains) are calculated from the
              model&rsquo;s rules rather than observed: capacity divided by worst-case amplification.
              Neither is a guarantee about a real system.
            </p>
            <div>
              <h3 className="font-medium">Simplifications</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
                {MODEL_LIMITS.map((limit) => (
                  <li key={limit}>{limit}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Sources</h3>
              <ul className="mt-2 space-y-1.5">
                {SOURCES.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:no-underline"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-muted-foreground">
              The simulation runs in your browser, and this tool doesn&rsquo;t send your settings anywhere.
              They are kept in the page URL so links can be shared, so anything that sees page URLs,
              including this site&rsquo;s general page analytics, can see them too.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => copy('link', shareUrl())}>
          {copied === 'link' ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
          {copied === 'link' ? 'Link copied' : 'Copy link to this scenario'}
        </Button>
        <span className="sr-only" aria-live="polite">
          {copied === 'link' ? 'Link copied to clipboard' : copied === 'envoy' ? 'YAML copied to clipboard' : ''}
        </span>
        {copyFailure?.target === 'link' && <CopyFallback label="Link to this scenario" text={copyFailure.text} />}
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        <span className="block font-mono text-2xl font-semibold tabular-nums">{value}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </dd>
    </div>
  );
}
