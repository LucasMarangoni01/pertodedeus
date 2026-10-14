import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Heart, Sparkles, BookOpen, Volume2, Copy, Check, ChevronRight, 
  Flame, Cross, Star, Shield, Sun, Layers, ArrowRight, Share2, BookMarked, UserCheck, Calendar 
} from "lucide-react";
import { cn } from "../lib/utils";
import { deuterocanonicalBooks } from "../constants/bibleData";
import CatholicSpiritualPlan from "../components/catolicismo/CatholicSpiritualPlan";
import CatholicPrayersLibrary from "../components/catolicismo/CatholicPrayersLibrary";
import CatholicStudyBible from "../components/catolicismo/CatholicStudyBible";
import CatholicBooksLibrary from "../components/catolicismo/CatholicBooksLibrary";

const rosaryMysteries = [
  {
    id: "gozosos",
    title: "Mistérios Gozosos",
    days: "Segundas-feiras e Sábados",
    desc: "A infância e encarnação do Senhor",
    color: "from-amber-500/20 to-amber-700/10",
    decades: [
      { num: 1, title: "A Anunciação do Arcanjo Gabriel a Nossa Senhora", ref: "Lc 1:26-38" },
      { num: 2, title: "A Visitação de Maria à sua prima Santa Isabel", ref: "Lc 1:39-56" },
      { num: 3, title: "O Nascimento de Jesus em Belém", ref: "Lc 2:1-20" },
      { num: 4, title: "A Apresentação do Menino Jesus no Templo", ref: "Lc 2:22-38" },
      { num: 5, title: "A Perda e o Encontro de Jesus no Templo", ref: "Lc 2:41-52" },
    ]
  },
  {
    id: "dolorosos",
    title: "Mistérios Dolorosos",
    days: "Terças e Sextas-feiras",
    desc: "A paixão e morte redentora de Cristo",
    color: "from-purple-900/30 to-purple-950/20",
    decades: [
      { num: 1, title: "A Agonia de Jesus no Horto das Oliveiras", ref: "Mt 26:36-46" },
      { num: 2, title: "A Flagelação de Nosso Senhor Jesus Cristo", ref: "Jo 19:1" },
      { num: 3, title: "A Coroação de Espinhos", ref: "Mt 27:27-31" },
      { num: 4, title: "Jesus carregando a Cruz ao Calvário", ref: "Jo 19:16-17" },
      { num: 5, title: "A Crucificação e Morte de Jesus", ref: "Jo 19:28-37" },
    ]
  },
  {
    id: "gloriosos",
    title: "Mistérios Gloriosos",
    days: "Quartas-feiras e Domingos",
    desc: "A ressurreição e a glória celeste",
    color: "from-amber-400/25 to-yellow-600/10",
    decades: [
      { num: 1, title: "A Ressurreição triunfante de Nosso Senhor", ref: "Mt 28:1-10" },
      { num: 2, title: "A Ascensão gloriosa de Jesus aos Céus", ref: "At 1:6-11" },
      { num: 3, title: "A Descida do Espírito Santo em Pentecostes", ref: "At 2:1-13" },
      { num: 4, title: "A Assunção de Nossa Senhora ao Céu", ref: "Tradição / Dogma" },
      { num: 5, title: "A Coroação de Maria como Rainha do Céu e da Terra", ref: "Ap 12:1" },
    ]
  },
  {
    id: "luminosos",
    title: "Mistérios Luminosos",
    days: "Quintas-feiras",
    desc: "A vida pública e ministério de Jesus",
    color: "from-sky-500/20 to-sky-700/10",
    decades: [
      { num: 1, title: "O Batismo de Jesus no Rio Jordão", ref: "Mt 3:13-17" },
      { num: 2, title: "A Auto-revelação nas Bodas de Caná", ref: "Jo 2:1-11" },
      { num: 3, title: "O Anúncio do Reino de Deus e convite à conversão", ref: "Mc 1:14-15" },
      { num: 4, title: "A Transfiguração no Monte Tabor", ref: "Lc 9:28-36" },
      { num: 5, title: "A Instituição da Santíssima Eucaristia", ref: "Mt 26:26-29" },
    ]
  }
];

