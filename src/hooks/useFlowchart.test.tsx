import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFlowchart } from './useFlowchart';

function Harness({ code = 'flowchart TD\n A --> B' }: { code?: string }) {
  const { ref, revision, error } = useFlowchart(code);
  return <><div ref={ref} data-testid="host" /><output>{error ?? revision}</output></>;
}

const disconnect = vi.fn();
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect = disconnect;
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('useFlowchart', () => {
  it('survives StrictMode, replaces source, and disconnects on unmount', async () => {
    const view = render(<StrictMode><Harness /></StrictMode>);
    await waitFor(() => expect(screen.getByTestId('host').querySelectorAll('.pele-node')).toHaveLength(2));
    view.rerender(<StrictMode><Harness code={'flowchart TD\n X --> Y --> Z'} /></StrictMode>);
    await waitFor(() => expect(screen.getByTestId('host').querySelectorAll('.pele-node')).toHaveLength(3));
    expect(screen.getByTestId('host').querySelector('[data-id="A"]')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('1');
    const prior = disconnect.mock.calls.length;
    view.unmount();
    expect(disconnect.mock.calls.length).toBeGreaterThan(prior);
  });

  it('reports bad source safely and recovers on the next render', async () => {
    const view = render(<Harness code="<img onerror=alert(1)>" />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/No diagram type/i));
    expect(view.container.querySelector('img')).toBeNull();
    view.rerender(<Harness />);
    await waitFor(() => expect(screen.getByTestId('host').querySelectorAll('.pele-node')).toHaveLength(2));
    expect(screen.getByRole('status')).toHaveTextContent('1');
  });
});
