
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
      setUser(currentUser);
      if (!currentUser || !currentUser.emailVerified) {
        setUserProfile(null);
        setHospital(null);
        setLoading(false); // No user or not verified, stop loading
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!user) {
        // If user logs out, reset states
        if (userProfile) setUserProfile(null);
        if (hospital) setHospital(null);
        // If there was a user before, now there is none, so stop loading
        if (!loading) setLoading(true); // prepare for potential new login
        return;
    };
    
    // Only fetch profile if user is email-verified
    if (!user.emailVerified) {
        setLoading(false);
        return;
    }

    const profileUnsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          setUserProfile(profile);

          if (profile.role === 'hospital') {
            // If user is a hospital, we need to fetch hospital data before we are "done" loading.
            const hospitalUnsubscribe = onSnapshot(
              doc(db, 'hospitals', user.uid),
              (hospitalDoc) => {
                setHospital(hospitalDoc.exists() ? hospitalDoc.data() as Hospital : null);
                setLoading(false); // Loading finished after getting hospital data
              },
              (error) => {
                 console.error("Error fetching hospital data:", error);
                 setHospital(null);
                 setLoading(false);
              }
            );
            return () => hospitalUnsubscribe();
          } else {
            // Not a hospital, no more data to fetch.
            setHospital(null);
            setLoading(false);
          }
        } else {
          // User document doesn't exist.
          setUserProfile(null);
          setHospital(null);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        setHospital(null);
        setLoading(false);
      }
    );

    return () => profileUnsubscribe();
  }, [user, user?.emailVerified]);

  useEffect(() => {
    if (loading) return; // Wait for all auth and profile checks to complete

    const isAuthPage = authRoutes.includes(pathname);
    const isPublicPage = publicRoutes.some(route => pathname === route || (route === '/' && pathname.startsWith('/#')));
    
    if (userProfile) { // User is logged in and profile is loaded
      const expectedRoute = roleBasedRedirects[userProfile.role];
      
      // If user is on an auth page, or landing page, redirect them to their dashboard.
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
    if (signOut) {
      await signOut();
      setUser(null);
      setUserProfile(null);
      setHospital(null);
      setLoading(true); // Reset loading state
      router.push('/login');
    }
  };

  const isPublicPage = publicRoutes.some(route => pathname === route || (route === '/' && pathname.startsWith('/#')));
  if (loading && !isPublicPage) {
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
