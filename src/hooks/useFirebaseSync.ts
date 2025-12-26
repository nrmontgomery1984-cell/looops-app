// Firebase sync hook for cloud data persistence
import { useEffect, useRef, useState, useCallback } from 'react';
import { User, Unsubscribe } from 'firebase/auth';
import {
  isFirebaseConfigured,
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
    let masterTimeoutId: NodeJS.Timeout | null = null;
    let isComplete = false;
    let currentSubscribeUnsubscribe: Unsubscribe | null = null;

    // Helper to mark complete only once
    const markComplete = (reason: string) => {
      if (!isComplete) {
        isComplete = true;
        console.log(`Initial load complete: ${reason}`);
        setSyncStatus((prev) => ({ ...prev, isInitialLoadComplete: true }));
      }
    };

    // Master timeout - no matter what happens, mark complete after 3 seconds
    masterTimeoutId = setTimeout(() => {
      markComplete('master timeout (3s)');
    }, 3000);

    const initAuth = async () => {
      // Listen for auth changes - this fires on every auth state change (login, logout, user switch)
      authUnsubscribe = onAuthChange(async (user) => {
        console.log('Auth state changed:', user ? `User ${user.uid} (${user.email || 'anonymous'})` : 'No user');

        // Clean up previous subscription when user changes
        if (currentSubscribeUnsubscribe) {
          currentSubscribeUnsubscribe();
          currentSubscribeUnsubscribe = null;
        }

        userRef.current = user;

        if (user) {
          setSyncStatus((prev) => ({ ...prev, userId: user.uid, error: null }));

          try {
            // Race the Firestore load against a 2 second timeout
            const loadPromise = loadAppState(user.uid);
            const timeoutPromise = new Promise<null>((resolve) => {
              setTimeout(() => resolve(null), 2000);
            });

            const cloudState = await Promise.race([loadPromise, timeoutPromise]);
            if (cloudState) {
              console.log('Loaded state from cloud for user:', user.uid);
              onRemoteUpdateRef.current(cloudState as Partial<AppState>);
              lastSyncedState.current = JSON.stringify(cloudState);
            } else {
              console.log('No cloud state found for user:', user.uid);
            }

            // Subscribe to real-time updates (non-blocking)
            currentSubscribeUnsubscribe = subscribeToAppState(user.uid, (remoteState) => {
              if (remoteState) {
                const remoteJson = JSON.stringify(remoteState);
                if (remoteJson !== lastSyncedState.current) {
                  console.log('Received remote update for user:', user.uid);
                  onRemoteUpdateRef.current(remoteState as Partial<AppState>);
                  lastSyncedState.current = remoteJson;
                }
              }
            });
            unsubscribeRef.current = currentSubscribeUnsubscribe;
          } catch (error) {
            console.error('Error loading cloud state:', error);
            setSyncStatus((prev) => ({ ...prev, error: 'Failed to load from cloud' }));
          }

          markComplete('Firestore load done');
        } else {
          setSyncStatus((prev) => ({ ...prev, userId: null }));
          markComplete('no user');
        }
      });

      // Don't automatically sign in anonymously - let the user choose to sign in
      // This prevents creating orphan anonymous accounts
    };

    initAuth();

    return () => {
      if (masterTimeoutId) clearTimeout(masterTimeoutId);
      authUnsubscribe?.();
      if (currentSubscribeUnsubscribe) currentSubscribeUnsubscribe();
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
      console.log('[Sync] Skipping initial mount save');
      return;
    }

    // Skip if no user or Firebase not configured
    if (!userRef.current) {
      console.log('[Sync] No user, skipping save');
      return;
    }

    if (!isFirebaseConfigured()) {
      console.log('[Sync] Firebase not configured, skipping save');
      return;
    }

    // Save to cloud (debounced)
    console.log('[Sync] Triggering debounced save for user:', userRef.current.uid);
    debouncedSave(userRef.current.uid, state);
  }, [state, debouncedSave]);

  return syncStatus;
}

export default useFirebaseSync;
