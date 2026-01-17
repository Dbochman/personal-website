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
