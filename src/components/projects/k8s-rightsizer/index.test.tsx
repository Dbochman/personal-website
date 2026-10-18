import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import K8sRightsizer from './index';
import { trackToolEvent } from '@/lib/trackToolEvent';

vi.mock('@/lib/trackToolEvent', () => ({ trackToolEvent: vi.fn() }));

const writeText = vi.fn();

beforeAll(() => {
  // Radix Slider measures its thumb; jsdom has no ResizeObserver
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Object.assign(navigator, { clipboard: { writeText } });
});

beforeEach(() => {
  window.history.replaceState({}, '', '/projects/k8s-rightsizer');
  vi.mocked(trackToolEvent).mockClear();
  writeText.mockReset();
});

const ROUTE = '/projects/k8s-rightsizer';

/** Stands in for any in-app link to the same route with different params. */
function NavigateButton({ to }: { to: string }) {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(to)}>navigate</button>;
}

const renderTool = (navigateTo?: string) => render(
  <BrowserRouter>
    <K8sRightsizer />
    {navigateTo && <NavigateButton to={navigateTo} />}
  </BrowserRouter>
);
const pause = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
const urlParam = (key: string) => new URLSearchParams(window.location.search).get(key);
const field = (key: string) => document.getElementById(`rightsizer-${key}`) as HTMLInputElement;
const postureSlider = () => screen.getByRole('slider', { name: 'Sizing posture' });
const resultRow = (name: RegExp) =>
  within(screen.getByRole('table', { name: 'Current and recommended resources' })).getByRole('row', { name });
const yamlText = () => screen.getByLabelText('Recommended resources YAML').textContent;

describe('K8sRightsizer', () => {
  it('renders the example recommendation with its basis and YAML', () => {
    renderTool();
    expect(resultRow(/^CPU request/)).toHaveTextContent('220m');
    expect(resultRow(/^CPU request/)).toHaveTextContent('P95 × 1.1');
    expect(resultRow(/^Memory limit/)).toHaveTextContent('704Mi');
    expect(yamlText()).toContain('cpu: "220m"');
    expect(yamlText()).toContain('memory: "448Mi"');
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
  });

  it('flags invalid units on the field and blocks export', () => {
    renderTool();
    const memP95 = screen.getByRole('group', { name: /Memory/ }).querySelector('#rightsizer-memP95') as HTMLInputElement;
    fireEvent.change(memP95, { target: { value: '400m' } });

    expect(memP95).toHaveAttribute('aria-invalid', 'true');
    expect(memP95).toHaveAccessibleDescription(/Did you mean 400Mi\?/);
    expect(screen.queryByLabelText('Recommended resources YAML')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No recommendation yet' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Memory P95' }));
    expect(memP95).toHaveFocus();

    fireEvent.change(memP95, { target: { value: '400Mi' } });
    expect(memP95).not.toHaveAttribute('aria-invalid');
    expect(yamlText()).toContain('memory: "448Mi"');
  });

  it('reports out-of-order percentiles for the resource group', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText('Max', { selector: '#rightsizer-cpuMax' }), { target: { value: '100m' } });
    expect(screen.getByRole('group', { name: 'CPU' })).toHaveAccessibleDescription(/P99 is greater than Max/);
  });

  it('changes posture from the keyboard and announces its name', () => {
    renderTool();
    const slider = screen.getByRole('slider', { name: 'Sizing posture' });
    expect(slider).toHaveAttribute('aria-valuetext', 'Balanced');
    expect(slider).toHaveAccessibleDescription(/Most stateless services/);

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuetext', 'Conservative');
    expect(resultRow(/^CPU request/)).toHaveTextContent('240m');

    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider).toHaveAttribute('aria-valuetext', 'Aggressive');
    expect(resultRow(/^CPU request/)).toHaveTextContent('100m');
    expect(resultRow(/^Memory request/)).toHaveTextContent('P95 × 1.0');
  });

  it('omits the CPU limit from YAML when unchecked', () => {
    renderTool();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Set a CPU limit' }));
    expect(yamlText()).toBe('resources:\n  requests:\n    cpu: "220m"\n    memory: "448Mi"\n  limits:\n    memory: "704Mi"');
    expect(resultRow(/^CPU limit/)).toHaveTextContent('None');
  });

  it('hydrates from the URL and writes changes back without dropping other parameters', async () => {
    window.history.replaceState({}, '', '/projects/k8s-rightsizer?theme=dark&cpuP95=250m&posture=safe');
    renderTool();
    expect(screen.getByLabelText('P95', { selector: '#rightsizer-cpuP95' })).toHaveValue('250m');
    expect(screen.getByRole('slider', { name: 'Sizing posture' })).toHaveAttribute('aria-valuetext', 'Safe');

    fireEvent.change(screen.getByLabelText('Replicas'), { target: { value: '12' } });
    await waitFor(() => expect(new URLSearchParams(window.location.search).get('replicas')).toBe('12'));
    const params = new URLSearchParams(window.location.search);
    expect(params.get('theme')).toBe('dark');
    expect(params.get('cpuP95')).toBe('250m');
    expect(params.get('posture')).toBe('safe');
  });

  it('resets to the example', async () => {
    window.history.replaceState({}, '', '/projects/k8s-rightsizer?cpuP95=250m');
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: 'Reset example' }));
    expect(screen.getByLabelText('P95', { selector: '#rightsizer-cpuP95' })).toHaveValue('200m');
    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('copies YAML and reports success', async () => {
    writeText.mockResolvedValue(undefined);
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: 'Copy YAML' }));
    expect(await screen.findByText('Copied to clipboard.')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(yamlText());
    expect(trackToolEvent).toHaveBeenCalledWith({ tool_name: 'k8s_rightsizer', action: 'copy_yaml', event_label: 'yaml' });
  });

  it('tells the user when copying fails', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    renderTool();
    fireEvent.click(screen.getByRole('button', { name: 'Copy YAML' }));
    expect(await screen.findByText(/Copy failed/)).toBeInTheDocument();
  });

  it('keeps cost separate from sizing: bad prices hide cost but not the recommendation', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText('Per vCPU-hour'), { target: { value: '-1' } });
    expect(screen.getByText('Enter valid prices to estimate cost.')).toBeInTheDocument();
    expect(yamlText()).toContain('cpu: "220m"');
  });

  it('describes each field only by the hint or error that is rendered', () => {
    renderTool();
    const cpuRequest = field('cpuRequest');
    expect(cpuRequest).toHaveAttribute('aria-describedby', 'rightsizer-cpuRequest-hint');
    fireEvent.change(cpuRequest, { target: { value: '0.5m' } });
    expect(cpuRequest).toHaveAttribute('aria-describedby', 'rightsizer-cpuRequest-error');
    expect(document.getElementById('rightsizer-cpuRequest-hint')).toBeNull();
    expect(cpuRequest).toHaveAccessibleDescription(/finer than 1m/);
    expect(field('cpuLimit')).not.toHaveAttribute('aria-describedby');
  });

  // Custom tool events only. Inputs are intentionally in the shareable URL,
  // which the site's generic page analytics may still record.
  it('sends no typed inputs in custom tool events', () => {
    renderTool();
    fireEvent.change(screen.getByLabelText('Replicas'), { target: { value: '7' } });
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Sizing posture' }), { key: 'End' });
    for (const [event] of vi.mocked(trackToolEvent).mock.calls) {
      expect(['posture_change', 'copy_yaml', 'reset']).toContain(event.action);
      expect(event.event_label).not.toContain('7');
    }
  });
});

