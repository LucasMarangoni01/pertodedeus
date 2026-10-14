import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Sparkles, Heart, Search, Plus, Filter, Star, 
  ExternalLink, Bookmark, CheckCircle2, BookmarkCheck, Share2, 
  Copy, Check, RefreshCw, X, ChevronRight, User, Award, 
  HelpCircle, MessageSquareQuote, Compass, Flame, Volume2, VolumeX, Eye
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { 
  CatholicBook, 
  INITIAL_CATHOLIC_BOOKS 
} from "../../data/catholicBooksData";
import { 
  subscribeToCommunityBooks, 
  addCommunityBook, 
  likeBookAction, 
  getUserShelf, 
  saveUserShelf, 
  hasUserLikedBook,
  getAIBookRecommendations,
  getAIBookDeepAnalysis,
  UserShelf
} from "../../services/communityBooksService";
import { playNativeTTS, stopNativeTTS } from "../../services/audioService";

type CategoryFilter = "Todas" | CatholicBook["category"];
type SourceFilter = "todos" | "ia" | "comunidade";
type ShelfStatus = "wantToRead" | "read" | "favorites";

const CATEGORIES: CategoryFilter[] = [
  "Todas",
  "Clássicos da Fé",
  "Deus & Trindade",
  "Teologia & Doutrina",
  "Espiritualidade & Oração",
  "Santos & Biografias",
  "Apologética & Doutrina",
  "Mística & Contemplação",
  "Bíblia & Teologia",
  "Vida Cristã Prática"
];

const AI_SUGGESTION_THEMES = [
  {
    title: "Provas & Existência de Deus",
    desc: "Obras para quem deseja fundamentos racionais, filosóficos e bíblicos da existência de Deus.",
    icon: Compass,
    query: "Livros teológicos e filosóficos que demonstram a existência de Deus, a Trindade e a harmonia entre fé e razão"
  },
  {
    title: "Vida de Oração & Mística",
    desc: "Como crescer na oração silenciosa, contemplação e amizade profunda com Jesus.",
    icon: Flame,
    query: "Melhores livros católicos sobre vida de oração, oração contemplativa, superação de distrações e intimidade com Deus"
  },
  {
    title: "Defesa da Fé & Apologética",
    desc: "Respostas bíblicas e históricas para defender a Igreja Católica com caridade e clareza.",
    icon: Award,
    query: "Livros de apologética católica que explicam com a Bíblia e a história os sacramentos, o Papa, Maria e a Eucaristia"
  },
  {
    title: "Para Momentos de Sofrimento & Dúvidas",
    desc: "Consolo espiritual, sentido da dor à luz da Cruz e superação de crises de fé.",
    icon: Heart,
    query: "Livros católicos para quem está sofrendo, com ansiedade, aridez espiritual ou dúvidas de fé"
  },
  {
    title: "Grandes Santos & Biografias",
    desc: "A vida arrebatadora de homens e mulheres que foram santos e mudaram a história.",
    icon: Star,
    query: "Biografias e escritos autobiográficos dos maiores santos católicos de todos os tempos"
  },
  {
    title: "Iniciantes no Catolicismo",
    desc: "Livros acessíveis, claros e diretos para quem está começando agora a jornada da fé.",
    icon: BookOpen,
    query: "Livros introdutórios essenciais, fáceis de ler e fascinantes sobre o catolicismo e a vida com Deus para iniciantes"
  }
];

