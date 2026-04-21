import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, BookOpen, Users, Clock, CheckCircle, Heart, Phone, ArrowRight, Sun, Leaf } from "lucide-react";
import { cn } from "../lib/utils";

const checklistItems = [
  { id: 0, label: "Orar pedindo força agora", icon: Heart },
  { id: 1, label: "Ler o versículo de escape", icon: BookOpen },
  { id: 2, label: "Me afastar fisicamente da situação", icon: ArrowRight },
  { id: 3, label: "Mandar mensagem para um irmão/mentor", icon: Users },
];

export default function Temptation() {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false]);
  const [note, setNote] = useState("");
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const toggleCheck = (id: number) => {
    const newChecks = [...checks];
    newChecks[id] = !newChecks[id];
    setChecks(newChecks);
  };

  const progress = (checks.filter(Boolean).length / 4) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="space-y-10 max-w-3xl mx-auto relative">
      {/* Background Glows representing light vs shadow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-teal-900/40 to-transparent -z-10 blur-3xl pointer-events-none" />
      
      <header className="space-y-4 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber/10 text-amber font-bold text-xs uppercase tracking-widest border border-grape/50">
          <Shield className="w-4 h-4" /> Refúgio Seguro
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Enfrentando a Tentação</h1>
        <p className="text-pearl/60 font-serif text-lg leading-relaxed max-w-2xl">
          Sentir tentação não é pecado; é um campo de batalha. O próprio Jesus foi tentado. 
          Deus entende sua fraqueza e promete que você nunca lutará sozinho. Respire fundo, 
          a graça dEle é suficiente.
        </p>
      </header>

      {/* Main Verse Highlight */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 border border-grape/50 bg-gradient-to-br from-grape/80 to-navy/80 shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sun className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-4">
          <h3 className="text-amber font-bold uppercase tracking-widest text-xs">A Promessa de Escape</h3>
          <p className="font-serif italic text-2xl md:text-3xl leading-snug">
            "Não sobreveio a vocês tentação que não fosse comum aos homens. E Deus é fiel; ele não permitirá que vocês sejam tentados além do que podem suportar..."
          </p>
          <p className="text-pearl/50 font-bold">1 Coríntios 10:13</p>
        </div>
      </motion.div>

      {/* Emergency Button */}
      <div className="flex flex-col items-center">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowEmergency(!showEmergency)}
          className={cn(
            "px-8 py-4 rounded-full font-bold shadow-xl transition-all flex items-center gap-3 text-lg border",
            showEmergency 
              ? "bg-white/10 text-pearl/60 border-white/10" 
              : "bg-grape/20 text-pearl border-grape/50 hover:bg-grape/10"
          )}
        >
          <Phone className="w-5 h-5" />
          Preciso de ajuda agora
        </motion.button>

        <AnimatePresence>
          {showEmergency && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full mt-6 overflow-hidden"
            >
              <div className="bg-grape/10 border border-grape/50 rounded-2xl p-6 space-y-4 text-center">
                 <p className="text-amber font-bold">Deus está com você neste exato segundo.</p>
                 <p className="text-sm border-l-2 border-grape/50 pl-4 py-2 italic text-left max-w-lg mx-auto">
                   "Senhor, eu admito minha fraqueza. Eu não consigo vencer isso sozinho. Luta por mim agora. Tira esse desejo do meu coração e me enche com a Tua paz. Em nome de Jesus."
                 </p>
                 <div className="pt-4 flex justify-center gap-4">
                   <button className="text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors border border-white/5">
                     Ligar para um amigo
                   </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checklist & Progresso */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold">Plano de Ação</h3>
            <span className="text-amber font-bold text-sm">{checks.filter(Boolean).length}/4</span>
          </div>
          
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-grape"
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               transition={{ duration: 0.5 }}
             />
          </div>

          <div className="space-y-3 pt-2">
            {checklistItems.map((item) => {
              const isChecked = checks[item.id];
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border",
                    isChecked 
                      ? "bg-grape/10 border-grape/50 text-navy" 
                      : "bg-white/5 border-transparent text-pearl/60 hover:bg-white/10"
                  )}
                >
                  <div className={cn("transition-colors", isChecked ? "text-amber" : "text-pearl/20")}>
                    {isChecked ? <CheckCircle className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-current" />}
                  </div>
                  <div className="flex items-center gap-3">
                     <item.icon className={cn("w-4 h-4", isChecked ? "text-amber" : "opacity-50")} />
                     <span className={cn("font-medium", isChecked && "line-through opacity-70")}>{item.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timer & Reflexão */}
        <div className="space-y-6">
           <div className="bg-gradient-to-b from-navy/50 to-navy border border-grape/50 rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none text-amber">
                <Clock className="w-48 h-48" />
             </div>
             
             <h3 className="text-lg font-bold text-pearl relative z-10">A Regra dos 5 Minutos</h3>
             <p className="text-xs text-pearl/50 relative z-10">
               O pico da tentação química no cérebro dura poucos minutos. Aperte o botão e prometa não fazer nada até o tempo acabar.
             </p>
             
             <div className="text-6xl font-display font-light tracking-widest text-amber relative z-10 py-4">
               {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
             </div>
             
             <button 
               onClick={() => {
                 if (timeLeft === 0) setTimeLeft(300);
                 setIsTimerRunning(!isTimerRunning);
               }}
               className={cn(
                 "w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all relative z-10",
                 isTimerRunning 
                   ? "bg-white/5 text-pearl hover:bg-white/10" 
                   : "bg-grape text-navy hover:scale-105"
               )}
             >
               {isTimerRunning ? "Pausar" : timeLeft === 0 ? "Reiniciar" : "Iniciar Espera"}
             </button>
           </div>

           <div className="space-y-3">
              <label className="text-sm font-bold text-pearl/60 flex items-center gap-2">
                <Leaf className="w-4 h-4" /> Desabafe com Deus (privado)
              </label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: O que ativou essa vontade agora? Tristeza? Tédio? Estresse?"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-32 resize-none outline-none focus:border-grape/50 transition-colors text-sm"
              />
           </div>
        </div>
      </div>
    </div>
  );
}
