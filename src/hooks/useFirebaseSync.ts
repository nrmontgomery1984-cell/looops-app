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
  });

  const userRef = useRef<User | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isInitialMount = useRef(true);
  const lastSyncedState = useRef<string>('');

  // Sign in and set up subscription
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, skipping cloud sync');
      return;
    }

    let authUnsubscribe: Unsubscribe | null = null;

    const initAuth = async () => {
      // Listen for auth changes
      authUnsubscribe = onAuthChange(async (user) => {
        userRef.current = user;

        if (user) {
          setSyncStatus((prev) => ({ ...prev, userId: user.uid }));

          // Load initial state from cloud
          const cloudState = await loadAppState(user.uid);
          if (cloudState) {
            console.log('Loaded state from cloud');
            onRemoteUpdate(cloudState as Partial<AppState>);
          }

          // Subscribe to real-time updates
          unsubscribeRef.current = subscribeToAppState(user.uid, (remoteState) => {
            if (remoteState) {
              // Check if this is a remote update (not our own save)
              const remoteJson = JSON.stringify(remoteState);
              if (remoteJson !== lastSyncedState.current) {
                console.log('Received remote update');
                onRemoteUpdate(remoteState as Partial<AppState>);
                lastSyncedState.current = remoteJson;
              }
            }
          });
        } else {
          setSyncStatus((prev) => ({ ...prev, userId: null }));
        }
      });

      // Sign in anonymously if needed
      const user = await signInAnonymouslyIfNeeded();
      if (user) {
        console.log('Signed in as:', user.uid);
      }
    };

    initAuth();

    return () => {
      authUnsubscribe?.();
      unsubscribeRef.current?.();
    };
  }, [onRemoteUpdate]);

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
