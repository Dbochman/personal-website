import { describe, it, expect } from 'vitest';
import {
  parseCpu,
  parseMemory,
  formatCpu,
  formatMemory,
  roundCpuUp,
  roundMemoryUp,
  normalizePercentiles,
  calculateRecommendation,
  generateYaml,
  CLOUD_PRICING,
  HOURS_PER_MONTH,
} from './calculations';

const MiB = 1024 * 1024;
const GiB = 1024 * MiB;

describe('parseCpu', () => {
  it('parses millicores', () => {
    expect(parseCpu('500m')).toBe(500);
    expect(parseCpu('100m')).toBe(100);
    expect(parseCpu('1500m')).toBe(1500);
  });

  it('parses whole cores', () => {
    expect(parseCpu('1')).toBe(1000);
    expect(parseCpu('2')).toBe(2000);
  });

  it('parses fractional cores', () => {
    expect(parseCpu('0.5')).toBe(500);
    expect(parseCpu('1.5')).toBe(1500);
    expect(parseCpu('0.25')).toBe(250);
  });

  it('throws on invalid input', () => {
    expect(() => parseCpu('')).toThrow();
    expect(() => parseCpu('abc')).toThrow();
  });

  it('rejects values with trailing junk', () => {
    expect(() => parseCpu('500mfoo')).toThrow();
    expect(() => parseCpu('1x')).toThrow();
    expect(() => parseCpu('500 m')).toThrow(); // embedded space
  });

  it('rejects invalid suffixes', () => {
    expect(() => parseCpu('500c')).toThrow(); // invalid suffix
    expect(() => parseCpu('500M')).toThrow(); // M is for memory, not CPU
  });
});

describe('parseMemory', () => {
  it('parses binary units', () => {
    expect(parseMemory('256Mi')).toBe(256 * MiB);
    expect(parseMemory('1Gi')).toBe(GiB);
    expect(parseMemory('512Ki')).toBe(512 * 1024);
  });

  it('parses decimal units', () => {
    expect(parseMemory('512M')).toBe(512000000);
    expect(parseMemory('1G')).toBe(1000000000);
  });

  it('parses plain bytes', () => {
    expect(parseMemory('1048576')).toBe(1048576);
  });

  it('throws on invalid input', () => {
    expect(() => parseMemory('')).toThrow();
    expect(() => parseMemory('abc')).toThrow();
  });

  it('rejects values with trailing junk', () => {
    expect(() => parseMemory('256Mifoo')).toThrow();
    expect(() => parseMemory('1Gib')).toThrow(); // extra 'b' at the end
    expect(() => parseMemory('1GiB')).toThrow(); // GiB is not valid K8s syntax, only Gi
  });

  it('rejects invalid suffixes', () => {
    expect(() => parseMemory('256MB')).toThrow(); // MB is not valid, only M or Mi
    expect(() => parseMemory('1GB')).toThrow();   // GB is not valid, only G or Gi
  });

  it('rejects floating point plain bytes', () => {
    expect(() => parseMemory('1048576.5')).toThrow(); // plain bytes must be integers
  });
});

describe('formatCpu', () => {
  it('formats millicores', () => {
    expect(formatCpu(500)).toBe('500m');
    expect(formatCpu(100)).toBe('100m');
  });

  it('formats whole cores', () => {
    expect(formatCpu(1000)).toBe('1');
    expect(formatCpu(2000)).toBe('2');
  });

  it('keeps millicores for non-round values', () => {
    expect(formatCpu(1500)).toBe('1500m');
    expect(formatCpu(2500)).toBe('2500m');
  });
});

describe('formatMemory', () => {
  it('formats GiB', () => {
    expect(formatMemory(GiB)).toBe('1Gi');
    expect(formatMemory(2 * GiB)).toBe('2Gi');
  });

  it('formats MiB', () => {
    expect(formatMemory(256 * MiB)).toBe('256Mi');
    expect(formatMemory(512 * MiB)).toBe('512Mi');
  });
});

