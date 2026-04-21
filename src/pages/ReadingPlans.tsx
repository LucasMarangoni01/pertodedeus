import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { BookOpen, CheckCircle, ChevronRight, Bookmark } from "lucide-react";
import { cn } from "../lib/utils";

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

export default function ReadingPlans() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, number[]>>({});
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

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

  const calculatePercentage = (planId: string, duration: number) => {
    const completed = (progress[planId] || []).length;
    return Math.round((completed / duration) * 100);
  };

  if (selectedPlan) {
    const pId = selectedPlan.id;
    const completedDays = progress[pId] || [];
    const percentage = calculatePercentage(pId, selectedPlan.duration);

    return (
      <div className="space-y-10 max-w-4xl mx-auto">
        <button 
          onClick={() => setSelectedPlan(null)}
          className="text-amber text-xs font-bold uppercase flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
           <ChevronRight className="w-4 h-4 rotate-180" /> Voltar aos Planos
        </button>
        
        <header className="space-y-6">
          <div className="h-48 rounded-3xl overflow-hidden relative">
            <img src={selectedPlan.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
            <div className="absolute bottom-6 left-6 space-y-2">
               <span className="px-3 py-1 bg-amber text-navy text-[10px] font-bold uppercase tracking-wider rounded-full">Plano de Leitura</span>
               <h1 className="text-3xl md:text-5xl font-display font-bold">{selectedPlan.title}</h1>
            </div>
          </div>
          <p className="text-pearl/60 font-serif text-lg">{selectedPlan.desc}</p>
          
          <div className="bg-white/5 border border-amber/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold">Progresso</p>
              <p className="text-xs text-amber font-bold">{percentage}%</p>
            </div>
            <div className="h-2 bg-navy rounded-full overflow-hidden">
               <div className="h-full bg-amber transition-all duration-1000" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: selectedPlan.duration }).map((_, i) => {
            const day = i + 1;
            const isDone = completedDays.includes(day);
            return (
              <button 
                key={day}
                onClick={() => toggleDay(pId, day)}
                className={cn(
                  "p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all",
                  isDone ? "bg-amber/10 border-amber/30 text-amber" : "bg-white/5 border-transparent text-pearl/60 hover:bg-white/10"
                )}
              >
                 {isDone ? <CheckCircle className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-pearl/20" />}
                 <span className="text-xs font-bold uppercase tracking-widest">Dia {day}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-amber font-medium tracking-widest uppercase text-xs">Disciplina de Leitura</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Planos de Leitura</h1>
      </header>

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
    </div>
  );
}
