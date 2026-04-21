import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, Sparkles, User, ShieldCheck, Heart, Info, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";

let aiInstance: GoogleGenAI | null = null;
const getAi = () => {
  const localKey = localStorage.getItem("USER_GEMINI_KEY");
  const key = localKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || "DUMMY_KEY_TO_PREVENT_CRASH";
  
  // Reinstantiate if key changed from storage
  if (!aiInstance || aiInstance.apiKey !== key) {
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

export default function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "Olá! Eu sou seu assistente bíblico. Em que posso te ajudar hoje na sua jornada espiritual?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `Você é um assistente bíblico sábio, acolhedor e profundo.
          Responda a perguntas com base estritamente na Bíblia e teologia cristã protestante/evangélica equilibrada.
          Sempre inclua referências bíblicas (Livro Capítulo:Versículo).
          Se o usuário expressar tristeza profunda, depressão ou pensamentos suicidas, responda com extrema compaixão e recomende imediatamente que procurem um pastor ou profissional de saúde mental cristão.
          Não dê conselhos médicos ou financeiros complexos, foque na sabedoria espiritual.
          Use Markdown para formatar as citações bíblicas.`,
        }
      });

      setMessages(prev => [...prev, { role: "assistant", content: response.text }]);
    } catch (error: any) {
      console.error("Error in assistant chat:", error);
      setMessages(prev => [...prev, { role: "assistant", content: `Erro na IA: ${error.message || "Desconhecido"}. Verifique se a sua chave no menu Configurações está correta.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold">Assistente Bíblico</h1>
          <div className="flex items-center gap-2 text-amber text-[10px] font-bold uppercase tracking-widest font-sans">
             <Sparkles className="w-3 h-3" /> Inteligência com Sabedoria
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-amber/5 border border-amber/10 text-[10px] text-pearl/40 font-bold uppercase">
           <ShieldCheck className="w-4 h-4 text-amber" /> Respostas Baseadas na Palavra
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-navy/50 border border-amber/10 rounded-3xl p-6 overflow-y-auto space-y-8 scroll-smooth scrollbar-thin"
      >
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={cn(
                "flex gap-4 max-w-[85%]",
                m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                m.role === "user" ? "bg-amber text-navy" : "bg-white/5 border border-amber/10 text-amber"
              )}>
                {m.role === "user" ? <User className="w-5 h-5" /> : <Heart className="w-5 h-5" fill="currentColor" />}
              </div>
              
              <div className={cn(
                "p-5 rounded-3xl text-sm md:text-base leading-relaxed font-serif prose prose-invert prose-amber max-w-none shadow-sm",
                m.role === "user" 
                  ? "bg-amber/10 border border-amber/10 rounded-tr-none text-pearl/90" 
                  : "bg-white/5 border border-white/5 rounded-tl-none text-pearl/80"
              )}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="flex gap-4 mr-auto animate-pulse"
            >
               <div className="w-10 h-10 rounded-2xl bg-white/5 border border-amber/10 flex items-center justify-center text-amber">
                  <RefreshCw className="w-5 h-5 animate-spin" />
               </div>
               <div className="bg-white/2 p-4 rounded-3xl rounded-tl-none w-32 h-12" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="relative group">
        <div className="absolute inset-0 bg-amber/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-30 transition-opacity" />
        <div className="relative flex items-center gap-3 bg-navy border border-amber/20 rounded-[2rem] p-2 pl-6 shadow-xl">
           <input 
             value={input}
             onChange={e => setInput(e.target.value)}
             placeholder="Pergunte sobre fé, dúvida ou versículo..."
             className="flex-1 bg-transparent py-4 outline-none text-pearl font-serif text-lg"
           />
           <button 
             type="submit"
             disabled={!input.trim() || loading}
             className="w-14 h-14 bg-amber text-navy rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
           >
              <Send className="w-6 h-6 -rotate-12" />
           </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-pearl/20 uppercase font-bold tracking-widest">
           <span className="flex items-center gap-1"><Info className="w-3 h-3" /> O histórico é salvo localmente</span>
           <span className="w-1 h-1 bg-white/10 rounded-full" />
           <span>Respostas geradas por IA</span>
        </div>
      </form>
    </div>
  );
}
