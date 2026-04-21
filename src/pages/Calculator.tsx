import { motion } from "motion/react";
import { Calculator as CalcIcon, Calendar, Target, Book, LayoutList, Type } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

const TARGETS = {
  // Dados aproximados baseados na Bíblia Protestante (66 livros)
  "COMPLETA": { label: "Bíblia Completa", books: 66, chapters: 1189, verses: 31102 },
  "ANTIGO": { label: "Antigo Testamento", books: 39, chapters: 929, verses: 23145 },
  "NOVO": { label: "Novo Testamento", books: 27, chapters: 260, verses: 7957 }
};

type TargetType = keyof typeof TARGETS;
type UnitType = "LIVROS" | "CAPITULOS" | "VERSICULOS";

export default function Calculator() {
  const [selectedTarget, setSelectedTarget] = useState<TargetType>("COMPLETA");
  const [selectedUnit, setSelectedUnit] = useState<UnitType>("CAPITULOS");
  const [amountPerDay, setAmountPerDay] = useState<number | "">("");

  const getTargetData = () => TARGETS[selectedTarget];

  const calculateResult = () => {
    if (!amountPerDay || Number(amountPerDay) <= 0) return null;
    
    const target = getTargetData();
    let totalItems = 0;

    if (selectedUnit === "LIVROS") totalItems = target.books;
    else if (selectedUnit === "CAPITULOS") totalItems = target.chapters;
    else if (selectedUnit === "VERSICULOS") totalItems = target.verses;

    const daysTotal = Math.ceil(totalItems / Number(amountPerDay));
    
    // Formatting the output
    const years = Math.floor(daysTotal / 365);
    const months = Math.floor((daysTotal % 365) / 30);
    const days = (daysTotal % 365) % 30;

    let resultString = "";
    if (years > 0) resultString += `${years} ano${years > 1 ? 's' : ''} `;
    if (months > 0) resultString += `${months} mês${months > 1 ? 'es' : ''} `;
    if (days > 0 || (years === 0 && months === 0)) resultString += `${days} dia${days > 1 || days === 0 ? 's' : ''}`;

    // Calculando a data prevista de término
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysTotal);
    
    return {
      daysTotal,
      formattedTime: resultString.trim(),
      endDate: endDate.toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })
    };
  };

  const result = calculateResult();

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="space-y-2">
        <p className="text-amber font-medium tracking-widest uppercase text-xs">Planejamento</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Calculadora de Leitura</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
           <div className="glow-card p-6 md:p-8 space-y-6 form-card">
              <div className="space-y-4">
                 <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest">Seu Objetivo de Leitura</label>
                 <div className="flex flex-col sm:flex-row gap-3">
                   {(Object.keys(TARGETS) as TargetType[]).map((t) => (
                     <button
                       key={t}
                       onClick={() => setSelectedTarget(t)}
                       className={cn(
                         "flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border",
                         selectedTarget === t 
                           ? "bg-amber text-navy border-amber shadow-[0_0_20px_rgba(201,168,76,0.3)]" 
                           : "bg-white/5 border-amber/10 text-pearl/60 hover:border-amber/40"
                       )}
                     >
                       {TARGETS[t].label}
                     </button>
                   ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest">O que você vai ler por dia?</label>
                 <div className="flex gap-3">
                    <button
                       onClick={() => setSelectedUnit("LIVROS")}
                       className={cn(
                         "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all",
                         selectedUnit === "LIVROS" ? "bg-amber/10 border-amber text-amber" : "bg-white/5 border-amber/10 text-pearl/60 hover:bg-white/10"
                       )}
                    >
                       <Book className="w-5 h-5" />
                       <span className="text-xs font-bold">Livros</span>
                    </button>
                    <button
                       onClick={() => setSelectedUnit("CAPITULOS")}
                       className={cn(
                         "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all",
                         selectedUnit === "CAPITULOS" ? "bg-amber/10 border-amber text-amber" : "bg-white/5 border-amber/10 text-pearl/60 hover:bg-white/10"
                       )}
                    >
                       <LayoutList className="w-5 h-5" />
                       <span className="text-xs font-bold">Capítulos</span>
                    </button>
                    <button
                       onClick={() => setSelectedUnit("VERSICULOS")}
                       className={cn(
                         "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all",
                         selectedUnit === "VERSICULOS" ? "bg-amber/10 border-amber text-amber" : "bg-white/5 border-amber/10 text-pearl/60 hover:bg-white/10"
                       )}
                    >
                       <Type className="w-5 h-5" />
                       <span className="text-xs font-bold">Versículos</span>
                    </button>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-amber/10">
                 <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest">
                   Quantidade por dia
                 </label>
                 <div className="flex items-center">
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Ex: 3"
                      value={amountPerDay}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmountPerDay(val === "" ? "" : Number(val));
                      }}
                      className="w-full bg-navy/50 border border-amber/20 rounded-xl px-6 py-4 text-2xl font-display text-amber focus:border-amber focus:outline-none transition-colors"
                    />
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="glow-card p-8 bg-gradient-to-br from-amber/5 to-amber/10 border-amber/20 flex flex-col items-center justify-center min-h-[300px] text-center">
              <CalcIcon className="w-12 h-12 text-amber/40 mb-6" />
              
              {!result ? (
                <p className="text-pearl/60 font-serif text-lg italic">
                  Preencha os dados ao lado para descobrir quando você terminará a sua leitura.
                </p>
              ) : (
                <div className="space-y-6 animate-in zoom-in duration-300">
                   <div>
                     <p className="text-[10px] uppercase font-bold text-pearl/40 tracking-widest mb-2">Tempo Estimado</p>
                     <h2 className="text-4xl md:text-5xl font-display font-bold text-amber">{result.formattedTime}</h2>
                     <p className="text-pearl/60 mt-2">({result.daysTotal} dias contínuos)</p>
                   </div>
                   
                   <div className="pt-6 border-t border-amber/10">
                     <p className="text-[10px] uppercase font-bold text-pearl/40 tracking-widest mb-2">Se você começar hoje, terminará em</p>
                     <p className="text-2xl font-serif text-pearl font-bold flex items-center justify-center gap-2">
                        <Calendar className="w-5 h-5 text-amber" /> {result.endDate}
                     </p>
                   </div>
                </div>
              )}
           </div>

           <div className="glow-card border-none bg-navy p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber font-bold text-xs uppercase tracking-widest">
                 <Target className="w-4 h-4" /> Informações do Alvo
              </div>
              <ul className="space-y-3 text-sm text-pearl/60">
                 <li className="flex justify-between border-b border-white/5 pb-2">
                    <span>Livros no total:</span> 
                    <strong className="text-pearl">{getTargetData().books} livros</strong>
                 </li>
                 <li className="flex justify-between border-b border-white/5 pb-2">
                    <span>Capítulos no total:</span> 
                    <strong className="text-pearl">{getTargetData().chapters} caps.</strong>
                 </li>
                 <li className="flex justify-between">
                    <span>Versículos no total:</span> 
                    <strong className="text-pearl">~{getTargetData().verses} vers.</strong>
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
