import { describe, it, expect } from 'vitest';
import {
  parseCpu,
  parseCpuSpec,
  parseMemory,
  parseReplicas,
  parsePrice,
  formatCpu,
  formatMemory,
  roundCpuUp,
  roundMemoryUp,
  normalizePercentiles,
  effectiveRequests,
  qosClass,
  validateSpec,
  memoryRequestPercentile,
  calculateRecommendation,
  generateYaml,
  DEFAULT_PRICING,
  HOURS_PER_MONTH,
  POSTURES,
  type PercentileInput,
  type Posture,
  type RecommendationInput,
} from './calculations';

const MiB = 1024 * 1024;
const GiB = 1024 * MiB;

describe('parseCpu', () => {
  it('parses millicores', () => {
    expect(parseCpu('500m')).toBe(500);
    expect(parseCpu('100m')).toBe(100);
    expect(parseCpu('1500m')).toBe(1500);
  });

  it('parses whole and fractional cores', () => {
    expect(parseCpu('1')).toBe(1000);
    expect(parseCpu('2')).toBe(2000);
    expect(parseCpu('0.5')).toBe(500);
    expect(parseCpu('0.25')).toBe(250);
  });

  it('accepts Kubernetes number forms and surrounding whitespace', () => {
    expect(parseCpu('.5')).toBe(500);
    expect(parseCpu('1.')).toBe(1000);
    expect(parseCpu(' 250m ')).toBe(250);
  });

  it('keeps sub-millicore usage precision', () => {
    expect(parseCpu('0.5m')).toBe(0.5);
    expect(parseCpu('0')).toBe(0);
  });

  it('rejects empty, malformed, and wrong-unit values', () => {
    for (const value of ['', '   ', 'abc', '500mfoo', '1x', '500 m', '500c', '500M', '1e3', '0x10', 'NaN', 'Infinity']) {
      expect(() => parseCpu(value), value).toThrow();
    }
  });

  it('rejects negative values', () => {
    expect(() => parseCpu('-1')).toThrow('negative');
    expect(() => parseCpu('-500m')).toThrow('negative');
  });

  it('rejects non-finite and out-of-range values', () => {
    expect(() => parseCpu('9'.repeat(400))).toThrow('larger than this tool supports');
    expect(() => parseCpu('1001')).toThrow('larger than this tool supports');
    expect(parseCpu('1000')).toBe(1_000_000);
  });
});

describe('parseCpuSpec', () => {
  it('accepts spec values at 1m precision as whole millicores', () => {
    expect(parseCpuSpec('500m')).toBe(500);
    expect(parseCpuSpec('0.001')).toBe(1);
    expect(parseCpuSpec('1.5')).toBe(1500);
    expect(parseCpuSpec('500.0m')).toBe(500);
    expect(parseCpuSpec('0.5000')).toBe(500);
  });

  it('does not reject valid decimals because of floating point noise', () => {
    // 0.29 * 1000 is 290.00000000000006 in floating point
    for (const [value, expected] of [['0.29', 290], ['0.57', 570], ['1.005', 1005], ['2.001', 2001]] as const) {
      expect(parseCpuSpec(value), value).toBe(expected);
    }
  });

  it('rejects precision finer than 1m', () => {
    for (const value of ['0.5m', '1.25m', '0.0005', '2.0005']) {
      expect(() => parseCpuSpec(value), value).toThrow('finer than 1m');
    }
  });

  it('still applies the general CPU rules', () => {
    expect(() => parseCpuSpec('')).toThrow();
    expect(() => parseCpuSpec('-1')).toThrow('negative');
    expect(() => parseCpuSpec('500M')).toThrow();
  });
});

