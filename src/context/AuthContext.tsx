
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
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
            const profile = doc.data() as UserProfile;
            if (user.emailVerified) {
                setUserProfile(profile);
            } else {
                // If email not verified, don't set profile, effectively logging them out
                setUserProfile(null);
                firebaseSignOut(auth);
            }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }, () => {
        setUserProfile(null);
        setLoading(false);
      });
      return () => unsub();
    } else {
        setLoading(false);
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
        router.push(expectedRoute);
      }
    } else {
      // User is not logged in
      if (!isPublicRoute) {
        router.push('/login');
      }
    }
  }, [userProfile, loading, pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
    router.push('/login');
  };

  const value = { user, userProfile, loading, logout };

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
