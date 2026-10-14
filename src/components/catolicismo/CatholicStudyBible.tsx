import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Sparkles, Volume2, VolumeX, Eye, Star, Cross, Shield, Heart, 
  Copy, Check, Search, Maximize2, ChevronRight, ChevronLeft, BookMarked, 
  ArrowRight, X, Layers, Flame, Info, Compass, HelpCircle, RefreshCw
} from "lucide-react";
import { cn } from "../../lib/utils";
import { 
  sacredArtCollection, 
  catholicKeyPassages, 
  catholicBookCategories, 
  patristicCommentariesSample, 
  SacredArtItem,
  CatholicTheologicalTopic,
  catholicStudyBibleImg
} from "../../data/catholicStudyData";
import { bibleBooks, BibleBook } from "../../constants/bibleData";
import { getBibleChapter } from "../../lib/bibleApi";
import { playNativeTTS, stopNativeTTS } from "../../services/audioService";
import { callGeminiProxy } from "../../services/aiUtils";
import deuterocanonicalDataRaw from "../../data/deuterocanonical.json";

const deuterocanonicalData = deuterocanonicalDataRaw as Record<string, any>;

interface VerseItem {
  v: number;
  t: string;
}

export default function CatholicStudyBible() {
  // Navigation tabs within Catholic Study Bible
  const [activeSubTab, setActiveSubTab] = useState<"leitor" | "galeria" | "doutrina" | "canon">("leitor");
  
  // Bible study state
  const [selectedBook, setSelectedBook] = useState<BibleBook>(() => {
    // Default to Tobias to highlight deuterocanonical richness, or Mateus
    return bibleBooks.find(b => b.name === "Tobias") || bibleBooks[0];
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<string>("MATOS");
  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [loadingVerses, setLoadingVerses] = useState<boolean>(false);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  
  // UI states
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(18);
  
  // AI Catholic Exegesis state
  const [aiExegesis, setAiExegesis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  
  // Visio Divina & Art Modal state
  const [activeArtModal, setActiveArtModal] = useState<SacredArtItem | null>(null);
  const [artFilter, setArtFilter] = useState<string>("todos");
  
  // Lectio Divina step state
  const [showLectioGuide, setShowLectioGuide] = useState<boolean>(false);
  const [activeLectioStep, setActiveLectioStep] = useState<number>(1);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopNativeTTS();
    };
  }, []);

  // Fetch verses whenever selectedBook, selectedChapter or selectedVersion changes
  useEffect(() => {
    let isMounted = true;
    async function loadChapterVerses() {
      setLoadingVerses(true);
      setAiExegesis(null);
      stopNativeTTS();
      setIsPlayingAudio(false);

      try {
        // If it's a deuterocanonical book, use the rich offline Catholic dataset first
        if (selectedBook.isDeuterocanonical && selectedBook.bollsId) {
          const bookData = deuterocanonicalData[String(selectedBook.bollsId)];
          if (bookData && bookData.chapters) {
            const ch = bookData.chapters.find((c: any) => c.chapter === selectedChapter);
            if (ch && ch.verses && ch.verses.length > 0) {
              if (isMounted) {
                setVerses(ch.verses);
                setLoadingVerses(false);
                return;
              }
            }
          }
        }

        // Standard fetch via Bolls API for Matos Soares or other translations
        const versionToUse = selectedVersion === "MATOS" ? "MATOS" : (selectedVersion === "CNBB" ? "MATOS" : selectedVersion);
        const fetchedVerses = await getBibleChapter(versionToUse, selectedBook.bollsId, selectedChapter);
        
        if (isMounted) {
          if (fetchedVerses && fetchedVerses.length > 0) {
            setVerses(fetchedVerses);
          } else {
            // Fallback for deuterocanonical if bolls returned empty
            if (selectedBook.bollsId && deuterocanonicalData[String(selectedBook.bollsId)]) {
              const bookData = deuterocanonicalData[String(selectedBook.bollsId)];
              const ch = bookData.chapters.find((c: any) => c.chapter === selectedChapter);
              setVerses(ch?.verses || []);
            } else {
              setVerses([]);
            }
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar capítulo:", err);
        // Fallback to deuterocanonical if available
        if (selectedBook.bollsId && deuterocanonicalData[String(selectedBook.bollsId)]) {
          const bookData = deuterocanonicalData[String(selectedBook.bollsId)];
          const ch = bookData.chapters.find((c: any) => c.chapter === selectedChapter);
          if (isMounted) setVerses(ch?.verses || []);
        } else {
          if (isMounted) setVerses([]);
        }
      } finally {
        if (isMounted) setLoadingVerses(false);
      }
    }

    loadChapterVerses();
    return () => {
      isMounted = false;
    };
  }, [selectedBook, selectedChapter, selectedVersion]);

  // Find sacred art related to current book
  const currentChapterArt = useMemo(() => {
    return sacredArtCollection.find(art => art.targetBook.toLowerCase() === selectedBook.name.toLowerCase());
  }, [selectedBook]);

  // Patristic commentary for current book & chapter
  const currentPatristic = useMemo(() => {
    const key = `${selectedBook.name} ${selectedChapter}`;
    if (patristicCommentariesSample[key]) return patristicCommentariesSample[key];
    // Return sample from book if exists
    const matchingKey = Object.keys(patristicCommentariesSample).find(k => k.startsWith(selectedBook.name));
    return matchingKey ? patristicCommentariesSample[matchingKey] : null;
  }, [selectedBook, selectedChapter]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return bibleBooks.filter(book => {
      const matchesSearch = book.name.toLowerCase().includes(bookSearchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedCategory === "todos") return true;
      if (selectedCategory === "deutero") return book.isDeuterocanonical;
      if (selectedCategory === "velho") return book.testament === "Velho" && !book.isDeuterocanonical;
      if (selectedCategory === "novo") return book.testament === "Novo";
      return true;
    });
  }, [bookSearchQuery, selectedCategory]);

  // Filtered sacred art
  const filteredArt = useMemo(() => {
    if (artFilter === "todos") return sacredArtCollection;
    return sacredArtCollection.filter(art => art.category === artFilter);
  }, [artFilter]);

  // Audio narration handler
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopNativeTTS();
      setIsPlayingAudio(false);
    } else {
      if (verses.length === 0) return;
      const fullText = `${selectedBook.name}, capítulo ${selectedChapter}. ` + 
        verses.map(v => `${v.v}. ${v.t}`).join(" ");
      setIsPlayingAudio(true);
      playNativeTTS(
        fullText,
        "",
        0.95,
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      ).catch(() => setIsPlayingAudio(false));
    }
  };

  // Copy verse
  const handleCopyVerse = (verseNum: number, text: string) => {
    const formatted = `"${text}" (${selectedBook.name} ${selectedChapter}:${verseNum} - Bíblia Católica)`;
    navigator.clipboard.writeText(formatted);
    setCopiedVerse(verseNum);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  // AI Catholic Exegesis generator
  const handleGenerateCatholicExegesis = async (specificVerse?: VerseItem) => {
    setLoadingAi(true);
    setShowAiModal(true);

    const passageText = specificVerse 
      ? `Versículo ${specificVerse.v}: "${specificVerse.t}"` 
      : `Capítulo completo de ${selectedBook.name} ${selectedChapter} (${verses.slice(0, 10).map(v => `${v.v}. ${v.t}`).join(" ")}...)`;

    const prompt = `Você é um biblista católico fiel ao Magistério da Igreja Católica, especialista em Patrística (Padres da Igreja), Concílios Ecumênicos e no Catecismo da Igreja Católica (CIC).
Forneça um estudo exegético católico aprofundado, pastoral e orante da seguinte passagem:
Livro: ${selectedBook.name}
Capítulo: ${selectedChapter}
${selectedBook.isDeuterocanonical ? "NOTA: Este é um dos 7 livros DEUTEROCANÔNICOS do Cânon Católico tradicional confirmado em Hipona, Cartago e Trento." : ""}
Passagem em estudo: ${passageText}

ESTRUTURA DA RESPOSTA (em português, claro, teológico e piedoso):
1. 📖 **Contexto Histórico & Canônico**: Quem escreveu, época e lugar no Cânon Católico.
2. 🕊️ **Interpretação Teológica à Luz do Magistério**: O sentido espiritual, cristológico e sacramental da passagem (com citação de parágrafo do Catecismo da Igreja Católica - CIC).
3. 🏛️ **A Voz dos Santos Padres (Patrística)**: O que disseram Santos como Santo Agostinho, São Jerônimo, São João Crisóstomo ou São Tomás de Aquino sobre esta verdade.
4. 🕯️ **Aplicação Espiritual & Lectio Divina**: Como um fiel católico deve meditar e praticar esta Palavra hoje no seu cotidiano e na oração.

Mantenha total fidelidade à Tradição Apostólica e evite interpretações subjetivistas.`;

    try {
      const response = await callGeminiProxy({
        prompt,
        model: "gemini-3-flash-preview"
      });
      setAiExegesis(response);
    } catch (err: any) {
      console.error("Erro na exegese católica:", err);
      setAiExegesis("Não foi possível gerar a exegese no momento. Por favor, tente novamente.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Navigate to book & chapter from external source (like art gallery or doctrine)
  const jumpToPassage = (bookName: string, chapterNum: number) => {
    const book = bibleBooks.find(b => b.name.toLowerCase() === bookName.toLowerCase()) || bibleBooks[0];
    setSelectedBook(book);
    setSelectedChapter(chapterNum);
    setActiveSubTab("leitor");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      {/* Hero Header with Sacred Art */}
      <div className="relative rounded-3xl overflow-hidden border border-amber/30 bg-navy-light shadow-2xl">
        <div className="absolute inset-0">
          <img 
            src={catholicStudyBibleImg} 
            alt="Bíblia de Estudo Católica" 
            className="w-full h-full object-cover object-center opacity-25 filter blur-[1px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/70" />
        </div>

        <div className="relative z-10 p-6 md:p-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber text-navy flex items-center gap-1.5 shadow-md">
              <Cross className="w-3.5 h-3.5 fill-navy" />
              Cânon Sagrado de 73 Livros
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-pearl/80 border border-white/10 backdrop-blur-md">
              Vulgata Latina • Septuaginta • Patrística
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber/15 text-amber border border-amber/30">
              Imagens Sacras & Visio Divina
            </span>
          </div>

          <div className="max-w-2xl space-y-2">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-pearl">
              Bíblia de Estudo Católica Ilustrada
            </h2>
            <p className="text-pearl/70 text-xs md:text-sm leading-relaxed">
              Explore o Cânon completo com os 7 livros deuterocanônicos, iluminado por obras-primas da Arte Sacra Católica, 
              comentários dos Santos Padres, citações do Catecismo (CIC) e exegese guiada pela Tradição Apostólica.
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            <button
              onClick={() => setActiveSubTab("leitor")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeSubTab === "leitor"
                  ? "bg-amber text-navy shadow-lg font-black scale-105"
                  : "bg-white/10 text-pearl/80 hover:bg-white/15"
              )}
            >
              <BookOpen className="w-4 h-4" />
              Leitor & Estudo Canônico
            </button>
            <button
              onClick={() => setActiveSubTab("galeria")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeSubTab === "galeria"
                  ? "bg-amber text-navy shadow-lg font-black scale-105"
                  : "bg-white/10 text-pearl/80 hover:bg-white/15"
              )}
            >
              <Eye className="w-4 h-4" />
              Arte Sacra & Visio Divina
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-navy text-amber font-extrabold">
                {sacredArtCollection.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab("doutrina")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeSubTab === "doutrina"
                  ? "bg-amber text-navy shadow-lg font-black scale-105"
                  : "bg-white/10 text-pearl/80 hover:bg-white/15"
              )}
            >
              <Shield className="w-4 h-4" />
              Doutrina & Passagens-Chave
            </button>
            <button
              onClick={() => setActiveSubTab("canon")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeSubTab === "canon"
                  ? "bg-amber text-navy shadow-lg font-black scale-105"
                  : "bg-white/10 text-pearl/80 hover:bg-white/15"
              )}
            >
              <Layers className="w-4 h-4" />
              Por Que 73 Livros?
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: LEITOR DE ESTUDO CANÔNICO */}
      {activeSubTab === "leitor" && (
        <div className="space-y-6">
          {/* Controls Bar: Book Selection, Chapter, Version, Audio, Font */}
          <div className="glow-card p-4 md:p-6 rounded-3xl border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Category filter */}
              <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory("todos")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                    selectedCategory === "todos" ? "bg-amber text-navy" : "bg-white/5 text-pearl/60 hover:text-pearl"
                  )}
                >
                  Todos (73)
                </button>
                <button
                  onClick={() => setSelectedCategory("deutero")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1",
                    selectedCategory === "deutero" ? "bg-amber text-navy" : "bg-amber/15 text-amber hover:bg-amber/25 border border-amber/30"
                  )}
                >
                  <Star className="w-3 h-3 fill-amber" />
                  Deuterocanônicos (7)
                </button>
                <button
                  onClick={() => setSelectedCategory("velho")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                    selectedCategory === "velho" ? "bg-amber text-navy" : "bg-white/5 text-pearl/60 hover:text-pearl"
                  )}
                >
                  Antigo Test.
                </button>
                <button
                  onClick={() => setSelectedCategory("novo")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                    selectedCategory === "novo" ? "bg-amber text-navy" : "bg-white/5 text-pearl/60 hover:text-pearl"
                  )}
                >
                  Novo Test.
                </button>
              </div>

              {/* Book search input */}
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pearl/40" />
                <input
                  type="text"
                  placeholder="Buscar livro bíblico..."
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-navy border border-white/10 rounded-xl text-xs text-pearl focus:border-amber focus:outline-none"
                />
              </div>

              {/* Translation Selector & Audio */}
              <div className="md:col-span-4 flex items-center justify-end gap-2">
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="bg-navy border border-white/10 text-pearl text-xs font-bold px-3 py-2 rounded-xl focus:border-amber focus:outline-none"
                >
                  <option value="MATOS">Matos Soares (Vulgata Católica - 73 Livros)</option>
                  <option value="CNBB">CNBB (Oficial Católica)</option>
                  <option value="NVIPT">NVI (Moderna)</option>
                  <option value="ARA">ARA (Almeida Revista)</option>
                </select>

                <button
                  onClick={handleToggleAudio}
                  className={cn(
                    "p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold",
                    isPlayingAudio 
                      ? "bg-amber text-navy border-amber animate-pulse" 
                      : "bg-white/5 border-white/10 text-pearl/80 hover:bg-white/10"
                  )}
                  title={isPlayingAudio ? "Pausar Narração" : "Ouvir Capítulo com Áudio"}
                >
                  {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber" />}
                </button>
              </div>
            </div>

            {/* Quick Books Carousel / Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none pt-2 border-t border-white/5">
              {filteredBooks.map((book) => {
                const isSelected = selectedBook.name === book.name;
                return (
                  <button
                    key={book.name}
                    onClick={() => {
                      setSelectedBook(book);
                      setSelectedChapter(1);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-amber text-navy border-amber shadow-md scale-105"
                        : book.isDeuterocanonical
                          ? "bg-amber/10 text-amber border-amber/30 hover:bg-amber/20"
                          : "bg-white/5 text-pearl/70 border-white/5 hover:bg-white/10"
                    )}
                  >
                    {book.isDeuterocanonical && <Star className={cn("w-3 h-3", isSelected ? "fill-navy text-navy" : "fill-amber text-amber")} />}
                    <span>{book.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Chapter Selector Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
              <span className="text-[11px] font-bold text-pearl/50 uppercase tracking-wider whitespace-nowrap mr-1">
                Capítulo:
              </span>
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => {
                const isCurrent = ch === selectedChapter;
                return (
                  <button
                    key={ch}
                    onClick={() => setSelectedChapter(ch)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center shrink-0",
                      isCurrent
                        ? "bg-amber text-navy font-black shadow-md scale-110"
                        : "bg-white/5 text-pearl/60 hover:bg-white/10 hover:text-pearl"
                    )}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Study Grid: Text Reader (Left/Center) + Sacred Art & Study Notes (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Reading Column (7 or 8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Chapter Header */}
              <div className="glow-card p-6 rounded-3xl border-white/10 space-y-3 bg-gradient-to-b from-navy-light to-navy">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber/20 text-amber border border-amber/30">
                      {selectedBook.testament === "Velho" ? "Antigo Testamento" : "Novo Testamento"}
                    </span>
                    {selectedBook.isDeuterocanonical && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-emerald-400" />
                        Deuterocanônico
                      </span>
                    )}
                  </div>

                  {/* Actions: Lectio Divina, AI Exegesis, Font Size */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowLectioGuide(!showLectioGuide)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-pearl/90 border border-white/10 flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber" />
                      Lectio Divina
                    </button>
                    <button
                      onClick={() => handleGenerateCatholicExegesis()}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber/15 hover:bg-amber/25 text-amber border border-amber/30 flex items-center gap-1.5 transition-all"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Exegese Católica (IA)
                    </button>
                    <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
                      <button 
                        onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                        className="px-2 py-0.5 text-xs text-pearl/60 hover:text-pearl font-bold"
                        title="Diminuir fonte"
                      >
                        A-
                      </button>
                      <button 
                        onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                        className="px-2 py-0.5 text-xs text-pearl/60 hover:text-pearl font-bold"
                        title="Aumentar fonte"
                      >
                        A+
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-pearl flex items-center gap-3">
                    <span>{selectedBook.name}</span>
                    <span className="text-amber text-xl">Capítulo {selectedChapter}</span>
                  </h3>
                  <span className="text-xs text-pearl/40">
                    {verses.length} versículos
                  </span>
                </div>

                {selectedBook.description && (
                  <p className="text-xs text-pearl/70 italic bg-amber/5 p-3 rounded-2xl border border-amber/15 leading-relaxed">
                    « {selectedBook.description} »
                  </p>
                )}

                {/* Lectio Divina Interactive Step Guide (Toggleable) */}
                <AnimatePresence>
                  {showLectioGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-navy/80 border border-amber/30 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          Guia Católico de Lectio Divina (Leitura Orante)
                        </span>
                        <button 
                          onClick={() => setShowLectioGuide(false)}
                          className="text-pearl/40 hover:text-pearl text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { num: 1, title: "1. Lectio", sub: "Ler o Texto" },
                          { num: 2, title: "2. Meditatio", sub: "O que diz a mim?" },
                          { num: 3, title: "3. Oratio", sub: "Rezar a Deus" },
                          { num: 4, title: "4. Contemplatio", sub: "Descansar no Pai" }
                        ].map((s) => (
                          <button
                            key={s.num}
                            onClick={() => setActiveLectioStep(s.num)}
                            className={cn(
                              "p-2 rounded-xl text-center transition-all border",
                              activeLectioStep === s.num 
                                ? "bg-amber text-navy border-amber font-bold" 
                                : "bg-white/5 text-pearl/70 border-white/5 hover:bg-white/10"
                            )}
                          >
                            <p className="text-[11px] font-bold">{s.title}</p>
                            <p className="text-[9px] opacity-80">{s.sub}</p>
                          </button>
                        ))}
                      </div>

                      <div className="bg-navy p-3 rounded-xl border border-white/5 text-xs text-pearl/80 leading-relaxed">
                        {activeLectioStep === 1 && (
                          <p><strong>1. Lectio (Leitura):</strong> Leia os versículos abaixo com calma, reverência e atenção piedosa. Deixe a Palavra entrar pelos olhos e pelo coração sem pressa.</p>
                        )}
                        {activeLectioStep === 2 && (
                          <p><strong>2. Meditatio (Meditação):</strong> O que esta passagem de {selectedBook.name} {selectedChapter} fala especificamente para a sua vida, para as suas provações e esperanças de hoje?</p>
                        )}
                        {activeLectioStep === 3 && (
                          <p><strong>3. Oratio (Oração):</strong> Responda a Deus em oração íntima. Agradeça, peça perdão, rogue pelo socorro divino ou consagre sua vida a Ele.</p>
                        )}
                        {activeLectioStep === 4 && (
                          <p><strong>4. Contemplatio (Contemplação):</strong> Fique em silêncio por alguns instantes diante da presença viva do Senhor. Guarde um versículo no coração para o dia todo.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Verses Container */}
              <div className="glow-card p-6 md:p-8 rounded-3xl border-white/10 min-h-[350px] relative">
                {loadingVerses ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <RefreshCw className="w-8 h-8 text-amber animate-spin" />
                    <p className="text-xs text-pearl/60">Carregando textos sagrados de {selectedBook.name} {selectedChapter}...</p>
                  </div>
                ) : verses.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <BookOpen className="w-12 h-12 text-pearl/20 mx-auto" />
                    <p className="text-sm font-bold text-pearl/70">Texto não disponível offline</p>
                    <p className="text-xs text-pearl/40 max-w-sm mx-auto">
                      Tente alternar a tradução para Matos Soares ou verifique a conexão com a rede.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 font-serif leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                    {verses.map((verse) => {
                      const isSelected = selectedVerseNumber === verse.v;
                      const isCopied = copiedVerse === verse.v;

                      return (
                        <div
                          key={verse.v}
                          onClick={() => setSelectedVerseNumber(verse.v)}
                          className={cn(
                            "group p-2.5 rounded-xl transition-all cursor-pointer relative flex gap-3 items-start",
                            isSelected 
                              ? "bg-amber/15 border border-amber/40 shadow-sm" 
                              : "hover:bg-white/5 border border-transparent"
                          )}
                        >
                          {/* Verse number */}
                          <span className="text-[12px] font-sans font-black text-amber select-none shrink-0 w-6 text-right pt-0.5">
                            {verse.v}
                          </span>

                          {/* Verse text */}
                          <div className="text-pearl/90 flex-1">
                            {verse.t}
                          </div>

                          {/* Action icons on hover or selected */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyVerse(verse.v, verse.t);
                              }}
                              className="p-1 rounded-lg bg-navy/80 hover:bg-amber hover:text-navy text-pearl/60 transition-all border border-white/10"
                              title="Copiar versículo"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateCatholicExegesis(verse);
                              }}
                              className="p-1 rounded-lg bg-navy/80 hover:bg-amber hover:text-navy text-pearl/60 transition-all border border-white/10"
                              title="Exegese com IA Católica deste versículo"
                            >
                              <Shield className="w-3.5 h-3.5 text-amber" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Chapter Navigation Footer */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/10">
                  <button
                    disabled={selectedChapter <= 1}
                    onClick={() => setSelectedChapter(prev => Math.max(1, prev - 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-pearl flex items-center gap-2 border border-white/10 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Capítulo Anterior
                  </button>
                  <span className="text-xs font-bold text-amber">
                    {selectedBook.name} {selectedChapter} / {selectedBook.chapters}
                  </span>
                  <button
                    disabled={selectedChapter >= selectedBook.chapters}
                    onClick={() => setSelectedChapter(prev => Math.min(selectedBook.chapters, prev + 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-pearl flex items-center gap-2 border border-white/10 transition-all"
                  >
                    Próximo Capítulo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Column: Sacred Art & Catholic Notes (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Linked Sacred Art Painting Card */}
              {currentChapterArt ? (
                <div className="glow-card rounded-3xl border-amber/30 overflow-hidden bg-navy-light group">
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={currentChapterArt.image} 
                      alt={currentChapterArt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
                    
                    <button
                      onClick={() => setActiveArtModal(currentChapterArt)}
                      className="absolute right-3 top-3 p-2 rounded-xl bg-navy/80 text-amber hover:bg-amber hover:text-navy border border-amber/30 transition-all backdrop-blur-md"
                      title="Abrir Visio Divina em tela cheia"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber text-navy font-sans">
                        Arte Sacra do Livro
                      </span>
                      <h4 className="text-sm font-display font-bold text-pearl mt-1">
                        {currentChapterArt.title}
                      </h4>
                      <p className="text-[11px] text-pearl/60">
                        {currentChapterArt.artist}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-xs text-pearl/80 leading-relaxed">
                      {currentChapterArt.theologicalReflection}
                    </p>

                    <button
                      onClick={() => setActiveArtModal(currentChapterArt)}
                      className="w-full py-2 px-3 rounded-xl bg-amber/15 hover:bg-amber/25 text-amber text-xs font-bold border border-amber/30 flex items-center justify-center gap-2 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      Fazer Visio Divina (Rezar com a Imagem)
                    </button>
                  </div>
                </div>
              ) : (
                /* Generic Art Suggestion if current book doesn't have an explicit link */
                <div className="glow-card p-5 rounded-3xl border-white/10 space-y-3 bg-navy-light">
                  <div className="flex items-center gap-2 text-amber text-xs font-bold">
                    <Eye className="w-4 h-4" />
                    Galeria de Arte Sacra Bíblica
                  </div>
                  <p className="text-xs text-pearl/70 leading-relaxed">
                    Contemple as grandes pinturas católicas sobre a Criação, a Anunciação, o Arcanjo São Rafael e a Eucaristia.
                  </p>
                  <button
                    onClick={() => setActiveSubTab("galeria")}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-pearl text-xs font-bold border border-white/10 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Explorar 8 Obras na Galeria</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber" />
                  </button>
                </div>
              )}

              {/* Patristic Commentary & Catechism Card */}
              <div className="glow-card p-5 rounded-3xl border-white/10 space-y-4 bg-navy-light">
                <div className="flex items-center gap-2 text-amber text-xs font-bold uppercase tracking-wider">
                  <Cross className="w-4 h-4" />
                  Patrística & Catecismo (CIC)
                </div>

                {currentPatristic ? (
                  <div className="space-y-3">
                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber">
                          {currentPatristic.father}
                        </span>
                        <span className="text-[10px] text-pearl/40">
                          {currentPatristic.period}
                        </span>
                      </div>
                      <p className="text-xs text-pearl/80 italic font-serif leading-relaxed">
                        « {currentPatristic.note} »
                      </p>
                    </div>

                    <div className="bg-amber/10 p-3 rounded-2xl border border-amber/20">
                      <p className="text-[11px] font-bold text-amber">Catecismo da Igreja Católica:</p>
                      <p className="text-[11px] text-pearl/80 mt-0.5">{currentPatristic.cic}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs text-pearl/70 leading-relaxed">
                    <p>
                      A Tradição Católica ensina que a Sagrada Escritura deve ser lida dentro do coração vivo da Igreja, 
                      com a interpretação dos Santos Padres (São Jerônimo, Santo Agostinho, São Tomás) e do Magistério.
                    </p>
                    <div className="bg-amber/10 p-3 rounded-2xl border border-amber/20 text-[11px] text-amber">
                      <strong>Dei Verbum § 12:</strong> «A Sagrada Escritura deve ser lida e interpretada com aquele mesmo Espírito com que foi escrita».
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleGenerateCatholicExegesis()}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber to-amber-500 text-navy font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-all"
                >
                  <Shield className="w-4 h-4" />
                  Pedir Exegese Completa com IA Católica
                </button>
              </div>

              {/* Quick Links to Key Catholic Passages */}
              <div className="glow-card p-5 rounded-3xl border-white/10 space-y-3 bg-navy-light">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pearl flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber fill-amber/20" />
                    Passagens Doutrinárias
                  </span>
                  <button 
                    onClick={() => setActiveSubTab("doutrina")}
                    className="text-[11px] text-amber hover:underline font-bold"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="space-y-2">
                  {catholicKeyPassages.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => jumpToPassage(item.book, item.chapter)}
                      className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all border border-white/5 hover:border-amber/30 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-pearl group-hover:text-amber transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-pearl/50">
                          {item.keyVerse} • {item.badge}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-pearl/40 group-hover:text-amber transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GALERIA DE ARTE SACRA & VISIO DIVINA */}
      {activeSubTab === "galeria" && (
        <div className="space-y-6">
          {/* Header & Filter */}
          <div className="glow-card p-6 rounded-3xl border-white/10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold text-pearl flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber" />
                  Galeria de Arte Sacra Bíblica Católica
                </h3>
                <p className="text-xs text-pearl/60 mt-1 max-w-xl">
                  Na Tradição Católica, a arte não é mera ilustração, mas uma janela para o Mistério Divino. 
                  Pratique a <strong>Visio Divina</strong> (olhar contemplativo de oração).
                </p>
              </div>

              {/* Filter chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: "todos", label: "Todas as Obras" },
                  { id: "antigo-testamento", label: "Antigo Testamento" },
                  { id: "deuterocanonicos", label: "Deuterocanônicos" },
                  { id: "evangelhos", label: "Evangelhos" },
                  { id: "paixao-ressurreicao", label: "Ressurreição" },
                  { id: "igreja-apostolos", label: "Igreja & Apóstolos" }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setArtFilter(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                      artFilter === cat.id 
                        ? "bg-amber text-navy font-black shadow-md" 
                        : "bg-white/5 text-pearl/70 hover:bg-white/10"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Art Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArt.map((art) => (
              <div 
                key={art.id}
                className="glow-card rounded-3xl border-white/10 hover:border-amber/40 overflow-hidden bg-navy-light group flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={art.image} 
                      alt={art.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() => setActiveArtModal(art)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent pointer-events-none" />

                    <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-navy/90 text-amber border border-amber/30 backdrop-blur-md">
                      {art.biblicalRef}
                    </span>

                    <button
                      onClick={() => setActiveArtModal(art)}
                      className="absolute right-3 top-3 p-2 rounded-xl bg-navy/80 text-pearl hover:text-amber border border-white/10 transition-all backdrop-blur-md"
                      title="Ver em tela cheia com meditação"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="text-base font-display font-bold text-pearl group-hover:text-amber transition-colors">
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-pearl/50">
                        {art.artist} • {art.period}
                      </p>
                    </div>

                    <p className="text-xs text-pearl/70 line-clamp-3 leading-relaxed">
                      {art.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-2">
                  <div className="bg-amber/5 p-3 rounded-xl border border-amber/15 text-[11px] text-pearl/80">
                    <span className="text-amber font-bold">Visio Divina: </span>
                    <span className="line-clamp-2 italic">{art.visioDivinaPrompt}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveArtModal(art)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber/15 hover:bg-amber/25 text-amber text-xs font-bold border border-amber/30 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Rezar com a Arte
                    </button>
                    <button
                      onClick={() => jumpToPassage(art.targetBook, art.targetChapter)}
                      className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-pearl text-xs font-bold border border-white/10 flex items-center justify-center gap-1 transition-all"
                      title="Abrir no leitor de estudo"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Ler
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DOUTRINA & PASSAGENS-CHAVE CATÓLICAS */}
      {activeSubTab === "doutrina" && (
        <div className="space-y-6">
          <div className="glow-card p-6 rounded-3xl border-white/10 space-y-2">
            <h3 className="text-xl font-display font-bold text-pearl flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber" />
              Fundamentos Bíblicos da Fé Católica
            </h3>
            <p className="text-xs text-pearl/70 max-w-2xl leading-relaxed">
              Descubra os textos sagrados em que se apoiam os dogmas, sacramentos e a doutrina católica milenar, 
              acompanhados pelas palavras dos Padres da Igreja e parágrafos do Catecismo da Igreja Católica (CIC).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {catholicKeyPassages.map((item) => {
              const art = sacredArtCollection.find(a => a.id === item.artId);

              return (
                <div
                  key={item.id}
                  className="glow-card p-6 rounded-3xl border-white/10 hover:border-amber/40 transition-all flex flex-col justify-between space-y-4 bg-navy-light"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber/20 text-amber border border-amber/30">
                        {item.badge}
                      </span>
                      <span className="text-xs font-bold text-pearl/60">
                        {item.keyVerse}
                      </span>
                    </div>

                    <h4 className="text-lg font-display font-bold text-pearl">
                      {item.title}
                    </h4>

                    {art && (
                      <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10">
                        <img 
                          src={art.image} 
                          alt={art.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-transparent flex items-end p-3">
                          <p className="text-[11px] text-pearl font-medium">
                            {art.title} ({art.artist})
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 text-xs text-pearl/90 leading-relaxed">
                      <strong className="text-amber">Doutrina Católica: </strong>
                      {item.doctrine}
                    </div>

                    <div className="bg-amber/5 p-3.5 rounded-2xl border border-amber/15 text-xs text-pearl/80 italic font-serif leading-relaxed">
                      « {item.patristicQuote} »
                      <div className="text-[10px] font-sans font-bold text-amber not-italic mt-1">
                        — {item.author}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <span className="text-[11px] font-bold text-pearl/50">
                      {item.cic}
                    </span>
                    <button
                      onClick={() => jumpToPassage(item.book, item.chapter)}
                      className="px-4 py-2 rounded-xl bg-amber text-navy font-bold text-xs flex items-center gap-1.5 hover:bg-amber-light transition-all shadow-md"
                    >
                      <span>Estudar {item.book} {item.chapter}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: O CÂNON CATÓLICO DOS 73 LIVROS */}
      {activeSubTab === "canon" && (
        <div className="space-y-6">
          <div className="glow-card p-6 md:p-8 rounded-3xl border-white/10 space-y-4 bg-gradient-to-r from-navy via-navy-light to-navy">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber text-navy">
              História e Tradição Apostólica
            </span>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-pearl">
              Por que a Bíblia Católica possui 73 Livros?
            </h3>
            <p className="text-xs md:text-sm text-pearl/80 leading-relaxed max-w-3xl">
              Diferente das versões protestantes que possuem 66 livros (devido à reforma do séc. XVI que retirou 7 livros do Antigo Testamento), 
              a Igreja Católica guardou com integridade os 73 livros definidos pelos primeiros cristãos, pelos Apóstolos e pelos Concílios de 
              <strong> Roma (382 d.C.)</strong>, <strong>Hipona (393 d.C.)</strong>, <strong>Cartago (397 d.C.)</strong> e solenemente reiterados no <strong>Concílio de Trento (1546)</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-xs font-bold text-amber">Septuaginta (LXX)</p>
                <p className="text-[11px] text-pearl/70 mt-1">
                  A tradução grega do Antigo Testamento adotada pelos primeiros cristãos e citada em mais de 80% das vezes pelos autores do Novo Testamento continha os 73 livros.
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-xs font-bold text-amber">Vulgata de São Jerônimo</p>
                <p className="text-[11px] text-pearl/70 mt-1">
                  A pedido do Papa São Dâmaso I em 382 d.C., São Jerônimo verteu toda a Escritura para o latim, traduzindo também os livros deuterocanônicos preservados pela Igreja.
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-xs font-bold text-amber">Magistério Eclesial</p>
                <p className="text-[11px] text-pearl/70 mt-1">
                  Foi a Igreja Católica, assistida pelo Espírito Santo, que discerniu e compilou quais livros eram divinamente inspirados, formando o Cânon Bíblico universal.
                </p>
              </div>
            </div>
          </div>

          {/* Categories of the Catholic Canon */}
          <div className="space-y-4">
            <h4 className="text-lg font-display font-bold text-pearl flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber" />
              As Grandes Seções do Cânon Católico
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catholicBookCategories.map((cat) => (
                <div 
                  key={cat.id}
                  className="glow-card p-5 rounded-3xl border-white/10 space-y-3 bg-navy-light flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <h5 className="text-sm font-display font-bold text-pearl">
                      {cat.name}
                    </h5>
                    <p className="text-xs text-pearl/60 leading-relaxed">
                      {cat.description}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-2">
                      {cat.books.map(b => {
                        const isDeutero = ["Tobias", "Judite", "Sabedoria", "Eclesiástico", "Baruque", "1 Macabeus", "2 Macabeus"].includes(b);
                        return (
                          <span
                            key={b}
                            onClick={() => jumpToPassage(b, 1)}
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-all border",
                              isDeutero 
                                ? "bg-amber/15 text-amber border-amber/30 hover:bg-amber hover:text-navy" 
                                : "bg-white/5 text-pearl/70 border-white/5 hover:bg-white/10 hover:text-pearl"
                            )}
                          >
                            {b}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[10px] text-pearl/40 pt-2 border-t border-white/5">
                    {cat.books.length} livros neste grupo
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISIO DIVINA & SACRED ART FULL MODAL */}
      <AnimatePresence>
        {activeArtModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 overflow-y-auto"
            onClick={() => setActiveArtModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-navy-light border border-amber/30 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setActiveArtModal(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-navy/80 text-pearl/70 hover:text-pearl hover:bg-navy border border-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Full Artwork */}
              <div className="relative aspect-video w-full bg-navy overflow-hidden">
                <img 
                  src={activeArtModal.image} 
                  alt={activeArtModal.title} 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Details & Visio Divina Steps */}
              <div className="p-6 md:p-8 space-y-6 pt-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber text-navy font-sans">
                      {activeArtModal.biblicalRef}
                    </span>
                    {activeArtModal.cicRef && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-pearl/80">
                        {activeArtModal.cicRef}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-display font-bold text-pearl">
                    {activeArtModal.title}
                  </h3>
                  <p className="text-xs text-pearl/60">
                    {activeArtModal.artist} • {activeArtModal.period}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1.5">
                    <h5 className="text-xs font-bold text-amber flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      Significado Teológico
                    </h5>
                    <p className="text-xs text-pearl/80 leading-relaxed">
                      {activeArtModal.theologicalReflection}
                    </p>
                  </div>

                  <div className="bg-amber/10 p-4 rounded-2xl border border-amber/25 space-y-1.5">
                    <h5 className="text-xs font-bold text-amber flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Guia de Visio Divina (Oração Contemplativa)
                    </h5>
                    <p className="text-xs text-pearl/90 italic font-serif leading-relaxed">
                      {activeArtModal.visioDivinaPrompt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setActiveArtModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-pearl/60 hover:text-pearl"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      jumpToPassage(activeArtModal.targetBook, activeArtModal.targetChapter);
                      setActiveArtModal(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber text-navy font-bold text-xs flex items-center gap-2 hover:bg-amber-light shadow-md"
                  >
                    <BookOpen className="w-4 h-4" />
                    Ler {activeArtModal.targetBook} {activeArtModal.targetChapter}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI CATHOLIC EXEGESIS MODAL */}
      <AnimatePresence>
        {showAiModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 overflow-y-auto"
            onClick={() => setShowAiModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-navy-light border border-amber/30 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => setShowAiModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-navy/80 text-pearl/70 hover:text-pearl hover:bg-navy border border-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber text-navy flex items-center gap-1.5 w-fit">
                  <Shield className="w-3.5 h-3.5" />
                  Magistério • Tradição • Patrística
                </span>
                <h3 className="text-xl md:text-2xl font-display font-bold text-pearl">
                  Exegese Católica: {selectedBook.name} {selectedChapter}
                </h3>
              </div>

              {loadingAi ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-amber animate-spin" />
                  <p className="text-xs text-pearl/70">
                    Consultando as fontes católicas, Patrística e o Catecismo...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs md:text-sm text-pearl/90 leading-relaxed font-sans whitespace-pre-line bg-navy/60 p-4 rounded-2xl border border-white/5">
                  {aiExegesis}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-[11px] text-pearl/40">
                  Fiel ao Magistério da Santa Igreja Católica
                </span>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-5 py-2 rounded-xl bg-amber text-navy font-bold text-xs hover:bg-amber-light transition-all"
                >
                  Concluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
