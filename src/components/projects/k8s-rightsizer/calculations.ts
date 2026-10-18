/**
 * K8s Resource Right-Sizer Calculations
 *
 * Core logic for recommending CPU/memory requests and limits for one container
 * from observed usage percentiles and a sizing posture.
 *
 * Kubernetes semantics this module relies on (see the Resource Management docs):
 * - The scheduler places pods by their requests; limits are not considered.
 * - CPU limits are enforced by throttling; memory limits by (reactive) OOM kill.
 * - A limit without a request defaults the request to the limit.
 * - Under node-pressure eviction, the kubelet ranks pods whose usage exceeds
 *   their requests ahead of those within requests, then by priority and by how
 *   far usage exceeds requests. QoS class is not the ranking rule. So memory
 *   requests matter even when the limit is generous.
 */

// ============================================================================
// Types
// ============================================================================

export interface NormalizedResources {
  cpu: number;     // millicores
  memory: number;  // bytes
}

export interface ResourceValues {
  cpu: string;     // e.g., "500m", "2"
  memory: string;  // e.g., "256Mi", "1Gi"
}

export interface PercentileData {
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

export type Percentile = 'p50' | 'p95' | 'p99';
export type Posture = 'aggressive' | 'efficient' | 'balanced' | 'conservative' | 'safe';
export type QosClass = 'Guaranteed' | 'Burstable' | 'BestEffort';

/** Container spec values; undefined means the field is not set. */
export interface ContainerSpec {
  requests: Partial<NormalizedResources>;
  limits: Partial<NormalizedResources>;
}

export interface Pricing {
  cpuPerCoreHour: number;
  memoryPerGiBHour: number;
}

export interface CostBreakdown {
  cpu: number;      // monthly CPU cost
  memory: number;   // monthly memory cost
  total: number;    // monthly total
  yearly: number;   // annual total
}

export interface Finding {
  severity: 'warning' | 'info';
  text: string;
}

export interface Recommendation {
  posture: Posture;
  requests: ResourceValues;
  /** cpu is undefined when the CPU limit is omitted */
  limits: { cpu?: string; memory: string };
  requestsNormalized: NormalizedResources;
  limitsNormalized: { cpu?: number; memory: number };
  /** Human-readable formula behind each value, e.g. "P95 × 1.1" */
  basis: {
    cpuRequest: string;
    cpuLimit?: string;
    memoryRequest: string;
    memoryLimit: string;
  };
  currentEffectiveRequests: NormalizedResources;
  currentQosClass: QosClass;
  qosClass: QosClass;
  findings: Finding[];
  costs: {
    current: CostBreakdown;
    recommended: CostBreakdown;
    savings: CostBreakdown;  // negative when the recommendation reserves more
  };
}

// ============================================================================
// Constants
// ============================================================================

const MiB = 1024 * 1024;
const GiB = 1024 * MiB;

export const MIN_CPU_MILLICORES = 10;
export const MIN_MEMORY_BYTES = 16 * MiB;
/** Upper bounds keep arithmetic finite and catch unit typos (e.g. bytes vs Mi). */
export const MAX_CPU_MILLICORES = 1_000_000;      // 1000 cores
export const MAX_MEMORY_BYTES = 64 * 1024 * GiB;  // 64Ti
export const MAX_REPLICAS = 10_000;
export const MAX_PRICE = 1000;

// Illustrative accounting prices, not a quote from any provider.
export const DEFAULT_PRICING: Pricing = { cpuPerCoreHour: 0.03, memoryPerGiBHour: 0.004 };
export const HOURS_PER_MONTH = 730;

interface PostureConfig {
  label: string;
  /** Percentile behind CPU requests. Memory never goes below P95 (see below). */
  basePercentile: Percentile;
  requestMultiplier: number;
  limitMultiplier: number;
  risk: 'higher' | 'moderate' | 'lower';
  fit: string;
}

export const POSTURES: Posture[] = ['aggressive', 'efficient', 'balanced', 'conservative', 'safe'];

export const POSTURE_CONFIG: Record<Posture, PostureConfig> = {
  aggressive: {
    label: 'Aggressive', basePercentile: 'p50', requestMultiplier: 1.0, limitMultiplier: 1.1, risk: 'higher',
    fit: 'Dev and preview environments, interruptible jobs',
  },
  efficient: {
    label: 'Efficient', basePercentile: 'p50', requestMultiplier: 1.1, limitMultiplier: 1.2, risk: 'higher',
    fit: 'Stateless workers that retry safely',
  },
  balanced: {
    label: 'Balanced', basePercentile: 'p95', requestMultiplier: 1.1, limitMultiplier: 1.3, risk: 'moderate',
    fit: 'Most stateless services and batch workers',
  },
  conservative: {
    label: 'Conservative', basePercentile: 'p95', requestMultiplier: 1.2, limitMultiplier: 1.5, risk: 'lower',
    fit: 'Latency-sensitive web and API services',
  },
  safe: {
    label: 'Safe', basePercentile: 'p99', requestMultiplier: 1.3, limitMultiplier: 2.0, risk: 'lower',
    fit: 'Databases, caches, and other memory-sensitive stateful workloads',
  },
};

/**
 * Memory is not compressible, and a pod using more memory than it requests is
 * ranked ahead of within-request pods when the kubelet evicts under node memory
 * pressure. As a heuristic, memory requests never use a percentile below P95,
 * even in the efficiency-leaning postures. This reduces that exposure; it does
 * not make a pod immune to eviction.
 */
const MEMORY_MIN_PERCENTILE: Percentile = 'p95';
const PERCENTILE_ORDER: Percentile[] = ['p50', 'p95', 'p99'];

// ============================================================================
// Unit Parsing
// ============================================================================

// Kubernetes quantity number: "1", "1.5", ".5", "1." (exponent notation is not supported here)
const NUMBER = String.raw`(?:\d+(?:\.\d*)?|\.\d+)`;
const CPU_PATTERN = new RegExp(`^(${NUMBER})(m?)$`);
const MEMORY_PATTERN = new RegExp(`^(${NUMBER})(Ki|Mi|Gi|Ti|Pi|k|M|G|T|P)?$`);

const MEMORY_MULTIPLIERS: Record<string, number> = {
  Ki: 1024, Mi: MiB, Gi: GiB, Ti: 1024 * GiB, Pi: 1024 * 1024 * GiB,
  k: 1e3, M: 1e6, G: 1e9, T: 1e12, P: 1e15,
};

/**
 * Parse CPU quantity to millicores.
 * Examples: "500m" -> 500, "0.5" -> 500, "2" -> 2000.
 * Fractional millicores are kept (usage data can be sub-millicore).
 */
export function parseCpu(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Enter a CPU value, e.g. 250m or 0.5');
  if (trimmed.startsWith('-')) throw new Error('CPU cannot be negative');

  const match = trimmed.match(CPU_PATTERN);
  if (!match) {
    throw new Error(`"${trimmed}" is not a CPU quantity. Use cores (0.5, 2) or millicores (500m)`);
  }
  const num = Number(match[1]);
  const millicores = match[2] === 'm' ? num : num * 1000;
  if (!Number.isFinite(millicores) || millicores > MAX_CPU_MILLICORES) {
    throw new Error('CPU value is larger than this tool supports (1000 cores)');
  }
  return millicores;
}

/**
 * Parse a CPU request or limit. Unlike measured usage, Kubernetes doesn't
 * allow spec values finer than 1m (0.001 cores). Precision is checked on the
 * decimal string so values like 0.29 aren't rejected for floating point noise.
 * Returns whole millicores.
 */
export function parseCpuSpec(value: string): number {
  const millicores = parseCpu(value);
  const [, number, milli] = value.trim().match(CPU_PATTERN)!;
  const fraction = (number.split('.')[1] ?? '').replace(/0+$/, '');
  if (fraction.length > (milli ? 0 : 3)) {
    throw new Error('CPU requests and limits can’t be finer than 1m (0.001 cores)');
  }
  return Math.round(millicores);
}

/**
 * Parse memory quantity to bytes, following Kubernetes suffix rules.
 * Examples: "256Mi" -> 268435456, "1Gi" -> 1073741824, "512M" -> 512000000.
 */
export function parseMemory(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Enter a memory value, e.g. 256Mi or 1Gi');
  if (trimmed.startsWith('-')) throw new Error('Memory cannot be negative');

  const match = trimmed.match(MEMORY_PATTERN);
  if (!match) {
    const number = trimmed.match(new RegExp(`^${NUMBER}`))?.[0];
    const suffix = number ? trimmed.slice(number.length) : '';
    if (number && suffix === 'm') {
      // A real and costly mistake: "m" is the milli suffix, so 400m is 0.4 bytes.
      throw new Error(`In Kubernetes, "m" means millibytes for memory. Did you mean ${number}Mi?`);
    }
    if (number && suffix === 'K') {
      throw new Error(`Use lowercase k (kilobytes) or Ki (kibibytes), e.g. ${number}Ki`);
    }
    if (number && /^[KMGTP]i?B$/i.test(suffix)) {
      throw new Error(`Kubernetes uses Mi/Gi (binary) or M/G (decimal), not ${suffix}. Try ${number}${suffix[0].toUpperCase()}i`);
    }
    throw new Error(`"${trimmed}" is not a memory quantity. Use binary units like 512Mi or 2Gi`);
  }

  const [, numberPart, suffix] = match;
  if (!suffix && numberPart.includes('.')) {
    throw new Error('Plain byte values must be whole numbers; add a unit such as Mi');
  }
  const bytes = Math.ceil(Number(numberPart) * (suffix ? MEMORY_MULTIPLIERS[suffix] : 1));
  if (!Number.isFinite(bytes) || bytes > MAX_MEMORY_BYTES) {
    throw new Error('Memory value is larger than this tool supports (64Ti)');
  }
  return bytes;
}

/** Parse a whole replica count between 1 and MAX_REPLICAS. */
export function parseReplicas(value: string): number {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) throw new Error('Replicas must be a whole number, e.g. 3');
  const replicas = Number(trimmed);
  if (replicas < 1) throw new Error('Replicas must be at least 1');
  if (replicas > MAX_REPLICAS) throw new Error(`Replicas must be ${MAX_REPLICAS.toLocaleString('en-US')} or fewer`);
  return replicas;
}

