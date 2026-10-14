import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cross, Sparkles, BookOpen, Heart, Volume2, VolumeX, Copy, Check, 
  Calendar, Star, Shield, ArrowRight, RotateCcw, CheckCircle2, Circle, Flame, Compass, X, BookmarkCheck,
  AlertCircle, RefreshCw
} from "lucide-react";
import { cn } from "../../lib/utils";
import { callGeminiProxy } from "../../services/aiUtils";
import { playNativeTTS, stopNativeTTS } from "../../services/audioService";

export interface CatholicPlanDay {
  diaNumero: number;
  tema: string;
  invocacaoOuJaculatoria: string;
  leituraBiblica: {
    livro: string;
    referencia: string;
    textoVersiculo: string;
    meditacaoLectio: string;
  };
  praticaCatolica: {
    tipo: string;
    instrucao: string;
    detalhes?: string;
  };
  oracaoGuiada: string;
  gestoConcreto: string;
  concluido: boolean;
}

export interface CatholicSpiritualPlanData {
  id: string;
  dataCriacao: string;
  titulo: string;
  resumoTeologico: string;
  dificuldadesInformadas: string;
  santoPatrono: {
    nome: string;
    motivo: string;
    oracaoIntercessao: string;
    festa?: string;
    citacao?: string;
  };
  virtudeFoco: string;
  conselhoSacramental: string;
  dias: CatholicPlanDay[];
  duracaoDias: number;
  praticasEscolhidas: string[];
}

const COMMON_DIFFICULTIES = [
  "Ansiedade, medo e inquietação profunda",
  "Tentação recorrente e fraqueza contra o pecado",
  "Tibieza, frieza e falta de constância na oração",
  "Luto, sofrimento e dor no coração",
  "Dúvidas de fé e escrúpulos de consciência",
  "Dificuldade de perdoar e guardar mágoas",
  "Desânimo espiritual, cansaço e preguiça (Acídia)",
  "Conflitos familiares e no relacionamento",
  "Busca por discernimento vocacional ou decisão difícil",
  "Solidão e vazio interior",
  "Falta de paciência e irritabilidade",
  "Sobrecarga de trabalho e mente agitada"
];

const CATHOLIC_PRACTICES = [
  { id: "terco", label: "Santo Terço", icon: Sparkles, desc: "Meditação dos Santos Mistérios (Gozosos, Dolorosos, Gloriosos, Luminosos)" },
  { id: "biblia", label: "Bíblia Católica (73 Livros)", icon: BookOpen, desc: "Lectio Divina com ênfase nos livros sapienciais e evangelhos" },
  { id: "santos", label: "Intercessão dos Santos", icon: Star, desc: "Orações dos Santos Padres, Doutores e patronos da causa" },
  { id: "sacramentos", label: "Vida Sacramental", icon: Cross, desc: "Exame de consciência para Confissão e Adoração Eucarística" },
  { id: "oracoes_tradicionais", label: "Orações Tradicionais", icon: Shield, desc: "São Miguel Arcanjo, Salve Rainha, Angelus e Jaculatórias" },
  { id: "obras_caridade", label: "Penitência & Caridade", icon: Heart, desc: "Pequenos jejuns, renúncias de amor e obras de misericórdia" }
];

const STORAGE_ACTIVE_PLAN_KEY = "catholic_spiritual_plan_active_v1";
const STORAGE_HISTORY_PLAN_KEY = "catholic_spiritual_plan_history_v1";

