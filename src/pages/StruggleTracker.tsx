import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Flame, Heart, AlertTriangle, CheckCircle2, History as HistoryIcon, Trash2, ArrowRight, BookOpen, Quote, Sparkles, RefreshCw, Info, Edit2, Search, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const struggleCategories = [
  {
    name: "7 Pecados Capitais",
    items: [
      { sin: "Orgulho", advice: "O orgulho é a raiz da queda. Busque a humildade de Cristo, que sendo Deus, se esvaziou por nós.", verse: "Provérbios 16:18" },
      { sin: "Inveja", advice: "A inveja é como podridão nos ossos. Alegre-se com os que se alegram.", verse: "Provérbios 14:30" },
      { sin: "Ira / Raiva", advice: "A ira do homem não produz a justiça de Deus. Peça ao Espírito Santo o fruto do domínio próprio.", verse: "Tiago 1:20" },
      { sin: "Preguiça Espiritual", advice: "A caminhada cristã exige diligência. Comece com 5 minutos de oração hoje.", verse: "Efésios 5:14" },
      { sin: "Avarícia / Ganância", advice: "O amor ao dinheiro é raiz de todos os males. Busque primeiro o Reino de Deus.", verse: "1 Timóteo 6:10" },
      { sin: "Gula", advice: "Não seja dominado pelo ventre. O corpo é templo do Espírito Santo.", verse: "1 Coríntios 6:19" },
      { sin: "Luxúria", advice: "Fuja das paixões da mocidade. Busque a pureza de pensamento e ação.", verse: "2 Timóteo 2:22" }
    ]
  },
  {
    name: "10 Mandamentos (Evangélicos)",
    items: [
      { sin: "Idolatria (Outros Deuses)", advice: "Não terás outros deuses diante de mim. Deus requer exclusividade.", verse: "Êxodo 20:3" },
      { sin: "Imagens de Escultura", advice: "Não farás para ti imagem de escultura. Adore a Deus em espírito.", verse: "Êxodo 20:4" },
      { sin: "Blasfêmia (Nome em Vão)", advice: "Não tomarás o nome do Senhor em vão. Deus é santo e Seu nome é digno.", verse: "Êxodo 20:7" },
      { sin: "Negligência ao Dia do Senhor", advice: "Lembra-te do dia de sábado/descanso para o santificar.", verse: "Êxodo 20:8" },
      { sin: "Desonra aos Pais", advice: "Honra a teu pai e a tua mãe para que teus dias se prolonguem.", verse: "Êxodo 20:12" },
      { sin: "Homicídio / Ódio", advice: "Não matarás. Quem odeia seu irmão é assassino no coração.", verse: "1 João 3:15" },
      { sin: "Adultério", advice: "Não adulterarás. Guarde a fidelidade no seu casamento e mente.", verse: "Mateus 5:27-28" },
      { sin: "Furto / Roubo", advice: "Não furtarás. Seja íntegro em todos os seus negócios e posses.", verse: "Êxodo 20:15" },
      { sin: "Falso Testemunho / Mentira", advice: "Não dirás falso testemunho. Seja a sua palavra sim, sim; não, não.", verse: "Mateus 5:37" },
      { sin: "Cobiça", advice: "Não cobiçarás o que é do próximo. Aprenda a estar contente em toda situação.", verse: "Filipenses 4:11" }
    ]
  },
  {
    name: "10 Mandamentos (Católicos)",
    items: [
      { sin: "Amar a Deus sobre todas as coisas", advice: "O primeiro mandamento nos chama a amar a Deus com todo coração.", verse: "Mateus 22:37" },
      { sin: "Não tomar Seu santo nome em vão", advice: "Respeite a santidade do nome de Deus em suas palavras.", verse: "Salmo 8:1" },
      { sin: "Guardar domingos e festas de guarda", advice: "Santifique o dia do Senhor participando da Eucaristia e descanso.", verse: "Atos 20:7" },
      { sin: "Honrar pai e mãe", advice: "O amor filial é a base de uma vida abençoada.", verse: "Efésios 6:1" },
      { sin: "Não matar", advice: "Proteja a vida desde a concepção até o seu fim natural.", verse: "Salmo 139" },
      { sin: "Não pecar contra a castidade", advice: "Mantenha o coração e o corpo puros para o Senhor.", verse: "Mateus 5:8" },
      { sin: "Não furtar", advice: "A justiça exige o respeito aos bens alheios.", verse: "Levítico 19:11" },
      { sin: "Não levantar falso testemunho", advice: "A verdade nos liberta. Evite a calúnia e a detração.", verse: "João 8:32" },
      { sin: "Não desejar a mulher do próximo", advice: "Guarde os seus olhares e desejos com pureza.", verse: "Mateus 5:28" },
      { sin: "Não cobiçar as coisas alheias", advice: "Agradeça pelo que tem e evite a inveja material.", verse: "Hebreus 13:5" }
    ]
  },
  {
    name: "Relacionamentos e Palavras",
    items: [
      { sin: "Malfalar / Calúnia", advice: "A língua tem poder de vida e morte. Use-a para abençoar.", verse: "Provérbios 18:21" },
      { sin: "Falta de Perdão / Mágoa", advice: "Se não perdoardes, vosso Pai não vos perdoará.", verse: "Mateus 6:15" },
      { sin: "Julgamento", advice: "Não julgueis para não serdes julgados.", verse: "Mateus 7:1" },
      { sin: "Murmuração / Reclamação", advice: "Fazei tudo sem murmurações nem contendas.", verse: "Filipenses 2:14" },
      { sin: "Mentira", advice: "O diabo é o pai da mentira. Seja a sua palavra verdadeira.", verse: "João 8:44" }
    ]
  },
  {
    name: "Lutas Modernas e Vícios",
    items: [
      { sin: "Pornografia / Luxúria Digital", advice: "O que entra pelos olhos afeta a alma. Busque a pureza.", verse: "Mateus 6:22-23" },
      { sin: "Vício em Redes Sociais / Celular", advice: "Resgate o tempo, pois os dias são maus.", verse: "Efésios 5:16" },
      { sin: "Ansiedade / Preocupação", advice: "Não andeis ansiosos. Deus cuida de você.", verse: "1 Pedro 5:7" },
      { sin: "Drogas / Álcool", advice: "Não vos embriagueis, mas enchei-vos do Espírito.", verse: "Efésios 5:18" },
      { sin: "Preguiça / Procrastinação", advice: "Vai ter com a formiga, ó preguiçoso.", verse: "Provérbios 6:6" },
      { sin: "Idolatria do Eu", advice: "Aquele que quiser vir após mim, negue-se a si mesmo.", verse: "Mateus 16:24" }
    ]
  }
];

