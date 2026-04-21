import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, limit, onSnapshot, orderBy, updateDoc, doc, increment } from "firebase/firestore";
import { Heart, MessageSquare, Share2, Plus, Users, User, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../lib/utils";

export default function Community() {
  const { user } = useAuth();
  const [publicRequests, setPublicRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("pedidos");
  const [notification, setNotification] = useState<string | null>(null);

  const handleAmen = async (requestId: string) => {
    if (!user) {
      setNotification("Você precisa estar logado para orar.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    try {
      const requestRef = doc(db, "prayer_requests", requestId);
      await updateDoc(requestRef, {
        intercessorCount: increment(1)
      });
      setNotification("Amém! Você está intercedendo por esta causa.");
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Erro ao dar amém:", error);
    }
  };

  const showWipAlert = (feature: string) => {
    setNotification(`${feature} disponível em breve!`);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const q = query(
      collection(db, "prayer_requests"),
      where("isPublic", "==", true),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPublicRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-10 relative">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-amber text-navy px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 border border-white/20 whitespace-nowrap"
          >
            <Heart className="w-5 h-5 fill-navy" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-amber font-medium tracking-widest uppercase text-xs">Mural</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Comunidade</h1>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-amber/10 self-start">
          <button 
            onClick={() => setActiveTab("pedidos")}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === "pedidos" ? "bg-amber text-navy shadow-lg" : "text-pearl/60 hover:text-pearl")}
          >
            Pedidos
          </button>
          <button 
            onClick={() => { setActiveTab("testemunhos"); showWipAlert("Mural de Testemunhos"); }}
            className={cn("px-6 py-2 rounded-xl text-sm font-medium transition-all", activeTab === "testemunhos" ? "bg-amber text-navy shadow-lg" : "text-pearl/60 hover:text-pearl")}
          >
            Testemunhos
          </button>
          <button 
            onClick={() => { setActiveTab("grupos"); showWipAlert("Grupos de Oração"); }}
            className={cn("px-6 py-2 rounded-xl text-sm font-medium transition-all", activeTab === "grupos" ? "bg-amber text-navy shadow-lg" : "text-pearl/60 hover:text-pearl")}
          >
            Grupos
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
           {publicRequests.map((req) => (
             <motion.div 
               key={req.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="glow-card space-y-6 group"
             >
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-amber/10 flex items-center justify-center text-amber">
                         <User className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-xs font-bold uppercase tracking-widest text-amber">Missionário Anônimo</p>
                         <p className="text-[10px] text-pearl/40">Há {format(req.createdAt?.toDate ? req.createdAt.toDate() : new Date(), "HH'h' mm'min'", { locale: ptBR })}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber/10 text-amber text-[10px] font-bold">
                      <Users className="w-3 h-3" /> {req.intercessorCount} orando
                   </div>
                </div>

                <div className="space-y-3">
                   <h3 className="text-xl font-display font-bold">{req.title}</h3>
                   <p className="text-pearl/60 font-serif text-lg italic leading-relaxed">"{req.description || "Por favor, intercedam por esta causa."}"</p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-amber/5">
                   <button 
                    onClick={() => handleAmen(req.id)}
                    className="flex items-center gap-2 text-sm font-bold text-amber hover:scale-105 transition-transform bg-amber/5 px-4 py-2 rounded-xl border border-amber/10 group-hover:bg-amber/20"
                   >
                      <Heart className="w-4 h-4" /> Amém
                   </button>
                   <button 
                    onClick={() => showWipAlert("Mensagens de Encorajamento")}
                    className="flex items-center gap-2 text-sm font-bold text-pearl/40 hover:text-amber transition-colors"
                   >
                      <MessageSquare className="w-4 h-4" /> Encorajar
                   </button>
                   <button 
                    onClick={() => showWipAlert("Compartilhamento")}
                    className="ml-auto text-pearl/20 hover:text-amber transition-colors"
                   >
                      <Share2 className="w-5 h-5" />
                   </button>
                </div>
             </motion.div>
           ))}

           {publicRequests.length === 0 && (
             <div className="py-24 text-center opacity-20">
                <Users className="w-20 h-20 mx-auto mb-4" />
                <p className="font-display text-2xl italic">"Onde dois ou três estiverem reunidos..."</p>
             </div>
           )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
           <div className="glow-card bg-amber/5 border-amber/20 space-y-4">
              <div className="w-12 h-12 bg-amber rounded-2xl flex items-center justify-center text-navy shadow-lg">
                 <Plus className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-bold leading-tight">Compartilhe sua jornada</h3>
              <p className="text-sm text-pearl/60">Seu testemunho pode ser a luz na vida de alguém hoje.</p>
              <button 
                onClick={() => showWipAlert("Publicação de Testemunho")}
                className="w-full bg-amber text-navy font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
              >
                 Publicar Testemunho
              </button>
           </div>

           <div className="glow-card border-amber/5 space-y-6">
              <h4 className="text-xs font-bold text-pearl/40 uppercase tracking-widest">Meus Grupos</h4>
              <div className="space-y-4">
                 {[
                   { name: "Célula Ebenezer", members: 12 },
                   { name: "Ministério Jovens", members: 45 },
                   { name: "Estudo Livro de Romanos", members: 8 }
                 ].map((g, i) => (
                   <div 
                    key={i} 
                    onClick={() => showWipAlert(`Grupo ${g.name}`)}
                    className="flex items-center justify-between group cursor-pointer"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber/40 group-hover:text-amber transition-colors">
                            <Users className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-bold group-hover:text-amber transition-colors">{g.name}</p>
                            <p className="text-[10px] text-pearl/40">{g.members} membros</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-pearl/20" />
                   </div>
                 ))}
              </div>
              <button 
                onClick={() => showWipAlert("Ver todos os grupos")}
                className="w-full text-xs font-bold text-amber hover:underline transition-all"
              >
                Ver todos os grupos
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
}
