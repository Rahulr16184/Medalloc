
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      if (!user.emailVerified) {
          firebaseSignOut(auth);
          setUserProfile(null);
          setLoading(false);
          return;
      }
      const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }, () => {
        // Handle error, e.g. client offline
        setLoading(false);
        setUserProfile(null);
      });
      return () => unsub();
    } else {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const isPublic = publicRoutes.some(route => pathname === route);

    if (userProfile) {
      const expectedRoute = roleBasedRedirects[userProfile.role];
      if (isPublic) {
        router.push(expectedRoute);
      } else if (!pathname.startsWith(expectedRoute)) {
        router.push(expectedRoute);
      }
    } else if (!isPublic) {
      router.push('/login');
    }
  }, [userProfile, loading, pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const isPublicRoute = publicRoutes.some(route => pathname === route);

  const value = { user, userProfile, loading, logout };

  if (loading) {
     return (
      <AuthContext.Provider value={value}>
        <div className="flex h-screen w-screen flex-col">
          <MainHeader />
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md space-y-4 p-4">
                <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {isPublicRoute ? children : (
        <>
          {children}
        </>
      )}
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