const sacramentsList = [
  { name: "Batismo", type: "Iniciação", desc: "Porta de entrada na vida da graça e membresia da Igreja." },
  { name: "Crisma (Confirmação)", type: "Iniciação", desc: "Plenitude e selo do Espírito Santo para o testemunho cristão." },
  { name: "Eucaristia", type: "Iniciação", desc: "Fonte e ápice de toda a vida cristã; o próprio Corpo e Sangue de Cristo." },
  { name: "Reconciliação (Confissão)", type: "Cura", desc: "Perdão dos pecados cometidos após o Batismo e restauração da comunhão." },
  { name: "Unção dos Enfermos", type: "Cura", desc: "Graça de conforto, paz e força espiritual diante da doença e fragilidade." },
  { name: "Ordem Sacerdotal", type: "Serviço", desc: "Consagração episcopal, presbiteral ou diaconal para o ministério." },
  { name: "Matrimônio", type: "Serviço", desc: "União santa e indissolúvel entre homem e mulher, imagem do amor de Cristo pela Igreja." }
];

export interface SaintItem {
  id: string;
  name: string;
  title: string;
  century: string;
  feastDay: string;
  patronage: string;
  quote: string;
  bio: string;
  prayerTitle: string;
  prayerText: string;
}

export const saintsList: SaintItem[] = [
  {
    id: "sao-bento",
    name: "São Bento de Núrsia",
    title: "Pai dos Monges do Ocidente & Patrono da Europa",
    century: "480–547",
    feastDay: "11 de Julho",
    patronage: "Monges, exorcistas, agricultores e proteção contra ciladas espirituais",
    quote: "A Cruz Sagrada seja a minha luz, não seja o dragão meu guia. Retira-te, satanás! Nunca me aconselhes coisas vãs.",
    bio: "Fundador da Ordem dos Beneditinos na Abadia de Monte Cassino, redigiu a célebre Regra Beneditina sob o lema 'Ora et Labora' (Reza e Trabalha). A Medalha de São Bento é um dos mais célebres sacramentais de proteção espiritual da Igreja Católica.",
    prayerTitle: "Oração da Medalha de São Bento",
    prayerText: `A Cruz Sagrada seja a minha luz,
não seja o dragão meu guia.
Retira-te, satanás!
Nunca me aconselhes coisas vãs.
É mau o que tu me ofereces,
bebe tu mesmo os teus venenos!
Em nome do Pai, do Filho e do Espírito Santo. Amém.`
  },
  {
    id: "sao-francisco",
    name: "São Francisco de Assis",
    title: "O Pobrezinho de Assis & Patrono da Paz e Ecologia",
    century: "1182–1226",
    feastDay: "4 de Outubro",
    patronage: "Ecologistas, animais, pobres e instrumentos de concórdia",
    quote: "Senhor, fazei-me instrumento de vossa paz. Onde houver ódio, que eu leve o amor; onde houver ofensa, que eu leve o perdão.",
    bio: "Despojou-se de todas as riquezas paternas para abraçar a 'Dama Pobreza' e imitar radicalmente a vida de Cristo. Recebeu os sagrados estigmas e renovou a Igreja com ardor evangélico e amor ardente a todas as criaturas.",
    prayerTitle: "Oração da Paz de São Francisco",
    prayerText: `Senhor, fazei-me instrumento de vossa paz.
Onde houver ódio, que eu leve o amor;
Onde houver ofensa, que eu leve o perdão;
Onde houver discórdia, que eu leve a união;
Onde houver dúvida, que eu leve a fé;
Onde houver erro, que eu leve a verdade;
Onde houver desespero, que eu leve a esperança;
Onde houver tristeza, que eu leve a alegria;
Onde houver trevas, que eu leve a luz.

Ó Mestre, fazei que eu procure mais consolar do que ser consolado;
Compreender do que ser compreendido;
Amar do que ser amado.
Pois é dando que se recebe;
É perdoando que se é perdoado;
E é morrendo que se vive para a vida eterna. Amém.`
  },
  {
    id: "santa-teresinha",
    name: "Santa Teresinha do Menino Jesus",
    title: "Doutora da Igreja & Padroeira das Missões",
    century: "1873–1897",
    feastDay: "1 de Outubro",
    patronage: "Missionários, doentes e vocações religiosas",
    quote: "No coração da Igreja, minha Mãe, eu serei o amor! Minha vocação é o amor.",
    bio: "Carmelita descalça em Lisieux, viveu apenas 24 anos e deixou a luminosa doutrina da 'Pequena Via': santificar as ações cotidianas com amor extraordinário e abandono filial nas mãos do Pai.",
    prayerTitle: "Oração a Santa Teresinha das Rosas",
    prayerText: `Santa Teresinha do Menino Jesus,
que prometestes fazer cair uma chuva de rosas sobre a terra,
lançai sobre mim e minha família as bênçãos celestiais.
Ensinai-me a amar a Jesus como vós o amastes,
trilhando com confiança o caminho da infância espiritual.
Alcançai-me do Coração de Jesus a graça que hoje vos peço
e a perseverança final no amor.
Santa Teresinha, rogai por nós! Amém.`
  },
  {
    id: "santo-agostinho",
    name: "Santo Agostinho de Hipona",
    title: "Doutor da Graça & Bispo de Hipona",
    century: "354–430",
    feastDay: "28 de Agosto",
    patronage: "Teólogos, filósofos e buscadores da verdade",
    quote: "Tarde te amei, ó Beleza tão antiga e tão nova, tarde te amei! Eis que habitavas dentro de mim, e eu te procurava fora.",
    bio: "Filho das incessantes lágrimas de Santa Mônica, converteu-se e tornou-se um dos maiores teólogos do cristianismo. Autor de 'Confissões', ensinou que o coração humano é inquieto até descansar em Deus.",
    prayerTitle: "Oração 'Tarde Te Amei' (Santo Agostinho)",
    prayerText: `Tarde te amei, ó Beleza tão antiga e tão nova, tarde te amei!
Eis que habitavas dentro de mim, e eu te procurava fora;
eu, disforme, me lançava sobre as belas formas de tuas criaturas.
Estavas comigo, mas eu não estava contigo.
Retinham-me longe de ti as coisas que não existiriam se não existissem em ti.
Chamaste-me, clamaste por mim e rompeste a minha surdez.
Brilhaste, resplandeceste e dissipaste a minha cegueira.
Exalaste o teu perfume e respirei, e agora anseio por ti.
Provei-te, e tenho fome e sede de ti.
Tocaste-me, e inflamei-me no desejo de tua paz. Amém.`
  },
  {
    id: "sao-tomas-aquino",
    name: "São Tomás de Aquino",
    title: "Doutor Angélico & Baluarte da Filosofia Cristã",
    century: "1225–1274",
    feastDay: "28 de Janeiro",
    patronage: "Estudantes, professores, teólogos e universidades",
    quote: "A graça não destrói a natureza, mas a aperfeiçoa.",
    bio: "Frei dominicano italiano, autor da monumental 'Suma Teológica'. Demonstrou a perfeita harmonia entre a Fé e a Razão e compôs os mais sublimes hinos litúrgicos para a Solenidade de Corpus Christi.",
    prayerTitle: "Oração do Estudante (São Tomás de Aquino)",
    prayerText: `Criador inefável, que organizastes o universo com suprema sabedoria,
Vós que sois a verdadeira fonte da luz e princípio primeiro de toda inteligência,
dignai-Vos derramar sobre as trevas da minha mente um raio de vossa claridade.
Afastai de mim a dupla escuridão em que nasci: o pecado e a ignorância.
Dai-me penetração para compreender, capacidade para reter,
método e facilidade para aprender, sutileza para interpretar e graça abundante para falar.
Orientai o meu início, dirigi o meu progresso e coroai o meu termo.
Por Cristo, nosso Senhor. Amém.`
  },
  {
    id: "padre-pio",
    name: "São Pio de Pietrelcina",
    title: "Apóstolo do Confessionário & Homem dos Estigmas",
    century: "1887–1968",
    feastDay: "23 de Setembro",
    patronage: "Voluntários de socorro, doentes e almas aflitas",
    quote: "Reze, tenha fé e não se preocupe. A preocupação é inútil. Deus é misericordioso e ouvirá a sua oração.",
    bio: "Frade capuchinho em San Giovanni Rotondo, passou até 16 horas diárias confessando fiéis, viveu em profunda contemplação do Rosário e suportou os estigmas de Cristo com humildade heroica.",
    prayerTitle: "Oração 'Fica Comigo, Senhor' (Padre Pio)",
    prayerText: `Fica comigo, Senhor, pois preciso da tua presença para não te esquecer.
Sabes com que facilidade te abandono.
Fica comigo, Senhor, porque sou fraco e preciso da tua força para não cair tantas vezes.
Fica comigo, Senhor, porque és a minha luz e sem ti estou nas trevas.
Fica comigo, Senhor, para me dares a conhecer a tua vontade.
Fica comigo, Senhor, para que ouça a tua voz e a siga.
Jesus, não te peço consolações divinas porque não as mereço,
mas o dom da tua presença, sim, eu te peço! Amém.`
  },
  {
    id: "sao-joao-paulo-ii",
    name: "São João Paulo II",
    title: "O Peregrino da Paz & Papa da Juventude",
    century: "1920–2005",
    feastDay: "22 de Outubro",
    patronage: "Jovens, famílias e ministérios de evangelização",
    quote: "Não tenhais medo! Abri, antes, escancarais as portas a Cristo e ao seu poder salvador!",
    bio: "Papa polonês que liderou a Igreja na transição do milênio. Fundador da Jornada Mundial da Juventude, proclamou a Teologia do Corpo e acrescentou os Mistérios Luminosos ao Santo Rosário.",
    prayerTitle: "Oração a São João Paulo II",
    prayerText: `Ó São João Paulo II, da janela do céu dai-nos a vossa bênção!
Abençoai a Igreja que tanto amastes e corajosamente servistes pelas estradas do mundo.
Abençoai as famílias e os jovens, que foram a vossa grande esperança e paixão.
Ensinai-nos a confiar sempre em Maria Santíssima com o vosso lema: Totus Tuus.
Ajudai-nos a nunca ter medo de abrir as portas do coração para Cristo.
Alcançai-nos a graça de vivermos na santidade e na paz. Amém.`
  }
];

