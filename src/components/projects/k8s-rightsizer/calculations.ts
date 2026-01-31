/**
 * K8s Resource Right-Sizer Calculations
 *
 * Core logic for recommending CPU/memory requests and limits
 * based on observed utilization percentiles and risk preference.
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

export interface WorkloadInput {
  name: string;
  replicas: number;
  current: {
    requests: ResourceValues;
    limits: ResourceValues;
  };
  usage: {
    cpu: PercentileData;
    memory: PercentileData;
  };
}

export interface Recommendation {
  requests: ResourceValues;
  limits: ResourceValues;
  requestsNormalized: NormalizedResources;
  limitsNormalized: NormalizedResources;
  reasoning: string[];
  savings: {
    monthly: number;
    yearly: number;
  };
  risk: 'low' | 'medium' | 'high';
  warnings: string[];
}

export type PresetProfile = 'webserver' | 'worker' | 'database' | 'custom';

// ============================================================================
// Constants
// ============================================================================

const MiB = 1024 * 1024;
const GiB = 1024 * MiB;

// Power-of-2 MiB values for memory rounding
const MEMORY_ROUND_VALUES = [
  16 * MiB, 32 * MiB, 64 * MiB, 128 * MiB, 256 * MiB, 512 * MiB,
  1 * GiB, 2 * GiB, 4 * GiB, 8 * GiB, 16 * GiB, 32 * GiB, 64 * GiB,
];

// Default cost assumptions (approximate cloud pricing)
export const DEFAULT_COST_PER_CORE_HOUR = 0.03;
export const DEFAULT_COST_PER_GIB_HOUR = 0.004;
const HOURS_PER_MONTH = 730;

// Slider range mappings
interface SliderConfig {
  basePercentile: 'p50' | 'p95' | 'p99';
  safetyMultiplier: number;
  headroomMultiplier: number;
  risk: 'low' | 'medium' | 'high';
}

const SLIDER_MAPPINGS: { min: number; max: number; config: SliderConfig }[] = [
  { min: 0, max: 19, config: { basePercentile: 'p50', safetyMultiplier: 1.0, headroomMultiplier: 1.1, risk: 'high' } },
  { min: 20, max: 39, config: { basePercentile: 'p50', safetyMultiplier: 1.1, headroomMultiplier: 1.2, risk: 'high' } },
  { min: 40, max: 59, config: { basePercentile: 'p95', safetyMultiplier: 1.1, headroomMultiplier: 1.3, risk: 'medium' } },
  { min: 60, max: 79, config: { basePercentile: 'p95', safetyMultiplier: 1.2, headroomMultiplier: 1.5, risk: 'low' } },
  { min: 80, max: 100, config: { basePercentile: 'p99', safetyMultiplier: 1.3, headroomMultiplier: 2.0, risk: 'low' } },
];

// Preset default slider positions
export const PRESET_SLIDER_VALUES: Record<PresetProfile, number> = {
  webserver: 60,
  worker: 40,
  database: 80,
  custom: 50,
};

// ============================================================================
// Unit Parsing
// ============================================================================

/**
 * Parse CPU string to millicores
 * Examples: "500m" -> 500, "0.5" -> 500, "2" -> 2000
 */
export function parseCpu(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Empty CPU value');

  if (trimmed.endsWith('m')) {
    const num = parseFloat(trimmed.slice(0, -1));
    if (isNaN(num)) throw new Error(`Invalid CPU value: ${value}`);
    return Math.round(num);
  }

  const num = parseFloat(trimmed);
  if (isNaN(num)) throw new Error(`Invalid CPU value: ${value}`);
  return Math.round(num * 1000);
}

/**
 * Parse memory string to bytes
 * Examples: "256Mi" -> 268435456, "1Gi" -> 1073741824, "512M" -> 512000000
 */
export function parseMemory(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Empty memory value');

  // Binary units (Ki, Mi, Gi, Ti)
  const binaryMatch = trimmed.match(/^([\d.]+)(Ki|Mi|Gi|Ti)$/i);
  if (binaryMatch) {
    const num = parseFloat(binaryMatch[1]);
    if (isNaN(num)) throw new Error(`Invalid memory value: ${value}`);
    const unit = binaryMatch[2].toLowerCase();
    const multipliers: Record<string, number> = {
      'ki': 1024,
      'mi': MiB,
      'gi': GiB,
      'ti': 1024 * GiB,
    };
    return Math.round(num * multipliers[unit]);
  }

  // Decimal units (K, M, G, T)
  const decimalMatch = trimmed.match(/^([\d.]+)(K|M|G|T)$/i);
  if (decimalMatch) {
    const num = parseFloat(decimalMatch[1]);
    if (isNaN(num)) throw new Error(`Invalid memory value: ${value}`);
    const unit = decimalMatch[2].toLowerCase();
    const multipliers: Record<string, number> = {
      'k': 1000,
      'm': 1000000,
      'g': 1000000000,
      't': 1000000000000,
    };
    return Math.round(num * multipliers[unit]);
  }

  // Plain bytes
  const num = parseFloat(trimmed);
  if (isNaN(num)) throw new Error(`Invalid memory value: ${value}`);
  return Math.round(num);
}

// ============================================================================
// Unit Formatting
// ============================================================================

/**
 * Format millicores to CPU string
 * Uses millicores for precision, whole cores for ≥1000m
 */
