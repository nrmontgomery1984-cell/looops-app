// Firebase service helpers - uses shared Firebase instance
import { doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';

// Check if Firebase is properly configured (has valid project ID)
export const isFirebaseConfigured = (): boolean => {
  try {
    // Check if we have a valid Firebase app with a project ID
    const projectId = auth?.app?.options?.projectId;
    return !!projectId && projectId.length > 0;
  } catch {
    return false;
  }
};

// Re-export auth and db for convenience
export { db, auth };

// Auth helpers
export async function signInAnonymouslyIfNeeded(): Promise<User | null> {
  if (!auth) return null;

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const result = await signInAnonymously(auth);
          resolve(result.user);
        } catch (error) {
          console.error('Anonymous sign-in failed:', error);
          resolve(null);
        }
      }
    });
  });
}

export function onAuthChange(callback: (user: User | null) => void): Unsubscribe | null {
  if (!auth) return null;
  return onAuthStateChanged(auth, callback);
}

// Firestore helpers for app state
const APP_STATE_COLLECTION = 'users';

// Recursively remove undefined values from an object (Firestore doesn't accept undefined)
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export async function saveAppState(userId: string, state: object): Promise<boolean> {
  if (!db) {
    console.error('[Firebase] No db instance, cannot save');
    return false;
  }

  try {
    console.log('[Firebase] Saving state for user:', userId);
    const docRef = doc(db, APP_STATE_COLLECTION, userId);
    // Clean undefined values before saving to Firestore
    // Preserve updatedAt if already set by the caller
    const stateWithTimestamp = state as any;
    const cleanedState = removeUndefined({
      ...state,
      updatedAt: stateWithTimestamp.updatedAt || new Date().toISOString(),
    });
    console.log('[Firebase] Saving with updatedAt:', cleanedState.updatedAt);
    await setDoc(docRef, cleanedState, { merge: true });
    console.log('[Firebase] State saved successfully for user:', userId);
    return true;
  } catch (error) {
    console.error('[Firebase] Error saving app state to Firestore:', error);
    return false;
  }
}

export async function loadAppState(userId: string): Promise<object | null> {
  if (!db) {
    console.error('[Firebase] No db instance, cannot load');
    return null;
  }

  try {
    console.log('[Firebase] Loading state for user:', userId);
    const docRef = doc(db, APP_STATE_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('[Firebase] Loaded state, updatedAt:', (data as any)?.updatedAt);
      return data;
    }
    console.log('[Firebase] No document found for user:', userId);
    return null;
  } catch (error) {
    console.error('[Firebase] Error loading app state from Firestore:', error);
    return null;
  }
}

export function subscribeToAppState(
  userId: string,
  callback: (state: object | null) => void
): Unsubscribe | null {
  if (!db) {
    console.error('[Firebase] No db instance, cannot subscribe');
    return null;
  }

  console.log('[Firebase] Subscribing to updates for user:', userId);
  const docRef = doc(db, APP_STATE_COLLECTION, userId);
  // Include metadata changes to see cache vs server source
  return onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
    const source = docSnap.metadata.fromCache ? 'LOCAL CACHE' : 'SERVER';
    const hasPending = docSnap.metadata.hasPendingWrites;
    console.log('[Firebase] Snapshot from:', source, 'hasPendingWrites:', hasPending);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const taskCount = (data as any)?.tasks?.items?.length || 0;
      console.log('[Firebase] Snapshot data - tasks:', taskCount, 'updatedAt:', (data as any)?.updatedAt);
      callback(data);
    } else {
      console.log('[Firebase] Snapshot received but no document exists');
      callback(null);
    }
  }, (error) => {
    console.error('[Firebase] Error subscribing to app state:', error);
    callback(null);
  });
}
