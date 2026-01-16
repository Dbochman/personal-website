import { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Incident, generateId, calculateIncidentCost, formatDuration, toLocalDateString, parseLocalDate } from './calculations';

interface IncidentListProps {
  incidents: Incident[];
  onChange: (incidents: Incident[]) => void;
  periodStartDate: string;
}

export function IncidentList({ incidents, onChange, periodStartDate }: IncidentListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newIncident, setNewIncident] = useState<Omit<Incident, 'id'>>({
    name: '',
    date: toLocalDateString(new Date()),
    durationMinutes: 30,
    impactPercent: 100,
  });

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Incident
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add incident form */}
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* Incident list */}
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No incidents recorded</p>
            <p className="text-xs text-muted-foreground">Add incidents to track budget consumption</p>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(incident.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove {incident.name}</span>
                    </Button>
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