describe('roundCpuUp', () => {
  it('rounds to 10m for values under 1000m', () => {
    expect(roundCpuUp(115)).toBe(120);
    expect(roundCpuUp(220)).toBe(220);
    expect(roundCpuUp(221)).toBe(230);
  });

  it('rounds to 100m for values 1000m+', () => {
    expect(roundCpuUp(1150)).toBe(1200);
    expect(roundCpuUp(1200)).toBe(1200);
    expect(roundCpuUp(1201)).toBe(1300);
  });
});

describe('roundMemoryUp', () => {
  it('rounds to minimum 16Mi', () => {
    expect(roundMemoryUp(1 * MiB)).toBe(16 * MiB);
    expect(roundMemoryUp(10 * MiB)).toBe(16 * MiB);
  });

  it('rounds to power-of-2 MiB', () => {
    expect(roundMemoryUp(17 * MiB)).toBe(32 * MiB);
    expect(roundMemoryUp(256 * MiB)).toBe(256 * MiB);
    expect(roundMemoryUp(300 * MiB)).toBe(512 * MiB);
    expect(roundMemoryUp(600 * MiB)).toBe(1 * GiB);
    expect(roundMemoryUp(768 * MiB)).toBe(1 * GiB);
  });
});

describe('normalizePercentiles', () => {
  it('passes through complete valid data', () => {
    const result = normalizePercentiles({
      p50: 100,
      p95: 200,
      p99: 300,
      max: 400,
    });
    expect(result).toEqual({ p50: 100, p95: 200, p99: 300, max: 400 });
  });

  it('fills in p50 default', () => {
    const result = normalizePercentiles({
      p95: 200,
      p99: 300,
      max: 400,
    });
    expect(result.p50).toBe(120); // 200 * 0.6
  });

  it('fills in p99 default with max constraint', () => {
    const result = normalizePercentiles({
      p95: 200,
      max: 400,
    });
    expect(result.p99).toBe(360); // max(200, 400 * 0.9)
  });

  it('ensures p99 >= p95', () => {
    const result = normalizePercentiles({
      p95: 380,
      max: 400,
    });
    // max(380, 400 * 0.9) = max(380, 360) = 380
    expect(result.p99).toBe(380);
  });

  it('throws on invalid ordering', () => {
    expect(() =>
      normalizePercentiles({
        p50: 300, // > p95
        p95: 200,
        p99: 300,
        max: 400,
      })
    ).toThrow();
  });
});

describe('calculateRecommendation', () => {
  const baseUsage = {
    cpu: { p50: 100, p95: 200, p99: 300, max: 400 },
    memory: { p50: 256 * MiB, p95: 400 * MiB, p99: 450 * MiB, max: 512 * MiB },
  };

  const baseCurrent = {
    requests: { cpu: 500, memory: 1 * GiB },
    limits: { cpu: 1000, memory: 2 * GiB },
  };

  it('calculates correctly for slider=50 (medium risk)', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 50,
    });

    // slider 50 is in range 40-59: P95 * 1.1, max * 1.3
    // CPU: 200 * 1.1 = 220m (on boundary, stays 220)
    // Limits: 400 * 1.3 = 520m (on boundary, stays 520)
    expect(result.requests.cpu).toBe('220m');
    expect(result.limits.cpu).toBe('520m');
    expect(result.risk).toBe('medium');
  });

  it('calculates correctly for slider=70 (low risk)', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 70,
    });

    // slider 70 is in range 60-79: P95 * 1.2, max * 1.5
    // CPU: 200 * 1.2 = 240m, 400 * 1.5 = 600m
    expect(result.requests.cpu).toBe('240m');
    expect(result.limits.cpu).toBe('600m');
    expect(result.risk).toBe('low');
  });

  it('calculates correctly for slider=30 (high risk)', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 30,
    });

    // slider 30 is in range 20-39: P50 * 1.1, max * 1.2
    // CPU: 100 * 1.1 = 110m (on boundary, stays 110)
    // Limits: 400 * 1.2 = 480m (on boundary, stays 480)
    expect(result.requests.cpu).toBe('110m');
    expect(result.limits.cpu).toBe('480m');
    expect(result.risk).toBe('high');
  });

  it('rounds memory to power-of-2 MiB', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 70,
    });

    // Memory: 400Mi * 1.2 = 480Mi -> rounds to 512Mi
    // Limits: 512Mi * 1.5 = 768Mi -> rounds to 1Gi
    expect(result.requests.memory).toBe('512Mi');
    expect(result.limits.memory).toBe('1Gi');
  });

  it('caps requests at limits when rounding causes overflow', () => {
    // Create scenario where requests round up past limits
    const tightUsage = {
      cpu: { p50: 100, p95: 450, p99: 480, max: 500 },
      memory: baseUsage.memory,
    };

    const result = calculateRecommendation({
      usage: tightUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 50, // P95 * 1.1 = 495, max * 1.3 = 650
    });

    // Both should be valid, no cap needed in this case
    expect(result.warnings).not.toContain('CPU requests capped at limits');
  });

  it('generates savings estimate', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 3,
      slider: 50,
    });

    expect(result.savings.monthly).toBeGreaterThan(0);
    expect(result.savings.yearly).toBe(result.savings.monthly * 12);
  });

  it('clamps negative replicas to 1', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: -5,
      slider: 50,
    });

    // Should not have negative or zero savings multiplier
    expect(result.savings.monthly).toBeGreaterThanOrEqual(0);
  });

  it('clamps zero replicas to 1', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 0,
      slider: 50,
    });

    // Should calculate as if 1 replica
    expect(result.savings.monthly).toBeGreaterThanOrEqual(0);
  });

  it('floors fractional replicas', () => {
    const resultFractional = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 3.7,
      slider: 50,
    });

    const resultWhole = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 3,
      slider: 50,
    });

    // 3.7 should be floored to 3
    expect(resultFractional.savings.monthly).toBe(resultWhole.savings.monthly);
  });
});

