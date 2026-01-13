import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResponseProfile } from './calculations';
import type { EnabledPhases } from './index';

interface ResponseTimeInputsProps {
  profile: ResponseProfile;
  enabledPhases: EnabledPhases;
  onChange: (field: keyof ResponseProfile, value: number) => void;
  onToggle: (field: keyof ResponseProfile) => void;
}

interface InputConfig {
  field: keyof ResponseProfile;
  label: string;
  description: string;
  max: number;
}

const INPUT_CONFIG: InputConfig[] = [
  {
    field: 'alertLatencyMin',
    label: 'Alert latency',
    description: 'Condition true → alert fires',
    max: 30,
  },
  {
    field: 'acknowledgeMin',
    label: 'Time to acknowledge',
    description: 'Alert fires → you see it',
    max: 30,
  },
  {
    field: 'travelMin',
    label: 'Time to computer',
    description: 'Get to your workstation',
    max: 60,
  },
  {
    field: 'authMin',
    label: 'Time to authenticate',
    description: 'VPN, SSO, internal tools',
    max: 20,
  },
  {
    field: 'diagnoseMin',
    label: 'Time to diagnose',
    description: 'Investigate underlying cause(s)',
    max: 60,
  },
  {
    field: 'fixMin',
    label: 'Time to fix',
    description: 'Implement the fix',
    max: 120,
  },
];

export function ResponseTimeInputs({
  profile,
  enabledPhases,
  onChange,
  onToggle,
}: ResponseTimeInputsProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle as="h2" className="text-base">Response Times (per incident)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {INPUT_CONFIG.map(({ field, label, description, max }) => {
          const isEnabled = enabledPhases[field];
          return (
            <div key={field} className={`space-y-2 ${!isEnabled ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => onToggle(field)}
                    aria-label={isEnabled ? `Exclude ${label} from calculation` : `Include ${label} in calculation`}
                  >
                    {isEnabled ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <Label htmlFor={field} className="text-sm font-medium">
                      {label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                <span className="text-sm font-mono tabular-nums text-primary">
                  {isEnabled ? `${profile[field]} min` : 'excluded'}
                </span>
              </div>
              <Slider
                id={field}
                aria-label={label}
                value={[profile[field]]}
                onValueChange={([value]) => onChange(field, value)}
                min={0}
                max={max}
                step={1}
                className="w-full"
                disabled={!isEnabled}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
