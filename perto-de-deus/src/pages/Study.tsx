import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, Play, ChevronRight, Book, Clock, Star } from "lucide-react";
import { useState } from "react";

const courses = [
  { 
    title: "Fundamentos da Fé", 
    level: "Iniciante", 
    modules: 6, 
    time: "4h",
    desc: "O básico para quem está começando sua caminhada com Jesus.",
    image: "https://picsum.photos/seed/faith/400/200"
  },
  { 
    title: "Cristologia: Quem é Jesus?", 
    level: "Intermediário", 
    modules: 8, 
    time: "6h",
    desc: "Um mergulho na natureza divina e humana de Cristo.",
    image: "https://picsum.photos/seed/christ/400/200"
  },
  { 
    title: "Oração Eficaz", 
    level: "Prático", 
    modules: 4, 
    time: "2h",
    desc: "Como desenvolver uma vida de oração poderosa e constante.",
    image: "https://picsum.photos/seed/pray/400/200"
  }
];

export default function Study() {
  const [notification, setNotification] = useState<string | null>(null);

  const showWipAlert = (course: string) => {
    setNotification(`O curso "${course}" estará disponível em breve!`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-10 relative">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 z-[100] bg-amber text-navy px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 border border-white/20 whitespace-nowrap"
          >
            <Star className="w-5 h-5 fill-navy" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="space-y-2">
        <p className="text-amber font-medium tracking-widest uppercase text-xs">Crescimento</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Estudo Teológico</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            onClick={() => showWipAlert(course.title)}
            className="glow-card p-0 overflow-hidden flex flex-col group cursor-pointer"
          >
            <div className="h-40 overflow-hidden relative">
               <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
               <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
               <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-amber text-navy text-[10px] font-bold uppercase tracking-wider">{course.level}</span>
               </div>
            </div>
            
            <div className="p-6 space-y-4 flex-1 flex flex-col">
               <h3 className="text-xl font-display font-bold group-hover:text-amber transition-colors">{course.title}</h3>
               <p className="text-pearl/60 text-sm line-clamp-2">{course.desc}</p>
               
               <div className="flex items-center gap-4 text-[10px] text-pearl/40 font-bold uppercase tracking-widest pt-4 mt-auto">
                  <div className="flex items-center gap-1"><Book className="w-3 h-3" /> {course.modules} Módulos</div>
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.time}</div>
               </div>
            </div>

            <div className="p-4 border-t border-amber/10 flex items-center justify-center text-amber font-bold text-sm bg-amber/5">
                Iniciar Módulo <ChevronRight className="w-4 h-4 ml-2" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Featured Sermon */}
      <section className="glow-card border-none bg-gradient-to-br from-grape/40 to-navy p-10 flex flex-col md:flex-row gap-10 items-center">
         <div 
          onClick={() => showWipAlert("A Radicalidade da Graça")}
          className="w-full md:w-1/3 aspect-video bg-black/40 rounded-2xl flex items-center justify-center group cursor-pointer relative overflow-hidden"
         >
            <Play className="text-amber w-16 h-16 group-hover:scale-125 transition-transform" fill="currentColor" />
            <img src="https://picsum.photos/seed/sermon/600/400" className="absolute inset-0 w-full h-full object-cover opacity-40 -z-10" referrerPolicy="no-referrer" />
         </div>
         <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-amber font-bold text-xs uppercase tracking-widest">
               <Star className="w-4 h-4" /> Recomendação Semanal
            </div>
            <h2 className="text-3xl font-display font-bold">A Radicalidade da Graça</h2>
            <p className="text-pearl/60 font-serif text-lg italic leading-relaxed">
               Um estudo profundo sobre como a graça de Deus não apenas nos salva, mas nos transforma por completo. Por Pastor Charles Spurgeon (Sermão Clássico).
            </p>
            <button 
              onClick={() => showWipAlert("A Radicalidade da Graça")}
              className="bg-amber text-navy font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
            >
              Ver Estudo Completo
            </button>
         </div>
      </section>
    </div>
  );
}
