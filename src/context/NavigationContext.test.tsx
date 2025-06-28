import { render, renderHook } from '@testing-library/react'
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

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        renderHook(() => useNavigation())
      }).toThrow('useNavigation must be used within a NavigationProvider')
      
      consoleSpy.mockRestore()
    })

    it('should provide access to openExperienceAccordion function', () => {
      const TestComponent = () => {
        const { openExperienceAccordion } = useNavigation()
        return (
          <button onClick={openExperienceAccordion} data-testid="trigger-button">
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
    it('should create context with undefined default value', () => {
      expect(NavigationContext._currentValue).toBeUndefined()
    })

    it('should allow provider to pass values to consumers', () => {
      const TestConsumer = () => {
        const context = useNavigation()
        return <div data-testid="context-value">{typeof context.openExperienceAccordion}</div>
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