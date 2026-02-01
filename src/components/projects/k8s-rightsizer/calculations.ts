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

export interface CostBreakdown {
  cpu: number;      // monthly CPU cost
  memory: number;   // monthly memory cost
  total: number;    // monthly total
  yearly: number;   // annual total
}

export interface Recommendation {
  requests: ResourceValues;
  limits: ResourceValues;
  requestsNormalized: NormalizedResources;
  limitsNormalized: NormalizedResources;
  reasoning: string[];
  costs: {
    current: CostBreakdown;
    recommended: CostBreakdown;
    savings: CostBreakdown;  // can be negative for increased allocation
  };
  /** @deprecated Use costs.savings instead */
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
export const HOURS_PER_MONTH = 730;

// Cloud provider pricing presets (approximate on-demand pricing)
export const CLOUD_PRICING = {
  default: { cpu: 0.03, memory: 0.004, label: 'Default (On-demand)' },
  aws: { cpu: 0.034, memory: 0.0046, label: 'AWS (US East)' },
  gcp: { cpu: 0.031, memory: 0.0041, label: 'GCP (US Central)' },
  azure: { cpu: 0.032, memory: 0.0044, label: 'Azure (East US)' },
  reserved: { cpu: 0.019, memory: 0.0025, label: 'Reserved/Committed' },
} as const;

export type CloudProvider = keyof typeof CLOUD_PRICING;

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
 * Rejects invalid formats like "500mfoo" or "1.5x"
 */
export function parseCpu(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Empty CPU value');

  // Match millicores: "500m", "100m"
  const milliMatch = trimmed.match(/^(\d+(?:\.\d+)?)m$/);
  if (milliMatch) {
    const num = parseFloat(milliMatch[1]);
    if (isNaN(num) || num < 0) throw new Error(`Invalid CPU value: ${value}`);
    return Math.round(num);
  }

  // Match cores: "1", "0.5", "2.5"
  const coreMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (coreMatch) {
    const num = parseFloat(coreMatch[1]);
    if (isNaN(num) || num < 0) throw new Error(`Invalid CPU value: ${value}`);
    return Math.round(num * 1000);
  }

  throw new Error(`Invalid CPU value: ${value}`);
}

/**
 * Parse memory string to bytes
 * Examples: "256Mi" -> 268435456, "1Gi" -> 1073741824, "512M" -> 512000000
 * Rejects invalid formats like "1GiB" (invalid suffix) or "256Mifoo"
 */
export function parseMemory(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Empty memory value');

  // Binary units (Ki, Mi, Gi, Ti) - must match exactly, case-sensitive for K8s compatibility
  const binaryMatch = trimmed.match(/^(\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti)$/);
  if (binaryMatch) {
    const num = parseFloat(binaryMatch[1]);
    if (isNaN(num) || num < 0) throw new Error(`Invalid memory value: ${value}`);
    const unit = binaryMatch[2].toLowerCase();
    const multipliers: Record<string, number> = {
      'ki': 1024,
      'mi': MiB,
      'gi': GiB,
      'ti': 1024 * GiB,
    };
    return Math.round(num * multipliers[unit]);
  }

  // Decimal units (K, M, G, T) - single letter only
  const decimalMatch = trimmed.match(/^(\d+(?:\.\d+)?)(K|M|G|T)$/);
  if (decimalMatch) {
    const num = parseFloat(decimalMatch[1]);
    if (isNaN(num) || num < 0) throw new Error(`Invalid memory value: ${value}`);
    const unit = decimalMatch[2].toLowerCase();
    const multipliers: Record<string, number> = {
      'k': 1000,
      'm': 1000000,
      'g': 1000000000,
      't': 1000000000000,
    };
    return Math.round(num * multipliers[unit]);
  }

  // Plain bytes (integers only for safety)
  const bytesMatch = trimmed.match(/^(\d+)$/);
  if (bytesMatch) {
    const num = parseInt(bytesMatch[1], 10);
    if (isNaN(num) || num < 0) throw new Error(`Invalid memory value: ${value}`);
    return num;
  }

  throw new Error(`Invalid memory value: ${value}`);
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

  // Validate replicas (must be at least 1)
  const validatedReplicas = Math.max(1, Math.floor(replicas));

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

  // Calculate full cost breakdown
  // Current costs
  const currentCpuMonthly = (current.requests.cpu / 1000) * validatedReplicas * costPerCoreHour * HOURS_PER_MONTH;
  const currentMemMonthly = (current.requests.memory / GiB) * validatedReplicas * costPerGiBHour * HOURS_PER_MONTH;
  const currentTotal = currentCpuMonthly + currentMemMonthly;

  // Recommended costs
  const recCpuMonthly = (cpuRequests / 1000) * validatedReplicas * costPerCoreHour * HOURS_PER_MONTH;
  const recMemMonthly = (memRequests / GiB) * validatedReplicas * costPerGiBHour * HOURS_PER_MONTH;
  const recTotal = recCpuMonthly + recMemMonthly;

  // Savings (positive = cost reduction, negative = cost increase)
  const cpuSavings = currentCpuMonthly - recCpuMonthly;
  const memSavings = currentMemMonthly - recMemMonthly;
  const totalSavings = cpuSavings + memSavings;

  // Legacy savings field (clamped to 0 for backwards compat)
  const monthlySavings = Math.max(0, totalSavings);
  const yearlySavings = monthlySavings * 12;

  if (totalSavings < 0) {
    reasoning.push('Recommendation increases resource allocation (negative savings)');
  } else if (totalSavings > 0) {
    reasoning.push(`Estimated monthly savings: $${totalSavings.toFixed(2)}`);
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
    costs: {
      current: {
        cpu: currentCpuMonthly,
        memory: currentMemMonthly,
        total: currentTotal,
        yearly: currentTotal * 12,
      },
      recommended: {
        cpu: recCpuMonthly,
        memory: recMemMonthly,
        total: recTotal,
        yearly: recTotal * 12,
      },
      savings: {
        cpu: cpuSavings,
        memory: memSavings,
        total: totalSavings,
        yearly: totalSavings * 12,
      },
    },
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
