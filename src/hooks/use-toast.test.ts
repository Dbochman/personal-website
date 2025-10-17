import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast, toast, reducer } from './use-toast'

// Mock setTimeout and clearTimeout
vi.useFakeTimers()

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    // Reset the module state by clearing all toasts
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.toasts.forEach(t => result.current.dismiss(t.id))
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('useToast hook', () => {
    it('should start with empty toasts array', () => {
      const { result } = renderHook(() => useToast())
      expect(result.current.toasts).toEqual([])
    })

    it('should add a toast when toast function is called', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'Test Description'
        })
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].title).toBe('Test Toast')
      expect(result.current.toasts[0].description).toBe('Test Description')
      expect(result.current.toasts[0].open).toBe(true)
    })

    it('should dismiss a specific toast', () => {
      const { result } = renderHook(() => useToast())
      
      let toastId: string
      act(() => {
        const toastResult = result.current.toast({ title: 'Test Toast' })
        toastId = toastResult.id
      })

      expect(result.current.toasts[0].open).toBe(true)

      act(() => {
        result.current.dismiss(toastId)
      })

      expect(result.current.toasts[0].open).toBe(false)
    })

    it('should dismiss all toasts when no toastId provided', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({ title: 'Toast 1' })
      })

      // Only one toast due to TOAST_LIMIT = 1
      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].open).toBe(true)

      act(() => {
        result.current.dismiss()
      })

      expect(result.current.toasts[0].open).toBe(false)
    })

    it('should limit toasts to TOAST_LIMIT', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({ title: 'Toast 1' })
        result.current.toast({ title: 'Toast 2' })
        result.current.toast({ title: 'Toast 3' })
      })

      // Should only keep the most recent toast (TOAST_LIMIT = 1)
      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].title).toBe('Toast 3')
    })

    it('should auto-remove toasts after delay when dismissed', () => {
      const { result } = renderHook(() => useToast())
      
      let toastId: string
      act(() => {
        const toastResult = result.current.toast({ title: 'Test Toast' })
        toastId = toastResult.id
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        result.current.dismiss(toastId)
      })

      // Toast should be marked as closed but still in array
      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].open).toBe(false)

      // Fast forward time to trigger removal
      act(() => {
        vi.advanceTimersByTime(1000000)
      })

      // Toast should be removed from array
      expect(result.current.toasts).toHaveLength(0)
    })
  })

  describe('toast function', () => {
    it('should return toast controls', () => {
      const result = toast({ title: 'Test' })
      
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('dismiss')
      expect(result).toHaveProperty('update')
      expect(typeof result.id).toBe('string')
      expect(typeof result.dismiss).toBe('function')
      expect(typeof result.update).toBe('function')
    })

    it('should update toast properties', () => {
      const { result } = renderHook(() => useToast())
      
      let toastControls: any
      act(() => {
        toastControls = result.current.toast({ title: 'Original Title' })
      })

      expect(result.current.toasts[0].title).toBe('Original Title')

      act(() => {
        toastControls.update({ title: 'Updated Title', description: 'New Description' })
      })

      expect(result.current.toasts[0].title).toBe('Updated Title')
      expect(result.current.toasts[0].description).toBe('New Description')
    })

    it('should dismiss toast via returned dismiss function', () => {
      const { result } = renderHook(() => useToast())
      
      let toastControls: any
      act(() => {
        toastControls = result.current.toast({ title: 'Test' })
      })

      expect(result.current.toasts[0].open).toBe(true)

      act(() => {
        toastControls.dismiss()
      })

      expect(result.current.toasts[0].open).toBe(false)
    })

    it('should handle onOpenChange callback', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({ title: 'Test' })
      })

      const toast = result.current.toasts[0]
      expect(toast.open).toBe(true)

      // Simulate onOpenChange being called with false
      act(() => {
        toast.onOpenChange?.(false)
      })

      expect(result.current.toasts[0].open).toBe(false)
    })
  })

  describe('reducer', () => {
    const initialState = { toasts: [] }

    it('should handle ADD_TOAST action', () => {
      const toast = { id: '1', title: 'Test', open: true }
      const action = { type: 'ADD_TOAST' as const, toast }
      
      const newState = reducer(initialState, action)
      
      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0]).toEqual(toast)
    })

    it('should handle UPDATE_TOAST action', () => {
      const initialToast = { id: '1', title: 'Original', open: true }
      const state = { toasts: [initialToast] }
      const action = { 
        type: 'UPDATE_TOAST' as const, 
        toast: { id: '1', title: 'Updated' } 
      }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts[0].title).toBe('Updated')
      expect(newState.toasts[0].open).toBe(true) // Should preserve other props
    })

    it('should handle DISMISS_TOAST action with specific ID', () => {
      const state = { 
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true }
        ] 
      }
      const action = { type: 'DISMISS_TOAST' as const, toastId: '1' }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts[0].open).toBe(false)
      expect(newState.toasts[1].open).toBe(true)
    })

    it('should handle DISMISS_TOAST action without ID (dismiss all)', () => {
      const state = { 
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true }
        ] 
      }
      const action = { type: 'DISMISS_TOAST' as const }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts.every(t => !t.open)).toBe(true)
    })

    it('should handle REMOVE_TOAST action with specific ID', () => {
      const state = { 
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true }
        ] 
      }
      const action = { type: 'REMOVE_TOAST' as const, toastId: '1' }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0].id).toBe('2')
    })

    it('should handle REMOVE_TOAST action without ID (remove all)', () => {
      const state = { 
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true }
        ] 
      }
      const action = { type: 'REMOVE_TOAST' as const, toastId: undefined }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts).toHaveLength(0)
    })
  })
})