export default function CatholicSpiritualPlan() {
  // Input Form State
  const [difficultiesText, setDifficultiesText] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [selectedPractices, setSelectedPractices] = useState<string[]>([
    "terco", "biblia", "santos", "sacramentos"
  ]);
  const [dailyTime, setDailyTime] = useState<string>("moderado"); // rapido, moderado, profundo
  const [preferredMoment, setPreferredMoment] = useState<string>("livre"); // manha, tarde, noite, livre
  const [pastoralTone, setPastoralTone] = useState<string>("acolhedor"); // acolhedor, fortaleza, contemplativo

  // Plan State
  const [activePlan, setActivePlan] = useState<CatholicSpiritualPlanData | null>(null);
  const [planHistory, setPlanHistory] = useState<CatholicSpiritualPlanData[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio & Interactive UI State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showImmersivePrayer, setShowImmersivePrayer] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved plan on mount
  useEffect(() => {
    try {
      const savedActive = localStorage.getItem(STORAGE_ACTIVE_PLAN_KEY);
      if (savedActive) {
        const parsed = JSON.parse(savedActive);
        setActivePlan(parsed);
      }
      const savedHistory = localStorage.getItem(STORAGE_HISTORY_PLAN_KEY);
      if (savedHistory) {
        setPlanHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Erro ao carregar plano espiritual católico:", e);
    }
  }, []);

  // Save active plan whenever it changes
  const savePlanState = (plan: CatholicSpiritualPlanData) => {
    setActivePlan(plan);
    try {
      localStorage.setItem(STORAGE_ACTIVE_PLAN_KEY, JSON.stringify(plan));
      // update history entry if present
      const updatedHistory = planHistory.map(p => p.id === plan.id ? plan : p);
      if (!updatedHistory.find(p => p.id === plan.id)) {
        updatedHistory.unshift(plan);
      }
      setPlanHistory(updatedHistory);
      localStorage.setItem(STORAGE_HISTORY_PLAN_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Erro ao salvar plano:", e);
    }
  };

  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      setSelectedChips(selectedChips.filter(c => c !== chip));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  const togglePractice = (practiceId: string) => {
    if (selectedPractices.includes(practiceId)) {
      if (selectedPractices.length === 1) return; // manter ao menos uma
      setSelectedPractices(selectedPractices.filter(p => p !== practiceId));
    } else {
      setSelectedPractices([...selectedPractices, practiceId]);
    }
  };

  // Generate Plan via Gemini AI
  const handleGeneratePlan = async () => {
    const combinedDifficulties = [
      ...selectedChips,
      difficultiesText.trim()
    ].filter(Boolean).join(". ");

    if (!combinedDifficulties.trim()) {
      setErrorMsg("Por favor, selecione ao menos uma dificuldade ou descreva o que você está vivenciando.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    const statusInterval = setInterval(() => {
      const messages = [
        "Apresentando suas intenções diante da Tradição da Igreja...",
        "Consultando as Sagradas Escrituras e os livros sapienciais católicos...",
        "Invocando a intercessão de Santos e Doutores adequados ao seu combate...",
        "Estruturando os passos da Lectio Divina e Santo Terço...",
        "Compondo as orações guiadas e gestos concretos de amor...",
      ];
      setLoadingStatusText(messages[Math.floor(Math.random() * messages.length)]);
    }, 2800);

    setLoadingStatusText("Invocando a graça do Espírito Santo e a Sabedoria de Deus...");

    try {
      const systemInstruction = `Você é um diretor espiritual e teólogo católico de profunda sabedoria, piedade, amor à Tradição da Igreja, fidelidade ao Magistério, Santo Rosário, Bíblia Católica (cânon de 73 livros, incluindo Tobias, Judite, Sabedoria, Eclesiástico/Sirácida, Baruque, 1 e 2 Macabeus) e aos Santos Doutores da Igreja.
Sua missão é formular um PLANO ESPIRITUAL CATÓLICO PERSONALIZADO E EXTREMAMENTE RICO para o fiel que apresentou suas lutas, sofrimentos ou dificuldades.
Você SEMPRE responde em JSON estrito (sem delimitadores de código markdown desnecessários) com a seguinte estrutura de dados exata:
{
  "titulo": "string com um título nobre e consolador (ex: Setenário da Fortaleza e Paz Interior sob o Manto da Virgem Maria)",
  "resumoTeologico": "string com 2 a 3 parágrafos de acolhimento pastoral, esperança cristã e sabedoria católica sobre a causa informada",
  "santoPatrono": {
    "nome": "string com o Santo ou Doutor da Igreja escolhido como intercessor especial",
    "motivo": "string explicando a ligação espiritual desse Santo com a dor relatada",
    "oracaoIntercessao": "string com uma oração tradicional ou jaculatória ao santo",
    "festa": "string com o dia da festa litúrgica do santo",
    "citacao": "string com uma citação célebre do santo"
  },
  "virtudeFoco": "string com a virtude católica primordial a cultivar (ex: Confiança Filial, Paciência Heroica, Castidade, Mansidão, Fortaleza)",
  "conselhoSacramental": "string com orientações católicas práticas sobre o Sacramento da Reconciliação (Confissão) e a Sagrada Eucaristia / Adoração ao Santíssimo para vencer essa dificuldade",
  "dias": [
    {
      "diaNumero": 1,
      "tema": "string com o tema espiritual do dia",
      "invocacaoOuJaculatoria": "string com invocação ao Espírito Santo ou jaculatória católica",
      "leituraBiblica": {
        "livro": "string com o livro bíblico católico (dê preferência aos Salmos, Evangelhos e livros deuterocanônicos como Sabedoria, Eclesiástico, Tobias quando propício)",
        "referencia": "string com capítulo e versículo (ex: Eclesiástico 2:1-5)",
        "textoVersiculo": "string com o texto bíblico em português católico fiel",
        "meditacaoLectio": "string com roteiro de Lectio Divina (Leitura, Meditação no coração, Oração a Deus e Contemplação)"
      },
      "praticaCatolica": {
        "tipo": "string (ex: Santo Terço - Mistérios Dolorosos, Oração a São Miguel, Exame de Consciência Ignaciano)",
        "instrucao": "string com o que fazer passo a passo de forma prática",
        "detalhes": "string adicional com jaculatória ou versículo"
      },
      "oracaoGuiada": "string com uma oração linda, fervorosa e comovente para o fiel rezar em voz alta ou em silêncio com palavras pessoais para entregar sua fraqueza a Deus",
      "gestoConcreto": "string com uma ação palpável de caridade, perdão, renúncia ou generosidade naquele dia"
    }
  ]
}
Gere exatamente a quantidade de dias solicitada (${durationDays} dias). O tom deve ser ${pastoralTone}. Todas as referências devem ser teologicamente corretas, católicas e com extrema beleza espiritual.`;

      const promptUser = `Por favor, crie meu Plano Espiritual Católico Personalizado com as seguintes especificações:
- Minhas dificuldades e combates espirituais: "${combinedDifficulties}"
- Duração do plano: exatamente ${durationDays} dias
- Práticas católicas de minha preferência: ${selectedPractices.join(", ")}
- Tempo diário disponível: ${dailyTime} (aprox. ${dailyTime === "rapido" ? "10-15 min" : dailyTime === "moderado" ? "20-30 min" : "40+ min"})
- Momento do dia preferido: ${preferredMoment}
- Tom espiritual: ${pastoralTone}

Gere o plano completo com riqueza teológica, afeto cristão e todos os ${durationDays} dias detalhados com Lectio Divina, leitura bíblica católica, oração guiada e práticas devocionais.`;

      const aiResponse = await callGeminiProxy({
        prompt: promptUser,
        systemInstruction,
        responseMimeType: "application/json",
      });

      clearInterval(statusInterval);

      // Clean response text if it has markdown formatting
      let cleanedJson = aiResponse.trim();
      if (cleanedJson.startsWith("```json")) {
        cleanedJson = cleanedJson.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsedData = JSON.parse(cleanedJson);

      const newPlan: CatholicSpiritualPlanData = {
        id: `plan-${Date.now()}`,
        dataCriacao: new Date().toLocaleDateString("pt-BR"),
        titulo: parsedData.titulo || "Plano Espiritual Católico",
        resumoTeologico: parsedData.resumoTeologico || "",
        dificuldadesInformadas: combinedDifficulties,
        santoPatrono: parsedData.santoPatrono || {
          nome: "São José",
          motivo: "Protetor das almas nos momentos de aflição e silêncio interior",
          oracaoIntercessao: "São José, terror dos demônios e modelo de oração, rogai por nós!"
        },
        virtudeFoco: parsedData.virtudeFoco || "Fortaleza e Confiança na Divina Providência",
        conselhoSacramental: parsedData.conselhoSacramental || "Procure o Sacramento da Penitência para receber o perdão e o alívio das culpas.",
        dias: (parsedData.dias || []).map((d: any, idx: number) => ({
          diaNumero: d.diaNumero || (idx + 1),
          tema: d.tema || `Dia ${idx + 1}`,
          invocacaoOuJaculatoria: d.invocacaoOuJaculatoria || "Vinde, Espírito Santo, enchei os corações dos vossos fiéis.",
          leituraBiblica: d.leituraBiblica || {
            livro: "Salmos",
            referencia: "Salmo 23",
            textoVersiculo: "O Senhor é o meu pastor, nada me faltará.",
            meditacaoLectio: "Medite na bondade de Deus que guia seus passos nas veredas escuras."
          },
          praticaCatolica: d.praticaCatolica || {
            tipo: "Santo Terço",
            instrucao: "Reze uma dezena do Santo Terço com o coração contrito."
          },
          oracaoGuiada: d.oracaoGuiada || "Senhor Jesus Cristo, Filho de Deus vivo, tende piedade de mim, que sou pecador.",
          gestoConcreto: d.gestoConcreto || "Faça um ato voluntário de caridade e silêncio hoje.",
          concluido: false
        })),
        duracaoDias: durationDays,
        praticasEscolhidas: selectedPractices
      };

      savePlanState(newPlan);
      setSelectedDayIndex(0);

    } catch (err: any) {
      clearInterval(statusInterval);
      console.error("Falha ao gerar plano espiritual católico:", err);
      setErrorMsg(err.message || "Houve uma falha ao comunicar com o orientador espiritual católico. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle completion of a day
  const toggleDayCompletion = (dayIndex: number) => {
    if (!activePlan) return;
    const updatedDays = [...activePlan.dias];
    updatedDays[dayIndex].concluido = !updatedDays[dayIndex].concluido;
    const updatedPlan = { ...activePlan, dias: updatedDays };
    savePlanState(updatedPlan);
  };

  // Audio TTS for prayer
  const handlePlayTTS = async (text: string) => {
    if (isPlayingAudio) {
      stopNativeTTS();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    try {
      // First try backend Edge TTS
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.slice(0, 800), // reasonable size for single prayer
          voice: "pt-BR-FranciscaNeural"
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlayingAudio(false);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          audioRef.current = null;
        };
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn("Backend TTS indisponível, usando fala nativa do navegador:", e);
    }

    // Fallback to Native TTS
    try {
      await playNativeTTS(
        text,
        "",
        1.0,
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyEntirePlan = () => {
    if (!activePlan) return;
    let fullText = `*${activePlan.titulo}*\n`;
    fullText += `Santo Patrono: ${activePlan.santoPatrono.nome} - Virtude Central: ${activePlan.virtudeFoco}\n\n`;
    fullText += `${activePlan.resumoTeologico}\n\n`;
    activePlan.dias.forEach((dia) => {
      fullText += `--- DIA ${dia.diaNumero}: ${dia.tema} ---\n`;
      fullText += `Jaculatória: ${dia.invocacaoOuJaculatoria}\n`;
      fullText += `Leitura Bíblica: ${dia.leituraBiblica.livro} (${dia.leituraBiblica.referencia})\n"${dia.leituraBiblica.textoVersiculo}"\n`;
      fullText += `Prática: ${dia.praticaCatolica.tipo} - ${dia.praticaCatolica.instrucao}\n`;
      fullText += `Oração: ${dia.oracaoGuiada}\n`;
      fullText += `Gesto Concreto: ${dia.gestoConcreto}\n\n`;
    });
    fullText += `Conselho Sacramental: ${activePlan.conselhoSacramental}\n`;
    handleCopyText(fullText);
  };

  const currentDay = activePlan?.dias[selectedDayIndex];
  const completedDaysCount = activePlan?.dias.filter(d => d.concluido).length || 0;
  const progressPercent = activePlan ? Math.round((completedDaysCount / activePlan.dias.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-gradient-to-br from-amber/15 via-navy-light/60 to-navy p-6 md:p-8 rounded-3xl border border-amber/30 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Cross className="w-56 h-56 text-amber" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber/20 border border-amber/40 text-amber text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Orientação Espiritual Católica por IA
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-pearl/70 text-xs">
              Santo Rosário & Bíblia (73 Livros)
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-bold text-pearl">
            Plano de Oração & Leitura Personalizado
          </h2>
          <p className="text-pearl/75 text-sm md:text-base max-w-3xl leading-relaxed">
            Abra seu coração diante de Deus: selecione suas dificuldades, provações ou dores, e indique suas preferências 
            de oração e tempo. A inteligência pastoral elaborará um itinerário católico sob medida com passagens bíblicas, 
            meditação dos Santos, práticas devocionais e orações comoventes para o seu dia a dia.
          </p>

          {activePlan && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  const element = document.getElementById("active-plan-section");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-4 py-2 rounded-xl bg-amber text-navy font-bold text-xs flex items-center gap-2 hover:bg-amber-light transition shadow-md"
              >
                <BookmarkCheck className="w-4 h-4" />
                Continuar Meu Plano Ativo ({progressPercent}% concluído)
              </button>
              {planHistory.length > 1 && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-pearl font-medium text-xs flex items-center gap-2 transition border border-white/10"
                >
                  <Calendar className="w-4 h-4 text-amber" />
                  Ver Histórico ({planHistory.length} planos)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PLAN GENERATOR FORM */}
      <div className="glow-card border-white/10 bg-navy-light/40 p-6 md:p-8 rounded-3xl space-y-8 backdrop-blur-sm">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-lg md:text-xl font-bold text-pearl flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber" />
            1. Suas Dificuldades & Aflições Espirituais
          </h3>
          <p className="text-pearl/60 text-xs md:text-sm mt-1">
            Selecione as lutas que você está enfrentando ou descreva com suas próprias palavras para a IA acolher com ternura pastoral.
          </p>
        </div>

        {/* Quick Difficulty Chips */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-amber block">
            Toque para selecionar os desafios que você está vivenciando:
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_DIFFICULTIES.map((diff) => {
              const isSelected = selectedChips.includes(diff);
              return (
                <button
                  key={diff}
                  onClick={() => toggleChip(diff)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border text-left",
                    isSelected
                      ? "bg-amber text-navy border-amber font-bold shadow-md scale-[1.02]"
                      : "bg-white/5 text-pearl/80 border-white/10 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Cross className="w-3 h-3 text-amber shrink-0" />}
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-pearl/80 flex items-center justify-between">
            <span>Detalhes Pessoais (Opcional - Fale com o coração):</span>
            <span className="text-[11px] text-pearl/50 lowercase">confidencial e seguro</span>
          </label>
          <textarea
            value={difficultiesText}
            onChange={(e) => setDifficultiesText(e.target.value)}
            rows={4}
            placeholder="Exemplo: Ultimamente ando muito angustiado com meu trabalho e com medo do futuro. Sinto frieza ao rezar o Terço e acabo cedendo à irritação com minha família. Preciso de paz interior e fortaleza para recomeçar..."
            className="w-full bg-navy/80 border border-white/10 rounded-2xl p-4 text-pearl placeholder:text-pearl/40 focus:outline-none focus:border-amber transition text-sm leading-relaxed"
          />
        </div>

        {/* SECTION 2: PREFERENCES */}
        <div className="border-t border-white/10 pt-6 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg md:text-xl font-bold text-pearl flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber" />
              2. Suas Preferências de Práticas Católicas
            </h3>
            <p className="text-pearl/60 text-xs md:text-sm mt-1">
              Personalize o formato do seu itinerário oracional para encaixar perfeitamente em sua rotina diária.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-amber block">
                Duração da Caminhada:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { days: 3, label: "3 Dias", sub: "Tríduo Intensivo" },
                  { days: 7, label: "7 Dias", sub: "Semana de Graça (Padrão)" },
                  { days: 9, label: "9 Dias", sub: "Novena Guiada" },
                  { days: 14, label: "14 Dias", sub: "Caminho das Virtudes" },
                ].map(opt => (
                  <button
                    key={opt.days}
                    onClick={() => setDurationDays(opt.days)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all",
                      durationDays === opt.days
                        ? "bg-amber/20 border-amber text-pearl shadow-md ring-1 ring-amber"
                        : "bg-white/5 border-white/10 text-pearl/70 hover:bg-white/10"
                    )}
                  >
                    <div className="font-bold text-sm text-pearl flex items-center justify-between">
                      {opt.label}
                      {durationDays === opt.days && <Check className="w-4 h-4 text-amber" />}
                    </div>
                    <div className="text-[11px] text-pearl/60 mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Time & Moment */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-amber block">
                  Tempo Diário Disponível:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "rapido", label: "10-15 min", sub: "Breve" },
                    { id: "moderado", label: "20-30 min", sub: "Ideal" },
                    { id: "profundo", label: "40+ min", sub: "Contemplativo" }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setDailyTime(t.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all",
                        dailyTime === t.id
                          ? "bg-amber/20 border-amber text-pearl ring-1 ring-amber"
                          : "bg-white/5 border-white/10 text-pearl/70 hover:bg-white/10"
                      )}
                    >
                      <div className="font-bold text-xs">{t.label}</div>
                      <div className="text-[10px] text-pearl/50">{t.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-amber block">
                  Momento do Dia Preferido:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "manha", label: "Manhã" },
                    { id: "tarde", label: "Tarde" },
                    { id: "noite", label: "Noite" },
                    { id: "livre", label: "Flexível" }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPreferredMoment(m.id)}
                      className={cn(
                        "py-2 px-1 rounded-xl border text-center text-xs font-medium transition",
                        preferredMoment === m.id
                          ? "bg-amber text-navy font-bold border-amber"
                          : "bg-white/5 border-white/10 text-pearl/70 hover:bg-white/10"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Catholic Practices Multi-Select */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber block">
              Práticas e Devoções Católicas que Deseja Incluir:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {CATHOLIC_PRACTICES.map((practice) => {
                const Icon = practice.icon;
                const isSelected = selectedPractices.includes(practice.id);
                return (
                  <button
                    key={practice.id}
                    onClick={() => togglePractice(practice.id)}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3",
                      isSelected
                        ? "bg-amber/15 border-amber text-pearl shadow-md ring-1 ring-amber/50"
                        : "bg-white/5 border-white/10 text-pearl/60 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl mt-0.5",
                      isSelected ? "bg-amber text-navy font-bold" : "bg-white/10 text-pearl/60"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-pearl flex items-center justify-between">
                        <span>{practice.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber" />}
                      </div>
                      <div className="text-[11px] text-pearl/60 line-clamp-2 mt-0.5">
                        {practice.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pastoral Style */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-amber block">
              Tom Teológico do Plano:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "acolhedor", title: "Acolhedor & Pastoral", desc: "Misericórdia, consolo e amor do Bom Pastor" },
                { id: "fortaleza", title: "Combate & Fortaleza", desc: "Vigilância, coragem e superação das tentações" },
                { id: "contemplativo", title: "Monástico & Silencioso", desc: "Lectio Divina profunda, recolhimento e paz" }
              ].map(tone => (
                <button
                  key={tone.id}
                  onClick={() => setPastoralTone(tone.id)}
                  className={cn(
                    "p-3 rounded-2xl border text-left transition",
                    pastoralTone === tone.id
                      ? "bg-amber/20 border-amber text-pearl ring-1 ring-amber"
                      : "bg-white/5 border-white/10 text-pearl/70 hover:bg-white/10"
                  )}
                >
                  <div className="font-bold text-xs text-pearl">{tone.title}</div>
                  <div className="text-[11px] text-pearl/60 mt-0.5">{tone.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-white/10">
          <div className="text-xs text-pearl/60 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber" />
            Em comunhão com as Escrituras, a Tradição e o Magistério Católico.
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className={cn(
              "w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xl",
              loading
                ? "bg-amber/50 text-navy cursor-not-allowed"
                : "bg-amber hover:bg-amber-light text-navy scale-100 hover:scale-105 active:scale-95 shadow-amber/20"
            )}
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Formulando Plano Espiritual...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Gerar Meu Plano Espiritual Católico (IA)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Loading Progress State */}
        {loading && (
          <div className="p-6 rounded-2xl bg-amber/10 border border-amber/30 text-center space-y-3 animate-pulse">
            <div className="flex justify-center">
              <Cross className="w-8 h-8 text-amber animate-bounce" />
            </div>
            <div className="text-pearl font-bold text-sm">
              {loadingStatusText}
            </div>
            <p className="text-pearl/60 text-xs max-w-md mx-auto">
              A inteligência pastoral está formulando suas orações, selecionando passagens bíblicas católicas e estruturando cada dia com carinho espiritual.
            </p>
          </div>
        )}
      </div>

      {/* ACTIVE PLAN DISPLAY */}
      {activePlan && (
        <div id="active-plan-section" className="space-y-6 pt-4">
          {/* Plan Header Card */}
          <div className="glow-card border-amber/40 bg-gradient-to-br from-navy via-navy-light to-navy p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-amber text-navy font-bold text-xs uppercase tracking-wider">
                    Plano Ativo
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-pearl/80 text-xs">
                    {activePlan.duracaoDias} Dias de Oração
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-pearl/80 text-xs">
                    Criado em {activePlan.dataCriacao}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-pearl">
                  {activePlan.titulo}
                </h3>
              </div>

              {/* Progress badge */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                <div className="space-y-1 text-right">
                  <div className="text-xs text-pearl/60">Progresso Geral</div>
                  <div className="font-bold text-amber text-lg">
                    {completedDaysCount} de {activePlan.dias.length} dias ({progressPercent}%)
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-amber/30 flex items-center justify-center font-bold text-xs text-amber bg-amber/10">
                  {progressPercent}%
                </div>
              </div>
            </div>

            {/* Theological Pastoral Guidance & Patron Saint */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="md:col-span-2 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Diagnóstico Espiritual & Consolo Pastoral:
                </div>
                <p className="text-pearl/80 text-sm leading-relaxed whitespace-pre-line">
                  {activePlan.resumoTeologico}
                </p>

                {activePlan.conselhoSacramental && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 mt-4 text-xs text-pearl/75 flex items-start gap-2.5">
                    <Cross className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-pearl block mb-0.5">Conselho para a Confissão & Eucaristia:</strong>
                      {activePlan.conselhoSacramental}
                    </div>
                  </div>
                )}
              </div>

              {/* Patron Saint Card */}
              <div className="p-5 rounded-2xl bg-amber/10 border border-amber/30 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-amber text-xs font-bold uppercase tracking-wider">
                    <Star className="w-4 h-4" />
                    Santo Intercessor do Plano
                  </div>
                  <h4 className="font-bold text-pearl text-base">
                    {activePlan.santoPatrono.nome}
                  </h4>
                  {activePlan.santoPatrono.festa && (
                    <div className="text-[11px] text-pearl/60">
                      Festa Litúrgica: {activePlan.santoPatrono.festa}
                    </div>
                  )}
                  <p className="text-xs text-pearl/75 leading-relaxed">
                    {activePlan.santoPatrono.motivo}
                  </p>
                  {activePlan.santoPatrono.citacao && (
                    <blockquote className="border-l-2 border-amber pl-2 text-xs italic text-pearl/70 pt-1">
                      "{activePlan.santoPatrono.citacao}"
                    </blockquote>
                  )}
                </div>

                <div className="pt-2 border-t border-amber/20">
                  <div className="text-[11px] font-bold text-amber mb-1">Virtude em Foco:</div>
                  <div className="text-xs font-semibold text-pearl bg-navy/60 px-2.5 py-1.5 rounded-xl border border-amber/20">
                    {activePlan.virtudeFoco}
                  </div>
                </div>
              </div>
            </div>

            {/* Days Horizontal Navigator */}
            <div className="pt-8 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-pearl/80">
                <span>Roteiro Dia a Dia:</span>
                <span className="text-amber">Clique em um dia para rezar</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {activePlan.dias.map((dia, idx) => {
                  const isSelected = selectedDayIndex === idx;
                  return (
                    <button
                      key={dia.diaNumero}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={cn(
                        "px-4 py-3 rounded-2xl border text-left shrink-0 transition-all flex items-center gap-3 min-w-[150px]",
                        isSelected
                          ? "bg-amber text-navy font-bold border-amber shadow-lg scale-105"
                          : dia.concluido
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                          : "bg-white/5 border-white/10 text-pearl/70 hover:bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        isSelected
                          ? "bg-navy text-amber"
                          : dia.concluido
                          ? "bg-emerald-500 text-navy"
                          : "bg-white/10 text-pearl"
                      )}>
                        {dia.concluido ? <Check className="w-3.5 h-3.5" /> : dia.diaNumero}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">Dia {dia.diaNumero}</div>
                        <div className="text-[10px] opacity-75 truncate">{dia.tema}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ACTIVE DAY DETAILS CARD */}
          {currentDay && (
            <motion.div
              key={currentDay.diaNumero}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glow-card border-white/15 bg-navy-light/50 p-6 md:p-8 rounded-3xl space-y-6 backdrop-blur-sm shadow-xl"
            >
              {/* Day Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-amber text-xs font-bold uppercase tracking-wider">
                    <Calendar className="w-4 h-4" />
                    Dia {currentDay.diaNumero} de {activePlan.duracaoDias}
                  </div>
                  <h4 className="text-xl md:text-2xl font-display font-bold text-pearl mt-1">
                    {currentDay.tema}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDayCompletion(selectedDayIndex)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
                      currentDay.concluido
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-white/5 text-pearl/80 border-white/10 hover:bg-amber/20 hover:text-amber"
                    )}
                  >
                    {currentDay.concluido ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Dia Concluído
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        Marcar como Concluído
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowImmersivePrayer(true)}
                    className="px-4 py-2 rounded-xl bg-amber text-navy font-bold text-xs flex items-center gap-2 hover:bg-amber-light transition shadow-md"
                  >
                    <Flame className="w-4 h-4" />
                    Rezar Agora (Modo Focado)
                  </button>
                </div>
              </div>

              {/* Invocação / Jaculatória */}
              {currentDay.invocacaoOuJaculatoria && (
                <div className="p-4 rounded-2xl bg-amber/10 border border-amber/30 flex items-center gap-3">
                  <Flame className="w-5 h-5 text-amber shrink-0" />
                  <div className="text-xs md:text-sm text-pearl font-medium italic">
                    <span className="font-bold text-amber not-italic uppercase text-[11px] block">
                      Jaculatória de Abertura:
                    </span>
                    "{currentDay.invocacaoOuJaculatoria}"
                  </div>
                </div>
              )}

              {/* Lectio Divina & Bíblia Católica */}
              <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-pearl">
                    <BookOpen className="w-4 h-4 text-amber" />
                    <span>Leitura da Bíblia Católica & Lectio Divina</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber/10 border border-amber/30 text-amber text-xs font-bold">
                    {currentDay.leituraBiblica.livro} {currentDay.leituraBiblica.referencia}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-navy/80 border border-white/5 text-pearl/90 italic text-sm md:text-base leading-relaxed border-l-4 border-l-amber">
                  "{currentDay.leituraBiblica.textoVersiculo}"
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-pearl/70 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber" />
                    Passos da Meditação (Lectio Divina):
                  </div>
                  <p className="text-xs md:text-sm text-pearl/75 leading-relaxed">
                    {currentDay.leituraBiblica.meditacaoLectio}
                  </p>
                </div>
              </div>

              {/* Prática Católica do Dia */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber">
                  <Cross className="w-4 h-4" />
                  Prática Católica Recomendada:
                </div>
                <div className="font-bold text-pearl text-sm md:text-base">
                  {currentDay.praticaCatolica.tipo}
                </div>
                <p className="text-xs md:text-sm text-pearl/75 leading-relaxed">
                  {currentDay.praticaCatolica.instrucao}
                </p>
                {currentDay.praticaCatolica.detalhes && (
                  <div className="p-3 rounded-xl bg-navy/60 text-xs text-pearl/70 border border-white/5">
                    {currentDay.praticaCatolica.detalhes}
                  </div>
                )}
              </div>

              {/* Oração Guiada do Dia */}
              <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-amber/10 via-navy/90 to-navy border border-amber/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber">
                    <Heart className="w-4 h-4" />
                    Oração Guiada do Dia
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayTTS(currentDay.oracaoGuiada)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border",
                        isPlayingAudio
                          ? "bg-amber text-navy border-amber animate-pulse"
                          : "bg-white/10 hover:bg-white/15 text-pearl border-white/10"
                      )}
                    >
                      {isPlayingAudio ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          Parar Áudio
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-amber" />
                          Ouvir Oração
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyText(currentDay.oracaoGuiada)}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-pearl/70 hover:text-pearl transition border border-white/10"
                      title="Copiar Oração"
                    >
                      {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-pearl/90 text-sm md:text-base leading-relaxed whitespace-pre-line font-serif italic p-2">
                  {currentDay.oracaoGuiada}
                </div>
              </div>

              {/* Gesto Concreto */}
              {currentDay.gestoConcreto && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
                  <Heart className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Gesto Concreto & Obra de Misericórdia:
                    </div>
                    <div className="text-xs md:text-sm text-pearl/80">
                      {currentDay.gestoConcreto}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Between Days */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => setSelectedDayIndex(Math.max(0, selectedDayIndex - 1))}
                  disabled={selectedDayIndex === 0}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-pearl text-xs font-medium disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  ← Dia Anterior
                </button>

                <div className="text-xs text-pearl/60">
                  Dia {selectedDayIndex + 1} de {activePlan.dias.length}
                </div>

                <button
                  onClick={() => setSelectedDayIndex(Math.min(activePlan.dias.length - 1, selectedDayIndex + 1))}
                  disabled={selectedDayIndex === activePlan.dias.length - 1}
                  className="px-4 py-2 rounded-xl bg-amber text-navy font-bold text-xs hover:bg-amber-light disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  Próximo Dia →
                </button>
              </div>
            </motion.div>
          )}

          {/* Footer Actions */}
          <div className="p-6 rounded-3xl bg-navy-light/40 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-pearl/70">
              Seu progresso fica salvo automaticamente neste dispositivo.
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopyEntirePlan}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-pearl text-xs font-bold flex items-center gap-2 transition border border-white/10"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber" />}
                Copiar Todo o Plano
              </button>
              <button
                onClick={() => {
                  if (confirm("Deseja criar um novo plano espiritual? O atual continuará salvo no seu histórico.")) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-pearl text-xs font-bold flex items-center gap-2 transition border border-white/10"
              >
                <RotateCcw className="w-4 h-4 text-amber" />
                Criar Outro Plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMMERSIVE PRAYER MODAL */}
      <AnimatePresence>
        {showImmersivePrayer && currentDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 md:p-8 flex items-center justify-center overflow-y-auto"
          >
            <div className="glow-card border-amber/40 bg-gradient-to-b from-navy via-navy to-black max-w-2xl w-full p-6 md:p-8 rounded-3xl space-y-6 relative text-pearl shadow-2xl">
              {/* Close Button */}
              <button
                onClick={() => {
                  stopNativeTTS();
                  setIsPlayingAudio(false);
                  setShowImmersivePrayer(false);
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-pearl/70 hover:text-pearl transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Candle animation & header */}
              <div className="text-center space-y-2 pt-2">
                <div className="inline-flex p-3 rounded-full bg-amber/10 border border-amber/30 text-amber animate-pulse">
                  <Flame className="w-8 h-8" />
                </div>
                <div className="text-xs uppercase font-bold tracking-widest text-amber">
                  Em Nome do Pai, do Filho e do Espírito Santo. Amém.
                </div>
                <h3 className="text-xl md:text-2xl font-display font-bold">
                  {currentDay.tema} (Dia {currentDay.diaNumero})
                </h3>
              </div>

              {/* Scripture & Lectio */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-xs font-bold text-amber">
                  Palavra de Deus ({currentDay.leituraBiblica.livro} {currentDay.leituraBiblica.referencia}):
                </div>
                <div className="font-serif italic text-sm md:text-base leading-relaxed text-pearl/90">
                  "{currentDay.leituraBiblica.textoVersiculo}"
                </div>
              </div>

              {/* Prayer Text */}
              <div className="p-5 rounded-2xl bg-amber/10 border border-amber/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber">Oração do Coração</span>
                  <button
                    onClick={() => handlePlayTTS(currentDay.oracaoGuiada)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-amber text-navy flex items-center gap-1.5"
                  >
                    {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {isPlayingAudio ? "Pausar" : "Ouvir"}
                  </button>
                </div>
                <p className="font-serif italic text-base md:text-lg leading-relaxed text-pearl whitespace-pre-line">
                  {currentDay.oracaoGuiada}
                </p>
              </div>

              {/* Patron Saint Intercession */}
              {activePlan?.santoPatrono && (
                <div className="text-center text-xs text-pearl/70 italic border-t border-white/10 pt-4">
                  "{activePlan.santoPatrono.oracaoIntercessao}"
                </div>
              )}

              {/* Finish Day Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    toggleDayCompletion(selectedDayIndex);
                    setShowImmersivePrayer(false);
                    stopNativeTTS();
                    setIsPlayingAudio(false);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-amber hover:bg-amber-light text-navy font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Concluir Oração deste Dia
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HISTORY MODAL */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <div className="glow-card border-white/20 bg-navy max-w-xl w-full p-6 rounded-3xl space-y-4 relative text-pearl">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-pearl/70 hover:text-pearl transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold font-display text-pearl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber" />
                Histórico de Planos Salvos
              </h3>
              <p className="text-xs text-pearl/70">
                Alterne entre seus planos espirituais gerados anteriormente:
              </p>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {planHistory.map((item) => {
                  const completed = item.dias.filter(d => d.concluido).length;
                  const pct = Math.round((completed / item.dias.length) * 100);
                  const isCurrent = activePlan?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex items-center justify-between gap-3",
                        isCurrent
                          ? "bg-amber/15 border-amber ring-1 ring-amber"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-pearl truncate">{item.titulo}</div>
                        <div className="text-xs text-pearl/60">
                          {item.duracaoDias} dias • Criado em {item.dataCriacao} • {pct}% concluído
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActivePlan(item);
                          setSelectedDayIndex(0);
                          setShowHistoryModal(false);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition",
                          isCurrent
                            ? "bg-amber text-navy"
                            : "bg-white/10 hover:bg-white/20 text-pearl"
                        )}
                      >
                        {isCurrent ? "Ativo" : "Carregar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
