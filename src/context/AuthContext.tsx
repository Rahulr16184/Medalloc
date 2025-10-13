
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';
import type { UserProfile, UserRole } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { MainHeader } from '@/components/headers/MainHeader';

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // If no user, stop loading and clear profile
        setUserProfile(null);
        setLoading(false);
      } else if (currentUser && !currentUser.emailVerified) {
        // If user exists but email is not verified, sign out
        firebaseSignOut(auth);
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // User is authenticated, now get profile
      const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }, () => {
        // Error fetching profile
        setUserProfile(null);
        setLoading(false);
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(pathname);
    const isAuthRoute = authRoutes.includes(pathname);

    if (userProfile) {
      // User is logged in
      const expectedRoute = roleBasedRedirects[userProfile.role];
      if (isAuthRoute || pathname === '/') {
        // If user is on an auth page or the landing page, redirect to their dashboard
        router.push(expectedRoute);
      }
    } else {
      // User is not logged in
      if (!isPublicRoute) {
        // If user is on a protected page, redirect to login
        router.push('/login');
      }
    }
  }, [userProfile, loading, pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const value = { user, userProfile, loading, logout };
  const isPublic = publicRoutes.includes(pathname);

  if (loading) {
    return (
        <div className="flex h-screen w-screen flex-col">
          <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
            <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-24" />
            </div>
             <Skeleton className="h-8 w-8 rounded-full" />
          </header>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md space-y-4 p-4">
                <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
        {!isPublic && userProfile && <MainHeader />}
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
