import { useState, useMemo } from 'react';

interface MTTRBuilderProps {
  title?: string;
}

const PHASES = [
  { key: 'detection', name: 'Detection', default: 5, max: 60 },
  { key: 'acknowledgment', name: 'Acknowledgment', default: 10, max: 60 },
  { key: 'diagnosis', name: 'Diagnosis', default: 15, max: 60 },
  { key: 'remediation', name: 'Remediation', default: 15, max: 60 },
];

const COLORS = [
  { fill: 'bg-primary', text: 'text-primary' },
  { fill: 'bg-emerald-500', text: 'text-emerald-500' },
  { fill: 'bg-amber-500', text: 'text-amber-500' },
  { fill: 'bg-violet-500', text: 'text-violet-500' },
];

const PERIOD_MINUTES = 43200; // 30 days in minutes

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  fillClass?: string;
  label: string;
  displayValue: string;
  labelClass?: string;
}

function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  fillClass = 'bg-primary',
  label,
  displayValue,
  labelClass = 'text-muted-foreground',
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className={`font-medium ${labelClass}`}>{label}</span>
        <span className="font-semibold text-foreground tabular-nums">{displayValue}</span>
      </div>
      <div className="relative h-3 w-full">
        {/* Track background */}
        <div className="absolute inset-0 rounded-full bg-muted border border-border" />
        {/* Fill */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${fillClass} transition-all duration-75`}
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-foreground shadow-sm transition-all duration-75"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
        {/* Invisible range input for interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

/**
 * Interactive MTTR breakdown builder with achievable SLO calculation
 * Users can adjust MTTR phases, incident frequency, and blast radius
 * to see what SLO their current capabilities can support
 */
export function MTTRBuilder({ title = 'What Can You Achieve?' }: MTTRBuilderProps) {
  const [values, setValues] = useState<Record<string, number>>({
    detection: 5,
    acknowledgment: 10,
    diagnosis: 15,
    remediation: 15,
  });

  const [incidents, setIncidents] = useState(2);
  const [blastRadius, setBlastRadius] = useState(100);

  const mttr = useMemo(
    () => Object.values(values).reduce((sum, v) => sum + v, 0),
    [values]
  );

  const { effectiveDowntime, achievableSlo } = useMemo(() => {
    const downtime = incidents * mttr * (blastRadius / 100);
    const slo = ((PERIOD_MINUTES - downtime) / PERIOD_MINUTES) * 100;
    return { effectiveDowntime: downtime, achievableSlo: slo };
  }, [incidents, mttr, blastRadius]);

  const sloColor = useMemo(() => {
    if (achievableSlo >= 99.9) return 'text-emerald-500';
    if (achievableSlo >= 99) return 'text-amber-500';
    return 'text-red-500';
  }, [achievableSlo]);

  const sloBgColor = useMemo(() => {
    if (achievableSlo >= 99.9) return 'bg-emerald-500/10 border-emerald-500/30';
    if (achievableSlo >= 99) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  }, [achievableSlo]);

  const handleSliderChange = (key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <figure className="my-8">
      {title && (
        <figcaption className="text-center text-sm font-medium text-muted-foreground mb-4">
          {title}
        </figcaption>
      )}
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg border border-border">
            <span className="text-3xl font-bold text-foreground">{mttr}</span>
            <span className="text-lg text-muted-foreground ml-1">min</span>
            <div className="text-sm text-muted-foreground mt-1">MTTR</div>
          </div>
          <div className={`text-center p-4 rounded-lg border ${sloBgColor}`}>
            <span className={`text-3xl font-bold ${sloColor}`}>
              {achievableSlo.toFixed(2)}%
            </span>
            <div className="text-sm text-muted-foreground mt-1">achievable SLO</div>
          </div>
        </div>

        {/* MTTR Phase Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {PHASES.map((phase, i) => (
            <Slider
              key={phase.key}
              value={values[phase.key]}
              min={1}
              max={phase.max}
              onChange={(v) => handleSliderChange(phase.key, v)}
              fillClass={COLORS[i].fill}
              label={phase.name}
              displayValue={`${values[phase.key]}m`}
              labelClass={COLORS[i].text}
            />
          ))}
        </div>

        {/* Incident & Blast Radius Sliders */}
        <div className="border-t border-border pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Slider
              value={incidents}
              min={0}
              max={10}
              onChange={setIncidents}
              fillClass="bg-rose-500"
              label="Incidents per month"
              displayValue={String(incidents)}
              labelClass="text-rose-500"
            />
            <Slider
              value={blastRadius}
              min={0}
              max={100}
              step={5}
              onChange={setBlastRadius}
              fillClass="bg-sky-500"
              label="Blast radius"
              displayValue={`${blastRadius}%`}
              labelClass="text-sky-500"
            />
          </div>
        </div>

        {/* Formula Display */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border font-mono text-xs sm:text-sm space-y-1">
          <div className="text-muted-foreground">
            <span className="text-foreground">Effective downtime</span> = {incidents} × {mttr} min × {blastRadius}% ={' '}
            <span className="font-semibold text-foreground">{effectiveDowntime.toFixed(0)} min</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">Achievable SLO</span> = ({PERIOD_MINUTES.toLocaleString()} − {effectiveDowntime.toFixed(0)}) / {PERIOD_MINUTES.toLocaleString()} ={' '}
            <span className={`font-semibold ${sloColor}`}>{achievableSlo.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </figure>
  );
}