describe('K8sRightsizer URL synchronization', () => {
  it('discards a pending edit when navigating to the same default parameters', async () => {
    renderTool(ROUTE);
    fireEvent.change(field('replicas'), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
    expect(field('replicas')).toHaveValue('3');
    await pause(400);
    expect(urlParam('replicas')).toBeNull();
    expect(field('replicas')).toHaveValue('3');
  });

  it('adopts a same-route navigation to different sizing params', async () => {
    renderTool(`${ROUTE}?cpuP95=250m&posture=safe`);
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
    expect(field('cpuP95')).toHaveValue('250m');
    expect(postureSlider()).toHaveAttribute('aria-valuetext', 'Safe');
    await pause(400);
    expect(urlParam('cpuP95')).toBe('250m');
    expect(urlParam('posture')).toBe('safe');
  });

  it('follows Back and Forward between sizing scenarios', async () => {
    window.history.replaceState({}, '', `${ROUTE}?theme=dark`);
    renderTool(`${ROUTE}?theme=dark&posture=safe&cpuMax=600m`);
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
    expect(postureSlider()).toHaveAttribute('aria-valuetext', 'Safe');

    await act(async () => window.history.back());
    await waitFor(() => expect(postureSlider()).toHaveAttribute('aria-valuetext', 'Balanced'));
    expect(field('cpuMax')).toHaveValue('400m');
    await pause(400);
    expect(window.location.search).toBe('?theme=dark');

    await act(async () => window.history.forward());
    await waitFor(() => expect(postureSlider()).toHaveAttribute('aria-valuetext', 'Safe'));
    expect(field('cpuMax')).toHaveValue('600m');
    await pause(400);
    expect(urlParam('posture')).toBe('safe');
    expect(urlParam('theme')).toBe('dark');
  });

  it('lets a navigation during the debounce win over the pending write', async () => {
    renderTool(`${ROUTE}?cpuP95=250m`);
    fireEvent.change(field('replicas'), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
    await pause(400);
    expect(urlParam('cpuP95')).toBe('250m');
    expect(urlParam('replicas')).toBeNull();
    expect(field('cpuP95')).toHaveValue('250m');
    expect(field('replicas')).toHaveValue('3');
  });

  it('does not overwrite a URL change the router has not rendered yet', async () => {
    renderTool();
    fireEvent.change(field('replicas'), { target: { value: '12' } });
    window.history.replaceState(window.history.state, '', `${ROUTE}?theme=dark&cpuP95=250m`);
    await pause(400);
    expect(window.location.search).toBe('?theme=dark&cpuP95=250m');
    expect(field('cpuP95')).toHaveValue('250m');
    expect(field('replicas')).toHaveValue('3');
  });

  it('keeps rapid keystrokes, including ones typed right after a URL write', async () => {
    window.history.replaceState({}, '', `${ROUTE}?theme=dark`);
    renderTool();
    const replicas = field('replicas');
    fireEvent.change(replicas, { target: { value: '1' } });
    fireEvent.change(replicas, { target: { value: '12' } });
    await waitFor(() => expect(urlParam('replicas')).toBe('12'));
    fireEvent.change(replicas, { target: { value: '123' } });
    expect(replicas).toHaveValue('123');
    await waitFor(() => expect(urlParam('replicas')).toBe('123'));
    await pause(400);
    expect(replicas).toHaveValue('123');
    expect(urlParam('theme')).toBe('dark');
  });

  it('writes with replace so typing adds no history entries', async () => {
    renderTool();
    const before = window.history.length;
    fireEvent.change(field('replicas'), { target: { value: '5' } });
    await waitFor(() => expect(urlParam('replicas')).toBe('5'));
    fireEvent.change(field('replicas'), { target: { value: '6' } });
    await waitFor(() => expect(urlParam('replicas')).toBe('6'));
    expect(window.history.length).toBe(before);
  });
});
