import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ExpertiseCard } from './ExpertiseCard';
import type { ExpertiseItem } from '@/data/expertise';

const mockItem: ExpertiseItem = {
  title: 'Incident Management',
  description: 'Leading incident response and post-mortems',
  companies: ['groq', 'hashicorp'],
  skills: ['PagerDuty', 'Runbooks', 'Blameless Culture'],
};

const noop = () => {};

describe('ExpertiseCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the title', () => {
    render(<ExpertiseCard item={mockItem} isExpanded={false} onExpand={noop} onCollapse={noop} />);
    expect(screen.getByText('Incident Management')).toBeInTheDocument();
  });

  it('shows description when expanded', () => {
    render(<ExpertiseCard item={mockItem} isExpanded={true} onExpand={noop} onCollapse={noop} />);
    expect(screen.getByText(mockItem.description)).toBeInTheDocument();
  });

  it('calls onExpand after delay on mouse enter', () => {
    const onExpand = vi.fn();
    render(<ExpertiseCard item={mockItem} isExpanded={false} onExpand={onExpand} onCollapse={noop} />);

    const card = screen.getByText('Incident Management').closest('div[tabindex]');
    if (card) {
      fireEvent.mouseEnter(card);
      expect(onExpand).not.toHaveBeenCalled(); // Not called immediately

      act(() => {
        vi.advanceTimersByTime(1000); // EXPAND_DELAY
      });
      expect(onExpand).toHaveBeenCalled();
    }
  });

  describe('analytics', () => {
    beforeEach(() => {
      window.gtag = vi.fn();
    });

    afterEach(() => {
      delete (window as unknown as { gtag?: unknown }).gtag;
    });

    it('fires expertise_card_expand event after hover delay when not expanded', () => {
      const onExpand = vi.fn();
      render(<ExpertiseCard item={mockItem} isExpanded={false} onExpand={onExpand} onCollapse={noop} />);

      const card = screen.getByText('Incident Management').closest('div[tabindex]');
      if (card) {
        fireEvent.mouseEnter(card);
        expect(window.gtag).not.toHaveBeenCalled(); // Not immediate

        act(() => {
          vi.advanceTimersByTime(1000); // EXPAND_DELAY
        });

        expect(window.gtag).toHaveBeenCalledWith('event', 'expertise_card_expand', {
          event_category: 'engagement',
          event_label: 'Incident Management'
        });
      }
    });

    it('does not fire event when already expanded', () => {
      const onExpand = vi.fn();
      render(<ExpertiseCard item={mockItem} isExpanded={true} onExpand={onExpand} onCollapse={noop} />);

      const card = screen.getByText('Incident Management').closest('div[tabindex]');
      if (card) {
        fireEvent.mouseEnter(card);

        act(() => {
          vi.advanceTimersByTime(1000);
        });

        expect(window.gtag).not.toHaveBeenCalled();
      }
    });

    it('fires expertise_card_expand event on click', () => {
      const onExpand = vi.fn();
      render(<ExpertiseCard item={mockItem} isExpanded={false} onExpand={onExpand} onCollapse={noop} />);

      const card = screen.getByText('Incident Management').closest('div[tabindex]');
      if (card) {
        fireEvent.click(card);

        // Click fires immediately (no delay)
        expect(window.gtag).toHaveBeenCalledWith('event', 'expertise_card_expand', {
          event_category: 'engagement',
          event_label: 'Incident Management'
        });
      }
    });
  });
});
