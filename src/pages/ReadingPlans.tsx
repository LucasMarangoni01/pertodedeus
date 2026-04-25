import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc } from "firebase/firestore";
import { BookOpen, CheckCircle, ChevronRight, Bookmark, Plus, X, Trash2, Calendar, Target, LayoutList, Type, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";
import { bibleBooks } from "../constants/bibleData";

const plans = [
  {
    id: "proverbs-31",
    title: "Provérbios em 31 Dias",
    desc: "Um capítulo de Provérbios todos os dias para adquirir sabedoria.",
    duration: 31,
    image: "https://picsum.photos/seed/proverbs/400/200"
  },
  {
    id: "gospels-30",
    title: "Os Evangelhos em 30 Dias",
    desc: "Conheça a vida e obra de Jesus pelos 4 evangelhos.",
    duration: 30,
    image: "https://picsum.photos/seed/gospel/400/200"
  },
  {
    id: "psalms-30",
    title: "Encorajamento nos Salmos",
    desc: "30 dias de louvor e conforto no livro de Salmos.",
    duration: 30,
    image: "https://picsum.photos/seed/psalms/400/200"
  }
];

interface CustomPlanItem {
  day: number;
  passage: string;
  isCompleted: boolean;
}

interface CustomPlan {
  id: string;
  title: string;
  description: string;
  items: CustomPlanItem[];
  createdAt: any;
  totalItems: number;
  completedItems: number;
}

export default function ReadingPlans() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, number[]>>({});
  const [customPlans, setCustomPlans] = useState<CustomPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form State for New Plan
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");
  const [newPlanItems, setNewPlanItems] = useState<{ book: string; chapters: string; verses?: string }[]>([
    { book: bibleBooks[0].name, chapters: "1" }
  ]);

  useEffect(() => {
    if (!user) return;
    const fetchProgress = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().readingPlans) {
        setProgress(docSnap.data().readingPlans);
      }
    };
    fetchProgress();

    // Listen to custom plans
    const q = query(collection(db, "users", user.uid, "custom_plans"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CustomPlan[];
      setCustomPlans(plansData);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleDay = async (planId: string, day: number) => {
    if (!user) return;
    
    const planProgress = progress[planId] || [];
    const isCompleted = planProgress.includes(day);
    
    let newPlanProgress;
    if (isCompleted) {
      newPlanProgress = planProgress.filter(d => d !== day);
    } else {
      newPlanProgress = [...planProgress, day];
    }
    
    const newProgress = { ...progress, [planId]: newPlanProgress };
    setProgress(newProgress);
    
    await setDoc(doc(db, "users", user.uid), { readingPlans: newProgress }, { merge: true });
  };

  const toggleCustomItem = async (planId: string, itemIndex: number) => {
    if (!user) return;
    const plan = customPlans.find(p => p.id === planId);
    if (!plan) return;

    const newItems = [...plan.items];
    newItems[itemIndex].isCompleted = !newItems[itemIndex].isCompleted;
    
    const completedItems = newItems.filter(i => i.isCompleted).length;

    await updateDoc(doc(db, "users", user.uid, "custom_plans", planId), {
      items: newItems,
      completedItems: completedItems,
      updatedAt: serverTimestamp()
    });
  };

  const handleDeletePlan = async (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    if (!user) return;
    setIsDeleting(planId);
    try {
      await deleteDoc(doc(db, "users", user.uid, "custom_plans", planId));
    } finally {
      setIsDeleting(null);
    }
  };

  const calculatePercentage = (planId: string, duration: number) => {
    const completed = (progress[planId] || []).length;
    return Math.round((completed / duration) * 100);
  };

  const calculateCustomPercentage = (plan: CustomPlan) => {
    if (!plan.totalItems) return 0;
    return Math.round((plan.completedItems / plan.totalItems) * 100);
  };

  const addPlanItemNode = () => {
    setNewPlanItems([...newPlanItems, { book: bibleBooks[0].name, chapters: "1" }]);
  };

  const removePlanItemNode = (index: number) => {
    setNewPlanItems(newPlanItems.filter((_, i) => i !== index));
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlanTitle.trim()) return;

    const items: CustomPlanItem[] = newPlanItems.map((item, idx) => ({
      day: idx + 1,
      passage: `${item.book} ${item.chapters}${item.verses ? ":" + item.verses : ""}`,
      isCompleted: false
    }));

    const planData = {
      userId: user.uid,
      title: newPlanTitle,
      description: newPlanDesc,
      items: items,
      totalItems: items.length,
      completedItems: 0,
      createdAt: serverTimestamp(),
      durationDays: items.length // Assuming 1 move/day for simple logic
    };

    await addDoc(collection(db, "users", user.uid, "custom_plans"), planData);
    setIsModalOpen(false);
    setNewPlanTitle("");
    setNewPlanDesc("");
    setNewPlanItems([{ book: bibleBooks[0].name, chapters: "1" }]);
  };

  if (selectedPlan) {
    const isCustom = !!customPlans.find(p => p.id === selectedPlan.id);
    const pId = selectedPlan.id;
    const percentage = isCustom 
      ? calculateCustomPercentage(customPlans.find(p => p.id === pId)!) 
      : calculatePercentage(pId, selectedPlan.duration);

    return (
      <div className="space-y-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedPlan(null)}
          className="text-amber text-xs font-bold uppercase flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
           <ChevronRight className="w-4 h-4 rotate-180" /> Voltar aos Planos
        </button>
        
        <header className="space-y-6">
          <div className="h-48 rounded-3xl overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <img src={selectedPlan.image || `https://picsum.photos/seed/${pId}/800/400`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
            <div className="absolute bottom-6 left-6 space-y-2">
               <span className="px-3 py-1 bg-amber text-navy text-[10px] font-bold uppercase tracking-wider rounded-full">
                 {isCustom ? "Plano Personalizado" : "Plano de Leitura"}
               </span>
               <h1 className="text-3xl md:text-5xl font-display font-bold">{selectedPlan.title}</h1>
            </div>
          </div>
          <p className="text-pearl/60 font-serif text-lg leading-relaxed">{selectedPlan.description || selectedPlan.desc}</p>
          
          <div className="bg-white/5 border border-amber/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold">Progresso Geral</p>
              <p className="text-sm text-amber font-bold">{percentage}%</p>
            </div>
            <div className="h-2 bg-navy rounded-full overflow-hidden">
               <div className="h-full bg-amber transition-all duration-1000" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isCustom ? (
            customPlans.find(p => p.id === pId)?.items.map((item, i) => (
              <button 
                key={i}
                onClick={() => toggleCustomItem(pId, i)}
                className={cn(
                  "p-6 rounded-2xl border text-left flex flex-col gap-3 transition-all",
                  item.isCompleted ? "bg-amber/10 border-amber/30 text-amber" : "bg-white/5 border-amber/10 text-pearl/60 hover:bg-white/10"
                )}
              >
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Meta {item.day}</span>
                   {item.isCompleted ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-pearl/20" />}
                 </div>
                 <span className="text-lg font-display font-bold">{item.passage}</span>
              </button>
            ))
          ) : (
            Array.from({ length: selectedPlan.duration }).map((_, i) => {
              const day = i + 1;
              const completedDays = progress[pId] || [];
              const isDone = completedDays.includes(day);
              return (
                <button 
                  key={day}
                  onClick={() => toggleDay(pId, day)}
                  className={cn(
                    "p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all",
                    isDone ? "bg-amber/10 border-amber/30 text-amber" : "bg-white/5 border-amber/10 text-pearl/60 hover:bg-white/10"
                  )}
                >
                   {isDone ? <CheckCircle className="w-8 h-8" /> : <div className="w-8 h-8 rounded-full border-2 border-pearl/20" />}
                   <span className="text-[10px] font-bold uppercase tracking-widest">Pilar {day}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-amber font-medium tracking-widest uppercase text-xs">Disciplina de Leitura</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Planos de Leitura</h1>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber text-navy px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl self-start md:self-auto"
        >
          <Plus className="w-5 h-5" /> Criar Plano Personalizado
        </button>
      </header>

      {/* Custom Plans Section */}
      {customPlans.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Seus Planos Personalizados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customPlans.map((plan) => (
              <motion.div 
                key={plan.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedPlan(plan)}
                className="glow-card p-0 overflow-hidden flex flex-col group cursor-pointer border-amber/20 relative"
              >
                <button 
                  onClick={(e) => handleDeletePlan(e, plan.id)}
                  className="absolute top-4 right-4 z-20 p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  {isDeleting === plan.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>

                <div className="h-40 overflow-hidden relative">
                   <img src={`https://picsum.photos/seed/${plan.id}/400/200`} alt={plan.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                   <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
                </div>
                
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                   <h3 className="text-xl font-display font-bold group-hover:text-amber transition-colors">{plan.title}</h3>
                   <p className="text-pearl/60 text-sm line-clamp-2">{plan.description}</p>
                   
                   <div className="mt-auto space-y-3 pt-6">
                     <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                       <span className="text-pearl/40">{plan.totalItems} Etapas</span>
                       <span className="text-amber">{calculateCustomPercentage(plan)}% Concluído</span>
                     </div>
                     <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber" style={{ width: `${calculateCustomPercentage(plan)}%` }} />
                     </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Sugestões do Reino</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <motion.div 
              key={plan.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedPlan(plan)}
              className="glow-card p-0 overflow-hidden flex flex-col group cursor-pointer border-amber/10"
            >
              <div className="h-40 overflow-hidden relative">
                 <img src={plan.image} alt={plan.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                 <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
              </div>
              
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                 <h3 className="text-xl font-display font-bold group-hover:text-amber transition-colors">{plan.title}</h3>
                 <p className="text-pearl/60 text-sm line-clamp-2">{plan.desc}</p>
                 
                 <div className="mt-auto space-y-3 pt-6">
                   <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                     <span className="text-pearl/40">{plan.duration} Dias</span>
                     <span className="text-amber">{calculatePercentage(plan.id, plan.duration)}% Concluído</span>
                   </div>
                   <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber" style={{ width: `${calculatePercentage(plan.id, plan.duration)}%` }} />
                   </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Create Plan Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glow-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
            >
              <div className="p-6 border-b border-amber/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber/10 rounded-lg text-amber">
                    <Target className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-amber">Novo Plano Personalizado</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-pearl/40 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2 text-left block">Nome do Plano</label>
                      <input 
                        type="text" 
                        required
                        value={newPlanTitle}
                        onChange={(e) => setNewPlanTitle(e.target.value)}
                        placeholder="Ex: Minha Jornada em Salmos"
                        className="w-full bg-white/5 border border-amber/20 rounded-xl px-4 py-3 outline-none focus:border-amber transition-colors text-pearl"
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2 text-left block">Breve Descrição</label>
                      <input 
                        type="text"
                        value={newPlanDesc}
                        onChange={(e) => setNewPlanDesc(e.target.value)}
                        placeholder="Ex: Estudo focado nos Salmos de gratidão"
                        className="w-full bg-white/5 border border-amber/20 rounded-xl px-4 py-3 outline-none focus:border-amber transition-colors text-pearl"
                      />
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-amber/10 pb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-amber flex items-center gap-2">
                       <LayoutList className="w-4 h-4" /> Etapas do Plano
                    </h3>
                    <button 
                      type="button" 
                      onClick={addPlanItemNode}
                      className="text-[10px] font-bold text-amber bg-amber/10 px-3 py-1.5 rounded-lg hover:bg-amber hover:text-navy transition-all"
                    >
                      + ADICIONAR ETAPA
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newPlanItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-4 bg-white/5 p-4 rounded-2xl relative group">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] uppercase text-pearl/30 font-bold">Livro</label>
                          <select 
                            value={item.book}
                            onChange={(e) => {
                              const updated = [...newPlanItems];
                              updated[idx].book = e.target.value;
                              setNewPlanItems(updated);
                            }}
                            className="w-full bg-navy border border-amber/10 rounded-lg px-3 py-2 text-sm text-pearl"
                          >
                            {bibleBooks.map(b => (
                              <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] uppercase text-pearl/30 font-bold">Capítulos</label>
                          <input 
                            type="text"
                            placeholder="Ex: 1-5 ou 1,2,3"
                            value={item.chapters}
                            onChange={(e) => {
                              const updated = [...newPlanItems];
                              updated[idx].chapters = e.target.value;
                              setNewPlanItems(updated);
                            }}
                            className="w-full bg-navy border border-amber/10 rounded-lg px-3 py-2 text-sm text-pearl"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] uppercase text-pearl/30 font-bold">Versículos (Opcional)</label>
                          <input 
                            type="text"
                            placeholder="Ex: 1-10"
                            value={item.verses}
                            onChange={(e) => {
                              const updated = [...newPlanItems];
                              updated[idx].verses = e.target.value;
                              setNewPlanItems(updated);
                            }}
                            className="w-full bg-navy border border-amber/10 rounded-lg px-3 py-2 text-sm text-pearl"
                          />
                        </div>
                        {newPlanItems.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removePlanItemNode(idx)}
                            className="h-full flex items-center justify-center text-red-400 hover:text-red-500 transition-colors pt-4 sm:pt-4"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-amber text-navy font-bold py-4 rounded-xl shadow-[0_10px_20px_rgba(201,168,76,0.2)] hover:scale-[1.02] transition-all"
                  >
                    CRIAR MEU PLANO PERSONALIZADO
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
