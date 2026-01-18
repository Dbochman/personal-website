import type { Tool } from './types';
import { executeKubectl, type ExecutorOptions } from './engines/kubectl';

// ============================================================================
// HELP TEXT - Playground-specific capabilities and limitations
// ============================================================================

const HELP_TEXTS: Record<Tool, string> = {
  jq: `jq - Command-line JSON Processor (Playground)

This is a simplified jq implementation for learning JSON manipulation.
Not all jq features are supported.

Usage:
  <filter>              Apply filter to JSON input

Supported Filters:
  .                     Identity - output input unchanged
  .field                Access object field
  .field.subfield       Access nested fields
  .[0]                  Access array element by index
  .[]                   Iterate over array/object values
  keys                  Get object keys as array
  values                Get object values as array
  length                Get length of array/string/object
  type                  Get type of value

Filtering & Transformation:
  .[] | .field          Extract field from each array element
  .[] | select(.x > N)  Filter elements by condition
  [.[] | {...}]         Map array to new objects

Examples:
  .name                 Extract "name" field
  .users[0].email       Get first user's email
  keys                  List all keys
  .[] | select(.age > 25)   Filter array by age
  [.[] | {n: .name}]    Transform array elements

Supported Operators in select():
  >  <  >=  <=  ==  !=

Limitations:
  • No pipe chains beyond simple .[] | .field | select()
  • No arithmetic operations (+, -, *, /)
  • No string interpolation
  • No recursive descent (..)
  • No @base64, @uri, @csv formatters
  • No --raw-output, --slurp flags
  • No define functions or variables`,

  grep: `grep - Search Text Using Patterns (Playground)

Search for lines matching a pattern in the input text.

Usage:
  <pattern>             Search for pattern
  -flags <pattern>      Search with flags

Supported Flags:
  -i                    Case-insensitive matching
  -v                    Invert match (show non-matching lines)
  -n                    Show line numbers
  -E                    Extended regex (enables +, ?, |, (), etc.)

Flags can be combined: -inv, -En, etc.

Examples:
  error                 Find lines containing "error"
  -i error              Case-insensitive search
  -v error              Lines NOT containing "error"
  -n error              Show line numbers with matches
  -E "err|warn"         Match "err" OR "warn"
  -E "[0-9]+"           Match one or more digits
  -inv TODO             Case-insensitive, inverted, with line numbers

Regex Support:
  .                     Any character
  *                     Zero or more of previous
  +                     One or more (with -E)
  ?                     Zero or one (with -E)
  [abc]                 Character class
  [^abc]                Negated character class
  ^                     Start of line
  $                     End of line
  |                     Alternation (with -E)
  ()                    Grouping (with -E)

Output:
  • Matching lines (or non-matching with -v)
  • "(no matches)" if nothing found
  • Line numbers prefixed with -n

Limitations:
  • No -c (count only)
  • No -l (filenames only)
  • No -A/-B/-C (context lines)
  • No -r (recursive)
  • No -w (word match)
  • No -o (only matching part)
  • No PCRE features (lookahead, lookbehind)`,

  sed: `sed - Stream Editor for Text Transformation (Playground)

Transform text using substitution and deletion commands.

Usage:
  s/pattern/replacement/[flags]    Substitute text
  /pattern/d                       Delete matching lines

Substitution Flags:
  g                     Global - replace all occurrences per line
  i                     Case-insensitive matching

Multiple Commands:
  Separate with semicolons: s/a/b/; s/c/d/

Examples:
  s/old/new/            Replace first "old" with "new" per line
  s/old/new/g           Replace ALL "old" with "new"
  s/error/ERROR/gi      Replace case-insensitive, globally
  /^#/d                 Delete lines starting with #
  /^$/d                 Delete empty lines
  s/  */ /g             Collapse multiple spaces to one
  s/^/prefix: /         Add prefix to each line
  s/$/ suffix/          Add suffix to each line

Capture Groups:
  Use \\( \\) to capture and \\1, \\2 to reference:
  s/\\([a-z]*\\)/[\\1]/    Wrap lowercase words in brackets

Chained Commands:
  s/^[ ]*//; s/[ ]*$//    Trim leading and trailing spaces

Limitations:
  • No address ranges (1,5s/.../)
  • No line number addressing
  • No hold space (h, H, g, G, x)
  • No branching (b, t, T)
  • No append/insert/change (a, i, c)
  • No read/write files (r, w)
  • No print (p) - all output is automatic
  • No -n flag (suppress auto-print)
  • No -i flag (in-place editing)`,

  awk: `awk - Pattern Scanning and Processing (Playground)

Process structured text data with pattern-action rules.

Usage:
  {action}                    Apply action to all lines
  condition {action}          Apply action when condition is true
  -F<sep> 'program'          Set field separator

Field Variables:
  $0                    Entire line
  $1, $2, ...           Individual fields (space-separated)
  NR                    Current line number
  NF                    Number of fields in current line

Examples:
  {print $1}                  Print first column
  {print $1, $3}              Print columns 1 and 3
  {print $NF}                 Print last column
  $2 > 80 {print $1}          Print col 1 where col 2 > 80
  {sum += $2} END {print sum} Sum column 2
  {count++} END {print count} Count lines
  -F, '{print $2}'            Use comma as separator

END Block:
  Code after END runs once after all input:
  {sum += $1} END {print "Total:", sum}

Counting Patterns:
  {count[$1]++} END {for (k in count) print k, count[k]}
  Count occurrences of each unique value in column 1

CSV Processing:
  -F, 'NR>1 {print $1, $3}'   Skip header, print cols 1 & 3

Conditions:
  $2 > 100                    Numeric comparison
  $1 == "error"               String equality
  NR > 1                      Skip first line

Limitations:
  • No regular expression matching (/pattern/)
  • No printf formatting
  • No multiple -F separators
  • No getline
  • No arrays beyond counting pattern
  • No user-defined functions
  • No BEGIN block (only END)
  • No next, exit commands
  • No FILENAME, FNR variables
  • Limited string functions (no substr, split, gsub)`,

  kubectl: '', // kubectl help is in engines/kubectl.ts
};

