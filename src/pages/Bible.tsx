import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Book, ChevronRight, Settings2, Share2, Copy, Highlighter, FileText, X, Star, Volume2, Square } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { bibleBooks } from "../constants/bibleData";

import { getBibleBooks, getBibleChapter } from "../lib/bibleApi";

const translations = [
  { id: "ARA", name: "Almeida Revista e Atualizada (ARA)" },
  { id: "NTLH", name: "Nova Tradução na Linguagem de Hoje (NTLH)" },
  { id: "NVIPT", name: "Nova Versão Internacional (NVI)" }
];

export default function Bible() {
  const { user } = useAuth();
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };
  
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<{v: number, t: string}[]>([]);
  const [dynamicBooks, setDynamicBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState(18);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("ARA");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);

  const loadVoices = () => {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes("pt-BR") || v.lang.includes("pt_BR") || v.lang === "pt");
    setAvailableVoices(voices);
    
    if (voices.length > 0 && !selectedVoiceURI) {
      // Tenta encontrar uma voz humanizada online nativa como default
      const preferredKeywords = ["natural", "online", "premium", "luciana", "google português do brasil", "antonio", "francisca"];
      let defaultVoice = voices[0];
      for (const keyword of preferredKeywords) {
        const match = voices.find(v => v.name.toLowerCase().includes(keyword));
        if (match) {
          defaultVoice = match;
          break;
        }
      }
      setSelectedVoiceURI(defaultVoice.voiceURI);
    }
  };

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    // Force load voices in the background so they are ready when the user clicks
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const toggleAudio = () => {
    if (!synthRef.current) return;
    
    if (isPlayingAudio) {
      synthRef.current.cancel();
      setIsPlayingAudio(false);
    } else {
      if (verses.length === 0) return;
      const textToRead = verses.map(v => v.t).join(". ");
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = "pt-BR";
      utterance.rate = audioSpeed;
      
      if (selectedVoiceURI) {
        const voiceToUse = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (voiceToUse) {
          utterance.voice = voiceToUse;
        }
      }
      
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        showNotification("Erro ao reproduzir áudio.");
      };
      
      synthRef.current.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  // Busca lista de livros dinâmica da API
  useEffect(() => {
    const fetchBooks = async () => {
      setLoadingBooks(true);
      try {
        const data = await getBibleBooks(selectedVersion);
        setDynamicBooks(data);
      } catch (e) {
        console.error("Erro ao buscar livros dinâmicos:", e);
        // Fallback para lista estática se a API falhar miseravelmente
        setDynamicBooks(bibleBooks.filter(b => 
          (selectedVersion === "VC" || selectedVersion === "BJPT") ? true : !b.isDeuterocanonical
        ).map(b => ({ bookid: b.bollsId, name: b.name, chapters: b.chapters })));
      } finally {
        setLoadingBooks(false);
      }
    };
    fetchBooks();
  }, [selectedVersion]);

  // Livros formatados para a UI
  const books = useMemo(() => {
    return dynamicBooks.map(b => ({
      name: b.name,
      chapters: b.chapters,
      bollsId: b.bookid
    }));
  }, [dynamicBooks]);

  // Fallback de compatibilidade ao trocar de versão
  useEffect(() => {
    if (selectedBook && books.length > 0) {
      const bookExists = books.some(b => b.name === selectedBook);
      if (!bookExists) {
        setSelectedBook(books[0]?.name || "Gênesis");
        setSelectedChapter(1);
        showNotification("Este livro não existe na versão selecionada.");
      }
    }
  }, [selectedVersion, books, selectedBook]);

  const currentVersionName = useMemo(() => {
    return translations.find(v => v.id === selectedVersion)?.name || "Almeida";
  }, [selectedVersion]);

  const handleVerseClick = (num: number) => {
    setSelectedVerses(prev => 
      prev.includes(num) ? prev.filter(v => v !== num) : [...prev, num]
    );
  };

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      const fetchVerses = async () => {
        setLoading(true);
        setError(null);
        try {
          const bookData = books.find(b => b.name === selectedBook);
          if (!bookData) throw new Error("Livro não encontrado.");

          const data = await getBibleChapter(selectedVersion, bookData.bollsId, selectedChapter);
          
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Não foram encontrados versículos para esta seleção.");
          }

          const formattedVerses = data.map((v: any) => ({
            v: v.verse,
            t: v.text.replace(/<[^>]*>?/gm, '') // Remove HTML tags if present
          }));
          
          setVerses(formattedVerses);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Erro desconhecido";
          setError(`Erro: ${msg}. Verifique se o livro está disponível nesta versão.`);
          console.error("Bible Fetch Error:", e);
          setVerses([]);
        } finally {
          setLoading(false);
        }
      };
      fetchVerses();
    } else {
      setVerses([]);
    }
  }, [selectedBook, selectedChapter, selectedVersion, books]);

  return (
    <div className="h-[calc(100vh-200px)] md:h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 relative">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-amber text-navy px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 border border-white/20 whitespace-nowrap"
          >
            <Star className="w-5 h-5 fill-navy" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <aside className={cn(
        "bg-navy/50 border border-amber/10 rounded-3xl p-6 transition-all duration-500 overflow-y-auto",
        selectedChapter ? "hidden md:flex flex-col w-64" : "flex flex-col w-full"
      )}>
        <div className="relative mb-6">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pearl/40 w-4 h-4" />
           <input 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             placeholder="Buscar livro ou tema..."
             className="w-full bg-white/5 border border-amber/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-amber transition-colors"
           />
        </div>

        {!selectedBook && (
          <div className="flex items-center justify-between px-1 mb-4">
             <span className="text-[10px] text-amber/60 font-bold uppercase tracking-widest leading-none">
               {loadingBooks ? (
                 <span className="animate-pulse">Sincronizando livros...</span>
               ) : (
                 `${books.length} Livros disponíveis`
               )}
             </span>
             {searchQuery && !loadingBooks && (
               <span className="text-[9px] text-pearl/30 font-medium">
                 {books.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())).length} encontrados
               </span>
             )}
          </div>
        )}

        {!selectedBook ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2">
            {books.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())).map(book => (
              <button 
                key={book.name}
                onClick={() => setSelectedBook(book.name)}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-left group"
              >
                <div className="flex items-center gap-3">
                   <Book className="w-4 h-4 text-amber/40 group-hover:text-amber" />
                   <span className="font-medium text-sm">{book.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-pearl/20" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={() => { setSelectedBook(null); setSelectedChapter(null); }}
              className="text-amber text-xs font-bold uppercase flex items-center gap-2"
            >
               <ArrowBack className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-2xl font-display font-bold">{selectedBook}</h2>
            <div className="grid grid-cols-4 gap-2">
               {Array.from({ length: books.find(b => b.name === selectedBook)?.chapters || 0 }).map((_, i) => (
                 <button 
                   key={i}
                   onClick={() => setSelectedChapter(i + 1)}
                   className={cn(
                     "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                     selectedChapter === i + 1 ? "bg-amber text-navy" : "bg-white/5 hover:bg-white/10"
                   )}
                 >
                   {i + 1}
                 </button>
               ))}
            </div>
          </div>
        )}
      </aside>

      <main className={cn(
        "flex-1 bg-navy/50 border border-amber/10 rounded-3xl flex flex-col overflow-hidden",
        !selectedChapter && "hidden md:flex items-center justify-center text-center p-12"
      )}>
        {!selectedChapter ? (
          <div className="max-w-xs space-y-4 opacity-40">
             <Book className="w-16 h-16 mx-auto" />
             <p className="font-serif italic text-lg">"Lâmpada para os meus pés é tua palavra, e luz para o meu caminho."</p>
          </div>
        ) : (
          <>
            <header className="p-4 md:p-6 border-b border-amber/10 flex items-center justify-between bg-navy/80 backdrop-blur-md relative z-40">
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setSelectedChapter(null)}
                   className="md:hidden p-2 -ml-2 rounded-lg text-pearl/60 hover:text-amber hover:bg-white/5 transition-colors"
                 >
                   <ArrowBack className="w-5 h-5" />
                 </button>
                 <div>
                   <h2 className="text-xl md:text-2xl font-display font-bold">{selectedBook} {selectedChapter}</h2>
                   <p className="text-[10px] text-amber font-bold tracking-widest">{currentVersionName}</p>
                 </div>
               </div>
               <div className="flex items-center gap-1 md:gap-2">
                 <button 
                    onClick={toggleAudio}
                    className={cn(
                      "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold mr-2",
                      isPlayingAudio ? "bg-amber text-navy hover:bg-amber/80" : "hover:bg-white/5 text-pearl/60"
                    )}
                 >
                    {isPlayingAudio ? (
                      <><Square className="w-4 h-4 fill-navy" /> Parar</>
                    ) : (
                      <><Volume2 className="w-4 h-4" /> Ouvir</>
                    )}
                 </button>
                 <div className="relative">
                   <button 
                     onClick={() => setShowSettings(!showSettings)}
                     className={cn(
                       "p-2 rounded-lg transition-colors",
                       showSettings ? "bg-amber text-navy" : "hover:bg-white/5 text-pearl/60"
                     )}
                   >
                     <Settings2 className="w-4 h-4" />
                   </button>

                   <AnimatePresence>
                     {showSettings && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute right-0 top-full mt-2 w-72 bg-navy border border-amber/20 rounded-2xl shadow-2xl p-4 z-50 overflow-hidden"
                       >
                         <div className="space-y-4">
                            <div>
                               <label className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest block mb-2">Versão da Bíblia</label>
                               <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                 {translations.map(v => (
                                   <button 
                                     key={v.id}
                                     onClick={() => setSelectedVersion(v.id)}
                                     className={cn(
                                       "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
                                       selectedVersion === v.id ? "bg-amber/20 text-amber font-bold" : "hover:bg-white/5 text-pearl/60"
                                     )}
                                   >
                                     {v.name}
                                   </button>
                                 ))}
                               </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                               <label className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest block mb-2">Voz da Narração</label>
                               <select 
                                 value={selectedVoiceURI} 
                                 onChange={(e) => {
                                   setSelectedVoiceURI(e.target.value);
                                   if (isPlayingAudio && synthRef.current) {
                                     synthRef.current.cancel();
                                     setIsPlayingAudio(false);
                                     showNotification("Voz alterada. Clique em Ouvir novamente.");
                                   }
                                 }}
                                 className="w-full bg-white/5 border border-amber/10 rounded-lg px-3 py-2 text-xs text-pearl focus:border-amber outline-none appearance-none"
                               >
                                 {availableVoices.length === 0 && <option value="">Carregando vozes...</option>}
                                 {availableVoices.map(v => (
                                   <option key={v.voiceURI} value={v.voiceURI} className="bg-navy text-pearl">
                                     {v.name}
                                   </option>
                                 ))}
                               </select>
                               {availableVoices.length <= 1 && (
                                 <p className="text-[9px] text-pearl/30 mt-2 leading-tight">
                                   Seu celular só possui essa voz instalada. Procure por "Vozes" ou "Acessibilidade" nas configurações do seu aparelho para adicionar pacotes novos.
                                 </p>
                               )}
                            </div>

                            <div className="pt-4 border-t border-white/5">
                               <label className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest block mb-2">Tamanho da Fonte</label>
                               <div className="flex items-center gap-4">
                                 <input 
                                   type="range" 
                                   min="14" 
                                   max="24" 
                                   value={fontSize} 
                                   onChange={(e) => setFontSize(parseInt(e.target.value))}
                                   className="flex-1 accent-amber"
                                 />
                                 <span className="text-xs font-bold text-amber">{fontSize}px</span>
                               </div>
                            </div>
                            
                            <div className="pt-4 border-t border-white/5">
                               <label className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest block mb-2">Velocidade do Áudio</label>
                               <div className="flex items-center gap-4">
                                 <input 
                                   type="range" 
                                   min="0.5" 
                                   max="2" 
                                   step="0.25"
                                   value={audioSpeed} 
                                   onChange={(e) => {
                                      setAudioSpeed(parseFloat(e.target.value));
                                      if (isPlayingAudio && synthRef.current) {
                                         synthRef.current.cancel();
                                         setIsPlayingAudio(false);
                                         showNotification("Velocidade alterada. Clique em Ouvir novamente.");
                                      }
                                   }}
                                   className="flex-1 accent-amber"
                                 />
                                 <span className="text-xs font-bold text-amber">{audioSpeed}x</span>
                               </div>
                            </div>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
                 
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-6 lg:space-y-8 select-text">
               {loading ? (
                 <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                    <div className="w-12 h-12 border-4 border-amber/20 border-t-amber rounded-full animate-spin" />
                    <p className="font-serif italic">Buscando as Sagradas Escrituras...</p>
                 </div>
               ) : error ? (
                 <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                    <p className="text-amber font-bold">{error}</p>
                    <p className="text-pearl/40 text-sm max-w-xs">Verifique a conexão ou se o livro está disponível na versão atual.</p>
                 </div>
               ) : (
                 <>
                   {verses.map(v => (
                     <motion.p 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       key={v.v}
                       onClick={() => handleVerseClick(v.v)}
                       style={{ fontSize: `${fontSize}px` }}
                       className={cn(
                         "font-serif leading-relaxed transition-all p-2 rounded-lg cursor-pointer",
                         selectedVerses.includes(v.v) ? "bg-amber/10 text-amber" : "hover:bg-white/5 text-pearl/80"
                       )}
                     >
                       <sup className="text-[10px] mr-2 text-amber font-bold">{v.v}</sup>
                       {v.t}
                     </motion.p>
                   ))}
                 </>
               )}
            </div>

            <AnimatePresence>
               {selectedVerses.length > 0 && (
                 <motion.div 
                   initial={{ y: 100 }}
                   animate={{ y: 0 }}
                   exit={{ y: 100 }}
                   className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-navy/90 backdrop-blur-xl border border-amber/20 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-2xl z-50"
                 >
                   <p className="text-xs font-bold text-amber">{selectedVerses.length} selecionado(s)</p>
                   <div className="h-4 w-px bg-white/10" />
                   <div className="flex items-center gap-4">
                     <button onClick={() => showNotification("Marcado!")} className="p-2 text-pearl/60 hover:text-amber transition-colors"><Highlighter className="w-5 h-5" /></button>
                     <button onClick={() => showNotification("Nota salva!")} className="p-2 text-pearl/60 hover:text-amber transition-colors"><FileText className="w-5 h-5" /></button>
                     <button 
                       onClick={() => {
                         const txt = verses.filter(v => selectedVerses.includes(v.v)).map(v => `${v.v}. ${v.t}`).join('\n');
                         navigator.clipboard.writeText(txt);
                         showNotification("Copiado!");
                       }}
                       className="p-2 text-pearl/60 hover:text-amber transition-colors"
                     >
                       <Copy className="w-5 h-5" />
                     </button>
                     <button onClick={() => showNotification("Opções de compartilhamento")} className="p-2 text-pearl/60 hover:text-amber transition-colors"><Share2 className="w-5 h-5" /></button>
                   </div>
                   <button onClick={() => setSelectedVerses([])} className="text-pearl/40 hover:text-pearl transition-colors ml-2">✕</button>
                 </motion.div>
               )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}

function ArrowBack({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}
