import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, AlertTriangle, Sparkles, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Incident, generateId, calculateIncidentCost, formatDuration, toLocalDateString, parseLocalDate } from './calculations';

interface AutoGenerateConfig {
  avgDuration: number;
  avgImpact: number;
  frequency: number;
}

interface IncidentListProps {
  incidents: Incident[];
  onChange: (incidents: Incident[]) => void;
  periodStartDate: string;
  periodDays: number;
}

const INCIDENT_NAMES = [
  'Database connection timeout',
  'API gateway latency spike',
  'Memory exhaustion',
  'Certificate expiration',
  'Network partition',
  'Disk I/O saturation',
  'Cache invalidation failure',
  'Load balancer misconfiguration',
  'DNS resolution failure',
  'Third-party service outage',
  'Deployment rollback',
  'Resource quota exceeded',
];

function generateExampleIncidents(
  config: AutoGenerateConfig,
  periodStartDate: string,
  periodDays: number
): Incident[] {
  const incidents: Incident[] = [];
  const startDate = parseLocalDate(periodStartDate);
  const today = new Date();

  // Calculate days elapsed (can't have incidents in the future)
  const maxDay = Math.min(
    periodDays,
    Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (maxDay <= 0 || config.frequency === 0) return incidents;

  // Distribute incidents across elapsed days
  const spacing = Math.max(1, Math.floor(maxDay / config.frequency));

  for (let i = 0; i < config.frequency && i * spacing <= maxDay; i++) {
    // Add some variance to the day (±20% of spacing)
    const variance = Math.floor(spacing * 0.2 * (Math.random() - 0.5));
    const day = Math.min(maxDay, Math.max(0, i * spacing + variance));

    const incidentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);

    // Add variance to duration (±30%)
    const durationVariance = 1 + (Math.random() - 0.5) * 0.6;
    const duration = Math.max(1, Math.round(config.avgDuration * durationVariance));

    // Add variance to impact (±20%)
    const impactVariance = 1 + (Math.random() - 0.5) * 0.4;
    const impact = Math.min(100, Math.max(1, Math.round(config.avgImpact * impactVariance)));

    incidents.push({
      id: generateId(),
      name: INCIDENT_NAMES[i % INCIDENT_NAMES.length],
      date: toLocalDateString(incidentDate),
      durationMinutes: duration,
      impactPercent: impact,
    });
  }

  return incidents;
}

