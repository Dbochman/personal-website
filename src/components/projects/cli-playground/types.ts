export type Tool = 'jq' | 'grep' | 'sed' | 'awk' | 'kubectl';
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
  expectedOutputIncludes?: string;
  expectedOutputRegex?: string;
  // kubectl-specific fields
  fixture?: string; // Which cluster fixture to use
  namespace?: string; // Default namespace for the lesson
  objective?: string; // Learning objective (shown in Learn mode)
}

export interface ToolConfig {
  name: string;
  description: string;
  placeholder: string;
  presets: ToolPreset[];
  hideStdin?: boolean; // For kubectl, we don't use stdin
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
        expectedOutputIncludes: 'Alice',
      },
      {
        name: 'Filter array',
        description: 'Filter array elements by condition',
        input: '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}, {"name": "Carol", "age": 35}]',
        command: '.[] | select(.age > 28)',
        expectedOutputIncludes: 'Carol',
      },
      {
        name: 'Structured Logs',
        description: 'Parse structured JSON logs from ELK or CloudWatch',
        input: '[{"timestamp": "2024-01-15T10:23:45Z", "level": "info", "service": "api", "message": "Request received"}, {"timestamp": "2024-01-15T10:23:46Z", "level": "error", "service": "api", "message": "Database timeout", "error_code": "DB_TIMEOUT"}, {"timestamp": "2024-01-15T10:23:47Z", "level": "warn", "service": "api", "message": "Slow query"}, {"timestamp": "2024-01-15T10:23:48Z", "level": "error", "service": "db", "message": "Connection pool full"}]',
        command: '.[] | select(.level == "error")',
        expectedOutputIncludes: 'Database timeout',
      },
      {
        name: 'Nested Errors',
        description: 'Extract error objects from nested JSON structures (includes null for successful requests)',
        input: '[{"request_id": "req-001", "status": 200, "error": null}, {"request_id": "req-002", "status": 500, "error": {"code": "DB_ERROR", "message": "Connection timeout", "details": {"host": "db-01"}}}, {"request_id": "req-003", "status": 200, "error": null}, {"request_id": "req-004", "status": 503, "error": {"code": "SERVICE_UNAVAILABLE", "message": "Upstream service down"}}]',
        command: '.[] | .error',
        expectedOutputIncludes: 'DB_ERROR',
      },
      {
        name: 'Filter by Severity',
        description: 'Filter logs by severity level (error, warn, etc.)',
        input: '[{"timestamp": "2024-01-15T10:23:45Z", "severity": "info", "message": "Health check OK"}, {"timestamp": "2024-01-15T10:23:46Z", "severity": "error", "message": "Database connection failed"}, {"timestamp": "2024-01-15T10:23:47Z", "severity": "warn", "message": "High latency detected"}, {"timestamp": "2024-01-15T10:23:48Z", "severity": "critical", "message": "Service unavailable"}, {"timestamp": "2024-01-15T10:23:49Z", "severity": "info", "message": "Request processed"}]',
        command: '.[] | select(.severity == "error")',
        expectedOutputIncludes: 'Database connection failed',
      },
      {
        name: 'Extract Services',
        description: 'Extract service names from log entries',
        input: '[{"service": "api", "level": "info", "message": "Request"}, {"service": "api", "level": "error", "message": "Failed"}, {"service": "db", "level": "info", "message": "Query"}, {"service": "api", "level": "warn", "message": "Slow"}, {"service": "cache", "level": "info", "message": "Hit"}]',
        command: '.[] | .service',
        expectedOutputIncludes: 'api',
      },
      {
        name: 'Request Metrics',
        description: 'Extract request duration and status codes',
        input: '[{"path": "/api/users", "method": "GET", "status": 200, "duration_ms": 234, "user_id": "user-123"}, {"path": "/api/orders", "method": "POST", "status": 201, "duration_ms": 567, "user_id": "user-456"}, {"path": "/api/products", "method": "GET", "status": 200, "duration_ms": 89, "user_id": "user-789"}, {"path": "/api/search", "method": "GET", "status": 500, "duration_ms": 2341, "user_id": "user-123"}]',
        command: '[.[] | {path: .path, status: .status, duration: .duration_ms}]',
        expectedOutputIncludes: '"duration": 234',
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
        expectedOutputIncludes: 'apple pie',
      },
      {
        name: 'Case insensitive',
        description: 'Match regardless of case (-i)',
        input: 'Error: Connection failed\nWARNING: Timeout\nerror: Invalid input\nInfo: Success',
        command: '-i error',
        expectedOutputIncludes: 'Error: Connection failed',
      },
      {
        name: 'Find Errors',
        description: 'Extract error messages from application logs',
        input: '2024-01-15T10:23:45.123Z INFO  Request received: GET /api/users\n2024-01-15T10:23:45.456Z INFO  Processing request\n2024-01-15T10:23:46.789Z ERROR Database connection failed: timeout\n2024-01-15T10:23:46.790Z ERROR Failed to initialize connection pool\n2024-01-15T10:23:47.123Z INFO  Request completed: 200 OK\n2024-01-15T10:23:48.456Z WARN  Slow query detected: 2.5s\n2024-01-15T10:23:49.789Z ERROR Authentication failed for user: alice@example.com',
        command: '-i error',
        expectedOutputIncludes: 'Database connection failed',
      },
      {
        name: 'Slow Requests',
        description: 'Identify requests taking longer than 1 second',
        input: '2024-01-15T10:23:45.123Z GET /api/users 200 234ms\n2024-01-15T10:23:46.456Z POST /api/orders 201 1567ms\n2024-01-15T10:23:47.789Z GET /api/products 200 89ms\n2024-01-15T10:23:48.012Z GET /api/search 200 2341ms\n2024-01-15T10:23:49.345Z DELETE /api/users/123 204 456ms',
        command: '-E "[0-9]{4,}ms"',
        expectedOutputIncludes: '1567ms',
      },
      {
        name: 'Auth Failures',
        description: 'Find authentication and authorization failures',
        input: '2024-01-15T10:23:45.123Z INFO  User login attempt: alice@example.com\n2024-01-15T10:23:45.456Z ERROR Authentication failed: invalid credentials\n2024-01-15T10:23:46.789Z WARN  Unauthorized access attempt: /api/admin/users\n2024-01-15T10:23:47.012Z INFO  User authenticated: bob@example.com\n2024-01-15T10:23:48.345Z ERROR 403 Forbidden: insufficient permissions\n2024-01-15T10:23:49.678Z INFO  Login successful: carol@example.com',
        command: '-iE "(auth|login|unauthorized|forbidden|401|403)"',
        expectedOutputIncludes: 'Authentication failed',
      },
      {
        name: 'Trace IDs',
        description: 'Extract distributed trace IDs for correlation',
        input: '2024-01-15T10:23:45.123Z INFO  trace_id=abc123def456 service=api request_id=req-001\n2024-01-15T10:23:45.124Z INFO  trace_id=abc123def456 service=db query=SELECT users\n2024-01-15T10:23:45.125Z INFO  trace_id=xyz789uvw012 service=cache operation=get\n2024-01-15T10:23:45.126Z INFO  trace_id=abc123def456 service=api response=200\n2024-01-15T10:23:45.127Z INFO  trace_id=xyz789uvw012 service=api request_id=req-002',
        command: '-iE "trace_id=[a-z0-9]+"',
        expectedOutputIncludes: 'trace_id=abc123def456',
      },
      {
        name: 'Critical Errors',
        description: 'Filter for ERROR and FATAL level messages',
        input: '2024-01-15T10:23:45.123Z INFO  Application started\n2024-01-15T10:23:46.456Z WARN  High memory usage: 85%\n2024-01-15T10:23:47.789Z ERROR Connection pool exhausted\n2024-01-15T10:23:48.012Z FATAL Out of memory: cannot allocate\n2024-01-15T10:23:49.345Z INFO  Health check passed\n2024-01-15T10:23:50.678Z ERROR Failed to process request',
        command: '-E "(ERROR|FATAL|CRITICAL)"',
        expectedOutputIncludes: 'FATAL Out of memory',
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
        expectedOutputIncludes: 'hello universe world',
      },
      {
        name: 'Replace all',
        description: 'Replace all occurrences (global)',
        input: 'the cat sat on the mat\nthe cat ate the rat',
        command: 's/the/a/g',
        expectedOutputIncludes: 'a cat sat on a mat',
      },
      {
        name: 'Delete lines',
        description: 'Delete lines matching pattern',
        input: '# This is a comment\ncode line 1\n# Another comment\ncode line 2',
        command: '/^#/d',
        expectedOutputIncludes: 'code line 1',
      },
      {
        name: 'Extract part',
        description: 'Extract using capture groups',
        input: 'user: alice (admin)\nuser: bob (guest)\nuser: carol (admin)',
        command: 's/user: \\([^ ]*\\).*/\\1/',
        expectedOutputIncludes: 'alice',
      },
      {
        name: 'Multiple commands',
        description: 'Chain multiple transformations',
        input: '  hello   world  \n  foo   bar  ',
        command: 's/^[ ]*//; s/[ ]*$//; s/  */ /g',
        expectedOutputIncludes: 'hello world',
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
        expectedOutputIncludes: 'alice engineer',
      },
      {
        name: 'Sum column',
        description: 'Calculate sum of numeric column',
        input: 'apple 5\nbanana 3\norange 7\ngrape 2',
        command: '{sum += $2} END {print "Total:", sum}',
        expectedOutputIncludes: 'Total: 17',
      },
      {
        name: 'Access Log Parsing',
        description: 'Parse access logs and extract key fields',
        input: '192.168.1.100 GET /api/users 200 1234\n192.168.1.101 POST /api/orders 201 5678\n192.168.1.102 GET /api/products 200 890\n192.168.1.103 GET /api/search 500 2341',
        command: '{print $1, $3, $4}',
        expectedOutputIncludes: '/api/users 200',
      },
      {
        name: 'Response Time Average',
        description: 'Calculate average response time from logs',
        input: '/api/users 200 234\n/api/orders 201 567\n/api/products 200 89\n/api/search 200 1234\n/api/users 200 456\n/api/orders 201 789',
        command: '{sum += $3; count++} END {print "Average:", sum/count}',
        expectedOutputIncludes: 'Average:',
      },
      {
        name: 'IP Request Counts',
        description: 'Count requests per IP address',
        input: '192.168.1.100 GET /api/users 200\n192.168.1.101 POST /api/orders 201\n192.168.1.100 GET /api/products 200\n192.168.1.102 GET /api/search 200\n192.168.1.100 POST /api/users 201\n192.168.1.103 GET /api/health 200',
        command: '{count[$1]++} END {for (k in count) print k, count[k]}',
        expectedOutputIncludes: '192.168.1.100 3',
      },
      {
        name: 'CSV Metrics',
        description: 'Parse CSV metrics exports from monitoring tools',
        input: 'service,metric,value,timestamp\napi,requests_per_sec,150,2024-01-15T10:23:45Z\napi,error_rate,0.02,2024-01-15T10:23:45Z\ndb,connections,45,2024-01-15T10:23:45Z\ncache,hit_rate,0.85,2024-01-15T10:23:45Z\napi,latency_p95,234,2024-01-15T10:23:46Z',
        command: '-F, \'NR>1 {print $1, $3}\'',
        expectedOutputIncludes: 'api 150',
      },
      {
        name: 'Slow Requests Filter',
        description: 'Filter requests exceeding latency threshold',
        input: '/api/users GET 200 234\n/api/orders POST 201 1567\n/api/products GET 200 89\n/api/search GET 200 2341\n/api/users GET 200 456\n/api/admin DELETE 204 3456',
        command: '$4 > 1000 {print $1, $2, $4}',
        expectedOutputIncludes: '/api/orders POST 1567',
      },
    ],
  },
  kubectl: {
    name: 'kubectl',
    description: 'Kubernetes cluster management',
    placeholder: 'get pods',
    hideStdin: true,
    presets: [
      {
        name: 'CrashLoopBackOff',
        description: 'Triage: CrashLoopBackOff after deploy',
        input: '',
        command: 'get pods -n payments',
        fixture: 'crashloop',
        namespace: 'payments',
        objective: 'Find the CrashLooping pod and confirm why it keeps restarting',
        expectedOutputIncludes: 'CrashLoopBackOff',
      },
      {
        name: 'ImagePullBackOff',
        description: 'Triage: Image pull failures',
        input: '',
        command: 'get pods -n frontend',
        fixture: 'imagepull',
        namespace: 'frontend',
        objective: 'Find the pod stuck pulling its image and identify the exact error',
        expectedOutputIncludes: 'ImagePullBackOff',
      },
      {
        name: 'Service Mismatch',
        description: 'Triage: Service with no endpoints',
        input: '',
        command: 'get svc,endpoints -n api',
        fixture: 'service-mismatch',
        namespace: 'api',
        objective: 'Find why the service has no endpoints and fix the selector mismatch',
        expectedOutputRegex: 'api-server\\s+<none>',
      },
      {
        name: 'Rollout Regression',
        description: 'Triage: Bad deploy, needs rollback',
        input: '',
        command: 'rollout status deployment/web -n production',
        fixture: 'rollout-regression',
        namespace: 'production',
        objective: 'Identify the failing deployment and roll back to the previous version',
        expectedOutputIncludes: 'deployment "web"',
      },
      {
        name: 'Node Pressure',
        description: 'Triage: Node under resource pressure',
        input: '',
        command: 'get nodes',
        fixture: 'node-pressure',
        namespace: 'default',
        objective: 'Find the node under pressure and identify which pods are being evicted',
        expectedOutputIncludes: 'DiskPressure',
      },
    ],
  },
};

export const DEFAULT_STATE: ToolState = {
  tool: 'kubectl',
  input: TOOL_CONFIGS.kubectl.presets[0].input,
  command: TOOL_CONFIGS.kubectl.presets[0].command,
  output: '',
  isLoading: false,
};
