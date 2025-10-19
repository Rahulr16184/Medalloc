
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { UserProfile, UserRole, Hospital } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase } from '@/firebase/provider';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  hospital: Hospital | null;
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
  const { auth, signOut } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) return;

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setLoading(true); // Always start loading on auth state change
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setHospital(null);
        setLoading(false); // Done loading if no user
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!user) {
      return; // Stop if there's no user
    }

    const profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUserProfile(profile);

        // If user is not a hospital, we are done loading their profile.
        // We can set loading to false.
        if (profile.role !== 'hospital') {
          setHospital(null);
          setLoading(false);
        }
        // If it IS a hospital, we DON'T set loading to false yet.
        // The next useEffect will handle that.
      } else {
        // No profile found, treat as logged out for data purposes
        setUserProfile(null);
        setHospital(null);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
      setHospital(null);
      setLoading(false);
    });

    return () => profileUnsubscribe();
  }, [user]);

  useEffect(() => {
    // This effect only runs for hospital users AFTER their profile has been loaded.
    if (userProfile?.role !== 'hospital' || !user) {
      return;
    }
    
    const hospitalUnsubscribe = onSnapshot(doc(db, 'hospitals', user.uid), (hospitalDoc) => {
      if (hospitalDoc.exists()) {
        setHospital(hospitalDoc.data() as Hospital);
      } else {
        setHospital(null);
      }
      // This is the final loading step for a hospital user, so now we can stop loading.
      setLoading(false);
    }, (error) => {
       console.error("Error fetching hospital data:", error);
       setHospital(null);
       setLoading(false);
    });

    return () => hospitalUnsubscribe();

  }, [userProfile, user]);

  useEffect(() => {
    if (loading) return; // Do not run routing logic while loading

    const isAuthPage = authRoutes.includes(pathname);
    const isPublicPage = publicRoutes.includes(pathname);
    const isProtectedRoute = !isPublicPage && !isAuthPage;

    if (userProfile?.role) { // User is logged in and profile is loaded
      const destination = roleBasedRedirects[userProfile.role];
      
      // If user is on an auth page (login/signup) or the public landing page, redirect them.
      if (isAuthPage || pathname === '/') {
        router.push(destination);
      }
    } else { // User is not logged in
      if (isProtectedRoute) {
        router.push('/login');
      }
    }
  }, [loading, userProfile, pathname, router]);

  const logout = async () => {
    if (signOut) {
      await signOut();
      router.push('/login');
    }
  };
  
  const isPublicOrAuthPage = publicRoutes.includes(pathname) || authRoutes.includes(pathname);
  
  // Show a full-page skeleton ONLY on protected routes while loading.
  // This prevents the skeleton from flashing on public/auth pages.
  if (loading && !isPublicOrAuthPage) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, hospital, loading, logout }}>
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
