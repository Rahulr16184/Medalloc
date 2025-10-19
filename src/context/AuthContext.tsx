
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';
import type { UserProfile, UserRole, Hospital } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser || !currentUser.emailVerified) {
        setUserProfile(null);
        setHospital(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

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
                if (hospitalDoc.exists()) {
                  setHospital(hospitalDoc.data() as Hospital);
                } else {
                  setHospital(null);
                }
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
    if (loading) return;

    const isAuthPage = authRoutes.includes(pathname);
    const isPublicPage = publicRoutes.some(route => pathname === route || (route === '/' && pathname.startsWith('/#')));
    
    if (userProfile && user?.emailVerified) {
      const expectedRoute = roleBasedRedirects[userProfile.role];
      const isHospitalPendingOrRejected = userProfile.role === 'hospital' && hospital && hospital.status !== 'approved';
      
      // If user is on an auth page, or landing page, redirect them.
      if (isAuthPage || pathname === '/') {
        router.push(expectedRoute);
      }
      // If a pending hospital tries to access a sub-page, redirect them back to the main status page.
      else if (isHospitalPendingOrRejected && pathname !== expectedRoute) {
        router.push(expectedRoute);
      }
    } else {
      // User is not logged in.
      if (!isPublicPage) {
        router.push('/login');
      }
    }
  }, [user, userProfile, hospital, loading, pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
    // State will be cleared by onAuthStateChanged listener
    router.push('/login');
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
