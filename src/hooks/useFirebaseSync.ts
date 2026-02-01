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
  onRemoteUpdate: (state: Partial<AppState>) => void,
  userId: string | null
) {
  const userRef = useRef<User | null>(null);
  const versionRef = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable reference to callback
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;

  // Use the authenticated user's ID for per-user data isolation
  const syncId = userId;

  // Save to cloud
  const save = useCallback(async () => {
    const user = userRef.current;
    if (!user || !syncId) {
      console.log('[Sync] No user or syncId, cannot save');
      return;
    }

    versionRef.current += 1;
    console.log('[Sync] Saving, version:', versionRef.current);
    const success = await saveState(syncId, state, versionRef.current);
    console.log('[Sync] Save result:', success);
  }, [state, syncId]);

  // Auth and initial load - re-run when userId changes
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.log('[Sync] Firebase not configured');
      return;
    }

    if (!syncId) {
      console.log('[Sync] No syncId (user not authenticated), skipping sync');
      return;
    }

    console.log('[Sync] Starting sync for user:', syncId);
    let unsubscribeFirestore: Unsubscribe | null = null;

    const setupSync = async (user: User) => {
      userRef.current = user;
      console.log('[Sync] Using sync ID:', syncId, '(auth uid:', user.uid, ')');

      // Reset on new session
      userMadeChange = false;
      versionRef.current = 0;
      console.log('[Sync] Session started, saves disabled until user action');

      // Load initial state for this user
      console.log('[Sync] Loading state for:', syncId);
      const result = await loadState(syncId);
      if (result) {
        versionRef.current = result.version;
        console.log('[Sync] Loaded state, version:', result.version);
        onRemoteUpdateRef.current(result.state as Partial<AppState>);
      } else {
        console.log('[Sync] No existing state in cloud for this user');
        // Check if local state has valid data that should be synced
        // This handles the case where user completed onboarding before sync was set up
        const localPrototype = (state as { user?: { prototype?: unknown } })?.user?.prototype;
        if (localPrototype) {
          console.log('[Sync] Local state has prototype, uploading to cloud');
          versionRef.current = 1;
          const success = await saveState(syncId, state, versionRef.current);
          console.log('[Sync] Initial upload result:', success);
        }
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
    };

    const unsubscribeAuth = onAuthChange(async (user) => {
      console.log('[Sync] Auth state:', user ? user.uid : 'null');

      // Cleanup previous subscription
      unsubscribeFirestore?.();
      unsubscribeFirestore = null;

      // If no Firebase auth user, try anonymous sign-in for Firestore access
      if (!user) {
        console.log('[Sync] No Firebase user, signing in anonymously for Firestore access');
        const anonUser = await signInAnonymouslyIfNeeded();
        if (anonUser) {
          await setupSync(anonUser);
        }
        return;
      }

      await setupSync(user);
    });

    return () => {
      unsubscribeAuth?.();
      unsubscribeFirestore?.();
    };
  }, [syncId]);

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
