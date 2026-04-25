import { HelpCircle, BookOpen, Users, MessageCircle, ChevronDown, Mail, Phone, Flame, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { cn } from "../lib/utils";

const faqs = [
  {
    q: "Como funciona a seção de Jejum Espiritual?",
    a: "Sugerimos o jejum ideal com base no seu objetivo e experiência. Você encontrará ferramentas para planejar o início, a duração e como quebrar o jejum de forma saudável e espiritual."
  },
  {
    q: "Como o 'Rastreador de Lutas' me ajuda?",
    a: "É um espaço seguro e privado para confessar fraquezas e celebrar vitórias diárias. Oferecemos conselhos bíblicos específicos para cada tipo de luta, focando na restauração em Cristo."
  },
  {
    q: "Posso apagar minhas mensagens no Chat Geral?",
    a: "Sim. Ao tocar na sua mensagem no Mural, ícones de edição e exclusão aparecerão. Respeitamos sua privacidade e liberdade de expressão na comunidade."
  },
  {
    q: "A IA de estudos é confiável?",
    a: "Nossa IA é treinada em contextos bíblicos, mas deve ser usada como ferramenta complementar. Sempre confira as referências sugeridas na sua própria Bíblia."
  },
  {
    q: "Como selecionar vários capítulos na Bíblia?",
    a: "Ao escolher um livro, você pode marcar um intervalo de capítulos para leitura contínua, ideal para planos de leitura anuais ou maratonas."
  }
];

export default function Guide() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-16 pb-20">
      {/* Cabeçalho de Boas-Vindas */}
      <section className="text-center space-y-6 pt-12 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber/10 blur-[80px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-24 h-24 bg-white/5 border border-amber/20 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-500"
        >
          <HelpCircle className="w-12 h-12 text-amber drop-shadow-[0_0_8px_rgba(201,168,76,0.5)]" />
        </motion.div>
        
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight leading-tight">
          Como podemos <span className="italic text-amber">iluminar</span> seu caminho?
        </h1>
        <p className="text-pearl/50 max-w-2xl mx-auto font-serif italic text-xl leading-relaxed">
          "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho." <br/>
          <span className="text-amber/60 text-sm font-sans not-italic font-bold tracking-[0.2em] uppercase mt-2 block">— Salmos 119:105</span>
        </p>
      </section>

      {/* Grid de Funcionalidades */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: BookOpen,
            title: "Leitura e Estudo",
            desc: "Navegue pela Bíblia com inteligência ou use a IA de Estudos para explicações profundas sobre temas teológicos."
          },
          {
            icon: Flame,
            title: "Crescimento",
            desc: "Use o Rastreador de Lutas para vencer vícios e a Calculadora de Jejum para fortalecer seu espírito."
          },
          {
            icon: Users,
            title: "Comunidade",
            desc: "Interaja no Chat Geral ou publique Testemunhos. Você tem controle total para editar ou apagar suas palavras."
          },
          {
            icon: Heart,
            title: "Vida Devocional",
            desc: "Receba devocionais diários personalizados ou escreva no seu Diário Espiritual privativo."
          }
        ].map((feat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-amber/30 transition-all duration-500 hover:bg-white/[0.05]"
          >
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber/10 group-hover:scale-110 transition-all duration-500 border border-white/10 group-hover:border-amber/20">
              <feat.icon className="text-amber w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white font-display tracking-wide">{feat.title}</h3>
            <p className="text-pearl/40 text-sm leading-relaxed group-hover:text-pearl/60 transition-colors">
              {feat.desc}
            </p>
          </motion.div>
        ))}
      </section>

      {/* FAQ (Perguntas Frequentes) */}
      <section className="relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber/5 blur-[80px] rounded-full" />
        
        <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 md:p-16 space-y-12 backdrop-blur-sm relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-display font-medium text-amber italic tracking-tight">Perguntas Frequentes</h2>
            <p className="text-pearl/40 text-xs uppercase tracking-[0.4em] font-black">Esclarecendo suas dúvidas</p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => (
              <motion.div 
                key={idx} 
                className="group border-b border-white/5 last:border-0"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between py-6 text-left"
                >
                  <span className={cn(
                    "text-lg transition-all duration-300", 
                    openFaq === idx ? "text-amber font-bold translate-x-2" : "text-pearl/70 font-medium group-hover:text-pearl"
                  )}>
                    {faq.q}
                  </span>
                  <div className={cn(
                    "w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300",
                    openFaq === idx ? "bg-amber border-amber rotate-180" : "group-hover:border-amber/40"
                  )}>
                    <ChevronDown className={cn("w-4 h-4 transition-colors", openFaq === idx ? "text-navy" : "text-amber/40")} />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pl-2 pr-8 pb-8">
                        <p className="text-pearl/50 text-base leading-relaxed font-serif italic border-l-2 border-amber/20 pl-6">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rodapé de Apoio */}
      <section className="text-center py-24 bg-gradient-to-b from-transparent to-navy/40 border border-white/5 rounded-[4rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />
        
        <div className="max-w-2xl mx-auto space-y-10 px-6 relative z-10">
          <div className="space-y-6">
            <div className="inline-block px-4 py-1 rounded-full bg-amber/10 border border-amber/20 text-amber text-[10px] items-center gap-1.5 uppercase font-black tracking-widest mb-4">
              Apoio Fraternal
            </div>
            <h2 className="text-4xl md:text-5xl font-display italic font-bold text-white tracking-tight">Precisa de uma oração ou ajuda humana?</h2>
            <p className="text-pearl/50 leading-relaxed italic text-lg lg:px-4">
              Nossa missão é facilitar sua conexão com o Criador. Se algo não ficou claro, nossa equipe de voluntários está de prontidão para te acolher com amor e paciência.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-amber text-navy px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-[0_10px_30px_rgba(201,168,76,0.15)] hover:shadow-[0_15px_40px_rgba(201,168,76,0.25)] transform hover:-translate-y-1 active:scale-95 transition-all">
              <MessageCircle className="w-5 h-5" />
              Falar com Voluntário
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-pearl/80 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transform hover:-translate-y-1 active:scale-95 transition-all">
              <Phone className="w-5 h-5 text-amber" />
              WhatsApp de Suporte
            </button>
          </div>

          <div className="pt-16 grid grid-cols-2 gap-8 border-t border-white/5 max-w-md mx-auto">
             <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-amber/40">Email Oficial</span>
                <p className="text-sm text-pearl/50">contato@pertodedeus.com</p>
             </div>
             <div className="space-y-1 text-right sm:text-left">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-amber/40">Localização</span>
                <p className="text-sm text-pearl/50">Digital & Global</p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
