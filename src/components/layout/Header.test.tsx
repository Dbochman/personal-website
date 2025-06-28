// src/components/layout/Header.test.tsx
// 1) Mock the NavigationContext module so NavigationProvider is defined
vi.mock('@/context/NavigationContext', () => ({
  __esModule: true,
  // NavigationProvider just renders its children
  NavigationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  // useNavigation stub if your Header—or any child—calls it
  useNavigation: () => ({
    // whatever shape your hook returns; stub out empty functions/values
    currentSection: null,
    setSection: () => {},
  }),
}))

// 2) Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// 3) Mock all your SVG imports
vi.mock('@/assets/logos/spotify.svg',       () => ({ default: 'spotify.svg' }))
vi.mock('@/assets/logos/hashicorp.svg',     () => ({ default: 'hashicorp.svg' }))
vi.mock('@/assets/logos/hashicorp-dark.svg',() => ({ default: 'hashicorp-dark.svg' }))

// Now import the rest of your test helpers and the component under test:
import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import Header from './Header'
import React from 'react'
import { queryByTestId } from '@testing-library/dom'

// 1) Mock next/link so <Link> renders as <a>
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// 2) Mock your SVG imports so they resolve to simple strings
vi.mock('@/assets/logos/spotify.svg',    () => ({ default: 'spotify.svg' }))
vi.mock('@/assets/logos/hashicorp.svg',  () => ({ default: 'hashicorp.svg' }))
vi.mock('@/assets/logos/hashicorp-dark.svg', () => ({ default: 'hashicorp-dark.svg' }))

import { NavigationProvider } from '@/context/NavigationContext'
import Header from './Header'

describe('dark-mode toggle in Header', () => {
  beforeEach(() => {
    // start with no dark class
    document.documentElement.classList.remove('dark')
    // provide a stub for matchMedia
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener:    () => {},
      removeListener: () => {},
      addEventListener:    () => {},
      removeEventListener: () => {},
      dispatchEvent:   () => false,
    }))
  })

  it('starts in dark mode when the system prefers it', () => {
  // mock system preference
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: true,
    media: query,
    onchange: null,
    addListener:    () => {},
    removeListener: () => {},
    addEventListener:    () => {},
    removeEventListener: () => {},
    dispatchEvent:   () => false,
  }))

  // render wrapped in provider as before
  render(
    <NavigationProvider>
      <Header />
    </NavigationProvider>
  )

  // html should already have .dark
  expect(document.documentElement.classList.contains('dark')).toBe(true)

  // icon should be the Sun (indicating "switch to light")
  expect(document.querySelector('[data-testid="icon-sun"]')).toBeTruthy()
})

  it('toggles the .dark class on <html> when clicked', () => {
    const { getByLabelText, getAllByLabelText } = render(
      <NavigationProvider>
        <Header />
      </NavigationProvider>
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
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(queryByTestId(document.body, 'icon-sun')).toBeTruthy()
    expect(queryByTestId(document.body, 'icon-moon')).toBeNull()

    // click again → remove .dark
    fireEvent.click(toggle)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})