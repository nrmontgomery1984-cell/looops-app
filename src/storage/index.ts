// Local storage abstraction layer

const STORAGE_PREFIX = "looops_";

export const STORAGE_KEYS = {
  USER_PROFILE: `${STORAGE_PREFIX}user_profile`,
  USER_PROTOTYPE: `${STORAGE_PREFIX}user_prototype`,
  LOOP_STATES: `${STORAGE_PREFIX}loop_states`,
  TASKS: `${STORAGE_PREFIX}tasks`,
  GOALS: `${STORAGE_PREFIX}goals`,
  CHALLENGES: `${STORAGE_PREFIX}challenges`,
  CASCADE_RULES: `${STORAGE_PREFIX}cascade_rules`,
  ONBOARDING_COMPLETE: `${STORAGE_PREFIX}onboarding_complete`,
  APP_STATE: `${STORAGE_PREFIX}app_state`,
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

// Generic storage functions
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

// Clear all Looops data
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeStorageItem(key);
  });
}

// Check if onboarding is complete
export function isOnboardingComplete(): boolean {
  return getStorageItem(STORAGE_KEYS.ONBOARDING_COMPLETE, false);
}

// Mark onboarding as complete
export function setOnboardingComplete(complete: boolean): void {
  setStorageItem(STORAGE_KEYS.ONBOARDING_COMPLETE, complete);
}
