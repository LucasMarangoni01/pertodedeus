import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, ChevronRight, CheckCircle2, History, RefreshCw, Heart, Sparkles, BookOpen } from "lucide-react";
import { cn } from "../lib/utils";

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    points: { [key: string]: number };
  }[];
}

const quizQuestions: Question[] = [
  {
    id: 1,
    text: "Como você prefere que seja o ambiente de um culto ou missa?",
    options: [
      { text: "Solene, com rituais, velas e um senso de mistério sagrado.", points: { catolico: 10, anglicano: 5 } },
      { text: "Tradicional, focado na exposição bíblica e hinos clássicos.", points: { presbiteriano: 10, batista: 5 } },
      { text: "Dinâmico, com música contemporânea, palmas e muita expressividade.", points: { pentecostal: 10, evangelico: 5 } },
      { text: "Simples, sem muitos adornos, focado no relacionamento comunitário.", points: { batista: 10, evangelico: 5 } }
    ]
  },
  {
    id: 2,
    text: "Qual é a sua visão sobre a liderança da igreja?",
    options: [
      { text: "Deve haver uma autoridade central única (como um Papa).", points: { catolico: 12 } },
      { text: "Deve ser liderada por presbíteros ou conselhos locais eleitos.", points: { presbiteriano: 10, congregacional: 10 } },
      { text: "Cada igreja deve ser totalmente independente e democrática.", points: { batista: 10 } },
      { text: "Focada em líderes ungidos e carismáticos com dons espirituais.", points: { pentecostal: 10 } }
    ]
  },
  {
    id: 3,
    text: "Sobre o Batismo, o que faz mais sentido para você?",
    options: [
      { text: "Batismo de crianças (pedobatismo) como sinal da aliança.", points: { catolico: 10, presbiteriano: 8, anglicano: 8 } },
      { text: "Somente para adultos que professam sua fé (por imersão).", points: { batista: 12, pentecostal: 10 } },
      { text: "Um passo importante, mas não essencial para a salvação inicial.", points: { evangelico: 10, pentecostal: 5 } }
    ]
  },
  {
    id: 4,
    text: "Qual é o papel da Bíblia na sua fé?",
    options: [
      { text: "A Bíblia e a Tradição da Igreja têm autoridade igual.", points: { catolico: 12, ortodoxo: 10 } },
      { text: "Sola Scriptura: Somente a Bíblia é a autoridade suprema e final.", points: { presbiteriano: 10, batista: 10, pentecostal: 10 } },
      { text: "A Bíblia é o guia, mas a experiência direta com o Espírito Santo é vital.", points: { pentecostal: 12, evangelico: 5 } }
    ]
  },
  {
    id: 5,
    text: "Como você vê Maria e os Santos?",
    options: [
      { text: "Devem ser honrados e podem interceder por nós.", points: { catolico: 12, ortodoxo: 10 } },
      { text: "Exemplos de fé, mas a oração deve ser dirigida somente a Jesus.", points: { presbiteriano: 10, batista: 10, pentecostal: 10 } }
    ]
  }
];

const resultsInfo: { [key: string]: { title: string, desc: string } } = {
  catolico: {
    title: "Igreja Católica",
    desc: "Você valoriza a tradição apostólica, a importância dos sacramentos e a unidade sob uma liderança histórica. O senso de mistério, a liturgia solene e a veneração aos santos como exemplos de fé ressoam com você."
  },
  presbiteriano: {
    title: "Presbiteriano / Reformado",
    desc: "Suas convicções se alinham com a soberania de Deus, a autoridade das Escrituras e um sistema de governo por presbíteros. Você prefere uma fé intelectualmente robusta e cultos organizados."
  },
  batista: {
    title: "Batista",
    desc: "Você preza pela liberdade individual, o batismo por imersão após a profissão de fé e a autonomia da igreja local. Sua fé é centrada na Bíblia e no compromisso pessoal com Cristo."
  },
  pentecostal: {
    title: "Pentecostal / Carismático",
    desc: "Você busca uma experiência vibrante com o Espírito Santo, acreditando na atualidade dos dons espirituais e na adoração expressiva. Para você, a fé é uma jornada de poder e encontro pessoal com Deus."
  },
  evangelico: {
    title: "Evangélico Contemporâneo",
    desc: "Você se encaixa bem em comunidades cristãs focadas na relevância prática da Bíblia, música contemporânea e um ambiente acolhedor, focando menos em tradições denominacionais rígidas."
  }
};