/** Parse a non-negative price in dollars. */
export function parsePrice(value: string): number {
  const trimmed = value.trim().replace(/^\$/, '');
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) throw new Error('Enter a price such as 0.03');
  const price = Number(trimmed);
  if (price > MAX_PRICE) throw new Error(`Price must be $${MAX_PRICE} or less`);
  return price;
}

// ============================================================================
// Unit Formatting
// ============================================================================

/**
 * Format millicores to CPU string
 * Uses millicores for precision, whole cores when exact
 */
export function formatCpu(millicores: number): string {
  const rounded = Math.round(millicores);
  if (rounded >= 1000 && rounded % 1000 === 0) {
    return String(rounded / 1000);
  }
  return `${rounded}m`;
}

/**
 * Format bytes to memory string
 * Uses largest binary unit that results in clean value
 */
export function formatMemory(bytes: number): string {
  if (bytes >= GiB && bytes % GiB === 0) {
    return `${bytes / GiB}Gi`;
  }
  if (bytes >= MiB && bytes % MiB === 0) {
    return `${bytes / MiB}Mi`;
  }
  if (bytes >= 1024 && bytes % 1024 === 0) {
    return `${bytes / 1024}Ki`;
  }
  return String(bytes);
}

// ============================================================================
// Rounding (Round UP to be conservative)
// ============================================================================

