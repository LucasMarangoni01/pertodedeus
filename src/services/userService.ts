import { doc, updateDoc, increment, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export type SpiritualAction = "bibleRead" | "prayer" | "devotional" | "login" | "charity" | "fasting" | "worship";

const ACTIONS_XP: Record<SpiritualAction, number> = {
  bibleRead: 10,
  prayer: 5,
  devotional: 15,
  login: 20,
  charity: 25,
  fasting: 30,
  worship: 10
};

export async function trackSpiritualAction(userId: string, action: SpiritualAction) {
  const userRef = doc(db, "users", userId);
  const xp = ACTIONS_XP[action];
  
  const updates: any = {
    experience: increment(xp),
    lastCheckIn: serverTimestamp()
  };

  if (action === "bibleRead") updates.totalChaptersRead = increment(1);
  if (action === "prayer") updates.totalPrayers = increment(1);
  if (action === "devotional") updates.totalDevotionals = increment(1);
  
  // Ministerial Balance update (capped conceptually in UI or by logic)
  if (action === "prayer") updates["ministerialBalance.oracao"] = increment(1);
  if (action === "bibleRead") updates["ministerialBalance.palavra"] = increment(1);
  if (action === "charity") updates["ministerialBalance.caridade"] = increment(1);
  if (action === "fasting") updates["ministerialBalance.jejum"] = increment(1);
  if (action === "worship") updates["ministerialBalance.louvor"] = increment(1);

  try {
    await updateDoc(userRef, updates);
  } catch (e: any) {
    if (e.code === 'not-found') {
      // Create user doc if not exists (though AuthContext handles this, safety first)
      await setDoc(userRef, {
        experience: xp,
        totalChaptersRead: action === "bibleRead" ? 1 : 0,
        totalPrayers: action === "prayer" ? 1 : 0,
        totalDevotionals: action === "devotional" ? 1 : 0,
        ministerialBalance: {
          oracao: action === "prayer" ? 1 : 0,
          palavra: action === "bibleRead" ? 1 : 0,
          caridade: action === "charity" ? 1 : 0,
          jejum: action === "fasting" ? 1 : 0,
          louvor: action === "worship" ? 1 : 0
        },
        lastCheckIn: serverTimestamp()
      }, { merge: true });
    }
  }
}

export function getLevelInfo(xp: number) {
  const LEVELS = [
    { title: "Semente", minXp: 0, color: "#94a3b8" },
    { title: "Broto", minXp: 100, color: "#4ade80" },
    { title: "Raiz", minXp: 300, color: "#10b981" },
    { title: "Tronco", minXp: 600, color: "#059669" },
    { title: "Árvore", minXp: 1000, color: "#047857" },
    { title: "Fruto", minXp: 1500, color: "#fbbf24" },
    { title: "Multiplicação", minXp: 2500, color: "#f59e0b" },
    { title: "Discípulo", minXp: 5000, color: "#8b5cf6" },
    { title: "Mestre", minXp: 10000, color: "#ffffff" }
  ];

  const currentLevel = [...LEVELS].reverse().find(l => xp >= l.minXp) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1] || null;
  const progress = nextLevel 
    ? Math.min(100, Math.max(0, ((xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100))
    : 100;

  return { currentLevel, nextLevel, progress };
}

export async function checkDailyFaith(userId: string) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const data = userSnap.data();
  const today = new Date().toISOString().split('T')[0];
  
  // If no lastFaithDay, or lastFaithDay is not today
  if (!data.lastFaithDay || data.lastFaithDay !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const isConsecutive = data.lastFaithDay === yesterdayStr;
    const newStreak = isConsecutive ? (data.streak || 0) + 1 : 1;
    
    await updateDoc(userRef, {
      totalFaithDays: increment(1),
      lastFaithDay: today,
      streak: newStreak,
      experience: increment(ACTIONS_XP.login),
      lastCheckIn: serverTimestamp()
    });
    
    return { firstTimeToday: true, streak: newStreak };
  }
  
  return { firstTimeToday: false };
}
