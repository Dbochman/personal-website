import { useState, useMemo, useCallback } from 'react';
import { Copy, Check, AlertTriangle, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  type PresetProfile,
  type PercentileInput,
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

function getRiskColor(risk: 'low' | 'medium' | 'high') {
  switch (risk) {
    case 'low': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    case 'high': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  }
}

export default function K8sRightsizer() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [slider, setSlider] = useState(50);
  const [preset, setPreset] = useState<PresetProfile>('custom');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ResourceType>('cpu');

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

      const replicas = parseInt(form.replicas, 10) || 1;

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
      });

      return { recommendation: result, error: null };
    } catch (e) {
      return { recommendation: null, error: e instanceof Error ? e.message : 'Invalid input' };
    }
  }, [form, slider]);

  const yaml = recommendation ? generateYaml(recommendation) : '';

  const handleCopy = useCallback(() => {
    if (!yaml) return;
    navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackToolEvent('k8s-rightsizer', 'copy_yaml');
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
                  <div>
                    <Label htmlFor="currentCpuRequests">CPU Requests</Label>
                    <Input
                      id="currentCpuRequests"
                      value={form.currentCpuRequests}
                      onChange={(e) => updateField('currentCpuRequests', e.target.value)}
                      placeholder="500m"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentCpuLimits">CPU Limits</Label>
                    <Input
                      id="currentCpuLimits"
                      value={form.currentCpuLimits}
                      onChange={(e) => updateField('currentCpuLimits', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="currentMemRequests">Memory Requests</Label>
                    <Input
                      id="currentMemRequests"
                      value={form.currentMemRequests}
                      onChange={(e) => updateField('currentMemRequests', e.target.value)}
                      placeholder="512Mi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentMemLimits">Memory Limits</Label>
                    <Input
                      id="currentMemLimits"
                      value={form.currentMemLimits}
                      onChange={(e) => updateField('currentMemLimits', e.target.value)}
                      placeholder="1Gi"
                    />
                  </div>
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
                      <div>
                        <Label htmlFor="cpuP50">P50 (optional)</Label>
                        <Input
                          id="cpuP50"
                          value={form.cpuP50}
                          onChange={(e) => updateField('cpuP50', e.target.value)}
                          placeholder="100m"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpuP95">P95 *</Label>
                        <Input
                          id="cpuP95"
                          value={form.cpuP95}
                          onChange={(e) => updateField('cpuP95', e.target.value)}
                          placeholder="200m"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="cpuP99">P99 (optional)</Label>
                        <Input
                          id="cpuP99"
                          value={form.cpuP99}
                          onChange={(e) => updateField('cpuP99', e.target.value)}
                          placeholder="300m"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpuMax">Max *</Label>
                        <Input
                          id="cpuMax"
                          value={form.cpuMax}
                          onChange={(e) => updateField('cpuMax', e.target.value)}
                          placeholder="400m"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="memory" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="memP50">P50 (optional)</Label>
                        <Input
                          id="memP50"
                          value={form.memP50}
                          onChange={(e) => updateField('memP50', e.target.value)}
                          placeholder="256Mi"
                        />
                      </div>
                      <div>
                        <Label htmlFor="memP95">P95 *</Label>
                        <Input
                          id="memP95"
                          value={form.memP95}
                          onChange={(e) => updateField('memP95', e.target.value)}
                          placeholder="400Mi"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="memP99">P99 (optional)</Label>
                        <Input
                          id="memP99"
                          value={form.memP99}
                          onChange={(e) => updateField('memP99', e.target.value)}
                          placeholder="450Mi"
                        />
                      </div>
                      <div>
                        <Label htmlFor="memMax">Max *</Label>
                        <Input
                          id="memMax"
                          value={form.memMax}
                          onChange={(e) => updateField('memMax', e.target.value)}
                          placeholder="512Mi"
                        />
                      </div>
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
                {/* Summary Card */}
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

                    {/* Savings */}
                    {recommendation.savings.monthly > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                        <TrendingDown className="h-5 w-5" />
                        <div>
                          <div className="font-medium">
                            ${recommendation.savings.monthly.toFixed(2)}/mo savings
                          </div>
                          <div className="text-xs opacity-80">
                            ${recommendation.savings.yearly.toFixed(0)}/year
                          </div>
                        </div>
                      </div>
                    )}

                    {recommendation.savings.monthly === 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground">
                        <TrendingUp className="h-5 w-5" />
                        <div className="text-sm">
                          Recommendation increases allocation (more headroom)
                        </div>
                      </div>
                    )}

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
