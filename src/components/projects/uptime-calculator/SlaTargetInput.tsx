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
import { COMMON_SLA_TARGETS } from './calculations';

interface SlaTargetInputProps {
  value: number;
  onChange: (value: number) => void;
}

const MIN_SLA = 90;
const MAX_SLA = 99.999;

export function SlaTargetInput({ value, onChange }: SlaTargetInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleQuickSelect = (slaValue: string) => {
    if (slaValue === 'custom') return;
    const newValue = parseFloat(slaValue);
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
    if (!isNaN(parsed) && parsed >= MIN_SLA && parsed <= MAX_SLA) {
      onChange(parsed);
    }
  };

  const handleInputBlur = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed < MIN_SLA) {
      setInputValue(MIN_SLA.toString());
      onChange(MIN_SLA);
    } else if (parsed > MAX_SLA) {
      setInputValue(MAX_SLA.toString());
      onChange(MAX_SLA);
    } else {
      setInputValue(parsed.toString());
    }
  };

  // Check if current value matches a common target
  const matchingTarget = COMMON_SLA_TARGETS.find((t) => t.value === value);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="sla-quick" className="whitespace-nowrap">
            Target SLA:
          </Label>
          <Select
            value={matchingTarget ? value.toString() : 'custom'}
            onValueChange={handleQuickSelect}
          >
            <SelectTrigger id="sla-quick" className="w-48">
              <SelectValue placeholder="Select SLA" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_SLA_TARGETS.map(({ value: v, label }) => (
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
            <Label htmlFor="sla-slider" className="text-sm font-medium">
              Fine-tune target
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                aria-label="Target SLA percentage"
                className="w-24 h-7 text-sm font-mono tabular-nums text-primary text-right pr-1"
              />
              <span className="text-sm text-primary">%</span>
            </div>
          </div>
          <Slider
            id="sla-slider"
            aria-label="Fine-tune target SLA percentage"
            value={[value]}
            onValueChange={([v]) => handleSliderChange(v)}
            min={MIN_SLA}
            max={MAX_SLA}
            step={0.001}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Slide or type to adjust between {MIN_SLA}% and {MAX_SLA}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
