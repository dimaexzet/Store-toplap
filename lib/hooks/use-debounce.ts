import { useState, useEffect } from 'react'

/**
 * A custom hook that returns a debounced value after a specified delay
 * Useful for preventing too many API calls on rapidly changing inputs
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if the value changes before the delay expires
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
} 