/**
 * Round CPU up to nearest nice value
 * < 1000m: round to nearest 10m
 * >= 1000m: round to nearest 100m
 */
export function roundCpuUp(millicores: number): number {
  // Round to avoid floating point precision issues before ceiling
  const rounded = Math.round(millicores * 100) / 100;
  const step = rounded < 1000 ? 10 : 100;
  return Math.ceil(rounded / step) * step;
}

/**
 * Round memory up to a readable value without large overshoot.
 *
 * The step is the largest power of two no bigger than 1/8 of the value (but at
 * least 1Mi), so rounding adds at most 12.5% and results stay whole MiB.
 * Rounding to the next power of two instead could nearly double a request
 * (e.g. 520Mi -> 1Gi).
 */
export function roundMemoryUp(bytes: number): number {
  const whole = Math.round(bytes);
  if (whole <= MIN_MEMORY_BYTES) return MIN_MEMORY_BYTES;
  const step = Math.max(MiB, 2 ** Math.floor(Math.log2(whole / 8)));
  return Math.ceil(whole / step) * step;
}

// ============================================================================
// Percentile Validation
// ============================================================================

export interface PercentileInput {
  p50?: number;
  p95: number;
  p99?: number;
  max: number;
}

export interface NormalizedPercentiles extends PercentileData {
  /** Optional percentiles that were not measured and were replaced */
  substituted: Array<'p50' | 'p99'>;
}

