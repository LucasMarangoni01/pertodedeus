import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, Pause, RotateCcw, CheckCircle2, Bookmark, BookOpen, Clock, 
  Flame, Award, ArrowRight, Sparkles, BookMarked, History, Volume2, 
  ChevronRight, Compass, ShieldCheck 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { bibleBooks } from "../constants/bibleData";
import { recordTimerStart, recordTimerComplete, ReadingSessionData } from "../services/userService";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

export default function Cronometro() {
  const { user, isGuest } = useAuth();

  // Mode: "fisica" (Bíblia Física impressa) | "digital" (Bíblia no App)
  const [bibleType, setBibleType] = useState<"fisica" | "digital">("fisica");

  // Selection
  const [selectedBook, setSelectedBook] = useState<string>("Salmos");
  const [selectedChapter, setSelectedChapter] = useState<number>(23);
  const [startVerse, setStartVerse] = useState<number>(1);
  const [endVerse, setEndVerse] = useState<number>(6);

  // Timer states
  const [timerMode, setTimerMode] = useState<"livre" | "meta">("livre");
  const [targetMinutes, setTargetMinutes] = useState<number>(15);
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeSessionData, setActiveSessionData] = useState<ReadingSessionData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [completedStats, setCompletedStats] = useState<any>(null);

  // Local & Account statistics state
  const [stats, setStats] = useState({
    totalStarts: 0,
    totalSeconds: 0,
    totalVersesRead: 0,
    completedSessions: 0,
    lastBookmark: null as { book: string; chapter: number; verse: number; date: string } | null
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Current book metadata
  const currentBookData = bibleBooks.find(b => b.name === selectedBook) || bibleBooks[0];

  // Calculate planned verses
  const plannedVersesCount = Math.max(1, endVerse - startVerse + 1);

  // Load stored stats on mount
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("timerReadingStats") || "{}");
    const storedBookmark = JSON.parse(localStorage.getItem("physicalBibleBookmark") || "null");
    
    // Merge user firestore stats if available
    const userTimerStats = user?.timerStats || {};
    setStats({
      totalStarts: userTimerStats.totalStarts || local.totalStarts || 0,
      totalSeconds: userTimerStats.totalSeconds || local.totalSeconds || 0,
      totalVersesRead: userTimerStats.totalVersesRead || local.totalVersesRead || 0,
      completedSessions: userTimerStats.completedSessions || local.completedSessions || 0,
      lastBookmark: storedBookmark || (userTimerStats.lastBook ? {
        book: userTimerStats.lastBook,
        chapter: userTimerStats.lastChapter || 1,
        verse: userTimerStats.lastEndVerse || 1,
        date: new Date().toISOString()
      } : null)
    });
  }, [user]);

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          if (timerMode === "meta" && next >= targetMinutes * 60) {
            handleComplete(next);
            return next;
          }
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode, targetMinutes]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. INICIAR CRONÔMETRO E SALVAR ESTATÍSTICA NA CONTA
  const handleStart = async () => {
    if (startVerse > endVerse) {
      setEndVerse(startVerse);
    }

    const sessionPayload: ReadingSessionData = {
      book: selectedBook,
      chapter: selectedChapter,
      startVerse,
      endVerse: Math.max(startVerse, endVerse),
      bibleType,
      plannedVersesCount,
      completed: false
    };

    setActiveSessionData(sessionPayload);
    setIsRunning(true);

    // Salvar marcador físico se for Bíblia Física
    if (bibleType === "fisica") {
      const bookmarkData = {
        book: selectedBook,
        chapter: selectedChapter,
        verse: endVerse,
        date: new Date().toISOString()
      };
      localStorage.setItem("physicalBibleBookmark", JSON.stringify(bookmarkData));
      setStats(prev => ({ ...prev, lastBookmark: bookmarkData }));
    }

    // Salvar estatísticas na conta do usuário no Firebase
    if (user?.uid && !isGuest) {
      try {
        const id = await recordTimerStart(user.uid, sessionPayload);
        setCurrentSessionId(id);
        showToast("📖 Leitura iniciada! Estatísticas salvas na sua conta.");
      } catch (err) {
        showToast("Cronômetro iniciado (modo local sincronizado).");
      }
    } else {
      recordTimerStart("guest", sessionPayload);
      showToast("📖 Cronômetro iniciado! (Modo visitante - salvo localmente)");
    }

    setStats(prev => ({ ...prev, totalStarts: prev.totalStarts + 1 }));
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setCurrentSessionId(null);
  };

  // 2. CONCLUIR SESSÃO E REGISTRAR PROGRESSO
  const handleComplete = async (finalSeconds?: number) => {
    const elapsed = finalSeconds !== undefined ? finalSeconds : seconds;
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const versesCount = plannedVersesCount;
    const finalData = {
      book: selectedBook,
      chapter: selectedChapter,
      startVerse,
      endVerse,
      bibleType,
      durationSeconds: elapsed,
      versesRead: versesCount
    };

    if (user?.uid && !isGuest) {
      await recordTimerComplete(user.uid, currentSessionId, finalData);
    } else {
      recordTimerComplete("guest", null, finalData);
    }

    setCompletedStats({
      ...finalData,
      timeString: formatTime(elapsed),
      xpEarned: 20
    });
    setShowCelebration(true);

    setStats(prev => ({
      ...prev,
      totalSeconds: prev.totalSeconds + elapsed,
      totalVersesRead: prev.totalVersesRead + versesCount,
      completedSessions: prev.completedSessions + 1
    }));
  };

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const h = Math.floor(m / 60);
    const remainingM = m % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${remainingM.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Restaurar último marcador físico
  const applyLastBookmark = () => {
    if (stats.lastBookmark) {
      setSelectedBook(stats.lastBookmark.book);
      setSelectedChapter(stats.lastBookmark.chapter);
      setStartVerse(stats.lastBookmark.verse);
      setEndVerse(stats.lastBookmark.verse + 10);
      showToast(`Marcador restaurado: ${stats.lastBookmark.book} ${stats.lastBookmark.chapter}:${stats.lastBookmark.verse}`);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-amber text-navy px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 border border-amber/30 text-sm"
          >
            <ShieldCheck className="w-5 h-5" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            Leitura Bíblica Inteligente
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-pearl">
            Cronômetro de Leitura
          </h1>
          <p className="text-pearl/60 text-sm mt-1">
            Cronometre sua devoção, use sua Bíblia física ou digital e registre cada momento na sua conta.
          </p>
        </div>

        {/* Bible Type Toggle */}
        <div className="flex items-center bg-white/5 border border-amber/20 rounded-2xl p-1.5 self-start">
          <button
            onClick={() => setBibleType("fisica")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
              bibleType === "fisica" 
                ? "bg-amber text-navy shadow-lg" 
                : "text-pearl/60 hover:text-pearl"
            )}
          >
            <BookMarked className="w-4 h-4" />
            📖 Bíblia Física (Impressa)
          </button>
          <button
            onClick={() => setBibleType("digital")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
              bibleType === "digital" 
                ? "bg-amber text-navy shadow-lg" 
                : "text-pearl/60 hover:text-pearl"
            )}
          >
            <BookOpen className="w-4 h-4" />
            📱 Bíblia Digital
          </button>
        </div>
      </div>

      {/* Mode Banner */}
      {bibleType === "fisica" ? (
        <div className="glow-card border-amber/30 bg-gradient-to-r from-amber/15 via-amber/5 to-transparent p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber/20 text-amber flex items-center justify-center shrink-0 border border-amber/30">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-pearl text-base flex items-center gap-2">
                Modo Bíblia Física Ativo
                <span className="text-[10px] bg-amber/20 text-amber px-2 py-0.5 rounded-full uppercase">Papiro & Papel</span>
              </h3>
              <p className="text-xs text-pearl/60 mt-0.5">
                Abra sua Bíblia impressa. Marque o versículo onde você está e até onde pretende ler.
              </p>
            </div>
          </div>
          {stats.lastBookmark && (
            <button
              onClick={applyLastBookmark}
              className="px-4 py-2 bg-amber/20 hover:bg-amber hover:text-navy text-amber rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retomar: {stats.lastBookmark.book} {stats.lastBookmark.chapter}:{stats.lastBookmark.verse}
            </button>
          )}
        </div>
      ) : (
        <div className="glow-card border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent p-6 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-pearl text-base">Modo Bíblia Digital</h3>
              <p className="text-xs text-pearl/60 mt-0.5">
                Leia acompanhado do cronômetro ou navegue até o leitor completo da Palavra.
              </p>
            </div>
          </div>
          <Link
            to="/bible"
            className="px-4 py-2 bg-white/10 hover:bg-amber hover:text-navy text-pearl rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap"
          >
            Abrir Leitor Completo
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Grid: Selector & Stopwatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Passagem & Versículo Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glow-card p-6 rounded-3xl border-amber/20 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display font-bold text-lg text-pearl flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber" />
                Seleção de Versículos
              </h2>
              <span className="text-xs bg-amber/15 text-amber font-bold px-3 py-1 rounded-full">
                {plannedVersesCount} {plannedVersesCount === 1 ? "versículo" : "versículos"}
              </span>
            </div>

            {/* Book Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-pearl/50">Livro da Bíblia</label>
              <select
                disabled={isRunning}
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setSelectedChapter(1);
                  setStartVerse(1);
                  setEndVerse(10);
                }}
                className="w-full bg-navy/80 border border-amber/20 rounded-xl px-4 py-3 text-sm font-semibold text-pearl focus:border-amber outline-none transition-colors"
              >
                {bibleBooks.map((b) => (
                  <option key={b.name} value={b.name} className="bg-navy text-pearl">
                    {b.name} ({b.testament === "Velho" ? "AT" : "NT"})
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold uppercase tracking-wider text-pearl/50">Capítulo</label>
                <span className="text-pearl/40">Total: {currentBookData.chapters} caps</span>
              </div>
              <input
                type="number"
                disabled={isRunning}
                min={1}
                max={currentBookData.chapters}
                value={selectedChapter}
                onChange={(e) => {
                  const val = Math.min(Math.max(1, parseInt(e.target.value) || 1), currentBookData.chapters);
                  setSelectedChapter(val);
                }}
                className="w-full bg-navy/80 border border-amber/20 rounded-xl px-4 py-3 text-sm font-semibold text-pearl focus:border-amber outline-none"
              />
            </div>

            {/* Verses Range: DE ... ATÉ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-pearl/50">
                  📍 Onde eu tô (Início)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    disabled={isRunning}
                    min={1}
                    max={176}
                    value={startVerse}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setStartVerse(val);
                      if (val > endVerse) setEndVerse(val);
                    }}
                    className="w-full bg-navy/80 border border-amber/20 rounded-xl px-4 py-3 text-sm font-semibold text-pearl focus:border-amber outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-pearl/40">vs</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-pearl/50">
                  🎯 Até onde ler (Fim)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    disabled={isRunning}
                    min={startVerse}
                    max={176}
                    value={endVerse}
                    onChange={(e) => {
                      const val = Math.max(startVerse, parseInt(e.target.value) || startVerse);
                      setEndVerse(val);
                    }}
                    className="w-full bg-navy/80 border border-amber/20 rounded-xl px-4 py-3 text-sm font-semibold text-pearl focus:border-amber outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-pearl/40">vs</span>
                </div>
              </div>
            </div>

            {/* Summary preview badge */}
            <div className="p-4 rounded-2xl bg-amber/10 border border-amber/20 text-center space-y-1">
              <p className="text-xs text-amber font-bold uppercase tracking-wider">Passagem Escolhida</p>
              <p className="text-lg font-serif font-bold text-pearl">
                {selectedBook} {selectedChapter}:{startVerse} — {endVerse}
              </p>
              <p className="text-[11px] text-pearl/60">
                Planejados para leitura: <strong className="text-amber">{plannedVersesCount}</strong> versículos
              </p>
            </div>
          </div>

          {/* User Account Stats Card */}
          <div className="glow-card p-6 rounded-3xl border-white/10 space-y-4">
            <h3 className="font-display font-bold text-sm text-pearl flex items-center gap-2">
              <Award className="w-4 h-4 text-amber" />
              Estatísticas Salvas na Sua Conta
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xl font-bold text-amber">{stats.totalStarts}</p>
                <p className="text-[10px] text-pearl/50 uppercase font-semibold">Inícios Registrados</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xl font-bold text-pearl">{Math.round(stats.totalSeconds / 60)} min</p>
                <p className="text-[10px] text-pearl/50 uppercase font-semibold">Tempo Total</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xl font-bold text-pearl">{stats.totalVersesRead}</p>
                <p className="text-[10px] text-pearl/50 uppercase font-semibold">Versículos Lidos</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xl font-bold text-emerald-400">{stats.completedSessions}</p>
                <p className="text-[10px] text-pearl/50 uppercase font-semibold">Sessões Concluídas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stopwatch & Action Display (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="glow-card p-8 rounded-3xl border-amber/20 flex flex-col items-center justify-center text-center space-y-8 min-h-[440px] relative overflow-hidden">
            
            {/* Background gentle ambient glow */}
            <div className={cn(
              "absolute inset-0 transition-opacity duration-1000 pointer-events-none",
              isRunning ? "opacity-100 bg-radial from-amber/15 via-transparent to-transparent" : "opacity-0"
            )} />

            {/* Timer mode toggle (Livre vs Meta) */}
            <div className="flex items-center gap-2 bg-navy/60 border border-white/10 p-1 rounded-2xl z-10">
              <button
                disabled={isRunning}
                onClick={() => setTimerMode("livre")}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                  timerMode === "livre" ? "bg-amber/20 text-amber border border-amber/30" : "text-pearl/40 hover:text-pearl"
                )}
              >
                Cronômetro Livre
              </button>
              <button
                disabled={isRunning}
                onClick={() => setTimerMode("meta")}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                  timerMode === "meta" ? "bg-amber/20 text-amber border border-amber/30" : "text-pearl/40 hover:text-pearl"
                )}
              >
                Meta com Tempo
              </button>
            </div>

            {/* Target minutes selector if Meta mode */}
            {timerMode === "meta" && !isRunning && (
              <div className="flex items-center gap-2 z-10">
                {[5, 10, 15, 20, 30].map(m => (
                  <button
                    key={m}
                    onClick={() => setTargetMinutes(m)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold transition-all",
                      targetMinutes === m ? "bg-amber text-navy shadow-md" : "bg-white/5 text-pearl/60 hover:bg-white/10"
                    )}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            )}

            {/* Big Timer Clock Display */}
            <div className="relative flex flex-col items-center justify-center z-10">
              <div className={cn(
                "w-64 h-64 md:w-72 md:h-72 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-700 relative",
                isRunning 
                  ? "border-amber shadow-[0_0_60px_rgba(201,168,76,0.35)] scale-105" 
                  : "border-white/10"
              )}>
                <span className="text-5xl md:text-6xl font-mono font-bold tracking-tight text-pearl">
                  {formatTime(seconds)}
                </span>
                
                <span className="text-xs uppercase font-bold tracking-widest text-amber mt-2 flex items-center gap-1.5">
                  {isRunning && <span className="w-2 h-2 rounded-full bg-amber animate-ping" />}
                  {isRunning ? "Lendo agora" : seconds > 0 ? "Pausado" : "Pronto para iniciar"}
                </span>

                <span className="text-[11px] text-pearl/50 mt-1 max-w-[180px] truncate">
                  {selectedBook} {selectedChapter}:{startVerse}-{endVerse}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 z-10 w-full max-w-md justify-center">
              {!isRunning && seconds === 0 && (
                <button
                  onClick={handleStart}
                  className="flex-1 bg-amber text-navy font-bold py-4 px-8 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 text-base"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Começar Cronômetro
                </button>
              )}

              {isRunning && (
                <>
                  <button
                    onClick={handlePause}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-pearl font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    Pausar
                  </button>
                  <button
                    onClick={() => handleComplete()}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Concluir Leitura
                  </button>
                </>
              )}

              {!isRunning && seconds > 0 && (
                <>
                  <button
                    onClick={handleResume}
                    className="flex-1 bg-amber text-navy font-bold py-4 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Continuar
                  </button>
                  <button
                    onClick={() => handleComplete()}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Finalizar
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-4 bg-white/10 hover:bg-white/20 text-pearl/60 hover:text-pearl rounded-2xl transition-all"
                    title="Reiniciar"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Note on Automatic Account Saving */}
            <p className="text-[11px] text-pearl/40 italic z-10">
              * Ao clicar em "Começar Cronômetro", a sessão e as estatísticas são sincronizadas automaticamente na sua conta.
            </p>
          </div>
        </div>
      </div>

      {/* Celebration Modal */}
      {showCelebration && completedStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-navy border border-amber/30 w-full max-w-md rounded-3xl p-8 space-y-6 shadow-[0_0_80px_rgba(201,168,76,0.2)] text-center"
          >
            <div className="w-16 h-16 bg-amber/20 rounded-full flex items-center justify-center text-amber mx-auto border border-amber/30">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-display font-bold text-pearl">Glória a Deus!</h3>
              <p className="text-pearl/60 text-sm">
                Sua leitura bíblica foi registrada com sucesso na sua conta.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-pearl/50">Passagem:</span>
                <span className="font-bold text-pearl">{completedStats.book} {completedStats.chapter}:{completedStats.startVerse}-{completedStats.endVerse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pearl/50">Modo:</span>
                <span className="font-bold text-amber">{completedStats.bibleType === "fisica" ? "Bíblia Física" : "Bíblia Digital"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pearl/50">Tempo dedicado:</span>
                <span className="font-bold text-pearl">{completedStats.timeString}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pearl/50">Versículos lidos:</span>
                <span className="font-bold text-emerald-400">{completedStats.versesRead}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pearl/50">Pontos de Fé (XP):</span>
                <span className="font-bold text-amber">+{completedStats.xpEarned} XP</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowCelebration(false);
                setSeconds(0);
              }}
              className="w-full bg-amber text-navy font-bold py-3.5 rounded-2xl shadow-xl hover:scale-105 transition-all text-sm"
            >
              Amém, Continuar Minha Jornada
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