describe('parseMemory', () => {
  it('parses binary units', () => {
    expect(parseMemory('256Mi')).toBe(256 * MiB);
    expect(parseMemory('1Gi')).toBe(GiB);
    expect(parseMemory('512Ki')).toBe(512 * 1024);
    expect(parseMemory('1.5Gi')).toBe(1536 * MiB);
    expect(parseMemory('1Ti')).toBe(1024 * GiB);
  });

  it('parses decimal units with Kubernetes casing', () => {
    expect(parseMemory('512M')).toBe(512_000_000);
    expect(parseMemory('1G')).toBe(1_000_000_000);
    expect(parseMemory('128k')).toBe(128_000);
  });

  it('parses plain bytes', () => {
    expect(parseMemory('1048576')).toBe(1048576);
  });

  it('explains the lowercase m (millibytes) mistake', () => {
    expect(() => parseMemory('400m')).toThrow('Did you mean 400Mi?');
  });

  it('explains uppercase K and byte-style suffixes', () => {
    expect(() => parseMemory('512K')).toThrow('lowercase k');
    expect(() => parseMemory('256MB')).toThrow('not MB');
    expect(() => parseMemory('1GB')).toThrow('not GB');
    expect(() => parseMemory('1GiB')).toThrow();
    expect(() => parseMemory('1Gib')).toThrow();
  });

  it('rejects malformed and fractional plain-byte values', () => {
    for (const value of ['', 'abc', '256Mifoo', '1e9', '1048576.5', '1.']) {
      expect(() => parseMemory(value), value).toThrow();
    }
  });

  it('rejects negative, non-finite, and out-of-range values', () => {
    expect(() => parseMemory('-1Gi')).toThrow('negative');
    expect(() => parseMemory('9'.repeat(400))).toThrow('larger than this tool supports');
    expect(() => parseMemory('65Ti')).toThrow('larger than this tool supports');
    expect(parseMemory('64Ti')).toBe(64 * 1024 * GiB);
  });
});

describe('parseReplicas', () => {
  it('accepts whole numbers in range', () => {
    expect(parseReplicas('3')).toBe(3);
    expect(parseReplicas(' 1 ')).toBe(1);
    expect(parseReplicas('10000')).toBe(10000);
  });

  it('rejects zero, negatives, fractions, text, and huge counts', () => {
    for (const value of ['', '0', '-1', '3.5', 'abc', '1e3', '10001']) {
      expect(() => parseReplicas(value), value).toThrow();
    }
  });
});

describe('parsePrice', () => {
  it('accepts non-negative decimals with an optional dollar sign', () => {
    expect(parsePrice('0.03')).toBe(0.03);
    expect(parsePrice('$0.004')).toBe(0.004);
    expect(parsePrice('0')).toBe(0);
    expect(parsePrice('.5')).toBe(0.5);
  });

  it('rejects invalid and extreme prices', () => {
    for (const value of ['', '-1', 'abc', '1e2', '1001']) {
      expect(() => parsePrice(value), value).toThrow();
    }
  });
});

describe('formatCpu', () => {
  it('formats millicores and exact cores', () => {
    expect(formatCpu(500)).toBe('500m');
    expect(formatCpu(1000)).toBe('1');
    expect(formatCpu(2000)).toBe('2');
  });

  it('keeps millicores for non-round values', () => {
    expect(formatCpu(1500)).toBe('1500m');
    expect(formatCpu(2500)).toBe('2500m');
  });
});

