import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('CodeBlock', () => {
  beforeEach(() => {
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockWriteText.mockClear();
  });

  it('renders code content', () => {
    render(
      <CodeBlock>
        <code>const x = 1;</code>
      </CodeBlock>
    );
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(
      <CodeBlock>
        <code>const x = 1;</code>
      </CodeBlock>
    );
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
  });

  it('copies code to clipboard on button click', async () => {
    render(
      <CodeBlock>
        <code>const x = 1;</code>
      </CodeBlock>
    );

    const copyButton = screen.getByRole('button', { name: /copy code/i });
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('const x = 1;');
  });

  describe('analytics', () => {
    beforeEach(() => {
      window.gtag = vi.fn();
    });

    afterEach(() => {
      delete (window as unknown as { gtag?: unknown }).gtag;
    });

    it('fires code_copy event when code is copied', async () => {
      render(
        <CodeBlock>
          <code>const x = 1;</code>
        </CodeBlock>
      );

      const copyButton = screen.getByRole('button', { name: /copy code/i });
      fireEvent.click(copyButton);

      // Wait for async clipboard operation
      await vi.waitFor(() => {
        expect(window.gtag).toHaveBeenCalledWith('event', 'code_copy', {
          event_category: 'engagement',
          event_label: 'const x = 1;'
        });
      });
    });

    it('truncates long code in event label to 50 chars', async () => {
      const longCode = 'a'.repeat(100);
      render(
        <CodeBlock>
          <code>{longCode}</code>
        </CodeBlock>
      );

      const copyButton = screen.getByRole('button', { name: /copy code/i });
      fireEvent.click(copyButton);

      await vi.waitFor(() => {
        expect(window.gtag).toHaveBeenCalledWith('event', 'code_copy', {
          event_category: 'engagement',
          event_label: 'a'.repeat(50)
        });
      });
    });
  });
});
