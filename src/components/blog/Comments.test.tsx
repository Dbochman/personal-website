import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Comments } from './Comments';

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

type MockIO = {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  callback: IntersectionObserverCallback;
};

let mockIO: MockIO;
const originalIntersectionObserver = global.IntersectionObserver;

class TestIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    mockIO.callback = callback;
  }

  observe = (...args: Parameters<IntersectionObserver['observe']>) => mockIO.observe(...args);
  disconnect = (...args: Parameters<IntersectionObserver['disconnect']>) => mockIO.disconnect(...args);
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

describe('Comments', () => {
  beforeEach(() => {
    mockIO = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      callback: () => {},
    };

    global.IntersectionObserver = TestIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    global.IntersectionObserver = originalIntersectionObserver;
    vi.clearAllMocks();
  });

  it('lazy loads Giscus when the comments container becomes visible', async () => {
    const { container } = render(<Comments slug="example-post" />);

    expect(screen.getByText('Comments will load when you scroll down...')).toBeInTheDocument();

    const commentsContainer = container.querySelector('.giscus-container');
    expect(commentsContainer).not.toBeNull();
    expect(mockIO.observe).toHaveBeenCalledWith(commentsContainer);
    expect(container.querySelector('script[src="https://giscus.app/client.js"]')).toBeNull();

    act(() => {
      mockIO.callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    await waitFor(() => {
      expect(container.querySelector('script[src="https://giscus.app/client.js"]')).not.toBeNull();
    });

    const script = container.querySelector('script[src="https://giscus.app/client.js"]');
    expect(script).toHaveAttribute('data-term', 'example-post');
    expect(script).toHaveAttribute('data-theme', 'light');
    expect(mockIO.disconnect).toHaveBeenCalled();
  });
});
