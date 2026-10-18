import { useState, useMemo, useCallback, useEffect, useId, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Check, AlertTriangle, Info, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { trackToolEvent } from '@/lib/trackToolEvent';
import {
  generateYaml,
  HOURS_PER_MONTH,
  POSTURES,
  POSTURE_CONFIG,
  type Recommendation,
} from './calculations';
import { evaluate, REQUIRED_FIELDS, type ErrorKey, type FormErrors } from './evaluate';
import {
  readState,
  writeState,
  toolParams,
  DEFAULT_STATE,
  MAX_FIELD_LENGTH,
  type FormState,
  type RightsizerState,
} from './url-state';
import { MethodNotes } from './MethodNotes';
import { DOCS } from './docs-links';

const CARD_HEADER = 'p-4 pb-3 sm:p-6 sm:pb-3';
const CARD_CONTENT = 'p-4 pt-0 sm:p-6 sm:pt-0';

const FIELD_LABELS: Record<ErrorKey, string> = {
  replicas: 'Replicas',
  cpuRequest: 'CPU request',
  cpuLimit: 'CPU limit',
  memRequest: 'Memory request',
  memLimit: 'Memory limit',
  cpuP50: 'CPU P50',
  cpuP95: 'CPU P95',
  cpuP99: 'CPU P99',
  cpuMax: 'CPU max',
  memP50: 'Memory P50',
  memP95: 'Memory P95',
  memP99: 'Memory P99',
  memMax: 'Memory max',
  cpuPrice: 'CPU price',
  memPrice: 'Memory price',
  cpuUsage: 'CPU usage',
  memUsage: 'Memory usage',
  general: 'Inputs',
};

/** Where to move focus when an error is selected from the summary */
const ERROR_FOCUS_TARGET: Partial<Record<ErrorKey, keyof FormState>> = {
  cpuUsage: 'cpuP95',
  memUsage: 'memP95',
};

const fieldId = (key: keyof FormState) => `rightsizer-${key}`;

const money = (value: number, digits = 2) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits });

function formatChange(current: number, recommended: number): string {
  if (current === 0) return recommended === 0 ? '—' : 'new';
  const percent = Math.round(((recommended - current) / current) * 100);
  if (percent === 0) return '0%';
  return `${percent > 0 ? '+' : '−'}${Math.abs(percent)}%`;
}

interface FieldProps {
  name: keyof FormState;
  label: string;
  value: string;
  error?: string;
  onChange: (name: keyof FormState, value: string) => void;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  inputMode?: 'decimal' | 'numeric' | 'text';
  prefix?: string;
}

function Field({ name, label, value, error, onChange, placeholder, hint, optional, inputMode = 'text', prefix }: FieldProps) {
  const id = fieldId(name);
  // The hint is replaced by the error, so describe the field by whichever is rendered
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="flex flex-wrap items-baseline gap-x-1">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <div className="relative mt-1">
        {prefix && (
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={MAX_FIELD_LENGTH}
          autoComplete="off"
          spellCheck={false}
          required={!optional && REQUIRED_FIELDS.includes(name)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn('font-mono', prefix && 'pl-6', error && 'border-destructive focus-visible:ring-destructive')}
        />
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive [overflow-wrap:anywhere]">{error}</p>
      )}
    </div>
  );
}

