// Firebase Sync Provider - Wraps AppProvider to add cloud sync
import React, { useCallback } from 'react';
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

// Inner component that uses AppContext
function FirebaseSyncInner({ children }: { children: React.ReactNode }) {
  console.log('[SyncProvider] FirebaseSyncInner rendering');
  const { state, dispatch } = useApp();

  // Extract persistable state (exclude UI)
  const { ui, ...persistableState } = state;

  // Handle remote updates
  const handleRemoteUpdate = useCallback((remoteState: Partial<AppState>) => {
    dispatch({ type: 'HYDRATE', payload: remoteState });
  }, [dispatch]);

  // Use Firebase sync
  const syncStatus = useFirebaseSync(persistableState, handleRemoteUpdate);

  return (
    <SyncContext.Provider value={syncStatus}>
      {children}
    </SyncContext.Provider>
  );
}

// Wrapper that conditionally enables Firebase sync
export function FirebaseSyncProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  console.log('[SyncProvider] Firebase configured:', configured);

  if (!configured) {
    console.log('[SyncProvider] Skipping sync - Firebase not configured');
    return (
      <SyncContext.Provider value={{ isInitialLoadComplete: true }}>
        {children}
      </SyncContext.Provider>
    );
  }

  return <FirebaseSyncInner>{children}</FirebaseSyncInner>;
}

export default FirebaseSyncProvider;
