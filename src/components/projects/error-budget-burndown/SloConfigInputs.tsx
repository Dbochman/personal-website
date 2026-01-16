import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type SloConfig, type BudgetPeriod, calculateTotalBudget, formatDuration } from './calculations';
import { SLO_PRESETS, snapToPreset } from '@/lib/slo';

// Input allows full range; slider focuses on high-availability targets
const MIN_INPUT_SLO = 0;
const MIN_SLIDER_SLO = 99;
const MAX_SLO = 99.999;

interface SloConfigInputsProps {
  config: SloConfig;
  onChange: (config: SloConfig) => void;
}

export function SloConfigInputs({ config, onChange }: SloConfigInputsProps) {
  const [inputValue, setInputValue] = useState(config.target.toString());

  // Sync local input state when prop changes (e.g., from URL params)
  useEffect(() => {
    setInputValue(config.target.toString());
  }, [config.target]);

  const totalBudget = calculateTotalBudget(config.target, config.period);
  const currentPreset = SLO_PRESETS.find((p) => p.value === config.target);

  const handleTargetChange = (value: number[]) => {
    const snapped = snapToPreset(value[0]);
    onChange({ ...config, target: snapped });
    setInputValue(snapped.toString());
  };

  const handlePresetChange = (value: string) => {
    const newValue = parseFloat(value);
    onChange({ ...config, target: newValue });
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= MIN_INPUT_SLO && parsed <= MAX_SLO) {
      onChange({ ...config, target: parsed });
    }
  };

  const handleInputBlur = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed < MIN_INPUT_SLO) {
      setInputValue(MIN_INPUT_SLO.toString());
      onChange({ ...config, target: MIN_INPUT_SLO });
    } else if (parsed > MAX_SLO) {
      setInputValue(MAX_SLO.toString());
      onChange({ ...config, target: MAX_SLO });
    } else {
      setInputValue(parsed.toString());
    }
  };

  const handlePeriodChange = (value: BudgetPeriod) => {
    onChange({ ...config, period: value });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, startDate: e.target.value });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle as="h2" className="text-lg">SLO Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SLO Target */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="slo-target">Availability Target</Label>
            <Select
              value={currentPreset ? config.target.toString() : ''}
              onValueChange={handlePresetChange}
            >
              <SelectTrigger className="w-full sm:w-48" aria-label="SLO preset">
                <SelectValue placeholder="Custom" />
              </SelectTrigger>
              <SelectContent>
                {SLO_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value.toString()}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              id="slo-target"
              min={MIN_SLIDER_SLO}
              max={MAX_SLO}
              step={0.001}
              value={[Math.max(MIN_SLIDER_SLO, config.target)]}
              onValueChange={handleTargetChange}
              className="flex-1"
              aria-label="SLO target percentage"
            />
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                aria-label="Target SLO percentage"
                className="w-24 h-8 text-sm font-mono tabular-nums text-right pr-1"
              />
              <span className="text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Budget Period */}
        <div className="space-y-2">
          <Label htmlFor="budget-period">Budget Period</Label>
          <Select value={config.period} onValueChange={handlePeriodChange}>
            <SelectTrigger id="budget-period" aria-label="Budget period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly (30 days)</SelectItem>
              <SelectItem value="quarterly">Quarterly (90 days)</SelectItem>
              <SelectItem value="yearly">Yearly (365 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Period Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start-date">Period Start Date</Label>
          <input
            id="start-date"
            type="date"
            value={config.startDate}
            onChange={handleStartDateChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark]"
          />
        </div>

        {/* Budget Summary */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Total Error Budget: <span className="font-semibold text-foreground">{formatDuration(totalBudget)}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {((1 - config.target / 100) * 100).toFixed(3)}% of {config.period} period
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
