import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResponseProfile } from './calculations';

export type EnabledPhases = Record<keyof ResponseProfile, boolean>;

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

function ResponseTimeSlider({
  field,
  label,
  description,
  max,
  value,
  isEnabled,
  onChange,
  onToggle,
}: {
  field: keyof ResponseProfile;
  label: string;
  description: string;
  max: number;
  value: number;
  isEnabled: boolean;
  onChange: (field: keyof ResponseProfile, value: number) => void;
  onToggle: (field: keyof ResponseProfile) => void;
}) {
  return (
    <div className={`space-y-2 ${!isEnabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onToggle(field)}
            aria-label={
              isEnabled ? `Exclude ${label} from calculation` : `Include ${label} in calculation`
            }
          >
            {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <div>
            <Label htmlFor={field} className="text-sm font-medium">
              {label}
            </Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className="text-sm font-mono tabular-nums text-primary">
          {isEnabled ? `${value} min` : 'excluded'}
        </span>
      </div>
      <Slider
        id={field}
        aria-label={label}
        value={[value]}
        onValueChange={([v]) => onChange(field, v)}
        min={0}
        max={max}
        step={1}
        className="w-full"
        disabled={!isEnabled}
      />
    </div>
  );
}

export function ResponseTimeInputs({
  profile,
  enabledPhases,
  onChange,
  onToggle,
}: ResponseTimeInputsProps) {
  const [expanded, setExpanded] = useState(false);

  const firstInput = INPUT_CONFIG[0];
  const restInputs = INPUT_CONFIG.slice(1);

  return (
    <Card>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="pb-4">
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center justify-between w-full text-left group"
              aria-expanded={expanded}
            >
              <CardTitle as="h2" className="text-base">Response Times (per incident)</CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                <span>{expanded ? 'Less options' : 'More options'}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Always show first input */}
          <ResponseTimeSlider
            field={firstInput.field}
            label={firstInput.label}
            description={firstInput.description}
            max={firstInput.max}
            value={profile[firstInput.field]}
            isEnabled={enabledPhases[firstInput.field]}
            onChange={onChange}
            onToggle={onToggle}
          />

          {/* Collapsible section for remaining inputs */}
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="space-y-6">
              {restInputs.map(({ field, label, description, max }) => (
                <ResponseTimeSlider
                  key={field}
                  field={field}
                  label={label}
                  description={description}
                  max={max}
                  value={profile[field]}
                  isEnabled={enabledPhases[field]}
                  onChange={onChange}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