function GroupError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function ErrorSummary({ errors }: { errors: FormErrors }) {
  const entries = (Object.entries(errors) as Array<[ErrorKey, string]>)
    .filter(([key]) => key !== 'cpuPrice' && key !== 'memPrice');
  return (
    <Card className="border-destructive">
      <CardHeader className={CARD_HEADER}>
        <CardTitle as="h2" className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
          No recommendation yet
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(CARD_CONTENT, 'space-y-2 text-sm [overflow-wrap:anywhere]')}>
        <p>
          Fix {entries.length === 1 ? 'this input' : `these ${entries.length} inputs`} to see a recommendation and YAML:
        </p>
        <ul className="space-y-1">
          {entries.map(([key, message]) => (
            <li key={key}>
              {key === 'general' ? (
                FIELD_LABELS[key]
              ) : (
                <button
                  type="button"
                  className="text-left underline underline-offset-2 hover:text-foreground"
                  onClick={() => document.getElementById(fieldId(ERROR_FOCUS_TARGET[key] ?? (key as keyof FormState)))?.focus()}
                >
                  {FIELD_LABELS[key]}
                </button>
              )}
              <span className="text-muted-foreground">: {message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function currentCell(raw: string, fallback?: string): string {
  const value = raw.trim();
  if (value) return value;
  return fallback ? `Not set (uses limit ${fallback})` : 'Not set';
}

function RecommendationCard({ recommendation, form }: { recommendation: Recommendation; form: FormState }) {
  const config = POSTURE_CONFIG[recommendation.posture];
  const rows = [
    {
      label: 'CPU request',
      current: currentCell(form.cpuRequest, form.cpuLimit.trim() || undefined),
      recommended: recommendation.requests.cpu,
      basis: recommendation.basis.cpuRequest,
    },
    {
      label: 'CPU limit',
      current: currentCell(form.cpuLimit),
      recommended: recommendation.limits.cpu ?? 'None',
      basis: recommendation.basis.cpuLimit ?? 'Omitted by choice',
    },
    {
      label: 'Memory request',
      current: currentCell(form.memRequest, form.memLimit.trim() || undefined),
      recommended: recommendation.requests.memory,
      basis: recommendation.basis.memoryRequest,
    },
    {
      label: 'Memory limit',
      current: currentCell(form.memLimit),
      recommended: recommendation.limits.memory,
      basis: recommendation.basis.memoryLimit,
    },
  ];
  const warnings = recommendation.findings.filter((f) => f.severity === 'warning');
  const notes = recommendation.findings.filter((f) => f.severity === 'info');

  return (
    <Card>
      <CardHeader className={CARD_HEADER}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle as="h2" className="text-lg">Recommendation</CardTitle>
          <Badge
            variant="outline"
            className={cn(config.risk === 'higher' && 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400')}
          >
            {config.label} posture
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Per container, per replica. A starting point to validate, not a guarantee.</p>
      </CardHeader>
      <CardContent className={cn(CARD_CONTENT, 'space-y-4')}>
        <table className="w-full table-fixed text-sm" aria-label="Current and recommended resources">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="w-[36%] py-2 pr-2 font-medium">Setting</th>
              <th scope="col" className="py-2 pr-2 font-medium">Current</th>
              <th scope="col" className="py-2 font-medium">Recommended</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border align-top">
                <th scope="row" className="py-2 pr-2 font-normal text-muted-foreground">{row.label}</th>
                <td className="py-2 pr-2 font-mono break-words">{row.current}</td>
                <td className="py-2">
                  <div className="font-mono font-semibold">{row.recommended}</div>
                  <div className="text-xs text-muted-foreground">{row.basis}</div>
                </td>
              </tr>
            ))}
            <tr className="border-t border-border align-top">
              <th scope="row" className="py-2 pr-2 font-normal text-muted-foreground">
                <a href={DOCS.qos} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  QoS class
                </a>
                <span className="block text-xs">Assumes a single-container pod; sidecars can change the actual class.</span>
              </th>
              <td className="py-2 pr-2">{recommendation.currentQosClass}</td>
              <td className="py-2">{recommendation.qosClass}</td>
            </tr>
          </tbody>
        </table>

        {(warnings.length > 0 || notes.length > 0) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Check before applying</h3>
            <ul className="space-y-2 text-sm [overflow-wrap:anywhere]">
              {warnings.map((finding) => (
                <li key={finding.text} className="flex gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span><span className="sr-only">Warning: </span>{finding.text}</span>
                </li>
              ))}
              {notes.map((finding) => (
                <li key={finding.text} className="flex gap-2 text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{finding.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function YamlCard({ yaml }: { yaml: string }) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);
  // A stale "Copied" would claim the new YAML was copied
  useEffect(() => setCopyStatus('idle'), [yaml]);

  const handleCopy = useCallback(async () => {
    clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(yaml);
      setCopyStatus('copied');
      trackToolEvent({ tool_name: 'k8s_rightsizer', action: 'copy_yaml', event_label: 'yaml' });
    } catch {
      setCopyStatus('failed');
      // Select the snippet so manual copy is one keystroke away
      const selection = window.getSelection();
      if (preRef.current && selection) {
        selection.selectAllChildren(preRef.current);
      }
    }
    resetTimer.current = setTimeout(() => setCopyStatus('idle'), 4000);
  }, [yaml]);

  return (
    <Card>
      <CardHeader className={CARD_HEADER}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle as="h2" className="text-lg">YAML</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copyStatus === 'copied' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copyStatus === 'copied' ? 'Copied' : 'Copy YAML'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn(CARD_CONTENT, 'space-y-3')}>
        <pre
          ref={preRef}
          tabIndex={0}
          aria-label="Recommended resources YAML"
          className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm"
        >
          {yaml}
        </pre>
        <p role="status" className={cn('text-xs', copyStatus === 'failed' ? 'text-destructive' : 'text-muted-foreground')}>
          {copyStatus === 'failed'
            ? 'Copy failed. The snippet is selected; copy it manually.'
            : copyStatus === 'copied'
              ? 'Copied to clipboard.'
              : 'Paste into the container entry under spec.containers[].'}
        </p>
        <div className="rounded-md border border-dashed p-3 text-sm">
          <h3 className="font-medium">Roll out in steps</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Apply to a canary or one environment first, not the whole fleet.</li>
            <li>
              Watch a full traffic cycle: CPU throttling, OOMKilled restarts, evictions, and your latency
              and error SLOs.
            </li>
            <li>Promote if it holds; revert and re-measure if it doesn't.</li>
            <li>Re-measure after major releases or traffic changes.</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

interface CostCardProps {
  recommendation: Recommendation | null;
  replicas: number | null;
  pricingValid: boolean;
  form: FormState;
  errors: FormErrors;
  onChange: (name: keyof FormState, value: string) => void;
}

function CostCard({ recommendation, replicas, pricingValid, form, errors, onChange }: CostCardProps) {
  const costs = recommendation?.costs;
  const showCosts = costs && pricingValid && replicas !== null;
  const rows = costs ? [
    { label: 'CPU', current: costs.current.cpu, recommended: costs.recommended.cpu },
    { label: 'Memory', current: costs.current.memory, recommended: costs.recommended.memory },
  ] : [];
  const delta = costs ? costs.recommended.total - costs.current.total : 0;

  return (
    <Card>
      <CardHeader className={CARD_HEADER}>
        <CardTitle as="h2" className="text-lg">Illustrative request cost</CardTitle>
        <p className="text-sm text-muted-foreground">
          Requests reserve node capacity, so this prices requests (limits are not counted).
        </p>
      </CardHeader>
      <CardContent className={cn(CARD_CONTENT, 'space-y-4')}>
        <div className="grid gap-3 min-[360px]:grid-cols-2">
          <Field
            name="cpuPrice"
            label="Per vCPU-hour"
            prefix="$"
            inputMode="decimal"
            value={form.cpuPrice}
            error={errors.cpuPrice}
            onChange={onChange}
          />
          <Field
            name="memPrice"
            label="Per GiB-hour"
            prefix="$"
            inputMode="decimal"
            value={form.memPrice}
            error={errors.memPrice}
            onChange={onChange}
          />
        </div>

        {showCosts ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm" aria-label="Monthly request cost">
                <thead>
                  <tr className="text-muted-foreground">
                    <th scope="col" className="py-2 pr-2 text-left font-medium">Monthly</th>
                    <th scope="col" className="px-1 py-2 text-right font-medium">Current</th>
                    <th scope="col" className="px-1 py-2 text-right font-medium">Rec.</th>
                    <th scope="col" className="py-2 pl-1 text-right font-medium">Change</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row" className="py-1.5 pr-2 text-left font-sans font-normal text-muted-foreground">{row.label}</th>
                      <td className="px-1 py-1.5 text-right">{money(row.current)}</td>
                      <td className="px-1 py-1.5 text-right">{money(row.recommended)}</td>
                      <td className="py-1.5 pl-1 text-right">{formatChange(row.current, row.recommended)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-medium">
                    <th scope="row" className="py-2 pr-2 text-left font-sans font-medium">Total</th>
                    <td className="px-1 py-2 text-right">{money(costs.current.total)}</td>
                    <td className="px-1 py-2 text-right">{money(costs.recommended.total)}</td>
                    <td className="py-2 pl-1 text-right">{formatChange(costs.current.total, costs.recommended.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm">
              {delta < 0 && <>About <strong>{money(-delta)}/mo</strong> ({money(-delta * 12, 0)}/yr) less reserved capacity at these prices.</>}
              {delta > 0 && <>About <strong>{money(delta)}/mo</strong> more reserved capacity: current requests are below what this posture asks for.</>}
              {delta === 0 && <>No change in reserved capacity.</>}
            </p>
            <p className="text-xs text-muted-foreground">
              {replicas} replica{replicas === 1 ? '' : 's'} × requests × {HOURS_PER_MONTH} h/month at your prices. These
              are accounting assumptions, not a provider quote. Your bill only changes if freed capacity lets nodes
              be removed or packed more densely (for example, by a cluster autoscaler).
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {recommendation ? 'Enter valid prices to estimate cost.' : 'Cost appears once the sizing inputs are valid.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function K8sRightsizer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<RightsizerState>(() => readState(searchParams));
  const evaluation = useMemo(() => evaluate(state), [state]);
  const { form, posture, includeCpuLimit } = state;
  const { errors, recommendation } = evaluation;
  const postureIndex = POSTURES.indexOf(posture);
  const config = POSTURE_CONFIG[posture];
  const postureHintId = useId();

  // Two-way URL sync. `lastSynced` is the tool's slice of the URL as of the last
  // write or adoption; a URL whose slice differs from it came from someone else
  // (Back/Forward, a link) and wins over local state. Comparing against the
  // URL rather than local state keeps keystrokes typed during the debounce.
  const lastSynced = useRef(toolParams(searchParams));

  const adoptUrl = useCallback((params: URLSearchParams) => {
    const incoming = toolParams(params);
    if (incoming === lastSynced.current) return false;
    lastSynced.current = incoming;
    setState(readState(params));
    return true;
  }, []);

  useEffect(() => {
    adoptUrl(searchParams);
  }, [searchParams, adoptUrl]);

  // Write with replace (no history entry per keystroke). Read the live URL at
  // write time so parameters owned elsewhere (e.g. ?theme=dark) survive.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const current = new URLSearchParams(window.location.search);
      // The router may not have rendered a navigation yet; never overwrite it.
      if (adoptUrl(current)) return;
      const next = writeState(state, current);
      lastSynced.current = toolParams(next);
      if (next.toString() !== current.toString()) {
        setSearchParams(next, { replace: true, preventScrollReset: true });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [state, setSearchParams, adoptUrl]);

  const updateField = useCallback((name: keyof FormState, value: string) => {
    setState((prev) => ({ ...prev, form: { ...prev.form, [name]: value } }));
  }, []);

  const handleReset = useCallback(() => {
    setState(DEFAULT_STATE);
    trackToolEvent({ tool_name: 'k8s_rightsizer', action: 'reset', event_label: 'example' });
  }, []);

  const yaml = recommendation ? generateYaml(recommendation) : '';

  const fieldProps = (name: keyof FormState) => ({
    name,
    value: form[name],
    error: errors[name],
    onChange: updateField,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Enter one container's current spec and its measured usage. The tool suggests requests and limits for the
          posture you pick, flags what the numbers can't tell you, and keeps everything in the URL so you can share it.
        </p>
        <Button variant="outline" size="sm" onClick={handleReset} className="shrink-0 gap-2 self-start">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset example
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className={CARD_HEADER}>
              <CardTitle as="h2" className="text-lg">Current spec</CardTitle>
              <p className="text-sm text-muted-foreground">
                From the container's <code className="text-xs">resources</code>. Leave a field empty if it isn't set.
              </p>
            </CardHeader>
            <CardContent className={cn(CARD_CONTENT, 'space-y-3')}>
              <div className="grid gap-3 min-[360px]:grid-cols-2">
                <Field {...fieldProps('cpuRequest')} label="CPU request" placeholder="500m" hint="e.g. 250m or 0.5" />
                <Field {...fieldProps('cpuLimit')} label="CPU limit" placeholder="1" />
                <Field {...fieldProps('memRequest')} label="Memory request" placeholder="512Mi" hint="e.g. 512Mi or 2Gi" />
                <Field {...fieldProps('memLimit')} label="Memory limit" placeholder="1Gi" />
                <Field {...fieldProps('replicas')} label="Replicas" placeholder="3" inputMode="numeric" hint="Scales cost only" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={CARD_HEADER}>
              <CardTitle as="h2" className="text-lg">Observed usage</CardTitle>
              <p className="text-sm text-muted-foreground">
                Per container for one replica (not a deployment total), over a window that includes peak traffic.
                P95 and Max are required. <a href="#rightsizer-method" className="underline underline-offset-2 hover:text-foreground">Where to get these</a>
              </p>
            </CardHeader>
            <CardContent className={cn(CARD_CONTENT, 'space-y-5')}>
              <fieldset className="min-w-0 space-y-3" aria-describedby={errors.cpuUsage ? 'rightsizer-cpu-usage-error' : undefined}>
                <legend className="mb-2 text-sm font-semibold">CPU</legend>
                <div className="grid grid-cols-2 gap-3">
                  <Field {...fieldProps('cpuP50')} label="P50" optional placeholder="100m" />
                  <Field {...fieldProps('cpuP95')} label="P95" placeholder="200m" />
                  <Field {...fieldProps('cpuP99')} label="P99" optional placeholder="300m" />
                  <Field {...fieldProps('cpuMax')} label="Max" placeholder="400m" />
                </div>
                <GroupError id="rightsizer-cpu-usage-error" message={errors.cpuUsage} />
              </fieldset>
              <fieldset className="min-w-0 space-y-3" aria-describedby={errors.memUsage ? 'rightsizer-mem-usage-error' : undefined}>
                <legend className="mb-2 text-sm font-semibold">Memory (working set)</legend>
                <div className="grid grid-cols-2 gap-3">
                  <Field {...fieldProps('memP50')} label="P50" optional placeholder="256Mi" />
                  <Field {...fieldProps('memP95')} label="P95" placeholder="400Mi" />
                  <Field {...fieldProps('memP99')} label="P99" optional placeholder="450Mi" />
                  <Field {...fieldProps('memMax')} label="Max" placeholder="512Mi" />
                </div>
                <GroupError id="rightsizer-mem-usage-error" message={errors.memUsage} />
              </fieldset>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={CARD_HEADER}>
              <CardTitle as="h2" className="text-lg">Sizing posture</CardTitle>
            </CardHeader>
            <CardContent className={cn(CARD_CONTENT, 'space-y-4')}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Efficiency</span>
                <span className="font-semibold">{config.label}</span>
                <span className="text-muted-foreground">Headroom</span>
              </div>
              <Slider
                value={[postureIndex]}
                onValueChange={([value]) => setState((prev) => ({ ...prev, posture: POSTURES[value] }))}
                onValueCommit={([value]) => trackToolEvent({ tool_name: 'k8s_rightsizer', action: 'posture_change', event_label: POSTURES[value] })}
                min={0}
                max={POSTURES.length - 1}
                step={1}
                aria-label="Sizing posture"
                aria-valuetext={config.label}
                aria-describedby={postureHintId}
                className="py-2"
              />
              <div id={postureHintId} className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Typical fit:</span> {config.fit}.
                </p>
                <p className="text-muted-foreground">
                  CPU request from {config.basePercentile.toUpperCase()}, limits from Max × {config.limitMultiplier.toFixed(1)}.
                  {config.risk === 'higher' && ' Less headroom for spikes and growth.'}
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                  id="rightsizer-cpu-limit"
                  checked={includeCpuLimit}
                  onCheckedChange={(checked) => setState((prev) => ({ ...prev, includeCpuLimit: checked === true }))}
                  aria-describedby="rightsizer-cpu-limit-hint"
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="rightsizer-cpu-limit">Set a CPU limit</Label>
                  <p id="rightsizer-cpu-limit-hint" className="text-xs text-muted-foreground">
                    CPU limits are enforced by throttling. Some teams omit them so containers can use idle node CPU;
                    others require them. Memory always gets a limit here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output */}
        <div className="min-w-0 space-y-6">
          {recommendation ? (
            <>
              <RecommendationCard recommendation={recommendation} form={form} />
              <YamlCard yaml={yaml} />
            </>
          ) : (
            <ErrorSummary errors={errors} />
          )}
          <CostCard
            recommendation={recommendation}
            replicas={evaluation.replicas}
            pricingValid={evaluation.pricingValid}
            form={form}
            errors={errors}
            onChange={updateField}
          />
        </div>
      </div>

      <MethodNotes />
    </div>
  );
}
