import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface IncidentInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function IncidentInput({ value, onChange }: IncidentInputProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <div>
              <Label htmlFor="incidents" className="text-sm font-medium">
                Expected incidents per month
              </Label>
              <p className="text-xs text-muted-foreground">
                How many incidents typically require response?
              </p>
            </div>
            <span className="text-sm font-mono tabular-nums text-primary shrink-0">
              {value} {value === 1 ? 'incident' : 'incidents'}
            </span>
          </div>
          <Slider
            id="incidents"
            aria-label="Expected incidents per month"
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