export function IncidentList({ incidents, onChange, periodStartDate, periodDays }: IncidentListProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [isAdding, setIsAdding] = useState(false);
  const [autoConfig, setAutoConfig] = useState<AutoGenerateConfig>({
    avgDuration: 30,
    avgImpact: 100,
    frequency: 4,
  });
  const [newIncident, setNewIncident] = useState<Omit<Incident, 'id'>>({
    name: '',
    date: toLocalDateString(new Date()),
    durationMinutes: 30,
    impactPercent: 100,
  });

  // Store manual incidents separately so they're preserved when toggling modes
  const savedManualIncidents = useRef<Incident[]>([]);

  // Generate incidents when auto config changes
  useEffect(() => {
    if (mode === 'auto') {
      const generated = generateExampleIncidents(autoConfig, periodStartDate, periodDays);
      onChange(generated);
    }
  }, [mode, autoConfig, periodStartDate, periodDays, onChange]);

  const handleModeChange = (checked: boolean) => {
    const newMode = checked ? 'manual' : 'auto';

    if (newMode === 'auto') {
      // Save current manual incidents before switching to auto
      // useEffect will handle the generation
      savedManualIncidents.current = incidents;
    } else {
      // Restore saved manual incidents when switching to manual
      onChange(savedManualIncidents.current);
    }

    setMode(newMode);
  };

  const handleAdd = () => {
    if (!newIncident.name.trim()) return;

    const incident: Incident = {
      ...newIncident,
      id: generateId(),
      name: newIncident.name.trim(),
    };

    onChange([...incidents, incident]);
    setNewIncident({
      name: '',
      date: toLocalDateString(new Date()),
      durationMinutes: 30,
      impactPercent: 100,
    });
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(incidents.filter((inc) => inc.id !== id));
  };

  const totalConsumed = incidents.reduce((sum, inc) => sum + calculateIncidentCost(inc), 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle as="h2" className="text-lg">Incidents</CardTitle>
          <div className="flex items-center gap-2">
            <Sparkles className={`h-4 w-4 ${mode === 'auto' ? 'text-primary' : 'text-muted-foreground'}`} />
            <Switch
              checked={mode === 'manual'}
              onCheckedChange={handleModeChange}
              aria-label="Toggle between auto and manual mode"
            />
            <Pencil className={`h-4 w-4 ${mode === 'manual' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {mode === 'auto' ? 'Auto-generate example incidents' : 'Manually add your incidents'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto mode: sliders for generation */}
        {mode === 'auto' && (
          <div className="space-y-4 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-frequency">Incidents per period</Label>
                <span className="text-sm font-medium">{autoConfig.frequency}</span>
              </div>
              <Slider
                id="auto-frequency"
                min={0}
                max={20}
                step={1}
                value={[autoConfig.frequency]}
                onValueChange={([v]) => setAutoConfig({ ...autoConfig, frequency: v })}
                aria-label="Number of incidents to generate"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-duration">Average duration</Label>
                <span className="text-sm font-medium">{autoConfig.avgDuration} min</span>
              </div>
              <Slider
                id="auto-duration"
                min={1}
                max={240}
                step={1}
                value={[autoConfig.avgDuration]}
                onValueChange={([v]) => setAutoConfig({ ...autoConfig, avgDuration: v })}
                aria-label="Average incident duration in minutes"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-impact">Average impact</Label>
                <span className="text-sm font-medium">{autoConfig.avgImpact}% of users</span>
              </div>
              <Slider
                id="auto-impact"
                min={1}
                max={100}
                step={1}
                value={[autoConfig.avgImpact]}
                onValueChange={([v]) => setAutoConfig({ ...autoConfig, avgImpact: v })}
                aria-label="Average percentage of users affected"
              />
            </div>
          </div>
        )}

        {/* Manual mode: add incident button and form */}
        {mode === 'manual' && (
          <>
            {!isAdding && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Incident
              </Button>
            )}
            {isAdding && (
              <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="incident-name">Name</Label>
                    <Input
                      id="incident-name"
                      placeholder="e.g., Database outage"
                      value={newIncident.name}
                      onChange={(e) => setNewIncident({ ...newIncident, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incident-date">Date</Label>
                    <input
                      id="incident-date"
                      type="date"
                      value={newIncident.date}
                      min={periodStartDate}
                      onChange={(e) => setNewIncident({ ...newIncident, date: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="incident-duration">Duration</Label>
                      <span className="text-sm text-muted-foreground">
                        {newIncident.durationMinutes} min
                      </span>
                    </div>
                    <Slider
                      id="incident-duration"
                      min={1}
                      max={480}
                      step={1}
                      value={[newIncident.durationMinutes]}
                      onValueChange={([v]) => setNewIncident({ ...newIncident, durationMinutes: v })}
                      aria-label="Incident duration in minutes"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="incident-impact">Impact</Label>
                      <span className="text-sm text-muted-foreground">
                        {newIncident.impactPercent}% of users
                      </span>
                    </div>
                    <Slider
                      id="incident-impact"
                      min={1}
                      max={100}
                      step={1}
                      value={[newIncident.impactPercent]}
                      onValueChange={([v]) => setNewIncident({ ...newIncident, impactPercent: v })}
                      aria-label="Percentage of users affected"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Budget impact: <span className="font-medium text-foreground">{formatDuration(calculateIncidentCost({ ...newIncident, id: '' }))}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAdd} disabled={!newIncident.name.trim()}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Incident list */}
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No incidents recorded</p>
            <p className="text-xs text-muted-foreground">
              {mode === 'auto' ? 'Adjust sliders above to generate incidents' : 'Add incidents to track budget consumption'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {incidents
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{incident.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {parseLocalDate(incident.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' · '}
                      {incident.durationMinutes}min
                      {incident.impactPercent < 100 && ` · ${incident.impactPercent}% impact`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-destructive">
                      -{formatDuration(calculateIncidentCost(incident))}
                    </span>
                    {mode === 'manual' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(incident.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove {incident.name}</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Total consumed */}
        {incidents.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total consumed</span>
            <span className="font-mono font-medium">{formatDuration(totalConsumed)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
