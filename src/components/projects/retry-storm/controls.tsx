import { useId, type ReactNode } from 'react';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  hint?: ReactNode;
}

export function RangeControl({ label, value, min, max, step, format, onChange, hint }: RangeControlProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span id={id} className="text-sm font-medium">
          {label}
        </span>
        <output aria-labelledby={id} className="font-mono text-sm tabular-nums">
          {format(value)}
        </output>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface OptionControlProps<T extends string | number> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: ReactNode;
}

export function OptionControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
  hint,
}: OptionControlProps<T>) {
  const id = useId();
  return (
    <div className="space-y-2">
      <span id={id} className="block text-sm font-medium">
        {label}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-labelledby={id}
        value={String(value)}
        onValueChange={(next) => {
          // Radix allows deselecting a single toggle group; keep one selected.
          const match = options.find((option) => String(option.value) === next);
          if (match) onChange(match.value);
        }}
        className="flex-wrap justify-start"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={String(option.value)}
            value={String(option.value)}
            className="min-w-11 font-mono text-xs data-[state=on]:border-foreground/40"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
