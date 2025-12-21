// Firebase sync hook for cloud data persistence
import { useEffect, useRef, useState, useCallback } from 'react';
import { User, Unsubscribe } from 'firebase/auth';
import {
  isFirebaseConfigured,
  signInAnonymouslyIfNeeded,
  onAuthChange,
  saveAppState,
  loadAppState,
  subscribeToAppState,
} from '../services/firebase';
import { AppState } from '../context/AppContext';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;
  userId: string | null;
  isInitialLoadComplete: boolean;
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function useFirebaseSync(
  state: Omit<AppState, 'ui'>,
  onRemoteUpdate: (state: Partial<AppState>) => void
) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: isFirebaseConfigured(),
    isSyncing: false,
    lastSynced: null,
    error: null,
    userId: null,
    isInitialLoadComplete: false,
  });

  const userRef = useRef<User | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isInitialMount = useRef(true);
  const lastSyncedState = useRef<string>('');

  // Store callback in ref to avoid re-running effect when callback changes
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;

  // Sign in and set up subscription - only run once
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, skipping cloud sync');
      // Mark as complete since there's nothing to sync
      setSyncStatus((prev) => ({ ...prev, isInitialLoadComplete: true }));
      return;
    }

    let authUnsubscribe: Unsubscribe | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const initAuth = async () => {
      // Set a timeout - if we don't get auth state in 5 seconds, mark as complete anyway
      timeoutId = setTimeout(() => {
        console.log('Auth timeout - marking initial load complete');
        setSyncStatus((prev) => {
          if (!prev.isInitialLoadComplete) {
            return { ...prev, isInitialLoadComplete: true, error: 'Sync timeout' };
          }
          return prev;
        });
      }, 5000);

      // Listen for auth changes
      authUnsubscribe = onAuthChange(async (user) => {
        // Clear timeout since we got auth state
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        userRef.current = user;

        if (user) {
          setSyncStatus((prev) => ({ ...prev, userId: user.uid, isInitialLoadComplete: false }));

          try {
            // Load initial state from cloud
            const cloudState = await loadAppState(user.uid);
            if (cloudState) {
              console.log('Loaded state from cloud');
              onRemoteUpdateRef.current(cloudState as Partial<AppState>);
            }

            // Subscribe to real-time updates
            unsubscribeRef.current = subscribeToAppState(user.uid, (remoteState) => {
              if (remoteState) {
                // Check if this is a remote update (not our own save)
                const remoteJson = JSON.stringify(remoteState);
                if (remoteJson !== lastSyncedState.current) {
                  console.log('Received remote update');
                  onRemoteUpdateRef.current(remoteState as Partial<AppState>);
                  lastSyncedState.current = remoteJson;
                }
              }
            });
          } catch (error) {
            console.error('Error loading cloud state:', error);
          }

          // Mark initial load as complete (even if cloud load failed)
          setSyncStatus((prev) => ({ ...prev, isInitialLoadComplete: true }));
        } else {
          // No user - mark complete anyway so app can proceed
          setSyncStatus((prev) => ({ ...prev, userId: null, isInitialLoadComplete: true }));
        }
      });

      // Try to sign in anonymously (for users who aren't signed in yet)
      // This may fail if anonymous auth is disabled, which is fine
      try {
        const user = await signInAnonymouslyIfNeeded();
        if (user) {
          console.log('Signed in as:', user.uid);
        }
      } catch (error) {
        console.log('Anonymous sign-in not available:', error);
        // Mark as complete anyway
        setSyncStatus((prev) => {
          if (!prev.isInitialLoadComplete) {
            return { ...prev, isInitialLoadComplete: true };
          }
          return prev;
        });
      }
    };

    initAuth();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      authUnsubscribe?.();
      unsubscribeRef.current?.();
    };
  }, []); // Empty dependency array - only run once

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (userId: string, stateToSave: object) => {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

      const stateJson = JSON.stringify(stateToSave);
      lastSyncedState.current = stateJson;

      const success = await saveAppState(userId, stateToSave);

      if (success) {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSynced: new Date().toISOString(),
        }));
      } else {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          error: 'Failed to sync',
        }));
      }
    }, 2000), // 2 second debounce
    []
  );

  // Sync state to cloud when it changes
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip if no user or Firebase not configured
    if (!userRef.current || !isFirebaseConfigured()) {
      return;
    }

    // Save to cloud (debounced)
    debouncedSave(userRef.current.uid, state);
  }, [state, debouncedSave]);

  return syncStatus;
}

export default useFirebaseSync;
