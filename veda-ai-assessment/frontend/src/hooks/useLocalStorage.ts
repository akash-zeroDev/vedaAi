import { useState, useEffect, useCallback } from 'react';

/**
 * A useState drop-in that persists the value in localStorage.
 * Safe for SSR — reads from localStorage only after mount.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (e) {
      console.warn(`[useLocalStorage] Failed to read "${key}"`, e);
    }
    setHydrated(true);
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        try {
          if (next === null || next === undefined) {
            window.localStorage.removeItem(key);
          } else {
            window.localStorage.setItem(key, JSON.stringify(next));
          }
        } catch (e) {
          console.warn(`[useLocalStorage] Failed to write "${key}"`, e);
        }
        return next;
      });
    },
    [key]
  );

  const clearValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[useLocalStorage] Failed to clear "${key}"`, e);
    }
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, clearValue];
}
