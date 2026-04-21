import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, Play, ChevronRight, Book, Clock, Star, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

const courses = [
  { 
    id: "fundamentos",
    title: "Fundamentos da Fé", 
    level: "Iniciante", 
    modules: 3, 
    time: "4h",
    desc: "O básico para quem está começando sua caminhada com Jesus.",
    image: "https://picsum.photos/seed/faith/400/200",
    lessons: [
      {
        title: "Graça e Salvação",
        content: "A Salvação não é alcançada pelo esforço humano, mas é um dom gratuito de Deus (Efésios 2:8-9). O sacrifício de Jesus na cruz nos reconciliou com o Pai. Não podemos comprá-la, mas a recebemos através da fé genuína em Cristo. Entender a graça é o primeiro e mais importante passo da vida cristã, libertando-nos do peso da autojustificação."
      },
      {
        title: "A Importância da Oração",
        content: "Orar é, simplesmente, conversar com Deus. Não requer palavras difíceis ou rituais elaborados. Como Jesus ensinou na oração do Pai Nosso, deve ser um relacionamento diário. Comece sempre agradecendo, confesse suas vulnerabilidades e entregue suas preocupações a Ele (Filipenses 4:6)."
      },
      {
        title: "A Palavra de Deus",
        content: "A Bíblia não é apenas um livro histórico; é a palavra viva de Deus. Ela nutre o espírito da mesma forma que a comida nutre o corpo. Iniciar a leitura pelo Evangelho de João é uma excelente maneira de conhecer a essência de Jesus. O hábito diário da leitura ilumina nossos passos (Salmo 119:105)."
      }
    ]
  },
  { 
    id: "cristologia",
    title: "Cristologia: Quem é Jesus?", 
    level: "Intermediário", 
    modules: 2, 
    time: "6h",
    desc: "Um mergulho na natureza divina e humana de Cristo.",
    image: "https://picsum.photos/seed/christ/400/200",
    lessons: [
      {
        title: "O Verbo que se fez Carne",
        content: "João 1:14 declara que 'O Verbo se fez carne e habitou entre nós'. Esta é a doutrina da Encarnação. Jesus era 100% Deus e 100% homem. A união hipostática significa que essas duas naturezas coexistiam sem se misturar. Ele teve fome e cansaço (humano), mas perdoou pecados e acalmou tempestades (Divino)."
      },
      {
        title: "O Cordeiro e o Leão",
        content: "Jesus é retratado de forma fascinante no Apocalipse: como um cordeiro que foi morto (sacrifício e mansidão) e como o Leão da tribo de Judá (autoridade e poder). Na sua primeira vinda, Ele veio como Cordeiro para nos redimir. Na sua segunda vinda, reinará como Leão."
      }
    ]
  },
  { 
    id: "oracao",
    title: "Oração Eficaz", 
    level: "Prático", 
    modules: 2, 
    time: "2h",
    desc: "Como desenvolver uma vida de oração poderosa e constante.",
    image: "https://picsum.photos/seed/pray/400/200",
    lessons: [
      {
        title: "Entrando no Quarto",
        content: "Em Mateus 6:6, Jesus instrui a 'entrar no seu quarto e fechar a porta'. Isso diz respeito à intimidade. A oração eficaz nasce no lugar secreto, livre de distrações e do desejo de impressionar outras pessoas. Crie um ambiente livre de interrupções digitais para buscar ao Senhor."
      },
      {
        title: "Orando as Escrituras",
        content: "Uma das formas mais poderosas de orar é concordar com o que Deus já disse. Quando você transformar versículos em oração (ex: 'Senhor, tu és o meu Pastor e nada me faltará'), você ora a própria vontade de Deus. Isso fortalece a fé e direciona a mente para verdades eternas."
      }
    ]
  }
];

