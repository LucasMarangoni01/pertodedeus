import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, limit, onSnapshot, orderBy, updateDoc, doc, increment, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { Heart, MessageSquare, Share2, Plus, Users, User, ChevronRight, Send, X, BookOpen, Trash2, Edit2, Search, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../lib/utils";

export default function Community() {
  const { user } = useAuth();
  const [publicRequests, setPublicRequests] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatText, setEditingChatText] = useState("");
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("pedidos");
  const [notification, setNotification] = useState<string | null>(null);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const categories = ["Todos", "Família", "Saúde", "Trabalho", "Finanças", "Cura Emocional", "Intercessão", "Ministério", "Outros"];

  // States para o modal de testemunho
  const [isTestimonyModalOpen, setIsTestimonyModalOpen] = useState(false);
  const [testimonyTitle, setTestimonyTitle] = useState("");
  const [testimonyContent, setTestimonyContent] = useState("");
  const [editingTestimonyId, setEditingTestimonyId] = useState<string | null>(null);
  const [deletingTestimonyId, setDeletingTestimonyId] = useState<string | null>(null);

  const handlePublishTestimony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setNotification("Você precisa estar logado para publicar.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    if (!testimonyContent.trim()) return;

    try {
      await addDoc(collection(db, "testimonials"), {
        userId: user.uid,
        userName: user.displayName || "Irmão(ã)",
        title: testimonyTitle.trim() || "Testemunho",
        content: testimonyContent.trim(),
        likes: 0,
        createdAt: serverTimestamp()
      });
      setIsTestimonyModalOpen(false);
      setTestimonyTitle("");
      setTestimonyContent("");
      setActiveTab("testemunhos");
      setNotification("Testemunho publicado com sucesso! Aleluia!");
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error(error);
      setNotification("Erro ao publicar testemunho.");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteTestimony = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "testimonials", id));
      setNotification("Testemunho removido.");
      setDeletingTestimonyId(null);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error(err);
      setNotification(`Erro ao deletar: ${err.message || "Sem permissão"}`);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleUpdateTestimony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingTestimonyId || !testimonyContent.trim()) return;
    try {
      await updateDoc(doc(db, "testimonials", editingTestimonyId), {
        title: testimonyTitle.trim() || "Testemunho",
        content: testimonyContent.trim(),
        updatedAt: serverTimestamp()
      });
      setIsTestimonyModalOpen(false);
      setEditingTestimonyId(null);
      setTestimonyTitle("");
      setTestimonyContent("");
      setNotification("Testemunho atualizado com sucesso!");
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error(err);
      setNotification(`Erro ao atualizar: ${err.message || "Sem permissão"}`);
      setTimeout(() => setNotification(null), 5000);
    }
  };

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

    const qChat = query(
      collection(db, "global_chat"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribeChat = onSnapshot(qChat, (snapshot) => {
      setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    });

    const qTestimonials = query(
      collection(db, "testimonials"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsubscribeTestimonials = onSnapshot(qTestimonials, (snapshot) => {
      setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeChat();
      unsubscribeTestimonials();
    };
  }, []);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !chatInput.trim()) return;
    try {
      await addDoc(collection(db, "global_chat"), {
        userId: user.uid,
        userName: user.displayName || "Irmão(ã)",
        text: chatInput.trim(),
        createdAt: serverTimestamp()
      });
      setChatInput("");
    } catch (e) {
      console.error(e);
      setNotification("Erro ao enviar mensagem.");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "global_chat", id));
      setNotification("Mensagem removida.");
      setDeletingChatId(null);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      setNotification(`Erro ao deletar: ${err.message || "Sem permissão"}`);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleUpdateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingChatId || !editingChatText.trim()) return;
    try {
      await updateDoc(doc(db, "global_chat", editingChatId), {
        text: editingChatText.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingChatId(null);
      setEditingChatText("");
      setNotification("Mensagem editada com sucesso.");
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error("Erro ao editar:", err);
      setNotification(`Erro ao editar: ${err.message || "Sem permissão"}`);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const filteredRequests = publicRequests.filter(req => {
    const matchesSearch = 
      (req.title || "")?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (req.description || "")?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "Todos" || 
      req.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
            onClick={() => setActiveTab("testemunhos")}
            className={cn("px-6 py-2 rounded-xl text-sm font-medium transition-all", activeTab === "testemunhos" ? "bg-amber text-navy shadow-lg" : "text-pearl/60 hover:text-pearl")}
          >
            Testemunhos
          </button>
          <button 
            onClick={() => {
              setActiveTab("chat");
              setTimeout(() => {
                if (chatScrollRef.current) {
                  chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
                }
              }, 100);
            }}
            className={cn("px-6 py-2 rounded-xl text-sm font-medium transition-all", activeTab === "chat" ? "bg-amber text-navy shadow-lg" : "text-pearl/60 hover:text-pearl")}
          >
            Chat Geral
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
           {activeTab === "pedidos" && (
             <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1 group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/20 group-focus-within:text-amber transition-colors" />
                   <input 
                     type="text"
                     placeholder="Buscar pedidos de oração..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-white/5 border border-amber/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-amber transition-all text-sm"
                   />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                   <div className="flex items-center gap-2 bg-white/5 border border-amber/10 p-1 rounded-2xl">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                            selectedCategory === cat 
                              ? "bg-amber text-navy shadow-lg" 
                              : "text-pearl/40 hover:text-pearl"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {activeTab === "pedidos" && filteredRequests.map((req) => (
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

           {activeTab === "pedidos" && filteredRequests.length === 0 && (
             <div className="py-24 text-center">
                <div className="opacity-20 space-y-4">
                  <Users className="w-20 h-20 mx-auto mb-4" />
                  {searchTerm || selectedCategory !== "Todos" ? (
                    <>
                      <p className="font-display text-2xl italic">"Nenhum pedido encontrado com esses filtros."</p>
                      <button 
                        onClick={() => { setSearchTerm(""); setSelectedCategory("Todos"); }}
                        className="text-amber font-bold hover:underline"
                      >
                        Limpar filtros
                      </button>
                    </>
                  ) : (
                    <p className="font-display text-2xl italic">"Onde dois ou três estiverem reunidos..."</p>
                  )}
                </div>
             </div>
           )}

           {activeTab === "testemunhos" && testimonials.map((t) => (
             <motion.div 
               key={t.id}
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
                         <p className="text-xs font-bold uppercase tracking-widest text-amber">{t.userName}</p>
                         <p className="text-[10px] text-pearl/40">Há {format(t.createdAt?.toDate ? t.createdAt.toDate() : new Date(), "HH'h' mm'min'", { locale: ptBR })}{t.updatedAt && " (editado)"}</p>
                      </div>
                   </div>

                   {t.userId === user?.uid && (
                      <div className="flex items-center gap-2">
                        {deletingTestimonyId === t.id ? (
                           <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-lg">
                             <span className="text-[9px] font-bold text-red-400">APAGAR?</span>
                             <button onClick={() => handleDeleteTestimony(t.id)} className="text-red-400 hover:text-white font-bold text-[9px]">SIM</button>
                             <button onClick={() => setDeletingTestimonyId(null)} className="text-pearl/40 hover:text-white font-bold text-[9px]">NÃO</button>
                           </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingTestimonyId(t.id);
                                setTestimonyTitle(t.title);
                                setTestimonyContent(t.content);
                                setIsTestimonyModalOpen(true);
                                setDeletingTestimonyId(null);
                              }}
                              className="p-1.5 hover:text-amber transition-colors bg-white/5 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeletingTestimonyId(t.id);
                                setEditingTestimonyId(null);
                              }}
                              className="p-1.5 hover:text-red-400 transition-colors bg-white/5 rounded-lg"
                              title="Deletar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                   )}
                </div>

                <div className="space-y-3">
                   <h3 className="text-xl font-display font-bold">{t.title}</h3>
                   <p className="text-pearl/80 leading-relaxed font-serif text-lg">"{t.content}"</p>
                </div>
             </motion.div>
           ))}
           {activeTab === "testemunhos" && testimonials.length === 0 && (
             <div className="py-24 text-center opacity-20">
                <BookOpen className="w-20 h-20 mx-auto mb-4" />
                <p className="font-display text-2xl italic">"Seja o primeiro a contar as maravilhas de Deus."</p>
             </div>
           )}

           {activeTab === "chat" && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="glow-card p-0 flex flex-col h-[600px] overflow-hidden"
             >
               <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                 {chatMessages.length === 0 ? (
                   <p className="text-center text-pearl/40 text-sm italic mt-10">Diga a paz do Senhor para a igreja!</p>
                 ) : (
                   chatMessages.map(msg => {
                     const isMine = msg.userId === user?.uid;
                     const isEditing = editingChatId === msg.id;

                     return (
                       <div key={msg.id} className={cn("flex flex-col max-w-[85%] group", isMine ? "ml-auto origin-top-right" : "mr-auto origin-top-left")}>
                         <div className={cn("flex items-center gap-2 mb-1", isMine ? "justify-end" : "justify-start")}>
                            <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                              {isMine ? "Você" : msg.userName}
                            </span>
                            {isMine && !isEditing && (
                              <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                {deletingChatId === msg.id ? (
                                  <div className="flex items-center gap-2 bg-red-500/20 px-2 py-1 rounded-lg">
                                    <span className="text-[9px] font-bold text-red-400">APAGAR?</span>
                                    <button 
                                      onClick={() => handleDeleteChat(msg.id)}
                                      className="text-red-400 hover:text-white font-bold text-[9px]"
                                    >
                                      SIM
                                    </button>
                                    <button 
                                      onClick={() => setDeletingChatId(null)}
                                      className="text-pearl/40 hover:text-white font-bold text-[9px]"
                                    >
                                      NÃO
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => {
                                        setEditingChatId(msg.id);
                                        setEditingChatText(msg.text);
                                        setDeletingChatId(null);
                                      }}
                                      className="p-1 hover:text-amber transition-colors"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => setDeletingChatId(msg.id)}
                                      className="p-1 hover:text-red-400 transition-colors"
                                      title="Deletar"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                         </div>

                         {isEditing ? (
                            <form onSubmit={handleUpdateChat} className="space-y-2">
                              <textarea 
                                value={editingChatText}
                                onChange={e => setEditingChatText(e.target.value)}
                                className="w-full bg-white/10 border border-amber/40 rounded-2xl p-3 text-sm focus:outline-none focus:border-amber min-h-[80px] resize-none text-pearl"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 text-[10px] font-bold">
                                <button 
                                  type="button" 
                                  onClick={() => setEditingChatId(null)}
                                  className="px-3 py-1 text-pearl/40 hover:text-pearl"
                                >
                                  CANCELAR
                                </button>
                                <button 
                                  type="submit"
                                  className="px-3 py-1 bg-amber text-navy rounded-lg"
                                >
                                  SALVAR
                                </button>
                              </div>
                            </form>
                         ) : (
                            <div className={cn(
                              "p-4 rounded-3xl text-sm leading-relaxed shadow-sm relative",
                              isMine ? "bg-amber text-navy rounded-tr-none font-medium" : "bg-white/5 border border-amber/10 text-pearl/90 rounded-tl-none"
                            )}>
                              {msg.text}
                              {msg.updatedAt && (
                                <span className={cn(
                                  "absolute bottom-1 right-3 text-[8px] opacity-40 font-bold",
                                  isMine ? "text-navy" : "text-pearl/40"
                                )}>
                                  (editado)
                                </span>
                              )}
                            </div>
                         )}
                       </div>
                     );
                   })
                 )}
               </div>
               <form onSubmit={handleSendChat} className="p-4 border-t border-amber/10 bg-navy/50 flex gap-2">
                 <input 
                   value={chatInput}
                   onChange={e => setChatInput(e.target.value)}
                   placeholder="Envie uma mensagem..."
                   className="flex-1 bg-white/5 border border-amber/10 rounded-2xl px-4 outline-none focus:border-amber transition-colors text-sm"
                 />
                 <button 
                   type="submit" 
                   disabled={!chatInput.trim()}
                   className="w-12 h-12 bg-amber text-navy rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                 >
                   <Send className="w-5 h-5 -rotate-12" />
                 </button>
               </form>
             </motion.div>
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
                onClick={() => {
                  setEditingTestimonyId(null);
                  setTestimonyTitle("");
                  setTestimonyContent("");
                  setIsTestimonyModalOpen(true);
                }}
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

      <AnimatePresence>
        {isTestimonyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glow-card w-full max-w-lg relative bg-navy border border-amber/20 shadow-2xl"
            >
              <button 
                onClick={() => setIsTestimonyModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-pearl/40 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-6 space-y-2 pr-8">
                <h3 className="text-2xl font-display font-bold">
                  {editingTestimonyId ? "Editar Testemunho" : "Conte seu Testemunho"}
                </h3>
                <p className="text-sm text-pearl/60">Edifique a igreja compartilhando o que Deus fez na sua vida.</p>
              </div>

              <form onSubmit={editingTestimonyId ? handleUpdateTestimony : handlePublishTestimony} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-amber">Título (Opcional)</label>
                  <input 
                    type="text"
                    value={testimonyTitle}
                    onChange={e => setTestimonyTitle(e.target.value)}
                    placeholder="Ex: A Cura que Deus me Prometeu"
                    className="w-full bg-white/5 border border-amber/10 rounded-xl px-4 py-3 outline-none focus:border-amber transition-colors text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-amber">O que Deus Fez?</label>
                  <textarea 
                    value={testimonyContent}
                    onChange={e => setTestimonyContent(e.target.value)}
                    placeholder="Escreva como foi sua experiencía, testifique os milagres..."
                    rows={5}
                    className="w-full bg-white/5 border border-amber/10 rounded-xl px-4 py-3 outline-none focus:border-amber transition-colors resize-none text-sm leading-relaxed"
                    required
                  ></textarea>
                </div>
                
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={!testimonyContent.trim()}
                    className="w-full bg-amber text-navy font-bold py-3.5 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                  >
                    {editingTestimonyId ? "Atualizar" : "Publicar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
