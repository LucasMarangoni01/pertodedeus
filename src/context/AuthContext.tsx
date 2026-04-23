import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  denomination?: string;
  spiritualLevel?: string;
  streak?: number;
  bio?: string;
  yearsAsChristian?: number;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: data.displayName || firebaseUser.displayName,
          photoURL: data.photoURL || firebaseUser.photoURL,
          ...data
        });
      } else {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Still set the basic user info so they are "logged in" even if profile fetch fails
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await fetchUserProfile(firebaseUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error; 
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, refreshUserProfile }}>
      {loading ? (
        <div className="min-h-screen bg-navy flex items-center justify-center">
           <div className="w-12 h-12 border-4 border-amber/20 border-t-amber rounded-full animate-spin" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