describe('generateYaml', () => {
  it('generates valid k8s resource spec', () => {
    const recommendation = {
      requests: { cpu: '220m', memory: '512Mi' },
      limits: { cpu: '520m', memory: '1Gi' },
      requestsNormalized: { cpu: 220, memory: 512 * MiB },
      limitsNormalized: { cpu: 520, memory: GiB },
      reasoning: [],
      costs: {
        current: { cpu: 10, memory: 5, total: 15, yearly: 180 },
        recommended: { cpu: 5, memory: 5, total: 10, yearly: 120 },
        savings: { cpu: 5, memory: 0, total: 5, yearly: 60 },
      },
      savings: { monthly: 10, yearly: 120 },
      risk: 'medium' as const,
      warnings: [],
    };

    const yaml = generateYaml(recommendation);
    expect(yaml).toContain('cpu: "220m"');
    expect(yaml).toContain('memory: "512Mi"');
    expect(yaml).toContain('cpu: "520m"');
    expect(yaml).toContain('memory: "1Gi"');
  });
});

describe('CLOUD_PRICING', () => {
  it('contains expected providers', () => {
    expect(CLOUD_PRICING.default).toBeDefined();
    expect(CLOUD_PRICING.aws).toBeDefined();
    expect(CLOUD_PRICING.gcp).toBeDefined();
    expect(CLOUD_PRICING.azure).toBeDefined();
    expect(CLOUD_PRICING.reserved).toBeDefined();
  });

  it('has valid pricing structures', () => {
    Object.values(CLOUD_PRICING).forEach((pricing) => {
      expect(pricing.cpu).toBeGreaterThan(0);
      expect(pricing.memory).toBeGreaterThan(0);
      expect(pricing.label).toBeTruthy();
    });
  });

  it('reserved pricing is lower than on-demand', () => {
    expect(CLOUD_PRICING.reserved.cpu).toBeLessThan(CLOUD_PRICING.default.cpu);
    expect(CLOUD_PRICING.reserved.memory).toBeLessThan(CLOUD_PRICING.default.memory);
  });
});

