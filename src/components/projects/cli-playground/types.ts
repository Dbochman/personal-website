export type Tool = 'jq' | 'grep' | 'sed' | 'awk';
export type Mode = 'learn' | 'playground';

export interface ToolState {
  tool: Tool;
  input: string;
  command: string;
  output: string;
  error?: string;
  isLoading: boolean;
}

export interface PersistedToolState {
  input: string;
  command: string;
  presetIndex: number;
}

export interface CommandExplanation {
  summary: string;
  flags: { flag: string; meaning: string }[];
  tryNext: { label: string; command: string }[];
}

export interface ToolPreset {
  name: string;
  description: string;
  input: string;
  command: string;
}

export interface ToolConfig {
  name: string;
  description: string;
  placeholder: string;
  presets: ToolPreset[];
}

export const TOOL_CONFIGS: Record<Tool, ToolConfig> = {
  jq: {
    name: 'jq',
    description: 'Command-line JSON processor',
    placeholder: '.',
    presets: [
      {
        name: 'Select field',
        description: 'Extract a specific field from JSON',
        input: '{"name": "Alice", "age": 30, "city": "NYC"}',
        command: '.name',
      },
      {
        name: 'Filter array',
        description: 'Filter array elements by condition',
        input: '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}, {"name": "Carol", "age": 35}]',
        command: '.[] | select(.age > 28)',
      },
      {
        name: 'Map & transform',
        description: 'Transform array elements',
        input: '[{"name": "Alice", "score": 85}, {"name": "Bob", "score": 92}]',
        command: '[.[] | {student: .name, grade: (if .score >= 90 then "A" else "B" end)}]',
      },
      {
        name: 'Keys & values',
        description: 'Extract keys or values from object',
        input: '{"host": "api.example.com", "port": 443, "protocol": "https"}',
        command: 'keys',
      },
      {
        name: 'Nested access',
        description: 'Access deeply nested data',
        input: '{"user": {"profile": {"email": "alice@example.com", "verified": true}}}',
        command: '.user.profile.email',
      },
    ],
  },
  grep: {
    name: 'grep',
    description: 'Search text using patterns',
    placeholder: 'pattern',
    presets: [
      {
        name: 'Simple match',
        description: 'Find lines containing a word',
        input: 'apple pie\nbanana bread\napple crumble\ncherry tart',
        command: 'apple',
      },
      {
        name: 'Case insensitive',
        description: 'Match regardless of case (-i)',
        input: 'Error: Connection failed\nWARNING: Timeout\nerror: Invalid input\nInfo: Success',
        command: '-i error',
      },
      {
        name: 'Invert match',
        description: 'Show lines NOT matching (-v)',
        input: 'GET /api/users\nPOST /api/login\nGET /api/products\nDELETE /api/users/1',
        command: '-v GET',
      },
      {
        name: 'Line numbers',
        description: 'Show matching line numbers (-n)',
        input: 'function init() {}\nfunction start() {}\nfunction stop() {}\nfunction restart() {}',
        command: '-n start',
      },
      {
        name: 'Regex pattern',
        description: 'Use extended regex (-E)',
        input: 'user@example.com\ninvalid-email\nadmin@test.org\nno-at-sign',
        command: '-E "@[a-z]+\\.[a-z]+"',
      },
    ],
  },
  sed: {
    name: 'sed',
    description: 'Stream editor for text transformation',
    placeholder: 's/old/new/',
    presets: [
      {
        name: 'Replace first',
        description: 'Replace first occurrence per line',
        input: 'hello world world\nworld hello world',
        command: 's/world/universe/',
      },
      {
        name: 'Replace all',
        description: 'Replace all occurrences (global)',
        input: 'the cat sat on the mat\nthe cat ate the rat',
        command: 's/the/a/g',
      },
      {
        name: 'Delete lines',
        description: 'Delete lines matching pattern',
        input: '# This is a comment\ncode line 1\n# Another comment\ncode line 2',
        command: '/^#/d',
      },
      {
        name: 'Extract part',
        description: 'Extract using capture groups',
        input: 'user: alice (admin)\nuser: bob (guest)\nuser: carol (admin)',
        command: 's/user: \\([^ ]*\\).*/\\1/',
      },
      {
        name: 'Multiple commands',
        description: 'Chain multiple transformations',
        input: '  hello   world  \n  foo   bar  ',
        command: 's/^[ ]*//; s/[ ]*$//; s/  */ /g',
      },
    ],
  },
  awk: {
    name: 'awk',
    description: 'Pattern scanning and processing',
    placeholder: '{print $1}',
    presets: [
      {
        name: 'Print column',
        description: 'Extract specific columns',
        input: 'alice 30 engineer\nbob 25 designer\ncarol 35 manager',
        command: '{print $1, $3}',
      },
      {
        name: 'Sum column',
        description: 'Calculate sum of numeric column',
        input: 'apple 5\nbanana 3\norange 7\ngrape 2',
        command: '{sum += $2} END {print "Total:", sum}',
      },
      {
        name: 'Filter rows',
        description: 'Print rows matching condition',
        input: 'alice 85\nbob 92\ncarol 78\ndave 95',
        command: '$2 > 80 {print $1, "passed"}',
      },
      {
        name: 'CSV processing',
        description: 'Process comma-separated values',
        input: 'name,age,city\nalice,30,NYC\nbob,25,LA\ncarol,35,Chicago',
        command: '-F, \'NR>1 {print $1 " lives in " $3}\'',
      },
      {
        name: 'Count occurrences',
        description: 'Count unique values',
        input: 'error\nwarning\nerror\ninfo\nerror\nwarning',
        command: '{count[$1]++} END {for (k in count) print k, count[k]}',
      },
    ],
  },
};

export const DEFAULT_STATE: ToolState = {
  tool: 'jq',
  input: TOOL_CONFIGS.jq.presets[0].input,
  command: TOOL_CONFIGS.jq.presets[0].command,
  output: '',
  isLoading: false,
};
