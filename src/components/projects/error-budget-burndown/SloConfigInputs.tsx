import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type SloConfig, type BudgetPeriod, SLO_PRESETS, calculateTotalBudget, formatDuration } from './calculations';

interface SloConfigInputsProps {
  config: SloConfig;
  onChange: (config: SloConfig) => void;
}

export function SloConfigInputs({ config, onChange }: SloConfigInputsProps) {
  const totalBudget = calculateTotalBudget(config.target, config.period);
  const currentPreset = SLO_PRESETS.find((p) => p.value === config.target);

  const handleTargetChange = (value: number[]) => {
    onChange({ ...config, target: value[0] });
  };

  const handlePresetChange = (value: string) => {
    onChange({ ...config, target: parseFloat(value) });
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
              min={99}
              max={99.999}
              step={0.001}
              value={[config.target]}
              onValueChange={handleTargetChange}
              className="flex-1"
              aria-label="SLO target percentage"
            />
            <span className="w-20 text-right font-mono text-sm">
              {config.target.toFixed(3)}%
            </span>
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