describe('formatMemory', () => {
  it('uses the largest exact binary unit', () => {
    expect(formatMemory(GiB)).toBe('1Gi');
    expect(formatMemory(2 * GiB)).toBe('2Gi');
    expect(formatMemory(256 * MiB)).toBe('256Mi');
    expect(formatMemory(1152 * MiB)).toBe('1152Mi');
    expect(formatMemory(1536)).toBe('1536');
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

  it('ignores floating point noise on exact boundaries', () => {
    expect(roundCpuUp(200 * 1.1)).toBe(220);
  });
});

describe('roundMemoryUp', () => {
  it('rounds to minimum 16Mi', () => {
    expect(roundMemoryUp(0)).toBe(16 * MiB);
    expect(roundMemoryUp(1 * MiB)).toBe(16 * MiB);
    expect(roundMemoryUp(16 * MiB)).toBe(16 * MiB);
  });

  it('keeps exact readable values', () => {
    expect(roundMemoryUp(256 * MiB)).toBe(256 * MiB);
    expect(roundMemoryUp(480 * MiB)).toBe(480 * MiB);
    expect(roundMemoryUp(GiB)).toBe(GiB);
  });

  it('rounds up without jumping to the next power of two', () => {
    expect(roundMemoryUp(17 * MiB)).toBe(18 * MiB);
    expect(roundMemoryUp(100 * MiB + 1)).toBe(104 * MiB);
    expect(roundMemoryUp(300 * MiB)).toBe(320 * MiB);
    expect(roundMemoryUp(520 * MiB)).toBe(576 * MiB);
    expect(roundMemoryUp(GiB + 1)).toBe(1152 * MiB);
    expect(roundMemoryUp(17 * GiB)).toBe(18 * GiB);
  });

  it('never rounds down, adds at most 12.5% above the floor, and yields whole MiB', () => {
    for (let bytes = 16 * MiB + 1; bytes < 70 * GiB; bytes = Math.floor(bytes * 1.37) + 12345) {
      const rounded = roundMemoryUp(bytes);
      expect(rounded).toBeGreaterThanOrEqual(bytes);
      expect(rounded).toBeLessThanOrEqual(bytes * 1.125 + 1);
      expect(rounded % MiB).toBe(0);
    }
  });
});

describe('normalizePercentiles', () => {
  it('passes through complete valid data', () => {
    expect(normalizePercentiles({ p50: 100, p95: 200, p99: 300, max: 400 }))
      .toEqual({ p50: 100, p95: 200, p99: 300, max: 400, substituted: [] });
  });

  it('replaces a missing P50 with the measured P95 instead of estimating', () => {
    const result = normalizePercentiles({ p95: 200, p99: 300, max: 400 });
    expect(result.p50).toBe(200);
    expect(result.substituted).toEqual(['p50']);
  });

  it('replaces a missing P99 with the measured Max instead of estimating', () => {
    const result = normalizePercentiles({ p95: 200, max: 400 });
    expect(result.p99).toBe(400);
    expect(result.substituted).toEqual(['p50', 'p99']);
  });

  it('allows equal values', () => {
    expect(() => normalizePercentiles({ p50: 5, p95: 5, p99: 5, max: 5 })).not.toThrow();
    expect(() => normalizePercentiles({ p95: 0, max: 0 })).not.toThrow();
  });

  it('rejects non-finite and negative numbers from direct callers', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(() => normalizePercentiles({ p95: bad, max: 400 }), String(bad)).toThrow('P95 must be a finite, non-negative number');
      expect(() => normalizePercentiles({ p95: 100, max: bad }), String(bad)).toThrow('Max must be');
      expect(() => normalizePercentiles({ p50: bad, p95: 100, max: 400 }), String(bad)).toThrow('P50 must be');
      expect(() => normalizePercentiles({ p95: 100, p99: bad, max: 400 }), String(bad)).toThrow('P99 must be');
    }
  });

  it('requires P95 and Max from untyped callers', () => {
    expect(() => normalizePercentiles({ max: 400 } as unknown as PercentileInput)).toThrow('P95 and Max are required');
  });

  it('names the out-of-order pair', () => {
    expect(() => normalizePercentiles({ p50: 300, p95: 200, p99: 300, max: 400 })).toThrow('P50 is greater than P95');
    expect(() => normalizePercentiles({ p95: 500, max: 400 })).toThrow('P95 is greater than Max');
    expect(() => normalizePercentiles({ p95: 200, p99: 500, max: 400 })).toThrow('P99 is greater than Max');
  });
});

