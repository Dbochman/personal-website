# K8s Resource Right-Sizer

## Goal
Recommend Kubernetes CPU/memory requests and limits based on observed utilization and risk preference.

## Non-Goals
- Connect to live clusters or metrics endpoints.
- Provide guaranteed safe values for every workload.

## Users & Use Cases
- Platform teams tuning resource requests/limits.
- Developers evaluating safe right-sizing steps.

## Functional Requirements
- Input current requests/limits and replicas (per-container values).
- Input utilization percentiles (P50/P95/P99/Max) for CPU and memory separately.
- Goal slider (efficiency ↔ safety) with 0-100 range.
- Recommendations with reasoning and risk indicators.
- Savings/impact calculation and YAML snippet output.
- Preset profiles (web server, worker, db).

## UX Requirements
- Side-by-side current vs recommended values.
- Warnings for risky configurations.
- Clear units with auto-conversion (m, Mi, Gi).
- Tabs or sections for CPU and Memory.

## Recommendation Algorithm

### Core Formula
```
requests = basePercentile × safetyMultiplier
limits   = max × headroomMultiplier
```

### Post-Calculation Constraints (applied in order)
1. **Minimum Values**: CPU ≥ 10m, Memory ≥ 16Mi (K8s practical minimums)
2. **Rounding**:
   - CPU: Round UP to nearest 10m for values < 1000m, nearest 100m for ≥ 1000m
   - Memory: Round UP to nearest power-of-2 MiB (16, 32, 64, 128, 256, 512, 1024...)
   - Always round UP to be conservative (avoid under-provisioning)
3. **Requests ≤ Limits**: If requests > limits after rounding, set requests = limits (final step)

### Slider Mapping (0 = max efficiency, 100 = max safety)
| Slider  | Base Percentile | Safety Multiplier | Headroom Multiplier | Risk Level |
|---------|-----------------|-------------------|---------------------|------------|
| 0-19    | P50             | 1.0               | 1.1                 | high       |
| 20-39   | P50             | 1.1               | 1.2                 | high       |
| 40-59   | P95             | 1.1               | 1.3                 | medium     |
| 60-79   | P95             | 1.2               | 1.5                 | low        |
| 80-100  | P99             | 1.3               | 2.0                 | low        |

Ranges are inclusive and contiguous (0-19, 20-39, 40-59, 60-79, 80-100).

### Risk Derivation
Risk is determined by the slider position (see table above), not recalculated from output values.

### Savings Calculation
```
cpuSavingsPerHour = (currentRequests.cpu - recommended.cpu) / 1000 × replicas × costPerCoreHour
memSavingsPerHour = (currentRequests.mem - recommended.mem) / (1024^3) × replicas × costPerGiBHour
monthlySavings = (cpuSavingsPerHour + memSavingsPerHour) × 730  // hours per month
yearlySavings = monthlySavings × 12
```
Default costs: $0.03/core/hour, $0.004/GiB/hour (approximating cloud pricing).
Negative savings (increase) displayed as "$0 (increase)".

## Data Model
```typescript
// Internal normalized representation (used in calculations)
interface NormalizedResources {
  cpu: number;     // millicores
  memory: number;  // bytes
}

// Display/YAML representation
interface ResourceValues {
  cpu: string;     // e.g., "500m", "2"
  memory: string;  // e.g., "256Mi", "1Gi"
}

interface PercentileData {
  p50: number;  // normalized (millicores for CPU, bytes for memory)
  p95: number;
  p99: number;
  max: number;
}

interface WorkloadInput {
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

interface Recommendation {
  requests: ResourceValues;
  limits: ResourceValues;
  requestsNormalized: NormalizedResources;  // for savings calc
  limitsNormalized: NormalizedResources;
  reasoning: string[];
  savings: {
    monthly: number;
    yearly: number;
  };
  risk: 'low' | 'medium' | 'high';
  warnings: string[];
}
```

## Preset Profiles
| Profile    | Default Slider | Notes |
|------------|----------------|-------|
| Web Server | 60 (medium)    | Typical request-response, some bursts |
| Worker     | 40 (efficient) | Batch processing, predictable usage |
| Database   | 80 (safe)      | Memory-sensitive, avoid OOMKill |

Presets set the slider position; users can still adjust.

## Percentile Validation
- All percentiles must satisfy: P50 ≤ P95 ≤ P99 ≤ Max
- If violated, show error: "Percentile values must be in order (P50 ≤ P95 ≤ P99 ≤ Max)"
- If only some percentiles provided:
  - Minimum required: P95 and Max
  - P50 defaults to P95 × 0.6 if missing
  - P99 defaults to max(P95, Max × 0.9) if missing (ensures P95 ≤ P99)

## Unit Parsing & Formatting

### Parsing (input → normalized)
```typescript
// CPU: convert to millicores
"500m" → 500
"0.5"  → 500
"2"    → 2000

// Memory: convert to bytes
"256Mi" → 268435456
"1Gi"   → 1073741824
"512M"  → 512000000  // decimal MB
```