export function formatCpu(millicores: number): string {
  if (millicores >= 1000 && millicores % 1000 === 0) {
    return String(millicores / 1000);
  }
  return `${Math.round(millicores)}m`;
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
 * Round memory up to nearest power-of-2 MiB
 */
export function roundMemoryUp(bytes: number): number {
  const minBytes = 16 * MiB;
  if (bytes <= minBytes) return minBytes;

  for (const target of MEMORY_ROUND_VALUES) {
    if (bytes <= target) return target;
  }

  // For very large values, round up to nearest GiB
  return Math.ceil(bytes / GiB) * GiB;
}

// ============================================================================
// Percentile Validation & Defaults
// ============================================================================

export interface PercentileInput {
  p50?: number;
  p95: number;
  p99?: number;
  max: number;
}

/**
 * Validate and fill in missing percentiles
 * Returns complete PercentileData or throws error
 */
export function normalizePercentiles(input: PercentileInput): PercentileData {
  const { p95, max } = input;

  // Fill defaults
  const p50 = input.p50 ?? p95 * 0.6;
  const p99 = input.p99 ?? Math.max(p95, max * 0.9);

  // Validate ordering
  if (p50 > p95 || p95 > p99 || p99 > max) {
    throw new Error('Percentile values must be in order (P50 ≤ P95 ≤ P99 ≤ Max)');
  }

  return { p50, p95, p99, max };
}

// ============================================================================
// Slider Config
// ============================================================================

function getSliderConfig(slider: number): SliderConfig {
  for (const mapping of SLIDER_MAPPINGS) {
    if (slider >= mapping.min && slider <= mapping.max) {
      return mapping.config;
    }
  }
  // Fallback (shouldn't happen with valid input)
  return SLIDER_MAPPINGS[2].config;
}

// ============================================================================
// Core Recommendation Logic
// ============================================================================

export interface RecommendationInput {
  usage: {
    cpu: PercentileData;
    memory: PercentileData;
  };
  current: {
    requests: NormalizedResources;
    limits: NormalizedResources;
  };
  replicas: number;
  slider: number;
  costPerCoreHour?: number;
  costPerGiBHour?: number;
}

export function calculateRecommendation(input: RecommendationInput): Recommendation {
  const {
    usage,
    current,
    replicas,
    slider,
    costPerCoreHour = DEFAULT_COST_PER_CORE_HOUR,
    costPerGiBHour = DEFAULT_COST_PER_GIB_HOUR,
  } = input;

  const config = getSliderConfig(slider);
  const reasoning: string[] = [];
  const warnings: string[] = [];

  // Calculate raw recommendations
  const rawCpuRequests = usage.cpu[config.basePercentile] * config.safetyMultiplier;
  const rawCpuLimits = usage.cpu.max * config.headroomMultiplier;
  const rawMemRequests = usage.memory[config.basePercentile] * config.safetyMultiplier;
  const rawMemLimits = usage.memory.max * config.headroomMultiplier;

  reasoning.push(`Based on ${config.basePercentile.toUpperCase()} usage with ${config.safetyMultiplier}x safety multiplier`);
  reasoning.push(`Limits set at ${config.headroomMultiplier}x observed max`);

  // Apply constraints in order:
  // 1. Minimums
  let cpuRequests = Math.max(10, rawCpuRequests);
  let cpuLimits = Math.max(10, rawCpuLimits);
  let memRequests = Math.max(16 * MiB, rawMemRequests);
  let memLimits = Math.max(16 * MiB, rawMemLimits);

  // 2. Round UP
  cpuRequests = roundCpuUp(cpuRequests);
  cpuLimits = roundCpuUp(cpuLimits);
  memRequests = roundMemoryUp(memRequests);
  memLimits = roundMemoryUp(memLimits);

  // 3. Ensure requests ≤ limits (final step)
  if (cpuRequests > cpuLimits) {
    cpuRequests = cpuLimits;
    warnings.push('CPU requests capped at limits');
  }
  if (memRequests > memLimits) {
    memRequests = memLimits;
    warnings.push('Memory requests capped at limits');
  }

  // Check for potential issues
  if (cpuLimits < usage.cpu.max) {
    warnings.push('CPU limits below observed max - risk of throttling');
  }
  if (memLimits < usage.memory.max) {
    warnings.push('Memory limits below observed max - risk of OOMKill');
  }

  // Calculate savings
  const cpuSavingsPerHour = ((current.requests.cpu - cpuRequests) / 1000) * replicas * costPerCoreHour;
  const memSavingsPerHour = ((current.requests.memory - memRequests) / GiB) * replicas * costPerGiBHour;
  const monthlySavings = Math.max(0, (cpuSavingsPerHour + memSavingsPerHour) * HOURS_PER_MONTH);
  const yearlySavings = monthlySavings * 12;

  if (cpuSavingsPerHour + memSavingsPerHour < 0) {
    reasoning.push('Recommendation increases resource allocation (negative savings)');
  } else if (monthlySavings > 0) {
    reasoning.push(`Estimated monthly savings: $${monthlySavings.toFixed(2)}`);
  }

  return {
    requests: {
      cpu: formatCpu(cpuRequests),
      memory: formatMemory(memRequests),
    },
    limits: {
      cpu: formatCpu(cpuLimits),
      memory: formatMemory(memLimits),
    },
    requestsNormalized: {
      cpu: cpuRequests,
      memory: memRequests,
    },
    limitsNormalized: {
      cpu: cpuLimits,
      memory: memLimits,
    },
    reasoning,
    savings: {
      monthly: monthlySavings,
      yearly: yearlySavings,
    },
    risk: config.risk,
    warnings,
  };
}

// ============================================================================
// YAML Generation
// ============================================================================

export function generateYaml(recommendation: Recommendation): string {
  return `resources:
  requests:
    cpu: "${recommendation.requests.cpu}"
    memory: "${recommendation.requests.memory}"
  limits:
    cpu: "${recommendation.limits.cpu}"
    memory: "${recommendation.limits.memory}"`;
}
