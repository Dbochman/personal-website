
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MobileNav from './MobileNav';
import { NavigationContext } from '@/context/NavigationContext';

describe('MobileNav', () => {
  it('should open and close the mobile navigation menu', () => {
    const openExperienceAccordion = vi.fn();

    render(
      <BrowserRouter>
        <NavigationContext.Provider value={{ openExperienceAccordion }}>
          <MobileNav />
        </NavigationContext.Provider>
      </BrowserRouter>
    );

    // Check that the menu is initially closed
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();

    // Open the menu
    const openButton = screen.getByLabelText('Open navigation menu');
    fireEvent.click(openButton);

    // Check that the menu is open
    expect(screen.getByText('Menu')).toBeInTheDocument();

    // Close the menu
    const closeButton = screen.getByLabelText('Close navigation menu');
    fireEvent.click(closeButton);

    // Check that the menu is closed
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });
});
