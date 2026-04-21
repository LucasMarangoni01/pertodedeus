import { motion } from "motion/react";
import { Calculator as CalcIcon, Calendar, Target, Book, LayoutList, Type, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "../lib/utils";
import { bibleBooks } from "../constants/bibleData";

const TARGETS = {
  // Dados aproximados baseados na Bíblia Protestante (66 livros)
  "COMPLETA": { label: "Bíblia Completa", books: 66, chapters: 1189, verses: 31102, hours: 75 },
  "ANTIGO": { label: "Antigo Testamento", books: 39, chapters: 929, verses: 23145, hours: 57 },
  "NOVO": { label: "Novo Testamento", books: 27, chapters: 260, verses: 7957, hours: 18 }
};

type TargetType = keyof typeof TARGETS;
type UnitType = "LIVROS" | "CAPITULOS" | "VERSICULOS" | "HORAS";

export default function Calculator() {
  const [activeMode, setActiveMode] = useState<"PLANNER" | "ESTIMATOR">("PLANNER");
  
  // Planner States
  const [selectedTarget, setSelectedTarget] = useState<TargetType>("COMPLETA");
  const [selectedUnit, setSelectedUnit] = useState<UnitType>("CAPITULOS");
  const [amountPerDay, setAmountPerDay] = useState<number | "">("");

  // Estimator States
  const [estBook, setEstBook] = useState<string>("Gênesis");
  const [estChapters, setEstChapters] = useState<number | "">(1);
  const [estVerses, setEstVerses] = useState<number | "">(0);

  const getTargetData = () => TARGETS[selectedTarget];

  const calculateResult = () => {
    if (!amountPerDay || Number(amountPerDay) <= 0) return null;
    
    const target = getTargetData();
    let totalItems = 0;

    if (selectedUnit === "LIVROS") totalItems = target.books;
    else if (selectedUnit === "CAPITULOS") totalItems = target.chapters;
    else if (selectedUnit === "VERSICULOS") totalItems = target.verses;
    else if (selectedUnit === "HORAS") totalItems = target.hours;

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

  const calculateEstimation = () => {
    // Estimativa baseada em 75 horas para a Bíblia toda (1189 capítulos, 31102 versículos)
    // ~3.8 minutos por capítulo
    // ~9 segundos por versículo
    
    const chapters = Number(estChapters) || 0;
    const verses = Number(estVerses) || 0;
    
    const totalMinutes = (chapters * 3.8) + (verses * 0.15); // 0.15 min = 9 seg
    
    if (totalMinutes <= 0) return null;

    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);

    let timeStr = "";
    if (h > 0) timeStr += `${h}h `;
    if (m > 0 || h === 0) timeStr += `${m}min`;

    return {
      timeStr,
      totalMinutes,
      chapters,
      verses
    };
  };

  const result = calculateResult();
  const estimation = calculateEstimation();

  const selectedBookData = useMemo(() => {
    return bibleBooks.find(b => b.name === estBook);
  }, [estBook]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-amber font-medium tracking-widest uppercase text-xs">Planejamento</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Calculadora Bíblica</h1>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-amber/10 self-start">
          <button 
            onClick={() => setActiveMode("PLANNER")}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", 
              activeMode === "PLANNER" ? "bg-amber text-navy shadow-lg" : "text-pearl/60 hover:text-pearl"
            )}
          >
            <Calendar className="w-4 h-4" /> Plano de Leitura
          </button>
          <button 
            onClick={() => setActiveMode("ESTIMATOR")}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", 
              activeMode === "ESTIMATOR" ? "bg-amber text-navy shadow-lg" : "text-pearl/60 hover:text-pearl"
            )}
          >
            <Clock className="w-4 h-4" /> Tempo de Leitura
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
           {activeMode === "PLANNER" ? (
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
                   <div className="flex flex-wrap gap-3">
                      <button
                         onClick={() => setSelectedUnit("LIVROS")}
                         className={cn(
                           "flex-1 min-w-[80px] flex flex-col items-center gap-2 py-4 rounded-xl border transition-all",
                           selectedUnit === "LIVROS" ? "bg-amber/10 border-amber text-amber" : "bg-white/5 border-amber/10 text-pearl/60 hover:bg-white/10"
                         )}
                      >
                         <Book className="w-5 h-5" />
                         <span className="text-xs font-bold">Livros</span>
                      </button>
                      <button
                         onClick={() => setSelectedUnit("CAPITULOS")}
                         className={cn(
                           "flex-1 min-w-[80px] flex flex-col items-center gap-2 py-4 rounded-xl border transition-all",
                           selectedUnit === "CAPITULOS" ? "bg-amber/10 border-amber text-amber" : "bg-white/5 border-amber/10 text-pearl/60 hover:bg-white/10"
                         )}
                      >
                         <LayoutList className="w-5 h-5" />
                         <span className="text-xs font-bold">Capítulos</span>
                      </button>
                      <button
                         onClick={() => setSelectedUnit("VERSICULOS")}
                         className={cn(
                           "flex-1 min-w-[80px] flex flex-col items-center gap-2 py-4 rounded-xl border transition-all",
                           selectedUnit === "VERSICULOS" ? "bg-amber/10 border-amber text-amber" : "bg-white/5 border-amber/10 text-pearl/60 hover:bg-white/10"
                         )}
                      >
                         <Type className="w-5 h-5" />
                         <span className="text-xs font-bold">Versículos</span>
                      </button>
                      <button
                         onClick={() => setSelectedUnit("HORAS")}
                         className={cn(
                           "flex-1 min-w-[80px] flex flex-col items-center gap-2 py-4 rounded-xl border transition-all",
                           selectedUnit === "HORAS" ? "bg-amber/10 border-amber text-amber" : "bg-white/5 border-amber/10 text-pearl/60 hover:bg-white/10"
                         )}
                      >
                         <Clock className="w-5 h-5" />
                         <span className="text-xs font-bold">Horas</span>
                      </button>
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-amber/10">
                   <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest">
                     Quantidade por dia {selectedUnit === "HORAS" && "(ex: 0.5 para meia hora)"}
                   </label>
                   <div className="flex items-center">
                      <input 
                        type="number" 
                        min="0.1"
                        step={selectedUnit === "HORAS" ? "0.1" : "1"}
                        placeholder={selectedUnit === "HORAS" ? "Ex: 2 (duas horas)" : "Ex: 3"}
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
           ) : (
             <div className="glow-card p-6 md:p-8 space-y-6 form-card">
                <div className="space-y-4">
                   <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest">Selecione o Livro</label>
                   <select 
                     value={estBook}
                     onChange={(e) => {
                       setEstBook(e.target.value);
                       setEstChapters(1);
                       setEstVerses(0);
                     }}
                     className="w-full bg-white/5 border border-amber/10 rounded-xl px-4 py-3 outline-none focus:border-amber transition-colors text-pearl appearance-none cursor-pointer"
                   >
                     {bibleBooks.map(b => (
                       <option key={b.name} value={b.name} className="bg-navy text-pearl">{b.name}</option>
                     ))}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                     <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest">Qtd. de Capítulos</label>
                     <input 
                       type="number" 
                       min="0"
                       max={selectedBookData?.chapters || 150}
                       value={estChapters}
                       onChange={(e) => setEstChapters(e.target.value === "" ? "" : Number(e.target.value))}
                       placeholder="Ex: 5"
                       className="w-full bg-navy/50 border border-amber/20 rounded-xl px-4 py-3 text-xl font-display text-amber focus:border-amber focus:outline-none transition-colors"
                     />
                     <p className="text-[10px] text-pearl/30 italic">O livro de {estBook} tem {selectedBookData?.chapters} capítulos.</p>
                  </div>
                  <div className="space-y-4">
                     <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest">Versículos Adic.</label>
                     <input 
                       type="number" 
                       min="0"
                       value={estVerses}
                       onChange={(e) => setEstVerses(e.target.value === "" ? "" : Number(e.target.value))}
                       placeholder="Ex: 10"
                       className="w-full bg-navy/50 border border-amber/20 rounded-xl px-4 py-3 text-xl font-display text-amber focus:border-amber focus:outline-none transition-colors"
                     />
                     <p className="text-[10px] text-pearl/30 italic">Caso queira calcular versículos específicos.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-amber/10">
                   <button 
                     onClick={() => {
                        setEstChapters(selectedBookData?.chapters || 0);
                        setEstVerses(0);
                     }}
                     className="text-[10px] font-bold text-amber hover:underline uppercase tracking-widest"
                   >
                     Calcular Livro Inteiro
                   </button>
                </div>
             </div>
           )}
        </div>

        <div className="space-y-8">
           <div className="glow-card p-8 bg-gradient-to-br from-amber/5 to-amber/10 border-amber/20 flex flex-col items-center justify-center min-h-[350px] text-center">
              {activeMode === "PLANNER" ? (
                <>
                  <CalcIcon className="w-12 h-12 text-amber/40 mb-6" />
                  {!result ? (
                    <p className="text-pearl/60 font-serif text-lg italic">
                      Preencha os dados ao lado para descobrir quando você terminará a sua leitura.
                    </p>
                  ) : (
                    <div className="space-y-6 animate-in zoom-in duration-300">
                       <div>
                         <p className="text-[10px] uppercase font-bold text-pearl/40 tracking-widest mb-2">Tempo Estimado para Concluir</p>
                         <h2 className="text-4xl md:text-5xl font-display font-bold text-amber">{result.formattedTime}</h2>
                         <p className="text-pearl/60 mt-2">({result.daysTotal} dias contínuos de leitura)</p>
                       </div>
                       
                       <div className="pt-6 border-t border-amber/10">
                         <p className="text-[10px] uppercase font-bold text-pearl/40 tracking-widest mb-2">Se você começar hoje, terminará em</p>
                         <p className="text-2xl font-serif text-pearl font-bold flex items-center justify-center gap-2">
                            <Calendar className="w-5 h-5 text-amber" /> {result.endDate}
                         </p>
                       </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Clock className="w-12 h-12 text-amber/40 mb-6" />
                  {!estimation ? (
                    <p className="text-pearl/60 font-serif text-lg italic">
                      Selecione a quantidade de capítulos ou versículos para estimar o tempo de leitura.
                    </p>
                  ) : (
                    <div className="space-y-6 animate-in zoom-in duration-300">
                       <div>
                         <p className="text-[10px] uppercase font-bold text-pearl/40 tracking-widest mb-2">Você levará aproximadamente</p>
                         <h2 className="text-4xl md:text-5xl font-display font-bold text-amber">{estimation.timeStr}</h2>
                         <p className="text-pearl/60 mt-4 max-w-[200px] mx-auto text-sm leading-relaxed">
                            Cálculo baseado em uma velocidade média de leitura reflexiva.
                         </p>
                       </div>

                       <div className="pt-6 border-t border-amber/10 grid grid-cols-2 gap-4">
                          <div className="text-left">
                             <p className="text-[9px] uppercase font-bold text-pearl/30">Total Capítulos</p>
                             <p className="text-lg font-bold text-pearl">{estimation.chapters}</p>
                          </div>
                          <div className="text-left border-l border-white/5 pl-4">
                             <p className="text-[9px] uppercase font-bold text-pearl/30">Total Versículos</p>
                             <p className="text-lg font-bold text-pearl">~{estimation.verses || estimation.chapters * 26}</p>
                          </div>
                       </div>
                    </div>
                  )}
                </>
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
                 <li className="flex justify-between border-b border-white/5 pb-2">
                    <span>Versículos no total:</span> 
                    <strong className="text-pearl">~{getTargetData().verses} vers.</strong>
                 </li>
                 <li className="flex justify-between">
                    <span>Lido em voz alta (média):</span> 
                    <strong className="text-pearl">~{getTargetData().hours} horas</strong>
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
