import { doc, updateDoc, increment, getDoc, serverTimestamp, setDoc, collection, addDoc } from "firebase/firestore";
import { db, withTimeout } from "../lib/firebase";

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

export interface ReadingSessionData {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  bibleType: "fisica" | "digital";
  plannedVersesCount: number;
  durationSeconds?: number;
  completed?: boolean;
}

/**
 * Salva as estatísticas no momento exato em que o usuário inicia o cronômetro
 */
export async function recordTimerStart(userId: string, data: ReadingSessionData): Promise<string | null> {
  if (!userId) return null;
  const userRef = doc(db, "users", userId);
  const now = new Date();

  // Salva no localStorage como cache e fallback imediato
  const localStats = JSON.parse(localStorage.getItem("timerReadingStats") || "{}");
  localStats.totalStarts = (localStats.totalStarts || 0) + 1;
  localStats.lastSession = { ...data, startedAt: now.toISOString() };
  localStorage.setItem("timerReadingStats", JSON.stringify(localStats));

  try {
    // 1. Atualiza contador geral e último início no perfil do usuário
    const updatePromise = updateDoc(userRef, {
      "timerStats.totalStarts": increment(1),
      "timerStats.lastStartedAt": serverTimestamp(),
      "timerStats.lastBook": data.book,
      "timerStats.lastChapter": data.chapter,
      "timerStats.lastStartVerse": data.startVerse,
      "timerStats.lastEndVerse": data.endVerse,
      "timerStats.lastBibleType": data.bibleType,
      "timerStats.lastPlannedCount": data.plannedVersesCount,
      "lastCheckIn": serverTimestamp(),
      experience: increment(5) // Pequeno estímulo de fé ao abrir as escrituras
    });
    await withTimeout(updatePromise, 7000);

    // 2. Registra na subcoleção de sessões para histórico completo
    const sessionRef = collection(db, "users", userId, "reading_sessions");
    const docRef = await withTimeout(addDoc(sessionRef, {
      ...data,
      status: "iniciado",
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }), 7000);

    return docRef.id;
  } catch (error) {
    console.warn("[TimerStats] Could not sync start to firestore immediately (using offline cache):", error);
    return null;
  }
}

/**
 * Salva a conclusão da sessão do cronômetro quando finalizada
 */
export async function recordTimerComplete(userId: string, sessionId: string | null, data: {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  bibleType: "fisica" | "digital";
  durationSeconds: number;
  versesRead: number;
}) {
  if (!userId) return;
  const userRef = doc(db, "users", userId);

  // Fallback local
  const localStats = JSON.parse(localStorage.getItem("timerReadingStats") || "{}");
  localStats.totalSeconds = (localStats.totalSeconds || 0) + data.durationSeconds;
  localStats.totalVersesRead = (localStats.totalVersesRead || 0) + data.versesRead;
  localStats.completedSessions = (localStats.completedSessions || 0) + 1;
  localStorage.setItem("timerReadingStats", JSON.stringify(localStats));

  try {
    const updatePromise = updateDoc(userRef, {
      "timerStats.totalSeconds": increment(data.durationSeconds),
      "timerStats.totalVersesRead": increment(data.versesRead),
      "timerStats.completedSessions": increment(1),
      "totalChaptersRead": increment(1),
      "ministerialBalance.palavra": increment(1),
      experience: increment(15),
      lastCheckIn: serverTimestamp()
    });
    await withTimeout(updatePromise, 7000);

    if (sessionId) {
      const sessionDocRef = doc(db, "users", userId, "reading_sessions", sessionId);
      await withTimeout(updateDoc(sessionDocRef, {
        durationSeconds: data.durationSeconds,
        versesRead: data.versesRead,
        status: "concluido",
        completedAt: serverTimestamp()
      }), 7000);
    }
  } catch (error) {
    console.warn("[TimerStats] Could not sync completion to firestore:", error);
  }
}
