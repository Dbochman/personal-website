import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpertiseCard } from './ExpertiseCard';
import type { ExpertiseItem } from '@/data/expertise';

const mockItem: ExpertiseItem = {
  title: 'Incident Management',
  description: 'Leading incident response and post-mortems',
  companies: ['groq', 'hashicorp'],
  skills: ['PagerDuty', 'Runbooks', 'Blameless Culture'],
};

describe('ExpertiseCard', () => {
  it('renders the title', () => {
    render(<ExpertiseCard item={mockItem} isExpanded={false} onExpand={() => {}} />);
    expect(screen.getByText('Incident Management')).toBeInTheDocument();
  });

  it('shows description when expanded', () => {
    render(<ExpertiseCard item={mockItem} isExpanded={true} onExpand={() => {}} />);
    expect(screen.getByText(mockItem.description)).toBeInTheDocument();
  });

  it('calls onExpand on mouse enter', () => {
    const onExpand = vi.fn();
    render(<ExpertiseCard item={mockItem} isExpanded={false} onExpand={onExpand} />);

    const card = screen.getByText('Incident Management').closest('div[tabindex]');
    if (card) {
      fireEvent.mouseEnter(card);
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

    it('fires expertise_card_expand event on first hover when not expanded', () => {
      const onExpand = vi.fn();
      render(<ExpertiseCard item={mockItem} isExpanded={false} onExpand={onExpand} />);

      const card = screen.getByText('Incident Management').closest('div[tabindex]');
      if (card) {
        fireEvent.mouseEnter(card);

        expect(window.gtag).toHaveBeenCalledWith('event', 'expertise_card_expand', {
          event_category: 'engagement',
          event_label: 'Incident Management'
        });
      }
    });

    it('does not fire event when already expanded', () => {
      const onExpand = vi.fn();
      render(<ExpertiseCard item={mockItem} isExpanded={true} onExpand={onExpand} />);

      const card = screen.getByText('Incident Management').closest('div[tabindex]');
      if (card) {
        fireEvent.mouseEnter(card);

        expect(window.gtag).not.toHaveBeenCalled();
      }
    });

    it('fires expertise_card_expand event on focus', () => {
      const onExpand = vi.fn();
      render(<ExpertiseCard item={mockItem} isExpanded={false} onExpand={onExpand} />);

      const card = screen.getByText('Incident Management').closest('div[tabindex]');
      if (card) {
        fireEvent.focus(card);

        expect(window.gtag).toHaveBeenCalledWith('event', 'expertise_card_expand', {
          event_category: 'engagement',
          event_label: 'Incident Management'
        });
      }
    });
  });
});
