import { useState, useMemo, useCallback } from 'react';
import { Copy, Check, AlertTriangle, TrendingDown, TrendingUp, Info, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { trackToolEvent } from '@/lib/trackToolEvent';
import {
  parseCpu,
  parseMemory,
  normalizePercentiles,
  calculateRecommendation,
  generateYaml,
  PRESET_SLIDER_VALUES,
  CLOUD_PRICING,
  HOURS_PER_MONTH,
  type PresetProfile,
  type PercentileInput,
  type CloudProvider,
} from './calculations';

type ResourceType = 'cpu' | 'memory';

interface FormState {
  replicas: string;
  currentCpuRequests: string;
  currentCpuLimits: string;
  currentMemRequests: string;
  currentMemLimits: string;
  cpuP50: string;
  cpuP95: string;
  cpuP99: string;
  cpuMax: string;
  memP50: string;
  memP95: string;
  memP99: string;
  memMax: string;
}

const DEFAULT_FORM: FormState = {
  replicas: '3',
  currentCpuRequests: '500m',
  currentCpuLimits: '1',
  currentMemRequests: '512Mi',
  currentMemLimits: '1Gi',
  cpuP50: '100m',
  cpuP95: '200m',
  cpuP99: '300m',
  cpuMax: '400m',
  memP50: '256Mi',
  memP95: '400Mi',
  memP99: '450Mi',
  memMax: '512Mi',
};

const PRESETS: { id: PresetProfile; label: string; description: string }[] = [
  { id: 'webserver', label: 'Web Server', description: 'Request-response, some bursts' },
  { id: 'worker', label: 'Worker', description: 'Batch processing, predictable' },
  { id: 'database', label: 'Database', description: 'Memory-sensitive, avoid OOMKill' },
  { id: 'custom', label: 'Custom', description: 'Manual slider adjustment' },
];

// Common CPU values for quick selection
const CPU_PRESETS = [
  { value: '50m', label: '50m', description: '0.05 cores' },
  { value: '100m', label: '100m', description: '0.1 cores' },
  { value: '250m', label: '250m', description: '0.25 cores' },
  { value: '500m', label: '500m', description: '0.5 cores' },
  { value: '1', label: '1', description: '1 core' },
  { value: '2', label: '2', description: '2 cores' },
  { value: '4', label: '4', description: '4 cores' },
];

// Common memory values for quick selection
const MEMORY_PRESETS = [
  { value: '64Mi', label: '64Mi', description: '64 MiB' },
  { value: '128Mi', label: '128Mi', description: '128 MiB' },
  { value: '256Mi', label: '256Mi', description: '256 MiB' },
  { value: '512Mi', label: '512Mi', description: '512 MiB' },
  { value: '1Gi', label: '1Gi', description: '1 GiB' },
  { value: '2Gi', label: '2Gi', description: '2 GiB' },
  { value: '4Gi', label: '4Gi', description: '4 GiB' },
  { value: '8Gi', label: '8Gi', description: '8 GiB' },
];

function getRiskColor(risk: 'low' | 'medium' | 'high') {
  switch (risk) {
    case 'low': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    case 'high': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  }
}

/**
 * Format cost change as percentage, handling edge cases
 * Returns "—" when current is 0 but recommended > 0 (can't calculate %)
 */
function formatCostChangePercent(current: number, savings: number): string {
  if (current === 0) {
    // Can't calculate percentage from zero base
    // If recommended > 0, it's an increase from nothing
    return savings < 0 ? '+∞' : '—';
  }
  const percent = Math.round((savings / current) * 100);
  return `${savings >= 0 ? '-' : '+'}${Math.abs(percent)}%`;
}

// Combobox-style input with integrated dropdown
interface ResourceInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  presets: typeof CPU_PRESETS;
  tooltip: React.ReactNode;
}

