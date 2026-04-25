import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Flame, Heart, AlertTriangle, CheckCircle2, History as HistoryIcon, Trash2, ArrowRight, BookOpen, Quote, Sparkles, RefreshCw, Info, Edit2, Search, X, MinusCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, deleteDoc, increment, limit, getDocs, writeBatch } from "firebase/firestore";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const struggleCategories = [
  {
    name: "Sentimentos e Atitudes",
    items: [
      { sin: "Se achar melhor que os outros", advice: "Lembre-se que todos somos iguais para Deus. Busque ser humilde como Jesus foi.", verse: "Provérbios 16:18" },
      { sin: "Querer o que é dos outros (Inveja)", advice: "Fique feliz com o que você tem e com o sucesso dos outros. Deus tem o melhor para você.", verse: "Provérbios 14:30" },
      { sin: "Raiva ou Estresse constante", advice: "A raiva não ajuda a fazer o que é certo. Peça calma ao Espírito Santo nos momentos difíceis.", verse: "Tiago 1:20" },
      { sin: "Falta de vontade de orar", advice: "Não desista da sua fé. Tente conversar com Deus um pouquinho por dia, no seu ritmo.", verse: "Efésios 5:14" },
      { sin: "Apego exagerado ao dinheiro", advice: "O dinheiro deve ser usado para o bem. Coloque Deus em primeiro lugar no seu coração.", verse: "1 Timóteo 6:10" },
      { sin: "Exagerar na comida ou bebida", advice: "Cuide do seu corpo como se fosse uma casa onde Deus mora. Busque o equilíbrio.", verse: "1 Coríntios 6:19" },
      { sin: "Pensamentos ou desejos ruins", advice: "Tente focar em coisas boas e que trazem paz para sua mente e para sua vida.", verse: "2 Timóteo 2:22" }
    ]
  },
  {
    name: "Coisas Importantes",
    items: [
      { sin: "Colocar coisas acima de Deus", advice: "Nada deve ser mais importante que o nosso amor por Deus.", verse: "Êxodo 20:3" },
      { sin: "Falar de Deus sem respeito", advice: "Use o nome de Deus com carinho e respeito nas suas conversas.", verse: "Êxodo 20:7" },
      { sin: "Não tirar tempo para descansar", advice: "Tire um dia para descansar a mente e agradecer a Deus por tudo.", verse: "Êxodo 20:8" },
      { sin: "Tratar mal pai ou mãe", advice: "Respeite e cuide de quem cuidou de você. Isso traz muita paz ao coração.", verse: "Êxodo 20:12" },
      { sin: "Desejar o mal para alguém", advice: "O ódio machuca a gente. Tente perdoar e desejar coisas boas para todos.", verse: "1 João 3:15" },
      { sin: "Trair ou não ser fiel", advice: "Seja honesto e fiel com as pessoas que você ama.", verse: "Mateus 5:27-28" },
      { sin: "Pegar o que não te pertence", advice: "Dê valor ao que é dos outros e seja honesto em todas as situações.", verse: "Êxodo 20:15" },
      { sin: "Mentir ou fazer fofoca", advice: "Tente sempre dizer a verdade. A verdade traz luz para a nossa caminhada.", verse: "Mateus 5:37" }
    ]
  },
  {
    name: "Lutas do Dia a Dia",
    items: [
      { sin: "Gritar ou falar coisas pesadas", advice: "Nossas palavras podem ajudar ou machucar. Escolha falar palavras que deem força.", verse: "Provérbios 18:21" },
      { sin: "Guardar mágoa no coração", advice: "Perdoar é se libertar de um peso. Peça a Deus ajuda para soltar essa mágoa.", verse: "Mateus 6:15" },
      { sin: "Apontar o dedo para os outros", advice: "Ninguém é perfeito. Antes de julgar, tente entender e ajudar se puder.", verse: "Mateus 7:1" },
      { sin: "Reclamar muito da vida", advice: "Tente ver o lado bom das coisas. Agradecer atrai coisas boas do céu.", verse: "Filipenses 2:14" },
      { sin: "Celular e Internet em excesso", advice: "Não deixe as telas roubarem o seu tempo com quem você ama.", verse: "Efésios 5:16" },
      { sin: "Medo do futuro (Ansiedade)", advice: "Não sofra por antecipação. Deus está cuidando de cada detalhe hoje.", verse: "1 Pedro 5:7" },
      { sin: "Vícios que fazem mal", advice: "Seja forte e busque ajuda. Você nasceu para ser livre e feliz.", verse: "Efésios 5:18" },
      { sin: "Deixar tudo para depois", advice: "Tente fazer um pouquinho a cada dia. A constância gera grandes vitórias.", verse: "Provérbios 6:6" }
    ]
  }
];

