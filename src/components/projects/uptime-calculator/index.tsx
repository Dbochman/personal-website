import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ResponseTimeInputs } from './ResponseTimeInputs';
import { IncidentInput } from './IncidentInput';
import { SlaTargetInput } from './SlaTargetInput';
import { ResultsPanel } from './ResultsPanel';
import { TargetSummary } from './TargetSummary';
import { SloBurndownPanel } from './SloBurndownPanel';
import {
  type ResponseProfile,
  DEFAULT_PROFILE,
  PRESETS,
  calculateAchievableSla,
  calculateCanMeetSla,
  getEffectiveProfile,
} from './calculations';

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
  const [targetSla, setTargetSla] = useState(99.9);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

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
  const achievableResult = calculateAchievableSla(effectiveProfile, incidentsPerMonth);
  const targetResult = calculateCanMeetSla(effectiveProfile, targetSla, incidentsPerMonth);

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as CalculationMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievable" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">What can I achieve?</span>
            <span className="sm:hidden">Achievable</span>
          </TabsTrigger>
          <TabsTrigger value="target" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Can I meet this SLA?</span>
            <span className="sm:hidden">Target</span>
          </TabsTrigger>
          <TabsTrigger value="burndown" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">SLO Burndown</span>
            <span className="sm:hidden">Burndown</span>
          </TabsTrigger>
        </TabsList>

        {/* Target mode: SLA input and summary at top */}
        <TabsContent value="target" className="mt-6 space-y-6">
          <SlaTargetInput value={targetSla} onChange={setTargetSla} />
          <TargetSummary result={targetResult} achievableResult={achievableResult} />
        </TabsContent>

        {/* Burndown mode: SLA input at top */}
        <TabsContent value="burndown" className="mt-6">
          <SlaTargetInput value={targetSla} onChange={setTargetSla} />
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
              targetSla={targetSla}
              incidentsPerMonth={incidentsPerMonth}
              avgDurationMinutes={achievableResult.mttrMinutes}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
