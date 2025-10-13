
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
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setUserProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!user.emailVerified) {
        setLoading(false);
        setUserProfile(null);
        firebaseSignOut(auth);
        return;
    }

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const isPublic = publicRoutes.some(route => pathname.startsWith(route) && (pathname.length === route.length || route === '/'));
    const isAuthPage = authRoutes.includes(pathname);

    if (userProfile) { // User is logged in
      const expectedRoute = roleBasedRedirects[userProfile.role];
      if (isAuthPage || pathname === '/') {
        router.push(expectedRoute);
      } else if (!pathname.startsWith(expectedRoute)) {
        // Optional: If a logged-in user is on a wrong dashboard, redirect them.
        // router.push(expectedRoute);
      }
    } else { // User is not logged in
      if (!isPublic) {
        router.push('/login');
      }
    }
  }, [loading, userProfile, pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
    // State updates will handle the redirect
  };
  
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
  
  const isPublicPage = publicRoutes.some(route => pathname.startsWith(route) && (pathname.length === route.length || route === '/'));

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout }}>
      {!isPublicPage && <MainHeader />}
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
