
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BackToTop from './BackToTop';

describe('BackToTop', () => {
  // Mock window.scrollTo
  window.scrollTo = vi.fn();

  it('should not be visible initially', () => {
    render(<BackToTop />);
    expect(screen.queryByLabelText('Back to top')).not.toBeInTheDocument();
  });

  it('should become visible after scrolling down', () => {
    render(<BackToTop />);
    
    // Simulate scrolling down
    window.pageYOffset = 301;
    fireEvent.scroll(window);

    expect(screen.getByLabelText('Back to top')).toBeInTheDocument();
  });

  it('should scroll to top when clicked', () => {
    render(<BackToTop />);

    // Simulate scrolling down to make the button visible
    window.pageYOffset = 301;
    fireEvent.scroll(window);

    const backToTopButton = screen.getByLabelText('Back to top');
    fireEvent.click(backToTopButton);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
