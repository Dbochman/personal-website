
import { render, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { describe, expect, it, afterEach } from 'vitest'
import Seo from './Seo'

describe('Seo', () => {
  const renderWithHelmet = (component: React.ReactElement) => {
    return render(
      <HelmetProvider>
        {component}
      </HelmetProvider>
    )
  }

  afterEach(() => {
    // Clear any helmet modifications between tests
    const helmet = document.querySelector('title')
    if (helmet) helmet.textContent = ''
    
    document.querySelectorAll('meta[name], meta[property]').forEach(meta => {
      if (meta.getAttribute('name')?.startsWith('description') || 
          meta.getAttribute('name')?.startsWith('keywords') ||
          meta.getAttribute('property')?.startsWith('og:') ||
          meta.getAttribute('property')?.startsWith('twitter:')) {
        meta.remove()
      }
    })
  })

  it('should render title with site name', async () => {
    renderWithHelmet(
      <Seo title="Test Page" description="Test description" />
    )

    await waitFor(() => {
      const title = document.querySelector('title')
      expect(title?.textContent).toBe('Test Page | Dylan Bochman')
    })
  })

  it('should render description meta tag', async () => {
    const testDescription = 'This is a test description'
    renderWithHelmet(
      <Seo title="Test Page" description={testDescription} />
    )

    await waitFor(() => {
      const description = document.querySelector('meta[name="description"]')
      expect(description?.getAttribute('content')).toBe(testDescription)
    })
  })

  it('should render default keywords', async () => {
    renderWithHelmet(
      <Seo title="Test Page" description="Test description" />
    )

    await waitFor(() => {
      const keywords = document.querySelector('meta[name="keywords"]')
      const keywordsContent = keywords?.getAttribute('content')
      
      expect(keywordsContent).toContain('Site Reliability Engineering')
      expect(keywordsContent).toContain('SRE')
      expect(keywordsContent).toContain('Dylan Bochman')
      expect(keywordsContent).toContain('HashiCorp')
      expect(keywordsContent).toContain('Spotify')
    })
  })

  it('should include custom keywords with defaults', async () => {
    const customKeywords = ['React', 'TypeScript', 'Testing']
    renderWithHelmet(
      <Seo 
        title="Test Page" 
        description="Test description" 
        keywords={customKeywords}
      />
    )

    await waitFor(() => {
      const keywords = document.querySelector('meta[name="keywords"]')
      const keywordsContent = keywords?.getAttribute('content')
      
      // Should contain default keywords
      expect(keywordsContent).toContain('Site Reliability Engineering')
      expect(keywordsContent).toContain('Dylan Bochman')
      
      // Should contain custom keywords
      expect(keywordsContent).toContain('React')
      expect(keywordsContent).toContain('TypeScript')
      expect(keywordsContent).toContain('Testing')
    })
  })

  it('should render Open Graph meta tags with default values', async () => {
    const title = 'Test Page'
    const description = 'Test description'
    
    renderWithHelmet(
      <Seo title={title} description={description} />
    )

    await waitFor(() => {
      expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website')
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://dylanbochman.com')
      expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(`${title} | Dylan Bochman`)
      expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(description)
      expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://dylanbochman.com/social-preview.webp')
    })
  })

  it('should render Open Graph meta tags with custom values', async () => {
    const title = 'Custom Page'
    const description = 'Custom description'
    const imageUrl = '/custom-image.png'
    const url = '/custom-page'
    
    renderWithHelmet(
      <Seo 
        title={title} 
        description={description} 
        imageUrl={imageUrl}
        url={url}
      />
    )

    await waitFor(() => {
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://dylanbochman.com/custom-page')
      expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://dylanbochman.com/custom-image.png')
    })
  })

  it('should render Twitter meta tags with default values', async () => {
    const title = 'Test Page'
    const description = 'Test description'
    
    renderWithHelmet(
      <Seo title={title} description={description} />
    )

    await waitFor(() => {
      expect(document.querySelector('meta[property="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image')
      expect(document.querySelector('meta[property="twitter:url"]')?.getAttribute('content')).toBe('https://dylanbochman.com')
      expect(document.querySelector('meta[property="twitter:title"]')?.getAttribute('content')).toBe(`${title} | Dylan Bochman`)
      expect(document.querySelector('meta[property="twitter:description"]')?.getAttribute('content')).toBe(description)
      expect(document.querySelector('meta[property="twitter:image"]')?.getAttribute('content')).toBe('https://dylanbochman.com/social-preview.webp')
    })
  })

  it('should render Twitter meta tags with custom values', async () => {
    const title = 'Custom Page'
    const description = 'Custom description'
    const imageUrl = '/twitter-image.png'
    const url = '/twitter-page'
    
    renderWithHelmet(
      <Seo 
        title={title} 
        description={description} 
        imageUrl={imageUrl}
        url={url}
      />
    )

    await waitFor(() => {
      expect(document.querySelector('meta[property="twitter:url"]')?.getAttribute('content')).toBe('https://dylanbochman.com/twitter-page')
      expect(document.querySelector('meta[property="twitter:image"]')?.getAttribute('content')).toBe('https://dylanbochman.com/twitter-image.png')
    })
  })

  it('should handle all props correctly', async () => {
    const props = {
      title: 'Full Test',
      description: 'Complete test description',
      imageUrl: '/test-image.jpg',
      url: '/test-url',
      keywords: ['test', 'keyword']
    }
    
    renderWithHelmet(<Seo {...props} />)

    await waitFor(() => {
      // Verify title
      expect(document.querySelector('title')?.textContent).toBe('Full Test | Dylan Bochman')
      
      // Verify description
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(props.description)
      
      // Verify keywords include both default and custom
      const keywordsContent = document.querySelector('meta[name="keywords"]')?.getAttribute('content')
      expect(keywordsContent).toContain('test')
      expect(keywordsContent).toContain('keyword')
      expect(keywordsContent).toContain('Dylan Bochman')
      
      // Verify URLs are constructed correctly
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://dylanbochman.com/test-url')
      expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://dylanbochman.com/test-image.jpg')
    })
  })
})
