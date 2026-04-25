import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, Sparkles, User, ShieldCheck, Heart, Info, RefreshCw, Trash2, Plus, Menu, X, ChevronRight, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, writeBatch, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

let aiInstance: GoogleGenAI | null = null;
let currentKey: string | null = null;

const getAi = () => {
  const localKey = localStorage.getItem("USER_GEMINI_KEY");
  const fallbackKey = "AIzaSyCIphL2465bVZN0fNpw-oe6PsDA2caLjIE"; // Placeholder key
  const envKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : null;
  const importedMetaKey = (import.meta as any).env ? (import.meta as any).env.VITE_GEMINI_API_KEY : null;
  
  const key = localKey || importedMetaKey || envKey || fallbackKey;
  
  if (!aiInstance || currentKey !== key) {
    aiInstance = new GoogleGenAI({ apiKey: key });
    currentKey = key;
  }
  return aiInstance;
};

export default function Assistant() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Conversations List
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "assistant_conversations"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(convs);
      
      // Select first conversation if none selected
      if (convs.length > 0 && !activeId) {
        setActiveId(convs[0].id);
      }
    }, (error) => {
      console.error("Error fetching conversations:", error);
    });

    return () => unsubscribe();
  }, [user, activeId]);

  // Fetch Messages for Active Conversation
  useEffect(() => {
    if (!user) {
      setMessages([
        { role: "assistant", content: "Olá! Faça login para salvar seu histórico de conversas. Eu sou seu assistente bíblico. Em que posso te ajudar hoje?" }
      ]);
      return;
    }

    if (!activeId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "assistant_conversations", activeId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (msgs.length === 0) {
        setMessages([
          { role: "assistant", content: `Olá ${user.displayName || ""}! Esta é uma nova conversa. Como posso te orientar hoje?` }
        ]);
      } else {
        setMessages(msgs);
      }
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribe();
  }, [user, activeId]);

  const createNewChat = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, "users", user.uid, "assistant_conversations"), {
        title: "Nova Conversa",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveId(docRef.id);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!user) return;
    try {
      if (activeId === id) setActiveId(null);
      await deleteDoc(doc(db, "users", user.uid, "assistant_conversations", id));
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      let currentConvId = activeId;

      // Create a conversation if none exists for logged users
      if (!currentConvId && user) {
        const docRef = await addDoc(collection(db, "users", user.uid, "assistant_conversations"), {
          title: userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : ""),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        currentConvId = docRef.id;
        setActiveId(currentConvId);
      }

      // Save user message
      if (!user) {
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
      } else if (currentConvId) {
        await addDoc(collection(db, "users", user.uid, "assistant_conversations", currentConvId, "messages"), {
          role: "user",
          content: userMessage,
          createdAt: serverTimestamp()
        });
        
        // Update conversation title if it's the first message
        if (messages.length <= 1) {
          await updateDoc(doc(db, "users", user.uid, "assistant_conversations", currentConvId), {
            title: userMessage.substring(0, 40) + (userMessage.length > 40 ? "..." : ""),
            updatedAt: serverTimestamp()
          });
        }
      }

      const ai = getAi();
      
      const systemInstruction = `Você é um assistente bíblico sábio, acolhedor e profundo. Seu objetivo é ajudar ${user?.displayName || "o usuário"} em sua caminhada cristã.
      Responda a perguntas com base estritamente na Bíblia e teologia cristã protestante/evangélica equilibrada.
      
      IMPORTANTE - VERSÃO DA BÍBLIA: 
      Você DEVE usar OBRIGATORIAMENTE a versão "${user?.bibleVersion || "NVI"}" da Bíblia para todas as citações, textos e referências, a menos que o usuário peça explicitamente outra versão nesta conversa. 
      Sempre inclua referências bíblicas (Livro Capítulo:Versículo).
      
      ${simplify ? "MODO LINGUAGEM SIMPLES: Você DEVE ser extremamente direto, curto e usar palavras muito simples. Evite termos técnicos, palavras difíceis ou textos longos. Resuma o máximo possível para facilitar o entendimento imediato sem 'enrolação'." : ""}
      Se o usuário expressar tristeza profunda, depressão ou pensamentos suicidas, responda com extrema compaixão e recomende imediatamente que procurem um pastor ou profissional de saúde mental cristão.
      Não dê conselhos médicos ou financeiros complexos, foque na sabedoria espiritual.
      Use Markdown para formatar as citações bíblicas.`;

      const chatHistory = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10) // More context
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...chatHistory,
          { role: "user", parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
        }
      });

      const assistantMessage = response.text;
      
      if (!user) {
        setMessages(prev => [...prev, { role: "assistant", content: assistantMessage }]);
      } else if (currentConvId) {
        await addDoc(collection(db, "users", user.uid, "assistant_conversations", currentConvId, "messages"), {
          role: "assistant",
          content: assistantMessage,
          createdAt: serverTimestamp()
        });

        await updateDoc(doc(db, "users", user.uid, "assistant_conversations", currentConvId), {
           lastMessage: assistantMessage.substring(0, 60),
           updatedAt: serverTimestamp()
        });
      }
      } catch (error: any) {
        console.error("Error in assistant chat:", error);
        let errorMessage = error.message || "Desconhecido";
        setMessages(prev => [...prev, { role: "assistant", content: `Erro: ${errorMessage}` }]);
      } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="h-[calc(100vh-140px)] flex bg-navy/30 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm relative">
      
      {/* Sidebar Mobile Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden absolute top-6 left-6 z-50 p-3 bg-navy border border-amber/20 rounded-xl text-amber shadow-lg"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar de Histórico */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 w-80 bg-navy/90 lg:bg-navy/40 border-r border-white/5 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col p-6",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-8 pt-12 lg:pt-0">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-3 bg-amber text-navy font-bold py-4 rounded-2xl shadow-lg shadow-amber/10 hover:shadow-amber/20 transform hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nova Conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          <h3 className="text-[10px] text-pearl/20 uppercase font-bold tracking-widest mb-4 px-2">Recentes</h3>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                setActiveId(conv.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full group flex flex-col gap-1 p-4 rounded-2xl text-left transition-all relative overflow-hidden cursor-pointer",
                activeId === conv.id 
                  ? "bg-amber/10 border border-amber/20" 
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex items-center justify-between gap-2 overflow-hidden">
                <span className={cn(
                  "text-sm font-bold truncate pr-6",
                  activeId === conv.id ? "text-amber" : "text-pearl/60"
                )}>
                  {conv.title || "Sem título"}
                </span>
                <div className="flex items-center gap-2">
                  {deletingId === conv.id ? (
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                        title="Confirmar exclusão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="p-2 rounded-lg bg-white/10 text-pearl/40 hover:bg-white/20 transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(conv.id);
                      }}
                      className="p-2 -mr-2 rounded-lg hover:bg-red-500/20 text-pearl/10 hover:text-red-400 z-10 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                      title="Apagar conversa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {conv.lastMessage && (
                <p className="text-[11px] text-pearl/30 truncate italic">
                  {conv.lastMessage}
                </p>
              )}
              {activeId === conv.id && (
                <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-amber" />
              )}
            </div>
          ))}
          {conversations.length === 0 && user && (
            <div className="text-center py-10 opacity-20 italic text-sm">
              Nenhuma conversa salva.
            </div>
          )}
          {!user && (
            <div className="text-center py-10 opacity-40 italic text-xs">
              Faça login para salvar <br/> suas conversas.
            </div>
          )}
        </div>
      </aside>

      {/* Área de Chat Principal */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent">
        <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:pl-0 pl-16">
             <div className="w-12 h-12 bg-amber/10 border border-amber/20 rounded-2xl flex items-center justify-center text-amber shrink-0">
               <MessageCircle className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-white truncate max-w-[200px] md:max-w-md">
                   {conversations.find(c => c.id === activeId)?.title || "Assistente Bíblico"}
                </h1>
                <div className="flex items-center gap-2 text-amber/60 text-[10px] font-bold uppercase tracking-widest font-sans">
                  <Sparkles className="w-3 h-3" /> Conselhos baseados na Palavra
                </div>
             </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
             <label className="flex items-center gap-3 cursor-pointer group">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                  simplify ? "text-amber" : "text-white/20"
                )}>Direto</span>
                <div 
                  onClick={() => setSimplify(!simplify)}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    simplify ? "bg-amber" : "bg-white/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: simplify ? 20 : 4 }}
                    className={cn("absolute top-1 w-3 h-3 rounded-full", simplify ? "bg-navy" : "bg-white/40")}
                  />
                </div>
             </label>
          </div>
        </header>

        {/* Mensagens */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth scrollbar-thin">
           <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={m.id || i}
                className={cn(
                  "flex gap-4 md:gap-6 max-w-[90%] md:max-w-[80%]",
                  m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-10 md:w-12 h-10 md:h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                  m.role === "user" ? "bg-amber border-amber text-navy" : "bg-navy/80 border-white/10 text-amber shadow-lg"
                )}>
                  {m.role === "user" ? <User className="w-5 md:w-6 h-5 md:h-6" /> : <Heart className="w-5 md:w-6 h-5 md:h-6" fill="currentColor" />}
                </div>
                
                <div className={cn(
                  "p-5 md:p-7 rounded-[2rem] text-sm md:text-lg leading-relaxed font-serif prose prose-invert prose-amber max-w-none shadow-md",
                  m.role === "user" 
                    ? "bg-amber/10 border border-amber/20 rounded-tr-none text-pearl/90" 
                    : "bg-white/[0.03] border border-white/5 rounded-tl-none text-pearl/80"
                )}>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="flex gap-4 mr-auto animate-pulse pl-2"
              >
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10" />
                 <div className="space-y-3 pt-2">
                    <div className="bg-white/5 p-4 rounded-3xl rounded-tl-none w-48 h-4 shadow-sm" />
                    <div className="bg-white/5 p-4 rounded-3xl w-32 h-4 shadow-sm" />
                 </div>
              </motion.div>
            )}
           </AnimatePresence>
        </div>

        {/* Input Barra */}
        <div className="p-6 md:p-10 bg-gradient-to-t from-navy/80 to-transparent">
          <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-amber/5 blur-[40px] rounded-full pointer-events-none" />
            <div className="relative flex items-center gap-3 bg-navy/90 border border-white/10 rounded-[2.5rem] p-3 pl-8 shadow-2xl group focus-within:border-amber/40 transition-colors">
              <input 
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 placeholder="Digite sua dúvida ou versículo..."
                 className="flex-1 bg-transparent py-4 text-white outline-none font-serif text-lg md:text-xl placeholder:text-pearl/20"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="w-16 h-16 bg-amber text-navy rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
              >
                  <Send className={cn("w-7 h-7 transform transition-transform", loading ? "animate-pulse" : "-rotate-12")} />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-6 text-[9px] md:text-[10px] text-pearl/20 uppercase font-black tracking-widest">
               <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-amber/40" /> Sabedoria bíblica curada</span>
               <div className="hidden sm:flex items-center gap-6">
                <span className="w-1.5 h-1.5 bg-white/5 rounded-full" />
                <span>Histórico protegido na sua conta</span>
                <span className="w-1.5 h-1.5 bg-white/5 rounded-full" />
                <span className="text-amber/40">Gemini 3.0 Experimental</span>
               </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
