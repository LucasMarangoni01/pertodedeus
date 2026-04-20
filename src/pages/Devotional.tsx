import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Save, Share2, RefreshCw, Bookmark, BookmarkCheck, Send, CheckCircle, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { generateDevotional } from "../services/geminiService";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";

export default function Devotional() {
  const { user } = useAuth();
  const [devotional, setDevotional] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userResponse, setUserResponse] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, "users", user.uid, "devotionals"),
      where("date", "==", todayStr),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setDevotional({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        setUserResponse(snapshot.docs[0].data().userResponse || "");
        setLoading(false);
      } else {
        handleNewDevotional();
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleNewDevotional = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await generateDevotional(user);
      const todayStr = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, "users", user.uid, "devotionals"), {
        userId: user.uid,
        date: todayStr,
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error generating devotional:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveResponse = async () => {
    if (!devotional || !user) return;
    setIsCompleting(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "devotionals", devotional.id), {
        userResponse: userResponse,
        updatedAt: serverTimestamp()
      });
    } finally {
      setIsCompleting(false);
    }
  };

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
          <h2 className="text-2xl font-display font-bold text-amber">Preparando o seu Pão Diário</h2>
          <p className="text-pearl/40 italic">O Senhor tem uma palavra específica para você hoje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <AnimatePresence mode="wait">
        <motion.article 
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Header */}
          <header className="space-y-6 text-center">
            <div className="flex items-center justify-center gap-2 text-amber text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-4 h-4" /> 
              Devocional Personalizado
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-amber leading-tight">
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
          </header>

          {/* Reflection Body */}
          <div className="prose prose-invert prose-amber max-w-none prose-p:font-serif prose-p:text-lg prose-p:leading-relaxed prose-p:text-pearl/80">
             <ReactMarkdown>{devotional.reflection}</ReactMarkdown>
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