### Formatting (normalized → display)
```typescript
// CPU: use millicores for < 1 core, cores for ≥ 1 core
500   → "500m"
1000  → "1"
2500  → "2500m" or "2.5" (prefer millicores for precision)

// Memory: use largest binary unit that results in whole number or one decimal
268435456   → "256Mi"
1073741824  → "1Gi"
536870912   → "512Mi"
```

## Async Implementation
- Debounced calculations (100-150ms) on input changes.
- Use a Web Worker for unit parsing and recommendation logic.
- Cancel stale calculations when inputs change.
- Updates via `startTransition` to avoid UI jank.

## Error Handling & Empty States
- Invalid unit input highlights field and blocks export.
- Missing utilization data shows guidance for required percentiles.
- Out-of-order percentiles show validation error.

## Performance Targets
- Recommendations computed under 50ms for typical inputs.

## Test Plan

### Unit Tests
- Unit parsing: "500m" → 500, "1Gi" → 1073741824, invalid → error
- Unit formatting: 500 → "500m", 268435456 → "256Mi"
- Slider mapping: slider=50 → P95 base, 1.1× safety, 1.3× headroom
- Constraint enforcement: requests capped at limits, minimums applied
- Savings calculation: known inputs → expected output

### Test Vectors (CPU)
| P50 | P95 | P99 | Max | Slider | Raw Requests | Raw Limits | Final Requests | Final Limits | Risk |
|-----|-----|-----|-----|--------|--------------|------------|----------------|--------------|------|
| 100m | 200m | 300m | 400m | 50 | 220m | 520m | 220m | 520m | medium |
| 100m | 200m | 300m | 400m | 70 | 240m | 600m | 240m | 600m | low |
| 100m | 200m | 300m | 400m | 30 | 110m | 480m | 110m | 480m | high |

Calculation for slider=50 (range 40-59, uses P95 × 1.1, Max × 1.3):
- Raw requests = 200 × 1.1 = 220m ✓
- Raw limits = 400 × 1.3 = 520m ✓

Calculation for slider=70 (range 60-79, uses P95 × 1.2, Max × 1.5):
- Raw requests = 200 × 1.2 = 240m ✓
- Raw limits = 400 × 1.5 = 600m ✓

Calculation for slider=30 (range 20-39, uses P50 × 1.1, Max × 1.2):
- Raw requests = 100 × 1.1 = 110m ✓
- Raw limits = 400 × 1.2 = 480m ✓

### Test Vectors (Memory)
| P50 | P95 | P99 | Max | Slider | Raw Requests | Raw Limits | Final Requests | Final Limits | Risk |
|-----|-----|-----|-----|--------|--------------|------------|----------------|--------------|------|
| 256Mi | 400Mi | 450Mi | 512Mi | 70 | 480Mi | 768Mi | 512Mi | 1Gi | low |

Calculation for slider=70 (range 60-79, uses P95 × 1.2, Max × 1.5):
- Raw requests = 400Mi × 1.2 = 480Mi → rounds UP to 512Mi (next power-of-2)
- Raw limits = 512Mi × 1.5 = 768Mi → rounds UP to 1Gi (1024Mi, next power-of-2)

### UI Tests
- Slider behavior updates recommendations
- YAML export produces valid k8s spec
- Preset selection changes slider position
- Constraint enforcement visible (requests never exceeds limits)

## YAML Output Format
```yaml
resources:
  requests:
    cpu: "220m"
    memory: "512Mi"
  limits:
    cpu: "520m"
    memory: "1Gi"
```

## Dependencies
- Existing UI components (Slider, Input, Card, Tabs).
- Prism or similar for YAML syntax highlighting.

## Revision (2026-10-17)

A review against current Kubernetes docs changed several rules above. The code and tests are now the source of truth.

- **Postures, not a 0-100 slider.** The five slider bands became five named stops with the same multipliers. Profile cards were folded into each stop's "typical fit" text.
- **Memory requests never use P50.** Memory can't be throttled, and the kubelet ranks pods using more than their requests first under node pressure (then by priority and overage). It's a heuristic, not eviction immunity.
- **No fabricated percentiles.** A missing P50 uses the measured P95 and a missing P99 uses Max, and the UI says so. (Previously P50 = P95 × 0.6.)
- **Memory rounding adds ≤12.5%.** Power-of-two rounding could nearly double a request (520Mi → 1Gi).
- **Kubernetes quantity rules.** Lowercase `k`; `m` on memory (millibytes) is rejected with a hint; bounds and non-finite input are rejected. Replicas must be a whole number; there is no silent clamping.
- **Current spec matches the API.** Empty fields are unset, a limit-only request defaults to the limit, and request > limit is an error. The QoS class is shown.
- **Optional CPU limit.** It is omitted from YAML when the user unchecks it.
- **Cost is illustrative.** Editable $/vCPU-hour and $/GiB-hour replace the unsourced provider presets. Copy says savings require node reduction.
- **Findings** flag censored usage (near current limits), eviction exposure, spikes, large cuts, HPA utilization shifts, and Guaranteed → Burstable changes.
- **URL state** replaces in-memory-only state. The debounce/Web Worker plan was dropped because the calculation takes microseconds.
