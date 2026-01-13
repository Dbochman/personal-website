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
  const actionsTaken = actions.trim();

  switch (phase) {
    case 'investigating':
      return generateInvestigating(serviceName, severity, issueDesc, cadenceStatement);
    case 'identified':
      return generateIdentified(serviceName, severity, issueDesc, actionsTaken, cadenceStatement);
    case 'fixing':
      return generateFixing(serviceName, issueDesc, actionsTaken, cadenceStatement);
    case 'monitoring':
      return generateMonitoring(serviceName, issueDesc, actionsTaken, cadenceStatement);
    case 'resolved':
      return generateResolved(serviceName);
    default:
      return '';
  }
}

function generateInvestigating(
  service: string,
  severity: Severity,
  description: string,
  cadenceStatement?: string
): string {
  const impact = SEVERITY_IMPACT[severity];
  const updateLine = cadenceStatement
    ? cadenceStatement
    : 'Our team is actively investigating and we will provide an update as soon as we have more information.';
  const lines = [
    `We are investigating an issue affecting ${service}.`,
    '',
    `${impact} ${description}.`,
    '',
    updateLine,
  ];
  return lines.join('\n');
}

function generateIdentified(
  service: string,
  severity: Severity,
  description: string,
  actions: string,
  cadenceStatement?: string
): string {
  const adjective = SEVERITY_ADJECTIVE[severity];
  const updateLine = cadenceStatement
    ? cadenceStatement
    : 'We will provide another update once the fix has been implemented.';
  const lines = [
    `We have identified the cause of the ${adjective} issue affecting ${service}.`,
    '',
    `Users may continue to experience ${description} until the issue is resolved.`,
  ];
  if (actions) {
    lines.push('', `Our team is ${actions}.`);
  }
  lines.push('', updateLine);
  return lines.join('\n');
}

function generateFixing(
  service: string,
  description: string,
  actions: string,
  cadenceStatement?: string
): string {
  const updateLine = cadenceStatement
    ? cadenceStatement
    : 'We will provide another update once the fix has been deployed.';
  const lines = [
    `We are actively working on a fix for the issue affecting ${service}.`,
    '',
    `Users may continue to experience ${description} until the issue is resolved.`,
  ];
  if (actions) {
    lines.push('', `Our team is ${actions}.`);
  }
  lines.push('', updateLine);
  return lines.join('\n');
}

function generateMonitoring(
  service: string,
  description: string,
  actions: string,
  cadenceStatement?: string
): string {
  const updateLine = cadenceStatement
    ? cadenceStatement
    : 'We will continue to monitor and provide a final update once we confirm the issue is fully resolved.';
  const monitoringLine = actions
    ? `We have ${actions} and are monitoring the results.`
    : 'We are monitoring the results.';
  const lines = [
    `A fix has been implemented for the issue affecting ${service}.`,
    '',
    monitoringLine,
    '',
    updateLine,
  ];
  return lines.join('\n');
}

function generateResolved(service: string): string {
  const lines = [
    `The issue affecting ${service} has been resolved.`,
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
    case 'fixing':
      return `[Fixing] ${severityLabel} issue with ${service}`;
    case 'monitoring':
      return `[Monitoring] Issue with ${service}`;
    case 'resolved':
      return `[Resolved] Issue with ${service}`;
    default:
      return `Issue with ${service}`;
  }
}