export default function StruggleTracker() {
  const { user } = useAuth();
  const [struggles, setStruggles] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sugSearch, setSugSearch] = useState("");

  // Form State
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

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "struggles", editingId), {
          sinType: formData.sinType,
          biblicalAdvice: formData.biblicalAdvice,
          verse: formData.verse,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "users", user.uid, "struggles"), {
          userId: user.uid,
          sinType: formData.sinType,
          biblicalAdvice: formData.biblicalAdvice,
          verse: formData.verse,
          totalFalls: 0,
          createdAt: serverTimestamp(),
        });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving struggle:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
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

  const registerFall = async (id: string, currentFalls: number) => {
    if (!user || updatingId) return;
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "users", user.uid, "struggles", id), {
        totalFalls: currentFalls + 1,
        lastFall: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error registering fall:", error);
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
    setFormData({
      sinType: sug.sin,
      biblicalAdvice: sug.advice,
      verse: sug.verse
    });
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
                      <p className="text-xs text-pearl/40 uppercase font-bold tracking-widest flex items-center gap-2">
                        <HistoryIcon className="w-3 h-3" /> Total de quedas: {struggle.totalFalls}
                      </p>
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
                      onClick={() => registerFall(struggle.id, struggle.totalFalls)}
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
                      className="w-full sm:w-auto bg-amber/10 text-amber hover:bg-amber hover:text-navy px-8 py-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Vitória de Hoje
                    </button>
                  </div>
                  
                  {struggle.lastFall && (
                    <div className="text-[10px] text-pearl/20 text-center uppercase tracking-widest pt-2">
                      Última queda registrada em {format(struggle.lastFall.toDate(), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
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
                                  formData.sinType === item.sin 
                                    ? "bg-amber text-navy border-amber" 
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Qual luta você enfrenta?</label>
                  <input 
                    required
                    value={formData.sinType}
                    onChange={e => setFormData({...formData, sinType: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-amber transition-colors outline-none text-lg font-serif"
                    placeholder="Ex: Impaciência, Melancolia..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Dica ou Mensagem para vencer</label>
                  <textarea 
                    required
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

                <div className="pt-4 flex flex-col md:flex-row gap-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-amber text-navy font-bold py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-base"
                  >
                    {loading ? "Trazendo para a Luz..." : editingId ? "Salvar Alterações" : "Iniciar Acompanhamento"}
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
    </div>
  );
}
