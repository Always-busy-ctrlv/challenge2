"use client";

/**
 * ElectEd — Firebase Auth Context Provider
 *
 * Provides Firebase authentication state throughout the app.
 * Automatically signs in users anonymously for progress tracking.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebase";

interface FirebaseAuthState {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  userId: string | null;
}

const FirebaseAuthContext = createContext<FirebaseAuthState>({
  user: null,
  loading: true,
  isAnonymous: false,
  userId: null,
});

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FirebaseAuthState>({
    user: null,
    loading: true,
    isAnonymous: false,
    userId: null,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const auth = getFirebaseAuth();

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setState({
            user,
            loading: false,
            isAnonymous: user.isAnonymous,
            userId: user.uid,
          });
        } else {
          // Auto sign-in anonymously for progress tracking
          try {
            await signInAnonymously(auth);
          } catch (err) {
            // Firebase not configured — continue without auth
            console.debug("Firebase auth unavailable — continuing without auth");
            setState({
              user: null,
              loading: false,
              isAnonymous: false,
              userId: null,
            });
          }
        }
      });
    } catch {
      // Firebase not initialized — continue without auth
      setState({
        user: null,
        loading: false,
        isAnonymous: false,
        userId: null,
      });
    }

    return () => unsubscribe?.();
  }, []);

  return (
    <FirebaseAuthContext.Provider value={state}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

/**
 * Hook to access Firebase auth state.
 */
export function useFirebaseAuth(): FirebaseAuthState {
  return useContext(FirebaseAuthContext);
}
