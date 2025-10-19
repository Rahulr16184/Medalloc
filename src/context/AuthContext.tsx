
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';
import type { UserProfile, UserRole } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/', '/login', '/signup'];
const authRoutes = ['/login', '/signup'];

const roleBasedRedirects: Record<UserRole, string> = {
  hospital: '/hospital',
  patient: '/patient',
  server: '/server',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
        // Start listening to profile, but don't set loading to false yet
        const unsubscribeProfile = onSnapshot(
          doc(db, 'users', currentUser.uid),
          (doc) => {
            if (doc.exists()) {
              setUserProfile(doc.data() as UserProfile);
            } else {
              // User exists in Auth but not in Firestore. Log them out.
              firebaseSignOut(auth); 
              setUserProfile(null);
            }
            setLoading(false); // End loading only after profile is fetched/checked
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            firebaseSignOut(auth);
            setUserProfile(null);
            setLoading(false);
          }
        );
        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false); // User is not logged in, we can stop loading.
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Wait until the initial loading is complete before doing any routing.
    if (loading) {
      return;
    }

    const isPublicPage = publicRoutes.some(route => pathname === route || (route === '/' && pathname.startsWith('/#')));
    const isAuthPage = authRoutes.includes(pathname);

    if (userProfile) {
      // User is logged in and has a profile.
      const expectedRoute = roleBasedRedirects[userProfile.role];
      // If user is on an auth page (login/signup) or the landing page, redirect them.
      if (isAuthPage || pathname === '/') {
        router.push(expectedRoute);
      }
    } else {
      // User is not logged in.
      // If the user tries to access a protected page, redirect to login.
      if (!isPublicPage) {
        router.push('/login');
      }
    }
  }, [userProfile, loading, pathname, router]);

  const logout = async () => {
    setLoading(true);
    await firebaseSignOut(auth);
    // Setting user/profile to null and redirecting is handled by onAuthStateChanged
    router.push('/login');
    setLoading(false);
  };
  
  // While loading, or if we are redirecting, show a full-page skeleton.
  const isPublicPage = publicRoutes.some(route => pathname === route || (route === '/' && pathname.startsWith('/#')));
  if (loading || (!userProfile && !isPublicPage) || (userProfile && (authRoutes.includes(pathname) || pathname === '/'))) {
     return (
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
