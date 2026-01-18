import { useState } from 'react';
import { IncidentInputs } from './IncidentInputs';
import { PhaseSelector } from './PhaseSelector';
import { MessageOutput } from './MessageOutput';
import { generateStatusMessage, generateTitle } from './templates';
import type { IncidentPhase, IncidentDetails } from './types';
import { DEFAULT_INCIDENT, SUMMARY_PRESETS, ACTION_PRESETS, CADENCE_PRESETS, SERVICE_PRESETS } from './types';

export default function StatusPageUpdate() {
  const [phase, setPhase] = useState<IncidentPhase>('investigating');
  const [incident, setIncident] = useState<IncidentDetails>(DEFAULT_INCIDENT);
  const [selectedServicePreset, setSelectedServicePreset] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [selectedActionPreset, setSelectedActionPreset] = useState<string>('');
  const [selectedCadence, setSelectedCadence] = useState<string>('');
  const [customCadence, setCustomCadence] = useState<string>('');

  const handleIncidentChange = (field: keyof IncidentDetails, value: string) => {
    setIncident((prev) => ({ ...prev, [field]: value }));

    // Auto-switch to custom if user edits service
    if (field === 'service' && selectedServicePreset && selectedServicePreset !== 'custom') {
      const servicePreset = SERVICE_PRESETS[selectedServicePreset];
      if (servicePreset && value !== servicePreset.service) {
        setSelectedServicePreset('custom');
      }
    }

    // Auto-switch to custom if user edits description
    if (field === 'description' && selectedPreset && selectedPreset !== 'custom') {
      const preset = SUMMARY_PRESETS[selectedPreset];
      if (preset && value !== preset.description) {
        setSelectedPreset('custom');
      }
    }

    // Auto-switch to custom if user edits actions
    if (field === 'actions' && selectedActionPreset && selectedActionPreset !== 'custom') {
      const actionPreset = ACTION_PRESETS[selectedActionPreset];
      if (actionPreset && value !== actionPreset.action) {
        setSelectedActionPreset('custom');
      }
    }
  };

  const handleServicePresetChange = (presetKey: string) => {
    setSelectedServicePreset(presetKey);
    if (presetKey && presetKey !== 'custom' && presetKey !== 'none' && SERVICE_PRESETS[presetKey]) {
      const preset = SERVICE_PRESETS[presetKey];
      setIncident((prev) => ({
        ...prev,
        service: preset.service,
      }));
    }
  };

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey && presetKey !== 'custom' && presetKey !== 'none' && SUMMARY_PRESETS[presetKey]) {
      const preset = SUMMARY_PRESETS[presetKey];
      setIncident((prev) => ({
        ...prev,
        description: preset.description,
      }));
    }
  };

  const handleActionPresetChange = (presetKey: string) => {
    setSelectedActionPreset(presetKey);
    if (presetKey === 'none') {
      setIncident((prev) => ({
        ...prev,
        actions: '',
      }));
    } else if (presetKey && presetKey !== 'custom' && ACTION_PRESETS[presetKey]) {
      const preset = ACTION_PRESETS[presetKey];
      setIncident((prev) => ({
        ...prev,
        actions: preset.action,
      }));
    }
  };

  const handleCadenceChange = (cadenceKey: string) => {
    setSelectedCadence(cadenceKey);
    if (cadenceKey === 'none') {
      setCustomCadence('');
    } else if (cadenceKey && cadenceKey !== 'custom' && CADENCE_PRESETS[cadenceKey]) {
      setCustomCadence(CADENCE_PRESETS[cadenceKey].statement);
    }
  };

  const handleCustomCadenceChange = (value: string) => {
    setCustomCadence(value);
    // Auto-switch to custom if user edits
    if (selectedCadence && selectedCadence !== 'custom' && selectedCadence !== 'none') {
      const preset = CADENCE_PRESETS[selectedCadence];
      if (preset && value !== preset.statement) {
        setSelectedCadence('custom');
      }
    }
  };

  // Get cadence statement for message
  const cadenceStatement = phase !== 'resolved' && customCadence ? customCadence : '';

  const title = generateTitle(phase, incident);
  const message = generateStatusMessage(phase, incident, cadenceStatement);

  return (
    <div className="space-y-6">
      {/* Intro text for SEO and user context */}
      <p className="text-sm text-muted-foreground">
        Generate clear, professional incident updates for your status page.
        Choose the incident phase, fill in the details, and copy the message to
        Statuspage, PagerDuty, Instatus, or any status page provider.
      </p>

      {/* Phase selector at top */}
      <PhaseSelector value={phase} onChange={setPhase} />

      {/* Incident details */}
      <IncidentInputs
        incident={incident}
        phase={phase}
        selectedServicePreset={selectedServicePreset}
        selectedPreset={selectedPreset}
        selectedActionPreset={selectedActionPreset}
        selectedCadence={selectedCadence}
        customCadence={customCadence}
        onChange={handleIncidentChange}
        onServicePresetChange={handleServicePresetChange}
        onPresetChange={handlePresetChange}
        onActionPresetChange={handleActionPresetChange}
        onCadenceChange={handleCadenceChange}
        onCustomCadenceChange={handleCustomCadenceChange}
      />

      {/* Generated output */}
      <MessageOutput title={title} message={message} />
    </div>
  );
}
