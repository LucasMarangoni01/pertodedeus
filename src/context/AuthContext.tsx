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
    let isMounted = true;

    // Safety timeout: If auth hasn't loaded in 8 seconds, force loading to false
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("[Auth] Initialization timeout reached. Forcing loading to false.");
        setLoading(false);
      }
    }, 8000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      clearTimeout(timeoutId);

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
      isMounted = false;
      clearTimeout(timeoutId);
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
        <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 text-center">
           <div className="w-12 h-12 border-4 border-amber/20 border-t-amber rounded-full animate-spin mb-6" />
           <p className="text-amber/40 text-xs font-bold uppercase tracking-widest animate-pulse">Iniciando ambiente de fé...</p>
           
           <div className="mt-12 max-w-xs transition-all duration-1000 opacity-0 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards" style={{ animationDelay: '5s' }}>
             <p className="text-pearl/20 text-[10px] mb-4 uppercase tracking-wider">A conexão está demorando mais que o esperado</p>
             <button 
                onClick={() => setLoading(false)}
                className="text-amber border border-amber/30 px-6 py-2 rounded-full text-xs hover:bg-amber/10 transition-colors"
             >
                Continuar mesmo assim
             </button>
           </div>
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
