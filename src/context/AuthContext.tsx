
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
        // If no user, stop loading and clear profile
        setLoading(false);
        setUserProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      if (!user.emailVerified) {
          // If email is not verified, sign out, stop loading.
          firebaseSignOut(auth);
          setLoading(false);
          setUserProfile(null);
          return;
      }
      // If we have a user, listen to their profile document
      const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false); // Stop loading once profile is fetched (or not found)
      }, () => {
        // On error, stop loading
        setLoading(false);
        setUserProfile(null);
      });
      return () => unsubscribeProfile();
    } else {
      // If there's no user, we're not loading.
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading) {
      return; // Don't do anything while loading
    }
    
    const isPublicPage = publicRoutes.some(route => pathname.startsWith(route) && (pathname.length === route.length || route === '/'));
    const isAuthPage = authRoutes.includes(pathname);

    if (userProfile) { // User is logged in and has a profile
      const expectedRoute = roleBasedRedirects[userProfile.role];
      if (isAuthPage || pathname === '/') {
        router.push(expectedRoute);
      }
    } else { // User is not logged in
      if (!isPublicPage) {
        router.push('/login');
      }
    }

  }, [userProfile, loading, pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const isAppPage = !publicRoutes.includes(pathname);
  
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
           <main className="flex flex-1 items-center justify-center">
             <Skeleton className="h-96 w-full max-w-md" />
           </main>
         </div>
      );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout }}>
      {isAppPage && <MainHeader />}
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
