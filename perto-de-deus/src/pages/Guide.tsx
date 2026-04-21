import { HelpCircle, BookOpen, Users, MessageCircle, ChevronDown, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { cn } from "../lib/utils";

const faqs = [
  {
    q: "Como faço para receber notificações?",
    a: "Você pode ativar notificações no seu perfil. Elas servem para lembrá-lo do seu devocional diário e avisar quando orações forem respondidas."
  },
  {
    q: "Onde encontro os estudos diários?",
    a: "Na página inicial (Dashboard), você sempre terá o 'Devocional de Hoje'. Para mais conteúdos, explore a aba 'Devocional' no menu lateral."
  },
  {
    q: "Posso compartilhar meus registros do Diário?",
    a: "O Diário é um espaço íntimo e privado entre você e Deus. No entanto, se quiser compartilhar algo edificante, sugerimos usar o Mural da Comunidade."
  },
  {
    q: "Como utilizar a Assistente de Fé (AI)?",
    a: "Nossa assistente está disponível na aba AI. Você pode pedir ajuda para interpretar versículos, encontrar passagens por tema ou apenas conversar sobre sua jornada."
  }
];

export default function Guide() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-12 pb-12">
      {/* Cabeçalho de Boas-Vindas */}
      <section className="text-center space-y-4 pt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 bg-amber/10 border border-amber/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <HelpCircle className="w-10 h-10 text-amber" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-br from-amber to-amber/60 bg-clip-text text-transparent">
          Como podemos iluminar seu caminho?
        </h1>
        <p className="text-pearl/60 max-w-2xl mx-auto font-serif italic text-lg leading-relaxed">
          "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho." – Salmos 119:105
        </p>
      </section>

      {/* Cards de Primeiros Passos */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -5 }}
          className="glow-card group h-full"
        >
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber/20 transition-colors">
            <BookOpen className="text-amber w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-amber font-display">Estudos e Mensagens</h3>
          <p className="text-pearl/50 text-sm leading-relaxed">
            Navegue pela aba de <span className="text-amber/60 italic font-bold">Bíblia</span> ou <span className="text-amber/60 italic font-bold">Estudos</span> para encontrar palavras que fortalecerão sua fé. Use a busca para temas específicos.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="glow-card group h-full"
        >
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber/20 transition-colors">
            <Users className="text-amber w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-amber font-display">Comunidade e Oração</h3>
          <p className="text-pearl/50 text-sm leading-relaxed">
            No <span className="text-amber/60 italic font-bold">Mural</span>, você pode compartilhar testemunhos. Na aba <span className="text-amber/60 italic font-bold">Oração</span>, peça apoio ou ore pelos irmãos.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
          className="glow-card group h-full"
        >
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber/20 transition-colors">
            <Mail className="text-amber w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-amber font-display">Suporte e Feedback</h3>
          <p className="text-pearl/50 text-sm leading-relaxed">
            Se encontrar dificuldades técnicas ou tiver sugestões para o <span className="text-amber/60 italic font-bold">Perto de Deus</span>, nossa equipe de moderadores está à disposição.
          </p>
        </motion.div>
      </section>

      {/* FAQ (Perguntas Frequentes) */}
      <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-10 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-display font-medium text-amber italic">Perguntas Frequentes</h2>
          <p className="text-pearl/40 text-[10px] uppercase tracking-widest font-bold">Esclarecendo suas dúvidas</p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-white/5 last:border-0 pb-4">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between py-4 text-left hover:text-amber transition-colors transition-all"
              >
                <span className={cn("font-medium transition-colors", openFaq === idx ? "text-amber" : "text-pearl/80")}>
                  {faq.q}
                </span>
                <ChevronDown className={cn("w-5 h-5 text-amber/40 transition-transform duration-300", openFaq === idx && "rotate-180 text-amber")} />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="text-pearl/50 text-sm pb-4 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Rodapé de Apoio */}
      <section className="text-center py-20 bg-navy/40 border border-white/5 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber/5 blur-[100px] rounded-full" />
        
        <div className="max-w-xl mx-auto space-y-8 px-6 relative z-10">
          <div className="space-y-4">
            <h2 className="text-3xl font-display italic font-bold">Ainda sente que precisa de ajuda?</h2>
            <p className="text-pearl/60 leading-relaxed italic">
              Nossa missão é facilitar sua conexão com o Criador. Se algo não ficou claro, nossa equipe de voluntários está de prontidão para te acolher.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-amber text-navy px-8 py-4 rounded-2xl font-bold shadow-xl shadow-amber/10 hover:shadow-amber/20 transform hover:-translate-y-0.5 active:scale-95 transition-all">
              <MessageCircle className="w-5 h-5" />
              Falar com Voluntário
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 border border-amber/30 text-amber px-8 py-4 rounded-2xl font-bold hover:bg-amber/5 transition-all active:scale-95">
              <Phone className="w-5 h-5" />
              Suporte WhatsApp
            </button>
          </div>

          <div className="pt-10 flex flex-wrap items-center justify-center gap-8 text-pearl/20">
             <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] mb-1 font-bold">Email</span>
                <span className="text-xs text-pearl/40">suporte@pertodedeus.com</span>
             </div>
             <div className="hidden sm:block w-px h-8 bg-white/5" />
             <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] mb-1 font-bold">Sede</span>
                <span className="text-xs text-pearl/40">Comunidade Global Online</span>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
