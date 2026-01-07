// Firebase Sync Provider - Wraps AppProvider to add cloud sync
import React, { useCallback, useEffect, useRef } from 'react';
import { useApp, AppState } from './AppContext';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { isFirebaseConfigured } from '../services/firebase';

interface SyncContextValue {
  isInitialLoadComplete: boolean;
}

const SyncContext = React.createContext<SyncContextValue>({
  isInitialLoadComplete: false,
});

export function useSyncStatus() {
  return React.useContext(SyncContext);
}

interface FirebaseSyncProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

// Inner component that uses AppContext
function FirebaseSyncInner({ children, userId }: FirebaseSyncProviderProps) {
  console.log('[SyncProvider] FirebaseSyncInner rendering, userId:', userId);
  const { state, dispatch } = useApp();
  const prevUserIdRef = useRef<string | null>(null);

  // Reset state when user changes (switching accounts)
  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = userId;

    // If we had a previous user and now have a different user, reset state
    if (prevUserId !== null && userId !== null && prevUserId !== userId) {
      console.log('[SyncProvider] User changed from', prevUserId, 'to', userId, '- resetting state');
      dispatch({ type: 'RESET_STATE' });
    }
  }, [userId, dispatch]);

  // Extract persistable state (exclude UI)
  const { ui, ...persistableState } = state;

  // Handle remote updates
  const handleRemoteUpdate = useCallback((remoteState: Partial<AppState>) => {
    dispatch({ type: 'HYDRATE', payload: remoteState });
  }, [dispatch]);

  // Use Firebase sync with user-specific document ID
  const syncStatus = useFirebaseSync(persistableState, handleRemoteUpdate, userId);

  return (
    <SyncContext.Provider value={syncStatus}>
      {children}
    </SyncContext.Provider>
  );
}

// Wrapper that conditionally enables Firebase sync
export function FirebaseSyncProvider({ children, userId }: FirebaseSyncProviderProps) {
  const configured = isFirebaseConfigured();
  console.log('[SyncProvider] Firebase configured:', configured, 'userId:', userId);

  if (!configured) {
    console.log('[SyncProvider] Skipping sync - Firebase not configured');
    return (
      <SyncContext.Provider value={{ isInitialLoadComplete: true }}>
        {children}
      </SyncContext.Provider>
    );
  }

  return <FirebaseSyncInner userId={userId}>{children}</FirebaseSyncInner>;
}

export default FirebaseSyncProvider;
