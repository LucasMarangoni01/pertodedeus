import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Sparkles, BookOpen, Volume2, Copy, Check, ChevronRight, 
  Flame, Cross, Star, Shield, Sun, Layers, ArrowRight, Share2 
} from "lucide-react";
import { cn } from "../lib/utils";

interface PrayerItem {
  id: string;
  title: string;
  subtitle: string;
  category: "fundamentais" | "marianas" | "santos" | "protecao";
  latinTitle?: string;
  text: string;
  origin?: string;
}

const prayersList: PrayerItem[] = [
  {
    id: "pai-nosso",
    title: "Pai Nosso",
    subtitle: "A oração que o próprio Senhor nos ensinou",
    latinTitle: "Pater Noster",
    category: "fundamentais",
    origin: "Mateus 6:9-13 / Liturgia Romana",
    text: `Pai nosso, que estais nos céus,
santificado seja o vosso nome;
venha a nós o vosso reino,
seja feita a vossa vontade,
assim na terra como no céu.
O pão nosso de cada dia nos dai hoje;
perdoai-nos as nossas ofensas,
assim como nós perdoamos a quem nos tem ofendido;
e não nos deixeis cair em tentação,
mas livrai-nos do mal.
Amém.`
  },
  {
    id: "ave-maria",
    title: "Ave Maria",
    subtitle: "A saudação angélica à Mãe de Deus",
    latinTitle: "Ave Maria",
    category: "marianas",
    origin: "Lucas 1:28, 42 / Tradição da Igreja",
    text: `Ave Maria, cheia de graça, o Senhor é convosco.
Bendita sois vós entre as mulheres,
e bendito é o fruto do vosso ventre, Jesus.
Santa Maria, Mãe de Deus,
rogai por nós, pecadores,
agora e na hora de nossa morte.
Amém.`
  },
  {
    id: "gloria",
    title: "Glória ao Pai",
    subtitle: "Doxologia e louvor à Santíssima Trindade",
    latinTitle: "Gloria Patri",
    category: "fundamentais",
    origin: "Liturgia Tradicional",
    text: `Glória ao Pai, e ao Filho, e ao Espírito Santo.
Como era no princípio, agora e sempre.
Amém.`
  },
  {
    id: "salve-rainha",
    title: "Salve Rainha",
    subtitle: "Hino de súplica filial a Maria Santíssima",
    latinTitle: "Salve Regina",
    category: "marianas",
    origin: "Beato Hermano Contrato, século XI",
    text: `Salve, Rainha, Mãe de misericórdia,
vida, doçura e esperança nossa, salve!
A vós bradamos, os degredados filhos de Eva.
A vós suspiramos, gemendo e chorando
neste vale de lágrimas.
Eia, pois, advogada nossa,
esses vossos olhos misericordiosos a nós volvei,
e depois deste desterro mostrai-nos Jesus,
bendito fruto do vosso ventre,
ó clemente, ó piedosa, ó doce sempre Virgem Maria.
Rogai por nós, Santa Mãe de Deus,
para que sejamos dignos das promessas de Cristo.
Amém.`
  },
  {
    id: "credo",
    title: "Credo Apostólico",
    subtitle: "A síntese da fé cristã e apostólica",
    latinTitle: "Symbolum Apostolorum",
    category: "fundamentais",
    origin: "Tradição Apostólica",
    text: `Creio em Deus Pai todo-poderoso,
Criador do céu e da terra.
E em Jesus Cristo, seu único Filho, nosso Senhor,
que foi concebido pelo poder do Espírito Santo,
nasceu da Virgem Maria,
padeceu sob Pôncio Pilatos,
foi crucificado, morto e sepultado;
desceu à mansão dos mortos;
ressuscitou ao terceiro dia;
subiu aos céus,
está sentado à direita de Deus Pai todo-poderoso,
donde há de vir a julgar os vivos e os mortos.
Creio no Espírito Santo,
na santa Igreja católica,
na comunhão dos santos,
na remissão dos pecados,
na ressurreição da carne,
na vida eterna.
Amém.`
  },
  {
    id: "sao-miguel",
    title: "Oração a São Miguel Arcanjo",
    subtitle: "Poderosa oração de proteção e libertação",
    latinTitle: "Sancte Michael Archangele",
    category: "protecao",
    origin: "Papa Leão XIII (1886)",
    text: `São Miguel Arcanjo,
defendei-nos no combate,
sede o nosso refúgio contra as maldades e ciladas do demônio.
Ordene-lhe Deus, instantemente o pedimos,
e vós, príncipe da milícia celeste,
pelo divino poder,
precipitai no inferno a Satanás
e a todos os espíritos malignos,
que andam pelo mundo para perder as almas.
Amém.`
  },
  {
    id: "santo-anjo",
    title: "Santo Anjo do Senhor",
    subtitle: "Invocação ao Santo Anjo da Guarda",
    latinTitle: "Angele Dei",
    category: "protecao",
    origin: "Tradição Católica",
    text: `Santo Anjo do Senhor,
meu zeloso guardador,
se a ti me confiou a piedade divina,
sempre me rege, me guarde,
me governe, me ilumine.
Amém.`
  },
  {
    id: "sao-bento",
    title: "Oração da Cruz de São Bento",
    subtitle: "Proteção contra todas as forças do maligno",
    latinTitle: "Crux Sacra Sit Mihi Lux",
    category: "protecao",
    origin: "Medalha e Tradição Beneditina",
    text: `A Cruz Sagrada seja a minha luz,
não seja o dragão meu guia.
Retira-te, Satanás!
Nunca me aconselhes coisas vãs.
É mau o que tu me ofereces,
bebe tu mesmo o teu veneno!
Paz.`
  },
  {
    id: "sao-francisco",
    title: "Oração de São Francisco",
    subtitle: "Instrumento de paz, esperança e amor",
    category: "santos",
    origin: "Espiritualidade Franciscana",
    text: `Senhor, fazei-me instrumento de vossa paz.
Onde houver ódio, que eu leve o amor;
Onde houver ofensa, que eu leve o perdão;
Onde houver discórdia, que eu leve a união;
Onde houver dúvida, que eu leve a fé;
Onde houver erro, que eu leve a verdade;
Onde houver desespero, que eu leve a esperança;
Onde houver tristeza, que eu leve a alegria;
Onde houver trevas, que eu leve a luz.

Ó Mestre, fazei que eu procure mais
Consolar, que ser consolado;
Compreender, que ser compreendido;
Amar, que ser amado.
Pois é dando que se recebe,
É perdoando que se é perdoado,
E é morrendo que se vive para a vida eterna.
Amém.`
  },
  {
    id: "espirito-santo",
    title: "Vinde, Espírito Santo",
    subtitle: "Invocação aos sete dons do Paráclito",
    latinTitle: "Veni Sancte Spiritus",
    category: "fundamentais",
    origin: "Liturgia de Pentecostes",
    text: `Vinde, Espírito Santo,
enchei os corações dos vossos fiéis
e acendei neles o fogo do vosso amor.
Enviai o vosso Espírito e tudo será criado,
e renovareis a face da terra.

Oremos: Ó Deus, que instruístes os corações dos vossos fiéis
com a luz do Espírito Santo,
fazei que apreciemos retamente todas as coisas
segundo o mesmo Espírito
e gozemos sempre da sua consolação.
Por Cristo, Senhor Nosso.
Amém.`
  }
];

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

