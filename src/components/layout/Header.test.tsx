
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { queryByTestId } from '@testing-library/dom'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'

// Mock the NavigationContext module
vi.mock('@/context/NavigationContext', () => ({
  __esModule: true,
  NavigationContext: {
    Provider: ({ children }: { children: React.ReactNode; value: unknown }) => <>{children}</>,
  },
  useNavigation: () => ({
    openExperienceAccordion: vi.fn(),
  }),
}))

// Mock your SVG imports
vi.mock('@/assets/logos/spotify.svg', () => ({ default: 'spotify.svg' }))
vi.mock('@/assets/logos/hashicorp.svg', () => ({ default: 'hashicorp.svg' }))
vi.mock('@/assets/logos/hashicorp-dark.svg', () => ({ default: 'hashicorp-dark.svg' }))

import { NavigationContext } from '@/context/NavigationContext'
import Header from './Header'

describe('Header dark-mode toggle', () => {
  beforeEach(() => {
    // start with no dark class
    document.documentElement.classList.remove('dark')
    // provide a stub for matchMedia
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }))
  })

  it('starts in dark mode when the system prefers it', () => {
    // mock system preference
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }))

    // render wrapped in provider
    const mockContext = {
      openExperienceAccordion: vi.fn(),
    }

    render(
      <BrowserRouter>
        <ThemeProvider>
          <NavigationContext.Provider value={mockContext}>
            <Header />
          </NavigationContext.Provider>
        </ThemeProvider>
      </BrowserRouter>
    )

    // html should already have .dark
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // icon should be the Sun (indicating "switch to light")
    expect(document.querySelector('[data-testid="icon-sun"]')).toBeTruthy()
  })

  it('toggles the .dark class on <html> when clicked', () => {
    const mockContext = {
      openExperienceAccordion: vi.fn(),
    }

    const { getAllByLabelText } = render(
      <BrowserRouter>
        <ThemeProvider>
          <NavigationContext.Provider value={mockContext}>
            <Header />
          </NavigationContext.Provider>
        </ThemeProvider>
      </BrowserRouter>
    )

    // find both dark mode toggles
    const toggles = getAllByLabelText(/toggle dark mode/i)
    expect(toggles).toHaveLength(2)

    // choose the first one (desktop toggle)
    const toggle = toggles[0]

    // initial: no .dark
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // click → add .dark
    fireEvent.click(toggle)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(queryByTestId(document.body, 'icon-sun')).toBeTruthy()
    expect(queryByTestId(document.body, 'icon-moon')).toBeNull()

    // click again → remove .dark
    fireEvent.click(toggle)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
