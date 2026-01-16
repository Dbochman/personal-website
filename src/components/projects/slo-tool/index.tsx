import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SloConfiguration } from './SloConfiguration';
import { ResponseTimeInputs, type EnabledPhases } from './ResponseTimeInputs';
import { IncidentInput } from './IncidentInput';
import { BudgetChart } from './BudgetChart';
import { AchievableTab } from './AchievableTab';
import { TargetTab } from './TargetTab';
import { BurndownTab } from './BurndownTab';
import {
  type ResponseProfile,
  type SloConfig,
  type BudgetPeriod,
  DEFAULT_PROFILE,
  PERIOD_DAYS,
  calculateAchievableSlo,
  calculateCanMeetSlo,
  calculateBudget,
  generateChartData,
  generateSimulatedIncidents,
  getEffectiveProfile,
  toLocalDateString,
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
  travelMin: true,
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
    return params.incidents ?? 4;
  });

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

  const handleProfileChange = (field: keyof ResponseProfile, value: number) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleTogglePhase = (field: keyof ResponseProfile) => {
    setEnabledPhases((prev) => ({ ...prev, [field]: !prev[field] }));
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
  const chartData = generateChartData(config, simulatedIncidents, budgetCalculation);

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as CalculationMode)}>
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
          {/* Shared Configuration */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SloConfiguration config={config} onChange={setConfig} />

            <div className="space-y-6">
              {/* Response time inputs */}
              <ResponseTimeInputs
                profile={profile}
                enabledPhases={enabledPhases}
                onChange={handleProfileChange}
                onToggle={handleTogglePhase}
              />

              {/* Incidents per period */}
              <IncidentInput
                value={incidentsPerPeriod}
                onChange={setIncidentsPerPeriod}
                period={config.period}
              />
            </div>
          </div>

          {/* Tab-specific content */}
          <TabsContent value="achievable" className="mt-0 space-y-6">
            <AchievableTab result={achievableResult} period={config.period} />
            <BudgetChart
              data={chartData}
              daysElapsed={budgetCalculation.daysElapsed}
              isOnTrack={budgetCalculation.isOnTrack}
              compact
              title="Projected Budget Burndown"
            />
          </TabsContent>

          <TabsContent value="target" className="mt-0 space-y-6">
            <TargetTab
              result={targetResult}
              achievableResult={achievableResult}
              period={config.period}
            />
            <BudgetChart
              data={chartData}
              daysElapsed={budgetCalculation.daysElapsed}
              isOnTrack={budgetCalculation.isOnTrack}
              compact
              title="Projected Budget Burndown"
            />
          </TabsContent>

          <TabsContent value="burndown" className="mt-0">
            <BurndownTab calculation={budgetCalculation} chartData={chartData} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
