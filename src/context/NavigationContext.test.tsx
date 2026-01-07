
import { render, renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NavigationContext, useNavigation } from './NavigationContext'

describe('NavigationContext', () => {
  const mockOpenExperienceAccordion = vi.fn()
  
  const TestProvider = ({ children }: { children: React.ReactNode }) => (
    <NavigationContext.Provider value={{ openExperienceAccordion: mockOpenExperienceAccordion }}>
      {children}
    </NavigationContext.Provider>
  )

  beforeEach(() => {
    mockOpenExperienceAccordion.mockClear()
  })

  describe('useNavigation', () => {
    it('should return context value when used within provider', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: TestProvider,
      })

      expect(result.current).toEqual({
        openExperienceAccordion: mockOpenExperienceAccordion,
      })
    })

    it('should return undefined when used outside provider', () => {
      const { result } = renderHook(() => useNavigation())

      expect(result.current).toBeUndefined()
    })

    it('should provide access to openExperienceAccordion function', () => {
      const TestComponent = () => {
        const navigation = useNavigation()
        return (
          <button onClick={navigation?.openExperienceAccordion} data-testid="trigger-button">
            Open Experience
          </button>
        )
      }

      const { getByTestId } = render(
        <TestProvider>
          <TestComponent />
        </TestProvider>
      )

      const button = getByTestId('trigger-button')
      button.click()

      expect(mockOpenExperienceAccordion).toHaveBeenCalledTimes(1)
    })
  })

  describe('NavigationContext', () => {
    it('should return undefined when used without provider', () => {
      // Test that context returns undefined without provider instead of throwing
      const TestConsumer = () => {
        const context = useNavigation()
        return <div data-testid="context-result">{context === undefined ? 'undefined' : 'defined'}</div>
      }

      const { getByTestId } = render(<TestConsumer />)
      expect(getByTestId('context-result')).toHaveTextContent('undefined')
    })

    it('should allow provider to pass values to consumers', () => {
      const TestConsumer = () => {
        const context = useNavigation()
        return <div data-testid="context-value">{typeof context?.openExperienceAccordion}</div>
      }

      const { getByTestId } = render(
        <TestProvider>
          <TestConsumer />
        </TestProvider>
      )

      expect(getByTestId('context-value')).toHaveTextContent('function')
    })
  })
})
