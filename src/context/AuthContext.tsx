"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
const roleBasedRedirects: Record<UserRole, string> = {
  admin: '/admin',
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setUser(user);
          setUserProfile(profile);
        } else {
          // User exists in Auth but not in Firestore, likely an error state
          setUserProfile(null);
          setUser(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublic = publicRoutes.includes(pathname);

    if (userProfile) {
      const expectedRoute = roleBasedRedirects[userProfile.role];
      if (isPublic) {
        router.push(expectedRoute);
      } else if (!pathname.startsWith(expectedRoute)) {
        // Logged in user trying to access another role's dashboard
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

  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  if (loading || (userProfile && publicRoutes.includes(pathname)) || (!userProfile && !publicRoutes.includes(pathname) && !isAuthRoute) ) {
     return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="w-full max-w-md space-y-4 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
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
