
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
const authRoutes = ['/login', 'signup'];

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
      setLoading(true); // Start loading whenever auth state changes
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setHospital(null);
        setLoading(false); // No user or not verified, stop loading
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!user) {
        return;
    }

    const profileUnsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          setUserProfile(profile);

          if (profile.role === 'hospital') {
            const hospitalUnsubscribe = onSnapshot(
              doc(db, 'hospitals', user.uid),
              (hospitalDoc) => {
                setHospital(hospitalDoc.exists() ? hospitalDoc.data() as Hospital : null);
                setLoading(false);
              },
              (error) => {
                 console.error("Error fetching hospital data:", error);
                 setHospital(null);
                 setLoading(false);
              }
            );
            return () => hospitalUnsubscribe();
          } else {
            setHospital(null);
            setLoading(false);
          }
        } else {
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
  }, [user]);

  useEffect(() => {
    if (loading) {
      return; // Don't do anything while loading
    }
    
    const isAuthPage = authRoutes.includes(pathname.split('/')[1]);
    const isPublicPage = publicRoutes.includes(pathname);

    if (userProfile) { // User is logged in and profile is loaded
      const destination = roleBasedRedirects[userProfile.role];
      if (isAuthPage || isPublicPage) {
        router.push(destination);
      }
    } else { // User is not logged in
      if (!isPublicPage && !isAuthPage) {
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

  const isPublicOrAuthPage = publicRoutes.includes(pathname) || authRoutes.includes(pathname.split('/')[1]);

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
