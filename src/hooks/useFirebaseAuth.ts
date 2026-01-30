// Firebase Authentication Hook
import { useState, useEffect, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export type AuthMode = 'demo' | 'authenticated' | null;

export interface AuthState {
  user: User | null;
  authMode: AuthMode;
  isLoading: boolean;
  error: string | null;
}

export interface UseFirebaseAuth {
  user: User | null;
  authMode: AuthMode;
  isLoading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  enterDemoMode: () => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
}

const googleProvider = new GoogleAuthProvider();

export function useFirebaseAuth(): UseFirebaseAuth {
  const [state, setState] = useState<AuthState>({
    user: null,
    authMode: null,
    isLoading: true,
    error: null,
  });

  // Initialize auth state from localStorage and Firebase
  useEffect(() => {
    const savedAuthMode = localStorage.getItem('looops-auth-mode');

    // If in demo mode, restore it immediately
    if (savedAuthMode === 'demo') {
      setState({
        user: null,
        authMode: 'demo',
        isLoading: false,
        error: null,
      });
      return;
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.setItem('looops-auth-mode', 'authenticated');
        setState({
          user,
          authMode: 'authenticated',
          isLoading: false,
          error: null,
        });
      } else {
        // User is not logged in
        localStorage.removeItem('looops-auth-mode');
        setState({
          user: null,
          authMode: null,
          isLoading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      let errorMessage = 'Failed to sign in';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        default:
          errorMessage = error.message || 'Failed to sign in';
      }

      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return false;
    }
  }, []);

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }

      return true;
    } catch (error: any) {
      let errorMessage = 'Failed to create account';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        default:
          errorMessage = error.message || 'Failed to create account';
      }

      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error: any) {
      let errorMessage = 'Failed to sign in with Google';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign in cancelled';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked. Please allow popups for this site';
          break;
        case 'auth/cancelled-popup-request':
          // User cancelled, no need to show error
          setState((prev) => ({ ...prev, isLoading: false, error: null }));
          return false;
        default:
          errorMessage = error.message || 'Failed to sign in with Google';
      }

      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return false;
    }
  }, []);

  const enterDemoMode = useCallback(() => {
    localStorage.setItem('looops-auth-mode', 'demo');
    setState({
      user: null,
      authMode: 'demo',
      isLoading: false,
      error: null,
    });
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Sign out from Firebase if authenticated
      if (state.authMode === 'authenticated') {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }

    // Clear local storage
    localStorage.removeItem('looops-auth-mode');

    setState({
      user: null,
      authMode: null,
      isLoading: false,
      error: null,
    });
  }, [state.authMode]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await sendPasswordResetEmail(auth, email);
      setState((prev) => ({ ...prev, isLoading: false }));
      return true;
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message || 'Failed to send reset email';
      }

      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return false;
    }
  }, []);

  return {
    user: state.user,
    authMode: state.authMode,
    isLoading: state.isLoading,
    error: state.error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    enterDemoMode,
    logout,
    resetPassword,
    clearError,
  };
}
