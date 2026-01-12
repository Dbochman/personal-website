import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { IncidentPhase } from './types';
import { PHASE_CONFIG } from './types';

interface PhaseSelectorProps {
  value: IncidentPhase;
  onChange: (phase: IncidentPhase) => void;
}

const PHASES: IncidentPhase[] = ['investigating', 'identified', 'monitoring', 'resolved'];

export function PhaseSelector({ value, onChange }: PhaseSelectorProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Label className="text-sm font-medium mb-3 block">Incident Phase</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PHASES.map((phase) => {
            const config = PHASE_CONFIG[phase];
            const isSelected = value === phase;
            return (
              <button
                key={phase}
                onClick={() => onChange(phase)}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isSelected ? config.color : 'text-foreground'
                  )}
                >
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground mt-1 text-center hidden sm:block">
                  {config.description}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
