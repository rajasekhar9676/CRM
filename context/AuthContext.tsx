'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  businessName: string;
  ownerName: string;
  phoneNumber: string;
  plan: 'free' | 'paid';
  email: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  enableDemoMode: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if we're in demo mode
    const demoMode = localStorage.getItem('demoMode') === 'true';
    if (demoMode) {
      setIsDemoMode(true);
      setUser({
        uid: 'demo-user',
        email: 'demo@minicrm.com',
        displayName: 'Demo User',
        photoURL: null,
      } as User);
      setUserProfile({
        uid: 'demo-user',
        businessName: 'Demo Business',
        ownerName: 'Demo User',
        phoneNumber: '+1234567890',
        plan: 'free',
        email: 'demo@minicrm.com',
        photoURL: undefined,
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          // Create user profile if it doesn't exist
          const newProfile: UserProfile = {
            uid: user.uid,
            businessName: '',
            ownerName: user.displayName || '',
            phoneNumber: '',
            plan: 'free',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
          };
          await setDoc(doc(db, 'users', user.uid), newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const enableDemoMode = () => {
    localStorage.setItem('demoMode', 'true');
    setIsDemoMode(true);
    setUser({
      uid: 'demo-user',
      email: 'demo@minicrm.com',
      displayName: 'Demo User',
      photoURL: null,
    } as User);
    setUserProfile({
      uid: 'demo-user',
      businessName: 'Demo Business',
      ownerName: 'Demo User',
      phoneNumber: '+1234567890',
      plan: 'free',
      email: 'demo@minicrm.com',
      photoURL: undefined,
    });
    setLoading(false);
  };

  const logout = async () => {
    try {
      if (isDemoMode) {
        localStorage.removeItem('demoMode');
        setIsDemoMode(false);
        setUser(null);
        setUserProfile(null);
      } else {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    enableDemoMode,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
