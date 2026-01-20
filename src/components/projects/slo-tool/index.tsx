import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SloConfiguration } from './SloConfiguration';
import { ResponseTimeInputs, type EnabledPhases } from './ResponseTimeInputs';
import { IncidentInput } from './IncidentInput';
import { AchievableTab } from './AchievableTab';
import { TargetTab } from './TargetTab';
import { BurndownTab } from './BurndownTab';
import { trackToolEvent } from '@/lib/trackToolEvent';
import {
  type ResponseProfile,
  type SloConfig,
  type BudgetPeriod,
  DEFAULT_PROFILE,
  PERIOD_DAYS,
  PERIOD_LABELS,
  calculateAchievableSlo,
  calculateCanMeetSlo,
  calculateBudget,
  generateSimulatedIncidents,
  getEffectiveProfile,
  toLocalDateString,
  calculateTotalBudget,
  formatDuration,
} from './calculations';

const VALID_MODES = ['achievable', 'target', 'burndown'] as const;
type CalculationMode = (typeof VALID_MODES)[number];

// Input allows full range; slider focuses on high-availability targets
const MIN_SLO = 0;
const MAX_SLO = 99.999;
const MIN_INCIDENTS = 0;
const MAX_INCIDENTS = 20;

function getDefaultStartDate(): string {
  const now = new Date();
  return toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}

function parseUrlParams(searchParams: URLSearchParams) {
  const sloParam = searchParams.get('slo');
  const modeParam = searchParams.get('mode');
  const incidentsParam = searchParams.get('incidents');
  const periodParam = searchParams.get('period');

  let slo: number | null = null;
  if (sloParam) {
    const parsed = parseFloat(sloParam);
    if (!isNaN(parsed)) {
      slo = Math.min(MAX_SLO, Math.max(MIN_SLO, parsed));
    }
  }

  let mode: CalculationMode | null = null;
  if (modeParam && VALID_MODES.includes(modeParam as CalculationMode)) {
    mode = modeParam as CalculationMode;
  }

  let incidents: number | null = null;
  if (incidentsParam) {
    const parsed = parseInt(incidentsParam, 10);
    if (!isNaN(parsed)) {
      incidents = Math.min(MAX_INCIDENTS, Math.max(MIN_INCIDENTS, parsed));
    }
  }

  let period: BudgetPeriod | null = null;
  if (periodParam && ['monthly', 'quarterly', 'yearly'].includes(periodParam)) {
    period = periodParam as BudgetPeriod;
  }

  return { slo, mode, incidents, period };
}

const DEFAULT_ENABLED: EnabledPhases = {
  alertLatencyMin: true,
  acknowledgeMin: true,
  travelMin: false,
  authMin: true,
  diagnoseMin: true,
  fixMin: true,
};