export default function CatholicBooksLibrary() {
  const { user } = useAuth();

  // State: books and sources
  const [communityBooks, setCommunityBooks] = useState<CatholicBook[]>([]);
  const [shelf, setShelf] = useState<UserShelf>({ wantToRead: [], read: [], favorites: [] });
  const [activeMainTab, setActiveMainTab] = useState<"explorar" | "consultor-ia" | "minha-estante">("explorar");

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("Todas");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("todos");
  const [selectedLevel, setSelectedLevel] = useState<string>("todos");
  const [shelfFilter, setShelfFilter] = useState<ShelfStatus | "todas">("todas");

  // Modals & details
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<CatholicBook | null>(null);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // AI recommendations tab state
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState<CatholicBook[]>([]);
  const [isLoadingAiRecs, setIsLoadingAiRecs] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [savedAiBookIds, setSavedAiBookIds] = useState<string[]>([]);

  // Add Book Form state
  const [formTitle, setFormTitle] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formCategory, setFormCategory] = useState<CatholicBook["category"]>("Clássicos da Fé");
  const [formLevel, setFormLevel] = useState<CatholicBook["level"]>("Iniciante");
  const [formDescription, setFormDescription] = useState("");
  const [formWhyRead, setFormWhyRead] = useState("");
  const [formKeyQuote, setFormKeyQuote] = useState("");
  const [formPages, setFormPages] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formAddedByName, setFormAddedByName] = useState(user?.displayName || "");
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);

  // Sync user display name into form when logged in
  useEffect(() => {
    if (user?.displayName && !formAddedByName) {
      setFormAddedByName(user.displayName);
    }
  }, [user, formAddedByName]);

  // Load user shelf
  useEffect(() => {
    setShelf(getUserShelf());
  }, []);

  // Subscribe to community books in Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCommunityBooks((firestoreBooks) => {
      setCommunityBooks(firestoreBooks);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Merge initial books and community books (avoiding duplicates)
  const allBooks = useMemo(() => {
    const list = [...INITIAL_CATHOLIC_BOOKS];
    const existingTitles = new Set(list.map(b => b.title.toLowerCase().trim()));

    for (const cb of communityBooks) {
      if (!existingTitles.has(cb.title.toLowerCase().trim())) {
        list.push(cb);
        existingTitles.add(cb.title.toLowerCase().trim());
      }
    }
    return list;
  }, [communityBooks]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return allBooks.filter(book => {
      // Category filter
      if (selectedCategory !== "Todas" && book.category !== selectedCategory) {
        return false;
      }
      // Source filter
      if (sourceFilter === "ia" && !book.isAIRecommended) {
        return false;
      }
      if (sourceFilter === "comunidade" && book.isAIRecommended) {
        return false;
      }
      // Level filter
      if (selectedLevel !== "todos" && book.level !== selectedLevel) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(q);
        const matchesAuthor = book.author.toLowerCase().includes(q);
        const matchesDesc = book.description.toLowerCase().includes(q);
        const matchesWhy = book.whyRead.toLowerCase().includes(q);
        const matchesQuote = book.keyQuote ? book.keyQuote.toLowerCase().includes(q) : false;
        const matchesTags = book.tags.some(t => t.toLowerCase().includes(q));

        if (!matchesTitle && !matchesAuthor && !matchesDesc && !matchesWhy && !matchesQuote && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [allBooks, selectedCategory, sourceFilter, selectedLevel, searchQuery]);

  // Shelf books
  const shelfBooks = useMemo(() => {
    return allBooks.filter(b => {
      if (shelfFilter === "todas") {
        return shelf.wantToRead.includes(b.id) || shelf.read.includes(b.id) || shelf.favorites.includes(b.id);
      }
      return shelf[shelfFilter].includes(b.id);
    });
  }, [allBooks, shelf, shelfFilter]);

  // Handle Likes
  const handleLikeBook = async (bookId: string) => {
    await likeBookAction(bookId);
    // Optimistic UI update
    setCommunityBooks(prev => prev.map(b => b.id === bookId ? { ...b, likes: b.likes + 1 } : b));
  };

  // Handle Shelf Toggle
  const handleToggleShelf = (bookId: string, status: ShelfStatus) => {
    setShelf(prev => {
      const currentList = prev[status];
      const isAlready = currentList.includes(bookId);
      const updatedList = isAlready 
        ? currentList.filter(id => id !== bookId) 
        : [...currentList, bookId];
      
      const newShelf = { ...prev, [status]: updatedList };
      saveUserShelf(newShelf);
      return newShelf;
    });
  };

  // AI Recommendation Trigger
  const handleRequestAiRecommendations = async (customQuery?: string) => {
    const queryToUse = customQuery || aiCustomPrompt;
    if (!queryToUse.trim()) return;

    setIsLoadingAiRecs(true);
    setAiError(null);
    try {
      const recs = await getAIBookRecommendations({
        topicPrompt: queryToUse
      });
      setAiRecommendations(recs);
    } catch (err: any) {
      setAiError("Não foi possível gerar recomendações neste momento. Tente novamente.");
    } finally {
      setIsLoadingAiRecs(false);
    }
  };

  // Save AI Recommended Book into Community Library
  const handleSaveAiBookToLibrary = async (book: CatholicBook) => {
    try {
      await addCommunityBook({
        title: book.title,
        author: book.author,
        category: book.category,
        description: book.description,
        whyRead: book.whyRead,
        keyQuote: book.keyQuote,
        level: book.level,
        tags: book.tags,
        isAIRecommended: true,
        aiHighlight: book.aiHighlight,
        pagesEstimate: book.pagesEstimate
      }, user);

      setSavedAiBookIds(prev => [...prev, book.id]);
    } catch (err) {
      console.error("Error saving AI book:", err);
    }
  };

  // Deep Analysis of a Book via Gemini
  const handleGenerateDeepAnalysis = async (book: CatholicBook) => {
    setIsLoadingAnalysis(true);
    setDeepAnalysis(null);
    try {
      const result = await getAIBookDeepAnalysis(book.title, book.author);
      setDeepAnalysis(result);
    } catch (err) {
      console.error("Error generating deep analysis:", err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Submit User Form to Add Book
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAuthor.trim() || !formDescription.trim()) return;

    setIsSubmittingBook(true);
    setFormSuccessMessage(null);

    try {
      const added = await addCommunityBook({
        title: formTitle,
        author: formAuthor,
        category: formCategory,
        level: formLevel,
        description: formDescription,
        whyRead: formWhyRead || "Recomendado por membro da comunidade para edificação da fé.",
        keyQuote: formKeyQuote,
        pagesEstimate: formPages,
        link: formLink,
        isAIRecommended: false
      }, {
        uid: user?.uid,
        displayName: formAddedByName.trim() || "Irmão na Fé"
      });

      // Optimistic list update
      setCommunityBooks(prev => [added, ...prev]);

      setFormSuccessMessage(`O livro "${formTitle}" foi adicionado com sucesso à Biblioteca!`);
      // Reset form
      setFormTitle("");
      setFormAuthor("");
      setFormDescription("");
      setFormWhyRead("");
      setFormKeyQuote("");
      setFormPages("");
      setFormLink("");

      setTimeout(() => {
        setIsAddBookModalOpen(false);
        setFormSuccessMessage(null);
      }, 1800);
    } catch (err) {
      console.error("Error submitting book:", err);
    } finally {
      setIsSubmittingBook(false);
    }
  };

  // Audio TTS for quotes or prayers
  const handleToggleAudio = (text: string) => {
    if (isPlayingAudio) {
      stopNativeTTS();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playNativeTTS(
        text,
        "",
        0.95,
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    }
  };

  const handleCopyQuote = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="glow-card p-6 md:p-8 rounded-3xl border-amber/30 bg-gradient-to-br from-navy via-navy-light to-navy relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <BookOpen className="w-80 h-80 text-amber" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/15 border border-amber/30 text-amber text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              Biblioteca Cristã & Católica
            </div>
            
            <button
              onClick={() => setIsAddBookModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-navy font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Indicar / Adicionar Livro
            </button>
          </div>

          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-pearl">
              Livros sobre Deus, a Fé Cristã & Catolicismo
            </h2>
            <p className="text-pearl/70 text-sm leading-relaxed">
              Explore as maiores obras dos Santos Padres, Doutores da Igreja e pensadores cristãos. 
              Receba recomendações inteligentes da IA, consulte lições e compartilhe seus livros favoritos com toda a comunidade.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-pearl/50">Total de Obras</span>
              <p className="text-xl font-bold text-pearl mt-0.5">{allBooks.length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-pearl/50">Clássicos & Doutores</span>
              <p className="text-xl font-bold text-amber mt-0.5">
                {allBooks.filter(b => b.category === "Clássicos da Fé" || b.category === "Mística & Contemplação").length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-pearl/50">Indicações da Comunidade</span>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">{communityBooks.length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-pearl/50">Na Sua Estante</span>
              <p className="text-xl font-bold text-amber-300 mt-0.5">
                {shelf.wantToRead.length + shelf.read.length + shelf.favorites.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveMainTab("explorar")}
          className={cn(
            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeMainTab === "explorar"
              ? "bg-amber text-navy shadow-md shadow-amber/20 scale-105"
              : "bg-white/5 text-pearl/70 hover:bg-white/10"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Explorar Acervo & Comunidade
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-navy/60 text-amber font-mono font-bold">
            {filteredBooks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab("consultor-ia")}
          className={cn(
            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeMainTab === "consultor-ia"
              ? "bg-gradient-to-r from-amber to-amber-500 text-navy shadow-md shadow-amber/20 scale-105 font-black"
              : "bg-amber/10 text-amber border border-amber/25 hover:bg-amber/20"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Consultor de Leitura IA
          <span className="px-1.5 py-0.2 rounded-full text-[9px] uppercase font-black bg-navy/60 text-amber border border-amber/40">
            Recomendações
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab("minha-estante")}
          className={cn(
            "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeMainTab === "minha-estante"
              ? "bg-amber text-navy shadow-md shadow-amber/20 scale-105"
              : "bg-white/5 text-pearl/70 hover:bg-white/10"
          )}
        >
          <BookmarkCheck className="w-4 h-4" />
          Minha Estante Espiritual
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-navy/60 text-amber font-mono font-bold">
            {shelf.wantToRead.length + shelf.read.length + shelf.favorites.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: EXPLORAR ACERVO & COMUNIDADE                          */}
      {/* ============================================================== */}
      {activeMainTab === "explorar" && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="glow-card p-4 rounded-2xl border-white/10 bg-navy-light/60 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-pearl/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, autor (ex: Agostinho, Lewis, Bento XVI), assunto ou citação..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-navy/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-pearl placeholder-pearl/40 focus:border-amber/50 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-pearl/40 hover:text-pearl"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Source pills */}
              <div className="flex items-center gap-1.5 bg-navy/80 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setSourceFilter("todos")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all",
                    sourceFilter === "todos" ? "bg-amber text-navy" : "text-pearl/60 hover:text-pearl"
                  )}
                >
                  Todos ({allBooks.length})
                </button>
                <button
                  onClick={() => setSourceFilter("ia")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1",
                    sourceFilter === "ia" ? "bg-amber text-navy" : "text-pearl/60 hover:text-pearl"
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  IA ({allBooks.filter(b => b.isAIRecommended).length})
                </button>
                <button
                  onClick={() => setSourceFilter("comunidade")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1",
                    sourceFilter === "comunidade" ? "bg-amber text-navy" : "text-pearl/60 hover:text-pearl"
                  )}
                >
                  <User className="w-3 h-3" />
                  Comunidade ({communityBooks.length})
                </button>
              </div>

              {/* Level Selector */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-navy/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-pearl/80 focus:border-amber/50 focus:outline-none"
              >
                <option value="todos">Todos os Níveis</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado / Teológico">Avançado / Teológico</option>
              </select>
            </div>

            {/* Category horizontal scroll pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-pearl/40 shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Categorias:
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer",
                    selectedCategory === cat
                      ? "bg-amber text-navy font-bold shadow-sm"
                      : "bg-white/5 text-pearl/70 hover:bg-white/10 border border-white/5"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Books Grid */}
          {filteredBooks.length === 0 ? (
            <div className="glow-card p-12 text-center rounded-3xl border-white/10 bg-navy-light/40 space-y-4">
              <BookOpen className="w-12 h-12 text-pearl/30 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-pearl">Nenhum livro encontrado</h4>
                <p className="text-pearl/60 text-xs max-w-md mx-auto">
                  Não encontramos obras correspondentes aos seus filtros de busca. 
                  Você pode pedir à IA para recomendar livros sobre este assunto ou adicionar você mesmo!
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Todas");
                    setSourceFilter("todos");
                    setSelectedLevel("todos");
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 text-pearl text-xs font-bold hover:bg-white/15"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={() => setIsAddBookModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber text-navy text-xs font-bold hover:bg-amber-400"
                >
                  + Adicionar Livro
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBooks.map((book) => {
                const isLiked = hasUserLikedBook(book.id);
                const isInWantToRead = shelf.wantToRead.includes(book.id);
                const isRead = shelf.read.includes(book.id);
                const isFav = shelf.favorites.includes(book.id);

                return (
                  <motion.div
                    key={book.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="glow-card p-5 rounded-2xl border-white/10 bg-navy-light/50 hover:border-amber/40 transition-all flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Meta: Category & Level */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber/15 text-amber border border-amber/25 truncate">
                          {book.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase",
                            book.level === "Iniciante" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
                            book.level === "Intermediário" && "bg-amber-500/15 text-amber-300 border border-amber-500/30",
                            book.level === "Avançado / Teológico" && "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                          )}>
                            {book.level}
                          </span>

                          {book.badge && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-white/10 text-pearl/80 border border-white/10 truncate">
                              {book.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Author */}
                      <div>
                        <h3 className="text-lg font-bold text-pearl group-hover:text-amber transition-colors line-clamp-1">
                          {book.title}
                        </h3>
                        <p className="text-xs font-medium text-pearl/70 flex items-center gap-1.5 mt-0.5">
                          <span>{book.author}</span>
                          {book.historicalPeriod && (
                            <>
                              <span className="text-pearl/30">•</span>
                              <span className="text-pearl/40 text-[10px]">{book.historicalPeriod}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-pearl/70 text-xs leading-relaxed line-clamp-3">
                        {book.description}
                      </p>

                      {/* Key Quote Box (if available) */}
                      {book.keyQuote && (
                        <div className="p-3 rounded-xl bg-navy/80 border border-white/5 relative text-[11px] text-pearl/80 italic font-serif leading-snug">
                          <MessageSquareQuote className="w-3.5 h-3.5 text-amber/60 absolute right-2.5 top-2.5" />
                          <span className="line-clamp-2">"{book.keyQuote}"</span>
                        </div>
                      )}

                      {/* AI Highlight Banner (if available) */}
                      {book.aiHighlight && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber/5 border border-amber/15 text-[11px] text-amber/90">
                          <Sparkles className="w-3 h-3 text-amber shrink-0" />
                          <span className="line-clamp-1">{book.aiHighlight}</span>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {book.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[9px] bg-white/5 text-pearl/50">
                            #{tag}
                          </span>
                        ))}
                        {book.pagesEstimate && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] text-pearl/40 ml-auto font-mono">
                            {book.pagesEstimate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      {/* Left: Like & Shelf */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleLikeBook(book.id)}
                          className={cn(
                            "p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                            isLiked
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-white/5 text-pearl/60 hover:bg-white/10 hover:text-rose-400"
                          )}
                          title="Curtir indicação"
                        >
                          <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-rose-400 text-rose-400")} />
                          <span className="text-[11px]">{book.likes}</span>
                        </button>

                        <button
                          onClick={() => handleToggleShelf(book.id, "wantToRead")}
                          className={cn(
                            "p-2 rounded-xl text-xs transition-all cursor-pointer",
                            isInWantToRead
                              ? "bg-amber/25 text-amber border border-amber/40"
                              : "bg-white/5 text-pearl/60 hover:bg-white/10 hover:text-pearl"
                          )}
                          title={isInWantToRead ? "Na lista Quero Ler" : "Adicionar à lista Quero Ler"}
                        >
                          <Bookmark className={cn("w-3.5 h-3.5", isInWantToRead && "fill-amber")} />
                        </button>

                        <button
                          onClick={() => handleToggleShelf(book.id, "favorites")}
                          className={cn(
                            "p-2 rounded-xl text-xs transition-all cursor-pointer",
                            isFav
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                              : "bg-white/5 text-pearl/60 hover:bg-white/10 hover:text-pearl"
                          )}
                          title={isFav ? "Nos Favoritos" : "Marcar como Favorito"}
                        >
                          <Star className={cn("w-3.5 h-3.5", isFav && "fill-amber-300")} />
                        </button>
                      </div>

                      {/* Right: Details / AI button */}
                      <button
                        onClick={() => {
                          setSelectedBookForDetails(book);
                          setDeepAnalysis(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber/15 hover:bg-amber/25 text-amber font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Detalhes
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: CONSULTOR DE LEITURA IA                               */}
      {/* ============================================================== */}
      {activeMainTab === "consultor-ia" && (
        <div className="space-y-6">
          {/* AI Banner / Prompt Box */}
          <div className="glow-card p-6 md:p-8 rounded-3xl border-amber/30 bg-gradient-to-r from-amber/10 via-navy-light to-navy space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Inteligência Católica & Teológica
              </div>
              <h3 className="text-xl md:text-3xl font-display font-bold text-pearl">
                Peça Recomendações de Livros Sob Medida
              </h3>
              <p className="text-pearl/70 text-xs md:text-sm max-w-2xl leading-relaxed">
                Diga à IA o que você está vivendo, qual dúvida teológica quer esclarecer ou qual aspecto de Deus deseja contemplar. 
                A IA analisará séculos de literatura católica e recomendará as leituras ideais para a sua alma.
              </p>
            </div>

            {/* Custom Input */}
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="Ex: 'Quero livros para compreender a Presença Real de Jesus na Eucaristia', ou 'Estou passando por ansiedade e quero livros para rezar melhor', ou 'Melhores livros de São Tomás de Aquino para iniciantes'..."
                  className="w-full bg-navy/90 border border-amber/30 rounded-2xl p-4 text-xs md:text-sm text-pearl placeholder-pearl/40 focus:border-amber focus:ring-1 focus:ring-amber/50 focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-pearl/50">
                  A IA consulta Doutores da Igreja, Santos, Patrística e Teólogos Católicos.
                </span>

                <button
                  onClick={() => handleRequestAiRecommendations()}
                  disabled={isLoadingAiRecs || !aiCustomPrompt.trim()}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer",
                    isLoadingAiRecs || !aiCustomPrompt.trim()
                      ? "bg-white/10 text-pearl/40 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber to-amber-500 hover:from-amber-400 text-navy shadow-amber/20 hover:scale-105"
                  )}
                >
                  {isLoadingAiRecs ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Consultando Biblioteca Sagrada...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Pedir Recomendações à IA
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Themes Preset Grid */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] uppercase font-bold text-pearl/50">
                Ou selecione uma temática pronta para consultar:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {AI_SUGGESTION_THEMES.map((theme, i) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setAiCustomPrompt(theme.query);
                        handleRequestAiRecommendations(theme.query);
                      }}
                      disabled={isLoadingAiRecs}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber/30 text-left transition-all group flex items-start gap-3 cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-amber/10 text-amber group-hover:scale-110 transition-transform shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-pearl group-hover:text-amber transition-colors">
                          {theme.title}
                        </h4>
                        <p className="text-[11px] text-pearl/60 line-clamp-2">
                          {theme.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Output / Results */}
          {aiError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {isLoadingAiRecs && (
            <div className="glow-card p-12 text-center rounded-3xl border-amber/20 bg-navy-light/40 space-y-4">
              <Sparkles className="w-10 h-10 text-amber animate-bounce mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-pearl">Selecionando as Melhores Obras...</h4>
                <p className="text-xs text-pearl/60 max-w-md mx-auto">
                  A IA Católica está pesquisando títulos clássicos, citações de santos e justificativas teológicas para seu pedido.
                </p>
              </div>
            </div>
          )}

          {!isLoadingAiRecs && aiRecommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-pearl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber" />
                  Obras Selecionadas pela IA para Você ({aiRecommendations.length})
                </h4>
                <span className="text-xs text-pearl/50">
                  Clique em "Salvar na Biblioteca" para compartilhar com outros usuários
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {aiRecommendations.map((book) => {
                  const isSaved = savedAiBookIds.includes(book.id);

                  return (
                    <div
                      key={book.id}
                      className="glow-card p-5 rounded-2xl border-amber/30 bg-gradient-to-br from-navy via-navy-light to-navy space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber/20 text-amber border border-amber/30">
                            {book.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            {book.level}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-pearl">{book.title}</h4>
                          <p className="text-xs font-semibold text-amber mt-0.5">{book.author}</p>
                        </div>

                        <p className="text-pearl/80 text-xs leading-relaxed">
                          {book.description}
                        </p>

                        <div className="p-3 rounded-xl bg-amber/10 border border-amber/20 space-y-1 text-xs">
                          <span className="text-[10px] uppercase font-bold text-amber block">
                            Por que ler este livro:
                          </span>
                          <p className="text-pearl/90 leading-relaxed text-[11px]">
                            {book.whyRead}
                          </p>
                        </div>

                        {book.keyQuote && (
                          <div className="p-3 rounded-xl bg-navy/80 border border-white/5 text-[11px] text-pearl/70 italic font-serif">
                            "{book.keyQuote}"
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedBookForDetails(book);
                            setDeepAnalysis(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-pearl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detalhes
                        </button>

                        <button
                          onClick={() => handleSaveAiBookToLibrary(book)}
                          disabled={isSaved}
                          className={cn(
                            "px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer",
                            isSaved
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                              : "bg-amber text-navy hover:bg-amber-400 shadow-amber/20"
                          )}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Salvo na Biblioteca!
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Salvar na Biblioteca
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 3: MINHA ESTANTE ESPIRITUAL                               */}
      {/* ============================================================== */}
      {activeMainTab === "minha-estante" && (
        <div className="space-y-6">
          {/* Subfilter */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShelfFilter("todas")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  shelfFilter === "todas" ? "bg-amber text-navy" : "bg-white/5 text-pearl/70 hover:bg-white/10"
                )}
              >
                Todas ({shelf.wantToRead.length + shelf.read.length + shelf.favorites.length})
              </button>
              <button
                onClick={() => setShelfFilter("wantToRead")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  shelfFilter === "wantToRead" ? "bg-amber text-navy" : "bg-white/5 text-pearl/70 hover:bg-white/10"
                )}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Quero Ler ({shelf.wantToRead.length})
              </button>
              <button
                onClick={() => setShelfFilter("read")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  shelfFilter === "read" ? "bg-amber text-navy" : "bg-white/5 text-pearl/70 hover:bg-white/10"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Já Li & Concluídos ({shelf.read.length})
              </button>
              <button
                onClick={() => setShelfFilter("favorites")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  shelfFilter === "favorites" ? "bg-amber text-navy" : "bg-white/5 text-pearl/70 hover:bg-white/10"
                )}
              >
                <Star className="w-3.5 h-3.5" />
                Favoritos ({shelf.favorites.length})
              </button>
            </div>

            <span className="text-xs text-pearl/50">
              Sua estante é salva no seu dispositivo e sincronizada
            </span>
          </div>

          {shelfBooks.length === 0 ? (
            <div className="glow-card p-12 text-center rounded-3xl border-white/10 bg-navy-light/40 space-y-4">
              <Bookmark className="w-12 h-12 text-pearl/30 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-pearl">Sua estante ainda está vazia</h4>
                <p className="text-pearl/60 text-xs max-w-md mx-auto">
                  Você ainda não adicionou livros a esta lista. Navegue pela aba "Explorar Acervo" ou peça recomendações à IA e clique no ícone de marcador ou estrela para salvar suas obras favoritas!
                </p>
              </div>
              <button
                onClick={() => setActiveMainTab("explorar")}
                className="px-5 py-2.5 rounded-xl bg-amber text-navy font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer"
              >
                Explorar Livros Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {shelfBooks.map((book) => {
                const isRead = shelf.read.includes(book.id);
                const isWant = shelf.wantToRead.includes(book.id);
                const isFav = shelf.favorites.includes(book.id);

                return (
                  <div
                    key={book.id}
                    className="glow-card p-5 rounded-2xl border-white/10 bg-navy-light/50 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber/15 text-amber border border-amber/25">
                          {book.category}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {isRead && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Lido
                            </span>
                          )}
                          {isWant && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber/20 text-amber border border-amber/30 flex items-center gap-1">
                              <Bookmark className="w-3 h-3" /> Quero Ler
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-pearl">{book.title}</h4>
                        <p className="text-xs text-pearl/70">{book.author}</p>
                      </div>

                      <p className="text-pearl/70 text-xs leading-relaxed line-clamp-3">
                        {book.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleShelf(book.id, "read")}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all",
                            isRead
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-white/5 text-pearl/60 hover:bg-white/10"
                          )}
                          title="Marcar como já lido"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {isRead ? "Concluído" : "Marcar Lido"}
                        </button>

                        <button
                          onClick={() => handleToggleShelf(book.id, "favorites")}
                          className={cn(
                            "p-1.5 rounded-lg text-xs transition-all",
                            isFav ? "text-amber" : "text-pearl/40 hover:text-pearl"
                          )}
                        >
                          <Star className={cn("w-3.5 h-3.5", isFav && "fill-amber")} />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedBookForDetails(book);
                          setDeepAnalysis(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber/15 hover:bg-amber/25 text-amber text-xs font-bold transition-all"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADICIONAR NOVO LIVRO (COMUNIDADE)                       */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isAddBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glow-card w-full max-w-2xl rounded-3xl border-amber/30 bg-navy p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative my-8"
            >
              <button
                onClick={() => setIsAddBookModalOpen(false)}
                className="absolute right-5 top-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-pearl/60 hover:text-pearl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/15 border border-amber/30 text-amber text-xs font-bold uppercase tracking-wider">
                  <Plus className="w-3.5 h-3.5" />
                  Compartilhar Leitura Sagrada
                </div>
                <h3 className="text-xl md:text-2xl font-display font-bold text-pearl">
                  Indicar um Livro sobre Deus & Catolicismo
                </h3>
                <p className="text-pearl/70 text-xs leading-relaxed">
                  Ajude outros irmãos e buscadores a encontrar grandes tesouros da espiritualidade cristã. 
                  Sua indicação ficará disponível para toda a comunidade.
                </p>
              </div>

              {formSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-pulse">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-pearl/80">
                      Título da Obra <span className="text-amber">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: As Glórias de Maria"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-navy-light/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-pearl placeholder-pearl/40 focus:border-amber focus:outline-none"
                    />
                  </div>

                  {/* Author */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-pearl/80">
                      Autor <span className="text-amber">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Santo Afonso Maria de Ligório"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      className="w-full bg-navy-light/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-pearl placeholder-pearl/40 focus:border-amber focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-pearl/80">
                      Categoria <span className="text-amber">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-navy-light/80 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-pearl focus:border-amber focus:outline-none"
                    >
                      {CATEGORIES.filter(c => c !== "Todas").map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Level */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-pearl/80">
                      Nível de Leitura
                    </label>
                    <select
                      value={formLevel}
                      onChange={(e) => setFormLevel(e.target.value as any)}
                      className="w-full bg-navy-light/80 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-pearl focus:border-amber focus:outline-none"
                    >
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado / Teológico">Avançado / Teológico</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-pearl/80">
                    Descrição / Sinopse <span className="text-amber">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Conte do que se trata o livro, o contexto histórico ou o tema central..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-navy-light/80 border border-white/15 rounded-xl p-3 text-xs text-pearl placeholder-pearl/40 focus:border-amber focus:outline-none resize-none"
                  />
                </div>

                {/* Why Read */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-pearl/80">
                    Por que você recomenda este livro sobre Deus ou Catolicismo? <span className="text-amber">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ex: Como este livro tocou sua vida de oração, converteu seu coração ou aumentou seu amor pela Igreja..."
                    value={formWhyRead}
                    onChange={(e) => setFormWhyRead(e.target.value)}
                    className="w-full bg-navy-light/80 border border-white/15 rounded-xl p-3 text-xs text-pearl placeholder-pearl/40 focus:border-amber focus:outline-none resize-none"
                  />
                </div>

                {/* Key Quote (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-pearl/80">
                    Frase Marcante / Citação Favorita (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 'Quem reza certamente se salva, quem não reza certamente se condena.'"
                    value={formKeyQuote}
                    onChange={(e) => setFormKeyQuote(e.target.value)}
                    className="w-full bg-navy-light/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-pearl placeholder-pearl/40 focus:border-amber focus:outline-none font-serif italic"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Estimativa de Páginas */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-pearl/80">
                      Páginas (estimativa)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: ~280 págs"
                      value={formPages}
                      onChange={(e) => setFormPages(e.target.value)}
                      className="w-full bg-navy-light/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-pearl placeholder-pearl/40 focus:border-amber focus:outline-none"
                    />
                  </div>

                  {/* Nome de quem indicou */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-pearl/80">
                      Seu Nome / Como quer aparecer
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Maria Clara ou Irmão na Fé"
                      value={formAddedByName}
                      onChange={(e) => setFormAddedByName(e.target.value)}
                      className="w-full bg-navy-light/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-pearl placeholder-pearl/40 focus:border-amber focus:outline-none"
                    />
                  </div>
                </div>

                {/* Link (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-pearl/80">
                    Link de Referência / Onde Comprar ou Ler (Opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    className="w-full bg-navy-light/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-pearl placeholder-pearl/40 focus:border-amber focus:outline-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddBookModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-pearl/70 font-bold text-xs"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingBook}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber to-amber-500 hover:from-amber-400 text-navy font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber/20 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingBook ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Publicar Indicação na Biblioteca
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: DETALHES DO LIVRO & ANÁLISE IA                           */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedBookForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glow-card w-full max-w-3xl rounded-3xl border-amber/30 bg-navy p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative my-8"
            >
              <button
                onClick={() => {
                  setSelectedBookForDetails(null);
                  stopNativeTTS();
                  setIsPlayingAudio(false);
                }}
                className="absolute right-5 top-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-pearl/60 hover:text-pearl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Book Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber/15 text-amber border border-amber/30">
                    {selectedBookForDetails.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {selectedBookForDetails.level}
                  </span>
                  {selectedBookForDetails.badge && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-white/10 text-pearl border border-white/10">
                      {selectedBookForDetails.badge}
                    </span>
                  )}
                  {selectedBookForDetails.addedByName && (
                    <span className="text-[11px] text-pearl/50 ml-auto flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Indicado por {selectedBookForDetails.addedByName}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-pearl">
                    {selectedBookForDetails.title}
                  </h3>
                  <p className="text-sm font-semibold text-amber mt-1 flex items-center gap-2">
                    <span>{selectedBookForDetails.author}</span>
                    {selectedBookForDetails.historicalPeriod && (
                      <span className="text-pearl/40 text-xs font-normal">
                        ({selectedBookForDetails.historicalPeriod})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Quote Hero Banner */}
              {selectedBookForDetails.keyQuote && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber/15 via-navy-light to-navy border border-amber/25 relative space-y-2">
                  <MessageSquareQuote className="w-6 h-6 text-amber/40 absolute right-4 top-4" />
                  <span className="text-[10px] uppercase font-bold text-amber tracking-wider block">
                    Citação Imortal da Obra:
                  </span>
                  <p className="text-pearl font-serif italic text-sm md:text-base leading-relaxed pr-8">
                    "{selectedBookForDetails.keyQuote}"
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopyQuote(selectedBookForDetails.keyQuote!)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-pearl/70 text-[11px] font-bold flex items-center gap-1"
                    >
                      {copiedQuote ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedQuote ? "Copiado!" : "Copiar Citação"}
                    </button>

                    <button
                      onClick={() => handleToggleAudio(selectedBookForDetails.keyQuote!)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-pearl/70 text-[11px] font-bold flex items-center gap-1"
                    >
                      {isPlayingAudio ? <VolumeX className="w-3 h-3 text-amber" /> : <Volume2 className="w-3 h-3" />}
                      {isPlayingAudio ? "Pausar Áudio" : "Ouvir"}
                    </button>
                  </div>
                </div>
              )}

              {/* Description & Why Read */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-pearl/50">
                    Sinopse & Conteúdo da Obra
                  </h4>
                  <p className="text-pearl/80 text-xs md:text-sm leading-relaxed">
                    {selectedBookForDetails.description}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    Por que este livro é transformador para sua fé:
                  </h4>
                  <p className="text-pearl/80 text-xs md:text-sm leading-relaxed">
                    {selectedBookForDetails.whyRead}
                  </p>
                </div>

                {selectedBookForDetails.link && (
                  <div className="pt-1">
                    <a
                      href={selectedBookForDetails.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-amber hover:underline font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Acessar Obra / Referência Externa
                    </a>
                  </div>
                )}
              </div>

              {/* AI Deep Analysis Section */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber" />
                    <h4 className="text-sm font-bold text-pearl">
                      Análise Espiritual & 5 Lições Centrais com a IA
                    </h4>
                  </div>

                  {!deepAnalysis && (
                    <button
                      onClick={() => handleGenerateDeepAnalysis(selectedBookForDetails)}
                      disabled={isLoadingAnalysis}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber to-amber-500 hover:from-amber-400 text-navy font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber/20 cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingAnalysis ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Analisando Livro...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Gerar Análise e Lições com IA
                        </>
                      )}
                    </button>
                  )}
                </div>

                {isLoadingAnalysis && (
                  <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <Sparkles className="w-8 h-8 text-amber animate-spin mx-auto" />
                    <p className="text-xs text-pearl/70 font-medium">
                      Consultando a teologia e extraindo os 5 ensinamentos de ouro desta obra...
                    </p>
                  </div>
                )}

                {deepAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-navy-light/70 border border-amber/25 space-y-5"
                  >
                    {/* Resumo Teológico */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-amber">
                        Mensagem de Deus através desta Obra:
                      </span>
                      <p className="text-pearl/80 text-xs md:text-sm leading-relaxed">
                        {deepAnalysis.resumoTeologico}
                      </p>
                    </div>

                    {/* 5 Lições */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] uppercase font-bold text-amber">
                        5 Lições Espirituais para a sua Vida:
                      </span>
                      <div className="space-y-2">
                        {deepAnalysis.licoesEspirituais?.map((licao: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                            <h5 className="text-xs font-bold text-pearl flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber/20 text-amber text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              {licao.titulo}
                            </h5>
                            <p className="text-pearl/70 text-xs pl-7 leading-relaxed">
                              {licao.explicacao}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Passagem Bíblica */}
                    {deepAnalysis.passagemBiblicaRelacionada && (
                      <div className="p-3 rounded-xl bg-amber/10 border border-amber/20 text-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Passagem Bíblica Correspondente:
                        </span>
                        <p className="text-pearl/90 italic font-serif">
                          "{deepAnalysis.passagemBiblicaRelacionada}"
                        </p>
                      </div>
                    )}

                    {/* Oração Inspirada */}
                    {deepAnalysis.oracaoInspirada && (
                      <div className="p-4 rounded-xl bg-navy/90 border border-white/10 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-amber flex items-center gap-1">
                          <Heart className="w-3 h-3" /> Oração Inspirada na Obra:
                        </span>
                        <p className="text-pearl/90 text-xs italic font-serif leading-relaxed">
                          "{deepAnalysis.oracaoInspirada}"
                        </p>
                        <button
                          onClick={() => handleToggleAudio(deepAnalysis.oracaoInspirada)}
                          className="px-3 py-1.5 rounded-lg bg-amber/15 hover:bg-amber/25 text-amber text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          {isPlayingAudio ? "Pausar Oração" : "Rezar com Voz Guiada"}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLikeBook(selectedBookForDetails.id)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-rose-400 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-400" />
                    {selectedBookForDetails.likes} Curtidas
                  </button>

                  <button
                    onClick={() => handleToggleShelf(selectedBookForDetails.id, "wantToRead")}
                    className={cn(
                      "px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all",
                      shelf.wantToRead.includes(selectedBookForDetails.id)
                        ? "bg-amber/20 text-amber border border-amber/30"
                        : "bg-white/5 hover:bg-white/10 text-pearl/70"
                    )}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {shelf.wantToRead.includes(selectedBookForDetails.id) ? "Na Lista Quero Ler" : "Quero Ler"}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedBookForDetails(null);
                    stopNativeTTS();
                    setIsPlayingAudio(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-pearl font-bold text-xs"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
