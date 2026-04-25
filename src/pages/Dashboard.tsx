import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Zap, Heart, BookOpen, MessageSquare, Plus, ChevronRight, MapPin, HelpCircle, Flame, Calendar as CalendarIcon, ShieldAlert, Search, Megaphone, X as CloseIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, limit, onSnapshot, orderBy } from "firebase/firestore";
import { useNavigate, useOutletContext } from "react-router-dom";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const { openSearch } = useOutletContext<{ openSearch: () => void }>();
  const [lastPrayer, setLastPrayer] = useState<any>(null);
  const [todaysDevotional, setTodaysDevotional] = useState<any>(null);
  const [randomVerse, setRandomVerse] = useState({ text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", ref: "Salmos 119:105" });
  const [announcement, setAnnouncement] = useState<any>(null);
  const [dismissedAnnounce, setDismissedAnnounce] = useState<string | null>(null);

  const bibleVerses = [
    { text: "O Senhor é o meu pastor, nada me faltará.", ref: "Salmos 23:1" },
    { text: "Posso todas as coisas naquele que me fortalece.", ref: "Filipenses 4:13" },
    { text: "O Senhor te abençoe e te guarde.", ref: "Números 6:24" },
    { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
    { text: "O amor é paciente, o amor é bondoso.", ref: "1 Coríntios 13:4" },
    { text: "Eu sou o caminho, a verdade e a vida.", ref: "João 14:6" },
    { text: "Deus é o nosso refúgio e fortaleza.", ref: "Salmos 46:1" },
    { text: "Buscai primeiro o Reino de Deus.", ref: "Mateus 6:33" },
    { text: "O meu socorro vem do Senhor.", ref: "Salmos 121:2" },
    { text: "Seja forte e corajoso.", ref: "Josué 1:9" },
    { text: "A alegria do Senhor é a vossa força.", ref: "Neemias 8:10" },
    { text: "O Senhor é a minha luz e a minha salvação.", ref: "Salmos 27:1" },
    { text: "Crê no Senhor Jesus e serás salvo.", ref: "Atos 16:31" },
    { text: "Guardei no coração a tua palavra para não pecar contra ti.", ref: "Salmos 119:11" },
    { text: "Onde estiver o seu tesouro, aí estará o seu coração.", ref: "Mateus 6:21" }
  ];

  useEffect(() => {
    // Pick a random verse regardless of user status
    const randomIndex = Math.floor(Math.random() * bibleVerses.length);
    setRandomVerse(bibleVerses[randomIndex]);

    if (!user || isGuest) return;

    // Fetch latest active prayer
    const qPrayer = query(
      collection(db, "prayer_requests"),
      where("userId", "==", user.uid),
      where("status", "==", "Em oração"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const unsubPrayer = onSnapshot(qPrayer, (s) => {
      if (!s.empty) setLastPrayer({ id: s.docs[0].id, ...s.docs[0].data() });
    });

    // Fetch today's devotional
    const today = new Date().toISOString().split('T')[0];
    const qDevo = query(
      collection(db, "users", user.uid, "devotionals"),
      where("date", "==", today),
      limit(1)
    );
    const unsubDevo = onSnapshot(qDevo, (s) => {
      if (!s.empty) setTodaysDevotional({ id: s.docs[0].id, ...s.docs[0].data() });
    });

    // Fetch latest active announcement
    const qAnnounce = query(
      collection(db, "global_announcements"),
      where("active", "==", true),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const unsubAnnounce = onSnapshot(qAnnounce, (s) => {
      if (!s.empty) {
        const data = { id: s.docs[0].id, ...s.docs[0].data() };
        setAnnouncement(data);
      } else {
        setAnnouncement(null);
      }
    });

    return () => { 
      unsubPrayer(); 
      unsubDevo(); 
      unsubAnnounce();
    };
  }, [user, isGuest]);

  return (
    <div className="space-y-10">
      {announcement && dismissedAnnounce !== announcement.id && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-6 rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6",
            announcement.type === 'alert' ? "bg-amber/10 border-amber/30 text-amber" : 
            announcement.type === 'welcome' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
            "bg-blue-500/10 border-blue-500/30 text-blue-400"
          )}
        >
          <div className={cn(
            "p-4 rounded-2xl shrink-0",
            announcement.type === 'alert' ? "bg-amber/20" : 
            announcement.type === 'welcome' ? "bg-emerald-500/20" : "bg-blue-500/20"
          )}>
            <Megaphone className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-display font-bold mb-1">{announcement.title}</h4>
            <p className="text-sm opacity-80 leading-relaxed">{announcement.content}</p>
          </div>
          <button 
            onClick={() => setDismissedAnnounce(announcement.id)}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {isGuest && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber/10 border border-amber/20 p-4 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="text-amber w-5 h-5" />
            <p className="text-xs font-bold text-amber/80">MODO VISITANTE: Algumas funções de salvamento estão desativadas.</p>
          </div>
          <button 
            onClick={() => navigate("/login")}
            className="text-[10px] font-bold bg-amber text-navy px-3 py-1.5 rounded-lg hover:scale-105 transition-transform"
          >
            FAZER LOGIN
          </button>
        </motion.div>
      )}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-amber font-medium tracking-widest uppercase text-xs"
          >
            {isGuest ? "Bem-vindo ao Perto de Deus" : "Bom dia em Cristo"}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold leading-tight"
          >
            Olá, {user?.displayName?.split(' ')[0] || "Visitante"}
          </motion.h1>
        </div>

        <div className="flex-1 max-w-md w-full relative group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pearl/20 group-focus-within:text-amber transition-colors" />
           <input 
             type="text"
             readOnly
             onClick={openSearch} 
             placeholder="O que você busca hoje?"
             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none hover:border-white/20 transition-all cursor-pointer font-display text-sm focus:border-amber/50"
           />
           <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
              <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/5 text-pearl/20 font-mono">/</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Continue Bible Progress - New & Optimized */}
        <section className="col-span-1 md:col-span-2 lg:col-span-1">
           <motion.div 
             whileHover={{ y: -4 }}
             onClick={() => navigate("/bible")}
             className="glow-card h-full flex flex-col justify-between border-amber/20 bg-amber/5 relative overflow-hidden group cursor-pointer"
           >
              <div className="absolute -top-6 -right-6 opacity-10 group-hover:scale-110 transition-transform">
                 <BookOpen className="w-24 h-24 text-amber" />
              </div>
              <div>
                 <div className="text-amber text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber animate-pulse" /> Continuar Lendo
                 </div>
                 {user?.bibleProgress ? (
                   <>
                      <h3 className="text-2xl font-display font-bold mb-1">{user.bibleProgress.book} {user.bibleProgress.chapter}</h3>
                      <p className="text-pearl/60 text-xs font-medium">Versículo {user.bibleProgress.verse} • {user.bibleProgress.version || "ARA"}</p>
                   </>
                 ) : (
                   <h3 className="text-xl font-display font-bold">Começar Leitura</h3>
                 )}
              </div>
              <div className="mt-8 flex items-center justify-between">
                 <div className="h-1 flex-1 bg-white/5 rounded-full mr-4 overflow-hidden">
                    <div className="h-full bg-amber w-1/3" />
                 </div>
                 <ChevronRight className="w-5 h-5 text-amber group-hover:translate-x-1 transition-transform" />
              </div>
           </motion.div>
        </section>

        {/* Streak & Level Summary */}
        <section className="glow-card col-span-1 md:col-span-2 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <Heart className="w-64 h-64 text-amber" fill="currentColor" />
          </div>
          
          <div className="flex items-center gap-6 z-10">
            <div className="w-16 h-16 bg-amber/10 rounded-2xl flex items-center justify-center text-amber relative">
              <Zap className="w-8 h-8" fill="currentColor" />
              <div className="absolute inset-0 bg-amber/20 blur-xl rounded-full" />
            </div>
            <div>
              <p className="text-pearl/60 text-[10px] uppercase font-bold tracking-widest">Ofensiva de Fé</p>
              <p className="text-3xl font-display font-bold text-amber">{user?.streak || 0} dias</p>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] space-y-4 z-10">
            <div className="flex justify-between items-center text-[10px] font-bold text-pearl/40 uppercase tracking-widest">
               <span>Nível: {user?.spiritualLevel || "Semente"}</span>
               <span>75% para o próximo</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-amber w-3/4 shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
            </div>
          </div>
        </section>

        {/* Daily Devotional Preview */}
        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => navigate("/devotional")}
          className="glow-card col-span-1 md:col-span-2 relative overflow-hidden group cursor-pointer border-amber/10"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber/5 blur-3xl rounded-full group-hover:bg-amber/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-amber text-[10px] font-bold mb-4 uppercase tracking-widest">
               <Sparkles className="w-3 h-3 animate-pulse" /> Pão Diário
            </div>
            {todaysDevotional ? (
              <>
                <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-amber transition-colors line-clamp-1">{todaysDevotional.title}</h3>
                <p className="text-pearl/60 font-serif text-lg leading-relaxed line-clamp-3 mb-6 italic">
                   "{todaysDevotional.verse}"
                </p>
              </>
            ) : (
              <div className="py-6 text-pearl/40">Gere seu devocional de hoje...</div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-amber/5">
              <span className="text-xs text-pearl/40">Alimento para a alma</span>
              <div className="text-amber text-sm font-bold flex items-center gap-2">
                 Ver reflexão <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Bible Verse */}
        <div className="glow-card paper-texture border-amber/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-pearl/40 text-[10px] font-bold mb-4 uppercase tracking-widest">
               <BookOpen className="w-3 h-3" /> Palavra Viva
            </div>
            <blockquote className="space-y-4 italic font-serif text-lg text-pearl/90 leading-relaxed">
              "{randomVerse.text}"
            </blockquote>
          </div>
          <div className="mt-6 flex items-center justify-between">
             <p className="text-amber font-display font-bold">{randomVerse.ref}</p>
             <button onClick={() => navigate("/bible")} className="p-2 bg-amber/10 text-amber rounded-lg hover:bg-amber hover:text-navy transition-all">
                <ChevronRight className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Active Prayers Recap */}
        <div className="glow-card col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-between border-amber/5">
           <div>
              <div className="flex items-center gap-2 text-pearl/40 text-[10px] font-bold mb-4 uppercase tracking-widest">
                 <MessageSquare className="w-3 h-3" /> Clamor Atual
              </div>
              {lastPrayer ? (
                <div className="space-y-3">
                   <h4 className="text-xl font-bold">{lastPrayer.title}</h4>
                   <p className="text-pearl/60 text-sm line-clamp-2 italic">"{lastPrayer.description}"</p>
                </div>
              ) : (
                <p className="text-pearl/20 italic">Nenhum pedido de oração ativo.</p>
              )}
           </div>
           
           <div className="mt-8 flex gap-3">
              <button 
                onClick={() => navigate("/prayer")}
                className="flex-1 bg-amber/10 text-amber py-3 rounded-xl text-xs font-bold hover:bg-amber hover:text-navy transition-all border border-amber/20"
              >
                Ver Todos
              </button>
              <button 
                onClick={() => navigate("/prayer")}
                className="flex items-center justify-center p-3 text-amber bg-amber/5 border border-amber/10 rounded-xl hover:bg-amber/10"
              >
                 <Plus className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Action Shortcuts */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-6 gap-4">
           {[
             { label: "Agenda", icon: CalendarIcon, path: "/agenda", color: "bg-amber/20 text-amber" },
             { label: "Lutas", icon: Flame, path: "/struggles", color: "bg-grape/20 text-grape" },
             { label: "Jejum", icon: Flame, path: "/jejum", color: "bg-amber/10 text-amber" },
             { label: "Diário", icon: Heart, path: "/diary", color: "bg-grape/10 text-pearl/80" },
             { label: "Oração", icon: MessageSquare, path: "/prayer", color: "bg-amber/10 text-amber" },
             { label: "SOS", icon: ShieldAlert, path: "/sos", color: "bg-red-500/20 text-red-400" },
           ].map((item, i) => (
             <button 
               key={i}
               onClick={() => navigate(item.path)}
               className={cn(
                 "p-6 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-3 hover:border-amber/40 transition-all group",
                 "bg-white/[0.02]"
               )}
             >
                <div className={cn("p-3 rounded-xl", item.color)}>
                   <item.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-pearl/60 group-hover:text-amber">{item.label}</span>
             </button>
           ))}
        </div>
      </div>
    </div>
  );
}
