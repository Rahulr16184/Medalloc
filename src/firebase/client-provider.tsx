
'use client';

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { Auth, getAuth, signOut } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { useMemo, type ReactNode } from 'react';

import { FIREBASE_CONFIG } from '@/lib/firebase/config';
import { FirebaseProvider } from './provider';
import { AuthProvider } from '@/context/AuthContext';


/**
 * Initializes Firebase on the client-side and provides the Firebase context to its children.
 * Ensures that Firebase is only initialized once.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { app, auth, firestore } = useMemo(() => {
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
  }, []);

  const handleSignOut = () => signOut(auth);

  return (
    <FirebaseProvider app={app} auth={auth} firestore={firestore} signOut={handleSignOut}>
       <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseProvider>
  );
}
