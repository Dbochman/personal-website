import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, PRESETS, matchPreset } from './presets';
import { clampToStep, parseConfig, writeConfig } from './url-state';
import type { SimConfig } from './simulation';

describe('url state', () => {
  it('parses an empty query as the default scenario', () => {
    expect(parseConfig(new URLSearchParams())).toEqual(DEFAULT_CONFIG);
  });

  it('writes nothing for the default scenario', () => {
    expect(writeConfig(new URLSearchParams(), DEFAULT_CONFIG).toString()).toBe('');
  });

  it('round-trips every preset', () => {
    for (const { config } of PRESETS) {
      expect(parseConfig(writeConfig(new URLSearchParams(), config))).toEqual(config);
    }
  });

  it('round-trips an arbitrary in-range configuration', () => {
    const config: SimConfig = {
      loadPct: 85,
      outageS: 7.5,
      degradedCapacityPct: 40,
      timeoutMs: 250,
      attemptsPerLayer: 2,
      layers: 2,
      backoff: 'none',
      baseDelayMs: 500,
      maxDelayMs: 10000,
      retryBudgetPct: 20,
      shedAbandoned: true,
    };
    const params = writeConfig(new URLSearchParams(), config);
    expect(params.get('shed')).toBe('1');
    expect(params.get('outage')).toBe('7.5');
    expect(parseConfig(params)).toEqual(config);
  });

  it('only writes values that differ from the default', () => {
    const params = writeConfig(new URLSearchParams(), { ...DEFAULT_CONFIG, loadPct: 80 });
    expect(params.toString()).toBe('load=80');
  });

  it('preserves unrelated parameters such as theme', () => {
    const params = writeConfig(new URLSearchParams('theme=dark&load=10'), { ...DEFAULT_CONFIG, layers: 2 });
    expect(params.get('theme')).toBe('dark');
    expect(params.get('load')).toBeNull();
    expect(params.get('layers')).toBe('2');
  });

  it('clamps and snaps ranged values', () => {
    const config = parseConfig(new URLSearchParams('load=500&outage=0.01&capacity=-20&attempts=9&layers=0'));
    expect(config.loadPct).toBe(95);
    expect(config.outageS).toBe(0.5);
    expect(config.degradedCapacityPct).toBe(0);
    expect(config.attemptsPerLayer).toBe(4);
    expect(config.layers).toBe(1);
    expect(clampToStep('outageS', 7.26)).toBe(7.5);
    expect(clampToStep('loadPct', 62)).toBe(60);
  });

  it('ignores malformed and unsupported values', () => {
    const config = parseConfig(
      new URLSearchParams('load=abc&timeout=777&backoff=linear&budget=15&shed=maybe&base=&max=Infinity')
    );
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('accepts boolean spellings for shedding', () => {
    expect(parseConfig(new URLSearchParams('shed=true')).shedAbandoned).toBe(true);
    expect(parseConfig(new URLSearchParams('shed=0')).shedAbandoned).toBe(false);
  });
});

describe('matchPreset', () => {
  it('identifies presets exactly and treats edits as custom', () => {
    expect(matchPreset(PRESETS[1].config)?.id).toBe(PRESETS[1].id);
    expect(matchPreset({ ...PRESETS[1].config, loadPct: 5 })).toBeUndefined();
  });

  it('has unique preset ids and configurations', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    expect(new Set(PRESETS.map((p) => JSON.stringify(p.config))).size).toBe(PRESETS.length);
  });
});