export default function Catolicismo() {
  const [activeTab, setActiveTab] = useState<"oracoes" | "terco" | "sacramentos">("oracoes");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerItem>(prayersList[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeMystery, setActiveMystery] = useState<string>("gozosos");

  const filteredPrayers = categoryFilter === "todas" 
    ? prayersList 
    : prayersList.filter(p => p.category === categoryFilter);

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
            compreender os Santos Sacramentos e alimentar a comunhão diária com a Igreja de Cristo.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
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
          </div>
        </div>
      </div>

      {/* TAB 1: ORAÇÕES TRADICIONAIS */}
      {activeTab === "oracoes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of prayers (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
              {[
                { id: "todas", label: "Todas" },
                { id: "fundamentais", label: "Básicas" },
                { id: "marianas", label: "Marianas" },
                { id: "protecao", label: "Proteção" },
                { id: "santos", label: "Santos" },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                    categoryFilter === cat.id 
                      ? "bg-amber/20 text-amber border border-amber/30" 
                      : "text-pearl/50 hover:text-pearl"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredPrayers.map((prayer) => (
                <button
                  key={prayer.id}
                  onClick={() => setSelectedPrayer(prayer)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                    selectedPrayer.id === prayer.id
                      ? "bg-amber/15 border-amber/40 shadow-lg text-pearl"
                      : "bg-white/5 border-white/5 hover:border-amber/20 text-pearl/70 hover:text-pearl"
                  )}
                >
                  <div>
                    <h3 className="font-bold text-sm text-pearl flex items-center gap-2">
                      {prayer.title}
                      {prayer.latinTitle && (
                        <span className="text-[10px] text-pearl/40 font-serif italic">
                          ({prayer.latinTitle})
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-pearl/50 mt-0.5 line-clamp-1">
                      {prayer.subtitle}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    selectedPrayer.id === prayer.id ? "text-amber translate-x-1" : "text-pearl/20 group-hover:text-amber"
                  )} />
                </button>
              ))}
            </div>
          </div>

          {/* Prayer View (7 cols) */}
          <div className="lg:col-span-7">
            <div className="glow-card p-8 rounded-3xl border-amber/20 space-y-6">
              <div className="flex items-start justify-between border-b border-white/10 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber/20 text-amber">
                      {selectedPrayer.category}
                    </span>
                    {selectedPrayer.origin && (
                      <span className="text-[11px] text-pearl/40 italic">
                        {selectedPrayer.origin}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-pearl mt-2">
                    {selectedPrayer.title}
                  </h2>
                  {selectedPrayer.latinTitle && (
                    <p className="text-xs text-amber/80 font-serif italic mt-0.5">
                      Latim: {selectedPrayer.latinTitle}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(selectedPrayer.text)}
                  className="p-3 bg-white/5 hover:bg-amber/20 text-pearl hover:text-amber rounded-2xl border border-white/10 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Copiar oração"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>

              {/* Prayer text with devout typography */}
              <div className="bg-white/5 p-6 rounded-2xl border border-amber/10 paper-texture">
                <p className="text-base md:text-lg font-serif text-pearl/90 leading-relaxed whitespace-pre-line italic">
                  {selectedPrayer.text}
                </p>
              </div>

              {/* Devotional quote */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber/5 border border-amber/10 text-xs text-pearl/60">
                <Sparkles className="w-5 h-5 text-amber shrink-0" />
                <span>
                  "A oração é o encontro da sede de Deus com a nossa sede. Deus tem sede de que nós tenhamos sede Dele." — Catecismo da Igreja Católica, §2560
                </span>
              </div>
            </div>
          </div>
        </div>
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

      {/* TAB 3: OS 7 SACRAMENTOS */}
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
    </div>
  );
}