export default function SloTool() {
  const [searchParams] = useSearchParams();

  // Initialize state from URL params
  const [mode, setMode] = useState<CalculationMode>(() => {
    const params = parseUrlParams(searchParams);
    return params.mode ?? 'achievable';
  });

  const [config, setConfig] = useState<SloConfig>(() => {
    const params = parseUrlParams(searchParams);
    return {
      target: params.slo ?? 99.9,
      period: params.period ?? 'monthly',
      startDate: getDefaultStartDate(),
    };
  });

  const [profile, setProfile] = useState<ResponseProfile>(DEFAULT_PROFILE);
  const [enabledPhases, setEnabledPhases] = useState<EnabledPhases>(DEFAULT_ENABLED);
  const [incidentsPerPeriod, setIncidentsPerPeriod] = useState(() => {
    const params = parseUrlParams(searchParams);
    return params.incidents ?? 1;
  });
  const [configExpanded, setConfigExpanded] = useState(false);

  // Local input state for compact view
  const [sloInputValue, setSloInputValue] = useState(config.target.toString());
  const [incidentsInputValue, setIncidentsInputValue] = useState(incidentsPerPeriod.toString());

  // Update state if URL params change (e.g., from cross-tool navigation)
  useEffect(() => {
    const params = parseUrlParams(searchParams);
    if (params.slo !== null) {
      setConfig((prev) => ({ ...prev, target: params.slo! }));
    }
    if (params.mode !== null) {
      setMode(params.mode);
    }
    if (params.incidents !== null) {
      setIncidentsPerPeriod(params.incidents);
    }
    if (params.period !== null) {
      setConfig((prev) => ({ ...prev, period: params.period! }));
    }
  }, [searchParams]);

  // Sync local input values when props change
  useEffect(() => {
    setSloInputValue(config.target.toString());
  }, [config.target]);

  useEffect(() => {
    setIncidentsInputValue(incidentsPerPeriod.toString());
  }, [incidentsPerPeriod]);

  const handleProfileChange = (field: keyof ResponseProfile, value: number) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleTogglePhase = (field: keyof ResponseProfile) => {
    setEnabledPhases((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Compact view handlers
  const handleCompactSloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setSloInputValue(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= MIN_SLO && parsed <= MAX_SLO) {
      setConfig((prev) => ({ ...prev, target: parsed }));
    }
  };

  const handleCompactSloBlur = () => {
    const parsed = parseFloat(sloInputValue);
    let finalValue: number;
    if (isNaN(parsed) || parsed < MIN_SLO) {
      finalValue = MIN_SLO;
      setSloInputValue(MIN_SLO.toString());
      setConfig((prev) => ({ ...prev, target: MIN_SLO }));
    } else if (parsed > MAX_SLO) {
      finalValue = MAX_SLO;
      setSloInputValue(MAX_SLO.toString());
      setConfig((prev) => ({ ...prev, target: MAX_SLO }));
    } else {
      finalValue = parsed;
      setSloInputValue(parsed.toString());
    }
    trackToolEvent({ tool_name: 'slo_calculator', action: 'calculate', event_label: finalValue.toString() });
  };

  const handleCompactIncidentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setIncidentsInputValue(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= MIN_INCIDENTS && parsed <= MAX_INCIDENTS) {
      setIncidentsPerPeriod(parsed);
    }
  };

  const handleCompactIncidentsBlur = () => {
    const parsed = parseInt(incidentsInputValue, 10);
    if (isNaN(parsed) || parsed < MIN_INCIDENTS) {
      setIncidentsInputValue(MIN_INCIDENTS.toString());
      setIncidentsPerPeriod(MIN_INCIDENTS);
    } else if (parsed > MAX_INCIDENTS) {
      setIncidentsInputValue(MAX_INCIDENTS.toString());
      setIncidentsPerPeriod(MAX_INCIDENTS);
    } else {
      setIncidentsInputValue(parsed.toString());
    }
  };

  // Get effective profile with disabled phases zeroed out
  const effectiveProfile = getEffectiveProfile(profile, enabledPhases);

  // Calculate results for all modes
  const achievableResult = calculateAchievableSlo(effectiveProfile, incidentsPerPeriod, config.period);
  const targetResult = calculateCanMeetSlo(
    effectiveProfile,
    config.target,
    incidentsPerPeriod,
    config.period
  );

  // Generate simulated incidents and calculate burndown
  const simulatedIncidents = useMemo(
    () =>
      generateSimulatedIncidents(
        achievableResult.mttrMinutes,
        incidentsPerPeriod,
        config.startDate,
        PERIOD_DAYS[config.period]
      ),
    [achievableResult.mttrMinutes, incidentsPerPeriod, config.startDate, config.period]
  );

  const budgetCalculation = calculateBudget(config, simulatedIncidents);

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => {
        setMode(v as CalculationMode);
        trackToolEvent({ tool_name: 'slo_calculator', action: 'tab_switch', event_label: v });
      }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievable" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">What can I achieve?</span>
            <span className="sm:hidden">Achievable</span>
          </TabsTrigger>
          <TabsTrigger value="target" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Can I meet this SLO?</span>
            <span className="sm:hidden">Target</span>
          </TabsTrigger>
          <TabsTrigger value="burndown" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Budget Burndown</span>
            <span className="sm:hidden">Burndown</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          {/* Achievable tab: show inputs directly without collapsible */}
          {mode === 'achievable' ? (
            <div className="space-y-6">
              <ResponseTimeInputs
                profile={profile}
                enabledPhases={enabledPhases}
                onChange={handleProfileChange}
                onToggle={handleTogglePhase}
              />
              <IncidentInput
                value={incidentsPerPeriod}
                onChange={setIncidentsPerPeriod}
                period={config.period}
              />
            </div>
          ) : (
            /* Target/Burndown tabs: collapsible configuration */
            <Collapsible open={configExpanded} onOpenChange={setConfigExpanded}>
              <Card>
                <CardContent className="pt-6">
                  {/* Compact Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="compact-slo" className="text-sm font-medium">
                        SLO Target
                      </Label>
                      <div className="flex items-center gap-1">
                        <Input
                          id="compact-slo"
                          type="text"
                          inputMode="decimal"
                          value={sloInputValue}
                          onChange={handleCompactSloChange}
                          onBlur={handleCompactSloBlur}
                          className="w-24 h-9 font-mono tabular-nums text-right pr-1"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="compact-incidents" className="text-sm font-medium">
                        Incidents / {PERIOD_LABELS[config.period].toLowerCase()}
                      </Label>
                      <Input
                        id="compact-incidents"
                        type="text"
                        inputMode="numeric"
                        value={incidentsInputValue}
                        onChange={handleCompactIncidentsChange}
                        onBlur={handleCompactIncidentsBlur}
                        className="w-24 h-9 font-mono tabular-nums text-right"
                      />
                    </div>

                    <div className="flex-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatDuration(calculateTotalBudget(config.target, config.period))}
                      </span>
                      {' '}error budget
                    </div>

                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        aria-expanded={configExpanded}
                      >
                        <span>{configExpanded ? 'Less options' : 'More options'}</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            configExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  {/* Expanded Configuration */}
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="pt-6 mt-6 border-t space-y-6">
                      <div className="grid gap-6 lg:grid-cols-2">
                        <SloConfiguration config={config} onChange={setConfig} />

                        <div className="space-y-6">
                          <ResponseTimeInputs
                            profile={profile}
                            enabledPhases={enabledPhases}
                            onChange={handleProfileChange}
                            onToggle={handleTogglePhase}
                          />

                          <IncidentInput
                            value={incidentsPerPeriod}
                            onChange={setIncidentsPerPeriod}
                            period={config.period}
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          )}

          {/* Tab-specific content */}
          <TabsContent value="achievable" className="mt-0 space-y-6">
            <AchievableTab result={achievableResult} period={config.period} />
          </TabsContent>

          <TabsContent value="target" className="mt-0 space-y-6">
            <TargetTab
              result={targetResult}
              achievableResult={achievableResult}
              period={config.period}
            />
          </TabsContent>

          <TabsContent value="burndown" className="mt-0">
            <BurndownTab
              calculation={budgetCalculation}
              config={config}
              incidents={simulatedIncidents}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
