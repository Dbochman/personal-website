import type { IncidentPhase, IncidentDetails, Severity } from './types';

const SEVERITY_IMPACT: Record<Severity, string> = {
  minor: 'Some users may experience',
  major: 'Users are experiencing',
  critical: 'Users are unable to access',
};

const SEVERITY_ADJECTIVE: Record<Severity, string> = {
  minor: 'minor',
  major: 'significant',
  critical: 'critical',
};

export function generateStatusMessage(
  phase: IncidentPhase,
  details: IncidentDetails,
  cadenceStatement?: string
): string {
  const { service, severity, description, actions } = details;

  // Use placeholders if fields are empty
  const serviceName = service.trim() || '[Service Name]';
  const issueDesc = description.trim() || '[brief description of the issue]';
  const actionsTaken = actions.trim() || '[actions being taken]';

  let message: string;
  switch (phase) {
    case 'investigating':
      message = generateInvestigating(serviceName, severity, issueDesc);
      break;
    case 'identified':
      message = generateIdentified(serviceName, severity, issueDesc, actionsTaken);
      break;
    case 'monitoring':
      message = generateMonitoring(serviceName, issueDesc, actionsTaken);
      break;
    case 'resolved':
      message = generateResolved(serviceName, issueDesc);
      break;
    default:
      message = '';
  }

  // Append cadence statement if provided (not for resolved phase)
  if (cadenceStatement && phase !== 'resolved') {
    message = message + '\n\n' + cadenceStatement;
  }

  return message;
}

function generateInvestigating(
  service: string,
  severity: Severity,
  description: string
): string {
  const impact = SEVERITY_IMPACT[severity];
  const lines = [
    `We are investigating an issue affecting ${service}.`,
    '',
    `${impact} ${description}.`,
    '',
    'Our team is actively investigating and we will provide an update as soon as we have more information.',
  ];
  return lines.join('\n');
}

function generateIdentified(
  service: string,
  severity: Severity,
  description: string,
  actions: string
): string {
  const adjective = SEVERITY_ADJECTIVE[severity];
  const lines = [
    `We have identified the cause of the ${adjective} issue affecting ${service}.`,
    '',
    `Issue: ${description}`,
    '',
    `Our team is ${actions}.`,
    '',
    'We will provide another update once the fix has been implemented.',
  ];
  return lines.join('\n');
}

function generateMonitoring(
  service: string,
  description: string,
  actions: string
): string {
  const lines = [
    `A fix has been implemented for the issue affecting ${service}.`,
    '',
    `We have ${actions} and are monitoring the results.`,
    '',
    'We will continue to monitor and provide a final update once we confirm the issue is fully resolved.',
  ];
  return lines.join('\n');
}

function generateResolved(
  service: string,
  description: string
): string {
  const lines = [
    `The issue affecting ${service} has been resolved.`,
    '',
    `${description}`,
    '',
    'Service has been restored to normal operation. We apologize for any inconvenience this may have caused.',
    '',
    'If you continue to experience issues, please contact our support team.',
  ];
  return lines.join('\n');
}

/**
 * Generate a title/subject line for the incident
 */
export function generateTitle(
  phase: IncidentPhase,
  details: IncidentDetails
): string {
  const service = details.service.trim() || '[Service]';
  const severityLabel = details.severity.charAt(0).toUpperCase() + details.severity.slice(1);

  switch (phase) {
    case 'investigating':
      return `[Investigating] ${severityLabel} issue with ${service}`;
    case 'identified':
      return `[Identified] ${severityLabel} issue with ${service}`;
    case 'monitoring':
      return `[Monitoring] Issue with ${service}`;
    case 'resolved':
      return `[Resolved] Issue with ${service}`;
    default:
      return `Issue with ${service}`;
  }
}
