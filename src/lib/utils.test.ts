
import { describe, it, expect, vi } from 'vitest'
import { cn, throttle } from './utils'

describe('utils', () => {
  it('throttles a typed callback while preserving its argument tuple', () => {
    const callback = vi.fn<(event: { id: string }, count: number) => void>()
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000)
    try {
      const throttled = throttle(callback, 100)
      throttled({ id: 'first' }, 1)
      now.mockReturnValue(1050)
      throttled({ id: 'skipped' }, 2)
      now.mockReturnValue(1100)
      throttled({ id: 'next' }, 3)
      expect(callback.mock.calls).toEqual([[{ id: 'first' }, 1], [{ id: 'next' }, 3]])
    } finally {
      now.mockRestore()
    }
  })

  describe('cn function', () => {
    it('should merge single class name', () => {
      const result = cn('bg-red-500')
      expect(result).toBe('bg-red-500')
    })

    it('should merge multiple class names', () => {
      const result = cn('bg-red-500', 'text-white', 'p-4')
      expect(result).toBe('bg-red-500 text-white p-4')
    })

    it('should handle conditional classes with clsx', () => {
      const isActive = true
      const isDisabled = false
      
      const result = cn('base-class', {
        'active-class': isActive,
        'disabled-class': isDisabled
      })
      
      expect(result).toBe('base-class active-class')
    })

    it('should merge conflicting Tailwind classes with twMerge', () => {
      const result = cn('p-4', 'p-6')
      expect(result).toBe('p-6') // twMerge should keep the last conflicting class
    })

    it('should handle array of classes', () => {
      const result = cn(['bg-blue-500', 'text-white'], 'p-4')
      expect(result).toBe('bg-blue-500 text-white p-4')
    })

    it('should handle undefined and null values', () => {
      const result = cn('bg-red-500', undefined, null, 'text-white')
      expect(result).toBe('bg-red-500 text-white')
    })

    it('should handle empty strings', () => {
      const result = cn('bg-red-500', '', 'text-white')
      expect(result).toBe('bg-red-500 text-white')
    })

    it('should handle complex Tailwind merging scenarios', () => {
      // Test that conflicting classes are properly merged
      const result = cn('bg-red-500 bg-blue-500', 'text-white text-black')
      expect(result).toBe('bg-blue-500 text-black')
    })

    it('should handle no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle mixed input types', () => {
      const result = cn(
        'base-class',
        ['array-class'],
        { 'conditional-class': true, 'false-class': false },
        'final-class'
      )
      expect(result).toBe('base-class array-class conditional-class final-class')
    })

    it('should handle responsive and state modifiers', () => {
      const result = cn(
        'text-sm md:text-lg',
        'hover:bg-blue-500 focus:bg-blue-600',
        'hover:bg-red-500' // Should override the previous hover class
      )
      expect(result).toBe('text-sm md:text-lg focus:bg-blue-600 hover:bg-red-500')
    })

    it('should handle variant combinations', () => {
      type Size = 'sm' | 'md' | 'lg'
      type Variant = 'primary' | 'secondary'
      
      const classesFor = (size: Size, variant: Variant) => cn(
        'button-base',
        {
          'text-sm p-2': size === 'sm',
          'text-base p-3': size === 'md',
          'text-lg p-4': size === 'lg'
        },
        {
          'bg-blue-500 text-white': variant === 'primary',
          'bg-gray-500 text-white': variant === 'secondary'
        }
      )
      
      expect(classesFor('lg', 'primary')).toBe('button-base text-lg p-4 bg-blue-500 text-white')
      expect(classesFor('sm', 'secondary')).toBe('button-base text-sm p-2 bg-gray-500 text-white')
    })
  })
})
