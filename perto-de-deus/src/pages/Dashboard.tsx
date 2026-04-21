import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Zap, Heart, BookOpen, MessageSquare, Plus, ChevronRight, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, limit, onSnapshot, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lastPrayer, setLastPrayer] = useState<any>(null);
  const [todaysDevotional, setTodaysDevotional] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

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

    return () => { unsubPrayer(); unsubDevo(); };
  }, [user]);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-amber font-medium tracking-widest uppercase text-xs"
        >
          Bom dia em Cristo
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-display font-bold leading-tight"
        >
          Olá, {user?.displayName?.split(' ')[0] || "viajante"}
        </motion.h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Streak & Level Summary */}
        <section className="glow-card col-span-1 md:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
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
              "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho."
            </blockquote>
          </div>
          <div className="mt-6 flex items-center justify-between">
             <p className="text-amber font-display font-bold">Salmos 119:105</p>
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
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
           {[
             { label: "Bíblia", icon: BookOpen, path: "/bible", color: "bg-blue-500/10 text-blue-400" },
             { label: "Diário", icon: Heart, path: "/diary", color: "bg-rose-500/10 text-rose-400" },
             { label: "Oração", icon: MessageSquare, path: "/prayer", color: "bg-amber/10 text-amber" },
             { label: "Igrejas", icon: MapPin, path: "/churches", color: "bg-emerald-500/10 text-emerald-400" },
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
