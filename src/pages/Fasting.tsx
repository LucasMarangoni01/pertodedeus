import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  Droplets, 
  Tv, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  ChevronDown,
  Calendar,
  Clock,
  Heart,
  Target,
  Utensils,
  BookOpen,
  Loader2
} from "lucide-react";
import { cn } from "../lib/utils";
import { generateFastingPlan, FastingPlan } from "../services/fastingService";

const fastingTypes = [
  {
    id: "total",
    name: "Jejum Total",
    description: "Abstenção total de alimentos sólidos e líquidos, consumindo apenas água.",
    difficulty: "Avançado",
    icon: <Droplets className="w-6 h-6" />,
    color: "from-blue-900/40 to-blue-600/20"
  },
  {
    id: "parcial",
    name: "Jejum Parcial (Daniel)",
    description: "Abstenção de carnes, doces e alimentos refinados. Foco em frutas, legumes e grãos.",
    difficulty: "Iniciante",
    icon: <Flame className="w-6 h-6 text-amber" />,
    color: "from-amber/40 to-amber/10"
  },
  {
    id: "media",
    name: "Jejum de Mídias",
    description: "Abstenção de redes sociais, televisão, entretenimento digital e distrações seculares.",
    difficulty: "Intermediário",
    icon: <Tv className="w-6 h-6 text-purple-400" />,
    color: "from-purple-900/40 to-purple-600/20"
  }
];

const timelineSteps = [
  {
    title: "Preparo Espiritual",
    desc: "Defina o propósito. Ore e peça ao Espírito Santo para guiar sua intenção e fortalecer sua mente.",
    icon: <Target className="w-5 h-5" />
  },
  {
    title: "Preparo Físico",
    desc: "Hidrate-se bem e faça uma refeição leve e nutritiva antes de iniciar. Evite excesso de açúcar ou cafeína.",
    icon: <Heart className="w-5 h-5" />
  },
  {
    title: "Durante o Jejum",
    desc: "Substitua as refeições por tempo de oração, leitura bíblica e silêncio diante de Deus.",
    icon: <Clock className="w-5 h-5" />
  },
  {
    title: "Quebrando o Jejum",
    desc: "Volte a comer aos poucos com alimentos leves. Termine com uma oração de gratidão.",
    icon: <CheckCircle2 className="w-5 h-5" />
  }
];