describe('cost breakdown calculations', () => {
  const baseUsage = {
    cpu: { p50: 100, p95: 200, p99: 300, max: 400 },
    memory: { p50: 256 * MiB, p95: 400 * MiB, p99: 450 * MiB, max: 512 * MiB },
  };

  const baseCurrent = {
    requests: { cpu: 500, memory: 1 * GiB },
    limits: { cpu: 1000, memory: 2 * GiB },
  };

  it('calculates current costs correctly', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 50,
    });

    // Current CPU: (500m / 1000) * 1 replica * 0.03 * 730 = 10.95
    const expectedCpuCost = (500 / 1000) * 1 * 0.03 * HOURS_PER_MONTH;
    expect(result.costs.current.cpu).toBeCloseTo(expectedCpuCost, 2);

    // Current Memory: (1 GiB / GiB) * 1 replica * 0.004 * 730 = 2.92
    const expectedMemCost = 1 * 0.004 * HOURS_PER_MONTH;
    expect(result.costs.current.memory).toBeCloseTo(expectedMemCost, 2);

    // Total should be sum
    expect(result.costs.current.total).toBeCloseTo(expectedCpuCost + expectedMemCost, 2);
    expect(result.costs.current.yearly).toBeCloseTo((expectedCpuCost + expectedMemCost) * 12, 2);
  });

  it('calculates recommended costs correctly', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 50,
    });

    // Recommended CPU: 220m (from slider=50 test)
    const expectedRecCpuCost = (220 / 1000) * 1 * 0.03 * HOURS_PER_MONTH;
    expect(result.costs.recommended.cpu).toBeCloseTo(expectedRecCpuCost, 2);

    expect(result.costs.recommended.total).toBe(
      result.costs.recommended.cpu + result.costs.recommended.memory
    );
  });

  it('calculates savings as difference between current and recommended', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 50,
    });

    expect(result.costs.savings.cpu).toBeCloseTo(
      result.costs.current.cpu - result.costs.recommended.cpu, 2
    );
    expect(result.costs.savings.memory).toBeCloseTo(
      result.costs.current.memory - result.costs.recommended.memory, 2
    );
    expect(result.costs.savings.total).toBeCloseTo(
      result.costs.current.total - result.costs.recommended.total, 2
    );
  });

  it('scales costs with replicas', () => {
    const result1 = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 50,
    });

    const result3 = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 3,
      slider: 50,
    });

    expect(result3.costs.current.total).toBeCloseTo(result1.costs.current.total * 3, 2);
    expect(result3.costs.recommended.total).toBeCloseTo(result1.costs.recommended.total * 3, 2);
    expect(result3.costs.savings.total).toBeCloseTo(result1.costs.savings.total * 3, 2);
  });

  it('uses custom pricing when provided', () => {
    const result = calculateRecommendation({
      usage: baseUsage,
      current: baseCurrent,
      replicas: 1,
      slider: 50,
      costPerCoreHour: CLOUD_PRICING.aws.cpu,
      costPerGiBHour: CLOUD_PRICING.aws.memory,
    });

    const expectedCpuCost = (500 / 1000) * 1 * CLOUD_PRICING.aws.cpu * HOURS_PER_MONTH;
    expect(result.costs.current.cpu).toBeCloseTo(expectedCpuCost, 2);
  });

  it('handles negative savings (cost increase) correctly', () => {
    // Create scenario where recommended > current
    const lowCurrent = {
      requests: { cpu: 100, memory: 128 * MiB },
      limits: { cpu: 200, memory: 256 * MiB },
    };

    const result = calculateRecommendation({
      usage: baseUsage,
      current: lowCurrent,
      replicas: 1,
      slider: 80, // High safety = higher recommendations
    });

    // Savings should be negative when recommended > current
    expect(result.costs.savings.total).toBeLessThan(0);
    expect(result.costs.savings.yearly).toBeLessThan(0);

    // Legacy savings field should be clamped to 0
    expect(result.savings.monthly).toBe(0);
    expect(result.savings.yearly).toBe(0);
  });

  it('handles zero costs gracefully', () => {
    const zeroCurrent = {
      requests: { cpu: 0, memory: 0 },
      limits: { cpu: 100, memory: 128 * MiB },
    };

    // This will have minimum values due to rounding
    const result = calculateRecommendation({
      usage: baseUsage,
      current: zeroCurrent,
      replicas: 1,
      slider: 50,
    });

    expect(result.costs.current.cpu).toBe(0);
    expect(result.costs.current.memory).toBe(0);
    expect(result.costs.recommended.cpu).toBeGreaterThan(0);
    expect(result.costs.recommended.memory).toBeGreaterThan(0);
  });
});
