
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Index from './Index';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

describe('Index Page', () => {
  it('should render all sections and key details', () => {
    render(
      <HelmetProvider>
        <BrowserRouter>
          <Index />
        </BrowserRouter>
      </HelmetProvider>
    );

    // Check for Hero Section content
    const main = screen.getByRole('main');
    expect(within(main).getAllByText('Dylan Bochman')[0]).toBeInTheDocument();
    expect(within(main).getAllByText('Technical Incident Manager')[0]).toBeInTheDocument();
    expect(screen.getByText((content, node) => {
      if (!node) return false;
      const hasText = (n) => /Specializing in.*Reliability, Resilience, and Incident Management/.test(n.textContent || '');
      const nodeHasText = hasText(node);
      const childrenDontHaveText = Array.from(node.children).every(
        (child) => !hasText(child)
      );
      return nodeHasText && childrenDontHaveText;
    })).toBeInTheDocument();

    // Check for buttons
    expect(screen.getAllByText('Get In Touch')[0].closest('a')).toHaveAttribute('href', 'mailto:dylanbochman@gmail.com');
    expect(screen.getAllByText('View Resume')[0].closest('a')).toHaveAttribute('href', '/DylanBochmanResume.pdf');

    // Check for Sidebar content
    expect(screen.getByText('Core Expertise')).toBeInTheDocument();

    // Check for other section titles
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Career Goals')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
});
