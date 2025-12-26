// Firebase service helpers - uses shared Firebase instance
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';

// Check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  try {
    const projectId = auth?.app?.options?.projectId;
    const configured = !!projectId && projectId.length > 0;
    console.log('[Firebase] Configured:', configured, 'projectId:', projectId);
    return configured;
  } catch {
    return false;
  }
};

export { db, auth };

// Auth helpers
export async function signInAnonymouslyIfNeeded(): Promise<User | null> {
  if (!auth) {
    console.log('[Firebase] No auth instance');
    return null;
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        console.log('[Firebase] Already signed in:', user.uid);
        resolve(user);
      } else {
        try {
          console.log('[Firebase] Signing in anonymously...');
          const result = await signInAnonymously(auth);
          console.log('[Firebase] Signed in:', result.user.uid);
          resolve(result.user);
        } catch (error) {
          console.error('[Firebase] Anonymous sign-in failed:', error);
          resolve(null);
        }
      }
    });
  });
}

export function onAuthChange(callback: (user: User | null) => void): Unsubscribe | null {
  if (!auth) {
    console.log('[Firebase] No auth for onAuthChange');
    return null;
  }
  return onAuthStateChanged(auth, callback);
}

// Firestore helpers
const USERS_COLLECTION = 'users';

// Remove undefined values (Firestore doesn't accept undefined)
function cleanForFirestore(obj: unknown): unknown {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

// Save state to Firestore
export async function saveState(userId: string, state: object, version: number): Promise<boolean> {
  if (!db) {
    console.log('[Firebase] No db for save');
    return false;
  }

  try {
    console.log('[Firebase] Saving for user:', userId, 'version:', version);
    const docRef = doc(db, USERS_COLLECTION, userId);
    const data = cleanForFirestore({
      ...state,
      _version: version,
      _updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, data as Record<string, unknown>, { merge: true });
    console.log('[Firebase] Save success');
    return true;
  } catch (error) {
    console.error('[Firebase] Save failed:', error);
    return false;
  }
}

// Load state from Firestore
export async function loadState(userId: string): Promise<{ state: object; version: number } | null> {
  if (!db) {
    console.log('[Firebase] No db for load');
    return null;
  }

  try {
    console.log('[Firebase] Loading for user:', userId);
    const docRef = doc(db, USERS_COLLECTION, userId);

    // Use getDocFromServer to force network fetch, fall back to cache
    const { getDocFromServer, getDocFromCache } = await import('firebase/firestore');

    let docSnap;
    try {
      docSnap = await getDocFromServer(docRef);
      console.log('[Firebase] Loaded from server');
    } catch (serverError) {
      console.log('[Firebase] Server fetch failed, trying cache');
      try {
        docSnap = await getDocFromCache(docRef);
        console.log('[Firebase] Loaded from cache');
      } catch (cacheError) {
        console.log('[Firebase] No cache available');
        return null;
      }
    }

    if (docSnap.exists()) {
      const data = docSnap.data();
      const version = (data._version as number) || 0;
      console.log('[Firebase] Loaded, version:', version);
      return { state: data, version };
    }
    console.log('[Firebase] No doc exists');
    return null;
  } catch (error) {
    console.error('[Firebase] Load failed:', error);
    return null;
  }
}

// Subscribe to state changes
export function subscribeToState(
  userId: string,
  callback: (state: object, version: number) => void
): Unsubscribe | null {
  if (!db) {
    console.log('[Firebase] No db for subscribe');
    return null;
  }

  console.log('[Firebase] Subscribing for user:', userId);
  const docRef = doc(db, USERS_COLLECTION, userId);

  return onSnapshot(docRef, (docSnap) => {
    // Only process server updates, not local cache
    if (docSnap.metadata.hasPendingWrites) {
      console.log('[Firebase] Ignoring local write');
      return;
    }

    if (docSnap.exists()) {
      const data = docSnap.data();
      const version = (data._version as number) || 0;
      console.log('[Firebase] Snapshot received, version:', version);
      callback(data, version);
    }
  });
}
