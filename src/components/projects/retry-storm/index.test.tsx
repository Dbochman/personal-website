import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter, useNavigate, type NavigateFunction } from 'react-router-dom';
import RetryStormSimulator from './index';
import { URL_SYNC_DELAY_MS } from './useUrlConfig';

// Radix Slider and Recharts' ResponsiveContainer measure themselves.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const originalResizeObserver = globalThis.ResizeObserver;
const ROUTE = '/projects/retry-storm-simulator';

beforeAll(() => {
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

let navigate: NavigateFunction;

function NavigateProbe() {
  navigate = useNavigate();
  return null;
}

function renderAt(url: string) {
  window.history.replaceState({}, '', url);
  return render(
    <BrowserRouter>
      <RetryStormSimulator />
      <NavigateProbe />
    </BrowserRouter>
  );
}

const verdict = () => screen.getByTestId('retry-storm-verdict');
const loadSlider = () => screen.getByRole('slider', { name: 'Normal load' });
const urlParam = (name: string) => new URLSearchParams(window.location.search).get(name);
/** Long enough for any pending debounced URL write to fire. */
const flushUrlWrites = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, URL_SYNC_DELAY_MS * 3)));

describe('RetryStormSimulator', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('opens on the failover scenario and reports a bounded, unrecovered verdict', () => {
    renderAt(ROUTE);
    expect(screen.getByRole('button', { name: 'Database failover' })).toHaveAttribute('aria-pressed', 'true');
    expect(verdict()).toHaveTextContent('Not recovered by 120s: the trigger ended at 25s');
    expect(screen.getByRole('img', { name: /Load at the dependency over 120 seconds/ })).toBeInTheDocument();
    expect(screen.getByText('Tipping point')).toBeInTheDocument();
    expect(screen.queryByText(/never recovers/i)).not.toBeInTheDocument();
  });

  it('hydrates from URL parameters', () => {
    renderAt(`${ROUTE}?attempts=1&theme=dark`);
    expect(screen.getByRole('radio', { name: '1 (off)' })).toHaveAttribute('aria-checked', 'true');
    expect(verdict()).toHaveTextContent(/^Recovered, but/);
    expect(screen.getByRole('button', { name: 'Database failover' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not equate a missing tipping point with recovery inside the horizon', () => {
    renderAt(`${ROUTE}?load=90&attempts=1&outage=45`);
    expect(verdict()).toHaveTextContent('Still draining at 120s');
    expect(screen.getByText(/no growing-backlog threshold found up to 45s/)).toBeInTheDocument();
    expect(screen.getByText(/An aggregate approximation, not separate budgets at each layer/)).toBeInTheDocument();
  });

  it('switches scenarios and writes only non-default values to the URL', async () => {
    renderAt(`${ROUTE}?theme=dark`);
    fireEvent.click(screen.getByRole('button', { name: 'Hardened failover' }));
    expect(verdict()).toHaveTextContent('Recovered');
    await waitFor(() => {
      expect(urlParam('budget')).toBe('10');
      expect(urlParam('shed')).toBe('1');
      expect(urlParam('theme')).toBe('dark');
      expect(urlParam('load')).toBeNull();
    });
  });

  it('loads a defense from the comparison ladder', () => {
    renderAt(ROUTE);
    const ladder = screen.getByRole('list', { name: 'Defense comparison' });
    expect(within(ladder).getAllByText('Not recovered by 120s')).toHaveLength(2);
    fireEvent.click(within(ladder).getByRole('button', { name: 'Load policy: Shed abandoned work' }));
    expect(screen.getByRole('checkbox', { name: 'Server sheds abandoned work' })).toBeChecked();
    expect(within(ladder).getByText('Current')).toBeInTheDocument();
    expect(verdict()).toHaveTextContent('Recovered');
  });

  it('updates the verdict when a policy control changes', () => {
    renderAt(ROUTE);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Server sheds abandoned work' }));
    expect(verdict()).toHaveTextContent('Recovered');
    expect(screen.getByRole('button', { name: 'Database failover' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the stacked-layer multiplication', () => {
    renderAt(`${ROUTE}?attempts=4&layers=3`);
    const chain = screen.getByRole('list', { name: 'Call chain' });
    expect(within(chain).getByText('Browser')).toBeInTheDocument();
    expect(screen.getByText('64')).toBeInTheDocument();
  });
});

describe('RetryStormSimulator URL synchronization', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('follows Back and Forward instead of keeping stale controls', async () => {
    renderAt(ROUTE);
    fireEvent.click(screen.getByRole('button', { name: 'Hardened failover' }));
    await waitFor(() => expect(urlParam('shed')).toBe('1'));

    act(() => navigate(`${ROUTE}?load=80`));
    expect(loadSlider()).toHaveAttribute('aria-valuenow', '80');
    expect(screen.getByRole('checkbox', { name: 'Server sheds abandoned work' })).not.toBeChecked();

    act(() => navigate(-1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Hardened failover' })).toHaveAttribute('aria-pressed', 'true')
    );
    expect(loadSlider()).toHaveAttribute('aria-valuenow', '60');

    act(() => navigate(1));
    await waitFor(() => expect(loadSlider()).toHaveAttribute('aria-valuenow', '80'));
    await flushUrlWrites();
    expect(window.location.search).toBe('?load=80');
  });

  it('lets a navigation during a pending write win, keeping unrelated params', async () => {
    renderAt(`${ROUTE}?theme=dark`);
    fireEvent.click(screen.getByRole('button', { name: 'Hardened failover' }));
    // Before the debounced write fires:
    act(() => navigate(`${ROUTE}?load=80&theme=dark`));
    await flushUrlWrites();

    expect(urlParam('load')).toBe('80');
    expect(urlParam('theme')).toBe('dark');
    expect(urlParam('shed')).toBeNull();
    expect(urlParam('budget')).toBeNull();
    expect(loadSlider()).toHaveAttribute('aria-valuenow', '80');
    expect(screen.getByRole('checkbox', { name: 'Server sheds abandoned work' })).not.toBeChecked();
  });

  it('discards a pending edit on navigation to the same default parameters', async () => {
    renderAt(ROUTE);
    fireEvent.click(screen.getByRole('button', { name: 'Hardened failover' }));
    act(() => navigate(ROUTE));
    await flushUrlWrites();
    expect(window.location.search).toBe('');
    expect(screen.getByRole('button', { name: 'Database failover' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('checkbox', { name: 'Server sheds abandoned work' })).not.toBeChecked();
  });

  it('does not overwrite a URL change the router has not delivered yet', async () => {
    renderAt(ROUTE);
    fireEvent.click(screen.getByRole('button', { name: 'Hardened failover' }));
    window.history.pushState({}, '', `${ROUTE}?load=70`);
    await flushUrlWrites();
    expect(window.location.search).toBe('?load=70');

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await waitFor(() => expect(loadSlider()).toHaveAttribute('aria-valuenow', '70'));
    await flushUrlWrites();
    expect(window.location.search).toBe('?load=70');
  });

  it('keeps an unrelated param changed outside the router during a pending write', async () => {
    renderAt(`${ROUTE}?theme=dark`);
    fireEvent.click(screen.getByRole('button', { name: 'Hardened failover' }));
    // ThemeContext toggles the theme with history.replaceState, bypassing the router.
    window.history.replaceState({}, '', `${ROUTE}?theme=light`);
    await flushUrlWrites();
    expect(urlParam('theme')).toBe('light');
    expect(urlParam('shed')).toBe('1');
    expect(urlParam('budget')).toBe('10');
  });
});

describe('RetryStormSimulator clipboard', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  function mockClipboard(value: unknown) {
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
  }

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('confirms a successful link copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard({ writeText });
    renderAt(`${ROUTE}?load=80`);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link to this scenario' }));
    expect(await screen.findByRole('button', { name: 'Link copied' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}${ROUTE}?load=80`);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a selectable link when the clipboard API is unavailable', async () => {
    mockClipboard(undefined);
    renderAt(`${ROUTE}?load=80`);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link to this scenario' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn’t copy automatically");
    const fallback = screen.getByRole('textbox', { name: 'Link to this scenario' });
    expect(fallback).toHaveValue(`${window.location.origin}${ROUTE}?load=80`);
    expect(fallback).toHaveAttribute('readonly');
    expect(fallback).toHaveFocus();
  });

  it('shows selectable YAML when the clipboard rejects', async () => {
    mockClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    renderAt(ROUTE);
    fireEvent.click(screen.getByRole('button', { name: 'Envoy starting point for this policy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy YAML' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn’t copy automatically");
    const fallback = screen.getByRole('textbox', { name: 'Envoy YAML' });
    expect((fallback as HTMLTextAreaElement).value).toContain('retry_policy:');
    expect(fallback).toHaveFocus();
  });
});
