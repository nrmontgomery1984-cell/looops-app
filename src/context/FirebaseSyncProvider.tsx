// Firebase Sync Provider - Wraps AppProvider to add cloud sync
import React, { useCallback, useEffect, useState } from 'react';
import { useApp, AppState } from './AppContext';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { isFirebaseConfigured } from '../services/firebase';

interface SyncContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;
  userId: string | null;
}

const SyncContext = React.createContext<SyncContextValue>({
  isOnline: false,
  isSyncing: false,
  lastSynced: null,
  error: null,
  userId: null,
});

export function useSyncStatus() {
  return React.useContext(SyncContext);
}

// Inner component that uses AppContext
function FirebaseSyncInner({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp();
  const [isHydrated, setIsHydrated] = useState(false);

  // Extract persistable state (exclude UI)
  const { ui, ...persistableState } = state;

  // Handle remote updates
  const handleRemoteUpdate = useCallback((remoteState: Partial<AppState>) => {
    // Only apply remote update if we haven't hydrated yet or if it's newer
    dispatch({ type: 'HYDRATE', payload: remoteState });
  }, [dispatch]);

  // Use Firebase sync
  const syncStatus = useFirebaseSync(persistableState, handleRemoteUpdate);

  // Mark as hydrated after initial load
  useEffect(() => {
    if (syncStatus.userId && !isHydrated) {
      setIsHydrated(true);
    }
  }, [syncStatus.userId, isHydrated]);

  return (
    <SyncContext.Provider value={syncStatus}>
      {children}
    </SyncContext.Provider>
  );
}

// Wrapper that conditionally enables Firebase sync
export function FirebaseSyncProvider({ children }: { children: React.ReactNode }) {
  if (!isFirebaseConfigured()) {
    // Firebase not configured, just render children without sync
    return (
      <SyncContext.Provider value={{
        isOnline: false,
        isSyncing: false,
        lastSynced: null,
        error: null,
        userId: null,
      }}>
        {children}
      </SyncContext.Provider>
    );
  }

  return <FirebaseSyncInner>{children}</FirebaseSyncInner>;
}

export default FirebaseSyncProvider;
