"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";
import { UserProfile } from "./types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  isAdmin: false,
  updateProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "").split(",").map((uid) => uid.trim()).filter(Boolean);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const profileRef = doc(db, "users", user.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const existingProfile = profileSnap.data() as UserProfile;
            const expectedRole = adminUids.includes(user.uid) ? "admin" : "client";
            if (existingProfile.role !== expectedRole) {
              existingProfile.role = expectedRole;
              await setDoc(profileRef, existingProfile);
            }
            setProfile(existingProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "",
              ...(user.photoURL ? { photoURL: user.photoURL } : {}),
              role: adminUids.includes(user.uid) ? "admin" : "client",
              createdAt: new Date().toISOString(),
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminUids.join()]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setProfile((prev) => prev ? { ...prev, ...data } : prev);
  }, []);

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, isAdmin, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
