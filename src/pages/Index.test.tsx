
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Index from './Index';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@/context/ThemeContext';

describe('Index Page', () => {
  it('should render all sections and key details', () => {
    render(
      <HelmetProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeProvider>
            <Index />
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    );

    // Check for Hero Section content
    const main = screen.getByRole('main');
    expect(within(main).getAllByText('Dylan Bochman')[0]).toBeInTheDocument();
    expect(within(main).getAllByText('Sr. Site Reliability Engineer - Technical Incident Manager')[0]).toBeInTheDocument();
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
    expect(screen.getAllByText('Email')[0].closest('a')).toHaveAttribute('href', 'mailto:dylanbochman@gmail.com');
    expect(screen.getAllByText('LinkedIn')[0].closest('a')).toHaveAttribute('href', 'https://www.linkedin.com/in/dbochman/');
    expect(screen.getAllByText('GitHub')[0].closest('a')).toHaveAttribute('href', 'https://github.com/Dbochman');

    // Check for Sidebar content
    expect(screen.getByText('Core Expertise')).toBeInTheDocument();

    // Check for other section titles
    expect(screen.getByText('Professional Experience')).toBeInTheDocument();
    expect(screen.getByText('Career Goals')).toBeInTheDocument();
    expect(screen.getByText("Let's Connect")).toBeInTheDocument();
  });
});
