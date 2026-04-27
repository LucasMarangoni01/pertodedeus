import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { UserPreferences, getPreferences, updatePreference } from "../services/preferenceService";

interface PreferenceContextType {
  preferences: UserPreferences;
  togglePreference: (key: keyof UserPreferences) => Promise<void>;
  loading: boolean;
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

export const PreferenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    showNotes: true,
    simplifyAI: false,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(auth.currentUser?.uid);

  // Initial load from LocalStorage (Instant)
  useEffect(() => {
    const local = localStorage.getItem("user_prefs_fallback");
    if (local) {
      try {
        setPreferences(JSON.parse(local));
      } catch (e) {
        console.error("Error parsing local prefs", e);
      }
    }
  }, []);

  // Sync with Auth and Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUserId(user?.uid);
      const prefs = await getPreferences(user?.uid);
      setPreferences(prefs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const togglePreference = useCallback(async (key: keyof UserPreferences) => {
    // Optimistic UI Update
    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    // Persist
    await updatePreference(userId, key, newValue);
  }, [userId, preferences]);

  return (
    <PreferenceContext.Provider value={{ preferences, togglePreference, loading }}>
      {children}
    </PreferenceContext.Provider>
  );
};

export const usePreference = () => {
  const context = useContext(PreferenceContext);
  if (context === undefined) {
    throw new Error("usePreference must be used within a PreferenceProvider");
  }
  return context;
};