function ResourceInput({ id, label, value, onChange, placeholder, presets, tooltip }: ResourceInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <Label htmlFor={id}>{label}</Label>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="pr-8 font-mono"
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(!open)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={cn("transition-transform", open && "rotate-180")}>
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full min-w-[180px] rounded-md border bg-popover p-1 shadow-md">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Common values</div>
            {presets.map((p) => (
              <button
                key={p.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(p.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                  value === p.value && "bg-accent"
                )}
              >
                <span className="font-mono">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function K8sRightsizer() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [slider, setSlider] = useState(50);
  const [preset, setPreset] = useState<PresetProfile>('custom');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ResourceType>('cpu');
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>('default');

  const updateField = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePresetChange = useCallback((newPreset: PresetProfile) => {
    setPreset(newPreset);
    setSlider(PRESET_SLIDER_VALUES[newPreset]);
    trackToolEvent('k8s-rightsizer', 'preset_change', { preset: newPreset });
  }, []);

  const handleSliderChange = useCallback((values: number[]) => {
    setSlider(values[0]);
    setPreset('custom');
  }, []);

  // Compute recommendation
  const { recommendation, error } = useMemo(() => {
    try {
      // Parse current values
      const currentCpu = {
        requests: parseCpu(form.currentCpuRequests),
        limits: parseCpu(form.currentCpuLimits),
      };
      const currentMem = {
        requests: parseMemory(form.currentMemRequests),
        limits: parseMemory(form.currentMemLimits),
      };

      // Parse CPU percentiles
      const cpuInput: PercentileInput = {
        p95: parseCpu(form.cpuP95),
        max: parseCpu(form.cpuMax),
      };
      if (form.cpuP50.trim()) cpuInput.p50 = parseCpu(form.cpuP50);
      if (form.cpuP99.trim()) cpuInput.p99 = parseCpu(form.cpuP99);
      const cpuPercentiles = normalizePercentiles(cpuInput);

      // Parse memory percentiles
      const memInput: PercentileInput = {
        p95: parseMemory(form.memP95),
        max: parseMemory(form.memMax),
      };
      if (form.memP50.trim()) memInput.p50 = parseMemory(form.memP50);
      if (form.memP99.trim()) memInput.p99 = parseMemory(form.memP99);
      const memPercentiles = normalizePercentiles(memInput);

      const replicas = Math.max(1, Math.floor(parseInt(form.replicas, 10) || 1));

      const pricing = CLOUD_PRICING[cloudProvider];
      const result = calculateRecommendation({
        usage: {
          cpu: cpuPercentiles,
          memory: memPercentiles,
        },
        current: {
          requests: { cpu: currentCpu.requests, memory: currentMem.requests },
          limits: { cpu: currentCpu.limits, memory: currentMem.limits },
        },
        replicas,
        slider,
        costPerCoreHour: pricing.cpu,
        costPerGiBHour: pricing.memory,
      });

      return { recommendation: result, error: null, validatedReplicas: replicas };
    } catch (e) {
      return { recommendation: null, error: e instanceof Error ? e.message : 'Invalid input', validatedReplicas: 1 };
    }
  }, [form, slider, cloudProvider]);

  const validatedReplicas = useMemo(() => {
    return Math.max(1, Math.floor(parseInt(form.replicas, 10) || 1));
  }, [form.replicas]);

  const yaml = recommendation ? generateYaml(recommendation) : '';

  const handleCopy = useCallback(async () => {
    if (!yaml) return;
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackToolEvent('k8s-rightsizer', 'copy_yaml');
    } catch {
      // Fallback for browsers without clipboard API or in non-secure contexts
      console.warn('Clipboard API failed, copy manually');
    }
  }, [yaml]);

  const sliderLabel = useMemo(() => {
    if (slider < 20) return 'Aggressive';
    if (slider < 40) return 'Efficient';
    if (slider < 60) return 'Balanced';
    if (slider < 80) return 'Conservative';
    return 'Safe';
  }, [slider]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Preset Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Workload Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    preset === p.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Inputs */}
          <div className="space-y-6">
            {/* Current Resources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Current Configuration
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your current requests/limits from the deployment spec</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="replicas">Replicas</Label>
                    <Input
                      id="replicas"
                      value={form.replicas}
                      onChange={(e) => updateField('replicas', e.target.value)}
                      placeholder="3"
                    />
                  </div>
                  <ResourceInput
                    id="currentCpuRequests"
                    label="CPU Requests"
                    value={form.currentCpuRequests}
                    onChange={(v) => updateField('currentCpuRequests', v)}
                    placeholder="500m"
                    presets={CPU_PRESETS}
                    tooltip={
                      <div className="space-y-1">
                        <p className="font-medium">CPU in millicores (m)</p>
                        <p>1000m = 1 CPU core</p>
                        <p className="text-xs">Example: 500m = half a core</p>
                      </div>
                    }
                  />
                  <ResourceInput
                    id="currentCpuLimits"
                    label="CPU Limits"
                    value={form.currentCpuLimits}
                    onChange={(v) => updateField('currentCpuLimits', v)}
                    placeholder="1"
                    presets={CPU_PRESETS}
                    tooltip={
                      <div className="space-y-1">
                        <p className="font-medium">CPU in millicores (m)</p>
                        <p>1000m = 1 CPU core</p>
                        <p className="text-xs">Limits cap max CPU usage</p>
                      </div>
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ResourceInput
                    id="currentMemRequests"
                    label="Memory Requests"
                    value={form.currentMemRequests}
                    onChange={(v) => updateField('currentMemRequests', v)}
                    placeholder="512Mi"
                    presets={MEMORY_PRESETS}
                    tooltip={
                      <div className="space-y-1">
                        <p className="font-medium">Memory in binary units</p>
                        <p>Mi = mebibytes, Gi = gibibytes</p>
                        <p className="text-xs">1Gi = 1024Mi</p>
                      </div>
                    }
                  />
                  <ResourceInput
                    id="currentMemLimits"
                    label="Memory Limits"
                    value={form.currentMemLimits}
                    onChange={(v) => updateField('currentMemLimits', v)}
                    placeholder="1Gi"
                    presets={MEMORY_PRESETS}
                    tooltip={
                      <div className="space-y-1">
                        <p className="font-medium">Memory in binary units</p>
                        <p>Mi = mebibytes, Gi = gibibytes</p>
                        <p className="text-xs">Exceeding limits causes OOMKill</p>
                      </div>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Observed Usage */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Observed Usage Percentiles
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Get these from your monitoring (Prometheus, Datadog, etc.).</p>
                      <p className="mt-1 text-xs">P95 and Max are required. P50 and P99 are optional.</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ResourceType)}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="cpu">CPU</TabsTrigger>
                    <TabsTrigger value="memory">Memory</TabsTrigger>
                  </TabsList>

                  <TabsContent value="cpu" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <ResourceInput
                        id="cpuP50"
                        label="P50 (optional)"
                        value={form.cpuP50}
                        onChange={(v) => updateField('cpuP50', v)}
                        placeholder="100m"
                        presets={CPU_PRESETS}
                        tooltip={<p>Median CPU usage - 50% of samples are below this</p>}
                      />
                      <ResourceInput
                        id="cpuP95"
                        label="P95 *"
                        value={form.cpuP95}
                        onChange={(v) => updateField('cpuP95', v)}
                        placeholder="200m"
                        presets={CPU_PRESETS}
                        tooltip={<p>95th percentile - 95% of samples are below this</p>}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ResourceInput
                        id="cpuP99"
                        label="P99 (optional)"
                        value={form.cpuP99}
                        onChange={(v) => updateField('cpuP99', v)}
                        placeholder="300m"
                        presets={CPU_PRESETS}
                        tooltip={<p>99th percentile - captures peak usage</p>}
                      />
                      <ResourceInput
                        id="cpuMax"
                        label="Max *"
                        value={form.cpuMax}
                        onChange={(v) => updateField('cpuMax', v)}
                        placeholder="400m"
                        presets={CPU_PRESETS}
                        tooltip={<p>Maximum observed CPU usage</p>}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="memory" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <ResourceInput
                        id="memP50"
                        label="P50 (optional)"
                        value={form.memP50}
                        onChange={(v) => updateField('memP50', v)}
                        placeholder="256Mi"
                        presets={MEMORY_PRESETS}
                        tooltip={<p>Median memory usage - 50% of samples are below this</p>}
                      />
                      <ResourceInput
                        id="memP95"
                        label="P95 *"
                        value={form.memP95}
                        onChange={(v) => updateField('memP95', v)}
                        placeholder="400Mi"
                        presets={MEMORY_PRESETS}
                        tooltip={<p>95th percentile - 95% of samples are below this</p>}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ResourceInput
                        id="memP99"
                        label="P99 (optional)"
                        value={form.memP99}
                        onChange={(v) => updateField('memP99', v)}
                        placeholder="450Mi"
                        presets={MEMORY_PRESETS}
                        tooltip={<p>99th percentile - captures peak usage</p>}
                      />
                      <ResourceInput
                        id="memMax"
                        label="Max *"
                        value={form.memMax}
                        onChange={(v) => updateField('memMax', v)}
                        placeholder="512Mi"
                        presets={MEMORY_PRESETS}
                        tooltip={<p>Maximum observed memory usage</p>}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Risk Slider */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Risk Preference</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Efficiency</span>
                  <span className="font-medium">{sliderLabel}</span>
                  <span className="text-muted-foreground">Safety</span>
                </div>
                <Slider
                  value={[slider]}
                  onValueChange={handleSliderChange}
                  min={0}
                  max={100}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Lower cost, higher risk</span>
                  <span>Higher cost, lower risk</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Recommendation */}
          <div className="space-y-6">
            {error ? (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            ) : recommendation ? (
              <>
                {/* Recommendation Summary Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Recommendation</CardTitle>
                      <Badge variant="outline" className={getRiskColor(recommendation.risk)}>
                        {recommendation.risk} risk
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Side by side comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Current</div>
                        <div className="space-y-1 text-sm">
                          <div>CPU: {form.currentCpuRequests} / {form.currentCpuLimits}</div>
                          <div>Mem: {form.currentMemRequests} / {form.currentMemLimits}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Recommended</div>
                        <div className="space-y-1 text-sm">
                          <div>CPU: {recommendation.requests.cpu} / {recommendation.limits.cpu}</div>
                          <div>Mem: {recommendation.requests.memory} / {recommendation.limits.memory}</div>
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {recommendation.warnings.length > 0 && (
                      <div className="space-y-2">
                        {recommendation.warnings.map((warning, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reasoning */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      {recommendation.reasoning.map((r, i) => (
                        <div key={i}>• {r}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Analysis Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Cost Analysis</CardTitle>
                      <Select value={cloudProvider} onValueChange={(v) => setCloudProvider(v as CloudProvider)}>
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CLOUD_PRICING).map(([key, { label }]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cost comparison table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left font-medium py-2"></th>
                            <th className="text-right font-medium py-2 px-2">Current</th>
                            <th className="text-right font-medium py-2 px-2">Recommended</th>
                            <th className="text-right font-medium py-2 px-2">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1.5 text-muted-foreground">CPU</td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              ${recommendation.costs.current.cpu.toFixed(2)}/mo
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              ${recommendation.costs.recommended.cpu.toFixed(2)}/mo
                            </td>
                            <td className={cn(
                              "py-1.5 px-2 text-right font-mono",
                              recommendation.costs.savings.cpu > 0 && "text-green-600 dark:text-green-400",
                              recommendation.costs.savings.cpu < 0 && "text-red-600 dark:text-red-400"
                            )}>
                              {formatCostChangePercent(recommendation.costs.current.cpu, recommendation.costs.savings.cpu)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 text-muted-foreground">Memory</td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              ${recommendation.costs.current.memory.toFixed(2)}/mo
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              ${recommendation.costs.recommended.memory.toFixed(2)}/mo
                            </td>
                            <td className={cn(
                              "py-1.5 px-2 text-right font-mono",
                              recommendation.costs.savings.memory > 0 && "text-green-600 dark:text-green-400",
                              recommendation.costs.savings.memory < 0 && "text-red-600 dark:text-red-400"
                            )}>
                              {formatCostChangePercent(recommendation.costs.current.memory, recommendation.costs.savings.memory)}
                            </td>
                          </tr>
                          <tr className="border-t border-border">
                            <td className="py-2 font-medium">Total</td>
                            <td className="py-2 px-2 text-right font-mono font-medium">
                              ${recommendation.costs.current.total.toFixed(2)}/mo
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-medium">
                              ${recommendation.costs.recommended.total.toFixed(2)}/mo
                            </td>
                            <td className={cn(
                              "py-2 px-2 text-right font-mono font-medium",
                              recommendation.costs.savings.total > 0 && "text-green-600 dark:text-green-400",
                              recommendation.costs.savings.total < 0 && "text-red-600 dark:text-red-400"
                            )}>
                              {recommendation.costs.savings.total >= 0 ? '-' : '+'}$
                              {Math.abs(recommendation.costs.savings.total).toFixed(2)}
                            </td>
                          </tr>
                          <tr className="text-muted-foreground">
                            <td className="py-1"></td>
                            <td className="py-1 px-2 text-right font-mono text-xs">
                              ${recommendation.costs.current.yearly.toFixed(0)}/yr
                            </td>
                            <td className="py-1 px-2 text-right font-mono text-xs">
                              ${recommendation.costs.recommended.yearly.toFixed(0)}/yr
                            </td>
                            <td className={cn(
                              "py-1 px-2 text-right font-mono text-xs",
                              recommendation.costs.savings.yearly > 0 && "text-green-600 dark:text-green-400",
                              recommendation.costs.savings.yearly < 0 && "text-red-600 dark:text-red-400"
                            )}>
                              {recommendation.costs.savings.yearly >= 0 ? '-' : '+'}$
                              {Math.abs(recommendation.costs.savings.yearly).toFixed(0)}/yr
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Summary indicator */}
                    {recommendation.costs.savings.total > 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                        <TrendingDown className="h-5 w-5 shrink-0" />
                        <div>
                          <div className="font-medium">
                            ${recommendation.costs.savings.total.toFixed(2)}/mo savings
                          </div>
                          <div className="text-xs opacity-80">
                            ${recommendation.costs.savings.yearly.toFixed(0)}/year across {validatedReplicas} replica{validatedReplicas !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    ) : recommendation.costs.savings.total < 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <TrendingUp className="h-5 w-5 shrink-0" />
                        <div>
                          <div className="font-medium">
                            +${Math.abs(recommendation.costs.savings.total).toFixed(2)}/mo increase
                          </div>
                          <div className="text-xs opacity-80">
                            Adds headroom for reliability
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground">
                        <Info className="h-5 w-5 shrink-0" />
                        <div className="text-sm">
                          No cost change with current recommendations
                        </div>
                      </div>
                    )}

                    {/* Calculation note */}
                    <div className="text-xs text-muted-foreground">
                      {validatedReplicas} replica{validatedReplicas !== 1 ? 's' : ''} x (CPU + Memory) x {HOURS_PER_MONTH} hrs/month
                    </div>
                  </CardContent>
                </Card>

                {/* YAML Output */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">YAML Snippet</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-lg bg-muted text-sm font-mono overflow-x-auto">
                      {yaml}
                    </pre>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
