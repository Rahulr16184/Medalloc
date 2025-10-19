
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
      setLoading(true);
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), 
        (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
          } else {
            // This case can happen if the user doc is not created yet or deleted.
            // Logging them out is a safe fallback.
            firebaseSignOut(auth);
          }
          setLoading(false);
        }, 
        (error) => {
          console.error("Error fetching user profile:", error);
          // Also log out on error to prevent being stuck.
          firebaseSignOut(auth);
          setLoading(false);
        }
      );
      return () => unsubscribeProfile();
    }
  }, [user]);

  useEffect(() => {
    if (loading) {
      return; // Wait until loading is false before checking routes
    }

    const isPublicPage = publicRoutes.some(route => pathname === route || (route === '/' && pathname.startsWith('/#')));
    const isAuthPage = authRoutes.includes(pathname);

    if (userProfile) { // User is logged in and has a profile
      const expectedRoute = roleBasedRedirects[userProfile.role];
      // If user is on an auth page (login/signup) or the landing page, redirect them.
      if (isAuthPage || pathname === '/') {
        router.push(expectedRoute);
      }
    } else { // User is not logged in
      // If the user is on a protected page, redirect to login.
      if (!isPublicPage) {
        router.push('/login');
      }
    }
  }, [userProfile, loading, pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
    // User state will be cleared by onAuthStateChanged, triggering re-route.
  };

  if (loading) {
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
