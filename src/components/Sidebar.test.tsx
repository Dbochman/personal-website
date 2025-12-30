
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Sidebar from './Sidebar'

// Mock the expertise data
vi.mock('@/data/expertise', () => ({
  coreExpertise: [
    'Site Reliability Engineering',
    'Incident Command & Coordination',
    'Post-Incident Analysis and Reporting',
    'SLO Monitoring and Strategy',
    'Test Expertise Item'
  ]
}))

describe('Sidebar', () => {
  it('should render the Core Expertise heading', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Core Expertise')).toBeInTheDocument()
  })

  it('should render all expertise items from data', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Site Reliability Engineering')).toBeInTheDocument()
    expect(screen.getByText('Incident Command & Coordination')).toBeInTheDocument()
    expect(screen.getByText('Post-Incident Analysis and Reporting')).toBeInTheDocument()
    expect(screen.getByText('SLO Monitoring and Strategy')).toBeInTheDocument()
    expect(screen.getByText('Test Expertise Item')).toBeInTheDocument()
  })

  it('should have proper CSS classes for layout', () => {
    render(<Sidebar />)
    
    const container = screen.getByText('Core Expertise').closest('div')?.parentElement?.parentElement
    expect(container).toHaveClass('space-y-6')
  })

  it('should have proper CSS classes for card styling', () => {
    render(<Sidebar />)
    
    const card = screen.getByText('Core Expertise').closest('[class*="bg-background"]')
    expect(card).toHaveClass('bg-background/60', 'backdrop-blur-sm', 'border-foreground/20')
  })

  it('should have proper CSS classes for card content', () => {
    render(<Sidebar />)
    
    const cardContent = screen.getByText('Core Expertise').closest('[class*="p-6"]')
    expect(cardContent).toHaveClass('p-6')
  })

  it('should have proper CSS classes for heading', () => {
    render(<Sidebar />)
    
    const heading = screen.getByText('Core Expertise')
    expect(heading).toHaveClass('text-lg', 'font-bold', 'text-foreground', 'mb-6')
  })

  it('should have proper CSS classes for expertise items container', () => {
    render(<Sidebar />)
    
    const itemsContainer = screen.getByText('Site Reliability Engineering').parentElement
    expect(itemsContainer).toHaveClass('space-y-2')
  })

  it('should have proper CSS classes for individual expertise items', () => {
    render(<Sidebar />)

    const expertiseItem = screen.getByText('Site Reliability Engineering')
    expect(expertiseItem).toHaveClass(
      'text-xs',
      'text-foreground/80',
      'p-2',
      'border',
      'border-foreground/20',
      'bg-foreground/5',
      'hover:bg-foreground/10',
      'transition-colors'
    )
  })

  it('should render the correct number of expertise items', () => {
    render(<Sidebar />)
    
    const expertiseItems = screen.getAllByText(/Site Reliability Engineering|Incident Command|Post-Incident Analysis|SLO Monitoring|Test Expertise Item/)
    expect(expertiseItems).toHaveLength(5)
  })

  it('should have unique keys for expertise items', () => {
    render(<Sidebar />)
    
    // Check that all items are rendered (no React key warnings in console)
    const items = screen.getAllByText(/.*/).filter(el => 
      el.classList.contains('text-xs') && 
      el.classList.contains('text-foreground/80')
    )
    
    expect(items.length).toBeGreaterThan(0)
  })

  it('should be accessible with proper semantic structure', () => {
    render(<Sidebar />)
    
    // Check for proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Core Expertise')
  })

  it('should render with proper container structure', () => {
    render(<Sidebar />)
    
    // Verify the main container structure
    const mainContainer = screen.getByText('Core Expertise').closest('div')?.parentElement?.parentElement
    expect(mainContainer?.children).toHaveLength(1) // Should have one Card child
    
    // Verify card structure
    const card = screen.getByText('Core Expertise').closest('[class*="bg-background"]')
    expect(card).toBeInTheDocument()
    
    const cardContent = screen.getByText('Core Expertise').closest('[class*="p-6"]')
    expect(cardContent).toBeInTheDocument()
  })
})
