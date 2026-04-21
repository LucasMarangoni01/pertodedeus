import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PenTool, Calendar, Plus, Save, Hash, Smile, Search, ChevronLeft, ChevronRight, Trash2, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const moods = [
  { label: "Grato", icon: "🙏" },
  { label: "Em paz", icon: "🕊️" },
  { label: "Ansioso", icon: "🌪️" },
  { label: "Lutando", icon: "⚔️" },
  { label: "Alegre", icon: "☀️" },
  { label: "Seco", icon: "🏜️" },
];

export default function Diary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("Em paz");
  const [godSpoke, setGodSpoke] = useState("");
  const [learning, setLearning] = useState("");
  const [ledToThis, setLedToThis] = useState("");
  const [doDifferently, setDoDifferently] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "journal"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      if (selectedEntry?.id) {
        await updateDoc(doc(db, "users", user.uid, "journal", selectedEntry.id), {
          content, mood, godSpoke, learning, ledToThis, doDifferently, updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "users", user.uid, "journal"), {
          userId: user.uid,
          date: today,
          content, mood, godSpoke, learning, ledToThis, doDifferently,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContent("");
    setMood("Em paz");
    setGodSpoke("");
    setLearning("");
    setLedToThis("");
    setDoDifferently("");
    setSelectedEntry(null);
  };

  const startEdit = (entry: any) => {
    setSelectedEntry(entry);
    setContent(entry.content || "");
    setMood(entry.mood || "Em paz");
    setGodSpoke(entry.godSpoke || "");
    setLearning(entry.learning || "");
    setLedToThis(entry.ledToThis || "");
    setDoDifferently(entry.doDifferently || "");
    setIsEditing(true);
  };

  const handleDeleteEntry = async (entryId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idToDelete = entryId || confirmDeleteId;
    if (!idToDelete) return;
    
    setDeletingId(idToDelete);
    try {
      await deleteDoc(doc(db, "users", user!.uid, "journal", idToDelete));
      if (selectedEntry?.id === idToDelete) {
        setIsEditing(false);
        resetForm();
      }
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      alert("Erro ao excluir entrada do diário.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-amber font-medium tracking-widest uppercase text-xs">Intimidade</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Diário Espiritual</h1>
        </div>
        
        <button 
          onClick={() => { resetForm(); setIsEditing(true); }}
          className="flex items-center gap-2 bg-amber text-navy px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" /> Nova Entrada
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Heatmap/Calendar Summary (Mocked) */}
        <div className="lg:col-span-12 glow-card flex items-center justify-between gap-4 py-4 overflow-x-auto">
           <div className="flex gap-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-3 h-3 rounded-sm transition-colors",
                    i % 3 === 0 ? "bg-amber" : i % 5 === 0 ? "bg-amber/60" : "bg-white/5"
                  )} 
                />
              ))}
           </div>
           <p className="text-xs text-pearl/40 font-bold uppercase whitespace-nowrap">Consistência Mensal</p>
        </div>

        {/* Entries List */}
        <div className="lg:col-span-12 space-y-4">
           {entries.map((entry) => (
             <motion.div 
               layout
               key={entry.id}
               onClick={() => startEdit(entry)}
               className="glow-card border-amber/5 hover:border-amber/40 cursor-pointer flex flex-col md:flex-row md:items-center gap-6 group"
             >
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center md:min-w-[100px] gap-2 border-b md:border-b-0 md:border-r border-amber/10 pb-4 md:pb-0 md:pr-6">
                   <div className="text-2xl">{moods.find(m => m.label === entry.mood)?.icon || "📖"}</div>
                   <div className="text-center">
                      <p className="text-xl font-display font-bold text-amber">
                        {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), "dd") : "--"}
                      </p>
                      <p className="text-[10px] text-pearl/40 uppercase font-bold">
                        {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), "MMM", { locale: ptBR }) : "..."}
                      </p>
                   </div>
                </div>

                <div className="flex-1 space-y-2">
                   <p className="text-pearl/80 line-clamp-2 md:line-clamp-1 font-serif text-lg leading-relaxed">
                     {entry.content}
                   </p>
                   <div className="flex flex-wrap gap-2">
                      {entry.tags?.map((tag: string) => (
                        <span key={tag} className="text-[10px] text-amber/60 bg-amber/5 px-2 py-0.5 rounded border border-amber/10">#{tag}</span>
                      ))}
                      {entry.godSpoke && <span className="text-[10px] text-grape/60 bg-grape/5 px-2 py-0.5 rounded border border-grape/10 font-bold">DEUS FALOU</span>}
                   </div>
                </div>

                   <div className="flex flex-col gap-2">
                     <button className="md:opacity-0 group-hover:opacity-100 p-2 text-pearl/20 hover:text-amber transition-all">
                        <ChevronRight className="w-5 h-5" />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(entry.id); }}
                       disabled={deletingId === entry.id}
                       className="p-2 text-pearl/40 hover:text-pearl transition-all md:opacity-0 group-hover:opacity-100 disabled:opacity-50"
                       title="Excluir"
                     >
                       <Trash2 className={cn("w-5 h-5", deletingId === entry.id && "animate-pulse")} />
                     </button>
                   </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-navy/95 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-navy border border-amber/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] flex flex-col shadow-[0_0_100px_rgba(201,168,76,0.15)]"
             >
                <header className="p-8 border-b border-amber/10 flex items-center justify-between sticky top-0 bg-navy z-10">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber/10 rounded-2xl flex items-center justify-center text-amber">
                         <PenTool className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-display font-bold">Meu Diário</h2>
                        <p className="text-pearl/40 text-xs font-bold uppercase tracking-widest">{format(new Date(), "PPPP", { locale: ptBR })}</p>
                      </div>
                   </div>
                   <button onClick={() => setIsEditing(false)} className="text-pearl/40 hover:text-pearl transition-colors">✕ Fechar</button>
                </header>

                <div className="p-8 space-y-10">
                   {/* Mood Selector */}
                   <div className="space-y-4">
                      <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest">Como está seu coração hoje?</label>
                      <div className="flex flex-wrap gap-3">
                         {moods.map((m) => (
                           <button
                             key={m.label}
                             onClick={() => setMood(m.label)}
                             className={cn(
                               "flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-sm",
                               mood === m.label 
                                 ? "bg-amber border-amber text-navy font-bold shadow-[0_0_20px_rgba(201,168,76,0.3)]"
                                 : "bg-white/5 border-amber/10 text-pearl/60 hover:border-amber/40"
                             )}
                           >
                             <span className="text-lg">{m.icon}</span> {m.label}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
                             <Smile className="w-4 h-4 text-amber" /> O que estou sentindo?
                          </label>
                          <textarea 
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Desabafe livremente..."
                            className="w-full bg-white/5 border border-amber/10 rounded-3xl p-6 font-serif text-lg focus:border-amber outline-none transition-colors min-h-[160px] resize-none"
                          />
                        </div>
                        
                        <div className="space-y-4">
                           <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
                              <Hash className="w-4 h-4 text-rose-400" /> O que me levou a isso?
                           </label>
                           <textarea 
                             value={ledToThis}
                             onChange={e => setLedToThis(e.target.value)}
                             placeholder="Ex: Uma conversa difícil, cansaço, tédio..."
                             className="w-full bg-white/5 border border-amber/10 rounded-3xl p-6 font-serif text-lg focus:border-amber outline-none transition-colors min-h-[160px] resize-none"
                           />
                        </div>

                        <div className="space-y-4">
                           <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-amber" /> O que aprendi?
                           </label>
                           <textarea 
                             value={learning}
                             onChange={e => setLearning(e.target.value)}
                             placeholder="Onde Deus esteve no meio de tudo isso?"
                             className="w-full bg-white/5 border border-amber/10 rounded-3xl p-6 font-serif text-lg focus:border-amber outline-none transition-colors min-h-[160px] resize-none"
                           />
                        </div>

                        <div className="space-y-4">
                           <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
                              <ChevronRight className="w-4 h-4 text-pearl" /> O que vou fazer diferente?
                           </label>
                           <textarea 
                             value={doDifferently}
                             onChange={e => setDoDifferently(e.target.value)}
                             placeholder="Qual a sua ação prática de mudança amanhã?"
                             className="w-full bg-white/5 border border-amber/10 rounded-3xl p-6 font-serif text-lg focus:border-amber outline-none transition-colors min-h-[160px] resize-none"
                           />
                        </div>
                      </div>
                   </div>
                </div>

                <footer className="p-8 border-t border-amber/10 flex items-center justify-between gap-4 bg-navy/80 backdrop-blur-md sticky bottom-0">
                   {selectedEntry ? (
                     <button 
                       onClick={() => setConfirmDeleteId(selectedEntry.id)}
                       className="flex items-center gap-2 text-grape hover:bg-grape/10 px-4 py-3 rounded-xl transition-all font-bold"
                     >
                       <Trash2 className="w-5 h-5" />
                       <span className="hidden md:inline">Excluir Página</span>
                     </button>
                   ) : <div />}
                   
                   <button 
                     onClick={handleSave}
                     disabled={loading || !content.trim()}
                     className="flex items-center gap-3 bg-amber text-navy font-bold px-10 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                   >
                     {loading ? "Consagrando..." : <><Save className="w-6 h-6" /> Guardar no Coração</>}
                   </button>
                </footer>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-navy/95 backdrop-blur-md">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-navy border border-grape/50 w-full max-w-sm rounded-[2rem] p-8 space-y-6 text-center"
           >
              <div className="w-16 h-16 bg-grape/10 rounded-full flex items-center justify-center text-grape mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold">Remover Registro?</h3>
                <p className="text-pearl/60 text-sm">Esta ação não pode ser desfeita. Deseja realmente excluir esta entrada do diário?</p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  disabled={deletingId !== null}
                  onClick={() => handleDeleteEntry()}
                  className="w-full bg-grape hover:bg-grape/80 text-white font-bold py-4 rounded-2xl shadow-xl transition-all"
                >
                  {deletingId ? "Excluindo..." : "Sim, Excluir Registro"}
                </button>
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full py-3 text-pearl/40 font-bold hover:text-pearl transition-colors"
                >
                  Cancelar
                </button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}