export default function Fasting() {
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [calcData, setCalcData] = useState({
    experience: "",
    objective: "",
    duration: "12h",
    health: ""
  });
  const [recommendation, setRecommendation] = useState<any>(null);
  const [fastingPlan, setFastingPlan] = useState<FastingPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendation = async () => {
    if (!calcData.experience || !calcData.objective || !calcData.health) {
      alert("Por favor, preencha todos os campos para receber sua recomendação.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setFastingPlan(null);
    let type = "";
    let justification = "";
    let prep = "";
    let breakFast = "";

    if (calcData.health === "restrições") {
      type = "Jejum de Mídias ou Parcial Leve";
      justification = "Sua saúde é o templo de Deus. Recomendamos focar na abstenção de distrações digitais para não comprometer seu quadro físico.";
      prep = "Escolha quais aplicativos ou mídias você vai silenciar.";
      breakFast = "Reserve um tempo para agradecer e refletir sobre o silêncio conquistado.";
    } else if (calcData.experience === "nunca") {
      type = "Jejum Parcial ou 6h-12h de Alimentos";
      justification = "Como é sua primeira vez, é sábio começar com um período mais curto para que sua alma e corpo se adaptem à disciplina.";
      prep = "Durma cedo e tome um café da manhã leve com frutas.";
      breakFast = "Uma sopa ou salada leve será perfeita.";
    } else {
      type = calcData.duration === "24h" || calcData.duration === "3 dias" ? "Jejum Total ou Daniel prolongado" : "Jejum Total (Água)";
      justification = "Dada sua experiência, você pode buscar uma profundidade maior. O objetivo de " + calcData.objective + " será fortalecido pelo seu sacrifício.";
      prep = "Diminua o ritmo de trabalho se possível e foque na oração intercessória.";
      breakFast = "Alimentos crus e de fácil digestão.";
    }

    setRecommendation({ type, justification, prep, breakFast });
    
    // Generate AI Diet Plan
    try {
      const plan = await generateFastingPlan(calcData, type);
      if (plan) {
        setFastingPlan(plan);
      } else {
        setError("Não foi possível gerar as recomendações detalhadas no momento. Tente novamente em instantes.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar com o assistente espiritual.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-[#F0EDE6] selection:bg-amber selection:text-[#0B0F1A] font-serif overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12 space-y-16">
        
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <span className="text-amber font-sans tracking-[0.2em] text-xs uppercase font-bold">O Silêncio que Alimenta</span>
          <h1 className="text-4xl md:text-5xl font-display text-white">Prática do Jejum</h1>
          
          <div className="pt-8">
            <motion.div 
              className="relative p-6 border-l-2 border-amber/40 bg-white/5 backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-lg italic text-pearl/80 leading-relaxed">
                "Mas, quando você jejuar, perfume a cabeça e lave o rosto, para que não pareça aos outros que você está jejuando, mas apenas a seu Pai, que vê no secreto..."
              </p>
              <footer className="mt-4 text-amber font-sans text-sm font-semibold">— Mateus 6:17-18</footer>
            </motion.div>
          </div>
          
          <p className="font-sans text-pearl/60 text-sm leading-relaxed max-w-sm mx-auto pt-6">
            O jejum não é para convencer Deus a nos dar algo, mas para preparar nosso coração para receber o que Ele já tem. É esvaziar-se de si para encher-se do Espírito.
          </p>
        </motion.header>

        {/* Section 2: Types of Fasting */}
        <section className="space-y-8">
          <h2 className="text-2xl font-display text-white text-center">Formas de Sacrifício</h2>
          <div className="space-y-4">
            {fastingTypes.map((type) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={cn(
                  "rounded-2xl border transition-all duration-300",
                  activeAccordion === type.id 
                    ? "bg-gradient-to-br border-amber/30 ring-1 ring-amber/20 translate-y-[-4px] shadow-2xl " + type.color
                    : "bg-white/5 border-white/10 hover:border-amber/20"
                )}
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === type.id ? null : type.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center bg-[#0B0F1A] border",
                      activeAccordion === type.id ? "border-amber/40 text-amber" : "border-white/10 text-pearl/40"
                    )}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-white">{type.name}</h3>
                      <span className="text-[10px] uppercase font-sans font-black tracking-widest text-amber/60">{type.difficulty}</span>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 transition-transform duration-300 text-amber/40", activeAccordion === type.id && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {activeAccordion === type.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 font-sans text-sm text-pearl/70 leading-relaxed border-t border-white/5 mt-2">
                        {type.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 3: Calculator */}
        <section className="bg-white/5 rounded-[2rem] border border-white/10 p-8 space-y-8 backdrop-blur-md">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display text-white">Calculadora Espiritual</h2>
            <p className="font-sans text-xs text-pearl/40 uppercase tracking-widest">Encontre o seu ritmo</p>
          </div>

          <div className="space-y-6 font-sans">
            <div className="space-y-3">
              <label className="text-sm font-medium text-amber/80">Experiência prévia</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "nunca", label: "Nunca fiz" },
                  { id: "pouco", label: "Fiz algumas vezes" },
                  { id: "regular", label: "Pratico regularmente" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setCalcData({...calcData, experience: opt.id})}
                    className={cn(
                      "px-4 py-3 rounded-xl border text-sm text-left transition-all",
                      calcData.experience === opt.id 
                        ? "bg-amber text-[#0B0F1A] border-amber font-bold" 
                        : "bg-white/5 border-white/10 text-pearl/60 hover:bg-white/10"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-amber/80">Objetivo Espiritual</label>
              <select 
                value={calcData.objective}
                onChange={(e) => setCalcData({...calcData, objective: e.target.value})}
                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber outline-none appearance-none cursor-pointer"
              >
                <option value="">Selecione um foco...</option>
                <option value="intercessão">Intercessão (orar por outros)</option>
                <option value="arrependimento">Arrependimento e Humilhação</option>
                <option value="direção">Buscar Direção de Deus</option>
                <option value="gratidão">Gratidão e Adoração</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-amber/80">Duração Disponível: <span className="text-white">{calcData.duration}</span></label>
              <input 
                type="range" 
                min="0" 
                max="3" 
                step="1"
                className="w-full accent-amber h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                onChange={(e) => {
                  const val = ["6h", "12h", "24h", "3 dias"][parseInt(e.target.value)];
                  setCalcData({...calcData, duration: val});
                }}
              />
              <div className="flex justify-between text-[10px] text-pearl/40 uppercase font-black">
                <span>6h</span>
                <span>12h</span>
                <span>24h</span>
                <span>3 dias</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-amber/80">Condição Física</label>
              <div className="flex gap-2">
                {[
                  { id: "saudavel", label: "Saudável" },
                  { id: "restrições", label: "Tenho restrições" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setCalcData({...calcData, health: opt.id})}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl border text-sm transition-all",
                      calcData.health === opt.id 
                        ? "bg-amber text-[#0B0F1A] border-amber font-bold" 
                        : "bg-white/5 border-white/10 text-pearl/60 hover:bg-white/10"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={generateRecommendation}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-amber to-amber/80 text-[#0B0F1A] font-bold py-4 rounded-xl shadow-lg shadow-amber/20 hover:shadow-amber/40 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  Processando...
                  <Loader2 className="w-5 h-5 animate-spin" />
                </>
              ) : (
                <>
                  Gerar Plano Espiritual
                  <Flame className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-amber/10 border border-amber/30 rounded-2xl space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-amber p-2 rounded-lg text-[#0B0F1A]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-amber font-display text-lg">Recomendação</h4>
                    <p className="text-white font-sans font-bold">{recommendation.type}</p>
                  </div>
                </div>
                
                <div className="space-y-4 font-sans text-sm border-t border-amber/20 pt-4">
                  <div>
                    <span className="text-amber/60 text-[10px] uppercase font-black block mb-1">Por que este?</span>
                    <p className="text-pearl/80">{recommendation.justification}</p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-xs text-red-200/80">{error}</p>
                    </div>
                  )}

                  {fastingPlan && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6 pt-4 border-t border-amber/10"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber">
                          <Utensils className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-black tracking-widest">Dieta Sugerida</span>
                        </div>
                        <p className="text-pearl/70 text-xs bg-[#0B0F1A]/30 p-3 rounded-xl border border-white/5 italic">
                          {fastingPlan.diet}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-black tracking-widest">Exercícios Espirituais</span>
                        </div>
                        <p className="text-pearl/70 text-xs bg-[#0B0F1A]/30 p-3 rounded-xl border border-white/5">
                          {fastingPlan.spiritualExercises}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-2">
                        <span className="text-amber/60 text-[10px] uppercase font-black">Meditação Bíblica</span>
                        {fastingPlan.biblicalReferences.map((ref, i) => (
                          <div key={i} className="flex items-center gap-2 text-pearl/50 text-[11px]">
                            <div className="w-1 h-1 rounded-full bg-amber/40" />
                            {ref}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-[#0B0F1A]/50 p-3 rounded-xl border border-white/5">
                      <span className="text-amber/60 text-[10px] uppercase font-black block mb-1">Preparo</span>
                      <p className="text-xs text-pearl/70">{recommendation.prep}</p>
                    </div>
                    <div className="bg-[#0B0F1A]/50 p-3 rounded-xl border border-white/5">
                      <span className="text-amber/60 text-[10px] uppercase font-black block mb-1">Como Quebrar</span>
                      <p className="text-xs text-pearl/70">{recommendation.breakFast}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Section 4: Timeline */}
        <section className="space-y-12">
          <div className="text-center">
            <h2 className="text-2xl font-display text-white">Guia de Jornada</h2>
            <div className="w-12 h-px bg-amber mx-auto mt-4" />
          </div>

          <div className="relative space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-amber/0 before:via-amber/30 before:to-amber/0">
            {timelineSteps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-12"
              >
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[#0B0F1A] border-2 border-amber/50 flex items-center justify-center text-amber shadow-[0_0_15px_rgba(201,168,76,0.3)] z-10">
                  {step.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-display text-white">{step.title}</h3>
                  <p className="font-sans text-sm text-pearl/60 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Medical Warning */}
        <footer className="pt-12">
          <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-2xl flex gap-4 items-start">
            <div className="bg-red-500/20 p-2 rounded-lg text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h5 className="font-sans font-bold text-red-200 text-sm">Aviso de Saúde</h5>
              <p className="font-sans text-red-200/60 text-xs leading-relaxed">
                O jejum alimentar pode não ser adequado para todos. Gestantes, lactantes, idosos, crianças ou pessoas com condições médicas (como diabetes) devem consultar um médico antes de iniciar.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-[10px] uppercase tracking-widest text-pearl/20 font-sans font-bold">Perto de Deus • Jornada Espiritual</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