describe('Kubernetes semantics helpers', () => {
  it('defaults a missing request to the limit', () => {
    expect(effectiveRequests({ requests: {}, limits: { cpu: 1000, memory: GiB } })).toEqual({ cpu: 1000, memory: GiB });
    expect(effectiveRequests({ requests: { cpu: 200 }, limits: {} })).toEqual({ cpu: 200, memory: 0 });
  });

  it('classifies QoS like the Pod QoS docs', () => {
    expect(qosClass({ requests: { cpu: 500, memory: GiB }, limits: { cpu: 500, memory: GiB } })).toBe('Guaranteed');
    expect(qosClass({ requests: {}, limits: { cpu: 500, memory: GiB } })).toBe('Guaranteed');
    expect(qosClass({ requests: { cpu: 250, memory: GiB }, limits: { cpu: 500, memory: GiB } })).toBe('Burstable');
    expect(qosClass({ requests: { cpu: 500, memory: GiB }, limits: { memory: GiB } })).toBe('Burstable');
    expect(qosClass({ requests: {}, limits: {} })).toBe('BestEffort');
  });

  it('rejects requests above limits like the API server', () => {
    expect(validateSpec({ requests: { cpu: 600 }, limits: { cpu: 500 } }).cpu).toMatch(/cannot exceed/);
    expect(validateSpec({ requests: { memory: 2 * GiB }, limits: { memory: GiB } }).memory).toMatch(/cannot exceed/);
    expect(validateSpec({ requests: { cpu: 500 }, limits: {} })).toEqual({});
  });

  it('never bases memory requests below P95', () => {
    expect(POSTURES.map(memoryRequestPercentile)).toEqual(['p95', 'p95', 'p95', 'p95', 'p99']);
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
  const recommend = (overrides: Partial<RecommendationInput> = {}) =>
    calculateRecommendation({ usage: baseUsage, current: baseCurrent, replicas: 1, posture: 'balanced', ...overrides });
  const findingText = (result: ReturnType<typeof recommend>) => result.findings.map((f) => f.text).join('\n');

  it.each([
    // posture, cpu request, cpu limit, memory request, memory limit
    ['aggressive', '100m', '440m', '416Mi', '576Mi'],
    ['efficient', '110m', '480m', '448Mi', '640Mi'],
    ['balanced', '220m', '520m', '448Mi', '704Mi'],
    ['conservative', '240m', '600m', '480Mi', '768Mi'],
    ['safe', '390m', '800m', '640Mi', '1Gi'],
  ] as const)('%s posture produces documented values', (posture, cpuReq, cpuLim, memReq, memLim) => {
    const result = recommend({ posture });
    expect(result.requests).toEqual({ cpu: cpuReq, memory: memReq });
    expect(result.limits).toEqual({ cpu: cpuLim, memory: memLim });
  });

  it('keeps requests ≤ limits for every posture', () => {
    for (const posture of POSTURES) {
      const result = recommend({ posture });
      expect(result.requestsNormalized.cpu).toBeLessThanOrEqual(result.limitsNormalized.cpu!);
      expect(result.requestsNormalized.memory).toBeLessThanOrEqual(result.limitsNormalized.memory);
    }
  });

  it('explains the formula behind each value', () => {
    expect(recommend().basis).toEqual({
      cpuRequest: 'P95 × 1.1',
      cpuLimit: 'Max × 1.3',
      memoryRequest: 'P95 × 1.1',
      memoryLimit: 'Max × 1.3',
    });
    expect(recommend({ posture: 'aggressive' }).basis.cpuRequest).toBe('P50 × 1.0');
  });

  it('applies floors for idle containers and flags zero usage', () => {
    const result = recommend({
      usage: { cpu: { p95: 0, max: 0 }, memory: { p95: 0, max: 0 } },
    });
    expect(result.requests).toEqual({ cpu: '10m', memory: '16Mi' });
    expect(result.limits).toEqual({ cpu: '10m', memory: '16Mi' });
    expect(findingText(result)).toMatch(/CPU max is 0/);
    expect(findingText(result)).toMatch(/memory max is 0/);
  });

  it('uses a higher measured value, and says so, when the base percentile is missing', () => {
    const result = recommend({
      posture: 'aggressive',
      usage: { cpu: { p95: 200, max: 400 }, memory: baseUsage.memory },
    });
    expect(result.requests.cpu).toBe('200m');
    expect(result.basis.cpuRequest).toBe('P95 (no P50 given) × 1.0');
    expect(findingText(result)).toMatch(/CPU request uses P95 because no P50 was given/);

    const safe = recommend({ posture: 'safe', usage: { cpu: { p95: 200, max: 400 }, memory: { p95: 400 * MiB, max: 512 * MiB } } });
    expect(safe.requests.cpu).toBe('520m');
    expect(safe.basis.memoryRequest).toBe('Max (no P99 given) × 1.3');
  });

  it('does not mention substitutions that did not affect the result', () => {
    const result = recommend({ usage: { cpu: { p95: 200, max: 400 }, memory: { p95: 400 * MiB, max: 512 * MiB } } });
    expect(findingText(result)).not.toMatch(/because no/);
  });

  it('omits the CPU limit on request', () => {
    const result = recommend({ includeCpuLimit: false });
    expect(result.limits.cpu).toBeUndefined();
    expect(result.basis.cpuLimit).toBeUndefined();
    expect(result.qosClass).toBe('Burstable');
    expect(findingText(result)).toMatch(/LimitRange/);
  });

  it('rejects invalid replica counts instead of silently clamping', () => {
    for (const replicas of [0, -5, 3.7, Number.NaN, Number.POSITIVE_INFINITY, 10_001]) {
      expect(() => recommend({ replicas }), String(replicas)).toThrow('Replicas');
    }
  });

  describe('numeric guards for direct callers', () => {
    const bad = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1];

    it('rejects non-finite or negative usage', () => {
      for (const value of bad) {
        expect(() => recommend({ usage: { cpu: { p95: value, max: 400 }, memory: baseUsage.memory } }), String(value)).toThrow('CPU P95');
        expect(() => recommend({ usage: { cpu: baseUsage.cpu, memory: { p95: 1, max: value } } }), String(value)).toThrow('Memory Max');
      }
    });

    it('rejects usage beyond the supported range', () => {
      expect(() => recommend({ usage: { cpu: { p95: 1, max: 1_000_001 }, memory: baseUsage.memory } })).toThrow('larger than this tool supports');
      expect(() => recommend({ usage: { cpu: baseUsage.cpu, memory: { p95: 1, max: 65 * 1024 * GiB } } })).toThrow('larger than this tool supports');
    });

    it('rejects non-finite, negative, or inconsistent current values', () => {
      for (const value of bad) {
        expect(() => recommend({ current: { requests: { cpu: value }, limits: {} } }), String(value)).toThrow('Current cpu request');
        expect(() => recommend({ current: { requests: {}, limits: { memory: value } } }), String(value)).toThrow('Current memory limit');
      }
      expect(() => recommend({ current: { requests: { cpu: 600 }, limits: { cpu: 500 } } })).toThrow('cannot exceed');
    });

    it('rejects non-finite, negative, or extreme prices', () => {
      for (const value of [...bad, 1001]) {
        expect(() => recommend({ pricing: { cpuPerCoreHour: value, memoryPerGiBHour: 0.004 } }), String(value)).toThrow('CPU price');
        expect(() => recommend({ pricing: { cpuPerCoreHour: 0.03, memoryPerGiBHour: value } }), String(value)).toThrow('Memory price');
      }
    });

    it('rejects unknown postures', () => {
      expect(() => recommend({ posture: 'yolo' as Posture })).toThrow('Unknown sizing posture');
    });

    it('returns only finite numbers for valid input', () => {
      const result = recommend({ replicas: 3 });
      const numbers = [
        ...Object.values(result.requestsNormalized),
        ...Object.values(result.limitsNormalized),
        ...Object.values(result.costs).flatMap((breakdown) => Object.values(breakdown)),
      ];
      expect(numbers.every((n) => Number.isFinite(n))).toBe(true);
    });
  });

  it('rejects out-of-order percentiles', () => {
    expect(() => recommend({ usage: { cpu: { p95: 500, max: 400 }, memory: baseUsage.memory } })).toThrow();
  });

  describe('findings', () => {
    it('warns that usage near the CPU limit hides throttled demand', () => {
      const result = recommend({ current: { requests: { cpu: 200, memory: GiB }, limits: { cpu: 420, memory: 2 * GiB } } });
      expect(findingText(result)).toMatch(/likely throttled/);
      expect(findingText(recommend())).not.toMatch(/likely throttled/);
    });

    it('warns when memory usage is near or above the current limit', () => {
      const near = recommend({ current: { requests: { cpu: 500, memory: 256 * MiB }, limits: { cpu: 1000, memory: 540 * MiB } } });
      expect(findingText(near)).toMatch(/OOMKilled/);
      const above = recommend({ current: { requests: { cpu: 500, memory: 256 * MiB }, limits: { cpu: 1000, memory: 256 * MiB } } });
      expect(findingText(above)).toMatch(/above the current memory limit/);
    });

    it('warns when the current memory request is below P95 (eviction exposure)', () => {
      const result = recommend({ current: { requests: { cpu: 500, memory: 128 * MiB }, limits: { cpu: 1000, memory: 2 * GiB } } });
      expect(findingText(result)).toMatch(/evicts pods using more than their requests first/);
      expect(findingText(result)).not.toMatch(/only pods/);
    });

    it('notes spiky workloads where Max dwarfs P99', () => {
      const result = recommend({ usage: { cpu: { p50: 100, p95: 200, p99: 300, max: 1000 }, memory: baseUsage.memory } });
      expect(findingText(result)).toMatch(/short spikes/);
      expect(findingText(recommend())).not.toMatch(/short spikes/);
    });

    it('suggests stepping down for large reductions', () => {
      expect(findingText(recommend())).toMatch(/Large reduction \(CPU request -56%, memory request -56%\)/);
    });

    it('explains how the request change shifts HPA utilization', () => {
      expect(findingText(recommend())).toMatch(/from 500m to 220m makes the same usage read 2\.3× higher/);
      const up = recommend({ current: { requests: { cpu: 100, memory: GiB }, limits: { cpu: 1000, memory: 2 * GiB } } });
      expect(findingText(up)).toMatch(/2\.2× lower/);
    });

    it('warns when a Guaranteed pod would become Burstable', () => {
      const result = recommend({ current: { requests: { cpu: 500, memory: GiB }, limits: { cpu: 500, memory: GiB } } });
      expect(result.currentQosClass).toBe('Guaranteed');
      expect(result.qosClass).toBe('Burstable');
      expect(findingText(result)).toMatch(/Guaranteed to Burstable/);
      expect(findingText(result)).toMatch(/single-container pod/);
      expect(findingText(result)).toMatch(/sidecars/);
    });
  });

  describe('illustrative cost', () => {
    it('prices current and recommended requests per month', () => {
      const result = recommend();
      expect(result.costs.current.cpu).toBeCloseTo(0.5 * DEFAULT_PRICING.cpuPerCoreHour * HOURS_PER_MONTH, 6);
      expect(result.costs.current.memory).toBeCloseTo(1 * DEFAULT_PRICING.memoryPerGiBHour * HOURS_PER_MONTH, 6);
      expect(result.costs.recommended.cpu).toBeCloseTo(0.22 * DEFAULT_PRICING.cpuPerCoreHour * HOURS_PER_MONTH, 6);
      expect(result.costs.recommended.memory).toBeCloseTo((448 / 1024) * DEFAULT_PRICING.memoryPerGiBHour * HOURS_PER_MONTH, 6);
      expect(result.costs.savings.total).toBeCloseTo(result.costs.current.total - result.costs.recommended.total, 6);
      expect(result.costs.savings.yearly).toBeCloseTo(result.costs.savings.total * 12, 6);
    });

    it('scales linearly with replicas and uses custom prices', () => {
      const one = recommend();
      const three = recommend({ replicas: 3 });
      expect(three.costs.current.total).toBeCloseTo(one.costs.current.total * 3, 6);
      expect(three.costs.savings.total).toBeCloseTo(one.costs.savings.total * 3, 6);
      const custom = recommend({ pricing: { cpuPerCoreHour: 1, memoryPerGiBHour: 0 } });
      expect(custom.costs.current.cpu).toBeCloseTo(0.5 * HOURS_PER_MONTH, 6);
      expect(custom.costs.current.memory).toBe(0);
    });

    it('reports negative savings when the recommendation reserves more', () => {
      const result = recommend({
        posture: 'safe',
        current: { requests: { cpu: 100, memory: 128 * MiB }, limits: { cpu: 200, memory: 1 * GiB } },
      });
      expect(result.costs.savings.total).toBeLessThan(0);
    });

    it('prices a limit-only spec at its limit, and BestEffort at zero', () => {
      const limitOnly = recommend({ current: { requests: {}, limits: { cpu: 1000, memory: GiB } } });
      expect(limitOnly.currentEffectiveRequests).toEqual({ cpu: 1000, memory: GiB });
      expect(limitOnly.costs.current.cpu).toBeCloseTo(DEFAULT_PRICING.cpuPerCoreHour * HOURS_PER_MONTH, 6);

      const bestEffort = recommend({ current: { requests: {}, limits: {} } });
      expect(bestEffort.currentQosClass).toBe('BestEffort');
      expect(bestEffort.costs.current.total).toBe(0);
      expect(bestEffort.costs.recommended.total).toBeGreaterThan(0);
    });

    it('stays finite at the supported extremes', () => {
      const result = recommend({
        replicas: 10_000,
        usage: {
          cpu: { p95: 1_000_000, max: 1_000_000 },
          memory: { p95: 64 * 1024 * GiB, max: 64 * 1024 * GiB },
        },
        pricing: { cpuPerCoreHour: 1000, memoryPerGiBHour: 1000 },
      });
      expect(Number.isFinite(result.costs.recommended.total)).toBe(true);
      expect(result.limits.memory).toMatch(/Gi$/);
    });
  });
});

describe('generateYaml', () => {
  it('emits a quoted resources block', () => {
    const yaml = generateYaml({
      requests: { cpu: '220m', memory: '448Mi' },
      limits: { cpu: '520m', memory: '704Mi' },
    });
    expect(yaml).toBe([
      'resources:',
      '  requests:',
      '    cpu: "220m"',
      '    memory: "448Mi"',
      '  limits:',
      '    cpu: "520m"',
      '    memory: "704Mi"',
    ].join('\n'));
  });

  it('leaves out the CPU limit when omitted', () => {
    const yaml = generateYaml({ requests: { cpu: '1', memory: '1Gi' }, limits: { memory: '2Gi' } });
    expect(yaml).toBe('resources:\n  requests:\n    cpu: "1"\n    memory: "1Gi"\n  limits:\n    memory: "2Gi"');
  });
});
