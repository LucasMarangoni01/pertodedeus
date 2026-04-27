import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth, db, withTimeout } from "../lib/firebase";
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";
import { checkDailyFaith } from "../services/userService";

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'admin' | 'user';
  isAdmin?: boolean;
  denomination?: string;
  bibleVersion?: string;
  spiritualLevel?: string;
  streak?: number;
  bio?: string;
  yearsAsChristian?: number;
  challenges?: string[];
  isPublic?: boolean;
  simplifyAI?: boolean;
  showBibleNotes?: boolean;
  experience?: number;
  totalChaptersRead?: number;
  totalPrayers?: number;
  totalDevotionals?: number;
  totalFaithDays?: number;
  lastFaithDay?: string;
  ministerialBalance?: {
    oracao: number;
    palavra: number;
    caridade: number;
    jejum: number;
    louvor: number;
  };
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
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem("pd_guest_mode") === "true");
  const [loading, setLoading] = useState(true);

  const enterGuestMode = () => {
    setIsGuest(true);
    localStorage.setItem("pd_guest_mode", "true");
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    localStorage.removeItem("pd_guest_mode");
  };

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
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Clear initial timeout as we have an active auth session
        clearTimeout(timeoutId);

        // Set up real-time listener for user profile
        unsubscribeProfile = onSnapshot(doc(db, "users", firebaseUser.uid), (userDoc) => {
          if (!isMounted) return;
          
          const isAdminByEmail = firebaseUser.email === "lukete135467@gmail.com";

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: data.displayName || firebaseUser.displayName,
              photoURL: data.photoURL || firebaseUser.photoURL,
              isAdmin: data.role === 'admin' || isAdminByEmail,
              ...data as any
            });

            // Trigger daily check
            checkDailyFaith(firebaseUser.uid).catch(err => {
              console.error("[Auth] Daily check failed:", err);
            });
          } else {
            const newUser = {
              displayName: firebaseUser.displayName || "Discípulo",
              photoURL: firebaseUser.photoURL,
              role: isAdminByEmail ? 'admin' : 'user',
              spiritualLevel: "Semente",
              experience: 0,
              totalChaptersRead: 0,
              totalPrayers: 0,
              totalDevotionals: 0,
              totalFaithDays: 0,
              streak: 0,
              ministerialBalance: {
                oracao: 10,
                palavra: 10,
                caridade: 10,
                jejum: 10,
                louvor: 10
              },
              createdAt: serverTimestamp()
            };
            
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              isAdmin: isAdminByEmail,
              ...newUser
            } as any);

            // Create document in Firestore
            setDoc(doc(db, "users", firebaseUser.uid), newUser).catch(err => {
              console.error("[Auth] Error creating initial user profile:", err);
            });
          }
          setLoading(false);
        }, (err) => {
          if (isMounted) {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
            setLoading(false);
          }
        });
      } else {
        clearTimeout(timeoutId);
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
      await withTimeout(signInWithPopup(auth, provider), 60000);
    } catch (error: any) {
      console.error("[Auth] Error signing in with Google:", error);
      if (error.message === "TIMEOUT_FIREBASE") {
        throw new Error("A autenticação demorou muito. Verifique se o popup foi bloqueado pelo navegador.");
      }
      throw error; 
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await withTimeout(signInWithEmailAndPassword(auth, email, pass), 15000);
    } catch (error: any) {
      console.error("[Auth] Error with email login:", error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    try {
      await withTimeout(createUserWithEmailAndPassword(auth, email, pass), 15000);
    } catch (error: any) {
      console.error("[Auth] Error with email register:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      exitGuestMode();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithGoogle, 
      signInWithEmail, 
      registerWithEmail, 
      signOut, 
      isGuest, 
      enterGuestMode, 
      exitGuestMode 
    }}>
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
