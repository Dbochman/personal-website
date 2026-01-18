import type { Tool, CommandExplanation } from './types';

/**
 * Generate an explanation for a CLI command
 */
export function explainCommand(tool: Tool, command: string): CommandExplanation {
  switch (tool) {
    case 'jq':
      return explainJq(command);
    case 'grep':
      return explainGrep(command);
    case 'sed':
      return explainSed(command);
    case 'awk':
      return explainAwk(command);
    case 'kubectl':
      return explainKubectl(command);
    default:
      return { summary: 'Unknown command', flags: [], tryNext: [] };
  }
}

function explainJq(command: string): CommandExplanation {
  const flags: { flag: string; meaning: string }[] = [];
  const tryNext: { label: string; command: string }[] = [];
  let summary = '';

  if (command === '.') {
    summary = 'Identity filter - outputs the input unchanged.';
    tryNext.push(
      { label: 'Get keys', command: 'keys' },
      { label: 'Get length', command: 'length' }
    );
  } else if (command === 'keys') {
    summary = 'Returns the keys of an object as an array.';
    tryNext.push(
      { label: 'Get values', command: 'values' },
      { label: 'Count keys', command: 'keys | length' }
    );
  } else if (command === 'values') {
    summary = 'Returns the values of an object as an array.';
    tryNext.push({ label: 'Get keys', command: 'keys' });
  } else if (command === 'length') {
    summary = 'Returns the length of arrays, strings, or number of keys in objects.';
    tryNext.push({ label: 'Get keys', command: 'keys' });
  } else if (command.startsWith('.') && !command.includes('[') && !command.includes('|')) {
    const field = command.slice(1);
    summary = `Extracts the "${field}" field from the input object.`;
    tryNext.push(
      { label: 'Get all keys', command: 'keys' },
      { label: 'Get type', command: `${command} | type` }
    );
  } else if (command === '.[]') {
    summary = 'Iterates over array elements or object values, outputting each separately.';
    tryNext.push(
      { label: 'Get first', command: '.[0]' },
      { label: 'Count items', command: '. | length' }
    );
  } else if (command.includes('select(')) {
    summary = 'Filters elements that match the condition inside select().';
    const condMatch = command.match(/select\(([^)]+)\)/);
    if (condMatch) {
      flags.push({ flag: `select(${condMatch[1]})`, meaning: `Keep items where ${condMatch[1]} is true` });
    }
    tryNext.push({ label: 'Remove filter', command: '.[]' });
  } else {
    summary = `Applies the jq filter "${command}" to transform the JSON input.`;
  }

  return { summary, flags, tryNext };
}

function explainGrep(command: string): CommandExplanation {
  const flags: { flag: string; meaning: string }[] = [];
  const tryNext: { label: string; command: string }[] = [];

  // Parse flags
  const parts = command.match(/^(-[a-zA-Z]+\s+)?(.+)$/);
  const flagStr = parts?.[1]?.trim() || '';
  const pattern = parts?.[2]?.trim() || command;

  let summary = `Searches for lines matching "${pattern}".`;

  if (flagStr.includes('i')) {
    flags.push({ flag: '-i', meaning: 'Case-insensitive matching' });
  }
  if (flagStr.includes('v')) {
    flags.push({ flag: '-v', meaning: 'Invert match - show lines that do NOT match' });
    summary = `Shows lines that do NOT contain "${pattern}".`;
  }
  if (flagStr.includes('n')) {
    flags.push({ flag: '-n', meaning: 'Show line numbers' });
  }
  if (flagStr.includes('E')) {
    flags.push({ flag: '-E', meaning: 'Extended regex - enables +, ?, |, (), etc.' });
  }

  // Suggest next variations
  if (!flagStr.includes('i')) {
    tryNext.push({ label: 'Case insensitive', command: `-i ${pattern}` });
  }
  if (!flagStr.includes('n')) {
    tryNext.push({ label: 'Show line numbers', command: `${flagStr ? flagStr + ' ' : ''}-n ${pattern}`.trim().replace(/\s+/g, ' ') });
  }
  if (!flagStr.includes('v')) {
    tryNext.push({ label: 'Invert match', command: `-v ${pattern}` });
  }

  return { summary, flags, tryNext };
}

