import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Sparkles, Volume2, VolumeX, Copy, Check, ChevronRight, 
  Search, Shield, Star, Sun, Plus, X, Globe, Eye, Share2, 
  CheckCircle2, Flame, Cross, Trash2, Info, BookOpen
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CATHOLIC_PRAYERS_DATA, CatholicPrayerItem } from "../../data/catholicPrayers";
import { playNativeTTS, stopNativeTTS } from "../../services/audioService";

const STORAGE_FAVORITES_KEY = "catholic_prayer_favorites_v1";
const STORAGE_CUSTOM_PRAYERS_KEY = "catholic_custom_prayers_v1";
const STORAGE_PRAYED_LOG_KEY = "catholic_prayed_log_v1";

type CategoryFilter = "todas" | "favoritas" | "fundamentais" | "marianas" | "protecao" | "eucaristicas" | "santos" | "cotidianas" | "latim" | "minhas";

export default function CatholicPrayersLibrary() {
  const [prayers, setPrayers] = useState<CatholicPrayerItem[]>(CATHOLIC_PRAYERS_DATA);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [prayedLog, setPrayedLog] = useState<{ [id: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("todas");
  const [selectedPrayerId, setSelectedPrayerId] = useState<string>(CATHOLIC_PRAYERS_DATA[0].id);
  const [displayLanguage, setDisplayLanguage] = useState<"pt" | "la">("pt");
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Immersive Prayer Mode
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const [fontSize, setFontSize] = useState<"base" | "lg" | "xl">("lg");

  // Add Custom Prayer Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCategory, setNewCategory] = useState<"fundamentais" | "marianas" | "protecao" | "santos" | "eucaristicas" | "cotidianas" | "pessoal">("pessoal");
  const [newOrigin, setNewOrigin] = useState("");
  const [newTextPt, setNewTextPt] = useState("");
  const [newTextLa, setNewTextLa] = useState("");

  // Load from local storage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(STORAGE_FAVORITES_KEY);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedCustom = localStorage.getItem(STORAGE_CUSTOM_PRAYERS_KEY);
      if (savedCustom) {
        const parsedCustom: CatholicPrayerItem[] = JSON.parse(savedCustom);
        setPrayers([...CATHOLIC_PRAYERS_DATA, ...parsedCustom]);
      }

      const savedLog = localStorage.getItem(STORAGE_PRAYED_LOG_KEY);
      if (savedLog) setPrayedLog(JSON.parse(savedLog));
    } catch (e) {
      console.error("Erro ao carregar dados de orações:", e);
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopNativeTTS();
    };
  }, []);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = favorites.includes(id) 
      ? favorites.filter(fav => fav !== id)
      : [...favorites, id];
    setFavorites(updated);
    try {
      localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsPrayed = (id: string) => {
    const currentCount = prayedLog[id] || 0;
    const updated = { ...prayedLog, [id]: currentCount + 1 };
    setPrayedLog(updated);
    try {
      localStorage.setItem(STORAGE_PRAYED_LOG_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCustomPrayer = () => {
    if (!newTitle.trim() || !newTextPt.trim()) return;

    const newPrayer: CatholicPrayerItem = {
      id: "custom-" + Date.now(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || "Oração particular adicionada à biblioteca",
      category: newCategory,
      origin: newOrigin.trim() || "Devoção pessoal / Família",
      textPt: newTextPt.trim(),
      textLa: newTextLa.trim() ? newTextLa.trim() : undefined,
      isCustom: true
    };

    const updatedPrayers = [...prayers, newPrayer];
    setPrayers(updatedPrayers);
    setSelectedPrayerId(newPrayer.id);

    try {
      const customOnly = updatedPrayers.filter(p => p.isCustom);
      localStorage.setItem(STORAGE_CUSTOM_PRAYERS_KEY, JSON.stringify(customOnly));
    } catch (err) {
      console.error("Erro ao salvar oração customizada:", err);
    }

    // Reset form
    setNewTitle("");
    setNewSubtitle("");
    setNewOrigin("");
    setNewTextPt("");
    setNewTextLa("");
    setAddModalOpen(false);
  };

  const handleDeleteCustomPrayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = prayers.filter(p => p.id !== id);
    setPrayers(updated);
    if (selectedPrayerId === id) {
      setSelectedPrayerId(CATHOLIC_PRAYERS_DATA[0].id);
    }
    try {
      const customOnly = updated.filter(p => p.isCustom);
      localStorage.setItem(STORAGE_CUSTOM_PRAYERS_KEY, JSON.stringify(customOnly));
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered prayers list
  const filteredPrayers = useMemo(() => {
    return prayers.filter(p => {
      // Category filter
      if (activeCategory === "favoritas" && !favorites.includes(p.id)) return false;
      if (activeCategory === "latim" && !p.textLa) return false;
      if (activeCategory === "minhas" && !p.isCustom) return false;
      if (activeCategory !== "todas" && activeCategory !== "favoritas" && activeCategory !== "latim" && activeCategory !== "minhas") {
        if (p.category !== activeCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesSubtitle = p.subtitle.toLowerCase().includes(query);
        const matchesLatin = p.latinTitle?.toLowerCase().includes(query);
        const matchesOrigin = p.origin?.toLowerCase().includes(query);
        const matchesText = p.textPt.toLowerCase().includes(query);
        return matchesTitle || matchesSubtitle || matchesLatin || matchesOrigin || matchesText;
      }

      return true;
    });
  }, [prayers, activeCategory, favorites, searchQuery]);

  const selectedPrayer = useMemo(() => {
    return prayers.find(p => p.id === selectedPrayerId) || filteredPrayers[0] || prayers[0];
  }, [prayers, selectedPrayerId, filteredPrayers]);

  // Audio Playback
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopNativeTTS();
      setIsPlayingAudio(false);
    } else {
      const textToRead = displayLanguage === "la" && selectedPrayer.textLa 
        ? `${selectedPrayer.title}. ${selectedPrayer.textLa}`
        : `${selectedPrayer.title}. ${selectedPrayer.subtitle}. ${selectedPrayer.textPt}`;

      setIsPlayingAudio(true);
      playNativeTTS(
        textToRead,
        "",
        0.9,
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      ).catch(() => setIsPlayingAudio(false));
    }
  };

  const handleCopy = (prayer: CatholicPrayerItem) => {
    const text = `${prayer.title.toUpperCase()}${prayer.latinTitle ? ` (${prayer.latinTitle})` : ""}\n${prayer.subtitle}\n\n${displayLanguage === "la" && prayer.textLa ? prayer.textLa : prayer.textPt}\n\n${prayer.origin ? `Fonte: ${prayer.origin}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async (prayer: CatholicPrayerItem) => {
    const shareText = `🕊️ *${prayer.title}*\n\n${prayer.textPt}\n\n${prayer.origin ? `— ${prayer.origin}` : ""}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: prayer.title,
          text: shareText
        });
      } catch {
        handleCopy(prayer);
      }
    } else {
      handleCopy(prayer);
    }
  };

  const categoriesConfig: { id: CategoryFilter; label: string; count?: number }[] = [
    { id: "todas", label: "Todas" },
    { id: "favoritas", label: `Favoritas (${favorites.length})` },
    { id: "fundamentais", label: "Fundamentais" },
    { id: "marianas", label: "Marianas" },
    { id: "protecao", label: "Proteção & Combate" },
    { id: "eucaristicas", label: "Eucarísticas" },
    { id: "santos", label: "Santos & Místicos" },
    { id: "cotidianas", label: "Cotidiano & Família" },
    { id: "latim", label: "Em Latim" },
    { id: "minhas", label: "Minhas Orações" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/5 p-4 rounded-3xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-pearl/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por oração, santo, mistério, latim ou trecho..."
            className="w-full pl-10 pr-9 py-2.5 bg-navy/60 border border-white/10 rounded-2xl text-xs text-pearl placeholder-pearl/40 focus:outline-none focus:border-amber/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-pearl/40 hover:text-pearl"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action: Add Custom Prayer */}
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 bg-amber/15 hover:bg-amber/25 text-amber border border-amber/30 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Oração</span>
        </button>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categoriesConfig.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
              activeCategory === cat.id
                ? "bg-amber text-navy border-amber shadow-md font-bold scale-[1.02]"
                : "bg-white/5 border-white/5 text-pearl/60 hover:text-pearl hover:bg-white/10"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Two Column Layout: List (5 cols) & Active Prayer View (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prayers List */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-pearl/50 px-2 pb-1">
            <span>{filteredPrayers.length} {filteredPrayers.length === 1 ? "oração encontrada" : "orações encontradas"}</span>
            {activeCategory === "favoritas" && favorites.length === 0 && (
              <span className="text-amber/70 italic text-[11px]">Nenhuma favoritada ainda</span>
            )}
          </div>

          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {filteredPrayers.length === 0 ? (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 space-y-3">
                <Heart className="w-8 h-8 text-pearl/20 mx-auto" />
                <p className="text-xs text-pearl/50">Nenhuma oração encontrada com os filtros atuais.</p>
                <button
                  onClick={() => { setSearchQuery(""); setActiveCategory("todas"); }}
                  className="px-3 py-1.5 bg-amber/20 text-amber text-xs rounded-xl font-semibold"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              filteredPrayers.map((prayer) => {
                const isSelected = selectedPrayer.id === prayer.id;
                const isFav = favorites.includes(prayer.id);
                const timesPrayed = prayedLog[prayer.id] || 0;

                return (
                  <div
                    key={prayer.id}
                    onClick={() => {
                      setSelectedPrayerId(prayer.id);
                      if (isPlayingAudio) {
                        stopNativeTTS();
                        setIsPlayingAudio(false);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer relative overflow-hidden",
                      isSelected
                        ? "bg-gradient-to-r from-amber/20 via-amber/10 to-transparent border-amber/50 shadow-lg text-pearl"
                        : "bg-white/5 border-white/5 hover:border-amber/25 text-pearl/70 hover:text-pearl"
                    )}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-pearl/80">
                          {prayer.category}
                        </span>
                        {prayer.latinTitle && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber/10 text-amber/80 font-serif italic">
                            Latim
                          </span>
                        )}
                        {prayer.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">
                            Pessoal
                          </span>
                        )}
                        {timesPrayed > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {timesPrayed}x
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-pearl mt-1.5 group-hover:text-amber transition-colors flex items-center gap-1.5">
                        {prayer.title}
                        {prayer.latinTitle && (
                          <span className="text-[11px] text-pearl/40 font-serif italic hidden sm:inline">
                            ({prayer.latinTitle})
                          </span>
                        )}
                      </h3>

                      <p className="text-[11px] text-pearl/50 mt-0.5 line-clamp-1">
                        {prayer.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => toggleFavorite(prayer.id, e)}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          isFav ? "text-rose-400 bg-rose-500/10 hover:bg-rose-500/20" : "text-pearl/20 hover:text-rose-400 hover:bg-white/5"
                        )}
                        title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Heart className={cn("w-4 h-4", isFav && "fill-rose-400")} />
                      </button>

                      {prayer.isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomPrayer(prayer.id, e)}
                          className="p-2 text-pearl/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Excluir oração pessoal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        isSelected ? "text-amber translate-x-1" : "text-pearl/20 group-hover:text-amber"
                      )} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Prayer Detail View */}
        <div className="lg:col-span-7">
          <div className="glow-card p-6 md:p-8 rounded-3xl border-amber/20 space-y-6 bg-gradient-to-b from-navy/90 to-navy">
            {/* Header with Title & Action Buttons */}
            <div className="space-y-4 border-b border-white/10 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber/20 text-amber">
                    {selectedPrayer.category}
                  </span>
                  {selectedPrayer.origin && (
                    <span className="text-[11px] text-pearl/50 italic flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-amber/60" />
                      {selectedPrayer.origin}
                    </span>
                  )}
                </div>

                {/* Top Action Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Language switch if Latin available */}
                  {selectedPrayer.textLa && (
                    <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10 text-xs">
                      <button
                        onClick={() => setDisplayLanguage("pt")}
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-bold transition-all text-[11px]",
                          displayLanguage === "pt" ? "bg-amber text-navy font-black shadow-sm" : "text-pearl/60 hover:text-pearl"
                        )}
                      >
                        Português
                      </button>
                      <button
                        onClick={() => setDisplayLanguage("la")}
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-bold transition-all text-[11px]",
                          displayLanguage === "la" ? "bg-amber text-navy font-black shadow-sm" : "text-pearl/60 hover:text-pearl"
                        )}
                      >
                        Latim
                      </button>
                    </div>
                  )}

                  {/* Audio Playback button */}
                  <button
                    onClick={handleToggleAudio}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold",
                      isPlayingAudio 
                        ? "bg-amber text-navy border-amber shadow-md animate-pulse" 
                        : "bg-white/5 hover:bg-amber/20 text-pearl hover:text-amber border-white/10"
                    )}
                    title={isPlayingAudio ? "Parar narração" : "Ouvir oração narrada"}
                  >
                    {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isPlayingAudio ? "Parar" : "Ouvir"}</span>
                  </button>

                  {/* Immersive Fullscreen Mode */}
                  <button
                    onClick={() => setImmersiveOpen(true)}
                    className="p-2.5 bg-white/5 hover:bg-amber/20 text-pearl hover:text-amber rounded-xl border border-white/10 transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Modo Oração Focada"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Modo Focado</span>
                  </button>

                  {/* Favorite button */}
                  <button
                    onClick={() => toggleFavorite(selectedPrayer.id)}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all",
                      favorites.includes(selectedPrayer.id)
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-white/5 hover:bg-rose-500/10 text-pearl/60 hover:text-rose-400 border-white/10"
                    )}
                    title="Favoritar"
                  >
                    <Heart className={cn("w-4 h-4", favorites.includes(selectedPrayer.id) && "fill-rose-400")} />
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(selectedPrayer)}
                    className="p-2.5 bg-white/5 hover:bg-amber/20 text-pearl hover:text-amber rounded-xl border border-white/10 transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Copiar oração"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Share button */}
                  <button
                    onClick={() => handleShare(selectedPrayer)}
                    className="p-2.5 bg-white/5 hover:bg-amber/20 text-pearl hover:text-amber rounded-xl border border-white/10 transition-all"
                    title="Compartilhar"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-pearl flex items-center gap-2">
                  {selectedPrayer.title}
                </h2>
                {selectedPrayer.latinTitle && (
                  <p className="text-xs text-amber/80 font-serif italic mt-0.5">
                    Latim: {selectedPrayer.latinTitle}
                  </p>
                )}
                <p className="text-xs text-pearl/60 mt-1">
                  {selectedPrayer.subtitle}
                </p>
              </div>
            </div>

            {/* Prayer Text Box with Holy Typography */}
            <div className="bg-white/5 p-6 md:p-8 rounded-2xl border border-amber/15 paper-texture relative overflow-hidden">
              <div className="absolute right-4 top-4 text-amber/5 pointer-events-none">
                <Cross className="w-32 h-32" />
              </div>

              <div className="relative z-10">
                <p className={cn(
                  "font-serif text-pearl/90 leading-relaxed whitespace-pre-line italic",
                  displayLanguage === "la" && selectedPrayer.textLa ? "text-amber-100" : "text-pearl",
                  fontSize === "base" ? "text-base" : fontSize === "lg" ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                )}>
                  {displayLanguage === "la" && selectedPrayer.textLa ? selectedPrayer.textLa : selectedPrayer.textPt}
                </p>
              </div>
            </div>

            {/* Tradition / Spiritual note if available */}
            {selectedPrayer.traditionNote && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber/5 border border-amber/15 text-xs text-pearl/70 leading-relaxed">
                <Sparkles className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber block mb-0.5 font-bold">Tradição & Sentido Espiritual:</strong>
                  {selectedPrayer.traditionNote}
                </div>
              </div>
            )}

            {/* Bottom Bar: "Rezei hoje" Tracker & Devotional Completion */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="text-xs text-pearl/50 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber" />
                <span>
                  Você rezou esta prece <strong>{prayedLog[selectedPrayer.id] || 0} vezes</strong>
                </span>
              </div>

              <button
                onClick={() => markAsPrayed(selectedPrayer.id)}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-navy font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Concluir Oração (Rezei Agora)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD CUSTOM PRAYER */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glow-card border-amber/30 bg-navy p-6 md:p-8 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-amber">
                  <Cross className="w-5 h-5" />
                  <h3 className="font-display font-bold text-lg text-pearl">
                    Adicionar Oração à Biblioteca
                  </h3>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1.5 text-pearl/40 hover:text-pearl rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-pearl/70 font-semibold mb-1">
                    Título da Oração *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Oração a São Judas Tadeu, Novena das Mãos Ensanguentadas..."
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-pearl focus:outline-none focus:border-amber"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-pearl/70 font-semibold mb-1">
                      Categoria
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-navy border border-white/10 rounded-xl text-pearl focus:outline-none focus:border-amber"
                    >
                      <option value="pessoal">Devoção Particular / Pessoal</option>
                      <option value="fundamentais">Fundamentais</option>
                      <option value="marianas">Marianas</option>
                      <option value="protecao">Proteção & Combate</option>
                      <option value="santos">Santos & Intercessões</option>
                      <option value="eucaristicas">Eucarísticas & Adoração</option>
                      <option value="cotidianas">Cotidiano & Família</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-pearl/70 font-semibold mb-1">
                      Fonte / Origem (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      placeholder="Ex: Terço familiar, Paróquia, Santo padroeiro..."
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-pearl focus:outline-none focus:border-amber"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-pearl/70 font-semibold mb-1">
                    Subtítulo / Intenção
                  </label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="Ex: Para alcançar a graça do emprego, harmonia familiar..."
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-pearl focus:outline-none focus:border-amber"
                  />
                </div>

                <div>
                  <label className="block text-pearl/70 font-semibold mb-1">
                    Texto da Oração (em Português) *
                  </label>
                  <textarea
                    rows={6}
                    value={newTextPt}
                    onChange={(e) => setNewTextPt(e.target.value)}
                    placeholder="Escreva ou cole aqui a oração completa..."
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-pearl focus:outline-none focus:border-amber font-serif text-sm leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-pearl/70 font-semibold mb-1">
                    Versão em Latim (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={newTextLa}
                    onChange={(e) => setNewTextLa(e.target.value)}
                    placeholder="Texto em latim caso deseje alternância de idioma..."
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-pearl focus:outline-none focus:border-amber font-serif text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-pearl/60 hover:text-pearl text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCustomPrayer}
                  disabled={!newTitle.trim() || !newTextPt.trim()}
                  className="px-6 py-2.5 bg-amber hover:bg-amber-400 text-navy font-bold text-xs rounded-xl disabled:opacity-50 transition-all shadow-md"
                >
                  Salvar na Biblioteca
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: IMMERSIVE FOCUSED PRAYER MODE */}
      <AnimatePresence>
        {immersiveOpen && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-black/95 backdrop-blur-xl">
            {/* Top Toolbar */}
            <div className="w-full max-w-3xl flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-widest text-amber">
                  Recolhimento & Oração Focada
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Font Size Selector */}
                <div className="flex items-center bg-white/5 rounded-xl p-1 text-xs text-pearl/60">
                  <button
                    onClick={() => setFontSize("base")}
                    className={cn("px-2 py-1 rounded-lg", fontSize === "base" && "bg-amber text-navy font-bold")}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize("lg")}
                    className={cn("px-2 py-1 rounded-lg", fontSize === "lg" && "bg-amber text-navy font-bold")}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize("xl")}
                    className={cn("px-2 py-1 rounded-lg", fontSize === "xl" && "bg-amber text-navy font-bold")}
                  >
                    A+
                  </button>
                </div>

                <button
                  onClick={() => setImmersiveOpen(false)}
                  className="p-2 text-pearl/60 hover:text-pearl rounded-xl bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Immersive Prayer Content */}
            <div className="w-full max-w-2xl my-auto text-center space-y-6 py-8">
              <Cross className="w-10 h-10 text-amber/40 mx-auto" />
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-pearl">
                  {selectedPrayer.title}
                </h1>
                {selectedPrayer.latinTitle && (
                  <p className="text-sm font-serif italic text-amber/80 mt-1">
                    {selectedPrayer.latinTitle}
                  </p>
                )}
              </div>

              <div className="p-8 rounded-3xl bg-white/[0.03] border border-amber/20 shadow-2xl">
                <p className={cn(
                  "font-serif text-pearl/90 leading-relaxed whitespace-pre-line italic",
                  fontSize === "base" ? "text-lg leading-loose" : fontSize === "lg" ? "text-xl md:text-2xl leading-loose" : "text-2xl md:text-3xl leading-loose"
                )}>
                  {displayLanguage === "la" && selectedPrayer.textLa ? selectedPrayer.textLa : selectedPrayer.textPt}
                </p>
              </div>

              <p className="text-xs text-pearl/40">
                Respire devagar. Una seu coração a Deus no silêncio e na fé.
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="w-full max-w-3xl flex items-center justify-between border-t border-white/10 pt-4">
              <button
                onClick={handleToggleAudio}
                className="flex items-center gap-2 text-xs text-pearl/70 hover:text-amber"
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4 text-amber" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlayingAudio ? "Silenciar narração" : "Ouvir em oração"}</span>
              </button>

              <button
                onClick={() => {
                  markAsPrayed(selectedPrayer.id);
                  setImmersiveOpen(false);
                }}
                className="px-6 py-2.5 bg-amber hover:bg-amber-400 text-navy font-bold text-xs rounded-xl shadow-lg"
              >
                Concluir & Rezei com Devoção
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