export default function ReligionQuiz() {
  const [currentStep, setCurrentStep] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<{ [key: string]: number }>({
    catolico: 0,
    presbiteriano: 0,
    batista: 0,
    pentecostal: 0,
    evangelico: 0
  });

  const handleAnswer = (points: { [key: string]: number }) => {
    const newScores = { ...scores };
    Object.keys(points).forEach(key => {
      if (newScores[key] !== undefined) {
        newScores[key] += points[key];
      }
    });
    setScores(newScores);

    if (questionIndex < quizQuestions.length - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      setCurrentStep('result');
    }
  };

  const getWinner = () => {
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  };

  const resetQuiz = () => {
    setScores({ catolico: 0, presbiteriano: 0, batista: 0, pentecostal: 0, evangelico: 0 });
    setQuestionIndex(0);
    setCurrentStep('intro');
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <AnimatePresence mode="wait">
        {currentStep === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <div className="w-20 h-20 bg-amber/10 rounded-3xl flex items-center justify-center text-amber mx-auto shadow-[0_0_30px_rgba(201,168,76,0.1)]">
              <HelpCircle className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-display font-bold">Qual o seu perfil cristão?</h1>
              <p className="text-pearl/60 text-lg max-w-xl mx-auto font-serif italic">
                "Há muitos membros, mas um só corpo." (1 Coríntios 12:20). Responda a algumas perguntas e descubra com qual tradição cristã sua fé mais se identifica.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep('quiz')}
              className="px-10 py-4 bg-amber text-navy font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto"
            >
              Iniciar Descoberta <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {currentStep === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-10"
          >
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-amber/60">
              <span className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> Questionário de Fé</span>
              <span>Questão {questionIndex + 1} de {quizQuestions.length}</span>
            </div>

            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="h-full bg-amber"
                initial={{ width: 0 }}
                animate={{ width: `${((questionIndex + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>

            <div className="space-y-10">
              <h2 className="text-3xl font-display font-bold leading-tight">{quizQuestions[questionIndex].text}</h2>
              <div className="grid gap-4">
                {quizQuestions[questionIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.points)}
                    className="group bg-white/5 border border-amber/10 p-6 rounded-2xl text-left hover:border-amber hover:bg-amber/5 transition-all flex items-center justify-between"
                  >
                    <span className="text-lg text-pearl/80 group-hover:text-amber transition-colors">{opt.text}</span>
                    <div className="w-6 h-6 border-2 border-amber/20 rounded-full group-hover:border-amber transition-colors flex items-center justify-center">
                       <div className="w-2 h-2 bg-amber rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <div className="glow-card paper-texture border-amber/20 p-10 text-center space-y-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber to-transparent" />
               
               <div className="w-24 h-24 bg-amber text-navy rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(201,168,76,0.3)]">
                  <CheckCircle2 className="w-12 h-12" />
               </div>

               <div className="space-y-4">
                 <p className="text-amber font-display font-bold uppercase tracking-[0.2em] text-sm">Sugestão de Caminho</p>
                 <h2 className="text-5xl font-display font-bold">{resultsInfo[getWinner()].title}</h2>
               </div>

               <p className="text-pearl/70 text-lg font-serif leading-relaxed italic max-w-2xl mx-auto">
                 "{resultsInfo[getWinner()].desc}"
               </p>

               <div className="pt-8 border-t border-amber/10 flex flex-col md:flex-row items-center justify-center gap-6">
                  <button
                    onClick={resetQuiz}
                    className="flex items-center gap-2 text-pearl/40 hover:text-amber transition-colors text-sm font-bold uppercase"
                  >
                    <History className="w-4 h-4" /> Refazer Quiz
                  </button>
                  <button
                    className="px-8 py-3 bg-white/5 border border-amber/20 rounded-xl text-amber font-bold text-sm hover:bg-amber/10 transition-colors flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" /> Salvar no Perfil
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white/5 border border-amber/5 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3 text-amber font-bold text-xs uppercase tracking-widest">
                     <BookOpen className="w-4 h-4" /> Dica de Leitura
                  </div>
                  <p className="text-sm text-pearl/60">"Porque o SENHOR dá a sabedoria; da sua boca é que vem o conhecimento e o entendimento." (Provérbios 2:6)</p>
               </div>
                <div className="bg-white/5 border border-amber/5 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3 text-amber font-bold text-xs uppercase tracking-widest">
                     <RefreshCw className="w-4 h-4" /> Próximo Passo
                  </div>
                  <p className="text-sm text-pearl/60">Visite uma igreja perto de você para sentir a atmosfera e conversar com um pastor ou padre.</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
