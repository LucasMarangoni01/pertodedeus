import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  denomination?: string;
  bibleVersion?: string;
  spiritualLevel?: string;
  streak?: number;
  bio?: string;
  yearsAsChristian?: number;
  challenges?: string[];
  isPublic?: boolean;
  notifications?: {
    dailyDevotional: boolean;
    prayerRequests: boolean;
    communityActivity: boolean;
  };
  privacy?: {
    showProfile: boolean;
    showStreak: boolean;
    showStruggles: boolean;
  };
  bibleProgress?: {
    book: string;
    bookId: number;
    chapter: number;
    verse: number;
    version: string;
    updatedAt: any;
  };
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

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Set up real-time listener for user profile
        unsubscribeProfile = onSnapshot(doc(db, "users", firebaseUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: data.displayName || firebaseUser.displayName,
              photoURL: data.photoURL || firebaseUser.photoURL,
              ...data as any
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            });
          }
          setLoading(false);
        }, (err) => {
          console.error("[Auth] Profile listener error:", err);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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
      // With onSnapshot, this might be redundant but keeping for compatibility
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: data.displayName || auth.currentUser.displayName,
          photoURL: data.photoURL || auth.currentUser.photoURL,
          ...data as any
        });
      }
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