export default function StruggleTracker() {
  const { user } = useAuth();
  const [struggles, setStruggles] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sugSearch, setSugSearch] = useState("");
  const [selectedSuns, setSelectedSuns] = useState<any[]>([]);

  // Form State
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [formData, setFormData] = useState({
    sinType: "",
    biblicalAdvice: "",
    verse: ""
  });

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "struggles"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStruggles(docs);
    });

    // History Listener
    const historyQ = query(
      collection(db, "users", user.uid, "struggle_history"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribeHistory = onSnapshot(historyQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    });

    return () => {
      unsubscribe();
      unsubscribeHistory();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;
    setLoading(true);
    try {
      let operation;
      if (editingId) {
        operation = updateDoc(doc(db, "users", user.uid, "struggles", editingId), {
          sinType: formData.sinType,
          biblicalAdvice: formData.biblicalAdvice,
          verse: formData.verse,
          updatedAt: serverTimestamp(),
        });
      } else if (selectedSuns.length > 0) {
        // Bulk Add
        const batchPromise = selectedSuns.map(s => 
          addDoc(collection(db, "users", user!.uid, "struggles"), {
            userId: user!.uid,
            sinType: s.sin,
            biblicalAdvice: s.advice,
            verse: s.verse,
            totalFalls: 0,
            totalVictories: 0,
            createdAt: serverTimestamp(),
          })
        );
        operation = Promise.all(batchPromise);
      } else {
        operation = addDoc(collection(db, "users", user.uid, "struggles"), {
          userId: user.uid,
          sinType: formData.sinType,
          biblicalAdvice: formData.biblicalAdvice,
          verse: formData.verse,
          totalFalls: 0,
          totalVictories: 0,
          createdAt: serverTimestamp(),
        });
      }

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT_FIREBASE")), 10000)
      );

      await Promise.race([operation, timeoutPromise]);
      closeModal();
    } catch (error: any) {
      console.error("Error saving struggle:", error);
      alert(error.message === "TIMEOUT_FIREBASE" 
        ? "Tempo de conexão esgotado. Verifique sua rede." 
        : "Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedSuns([]);
    setFormData({ sinType: "", biblicalAdvice: "", verse: "" });
  };

  const openEdit = (struggle: any) => {
    setEditingId(struggle.id);
    setFormData({
      sinType: struggle.sinType,
      biblicalAdvice: struggle.biblicalAdvice,
      verse: struggle.verse
    });
    setIsModalOpen(true);
  };

  const registerFall = async (id: string, sinType: string) => {
    if (!user || updatingId) return;
    setUpdatingId(id);
    try {
      const updates = updateDoc(doc(db, "users", user.uid, "struggles", id), {
        totalFalls: increment(1),
        lastFall: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Record to history
      const historyLog = addDoc(collection(db, "users", user.uid, "struggle_history"), {
        userId: user.uid,
        sinType: sinType,
        type: 'fall',
        createdAt: serverTimestamp()
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT_FIREBASE")), 8000)
      );

      await Promise.race([Promise.all([updates, historyLog]), timeoutPromise]);
    } catch (error: any) {
      console.error("Error registering fall:", error);
      if (error.message === "TIMEOUT_FIREBASE") {
        alert("A conexão com o banco de dados falhou. Tente novamente.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const registerVictory = async (id: string, sinType: string) => {
    if (!user || updatingId) return;
    setUpdatingId(id);
    try {
      const updates = updateDoc(doc(db, "users", user.uid, "struggles", id), {
        totalVictories: increment(1),
        lastVictory: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Record to history
      const historyLog = addDoc(collection(db, "users", user.uid, "struggle_history"), {
        userId: user.uid,
        sinType: sinType,
        type: 'victory',
        createdAt: serverTimestamp()
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT_FIREBASE")), 8000)
      );

      await Promise.race([Promise.all([updates, historyLog]), timeoutPromise]);
    } catch (error: any) {
      console.error("Error registering victory:", error);
      if (error.message === "TIMEOUT_FIREBASE") {
        alert("A conexão com o banco de dados falhou. Tente novamente.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const clearHistory = async () => {
    if (!user || isDeletingHistory) return;
    
    setIsDeletingHistory(true);
    try {
      const q = query(collection(db, "users", user.uid, "struggle_history"));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      
      const operation = batch.commit();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT_FIREBASE")), 10000)
      );

      await Promise.race([operation, timeoutPromise]);
      setShowClearConfirm(false);
    } catch (error: any) {
      console.error("Error clearing history:", error);
      alert(error.message === "TIMEOUT_FIREBASE" 
        ? "Tempo de limite atingido ao limpar histórico." 
        : "Erro ao limpar histórico.");
    } finally {
      setIsDeletingHistory(false);
    }
  };

  const removeFall = async (id: string, currentFalls: number) => {
    if (!user || updatingId || (currentFalls || 0) <= 0) return;
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "users", user.uid, "struggles", id), {
        totalFalls: increment(-1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error removing fall:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const removeVictory = async (id: string, currentVictories: number) => {
    if (!user || updatingId || (currentVictories || 0) <= 0) return;
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "users", user.uid, "struggles", id), {
        totalVictories: increment(-1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error removing victory:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteStruggle = async () => {
    if (!user || !deletingId) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "struggles", deletingId));
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting struggle:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (sug: any) => {
    if (editingId) {
       setFormData({
         sinType: sug.sin,
         biblicalAdvice: sug.advice,
         verse: sug.verse
       });
       return;
    }

    const isSelected = selectedSuns.some(s => s.sin === sug.sin);
    if (isSelected) {
      setSelectedSuns(prev => prev.filter(s => s.sin !== sug.sin));
    } else {
      setSelectedSuns(prev => [...prev, sug]);
      // If we select a suggestion and it's the first one, or if we want to pre-fill the form 
      // when only one is selected, we can. But usually in multi-select, form is for manual entry.
      // Let's clear manual entry if we start using chips to avoid confusion.
      setFormData({ sinType: "", biblicalAdvice: "", verse: "" });
    }
  };

  const filteredCategories = struggleCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.sin.toLowerCase().includes(sugSearch.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-navy/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-navy border border-red-500/20 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold">Apagar Registro?</h3>
                <p className="text-pearl/60 text-sm">
                  Esta ação é irreversível e apagará todo o histórico desta luta. Tem certeza que deseja continuar?
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={deleteStruggle}
                  disabled={loading}
                  className="w-full bg-red-500 text-white font-bold py-4 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {loading ? "Apagando..." : "Sim, Apagar"}
                </button>
                <button 
                  onClick={() => setDeletingId(null)}
                  className="w-full py-4 text-pearl/40 font-bold hover:text-pearl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-grape font-bold uppercase tracking-widest text-[10px]">
             <Flame className="w-3 h-3 fill-grape" /> Jornada para Santidade
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Caminho de Liberdade</h1>
          <p className="text-pearl/60 font-serif italic max-w-xl">
            "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar e nos purificar de toda injustiça." (1 João 1:9)
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber text-navy px-6 py-3 rounded-2xl transition-all font-bold shadow-lg hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Novo Acompanhamento
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
             <h2 className="text-xl font-display font-bold flex items-center gap-2">
                Minhas Lutas <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-pearl/40">{struggles.length}</span>
             </h2>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="relative flex-1 md:w-64 group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/20 group-focus-within:text-amber transition-colors" />
                 <input 
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Buscar lutas..."
                   className="w-full bg-navy/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-amber/50 transition-all placeholder:text-pearl/20"
                 />
                 {searchQuery && (
                   <button 
                     onClick={() => setSearchQuery("")}
                     className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-pearl/20 hover:text-pearl"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 )}
               </div>
               
               <div className="hidden md:flex items-center gap-2 text-[10px] text-pearl/40 font-bold uppercase tracking-widest leading-none">
                  <Info className="w-3 h-3" /> Privado
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {struggles
              .filter(s => s.sinType.toLowerCase().includes(searchQuery.toLowerCase()) || s.biblicalAdvice.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((struggle) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={struggle.id} 
                className="glow-card border-l-4 border-l-grape/40 overflow-hidden group"
              >
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-display font-bold text-pearl group-hover:text-amber transition-colors">{struggle.sinType}</h3>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest flex items-center gap-1.5">
                            <HistoryIcon className="w-3 h-3" /> Quedas: {struggle.totalFalls}
                          </p>
                          {struggle.totalFalls > 0 && (
                            <button 
                              onClick={() => removeFall(struggle.id, struggle.totalFalls)}
                              disabled={updatingId === struggle.id}
                              className="p-1 text-red-500/30 hover:text-red-500 transition-colors"
                              title="Diminuir quedas"
                            >
                              <MinusCircle className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-amber uppercase font-bold tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> Vitórias: {struggle.totalVictories || 0}
                          </p>
                          {(struggle.totalVictories || 0) > 0 && (
                            <button 
                              onClick={() => removeVictory(struggle.id, struggle.totalVictories)}
                              disabled={updatingId === struggle.id}
                              className="p-1 text-amber/30 hover:text-amber transition-colors"
                              title="Diminuir vitórias"
                            >
                              <MinusCircle className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEdit(struggle)}
                        className="p-2 text-pearl/10 hover:text-amber hover:bg-amber/10 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingId(struggle.id)}
                        className="p-2 text-pearl/10 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-navy/40 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                    <Quote className="absolute -top-2 -left-2 w-16 h-16 text-pearl/5 opacity-40 rotate-12" />
                    <div className="relative space-y-4">
                      <p className="text-pearl/80 italic font-serif text-lg leading-relaxed">
                        "{struggle.biblicalAdvice}"
                      </p>
                      <div className="flex items-center gap-2 text-amber font-bold text-sm">
                        <BookOpen className="w-4 h-4 text-amber/40" /> {struggle.verse}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button 
                      onClick={() => registerFall(struggle.id, struggle.sinType)}
                      disabled={updatingId === struggle.id}
                      className="w-full sm:flex-1 bg-white/5 border border-amber/10 hover:border-amber/40 hover:bg-amber/5 py-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {updatingId === struggle.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-amber" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber/60" />
                      )}
                      Caí de novo (Confessar Queda)
                    </button>
                    <button 
                      onClick={() => registerVictory(struggle.id, struggle.sinType)}
                      disabled={updatingId === struggle.id}
                      className="w-full sm:w-auto bg-amber/10 text-amber hover:bg-amber hover:text-navy px-8 py-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {updatingId === struggle.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Vitória de Hoje
                    </button>
                  </div>
                  
                  {(struggle.lastFall || struggle.lastVictory) && (
                    <div className="text-[10px] text-pearl/20 text-center uppercase tracking-widest pt-2 flex flex-col gap-1">
                      {struggle.lastFall && (
                        <div>Última queda: {format(struggle.lastFall.toDate(), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}</div>
                      )}
                      {struggle.lastVictory && (
                        <div className="text-amber/40">Última vitória: {format(struggle.lastVictory.toDate(), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}</div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {struggles.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
                <Heart className="w-20 h-20" />
                <div className="space-y-1">
                  <p className="text-2xl font-display font-bold">Caminho Limpo</p>
                  <p className="text-sm italic">Adicione uma luta para começar a tratar com luz e sabedoria.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Tips */}
        <div className="space-y-6">
          {/* History Section */}
          <div className="bg-navy/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6 overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <HistoryIcon className="w-24 h-24" />
             </div>

             <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3 text-pearl font-bold text-sm uppercase tracking-widest">
                   <HistoryIcon className="w-4 h-4 text-amber" /> Histórico Recente
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    disabled={isDeletingHistory}
                    className="p-2 hover:bg-red-500/10 text-pearl/20 hover:text-red-400 rounded-xl transition-all"
                    title="Limpar Histórico"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
             </div>

             <div className="space-y-4 relative z-10">
               {history.length > 0 ? (
                 <div className="space-y-3">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group/item hover:border-white/10 transition-all">
                        <div className={cn(
                          "w-2 h-2 mt-1.5 rounded-full shrink-0",
                          h.type === 'fall' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        )} />
                        <div className="flex-1 space-y-0.5 min-w-0">
                          <p className="text-xs font-bold text-pearl/90 truncate capitalize">{h.sinType}</p>
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest",
                              h.type === 'fall' ? 'text-red-400' : 'text-emerald-400'
                            )}>
                              {h.type === 'fall' ? 'Queda' : 'Vitória'}
                            </span>
                            <span className="text-[10px] text-pearl/30">
                              {h.createdAt ? format(h.createdAt.toDate(), "dd/MM HH:mm") : '...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="py-10 text-center space-y-2 opacity-30">
                   <HistoryIcon className="w-8 h-8 mx-auto mb-2" />
                   <p className="text-xs font-bold uppercase tracking-widest">Sem registros</p>
                   <p className="text-[10px] italic">Suas últimas 5 ações aparecerão aqui.</p>
                 </div>
               )}
             </div>
          </div>

          <div className="bg-grape/5 border border-grape/10 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-3 text-grape font-bold text-xs uppercase tracking-widest">
               <Sparkles className="w-4 h-4" /> Sabedoria de Deus
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                 <h4 className="font-bold text-lg">A Luz dissipa as trevas</h4>
                 <p className="text-sm text-pearl/60 leading-relaxed">Pecados escondidos crescem na escuridão. Ao registrar aqui, você está trazendo para a luz de Deus, o primeiro passo para o arrependimento.</p>
               </div>
               <div className="space-y-2">
                 <h4 className="font-bold text-lg">Não é sobre culpa</h4>
                 <p className="text-sm text-pearl/60 leading-relaxed">O objetivo não é você se sentir culpado pelas quedas, mas enxergar padrões e lutar com as armas certas: a Palavra.</p>
               </div>
               <div className="space-y-2">
                 <h4 className="font-bold text-lg">Processo, não evento</h4>
                 <p className="text-sm text-pearl/60 leading-relaxed">A santificação é contínua. Cada dia que você escolhe Cristo em vez da queda é uma vitória eterna.</p>
               </div>
            </div>
          </div>

          <div className="bg-amber/5 border border-amber/10 rounded-[2.5rem] p-8 space-y-4">
             <div className="flex items-center gap-3 text-amber font-bold text-xs uppercase tracking-widest">
                <AlertTriangle className="w-4 h-4" /> Precisa de Ajuda?
             </div>
             <p className="text-sm text-pearl/80">Se sua luta for muito pesada, não lute sozinho. Procure um mentor, um pastor ou alguém de confiança na sua igreja local.</p>
             <button className="text-amber text-xs font-bold uppercase flex items-center gap-2 hover:gap-3 transition-all pt-2">
                Falar com a IA Assistente <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        </div>
      </div>

      {/* New Struggle Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-navy border border-amber/20 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Flame className="w-32 h-32" />
              </div>

              <div className="flex justify-between items-center relative z-10">
                <h2 className="text-3xl font-display font-bold">
                  {editingId ? "Editar Acompanhamento" : "Confessar Luta"}
                </h2>
                <button onClick={closeModal} className="text-pearl/40 hover:text-pearl transition-colors">✕</button>
              </div>

              <div className="space-y-4 relative z-10 max-h-[250px] flex flex-col">
                 <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-amber uppercase tracking-widest leading-none">Selecione ou escreva abaixo:</p>
                    <div className="relative group w-48">
                       <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-pearl/20 group-focus-within:text-amber transition-colors" />
                       <input 
                         type="text"
                         value={sugSearch}
                         onChange={(e) => setSugSearch(e.target.value)}
                         placeholder="Buscar pecado..."
                         className="w-full bg-white/5 border border-white/10 rounded-lg py-1 pl-7 pr-2 text-[10px] outline-none focus:border-amber/50 transition-all font-display"
                       />
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {filteredCategories.map((cat, i) => (
                      <div key={i} className="space-y-2">
                        <p className="text-[10px] font-bold text-pearl/20 uppercase tracking-[0.1em]">{cat.name}</p>
                        <div className="flex flex-wrap gap-2">
                           {cat.items.map((item, j) => (
                             <button 
                                key={j} 
                                type="button"
                                onClick={() => selectSuggestion(item)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all",
                                  (formData.sinType === item.sin || selectedSuns.some(s => s.sin === item.sin))
                                    ? "bg-amber text-navy border-amber shadow-[0_0_10px_rgba(201,168,76,0.3)]" 
                                    : "bg-white/5 border-white/5 text-pearl/60 hover:bg-amber/10 hover:text-amber hover:border-amber/20"
                                )}
                             >
                               {item.sin}
                             </button>
                           ))}
                        </div>
                      </div>
                    ))}
                    {filteredCategories.length === 0 && (
                      <p className="text-[10px] text-pearl/20 italic text-center py-4">Nenhuma sugestão encontrada para "{sugSearch}"</p>
                    )}
                 </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {selectedSuns.length > 0 ? (
                  <div className="bg-amber/5 border border-amber/20 rounded-2xl p-6 space-y-3">
                    <p className="text-xs font-bold text-amber uppercase tracking-widest">Lutas Selecionadas ({selectedSuns.length}):</p>
                    <div className="flex flex-wrap gap-2">
                       {selectedSuns.map((s, i) => (
                         <div key={i} className="px-3 py-1.5 bg-amber/20 text-amber text-[10px] font-bold rounded-lg border border-amber/30 flex items-center gap-2">
                            {s.sin}
                            <button type="button" onClick={() => setSelectedSuns(prev => prev.filter(item => item.sin !== s.sin))} className="hover:text-white">✕</button>
                         </div>
                       ))}
                    </div>
                    <p className="text-[10px] text-pearl/40 italic pt-2">Clique em iniciar para começar o acompanhamento de todas estas lutas separadamente.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Qual luta você enfrenta?</label>
                      <input 
                        required={selectedSuns.length === 0}
                        value={formData.sinType}
                        onChange={e => {
                          setFormData({...formData, sinType: e.target.value});
                          if (selectedSuns.length > 0) setSelectedSuns([]); // Clear chips if typing
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-amber transition-colors outline-none text-lg font-serif"
                        placeholder="Ex: Impaciência, Melancolia..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Dica ou Mensagem para vencer</label>
                      <textarea 
                        required={selectedSuns.length === 0 && formData.sinType !== ""}
                        value={formData.biblicalAdvice}
                        onChange={e => setFormData({...formData, biblicalAdvice: e.target.value})}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-amber transition-colors outline-none resize-none font-serif text-pearl/80"
                        placeholder="O que o Espírito Santo diz sobre isso?"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Versículo de Apoio (Opcional)</label>
                      <input 
                        value={formData.verse}
                        onChange={e => setFormData({...formData, verse: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-amber transition-colors outline-none text-sm italic"
                        placeholder="Ex: João 8:32"
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 flex flex-col md:flex-row gap-4">
                  <button 
                    type="submit"
                    disabled={loading || (selectedSuns.length === 0 && !formData.sinType)}
                    className="flex-1 bg-amber text-navy font-bold py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-base"
                  >
                    {loading 
                      ? "Trazendo para a Luz..." 
                      : editingId 
                        ? "Salvar Alterações" 
                        : selectedSuns.length > 0 
                          ? `Iniciar ${selectedSuns.length} Acompanhamentos` 
                          : "Iniciar Acompanhamento"}
                  </button>
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="px-8 py-5 text-pearl/40 font-bold hover:text-pearl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Confirm Clear History Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-navy/95 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-navy border border-red-500/20 w-full max-w-sm rounded-[2rem] p-8 space-y-6 text-center shadow-2xl"
             >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold">Limpar Histórico?</h3>
                  <p className="text-pearl/60 text-sm">Deseja realmente apagar todo o seu histórico de lutas e vitórias? Esta ação é irreversível.</p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    disabled={isDeletingHistory}
                    onClick={clearHistory}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-xl transition-all disabled:opacity-50"
                  >
                    {isDeletingHistory ? "Limpando..." : "Sim, Limpar tudo"}
                  </button>
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="w-full py-3 text-pearl/40 font-bold hover:text-pearl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
