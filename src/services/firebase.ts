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
    const cleanedState = removeUndefined({
      ...state,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleanedState, { merge: true });
    console.log('[Firebase] State saved successfully for user:', userId);
    return true;
  } catch (error) {
    console.error('[Firebase] Error saving app state to Firestore:', error);
    return false;
  }
}

export async function loadAppState(userId: string): Promise<object | null> {
  if (!db) return null;

  try {
    const docRef = doc(db, APP_STATE_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error loading app state from Firestore:', error);
    return null;
  }
}

export function subscribeToAppState(
  userId: string,
  callback: (state: object | null) => void
): Unsubscribe | null {
  if (!db) return null;

  const docRef = doc(db, APP_STATE_COLLECTION, userId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to app state:', error);
    callback(null);
  });
}
