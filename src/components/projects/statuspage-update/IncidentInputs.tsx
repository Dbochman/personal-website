import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IncidentDetails, IncidentPhase, Severity } from './types';
import { SEVERITY_CONFIG, SUMMARY_PRESETS, ACTION_PRESETS, CADENCE_PRESETS } from './types';

interface IncidentInputsProps {
  incident: IncidentDetails;
  phase: IncidentPhase;
  selectedPreset: string;
  selectedActionPreset: string;
  selectedCadence: string;
  customCadence: string;
  onChange: (field: keyof IncidentDetails, value: string) => void;
  onPresetChange: (preset: string) => void;
  onActionPresetChange: (preset: string) => void;
  onCadenceChange: (cadence: string) => void;
  onCustomCadenceChange: (value: string) => void;
}

export function IncidentInputs({
  incident,
  phase,
  selectedPreset,
  selectedActionPreset,
  selectedCadence,
  customCadence,
  onChange,
  onPresetChange,
  onActionPresetChange,
  onCadenceChange,
  onCustomCadenceChange,
}: IncidentInputsProps) {
  const showActions = phase !== 'resolved';
  const showCadence = phase !== 'resolved';

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Incident Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service name */}
        <div className="space-y-2">
          <Label htmlFor="service">Affected Service</Label>
          <Input
            id="service"
            placeholder="e.g., API, Dashboard, Authentication"
            value={incident.service}
            onChange={(e) => onChange('service', e.target.value)}
          />
        </div>

        {/* Severity */}
        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <Select
            value={incident.severity}
            onValueChange={(v) => onChange('severity', v as Severity)}
          >
            <SelectTrigger id="severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((sev) => (
                <SelectItem key={sev} value={sev}>
                  <span className="font-medium">{SEVERITY_CONFIG[sev].label}</span>
                  <span className="text-muted-foreground ml-2">
                    — {SEVERITY_CONFIG[sev].description}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Issue Type Preset */}
        <div className="space-y-2">
          <Label htmlFor="preset">Issue Type</Label>
          <Select value={selectedPreset || 'none'} onValueChange={onPresetChange}>
            <SelectTrigger id="preset">
              <SelectValue placeholder="Select an issue type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select an issue type...</SelectItem>
              {Object.entries(SUMMARY_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {phase === 'resolved' ? 'Summary' : 'Issue Description'}
          </Label>
          <Textarea
            id="description"
            placeholder={
              phase === 'resolved'
                ? 'Brief summary of what happened and how it was resolved'
                : 'Brief, customer-friendly description of the issue'
            }
            value={incident.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            {selectedPreset && selectedPreset !== 'custom' && selectedPreset !== 'none'
              ? 'Edit to customize (will switch to Custom)'
              : 'Keep it simple and avoid technical jargon'}
          </p>
        </div>

        {/* Actions taken */}
        {showActions && (
          <>
            {/* Action Preset */}
            <div className="space-y-2">
              <Label htmlFor="actionPreset">Action Type</Label>
              <Select value={selectedActionPreset || 'none'} onValueChange={onActionPresetChange}>
                <SelectTrigger id="actionPreset">
                  <SelectValue placeholder="Select an action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select an action...</SelectItem>
                  {Object.entries(ACTION_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actions">Actions Being Taken</Label>
              <Textarea
                id="actions"
                placeholder={
                  phase === 'investigating'
                    ? 'e.g., investigating the root cause'
                    : phase === 'identified'
                      ? 'e.g., deploying a fix to restore service'
                      : 'e.g., deployed the fix and verified functionality'
                }
                value={incident.actions}
                onChange={(e) => onChange('actions', e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                {selectedActionPreset && selectedActionPreset !== 'custom' && selectedActionPreset !== 'none'
                  ? 'Edit to customize (will switch to Custom)'
                  : 'Describe what your team is doing'}
              </p>
            </div>
          </>
        )}

        {/* Update Cadence */}
        {showCadence && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cadence">Update Cadence</Label>
              <Select value={selectedCadence || 'none'} onValueChange={onCadenceChange}>
                <SelectTrigger id="cadence">
                  <SelectValue placeholder="Select update frequency..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select update frequency...</SelectItem>
                  {Object.entries(CADENCE_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedCadence && selectedCadence !== 'none') && (
              <div className="space-y-2">
                <Label htmlFor="customCadence">Update Statement</Label>
                <Textarea
                  id="customCadence"
                  placeholder="e.g., We will provide updates every hour until resolved."
                  value={customCadence}
                  onChange={(e) => onCustomCadenceChange(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedCadence !== 'custom'
                    ? 'Edit to customize (will switch to Custom)'
                    : 'This will be added to the end of the status message'}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
