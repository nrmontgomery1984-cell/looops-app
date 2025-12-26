// Firebase sync hook - simple bidirectional sync
import { useEffect, useRef, useCallback } from 'react';
import { User, Unsubscribe } from 'firebase/auth';
import {
  isFirebaseConfigured,
  onAuthChange,
  saveState,
  loadState,
  subscribeToState,
  signInAnonymouslyIfNeeded,
} from '../services/firebase';
import { AppState } from '../context/AppContext';

// Track if user has made a change this session (prevents overwriting cloud on load)
let userMadeChange = false;

export function markUserChange() {
  userMadeChange = true;
}

export function useFirebaseSync(
  state: Omit<AppState, 'ui'>,
  onRemoteUpdate: (state: Partial<AppState>) => void
) {
  const userRef = useRef<User | null>(null);
  const versionRef = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable reference to callback
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;

  // Shared document ID for all devices
  const syncId = 'shared-user';

  // Save to cloud
  const save = useCallback(async () => {
    const user = userRef.current;
    if (!user) {
      console.log('[Sync] No user, cannot save');
      return;
    }

    versionRef.current += 1;
    console.log('[Sync] Saving, version:', versionRef.current);
    const success = await saveState(syncId, state, versionRef.current);
    console.log('[Sync] Save result:', success);
  }, [state]);

  // Auth and initial load
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.log('[Sync] Firebase not configured');
      return;
    }

    console.log('[Sync] Starting auth flow');
    let unsubscribeFirestore: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthChange(async (user) => {
      console.log('[Sync] Auth state:', user ? user.uid : 'null');

      // Cleanup previous subscription
      unsubscribeFirestore?.();
      unsubscribeFirestore = null;

      // If no user, try anonymous sign-in
      if (!user) {
        console.log('[Sync] No user, signing in anonymously');
        await signInAnonymouslyIfNeeded();
        return; // Auth callback will fire again with the new user
      }

      userRef.current = user;
      console.log('[Sync] Using sync ID:', syncId, '(auth uid:', user.uid, ')');

      // Reset on new session
      userMadeChange = false;
      console.log('[Sync] Session started, saves disabled until user action');

      // Load initial state
      console.log('[Sync] Loading state');
      const result = await loadState(syncId);
      if (result) {
        versionRef.current = result.version;
        console.log('[Sync] Loaded state, version:', result.version);
        onRemoteUpdateRef.current(result.state as Partial<AppState>);
      } else {
        console.log('[Sync] No existing state in cloud');
      }

      // Subscribe to remote changes
      console.log('[Sync] Subscribing to remote changes');
      unsubscribeFirestore = subscribeToState(syncId, (remoteState, remoteVersion) => {
        console.log('[Sync] Remote update, version:', remoteVersion, 'local:', versionRef.current);
        // Only apply if remote is newer
        if (remoteVersion > versionRef.current) {
          console.log('[Sync] Applying remote update');
          versionRef.current = remoteVersion;
          onRemoteUpdateRef.current(remoteState as Partial<AppState>);
        }
      });
    });

    return () => {
      unsubscribeAuth?.();
      unsubscribeFirestore?.();
    };
  }, []);

  // Save on state change (debounced)
  useEffect(() => {
    if (!userRef.current) {
      return;
    }

    if (!userMadeChange) {
      return;
    }

    // Clear pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    console.log('[Sync] Scheduling save');

    // Debounce save by 1 second
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      save();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, save]);

  return { isInitialLoadComplete: true };
}

export default useFirebaseSync;
