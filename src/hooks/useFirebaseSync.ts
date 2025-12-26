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
}

// Global flag - user has made a change this session
let userHasMadeChange = false;
let hasLoggedChange = false;

// Call this before dispatching any user action
export function markUserChange() {
  if (!userHasMadeChange && !hasLoggedChange) {
    hasLoggedChange = true;
    console.log('[Sync] User made change - saves will be enabled');
  }
  userHasMadeChange = true;
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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedStateRef = useRef<string>('');

  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;

  // Auth and subscription setup
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.log('[Sync] Firebase not configured');
      return;
    }

    let unsubscribeFirestore: Unsubscribe | null = null;

    const authUnsubscribe = onAuthChange(async (user) => {
      console.log('[Sync] Auth:', user ? user.uid : 'none');

      // Cleanup old subscription
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      userRef.current = user;

      if (!user) {
        setSyncStatus(prev => ({ ...prev, userId: null }));
        return;
      }

      setSyncStatus(prev => ({ ...prev, userId: user.uid }));

      // Reset the flag on login - fresh session
      userHasMadeChange = false;
      console.log('[Sync] Fresh session - saves disabled until user action');

      try {
        // Load initial state
        const cloudState = await loadAppState(user.uid);
        console.log('[Sync] Load result:', cloudState ? 'has data' : 'null/empty');
        if (cloudState) {
          console.log('[Sync] Loaded cloud state, tasks:', (cloudState as any)?.tasks?.items?.length || 0);
          lastSavedStateRef.current = JSON.stringify(cloudState);
          onRemoteUpdateRef.current(cloudState as Partial<AppState>);
          console.log('[Sync] Dispatched HYDRATE');
        }

        // Subscribe to updates
        unsubscribeFirestore = subscribeToAppState(user.uid, (remoteState) => {
          console.log('[Sync] Snapshot callback fired');
          if (!remoteState) {
            console.log('[Sync] No remote state in snapshot');
            return;
          }

          const remoteStr = JSON.stringify(remoteState);
          const remoteTasks = (remoteState as any)?.tasks?.items?.length || 0;
          console.log('[Sync] Snapshot has', remoteTasks, 'tasks');

          if (remoteStr === lastSavedStateRef.current) {
            console.log('[Sync] Ignoring echo (same as lastSaved)');
            return;
          }

          console.log('[Sync] NEW remote update - applying HYDRATE');
          lastSavedStateRef.current = remoteStr;
          onRemoteUpdateRef.current(remoteState as Partial<AppState>);
        });

      } catch (error) {
        console.error('[Sync] Error:', error);
        setSyncStatus(prev => ({ ...prev, error: 'Sync error' }));
      }
    });

    return () => {
      authUnsubscribe?.();
      unsubscribeFirestore?.();
    };
  }, []);

  // Save function
  const doSave = useCallback(async (userId: string, stateToSave: object) => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    const stateStr = JSON.stringify(stateToSave);
    const success = await saveAppState(userId, stateToSave);

    isSavingRef.current = false;

    if (success) {
      lastSavedStateRef.current = stateStr;
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSynced: new Date().toISOString(),
      }));
      console.log('[Sync] Saved');
    } else {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: 'Save failed' }));
    }
  }, []);

  // Watch for state changes
  useEffect(() => {
    if (!userRef.current || !isFirebaseConfigured()) return;

    // THE KEY CHECK: Only save if user has made a change
    if (!userHasMadeChange) {
      console.log('[Sync] No user change yet - skip save');
      return;
    }

    const stateStr = JSON.stringify(state);
    if (stateStr === lastSavedStateRef.current) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const userId = userRef.current.uid;
    console.log('[Sync] Scheduling save');

    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;

      // Double-check flag
      if (!userHasMadeChange) {
        console.log('[Sync] Save cancelled - no user change');
        return;
      }

      const currentStr = JSON.stringify(state);
      if (currentStr === lastSavedStateRef.current) {
        console.log('[Sync] Already in sync');
        return;
      }

      console.log('[Sync] Saving now');
      doSave(userId, state);
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [state, doSave]);

  return { ...syncStatus, isInitialLoadComplete: true };
}

export default useFirebaseSync;