type CatholicTab = "plano-espiritual" | "oracoes" | "terco" | "biblia-catolica" | "livros" | "sacramentos" | "santos";

export default function Catolicismo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get("tab") as CatholicTab | null;
  const validTabs: CatholicTab[] = ["plano-espiritual", "biblia-catolica", "livros", "oracoes", "terco", "sacramentos", "santos"];

  const [activeTab, setActiveTabState] = useState<CatholicTab>(
    paramTab && validTabs.includes(paramTab) ? paramTab : "plano-espiritual"
  );
  const [selectedSaint, setSelectedSaint] = useState<SaintItem | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeMystery, setActiveMystery] = useState<string>("gozosos");

  useEffect(() => {
    if (paramTab && validTabs.includes(paramTab)) {
      setActiveTabState(paramTab);
    }
  }, [paramTab]);

  const setActiveTab = (tab: CatholicTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  const currentMystery = rosaryMysteries.find(m => m.id === activeMystery) || rosaryMysteries[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="glow-card border-amber/30 bg-gradient-to-r from-amber/20 via-navy to-navy p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Cross className="w-64 h-64 text-amber" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-amber text-xs font-bold uppercase tracking-wider">
            <Cross className="w-4 h-4" />
            Tradição & Devoção Católica
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-pearl">
            Catolicismo
          </h1>
          <p className="text-pearl/70 max-w-2xl text-sm leading-relaxed">
            Um refúgio sagrado para meditar nas orações milenares, rezar o Santo Terço, 
            estudar a Bíblia Católica completa de 73 livros, compreender os Santos Sacramentos e criar planos espirituais guiados pela inteligência católica.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <button
              onClick={() => setActiveTab("plano-espiritual")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm",
                activeTab === "plano-espiritual" 
                  ? "bg-gradient-to-r from-amber to-amber-500 text-navy shadow-amber/20 shadow-lg scale-105 font-extrabold" 
                  : "bg-amber/15 text-amber border border-amber/30 hover:bg-amber/25"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Plano Espiritual (IA)
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-navy/60 text-amber border border-amber/40">
                Novo
              </span>
            </button>
            <button
              onClick={() => setActiveTab("oracoes")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "oracoes" 
                  ? "bg-amber text-navy shadow-lg scale-105" 
                  : "bg-white/5 text-pearl/70 hover:bg-white/10"
              )}
            >
              <Heart className="w-4 h-4" />
              Orações Tradicionais
            </button>
            <button
              onClick={() => setActiveTab("terco")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "terco" 
                  ? "bg-amber text-navy shadow-lg scale-105" 
                  : "bg-white/5 text-pearl/70 hover:bg-white/10"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Santo Terço & Mistérios
            </button>
            <button
              onClick={() => setActiveTab("biblia-catolica")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "biblia-catolica" 
                  ? "bg-amber text-navy shadow-lg scale-105 font-black" 
                  : "bg-white/5 text-pearl/70 hover:bg-white/10"
              )}
            >
              <BookOpen className="w-4 h-4" />
              Bíblia de Estudo (73 Livros)
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-navy/60 text-amber border border-amber/40">
                Ilustrada
              </span>
            </button>
            <button
              onClick={() => setActiveTab("livros")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "livros" 
                  ? "bg-amber text-navy shadow-lg scale-105 font-black" 
                  : "bg-white/5 text-pearl/70 hover:bg-white/10"
              )}
            >
              <BookMarked className="w-4 h-4" />
              Livros & Biblioteca (IA)
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-navy/60 text-amber border border-amber/40">
                Novo
              </span>
            </button>
            <button
              onClick={() => setActiveTab("sacramentos")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "sacramentos" 
                  ? "bg-amber text-navy shadow-lg scale-105" 
                  : "bg-white/5 text-pearl/70 hover:bg-white/10"
              )}
            >
              <Layers className="w-4 h-4" />
              Os 7 Sacramentos
            </button>
            <button
              onClick={() => setActiveTab("santos")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === "santos" 
                  ? "bg-amber text-navy shadow-lg scale-105" 
                  : "bg-white/5 text-pearl/70 hover:bg-white/10"
              )}
            >
              <Star className="w-4 h-4" />
              Santos & Doutores
            </button>
          </div>
        </div>
      </div>

      {/* TAB: PLANO ESPIRITUAL PERSONALIZADO COM IA */}
      {activeTab === "plano-espiritual" && (
        <CatholicSpiritualPlan />
      )}

      {/* TAB 1: ORAÇÕES TRADICIONAIS */}
      {activeTab === "oracoes" && (
        <CatholicPrayersLibrary />
      )}

      {/* TAB 2: SANTO TERÇO */}
      {activeTab === "terco" && (
        <div className="space-y-6">
          {/* Day of the week suggestion */}
          <div className="p-4 bg-amber/10 border border-amber/25 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-pearl/80">
              💡 <strong>Dica Litúrgica:</strong> Escolha o mistério correspondente ao dia de hoje para acompanhar a oração da Igreja universal.
            </span>
          </div>

          {/* Mystery selector cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rosaryMysteries.map((mystery) => (
              <button
                key={mystery.id}
                onClick={() => setActiveMystery(mystery.id)}
                className={cn(
                  "p-5 rounded-3xl border text-left transition-all space-y-2 relative overflow-hidden",
                  activeMystery === mystery.id
                    ? "bg-gradient-to-b from-amber/25 to-navy border-amber shadow-xl scale-[1.02]"
                    : "bg-white/5 border-white/10 hover:border-amber/20 opacity-80 hover:opacity-100"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber">
                    {mystery.days}
                  </span>
                  {activeMystery === mystery.id && (
                    <Check className="w-4 h-4 text-amber" />
                  )}
                </div>
                <h3 className="font-display font-bold text-lg text-pearl">
                  {mystery.title}
                </h3>
                <p className="text-xs text-pearl/60">
                  {mystery.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Mystery Details & The 5 Decades */}
          <div className="glow-card p-8 rounded-3xl border-amber/20 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs text-amber font-bold uppercase tracking-widest">
                Meditação das 5 Dezenas
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-pearl mt-1">
                {currentMystery.title}
              </h2>
              <p className="text-sm text-pearl/60 mt-1">
                Reze: 1 Pai Nosso, 10 Ave Marias e 1 Glória ao Pai meditando em cada um dos mistérios abaixo:
              </p>
            </div>

            <div className="space-y-3">
              {currentMystery.decades.map((dec) => (
                <div 
                  key={dec.num}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber/20 text-amber font-bold font-serif flex items-center justify-center shrink-0 border border-amber/30 text-lg">
                    {dec.num}º
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-pearl text-sm md:text-base">
                      {dec.title}
                    </h4>
                    <span className="text-xs text-amber/80 font-serif">
                      Referência Bíblica: {dec.ref}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Rosary Guide Sequence */}
            <div className="p-6 rounded-2xl bg-white/5 border border-amber/10 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber">
                Estrutura do Santo Terço
              </h4>
              <p className="text-xs text-pearl/70 leading-relaxed">
                1. Sinal da Cruz e Oferecimento do Terço • 2. Creio na Cruz • 3. Um Pai Nosso na primeira conta grande • 
                4. Três Ave Marias (pela Fé, Esperança e Caridade) • 5. Um Glória ao Pai • 6. As 5 Dezenas meditadas • 7. Agradecimento e Salve Rainha.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BÍBLIA CATÓLICA DE ESTUDO ILUSTRADA */}
      {activeTab === "biblia-catolica" && (
        <CatholicStudyBible />
      )}

      {/* TAB: LIVROS & BIBLIOTECA (IA & COMUNIDADE) */}
      {activeTab === "livros" && (
        <CatholicBooksLibrary />
      )}

      {/* TAB 4: OS 7 SACRAMENTOS */}
      {activeTab === "sacramentos" && (
        <div className="space-y-6">
          <div className="glow-card p-6 rounded-3xl border-amber/20">
            <h2 className="text-2xl font-display font-bold text-pearl">
              Os Sete Sacramentos da Igreja
            </h2>
            <p className="text-pearl/60 text-sm mt-1">
              "Os sacramentos são sinais eficazes da graça, instituídos por Cristo e confiados à Igreja, 
              pelos quais nos é dispensada a vida divina." (§1131)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sacramentsList.map((sac, idx) => (
              <div 
                key={sac.name}
                className="glow-card p-6 rounded-3xl border-white/10 space-y-3 hover:border-amber/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-full bg-amber/20 text-amber font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full",
                    sac.type === "Iniciação" && "bg-sky-500/20 text-sky-400",
                    sac.type === "Cura" && "bg-emerald-500/20 text-emerald-400",
                    sac.type === "Serviço" && "bg-amber/20 text-amber"
                  )}>
                    {sac.type}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-pearl">
                  {sac.name}
                </h3>
                <p className="text-xs text-pearl/60 leading-relaxed">
                  {sac.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SANTOS & DOUTORES DA IGREJA */}
      {activeTab === "santos" && (
        <div className="space-y-6">
          <div className="glow-card p-6 md:p-8 rounded-3xl border-amber/20 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-amber text-xs font-bold uppercase tracking-wider mb-2">
              <Star className="w-4 h-4" />
              Comunhão dos Santos & Tradição Católica
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-pearl">
              Santos & Doutores da Igreja
            </h2>
            <p className="text-pearl/60 text-sm mt-1 max-w-2xl leading-relaxed">
              Exemplos vivos de seguimento radical a Cristo. Conheça suas vidas heroicas, 
              medite em seus ensinamentos doutrinários e reze com suas orações consagradas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {saintsList.map((saint) => (
              <div 
                key={saint.id}
                className="glow-card p-6 md:p-7 rounded-3xl border-white/10 hover:border-amber/30 transition-all flex flex-col justify-between space-y-4 group bg-white/[0.02]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber/20 text-amber border border-amber/30">
                        {saint.century}
                      </span>
                      <h3 className="text-xl font-display font-bold text-pearl mt-2 group-hover:text-amber transition-colors">
                        {saint.name}
                      </h3>
                      <p className="text-xs text-pearl/50 font-medium">
                        {saint.title}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber/10 text-amber shrink-0 border border-amber/20">
                      <Star className="w-5 h-5" />
                    </div>
                  </div>

                  <blockquote className="p-3.5 rounded-2xl bg-white/5 border-l-2 border-amber/60 text-xs italic font-serif text-pearl/80 leading-relaxed">
                    "{saint.quote}"
                  </blockquote>

                  <p className="text-xs text-pearl/60 leading-relaxed">
                    {saint.bio}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-2 text-[11px] text-pearl/40 border-t border-white/5">
                    <div>
                      <span className="text-pearl/60 font-semibold">Festa Litúrgica:</span> {saint.feastDay}
                    </div>
                    <div>
                      <span className="text-pearl/60 font-semibold">Padroeiro(a):</span> {saint.patronage}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedSaint(selectedSaint?.id === saint.id ? null : saint)}
                    className={cn(
                      "w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                      selectedSaint?.id === saint.id 
                        ? "bg-amber text-navy shadow-md font-semibold" 
                        : "bg-white/5 hover:bg-white/10 text-pearl/70 hover:text-pearl border border-white/5"
                    )}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    {selectedSaint?.id === saint.id ? "Ocultar Oração" : `Ver ${saint.prayerTitle}`}
                  </button>

                  <AnimatePresence>
                    {selectedSaint?.id === saint.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-4 rounded-2xl bg-navy/90 border border-amber/20 space-y-3 overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-amber flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {saint.prayerTitle}
                          </h4>
                          <button
                            onClick={() => handleCopy(saint.prayerText)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-pearl/60 hover:text-amber transition-colors text-xs flex items-center gap-1"
                            title="Copiar oração"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs font-serif italic text-pearl/90 leading-relaxed whitespace-pre-line bg-white/[0.02] p-3 rounded-xl border border-white/5">
                          {saint.prayerText}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
