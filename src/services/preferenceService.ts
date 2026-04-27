import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export interface UserPreferences {
  showNotes: boolean;
  simplifyAI: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  showNotes: true,
  simplifyAI: false,
};

const LOCAL_STORAGE_KEY = "user_prefs_fallback";

const getLocalPrefs = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const saveLocalPrefs = (prefs: UserPreferences) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefs));
};

export const getPreferences = async (userId?: string): Promise<UserPreferences> => {
  const local = getLocalPrefs();
  
  if (!userId) return local;

  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...DEFAULT_PREFERENCES,
        ...local, // Merge with local as priority if doc is empty
        ...data.preferences
      };
    }
    // If doc doesn't exist, create it with local defaults
    await setDoc(doc(db, "users", userId), { preferences: local }, { merge: true });
    return local;
  } catch (error) {
    console.warn("Firestore preferences failed, using local:", error);
    return local;
  }
};

export const updatePreference = async (userId: string | undefined, key: keyof UserPreferences, value: any) => {
  const currentLocal = getLocalPrefs();
  const updatedLocal = { ...currentLocal, [key]: value };
  saveLocalPrefs(updatedLocal);

  if (userId) {
    try {
      await updateDoc(doc(db, "users", userId), {
        [`preferences.${key}`]: value
      });
    } catch (error) {
      console.error("Failed to update remote preference:", error);
      // Local storage already updated, so UI stays consistent
    }
  }
};
