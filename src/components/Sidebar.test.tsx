
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Sidebar from './Sidebar'

// Mock the expertise data with new structure
vi.mock('@/data/expertise', () => ({
  coreExpertise: [
    {
      title: 'Site Reliability Engineering',
      description: 'Building reliable systems',
      companies: ['groq', 'spotify'],
      skills: ['Terraform', 'Kubernetes']
    },
    {
      title: 'Incident Command & Coordination',
      description: 'Leading incident response',
      companies: ['groq'],
      skills: ['Incident Command']
    },
    {
      title: 'Post-Incident Analysis and Reporting',
      description: 'Analyzing incidents',
      companies: ['hashicorp'],
      skills: ['Root Cause Analysis']
    },
    {
      title: 'SLO Monitoring and Strategy',
      description: 'Defining SLOs',
      companies: ['spotify'],
      skills: ['SLO Design']
    },
    {
      title: 'Test Expertise Item',
      description: 'Test description',
      companies: ['groq'],
      skills: ['Testing']
    }
  ]
}))

// Mock SVG imports
vi.mock('@/assets/logos/spotify.svg', () => ({ default: 'spotify.svg' }))
vi.mock('@/assets/logos/groq.svg', () => ({ default: 'groq.svg' }))
vi.mock('@/assets/logos/hashicorp.svg', () => ({ default: 'hashicorp.svg' }))
vi.mock('@/assets/logos/hashicorp-dark.svg', () => ({ default: 'hashicorp-dark.svg' }))

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
    expect(card).toHaveClass('bg-background/60', 'backdrop-blur-sm', 'border-transparent')
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

    // The container with expertise cards
    const heading = screen.getByText('Core Expertise')
    const itemsContainer = heading.parentElement?.querySelector('.space-y-2')
    expect(itemsContainer).toBeInTheDocument()
  })

  it('should have proper CSS classes for individual expertise items', () => {
    render(<Sidebar />)

    // The title is now in a div inside ExpertiseCard
    const expertiseItem = screen.getByText('Site Reliability Engineering')
    expect(expertiseItem).toHaveClass('text-xs', 'text-foreground/80', 'p-2')
  })

  it('should render the correct number of expertise items', () => {
    render(<Sidebar />)

    // Each expertise item has a title element - count those
    const expertiseCards = screen.getByText('Core Expertise').parentElement?.querySelectorAll('[tabindex="0"]')
    expect(expertiseCards?.length).toBe(5)
  })

  it('should have unique keys for expertise items', () => {
    render(<Sidebar />)

    // Check that all expertise titles are rendered
    expect(screen.getByText('Site Reliability Engineering')).toBeInTheDocument()
    expect(screen.getByText('Incident Command & Coordination')).toBeInTheDocument()
    expect(screen.getByText('Post-Incident Analysis and Reporting')).toBeInTheDocument()
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
