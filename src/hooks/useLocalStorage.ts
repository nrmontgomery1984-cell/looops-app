// Custom hook for syncing state with localStorage

import { useState, useEffect, useCallback } from "react";
import { getStorageItem, setStorageItem } from "../storage";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from storage or use provided initial
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getStorageItem(key, initialValue);
  });

  // Update state and storage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        setStorageItem(key, newValue);
        return newValue;
      });
    },
    [key]
  );

  // Sync across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
