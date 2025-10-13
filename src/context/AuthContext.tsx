
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
  const [initialAuthCheck, setInitialAuthCheck] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setInitialAuthCheck(false);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    
    if (!user.emailVerified) {
        firebaseSignOut(auth);
        setUserProfile(null);
        setInitialAuthCheck(false);
        setLoading(false);
        return;
    }

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), 
      (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setInitialAuthCheck(false);
        setLoading(false);
      }, 
      (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        setInitialAuthCheck(false);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  useEffect(() => {
    if (initialAuthCheck) {
      return;
    }

    const isPublicPage = publicRoutes.some(route => pathname === route || (route === '/' && pathname.startsWith('/#')));
    const isAuthPage = authRoutes.includes(pathname);

    if (userProfile) { // User is logged in
      const expectedRoute = roleBasedRedirects[userProfile.role];
      if (isAuthPage || pathname === '/') {
        router.push(expectedRoute);
      }
    } else { // User is not logged in
      if (!isPublicPage) {
        router.push('/login');
      }
    }
  }, [userProfile, initialAuthCheck, pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
    router.push('/login');
  };

  const isPublicPage = publicRoutes.some(route => pathname === route || (route === '/' && pathname.startsWith('/#')));

  if (initialAuthCheck) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  if (!userProfile && !isPublicPage) {
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
