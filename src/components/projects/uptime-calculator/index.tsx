import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { ResponseTimeInputs } from './ResponseTimeInputs';
import { IncidentInput } from './IncidentInput';
import { SloTargetInput } from './SloTargetInput';
import { ResultsPanel } from './ResultsPanel';
import { TargetSummary } from './TargetSummary';
import { SloBurndownPanel } from './SloBurndownPanel';
import {
  type ResponseProfile,
  DEFAULT_PROFILE,
  PRESETS,
  calculateAchievableSlo,
  calculateCanMeetSlo,
  getEffectiveProfile,
} from './calculations';

const VALID_MODES = ['achievable', 'target', 'burndown'] as const;

/**
 * Parse URL params on mount for cross-tool linking
 * Validates all values to prevent invalid state
 */
function getInitialValuesFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const sloParam = params.get('slo');
  const modeParam = params.get('mode');
  const incidentsParam = params.get('incidents');

  // Validate SLO: must be between 90 and 100
  let slo: number | null = null;
  if (sloParam) {
    const parsed = parseFloat(sloParam);
    if (!isNaN(parsed) && parsed >= 90 && parsed <= 100) {
      slo = parsed;
    }
  }

  // Validate mode: must be one of the valid modes
  let mode: 'achievable' | 'target' | 'burndown' | null = null;
  if (modeParam && VALID_MODES.includes(modeParam as typeof VALID_MODES[number])) {
    mode = modeParam as 'achievable' | 'target' | 'burndown';
  }

  // Validate incidents: must be a positive integer
  let incidents: number | null = null;
  if (incidentsParam) {
    const parsed = parseInt(incidentsParam, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      incidents = parsed;
    }
  }

  return { slo, mode, incidents };
}

export type CalculationMode = 'achievable' | 'target' | 'burndown';
export type EnabledPhases = Record<keyof ResponseProfile, boolean>;

const DEFAULT_ENABLED: EnabledPhases = {
  alertLatencyMin: true,
  acknowledgeMin: true,
  travelMin: true,
  authMin: true,
  diagnoseMin: true,
  fixMin: true,
};

export default function UptimeCalculator() {
  const [mode, setMode] = useState<CalculationMode>('achievable');
  const [profile, setProfile] = useState<ResponseProfile>(DEFAULT_PROFILE);
  const [enabledPhases, setEnabledPhases] = useState<EnabledPhases>(DEFAULT_ENABLED);
  const [incidentsPerMonth, setIncidentsPerMonth] = useState(4);
  const [targetSlo, setTargetSlo] = useState(99.9);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Read URL params on mount for cross-tool linking
  useEffect(() => {
    const urlValues = getInitialValuesFromUrl();
    if (urlValues.slo !== null) {
      setTargetSlo(urlValues.slo);
    }
    if (urlValues.mode !== null) {
      setMode(urlValues.mode);
    }
    if (urlValues.incidents !== null) {
      setIncidentsPerMonth(urlValues.incidents);
    }
  }, []);

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey && PRESETS[presetKey]) {
      setProfile(PRESETS[presetKey].profile);
    }
  };

  const handleProfileChange = (field: keyof ResponseProfile, value: number) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSelectedPreset(''); // Clear preset when manually adjusting
  };

  const handleTogglePhase = (field: keyof ResponseProfile) => {
    setEnabledPhases((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Get effective profile with disabled phases zeroed out
  const effectiveProfile = getEffectiveProfile(profile, enabledPhases);

  // Calculate results based on mode
  const achievableResult = calculateAchievableSlo(effectiveProfile, incidentsPerMonth);
  const targetResult = calculateCanMeetSlo(effectiveProfile, targetSlo, incidentsPerMonth);

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
            <span className="hidden sm:inline">SLO Burndown</span>
            <span className="sm:hidden">Burndown</span>
          </TabsTrigger>
        </TabsList>

        {/* Target mode: SLO input and summary at top */}
        <TabsContent value="target" className="mt-6 space-y-6">
          <SloTargetInput value={targetSlo} onChange={setTargetSlo} />
          <TargetSummary result={targetResult} achievableResult={achievableResult} />
        </TabsContent>

        {/* Burndown mode: SLO input at top */}
        <TabsContent value="burndown" className="mt-6">
          <SloTargetInput value={targetSlo} onChange={setTargetSlo} />
        </TabsContent>

        <div className="mt-6 space-y-6">
          {/* Preset selector */}
          <div className="flex items-center gap-4">
            <Label htmlFor="preset" className="whitespace-nowrap">
              Response profile:
            </Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger id="preset" className="w-48">
                <SelectValue placeholder="Custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                {Object.entries(PRESETS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Response time inputs */}
          <ResponseTimeInputs
            profile={profile}
            enabledPhases={enabledPhases}
            onChange={handleProfileChange}
            onToggle={handleTogglePhase}
          />

          {/* Incidents per month */}
          <IncidentInput
            value={incidentsPerMonth}
            onChange={setIncidentsPerMonth}
          />
        </div>

        {/* Results */}
        <div className="mt-6">
          <TabsContent value="achievable" className="mt-0">
            <ResultsPanel mode="achievable" result={achievableResult} />
          </TabsContent>
          <TabsContent value="target" className="mt-0">
            <ResultsPanel
              mode="target"
              result={targetResult}
              achievableResult={achievableResult}
            />
          </TabsContent>
          <TabsContent value="burndown" className="mt-0">
            <SloBurndownPanel
              targetSlo={targetSlo}
              incidentsPerMonth={incidentsPerMonth}
              avgDurationMinutes={achievableResult.mttrMinutes}
            />
          </TabsContent>
        </div>

        {/* Cross-tool link */}
        <div className="mt-6 pt-4 border-t">
          <Link
            to={`/projects/error-budget-burndown?slo=${mode === 'achievable' ? achievableResult.maxAchievableSlo.toFixed(2) : targetSlo}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            See how incidents impact your error budget
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Tabs>
    </div>
  );
}