function isHelpCommand(command: string): boolean {
  const trimmed = command.trim();
  return trimmed === '--help' || trimmed === '-h' || trimmed === 'help' ||
         trimmed.endsWith(' --help') || trimmed.endsWith(' -h');
}

/**
 * Simple jq-like JSON processor implemented in pure JS
 * Supports common operations without WASM dependencies
 */
function executeJqLite(data: unknown, filter: string): unknown {
  // Handle identity
  if (filter === '.') {
    return data;
  }

  // Handle keys
  if (filter === 'keys') {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return Object.keys(data);
    }
    throw new Error('keys requires an object input');
  }

  // Handle values
  if (filter === 'values') {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return Object.values(data);
    }
    throw new Error('values requires an object input');
  }

  // Handle length
  if (filter === 'length') {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'string') return data.length;
    if (typeof data === 'object' && data !== null) return Object.keys(data).length;
    return 1;
  }

  // Handle type
  if (filter === 'type') {
    if (data === null) return 'null';
    if (Array.isArray(data)) return 'array';
    return typeof data;
  }

  // Handle simple field access: .field or .field.subfield
  const fieldMatch = filter.match(/^\.([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)$/);
  if (fieldMatch) {
    const path = fieldMatch[1].split('.');
    let current: unknown = data;
    for (const key of path) {
      if (current === null || current === undefined) {
        return null;
      }
      if (typeof current !== 'object') {
        throw new Error(`Cannot index ${typeof current} with "${key}"`);
      }
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  // Handle array access: .[0] or .field[0]
  const arrayAccessMatch = filter.match(/^\.([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)?\[(\d+)\]$/);
  if (arrayAccessMatch) {
    let current: unknown = data;
    if (arrayAccessMatch[1]) {
      const path = arrayAccessMatch[1].split('.');
      for (const key of path) {
        if (current === null || typeof current !== 'object') return null;
        current = (current as Record<string, unknown>)[key];
      }
    }
    const index = parseInt(arrayAccessMatch[2], 10);
    if (!Array.isArray(current)) {
      throw new Error('Cannot index non-array with number');
    }
    return current[index];
  }

  // Handle array iteration: .[]
  if (filter === '.[]') {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === 'object' && data !== null) {
      return Object.values(data);
    }
    throw new Error('Cannot iterate over ' + typeof data);
  }

  // Handle .[] | select(.field > value) pattern
  const selectMatch = filter.match(/^\.\[\]\s*\|\s*select\(\.([a-zA-Z_][a-zA-Z0-9_]*)\s*([><=!]+)\s*(\d+|"[^"]*")\)$/);
  if (selectMatch) {
    if (!Array.isArray(data)) {
      throw new Error('select requires array input');
    }
    const field = selectMatch[1];
    const op = selectMatch[2];
    let compareVal: number | string = selectMatch[3];
    if (compareVal.startsWith('"')) {
      compareVal = compareVal.slice(1, -1);
    } else {
      compareVal = parseFloat(compareVal);
    }

    return data.filter((item) => {
      const val = (item as Record<string, unknown>)[field];
      switch (op) {
        case '>': return (val as number) > (compareVal as number);
        case '<': return (val as number) < (compareVal as number);
        case '>=': return (val as number) >= (compareVal as number);
        case '<=': return (val as number) <= (compareVal as number);
        case '==': return val === compareVal;
        case '!=': return val !== compareVal;
        default: return false;
      }
    });
  }

  // Handle simple pipe with field extraction: .[] | .field
  const pipeFieldMatch = filter.match(/^\.\[\]\s*\|\s*\.([a-zA-Z_][a-zA-Z0-9_]*)$/);
  if (pipeFieldMatch) {
    if (!Array.isArray(data)) {
      throw new Error('Cannot iterate over non-array');
    }
    const field = pipeFieldMatch[1];
    return data.map((item) => (item as Record<string, unknown>)[field]);
  }

  // Handle map with object construction: [.[] | {newkey: .oldkey}]
  const mapObjectMatch = filter.match(/^\[\.\[\]\s*\|\s*\{([^}]+)\}\]$/);
  if (mapObjectMatch) {
    if (!Array.isArray(data)) {
      throw new Error('Cannot iterate over non-array');
    }
    const objSpec = mapObjectMatch[1];
    // Parse simple key: .field pairs
    const pairs = objSpec.split(',').map(p => p.trim());
    return data.map((item) => {
      const result: Record<string, unknown> = {};
      for (const pair of pairs) {
        const [key, valueExpr] = pair.split(':').map(s => s.trim());
        if (valueExpr.startsWith('.')) {
          const field = valueExpr.slice(1);
          result[key] = (item as Record<string, unknown>)[field];
        } else if (valueExpr.startsWith('(')) {
          // Skip complex expressions for now
          result[key] = valueExpr;
        } else {
          result[key] = valueExpr;
        }
      }
      return result;
    });
  }

  throw new Error(`Unsupported jq filter: ${filter}\n\nSupported filters:\n- . (identity)\n- .field, .field.subfield\n- .[0], .field[0]\n- .[], .[] | .field\n- .[] | select(.field > value)\n- keys, values, length, type`);
}

/**
 * Execute jq command using pure JS implementation
 */
async function executeJq(input: string, command: string): Promise<string> {
  // Handle --help
  if (isHelpCommand(command)) {
    return HELP_TEXTS.jq;
  }

  // Parse input as JSON
  let parsedInput: unknown;
  try {
    parsedInput = JSON.parse(input);
  } catch {
    throw new Error('Invalid JSON input');
  }

  // Execute jq filter
  const result = executeJqLite(parsedInput, command.trim());

  // Format output
  if (typeof result === 'string') {
    return JSON.stringify(result);
  }
  return JSON.stringify(result, null, 2);
}

/**
 * Execute grep command (JS implementation)
 */
function executeGrep(input: string, command: string): string {
  // Handle --help
  if (isHelpCommand(command)) {
    return HELP_TEXTS.grep;
  }

  const lines = input.split('\n');

  // Parse flags and pattern
  const parts = command.match(/^(-[invE]+\s+)?(.+)$/);
  if (!parts) {
    throw new Error('Invalid grep command');
  }

  const flags = parts[1]?.trim() || '';
  let pattern = parts[2].trim();

  // Remove surrounding quotes if present
  if ((pattern.startsWith('"') && pattern.endsWith('"')) ||
      (pattern.startsWith("'") && pattern.endsWith("'"))) {
    pattern = pattern.slice(1, -1);
  }

  const caseInsensitive = flags.includes('i');
  const invertMatch = flags.includes('v');
  const showLineNumbers = flags.includes('n');
  const extendedRegex = flags.includes('E');

  let regex: RegExp;
  try {
    const regexFlags = caseInsensitive ? 'i' : '';
    regex = extendedRegex
      ? new RegExp(pattern, regexFlags)
      : new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), regexFlags);
  } catch {
    throw new Error(`Invalid regex pattern: ${pattern}`);
  }

  const results: string[] = [];
  lines.forEach((line, index) => {
    const matches = regex.test(line);
    const shouldInclude = invertMatch ? !matches : matches;

    if (shouldInclude) {
      if (showLineNumbers) {
        results.push(`${index + 1}:${line}`);
      } else {
        results.push(line);
      }
    }
  });

  if (results.length === 0) {
    return '(no matches)';
  }

  return results.join('\n');
}

/**
 * Execute sed command (JS implementation)
 */
function executeSed(input: string, command: string): string {
  // Handle --help
  if (isHelpCommand(command)) {
    return HELP_TEXTS.sed;
  }

  const lines = input.split('\n');

  // Parse sed commands (supports s/pattern/replacement/flags and /pattern/d)
  const commands = command.split(';').map(c => c.trim()).filter(Boolean);

  let result = lines;

  for (const cmd of commands) {
    // Delete command: /pattern/d
    const deleteMatch = cmd.match(/^\/(.+)\/d$/);
    if (deleteMatch) {
      const pattern = new RegExp(deleteMatch[1]);
      result = result.filter(line => !pattern.test(line));
      continue;
    }

    // Substitute command: s/pattern/replacement/flags
    const subMatch = cmd.match(/^s\/(.+?)\/(.*)\/([gi]*)$/);
    if (subMatch) {
      const [, pattern, replacement, flags] = subMatch;
      const isGlobal = flags.includes('g');
      const isCaseInsensitive = flags.includes('i');

      // Handle basic sed capture groups \1, \2 etc
      const jsReplacement = replacement.replace(/\\(\d)/g, '$$$1');

      try {
        const regex = new RegExp(
          pattern,
          (isGlobal ? 'g' : '') + (isCaseInsensitive ? 'i' : '')
        );
        result = result.map(line => line.replace(regex, jsReplacement));
      } catch {
        throw new Error(`Invalid sed pattern: ${pattern}`);
      }
      continue;
    }

    throw new Error(`Unsupported sed command: ${cmd}`);
  }

  return result.join('\n');
}

/**
 * Execute awk command (JS implementation)
 */
function executeAwk(input: string, command: string): string {
  // Handle --help
  if (isHelpCommand(command)) {
    return HELP_TEXTS.awk;
  }

  const lines = input.split('\n').filter(line => line.trim());

  // Parse field separator
  let fieldSep = /\s+/;
  let program = command;

  const fsMatch = command.match(/^-F([^\s]+)\s+(.+)$/);
  if (fsMatch) {
    const sep = fsMatch[1];
    fieldSep = sep === ',' ? /,/ : new RegExp(sep);
    program = fsMatch[2];
  }

  // Remove surrounding quotes from program
  if ((program.startsWith("'") && program.endsWith("'")) ||
      (program.startsWith('"') && program.endsWith('"'))) {
    program = program.slice(1, -1);
  }

  // Parse BEGIN and END blocks (BEGIN not yet supported, just stripped)
  const _beginMatch = program.match(/BEGIN\s*\{([^}]+)\}/);
  void _beginMatch; // Silence unused warning - BEGIN support planned
  const endMatch = program.match(/END\s*\{([^}]+)\}/);
  const mainProgram = program
    .replace(/BEGIN\s*\{[^}]+\}/, '')
    .replace(/END\s*\{[^}]+\}/, '')
    .trim();

  const output: string[] = [];
  const variables: Record<string, number | string> = { NR: 0, NF: 0 };

  // Simple expression evaluator for awk
  const evalExpr = (expr: string, fields: string[]): string | number | boolean => {
    // Replace field references $1, $2, etc
    let processed = expr.replace(/\$(\d+)/g, (_, n) => {
      const idx = parseInt(n, 10);
      return idx === 0 ? fields.join(' ') : (fields[idx - 1] || '');
    });

    // Replace variables
    for (const [key, val] of Object.entries(variables)) {
      processed = processed.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
    }

    // Handle string concatenation and comparisons
    try {
      // Check for comparison operators
      if (/[<>=!]+/.test(processed) && !/["']/.test(processed)) {
        return Function(`"use strict"; return (${processed})`)();
      }
      return processed;
    } catch {
      return processed;
    }
  };

  // Execute main program for each line
  const executeBlock = (block: string, fields: string[]) => {
    // Handle print statements
    const printMatch = block.match(/print\s+(.+)/);
    if (printMatch) {
      const printExpr = printMatch[1];

      // Handle string literals and field references
      const parts: string[] = [];
      const tokens = printExpr.split(/,\s*/);

      for (const token of tokens) {
        if (token.startsWith('"') && token.endsWith('"')) {
          parts.push(token.slice(1, -1));
        } else {
          const val = evalExpr(token.trim(), fields);
          parts.push(String(val));
        }
      }

      output.push(parts.join(' '));
    }

    // Handle variable assignments (sum += $2, count[$1]++, etc)
    const assignMatch = block.match(/(\w+)\s*\+=\s*(.+)/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const val = evalExpr(assignMatch[2], fields);
      variables[varName] = (Number(variables[varName]) || 0) + Number(val);
    }

    // Handle array counting (count[$1]++)
    const countMatch = block.match(/(\w+)\[(.+?)\]\+\+/);
    if (countMatch) {
      const arrayName = countMatch[1];
      const key = String(evalExpr(countMatch[2], fields));
      if (!variables[`${arrayName}_${key}`]) {
        variables[`${arrayName}_${key}`] = 0;
      }
      variables[`${arrayName}_${key}`] = Number(variables[`${arrayName}_${key}`]) + 1;
    }
  };

  // Process lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fields = line.split(fieldSep);
    variables.NR = i + 1;
    variables.NF = fields.length;

    if (mainProgram) {
      // Check for condition {action} pattern
      const condMatch = mainProgram.match(/^([^{]+)\s*\{(.+)\}$/);
      if (condMatch) {
        const condition = condMatch[1].trim();
        const action = condMatch[2].trim();

        // Evaluate condition
        const condResult = evalExpr(condition, fields);
        if (condResult && condResult !== 'false' && condResult !== 0) {
          executeBlock(action, fields);
        }
      } else if (mainProgram.startsWith('{') && mainProgram.endsWith('}')) {
        // Just action block
        executeBlock(mainProgram.slice(1, -1).trim(), fields);
      }
    }
  }

  // Execute END block
  if (endMatch) {
    const endBlock = endMatch[1];

    // Handle for (k in count) loops
    const forMatch = endBlock.match(/for\s*\((\w+)\s+in\s+(\w+)\)\s*print\s+(.+)/);
    if (forMatch) {
      const [, keyVar, arrayName, printExpr] = forMatch;
      const keys = Object.keys(variables)
        .filter(k => k.startsWith(`${arrayName}_`))
        .map(k => k.replace(`${arrayName}_`, ''));

      for (const key of keys) {
        const val = variables[`${arrayName}_${key}`];
        const result = printExpr
          .replace(new RegExp(`\\b${keyVar}\\b`, 'g'), key)
          .replace(new RegExp(`${arrayName}\\[${keyVar}\\]`, 'g'), String(val));

        // Handle string concatenation
        const parts = result.split(/,\s*/).map(p => {
          if (p.startsWith('"') && p.endsWith('"')) return p.slice(1, -1);
          return p;
        });
        output.push(parts.join(' '));
      }
    } else {
      // Simple print in END
      const printMatch = endBlock.match(/print\s+(.+)/);
      if (printMatch) {
        let printExpr = printMatch[1];
        for (const [key, val] of Object.entries(variables)) {
          printExpr = printExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
        }
        const parts = printExpr.split(/,\s*/).map(p => {
          if (p.startsWith('"') && p.endsWith('"')) return p.slice(1, -1);
          return p;
        });
        output.push(parts.join(' '));
      }
    }
  }

  return output.join('\n') || '(no output)';
}

/**
 * Options for kubectl command execution
 */
export interface KubectlOptions {
  fixture?: string;
  namespace?: string;
}

/**
 * Execute a command with the specified tool
 */
export async function executeCommand(
  tool: Tool,
  input: string,
  command: string,
  kubectlOptions?: KubectlOptions
): Promise<string> {
  // kubectl doesn't require input (uses fixtures instead)
  if (tool !== 'kubectl' && !input.trim()) {
    throw new Error('Input is empty');
  }
  if (!command.trim()) {
    throw new Error('Command is empty');
  }

  switch (tool) {
    case 'jq':
      return executeJq(input, command);
    case 'grep':
      return executeGrep(input, command);
    case 'sed':
      return executeSed(input, command);
    case 'awk':
      return executeAwk(input, command);
    case 'kubectl': {
      const options: ExecutorOptions = {
        fixtureId: kubectlOptions?.fixture || 'crashloop',
        defaultNamespace: kubectlOptions?.namespace || 'default',
      };
      const result = executeKubectl(command, options);
      if (result.exitCode !== 0) {
        throw new Error(result.stderr || 'Command failed');
      }
      return result.stdout;
    }
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}