function explainSed(command: string): CommandExplanation {
  const flags: { flag: string; meaning: string }[] = [];
  const tryNext: { label: string; command: string }[] = [];
  let summary = '';

  if (command.startsWith('s/')) {
    const match = command.match(/^s\/(.+?)\/(.*)\/([gi]*)$/);
    if (match) {
      const [, pattern, replacement, modifiers] = match;
      summary = `Replaces "${pattern}" with "${replacement}".`;

      if (modifiers.includes('g')) {
        flags.push({ flag: 'g', meaning: 'Global - replace all occurrences, not just the first' });
      } else {
        tryNext.push({ label: 'Replace all', command: `s/${pattern}/${replacement}/g` });
      }
      if (modifiers.includes('i')) {
        flags.push({ flag: 'i', meaning: 'Case-insensitive matching' });
      }

      if (!modifiers.includes('g')) {
        tryNext.push({ label: 'Global replace', command: `s/${pattern}/${replacement}/g` });
      }
    }
  } else if (command.includes('/d')) {
    const match = command.match(/^\/(.+)\/d$/);
    if (match) {
      summary = `Deletes lines matching the pattern "${match[1]}".`;
      tryNext.push({ label: 'Keep matches instead', command: `/${match[1]}/!d` });
    }
  } else {
    summary = `Applies the sed expression "${command}" to transform text.`;
  }

  return { summary, flags, tryNext };
}

function explainAwk(command: string): CommandExplanation {
  const flags: { flag: string; meaning: string }[] = [];
  const tryNext: { label: string; command: string }[] = [];
  let summary = '';

  // Check for field separator
  if (command.startsWith('-F')) {
    const match = command.match(/^-F(.)\s+/);
    if (match) {
      flags.push({ flag: `-F${match[1]}`, meaning: `Use "${match[1]}" as the field separator` });
    }
  }

  if (command.includes('print $')) {
    const fieldMatch = command.match(/print\s+\$(\d+)/);
    if (fieldMatch) {
      summary = `Prints column ${fieldMatch[1]} from each line.`;
      const colNum = parseInt(fieldMatch[1], 10);
      if (colNum > 1) {
        tryNext.push({ label: 'Print column 1', command: '{print $1}' });
      }
      tryNext.push({ label: 'Print all columns', command: '{print $0}' });
    }
  } else if (command.includes('sum +=')) {
    summary = 'Calculates a running sum of a numeric field.';
    tryNext.push({ label: 'Count lines', command: '{count++} END {print count}' });
  } else if (command.includes('END')) {
    summary = 'Processes all lines, then executes the END block for final output.';
    flags.push({ flag: 'END {...}', meaning: 'Code to run after all input is processed' });
  } else {
    summary = `Processes each line with the awk program "${command}".`;
  }

  return { summary, flags, tryNext };
}