export default function Study() {
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [activeLesson, setActiveLesson] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<Record<string, number[]>>({});

  const markCompleted = () => {
    if (!selectedCourse) return;
    const currentCompleted = completedLessons[selectedCourse.id] || [];
    if (!currentCompleted.includes(activeLesson)) {
      setCompletedLessons({
        ...completedLessons,
        [selectedCourse.id]: [...currentCompleted, activeLesson]
      });
    }
  };

  const getProgress = (courseId: string, totalModules: number) => {
    const completedCount = (completedLessons[courseId] || []).length;
    return Math.round((completedCount / totalModules) * 100);
  };

  if (selectedCourse) {
    const lesson = selectedCourse.lessons[activeLesson];
    const isCompleted = (completedLessons[selectedCourse.id] || []).includes(activeLesson);

    return (
      <div className="space-y-8 animate-in fade-in zoom-in duration-300">
        <button 
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-2 text-amber/60 hover:text-amber font-bold uppercase tracking-widest text-xs transition-colors"
        >
           <ArrowLeft className="w-4 h-4" /> Voltar para Cursos
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Sidebar: Trilha de aulas */}
           <div className="lg:col-span-1 space-y-4">
              <div className="bg-navy border border-amber/10 rounded-2xl p-6">
                <h3 className="font-display font-bold text-lg text-pearl mb-4">{selectedCourse.title}</h3>
                <div className="w-full bg-black/40 h-2 rounded-full mb-6 overflow-hidden">
                   <div 
                     className="bg-amber h-full transition-all duration-500" 
                     style={{ width: `${getProgress(selectedCourse.id, selectedCourse.lessons.length)}%` }} 
                   />
                </div>

                <ul className="space-y-3">
                   {selectedCourse.lessons.map((l: any, idx: number) => {
                     const done = (completedLessons[selectedCourse.id] || []).includes(idx);
                     return (
                       <li 
                         key={idx}
                         onClick={() => setActiveLesson(idx)}
                         className={cn(
                           "flex items-center gap-3 p-3 rounded-xl cursor-pointer text-sm transition-all",
                           activeLesson === idx ? "bg-amber/10 border border-amber/30 text-amber font-bold" : "text-pearl/60 hover:bg-white/5",
                           done && activeLesson !== idx && "text-emerald-400"
                         )}
                       >
                         {done ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                         <span className="line-clamp-1 flex-1">Aula {idx + 1}</span>
                       </li>
                     );
                   })}
                </ul>
              </div>
           </div>

           {/* Área Principal de Estudo */}
           <div className="lg:col-span-3">
              <motion.div 
                key={activeLesson}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-navy border border-amber/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-8 opacity-5 font-display text-[10rem] font-bold leading-none pointer-events-none">
                    {activeLesson + 1}
                 </div>
                 
                 <p className="text-amber text-xs font-bold uppercase tracking-widest mb-4">
                   Módulo {activeLesson + 1}
                 </p>
                 <h1 className="text-3xl md:text-5xl font-display font-bold mb-10 text-pearl/90 leading-tight">
                   {lesson.title}
                 </h1>

                 <div className="font-serif text-xl md:text-2xl text-pearl/70 leading-relaxed mb-12">
                   {lesson.content}
                 </div>

                 <div className="pt-8 border-t border-amber/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <button
                      onClick={markCompleted}
                      disabled={isCompleted}
                      className={cn(
                        "flex justify-center items-center gap-2 px-8 py-4 rounded-xl font-bold w-full sm:w-auto transition-all",
                        isCompleted 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                          : "bg-amber text-navy hover:scale-105 shadow-xl"
                      )}
                    >
                      {isCompleted ? <><CheckCircle2 className="w-5 h-5" /> Concluído</> : "Marcar como Concluído"}
                    </button>

                    {activeLesson < selectedCourse.lessons.length - 1 && (
                      <button 
                         onClick={() => setActiveLesson(prev => prev + 1)}
                         className="flex items-center gap-2 text-pearl/60 hover:text-amber font-bold transition-all"
                      >
                         Próxima Aula <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                 </div>
              </motion.div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 relative">
      <header className="space-y-2">
        <p className="text-amber font-medium tracking-widest uppercase text-xs">Crescimento</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Estudo Teológico</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course, i) => {
          const progress = getProgress(course.id, course.lessons.length);
          return (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            onClick={() => { setSelectedCourse(course); setActiveLesson(0); }}
            className="glow-card p-0 overflow-hidden flex flex-col group cursor-pointer"
          >
            <div className="h-40 overflow-hidden relative">
               <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
               <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
               <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber text-navy text-[10px] font-bold uppercase tracking-wider">{course.level}</span>
                  {progress > 0 && <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">{progress}% Concluído</span>}
               </div>
            </div>
            
            <div className="p-6 space-y-4 flex-1 flex flex-col">
               <h3 className="text-xl font-display font-bold group-hover:text-amber transition-colors">{course.title}</h3>
               <p className="text-pearl/60 text-sm line-clamp-2">{course.desc}</p>
               
               <div className="flex items-center gap-4 text-[10px] text-pearl/40 font-bold uppercase tracking-widest pt-4 mt-auto">
                  <div className="flex items-center gap-1"><Book className="w-3 h-3" /> {course.lessons.length} Módulos</div>
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.time}</div>
               </div>
            </div>

            <div className="p-4 border-t border-amber/10 flex items-center justify-center text-amber font-bold text-sm bg-amber/5 group-hover:bg-amber/10 transition-colors">
                {progress > 0 ? "Continuar Estudo" : "Iniciar Curso"} <ChevronRight className="w-4 h-4 ml-2" />
            </div>
          </motion.div>
        )})}
      </div>

      <section className="glow-card border-none bg-gradient-to-br from-indigo-900/40 to-navy p-10 flex flex-col md:grid md:grid-cols-2 gap-10 items-center overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-amber/10 blur-[100px] rounded-full pointer-events-none" />
         <div className="space-y-4 relative z-10 w-full">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-widest mb-4">
               <Star className="w-4 h-4" /> Recomendado
            </div>
            <h2 className="text-3xl font-display font-bold text-white">Bíblia e Contexto Histórico</h2>
            <p className="text-white/60 font-serif text-lg leading-relaxed mb-6">
               Entenda as raízes culturais do Oriente Médio, as leis judaicas de pureza e o império romano para ler a Bíblia com profundidade.
            </p>
         </div>
         <div className="w-full relative z-10">
            <div className="aspect-video rounded-2xl bg-black/50 border border-white/10 flex flex-col items-center justify-center p-6 text-center">
                <GraduationCap className="w-16 h-16 text-indigo-400 mb-4 opacity-50" />
                <p className="text-white/60 text-sm uppercase tracking-widest font-bold">Conteúdo Restrito</p>
                <p className="text-white/40 text-xs mt-2">Módulo em desenvolvimento pelos teólogos</p>
            </div>
         </div>
      </section>
    </div>
  );
}
