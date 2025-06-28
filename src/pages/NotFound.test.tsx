import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from './NotFound'

// Mock the Seo component
vi.mock('@/components/Seo', () => ({
  default: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="seo-mock" data-title={title} data-description={description} />
  ),
}))

describe('NotFound', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render 404 error message', () => {
    render(
      <MemoryRouter initialEntries={['/non-existent-page']}>
        <NotFound />
      </MemoryRouter>
    )

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument()
  })

  it('should render return to home link', () => {
    render(
      <MemoryRouter initialEntries={['/non-existent-page']}>
        <NotFound />
      </MemoryRouter>
    )

    const homeLink = screen.getByText('Return to Home')
    expect(homeLink).toBeInTheDocument()
    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('should log error to console with pathname', () => {
    const consoleSpy = vi.spyOn(console, 'error')
    const testPath = '/some/invalid/path'

    render(
      <MemoryRouter initialEntries={[testPath]}>
        <NotFound />
      </MemoryRouter>
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      testPath
    )
  })

  it('should render SEO component with correct props', () => {
    render(
      <MemoryRouter initialEntries={['/non-existent-page']}>
        <NotFound />
      </MemoryRouter>
    )

    const seoComponent = screen.getByTestId('seo-mock')
    expect(seoComponent).toHaveAttribute('data-title', '404: Page Not Found')
    expect(seoComponent).toHaveAttribute('data-description', 'The page you are looking for does not exist.')
  })

  it('should have proper styling classes', () => {
    render(
      <MemoryRouter initialEntries={['/non-existent-page']}>
        <NotFound />
      </MemoryRouter>
    )

    const container = screen.getByText('404').closest('div')?.parentElement
    expect(container).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-gray-100')

    const heading = screen.getByText('404')
    expect(heading).toHaveClass('text-4xl', 'font-bold', 'mb-4')

    const paragraph = screen.getByText('Oops! Page not found')
    expect(paragraph).toHaveClass('text-xl', 'text-gray-600', 'mb-4')

    const link = screen.getByText('Return to Home')
    expect(link).toHaveClass('text-blue-500', 'hover:text-blue-700', 'underline')
  })

  it('should log different paths separately', () => {
    const consoleSpy = vi.spyOn(console, 'error')
    
    // Render first path
    const { unmount } = render(
      <MemoryRouter initialEntries={['/first-path']}>
        <NotFound />
      </MemoryRouter>
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      '/first-path'
    )

    consoleSpy.mockClear()
    unmount()

    // Render second path in new component
    render(
      <MemoryRouter initialEntries={['/second-path']}>
        <NotFound />
      </MemoryRouter>
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      '/second-path'
    )
  })
})