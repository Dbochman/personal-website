import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SLO_PRESETS } from '@/lib/slo';

interface SloTargetInputProps {
  value: number;
  onChange: (value: number) => void;
}

const MIN_SLO = 90;
const MAX_SLO = 99.999;

export function SloTargetInput({ value, onChange }: SloTargetInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleQuickSelect = (sloValue: string) => {
    if (sloValue === 'custom') return;
    const newValue = parseFloat(sloValue);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleSliderChange = (newValue: number) => {
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= MIN_SLO && parsed <= MAX_SLO) {
      onChange(parsed);
    }
  };

  const handleInputBlur = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed < MIN_SLO) {
      setInputValue(MIN_SLO.toString());
      onChange(MIN_SLO);
    } else if (parsed > MAX_SLO) {
      setInputValue(MAX_SLO.toString());
      onChange(MAX_SLO);
    } else {
      setInputValue(parsed.toString());
    }
  };

  // Check if current value matches a common target
  const matchingTarget = SLO_PRESETS.find((t) => t.value === value);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="slo-quick" className="whitespace-nowrap">
            Target SLO:
          </Label>
          <Select
            value={matchingTarget ? value.toString() : 'custom'}
            onValueChange={handleQuickSelect}
          >
            <SelectTrigger id="slo-quick" className="w-48">
              <SelectValue placeholder="Select SLO" />
            </SelectTrigger>
            <SelectContent>
              {SLO_PRESETS.map(({ value: v, label }) => (
                <SelectItem key={v} value={v.toString()}>
                  {label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="slo-slider" className="text-sm font-medium">
              Fine-tune target
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                aria-label="Target SLO percentage"
                className="w-24 h-7 text-sm font-mono tabular-nums text-primary text-right pr-1"
              />
              <span className="text-sm text-primary">%</span>
            </div>
          </div>
          <Slider
            id="slo-slider"
            aria-label="Fine-tune target SLO percentage"
            value={[value]}
            onValueChange={([v]) => handleSliderChange(v)}
            min={MIN_SLO}
            max={MAX_SLO}
            step={0.001}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Slide or type to adjust between {MIN_SLO}% and {MAX_SLO}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
