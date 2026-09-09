
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Index from './Index';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@/context/ThemeContext';

describe('Index Page', () => {
  it('should render all sections, key details, and homepage structured data', async () => {
    render(
      <HelmetProvider>
        <BrowserRouter>
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
    expect(screen.getByText(/I lead incident response/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Selected projects' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'NVIDIA' })).toBeVisible();

    // Check for buttons
    expect(screen.getAllByText('Email')[0].closest('a')).toHaveAttribute('href', 'mailto:dylanbochman@gmail.com');
    expect(screen.getAllByText('LinkedIn')[0].closest('a')).toHaveAttribute('href', 'https://www.linkedin.com/in/dbochman/');
    expect(screen.getAllByText('GitHub')[0].closest('a')).toHaveAttribute('href', 'https://github.com/Dbochman');

    // Check for Sidebar content
    expect(screen.getByText('Core Expertise')).toBeInTheDocument();

    // Check for other section titles
    expect(screen.getByText('Professional Experience')).toBeInTheDocument();

    expect(screen.getByText("Let's Connect")).toBeInTheDocument();

    await waitFor(() => {
      const structuredData = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]')
      ).map(script => JSON.parse(script.textContent || '{}') as Record<string, unknown>);
      const profilePage = structuredData.find(item => item['@type'] === 'ProfilePage');

      expect(profilePage).toMatchObject({
        dateCreated: '2026-01-04T00:00:00-05:00',
        dateModified: '2026-09-08T00:00:00-04:00',
        mainEntity: {
          '@type': 'Person',
          name: 'Dylan Bochman',
        },
      });
    });
  });
});
