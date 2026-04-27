import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Save, Share2, RefreshCw, Bookmark, BookmarkCheck, Send, CheckCircle, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { generateDevotional } from "../services/geminiService";
import { DevocionalGenerator } from "../components/devotional/DevocionalGenerator";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";
import { trackSpiritualAction } from "../services/userService";

export default function Devotional() {
  const { user, loading: authLoading } = useAuth();
  const [devotional, setDevotional] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    
    // Reset loading state for daily check
    setLoading(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, "users", user.uid, "devotionals"),
      where("date", "==", todayStr),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setDevotional({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        setUserResponse(snapshot.docs[0].data().userResponse || "");
        setShowGenerator(false); // Esconde o gerador quando um novo devocional chega
        setLoading(false);
        setErrorMsg(null);
      } else {
        handleNewDevotional();
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/devotionals`);
      
      // Se der erro de índice, tentamos sem o orderBy para não quebrar o app
      if (err.code === "failed-precondition") {
        const fallbackQ = query(
            collection(db, "users", user.uid, "devotionals"),
            where("date", "==", todayStr),
            limit(1)
        );
        onSnapshot(fallbackQ, (snapshot) => {
            if (!snapshot.empty) {
                setDevotional({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
                setUserResponse(snapshot.docs[0].data().userResponse || "");
                setShowGenerator(false);
                setLoading(false);
            } else {
                handleNewDevotional();
            }
        }, (fallbackErr) => {
          handleFirestoreError(fallbackErr, OperationType.LIST, `users/${user.uid}/devotionals`);
        });
      }
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleNewDevotional = async (passage?: string, simplify?: boolean) => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await generateDevotional(user, passage, simplify);
      const todayStr = new Date().toISOString().split('T')[0];
      const operation = addDoc(collection(db, "users", user.uid, "devotionals"), {
        userId: user.uid,
        date: todayStr,
        ...data,
        createdAt: serverTimestamp(),
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT_FIREBASE")), 15000)
      );

      await Promise.race([operation, timeoutPromise]);
      // O onSnapshot cuidará de setar o devotional e esconder o loading/gerador
    } catch (error: any) {
      console.error("Error generating or saving devotional:", error);
      setErrorMsg(error.message === "TIMEOUT_FIREBASE" 
        ? "O servidor de banco de dados demorou muito para responder. Tente novamente." 
        : (error.message || "Erro desconhecido ao gerar devocional."));
      setLoading(false); // Importante: se falhar, para o loading para mostrar o erro
    }
  };

  const saveResponse = async () => {
    if (!devotional || !user) return;
    setIsCompleting(true);
    try {
      const operation = updateDoc(doc(db, "users", user.uid, "devotionals", devotional.id), {
        userResponse: userResponse,
        updatedAt: serverTimestamp()
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT_FIREBASE")), 10000)
      );

      await Promise.race([operation, timeoutPromise]);
      
      // Track spiritual action
      trackSpiritualAction(user.uid, "devotional").catch(console.error);
    } catch (error: any) {
      console.error("Error saving response:", error);
      alert(error.message === "TIMEOUT_FIREBASE" 
        ? "O salvamento demorou demais. Verifique sua conexão." 
        : "Erro ao salvar meditação.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleShare = async () => {
    if (!devotional) return;
    
    const shareText = `📖 Devocional de Hoje: ${devotional.title}\n\n"${devotional.verse}"\n\nReflexão: ${devotional.reflection.substring(0, 500)}...\n\nLeia mais no app Devocional com IA!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: devotional.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert("Conteúdo copiado para a área de transferência!");
      } catch (err) {
        console.error("Failed to copy", err);
      }
    }
  };

  if (authLoading) return null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center text-amber shadow-[0_0_40px_rgba(201,168,76,0.3)]"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-amber">Iniciando seu Devocional com IA</h2>
          <p className="text-pearl/40 italic">O Senhor tem uma palavra específica para você hoje...</p>
        </div>
      </div>
    );
  }

  if (!devotional || showGenerator) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="space-y-4 text-center">
          <div className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center text-amber mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display font-bold text-amber">Devocional com IA</h1>
          <p className="text-pearl/60 text-lg">Sobre o que o Senhor quer falar com você hoje?</p>
        </header>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
            {errorMsg}
          </div>
        )}

        <div className="glow-card p-6 md:p-8">
          <DevocionalGenerator onSubmit={(passage, simplify) => handleNewDevotional(passage, simplify)} />
        </div>

        {/* Botão para voltar se já existir um devotional mas o usuário clicou em gerar novo sem querer */}
        {devotional && (
          <button 
            onClick={() => setShowGenerator(false)}
            className="w-full text-pearl/40 text-sm hover:text-amber transition-colors"
          >
            Voltar para o devocional de hoje
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-24">
      {/* Banner de Geração Novo com IA - Centralizado e Animado */}
      <div className="flex justify-center w-full px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            rotate: [0, 0.5, -0.5, 0],
          }}
          transition={{
            rotate: {
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            },
            opacity: { duration: 0.5 },
            scale: { duration: 0.5 }
          }}
          whileHover={{ scale: 1.02, rotate: 0 }}
          className="w-full max-w-2xl bg-gradient-to-b from-amber/15 to-navy border border-amber/20 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-8 shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative overflow-hidden group"
        >
          {/* Luzes de fundo decorativas */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(201,168,76,0.15),transparent_70%)]" />
          
          <div className="space-y-3 relative z-10">
            <div className="w-12 h-12 bg-amber/20 rounded-full flex items-center justify-center mx-auto mb-2 text-amber animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-display font-bold text-amber tracking-tight">Quer estudar outra passagem hoje?</h3>
            <p className="text-pearl/60 text-base max-w-sm mx-auto leading-relaxed">A inteligência artificial está pronta para simplificar qualquer versículo para você agora mesmo.</p>
          </div>

          <button 
            onClick={() => {
              setShowGenerator(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="relative z-10 flex items-center gap-3 bg-amber text-navy font-black px-12 py-5 rounded-2xl shadow-[0_15px_30px_rgba(201,168,76,0.25)] hover:shadow-amber/40 hover:bg-white transition-all active:scale-95 group/btn"
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> 
            GERAR NOVO COM IA
          </button>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.article 
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Header */}
          <header className="space-y-6 text-center relative group">
            <div className="flex items-center justify-center gap-2 text-amber text-xs font-bold tracking-widest uppercase group">
              <Sparkles className="w-4 h-4" /> 
              Voz da Inteligência Artificial
            </div>
            
            <button 
              onClick={handleShare}
              className="absolute top-0 right-0 p-3 bg-white/5 border border-amber/10 rounded-xl text-amber hover:bg-amber hover:text-navy transition-all shadow-lg active:scale-95"
              title="Compartilhar Devocional"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-amber leading-tight px-12">
              {devotional.title}
            </h1>
            <div className="bg-white/5 border border-amber/10 p-8 rounded-[2rem] paper-texture relative">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy px-4">
                  <Bookmark className="text-amber fill-amber w-8 h-8" />
               </div>
               <p className="text-xl md:text-2xl font-serif italic text-pearl/90 leading-relaxed">
                 "{devotional.verse}"
               </p>
            </div>

            {/* AI Explanation / Study Help */}
            {devotional.explanation && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-amber/10 border-l-4 border-amber p-6 rounded-r-2xl space-y-2 text-left"
              >
                <div className="flex items-center gap-2 text-amber font-bold text-sm tracking-widest uppercase">
                  <CheckCircle className="w-4 h-4" /> Entendendo a Mensagem (IA)
                </div>
                <p className="text-pearl/80 leading-relaxed italic">
                  {devotional.explanation}
                </p>
              </motion.div>
            )}
          </header>

          {/* Reflection Body (THE AI CORE CONTENT) */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 text-amber font-bold text-xs uppercase tracking-widest mb-2">
                <RefreshCw className="w-3 h-3" /> Reflexão Gerada pela IA
             </div>
             <div className="prose prose-invert prose-amber max-w-none prose-p:font-serif prose-p:text-lg prose-p:leading-relaxed prose-p:text-pearl/90 prose-strong:text-amber">
                <ReactMarkdown>{devotional.reflection}</ReactMarkdown>
             </div>
          </div>

          {/* Practical Action Card */}
          <div className="glow-card border-none bg-gradient-to-br from-grape/40 to-navy p-8">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber text-navy rounded-xl flex items-center justify-center shrink-0">
                   <RefreshCw className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                   <h4 className="text-amber font-bold text-sm uppercase tracking-wider">Aplicação Prática</h4>
                   <p className="text-lg font-medium">{devotional.practicalAction}</p>
                </div>
             </div>
          </div>

          {/* User Response Section */}
          <div className="space-y-6 pt-12 border-t border-amber/10">
             <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold">Meditação Pessoal</h3>
                <p className="text-amber italic font-serif text-lg">{devotional.question}</p>
             </div>
             
             <textarea 
               value={userResponse}
               onChange={(e) => setUserResponse(e.target.value)}
               placeholder="Escreva sua reflexão aqui..."
               className="w-full bg-white/5 border border-amber/20 rounded-3xl p-8 font-serif text-lg focus:border-amber outline-none transition-colors min-h-[200px] resize-none"
             />

             <div className="flex justify-end gap-3">
                <button 
                  onClick={saveResponse}
                  disabled={isCompleting || !userResponse.trim()}
                  className="flex items-center gap-2 bg-amber text-navy font-bold px-8 py-3 rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isCompleting ? <RefreshCw className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                  Concluir Meditação
                </button>
             </div>
          </div>

          {/* Closing Prayer */}
          <footer className="bg-amber/5 border border-amber/10 p-10 rounded-3xl space-y-6 text-center italic">
            <h4 className="text-amber font-bold text-xs uppercase tracking-widest">Oração Sugerida</h4>
            <p className="text-xl font-serif text-pearl/70 leading-relaxed max-w-xl mx-auto">
              "{devotional.suggestedPrayer}"
            </p>
            <div className="pt-4 flex items-center justify-center gap-2 text-amber font-bold">
               Amém <Heart className="w-5 h-5" fill="currentColor" />
            </div>
          </footer>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
