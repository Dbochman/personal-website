export type IncidentPhase = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export type Severity = 'minor' | 'major' | 'critical';

export interface IncidentDetails {
  service: string;
  severity: Severity;
  description: string;
  actions: string;
  eta: string;
}

export const PHASE_CONFIG: Record<IncidentPhase, { label: string; description: string; color: string }> = {
  investigating: {
    label: 'Investigating',
    description: 'Initial acknowledgment, actively looking into the issue',
    color: 'text-yellow-500',
  },
  identified: {
    label: 'Identified',
    description: 'Root cause found, working on a fix',
    color: 'text-orange-500',
  },
  monitoring: {
    label: 'Monitoring',
    description: 'Fix deployed, watching for stability',
    color: 'text-blue-500',
  },
  resolved: {
    label: 'Resolved',
    description: 'Incident closed, service restored',
    color: 'text-green-500',
  },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; description: string }> = {
  minor: {
    label: 'Minor',
    description: 'Limited impact, workaround available',
  },
  major: {
    label: 'Major',
    description: 'Significant impact, degraded performance',
  },
  critical: {
    label: 'Critical',
    description: 'Service unavailable, widespread impact',
  },
};

export const DEFAULT_INCIDENT: IncidentDetails = {
  service: '',
  severity: 'major',
  description: '',
  actions: '',
  eta: '',
};

export interface SummaryPreset {
  label: string;
  description: string;
  actions: string;
}

export const SUMMARY_PRESETS: Record<string, SummaryPreset> = {
  'degraded-performance': {
    label: 'Degraded Performance',
    description: 'slow response times and degraded performance',
    actions: 'investigating the root cause of the performance degradation',
  },
  'service-unavailable': {
    label: 'Service Unavailable',
    description: 'errors when attempting to access the service',
    actions: 'working to restore service availability',
  },
  'intermittent-errors': {
    label: 'Intermittent Errors',
    description: 'intermittent errors and failed requests',
    actions: 'investigating the source of these errors',
  },
  'login-issues': {
    label: 'Login / Auth Issues',
    description: 'difficulty logging in or authenticating',
    actions: 'investigating the authentication system',
  },
  'data-delays': {
    label: 'Data Processing Delays',
    description: 'delays in data processing and updates',
    actions: 'working to clear the backlog and restore normal processing times',
  },
  'partial-outage': {
    label: 'Partial Outage',
    description: 'inability to access certain features',
    actions: 'working to restore full functionality',
  },
  'scheduled-maintenance': {
    label: 'Scheduled Maintenance',
    description: 'temporary unavailability during scheduled maintenance',
    actions: 'performing planned maintenance to improve service reliability',
  },
};

export const ACTION_PRESETS: Record<string, { label: string; action: string }> = {
  'investigating': {
    label: 'Investigating',
    action: 'investigating the root cause',
  },
  'identified-fix': {
    label: 'Deploying Fix',
    action: 'deploying a fix to resolve the issue',
  },
  'rolling-back': {
    label: 'Rolling Back',
    action: 'rolling back the recent deployment to restore service',
  },
  'scaling-up': {
    label: 'Scaling Infrastructure',
    action: 'scaling up infrastructure to handle increased load',
  },
  'restarting': {
    label: 'Restarting Services',
    action: 'restarting affected services',
  },
  'engaging-vendor': {
    label: 'Engaging Vendor',
    action: 'working with our infrastructure provider to resolve the issue',
  },
  'monitoring-fix': {
    label: 'Monitoring Fix',
    action: 'deployed the fix and monitoring for stability',
  },
  'failover': {
    label: 'Failing Over',
    action: 'failing over to backup systems',
  },
};

export const CADENCE_PRESETS: Record<string, { label: string; statement: string }> = {
  '15min': {
    label: 'Every 15 minutes',
    statement: 'We will provide updates every 15 minutes until this issue is resolved.',
  },
  '30min': {
    label: 'Every 30 minutes',
    statement: 'We will provide updates every 30 minutes until this issue is resolved.',
  },
  '1hour': {
    label: 'Every hour',
    statement: 'We will provide hourly updates until this issue is resolved.',
  },
  '2hours': {
    label: 'Every 2 hours',
    statement: 'We will provide updates every 2 hours until this issue is resolved.',
  },
  'as-available': {
    label: 'As information becomes available',
    statement: 'We will provide updates as more information becomes available.',
  },
  'next-business-day': {
    label: 'Next business day',
    statement: 'We will provide an update by the next business day.',
  },
};
