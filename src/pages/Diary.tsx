import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PenTool, Calendar, Plus, Save, Hash, Smile, Search, ChevronLeft, ChevronRight, Trash2, BookOpen, Mic } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { cn } from "../lib/utils";
import { storage } from "../lib/firebase";
import { AudioRecorder } from "../components/diary/AudioRecorder";
import { AudioPreview } from "../components/diary/AudioPreview";
import { SpeechControls } from "../components/diary/SpeechControls";
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
  const { user, isGuest } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
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
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const audioUrlRef = useRef(audioUrl);

  // Sync ref with state for background logic
  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  // Safely close editor and reset all related states
  const closeEditor = () => {
    setIsEditing(false);
    setIsUploadingAudio(false);
    setLoading(false);
  };

  useEffect(() => {
    if (!user || isGuest) {
      setIsInitialLoading(false);
      return;
    }
    const q = query(
      collection(db, "users", user.uid, "journal"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsInitialLoading(false);
    }, (err) => {
      console.error("Journal Error:", err);
      setIsInitialLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    if (isGuest) {
      alert("No Modo Visitante suas reflexões não são salvas no servidor. Faça login para manter seu diário eterno.");
      return;
    }
    setLoading(true);
    try {
      console.log("[Diary] Iniciando salvamento...");
      const { withTimeout } = await import("../lib/firebase");
      const today = new Date().toISOString().split('T')[0];
      const payload: any = {
        content: content.trim(),
        mood: mood || "Em paz",
        godSpoke: godSpoke || "",
        learning: learning || "",
        ledToThis: ledToThis || "",
        doDifferently: doDifferently || "",
        audioUrl: audioUrl || "",
        tags: tags || [],
        updatedAt: serverTimestamp()
      };

      let operation;
      if (selectedEntry?.id) {
        if (selectedEntry.audioUrl && !audioUrl) {
           const oldRef = ref(storage, selectedEntry.audioUrl);
           deleteObject(oldRef).catch(e => console.warn("Background cleanup failed", e));
        }
        const entryRef = doc(db, "users", user.uid, "journal", selectedEntry.id);
        operation = updateDoc(entryRef, payload);
      } else {
        const newEntry = {
          ...payload,
          userId: user.uid,
          date: today,
          createdAt: serverTimestamp()
        };
        delete newEntry.updatedAt;
        operation = addDoc(collection(db, "users", user.uid, "journal"), newEntry);
      }

      await withTimeout(operation, 12000);
      
      closeEditor();
      resetForm();
    } catch (error: any) {
      console.error("[Diary] Error saving entry:", error);
      alert(error.message === "TIMEOUT_FIREBASE" 
        ? "Tempo esgotado ao salvar o diário em produção." 
        : "Erro ao salvar entrada.");
    } finally {
      console.log("[Diary] Finalizando loading");
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
    setAudioUrl("");
    setTags([]);
    setTagInput("");
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
    setAudioUrl(entry.audioUrl || "");
    setTags(entry.tags || []);
    setTagInput("");
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
        closeEditor();
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

  const handleAddTag = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9à-ú]/g, '');
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const matchesContent = entry.content?.toLowerCase().includes(search);
    const matchesTags = entry.tags?.some((t: string) => t.toLowerCase().includes(search));
    const matchesMood = entry.mood?.toLowerCase().includes(search);
    return matchesContent || matchesTags || matchesMood;
  });

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

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pearl/40 w-5 h-5" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrar por conteúdo, tags ou humor..."
          className="w-full bg-white/5 border border-amber/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-amber transition-colors text-pearl placeholder:text-pearl/20"
        />
      </div>

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
           {isInitialLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="glow-card h-32 animate-pulse bg-white/5 border-amber/5" />
             ))
           ) : entries.length === 0 ? (
             <div className="py-20 text-center space-y-6 bg-white/5 border border-amber/10 rounded-[2.5rem]">
               <BookOpen className="w-20 h-20 text-pearl/5 mx-auto" />
               <div className="space-y-2">
                 <p className="text-2xl font-display font-medium text-pearl/40">Seu diário está em branco</p>
                 <p className="text-pearl/20 max-w-sm mx-auto">Comece a registrar suas experiências, aprendizados e o que Deus tem falado com você.</p>
               </div>
               <button 
                 onClick={() => { resetForm(); setIsEditing(true); }}
                 className="text-amber font-bold p-3 px-6 rounded-xl border border-amber/20 hover:bg-amber/10 transition-all"
               >
                 Criar Primeiro Registro
               </button>
             </div>
           ) : filteredEntries.length === 0 ? (
             <div className="py-20 text-center space-y-6 bg-white/5 border border-amber/10 rounded-[2.5rem]">
               <BookOpen className="w-20 h-20 text-pearl/5 mx-auto" />
               <div className="space-y-2">
                 <p className="text-2xl font-display font-medium text-pearl/40">Nenhum registro encontrado</p>
                 <p className="text-pearl/20 max-w-sm mx-auto">Tente ajustar seus termos de busca ou filtros.</p>
               </div>
             </div>
           ) : (
             filteredEntries.map((entry) => (
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
                        {entry.audioUrl && (
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-amber/60 bg-amber/5 px-2 py-0.5 rounded border border-amber/10 flex items-center gap-1">
                               <Mic className="w-2 h-2" /> VIVA VOZ
                             </span>
                             <AudioPreview url={entry.audioUrl} />
                          </div>
                        )}
                        <div className="pt-2">
                          <SpeechControls text={entry.content} />
                        </div>
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
             ))
           )}
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 md:p-10 bg-navy/95 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-navy border border-amber/20 w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto sm:rounded-[2.5rem] flex flex-col shadow-[0_0_100px_rgba(201,168,76,0.15)]"
             >
                <header className="p-4 sm:p-8 border-b border-amber/10 flex items-center justify-between sticky top-0 bg-navy z-10">
                   <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber">
                         <PenTool className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-2xl font-display font-bold">Meu Diário</h2>
                        <p className="text-pearl/40 text-[10px] font-bold uppercase tracking-widest">{format(new Date(), "PPPP", { locale: ptBR })}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 sm:gap-4">
                      <SpeechControls text={content} className="scale-90 sm:scale-100" />
                      <button onClick={closeEditor} className="text-pearl/40 hover:text-pearl transition-colors text-sm sm:text-base whitespace-nowrap">✕ Fechar</button>
                   </div>
                </header>

                <div className="p-4 sm:p-8 space-y-6 sm:space-y-10">
                   {/* Mood Selector */}
                   <div className="space-y-3 sm:space-y-4">
                      <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest">Como está seu coração hoje?</label>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                         {moods.map((m) => (
                           <button
                             key={m.label}
                             onClick={() => setMood(m.label)}
                             className={cn(
                               "flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm",
                               mood === m.label 
                                 ? "bg-amber border-amber text-navy font-bold shadow-[0_0_20px_rgba(201,168,76,0.3)]"
                                 : "bg-white/5 border-amber/10 text-pearl/60 hover:border-amber/40"
                             )}
                           >
                             <span className="text-base sm:text-lg">{m.icon}</span> {m.label}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-6 sm:space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3 sm:space-y-4">
                          <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
                             <Smile className="w-4 h-4 text-amber" /> O que estou sentindo?
                          </label>
                          <textarea 
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Desabafe livremente..."
                            className="w-full bg-white/5 border border-amber/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 font-serif text-base sm:text-lg focus:border-amber outline-none transition-colors min-h-[120px] sm:min-h-[160px] resize-none"
                          />
                        </div>
                        
                        <div className="space-y-3 sm:space-y-4">
                           <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
                              <Hash className="w-4 h-4 text-rose-400" /> O que me levou a isso?
                           </label>
                           <textarea 
                             value={ledToThis}
                             onChange={e => setLedToThis(e.target.value)}
                             placeholder="Ex: Uma conversa difícil, cansaço, tédio..."
                             className="w-full bg-white/5 border border-amber/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 font-serif text-base sm:text-lg focus:border-amber outline-none transition-colors min-h-[120px] sm:min-h-[160px] resize-none"
                           />
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                           <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-amber" /> O que aprendi?
                           </label>
                           <textarea 
                             value={learning}
                             onChange={e => setLearning(e.target.value)}
                             placeholder="Onde Deus esteve no meio de tudo isso?"
                             className="w-full bg-white/5 border border-amber/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 font-serif text-base sm:text-lg focus:border-amber outline-none transition-colors min-h-[120px] sm:min-h-[160px] resize-none"
                           />
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                           <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
                              <ChevronRight className="w-4 h-4 text-pearl" /> O que vou fazer diferente?
                           </label>
                           <textarea 
                             value={doDifferently}
                             onChange={e => setDoDifferently(e.target.value)}
                             placeholder="Qual a sua ação prática de mudança amanhã?"
                             className="w-full bg-white/5 border border-amber/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 font-serif text-base sm:text-lg focus:border-amber outline-none transition-colors min-h-[120px] sm:min-h-[160px] resize-none"
                           />
                        </div>

                        <div className="space-y-4 sm:col-span-2 p-6 bg-white/5 border border-amber/10 rounded-3xl">
                           <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
                              <Hash className="w-4 h-4 text-amber" /> Tags e Categorias
                           </label>
                           
                           <div className="flex flex-wrap gap-2 mb-4">
                              {tags.map(tag => (
                                <motion.span 
                                  layout
                                  key={tag} 
                                  className="inline-flex items-center gap-1.5 bg-amber/10 text-amber border border-amber/20 px-3 py-1 rounded-full text-xs font-bold"
                                >
                                  #{tag}
                                  <button onClick={() => removeTag(tag)} className="hover:text-pearl transition-colors">
                                     <Plus className="w-3 h-3 rotate-45" />
                                  </button>
                                </motion.span>
                              ))}
                           </div>

                           <div className="flex gap-2">
                              <input 
                                type="text"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="Digite uma tag (ex: fé, provação)..."
                                className="flex-1 bg-white/5 border border-amber/10 rounded-xl px-4 py-2 text-sm focus:border-amber outline-none transition-colors"
                              />
                              <button 
                                type="button"
                                onClick={() => handleAddTag()}
                                className="bg-amber/10 text-amber px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber/20 transition-all"
                              >
                                Adicionar
                              </button>
                           </div>
                        </div>

                        <div className="sm:col-span-2 pt-2 sm:pt-4">
                           <AudioRecorder 
                             userId={user.uid}
                             onAudioUploaded={(url) => setAudioUrl(url || "")} 
                             onUploadingChange={setIsUploadingAudio}
                             existingAudioUrl={audioUrl}
                             onDeleteExisting={() => setAudioUrl("")}
                           />
                        </div>
                      </div>
                   </div>
                </div>

                <footer className="p-6 sm:p-8 border-t border-amber/10 flex items-center justify-between gap-3 sm:gap-4 bg-navy/80 backdrop-blur-md sticky bottom-0">
                   {selectedEntry ? (
                     <button 
                       onClick={() => setConfirmDeleteId(selectedEntry.id)}
                       className="flex items-center gap-2 text-grape hover:bg-grape/10 p-3 sm:px-4 sm:py-3 rounded-xl transition-all font-bold text-sm sm:text-base"
                     >
                       <Trash2 className="w-5 h-5" />
                       <span className="hidden sm:inline">Excluir Página</span>
                     </button>
                   ) : <div />}
                   
                   <button 
                     onClick={handleSave}
                     disabled={loading || isUploadingAudio || !content.trim()}
                     className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 bg-amber text-navy font-bold px-6 sm:px-10 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50 text-sm sm:text-base"
                   >
                     {loading ? "Consagrando..." : isUploadingAudio ? "Subindo..." : <><Save className="w-5 h-5 sm:w-6 sm:h-6" /> Guardar</>}
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