function explainKubectl(command: string): CommandExplanation {
  const flags: { flag: string; meaning: string }[] = [];
  const tryNext: { label: string; command: string }[] = [];
  let summary = '';

  // Parse the command
  const parts = command.trim().split(/\s+/);
  let i = 0;
  if (parts[i] === 'kubectl') i++;

  const verb = parts[i] || '';
  i++;
  const resource = parts[i] || '';

  // Parse flags from command
  const hasNamespace = command.includes(' -n ') || command.includes(' --namespace');
  const hasAllNamespaces = command.includes('-A') || command.includes('--all-namespaces');
  const hasWide = command.includes('-o wide');
  const hasYaml = command.includes('-o yaml');
  const hasJson = command.includes('-o json');
  const hasTail = command.includes('--tail');

  // Extract namespace if present
  const nsMatch = command.match(/-n\s+(\S+)/);
  const namespace = nsMatch?.[1];

  switch (verb) {
    case 'get':
      if (resource.includes('pod')) {
        summary = 'Lists pods - check STATUS and RESTARTS columns for issues.';
        if (hasWide) {
          flags.push({ flag: '-o wide', meaning: 'Shows IP addresses and node placement' });
        }
        if (!hasWide) {
          tryNext.push({ label: 'Show IPs & nodes', command: `kubectl get pods${namespace ? ` -n ${namespace}` : ''} -o wide` });
        }
        tryNext.push({ label: 'Describe unhealthy', command: `kubectl describe pod <name>${namespace ? ` -n ${namespace}` : ''}` });
        tryNext.push({ label: 'View logs', command: `kubectl logs <pod-name>${namespace ? ` -n ${namespace}` : ''}` });
      } else if (resource.includes('deploy')) {
        summary = 'Lists deployments - READY shows available/desired replicas.';
        tryNext.push({ label: 'Check rollout', command: `kubectl rollout status deployment/<name>${namespace ? ` -n ${namespace}` : ''}` });
        tryNext.push({ label: 'View history', command: `kubectl rollout history deployment/<name>${namespace ? ` -n ${namespace}` : ''}` });
      } else if (resource.includes('svc') || resource.includes('service')) {
        summary = 'Lists services - check if EXTERNAL-IP is assigned and ports are correct.';
        tryNext.push({ label: 'Check endpoints', command: `kubectl get endpoints${namespace ? ` -n ${namespace}` : ''}` });
      } else if (resource.includes('endpoints') || resource.includes('ep')) {
        summary = 'Shows service endpoints - <none> means no pods match the service selector.';
        tryNext.push({ label: 'Check pod labels', command: `kubectl get pods --show-labels${namespace ? ` -n ${namespace}` : ''}` });
        tryNext.push({ label: 'Describe service', command: `kubectl describe svc <name>${namespace ? ` -n ${namespace}` : ''}` });
      } else if (resource.includes('node')) {
        summary = 'Lists cluster nodes - look for NotReady status or conditions like MemoryPressure.';
        tryNext.push({ label: 'Describe node', command: 'kubectl describe node <name>' });
        tryNext.push({ label: 'Check resources', command: 'kubectl top nodes' });
      } else if (resource.includes('event')) {
        summary = 'Shows cluster events - filter by type Warning for issues.';
        tryNext.push({ label: 'All namespaces', command: 'kubectl get events -A --sort-by=.lastTimestamp' });
      }
      break;

    case 'describe':
      if (resource.includes('pod')) {
        summary = 'Shows detailed pod info - check Events section at bottom for errors.';
        flags.push({ flag: 'describe', meaning: 'Full details including events, conditions, and container states' });
        tryNext.push({ label: 'Get logs', command: `kubectl logs <pod>${namespace ? ` -n ${namespace}` : ''}` });
        tryNext.push({ label: 'Previous logs', command: `kubectl logs <pod> --previous${namespace ? ` -n ${namespace}` : ''}` });
      } else if (resource.includes('deploy')) {
        summary = 'Shows deployment details - check Conditions and replica counts.';
        tryNext.push({ label: 'Rollout status', command: `kubectl rollout status deployment/<name>${namespace ? ` -n ${namespace}` : ''}` });
      } else if (resource.includes('node')) {
        summary = 'Shows node details - check Conditions for MemoryPressure, DiskPressure.';
        flags.push({ flag: 'describe', meaning: 'Shows allocatable resources, taints, and conditions' });
        tryNext.push({ label: 'Check pods on node', command: 'kubectl get pods -A --field-selector spec.nodeName=<node>' });
      } else if (resource.includes('svc') || resource.includes('service')) {
        summary = 'Shows service details - verify Selector matches pod labels.';
        tryNext.push({ label: 'Check endpoints', command: `kubectl get endpoints${namespace ? ` -n ${namespace}` : ''}` });
      }
      break;

    case 'logs':
      summary = 'Shows container logs - look for ERROR, FATAL, or stack traces.';
      if (hasTail) {
        const tailMatch = command.match(/--tail\s+(\d+)/);
        if (tailMatch) {
          flags.push({ flag: `--tail ${tailMatch[1]}`, meaning: `Show last ${tailMatch[1]} lines only` });
        }
      }
      if (!hasTail) {
        tryNext.push({ label: 'Last 50 lines', command: `kubectl logs <pod> --tail=50${namespace ? ` -n ${namespace}` : ''}` });
      }
      tryNext.push({ label: 'Previous crash', command: `kubectl logs <pod> --previous${namespace ? ` -n ${namespace}` : ''}` });
      tryNext.push({ label: 'Follow live', command: `kubectl logs <pod> -f${namespace ? ` -n ${namespace}` : ''}` });
      break;

    case 'rollout': {
      const subcommand = resource;
      if (subcommand === 'status') {
        summary = 'Shows rollout progress - watch for stuck or failed updates.';
        tryNext.push({ label: 'View history', command: `kubectl rollout history deployment/<name>${namespace ? ` -n ${namespace}` : ''}` });
        tryNext.push({ label: 'Undo rollout', command: `kubectl rollout undo deployment/<name>${namespace ? ` -n ${namespace}` : ''}` });
      } else if (subcommand === 'history') {
        summary = 'Shows deployment revision history with change causes.';
        tryNext.push({ label: 'Undo to previous', command: `kubectl rollout undo deployment/<name>${namespace ? ` -n ${namespace}` : ''}` });
        tryNext.push({ label: 'Undo to specific', command: `kubectl rollout undo deployment/<name> --to-revision=<N>${namespace ? ` -n ${namespace}` : ''}` });
      } else if (subcommand === 'undo') {
        summary = 'Rolls back to the previous deployment revision.';
        tryNext.push({ label: 'Check status', command: `kubectl rollout status deployment/<name>${namespace ? ` -n ${namespace}` : ''}` });
        tryNext.push({ label: 'Verify pods', command: `kubectl get pods${namespace ? ` -n ${namespace}` : ''}` });
      }
      break;
    }

    case 'top':
      if (resource.includes('pod')) {
        summary = 'Shows pod resource usage - identify high CPU/memory consumers.';
        tryNext.push({ label: 'Node usage', command: 'kubectl top nodes' });
        tryNext.push({ label: 'Sort by memory', command: `kubectl top pods --sort-by=memory${namespace ? ` -n ${namespace}` : ''}` });
      } else if (resource.includes('node')) {
        summary = 'Shows node resource usage - high memory% may cause evictions.';
        tryNext.push({ label: 'Pod usage', command: 'kubectl top pods -A' });
        tryNext.push({ label: 'Describe node', command: 'kubectl describe node <name>' });
      }
      break;

    default:
      summary = 'kubectl command for Kubernetes cluster management.';
      tryNext.push({ label: 'List pods', command: 'kubectl get pods' });
      tryNext.push({ label: 'List nodes', command: 'kubectl get nodes' });
  }

  // Add common flags
  if (hasNamespace && namespace) {
    flags.push({ flag: `-n ${namespace}`, meaning: `Target the ${namespace} namespace` });
  }
  if (hasAllNamespaces) {
    flags.push({ flag: '-A', meaning: 'Search across all namespaces' });
  }
  if (hasYaml) {
    flags.push({ flag: '-o yaml', meaning: 'Output full resource definition in YAML' });
  }
  if (hasJson) {
    flags.push({ flag: '-o json', meaning: 'Output full resource definition in JSON' });
  }

  return { summary, flags, tryNext };
}