const PERCENTILE_LABELS: Record<keyof PercentileData, string> = {
  p50: 'P50', p95: 'P95', p99: 'P99', max: 'Max',
};

/** Guard for numbers that arrive without going through the string parsers. */
function assertAmount(value: number, label: string, max = Number.MAX_VALUE): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite, non-negative number`);
  }
  if (value > max) throw new Error(`${label} is larger than this tool supports`);
}

/**
 * Validate ordering and fill missing optional percentiles without inventing data.
 *
 * A missing P50 is replaced by the measured P95 and a missing P99 by the
 * measured Max. Both substitutions can only raise a recommendation, and each is
 * reported so the UI can disclose it.
 */
export function normalizePercentiles(input: PercentileInput): NormalizedPercentiles {
  if (input.p95 === undefined || input.max === undefined) {
    throw new Error('P95 and Max are required');
  }
  const provided = (['p50', 'p95', 'p99', 'max'] as const)
    .filter((key) => input[key] !== undefined)
    .map((key) => ({ key, value: input[key] as number }));

  provided.forEach(({ key, value }) => assertAmount(value, PERCENTILE_LABELS[key]));

  for (let i = 1; i < provided.length; i++) {
    const lower = provided[i - 1];
    const higher = provided[i];
    if (lower.value > higher.value) {
      throw new Error(
        `${PERCENTILE_LABELS[lower.key]} is greater than ${PERCENTILE_LABELS[higher.key]}. ` +
        'Percentiles must satisfy P50 ≤ P95 ≤ P99 ≤ Max'
      );
    }
  }

  const substituted: Array<'p50' | 'p99'> = [];
  if (input.p50 === undefined) substituted.push('p50');
  if (input.p99 === undefined) substituted.push('p99');

  return {
    p50: input.p50 ?? input.p95,
    p95: input.p95,
    p99: input.p99 ?? input.max,
    max: input.max,
    substituted,
  };
}

// ============================================================================
// Kubernetes semantics helpers
// ============================================================================

/**
 * Requests Kubernetes would actually apply: if a limit is set without a
 * request, the request defaults to the limit. Unset everywhere means 0.
 * (A namespace LimitRange can also inject defaults; this tool can't see those.)
 */
export function effectiveRequests(spec: ContainerSpec): NormalizedResources {
  return {
    cpu: spec.requests.cpu ?? spec.limits.cpu ?? 0,
    memory: spec.requests.memory ?? spec.limits.memory ?? 0,
  };
}

/** QoS class of a single-container pod with this spec. */
export function qosClass(spec: ContainerSpec): QosClass {
  const req = effectiveRequests(spec);
  const { limits } = spec;
  if (
    limits.cpu !== undefined && limits.memory !== undefined &&
    limits.cpu > 0 && limits.memory > 0 &&
    req.cpu === limits.cpu && req.memory === limits.memory
  ) {
    return 'Guaranteed';
  }
  const anySet = [spec.requests.cpu, spec.requests.memory, limits.cpu, limits.memory]
    .some((value) => value !== undefined && value > 0);
  return anySet ? 'Burstable' : 'BestEffort';
}

/** Validate a current container spec the way the API server would. */
export function validateSpec(spec: ContainerSpec): { cpu?: string; memory?: string } {
  const errors: { cpu?: string; memory?: string } = {};
  const { requests, limits } = spec;
  if (requests.cpu !== undefined && limits.cpu !== undefined && requests.cpu > limits.cpu) {
    errors.cpu = 'CPU request cannot exceed the CPU limit (Kubernetes rejects this)';
  }
  if (requests.memory !== undefined && limits.memory !== undefined && requests.memory > limits.memory) {
    errors.memory = 'Memory request cannot exceed the memory limit (Kubernetes rejects this)';
  }
  return errors;
}

// ============================================================================
// Core Recommendation Logic
// ============================================================================

export interface RecommendationInput {
  usage: {
    cpu: PercentileInput;
    memory: PercentileInput;
  };
  current: ContainerSpec;
  replicas: number;
  posture: Posture;
  /** Whether to emit a CPU limit (default true) */
  includeCpuLimit?: boolean;
  pricing?: Pricing;
}

/** Percentile behind memory requests: the posture's, but never below P95. */
export function memoryRequestPercentile(posture: Posture): Percentile {
  const base = POSTURE_CONFIG[posture].basePercentile;
  return PERCENTILE_ORDER.indexOf(base) >= PERCENTILE_ORDER.indexOf(MEMORY_MIN_PERCENTILE) ? base : MEMORY_MIN_PERCENTILE;
}

function formatMultiplier(multiplier: number): string {
  return `× ${Number.isInteger(multiplier) ? multiplier.toFixed(1) : multiplier}`;
}

function monthlyCost(requests: NormalizedResources, replicas: number, pricing: Pricing) {
  const cpu = (requests.cpu / 1000) * replicas * pricing.cpuPerCoreHour * HOURS_PER_MONTH;
  const memory = (requests.memory / GiB) * replicas * pricing.memoryPerGiBHour * HOURS_PER_MONTH;
  return { cpu, memory, total: cpu + memory, yearly: (cpu + memory) * 12 };
}

function percentChange(from: number, to: number): number {
  return Math.round(((to - from) / from) * 100);
}

export function calculateRecommendation(input: RecommendationInput): Recommendation {
  const {
    current,
    posture,
    includeCpuLimit = true,
    pricing = DEFAULT_PRICING,
  } = input;
  // Direct callers bypass the string parsers, so guard every numeric input.
  if (!Number.isInteger(input.replicas) || input.replicas < 1 || input.replicas > MAX_REPLICAS) {
    throw new Error(`Replicas must be a whole number from 1 to ${MAX_REPLICAS}`);
  }
  if (!POSTURES.includes(posture)) throw new Error(`Unknown sizing posture: ${String(posture)}`);
  const usageBounds = [
    ['CPU', input.usage.cpu, MAX_CPU_MILLICORES],
    ['Memory', input.usage.memory, MAX_MEMORY_BYTES],
  ] as const;
  for (const [resource, usage, max] of usageBounds) {
    for (const key of ['p50', 'p95', 'p99', 'max'] as const) {
      if (usage[key] !== undefined) assertAmount(usage[key] as number, `${resource} ${PERCENTILE_LABELS[key]}`, max);
    }
  }
  const specBounds = [
    ['CPU request', current.requests.cpu, MAX_CPU_MILLICORES],
    ['CPU limit', current.limits.cpu, MAX_CPU_MILLICORES],
    ['Memory request', current.requests.memory, MAX_MEMORY_BYTES],
    ['Memory limit', current.limits.memory, MAX_MEMORY_BYTES],
  ] as const;
  for (const [label, value, max] of specBounds) {
    if (value !== undefined) assertAmount(value, `Current ${label.toLowerCase()}`, max);
  }
  const specErrors = validateSpec(current);
  if (specErrors.cpu || specErrors.memory) throw new Error(specErrors.cpu ?? specErrors.memory);
  assertAmount(pricing.cpuPerCoreHour, 'CPU price', MAX_PRICE);
  assertAmount(pricing.memoryPerGiBHour, 'Memory price', MAX_PRICE);

  const replicas = input.replicas;
  const config = POSTURE_CONFIG[posture];
  const cpu = normalizePercentiles(input.usage.cpu);
  const memory = normalizePercentiles(input.usage.memory);
  const findings: Finding[] = [];

  // Requests follow a percentile; limits follow the observed max.
  const cpuPercentile = config.basePercentile;
  const memoryPercentile = memoryRequestPercentile(posture);

  const cpuRequest = roundCpuUp(Math.max(MIN_CPU_MILLICORES, cpu[cpuPercentile] * config.requestMultiplier));
  const memoryRequest = roundMemoryUp(Math.max(MIN_MEMORY_BYTES, memory[memoryPercentile] * config.requestMultiplier));
  // Rounding is monotonic and limitMultiplier ≥ requestMultiplier, so limits
  // already cover requests; Math.max keeps the requests ≤ limits invariant explicit.
  const cpuLimit = includeCpuLimit
    ? Math.max(cpuRequest, roundCpuUp(Math.max(MIN_CPU_MILLICORES, cpu.max * config.limitMultiplier)))
    : undefined;
  const memoryLimit = Math.max(
    memoryRequest,
    roundMemoryUp(Math.max(MIN_MEMORY_BYTES, memory.max * config.limitMultiplier))
  );

  const label = (p: Percentile, usage: NormalizedPercentiles) => {
    if (p === 'p50' && usage.substituted.includes('p50')) return 'P95 (no P50 given)';
    if (p === 'p99' && usage.substituted.includes('p99')) return 'Max (no P99 given)';
    return PERCENTILE_LABELS[p];
  };
  const basis = {
    cpuRequest: `${label(cpuPercentile, cpu)} ${formatMultiplier(config.requestMultiplier)}`,
    cpuLimit: includeCpuLimit ? `Max ${formatMultiplier(config.limitMultiplier)}` : undefined,
    memoryRequest: `${label(memoryPercentile, memory)} ${formatMultiplier(config.requestMultiplier)}`,
    memoryLimit: `Max ${formatMultiplier(config.limitMultiplier)}`,
  };

  const recommendedSpec: ContainerSpec = {
    requests: { cpu: cpuRequest, memory: memoryRequest },
    limits: { cpu: cpuLimit, memory: memoryLimit },
  };
  const currentRequests = effectiveRequests(current);
  const currentQos = qosClass(current);
  const recommendedQos = qosClass(recommendedSpec);

  // --- Data-quality findings: things the percentiles can't tell you ---------
  if (cpu.max === 0) {
    findings.push({ severity: 'warning', text: 'Observed CPU max is 0. Check that the query targets the right container; the request falls back to the 10m floor.' });
  }
  if (memory.max === 0) {
    findings.push({ severity: 'warning', text: 'Observed memory max is 0. Check that the query targets the right container; the request falls back to the 16Mi floor.' });
  }
  if (current.limits.cpu !== undefined && current.limits.cpu > 0 && cpu.max >= current.limits.cpu * 0.9) {
    findings.push({
      severity: 'warning',
      text: `Observed CPU max is within 10% of the current ${formatCpu(current.limits.cpu)} limit. The container was likely throttled, so real demand may be higher than measured. Check container_cpu_cfs_throttled_periods_total before lowering anything.`,
    });
  }
  if (current.limits.memory !== undefined && current.limits.memory > 0) {
    if (memory.max > current.limits.memory) {
      findings.push({
        severity: 'warning',
        text: 'Observed memory max is above the current memory limit. The limit probably changed during the window, or the data covers a different container or metric.',
      });
    } else if (memory.max >= current.limits.memory * 0.9) {
      findings.push({
        severity: 'warning',
        text: 'Observed memory max is within 10% of the current limit. Look for OOMKilled restarts: demand above the limit never shows up in usage data.',
      });
    }
  }
  if (currentRequests.memory > 0 && currentRequests.memory < memory.p95) {
    findings.push({
      severity: 'warning',
      text: 'The current memory request is below observed P95. If the node runs short of memory, the kubelet evicts pods using more than their requests first, so this pod is often exposed.',
    });
  }

  const spikeReference = memory.substituted.includes('p99') ? memory.p95 : memory.p99;
  const cpuSpikeReference = cpu.substituted.includes('p99') ? cpu.p95 : cpu.p99;
  if ((cpuSpikeReference > 0 && cpu.max > cpuSpikeReference * 2) || (spikeReference > 0 && memory.max > spikeReference * 2)) {
    findings.push({
      severity: 'info',
      text: 'Max is more than twice the next percentile, so short spikes (startup, GC, cron work) drive the peak. Limits follow Max, but requests do not reserve capacity for those spikes.',
    });
  }

  const substitutions = [
    cpuPercentile === 'p50' && cpu.substituted.includes('p50') && 'CPU request uses P95 because no P50 was given',
    cpuPercentile === 'p99' && cpu.substituted.includes('p99') && 'CPU request uses Max because no P99 was given',
    memoryPercentile === 'p99' && memory.substituted.includes('p99') && 'Memory request uses Max because no P99 was given',
  ].filter(Boolean);
  if (substitutions.length > 0) {
    findings.push({ severity: 'info', text: `${substitutions.join('; ')}. Missing values are never estimated, only replaced by a higher measurement.` });
  }

  // --- Change-management findings ------------------------------------------
  const bigCuts = [
    currentRequests.cpu > 0 && cpuRequest < currentRequests.cpu * 0.5 && `CPU request ${percentChange(currentRequests.cpu, cpuRequest)}%`,
    currentRequests.memory > 0 && memoryRequest < currentRequests.memory * 0.5 && `memory request ${percentChange(currentRequests.memory, memoryRequest)}%`,
  ].filter(Boolean);
  if (bigCuts.length > 0) {
    findings.push({
      severity: 'info',
      text: `Large reduction (${bigCuts.join(', ')}). Consider stepping down in stages, for example halfway first, and watching each step.`,
    });
  }

  if (currentRequests.cpu > 0 && cpuRequest !== currentRequests.cpu) {
    const ratio = currentRequests.cpu / cpuRequest;
    findings.push({
      severity: 'info',
      text: `If an HPA scales this workload on CPU utilization, utilization is measured against the request. Moving from ${formatCpu(currentRequests.cpu)} to ${formatCpu(cpuRequest)} makes the same usage read ${ratio >= 1 ? `${ratio.toFixed(1)}× higher` : `${(1 / ratio).toFixed(1)}× lower`}, so revisit the HPA target.`,
    });
  }

  if (currentQos === 'Guaranteed' && recommendedQos !== 'Guaranteed') {
    findings.push({
      severity: 'warning',
      text: 'For a single-container pod, this changes the QoS class from Guaranteed to Burstable. Other containers, including sidecars, can change the actual pod class. The kubelet does not rank evictions by QoS, but a Burstable pod can use more memory than it requests, which moves it ahead of within-request pods under node memory pressure. Keep requests equal to limits across all containers if you depend on Guaranteed behavior.',
    });
  }

  if (!includeCpuLimit) {
    findings.push({
      severity: 'info',
      text: 'Without a CPU limit the container can use idle CPU on its node. A namespace LimitRange may still apply a default limit.',
    });
  }

  // --- Illustrative request cost -------------------------------------------
  const currentCost = monthlyCost(currentRequests, replicas, pricing);
  const recommendedCost = monthlyCost({ cpu: cpuRequest, memory: memoryRequest }, replicas, pricing);
  const savings = {
    cpu: currentCost.cpu - recommendedCost.cpu,
    memory: currentCost.memory - recommendedCost.memory,
    total: currentCost.total - recommendedCost.total,
    yearly: currentCost.yearly - recommendedCost.yearly,
  };

  return {
    posture,
    requests: { cpu: formatCpu(cpuRequest), memory: formatMemory(memoryRequest) },
    limits: {
      cpu: cpuLimit === undefined ? undefined : formatCpu(cpuLimit),
      memory: formatMemory(memoryLimit),
    },
    requestsNormalized: { cpu: cpuRequest, memory: memoryRequest },
    limitsNormalized: { cpu: cpuLimit, memory: memoryLimit },
    basis,
    currentEffectiveRequests: currentRequests,
    currentQosClass: currentQos,
    qosClass: recommendedQos,
    findings,
    costs: { current: currentCost, recommended: recommendedCost, savings },
  };
}

// ============================================================================
// YAML Generation
// ============================================================================

/** `resources` block for a container entry in spec.containers[] */
export function generateYaml(recommendation: Pick<Recommendation, 'requests' | 'limits'>): string {
  const { requests, limits } = recommendation;
  const lines = [
    'resources:',
    '  requests:',
    `    cpu: "${requests.cpu}"`,
    `    memory: "${requests.memory}"`,
    '  limits:',
  ];
  if (limits.cpu !== undefined) lines.push(`    cpu: "${limits.cpu}"`);
  lines.push(`    memory: "${limits.memory}"`);
  return lines.join('\n');
}
