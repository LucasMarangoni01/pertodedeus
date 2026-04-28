import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router-dom";
import { Search, Book, ChevronRight, ChevronLeft, Settings2, Share2, Copy, Highlighter, FileText, X, Star, Volume2, Square, PlayCircle, Sparkles, Brain, Lightbulb, Compass, MessageSquareQuote, Save, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { usePreference } from "../contexts/PreferenceContext";
import { bibleBooks } from "../constants/bibleData";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

import { getBibleBooks, getBibleChapter, searchBible } from "../lib/bibleApi";
import { getChapterTitle } from "../services/bibleService";
import { trackSpiritualAction } from "../services/userService";
import { explainPassage, summarizeVerse, summarizeChapter } from "../services/geminiService";
import { 
  marcarVersiculo, 
  favoritarVersiculo,
  salvarNota, 
  carregarMarcadores, 
  carregarFavoritos,
  carregarNotas, 
  BibleMarker, 
  BibleFavorite,
  BibleNote,
  deleteNoteAction 
} from "../services/bibleActions";

const translations = [
  { id: "ARA", name: "ARA - Almeida Revista e Atualizada" },
  { id: "NVIPT", name: "NVI - Nova Versão Internacional", alias: "NVI" },
  { id: "NTLH", name: "NTLH - Nova Tradução na Linguagem de Hoje" },
  { id: "NVT", name: "NVT - Nova Versão Transformadora" },
  { id: "NAA", name: "NAA - Nova Almeida Atualizada" },
  { id: "ACF", name: "ACF - Almeida Corrigida Fiel" },
  { id: "AA", name: "AA - Almeida Atualizada" }
];

export default function Bible() {
  const { user, isGuest } = useAuth();
  const location = useLocation();
  const { preferences, togglePreference } = usePreference();
  const showNotes = preferences.showNotes;
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
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
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [activeTestament, setActiveTestament] = useState<'Velho' | 'Novo'>('Velho');
  const [globalResults, setGlobalResults] = useState<any[]>([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [showGlobalResults, setShowGlobalResults] = useState(false);
  const [chapterTitle, setChapterTitle] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [verseSummary, setVerseSummary] = useState<string | null>(null);
  const [loadingChapterSummary, setLoadingChapterSummary] = useState(false);
  const [chapterSummary, setChapterSummary] = useState<string | null>(null);
  const [chapterMarkers, setChapterMarkers] = useState<BibleMarker[]>([]);
  const [chapterFavorites, setChapterFavorites] = useState<BibleFavorite[]>([]);
  const [chapterNotes, setChapterNotes] = useState<BibleNote[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [savingAction, setSavingAction] = useState(false);
  const lastSavedVerse = useRef<number | null>(null);
  const lastTrackedChapter = useRef<string>("");
  
  const getInitialVersion = () => {
    const stored = localStorage.getItem("bibleVersion") || "NVI";
    const match = translations.find(t => t.alias === stored || t.id === stored);
    return match ? match.id : "ARA";
  };

  const [selectedVersion, setSelectedVersion] = useState(getInitialVersion);

  const saveReadingProgress = async (book: string, bookId: number, chapter: number, verse: number) => {
    const progress = { book, bookId, chapter, verse, version: selectedVersion, updatedAt: new Date().toISOString() };
    localStorage.setItem("bibleProgress", JSON.stringify(progress));

    if (user?.uid && !isGuest) {
      try {
        const operation = updateDoc(doc(db, "users", user.uid), {
          bibleProgress: {
            ...progress,
            updatedAt: serverTimestamp()
          }
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT_FIREBASE")), 5000)
        );

        await Promise.race([operation, timeoutPromise]);
      } catch (err: any) {
        console.error("Save Progress Error:", err);
      }
    }
  };

  const continueReading = () => {
    const saved = user?.bibleProgress || (() => {
      const stored = localStorage.getItem("bibleProgress");
      return stored ? JSON.parse(stored) : null;
    })();

    if (saved) {
      const { book, bookId, chapter, verse } = saved;
      // We no longer override selectedVersion with saved.version here 
      // to respect the version explicitly chosen in Settings or initialized from user preference.
      // If the user wants to change version, they do it in settings and it should stick.
      setSelectedBook(book);
      setSelectedBookId(bookId);
      setSelectedChapter(chapter);
      lastSavedVerse.current = verse;
      showNotification(`Retomando em ${book} ${chapter}:${verse}`);
    } else {
      setSelectedBook("Gênesis");
      setSelectedBookId(1);
      setSelectedChapter(1);
      lastSavedVerse.current = 1;
      showNotification("Iniciando em Gênesis 1:1");
    }
  };

  useEffect(() => {
    if (!selectedBook && !loadingBooks) {
      // Check if we have navigation state from another page (like Profile favorites)
      const navState = location.state as { book: string, chapter: number, verse: number } | null;
      if (navState) {
        const book = bibleBooks.find(b => b.name === navState.book);
        if (book) {
          setSelectedBook(navState.book);
          setSelectedBookId(book.bollsId);
          setSelectedChapter(navState.chapter);
          lastSavedVerse.current = navState.verse;
          showNotification(`Abrindo em ${navState.book} ${navState.chapter}:${navState.verse}`);
          return;
        }
      }
      
      continueReading();
    }
  }, [loadingBooks]);

  // Sincronização automática com Firebase
  useEffect(() => {
    if (!selectedVersion || !user?.uid || isGuest) return;

    const sync = async () => {
      try {
        const match = translations.find(t => t.id === selectedVersion);
        const aliasToPersist = match?.alias || selectedVersion;
        
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          bibleVersion: aliasToPersist
        });
        console.log("[Bible] Versão sincronizada com Firebase:", aliasToPersist);
      } catch (err) {
        console.error("[Bible] Erro ao sincronizar versão:", err);
      }
    };

    sync();
  }, [selectedVersion, user?.uid, isGuest]);

  // Sincronização de Notas - Handled by usePreference

  // Handle version change internal to Bible.tsx
  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId);
    const match = translations.find(t => t.id === versionId);
    const alias = match?.alias || versionId;
    localStorage.setItem("bibleVersion", alias);
  };

  // Debounced real-time search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handleGlobalSearch();
      } else if (searchQuery.length === 0) {
        setShowGlobalResults(false);
        setGlobalResults([]);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!loading && lastSavedVerse.current && verses.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`verse-${lastSavedVerse.current}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setSelectedVerses([lastSavedVerse.current!]);
          lastSavedVerse.current = null;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, verses]);

  const [nativeVoices, setNativeVoices] = useState<{id: string, name: string}[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("pt-BR");
  const [audioStatus, setAudioStatus] = useState<"stopped" | "loading" | "playing">("stopped");

  const sequenceIdRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load native voices
    import("../services/audioService").then(m => {
      m.getAvailableNativeVoices().then(voices => {
        const mapped = voices.map(v => ({ id: v.voiceURI, name: v.name }));
        setNativeVoices(mapped);
        if (mapped.length > 0) setSelectedVoice(mapped[0].id);
      }).catch(console.error);
    });

    return () => {
      import("../services/audioService").then(m => m.stopNativeTTS());
    };
  }, []);

  const toggleAudio = async () => {
    if (audioStatus !== "stopped") {
      import("../services/audioService").then(m => m.stopNativeTTS());
      setAudioStatus("stopped");
      sequenceIdRef.current++; // Cancela a sequência anterior
      return;
    }
    
    if (verses.length === 0) return;
    
    setAudioStatus("loading");
    const currentSeqId = ++sequenceIdRef.current;
    
    // Chunking text into phrases. NativeTTS works best with shorter passages up to a few hundred chars.
    let currentChunk = "Iniciando leitura deste capítulo. ";
    const chunks: string[] = [];
    for (const v of verses) {
       const sentence = `Versículo ${v.v}. ${v.t} `;
       if (currentChunk.length + sentence.length > 250) {
           chunks.push(currentChunk);
           currentChunk = sentence;
       } else {
           currentChunk += sentence;
       }
    }
    if (currentChunk) chunks.push(currentChunk);

    const playSequence = async (index: number) => {
       if (currentSeqId !== sequenceIdRef.current) return; // Sequence cancelled
       if (index >= chunks.length) {
          setAudioStatus("stopped");
          return;
       }
       
       try {
          if (index > 0) setAudioStatus("playing");
          
          await import("../services/audioService").then(m => {
            if (currentSeqId !== sequenceIdRef.current) return;
            setAudioStatus("playing");
            return m.playNativeTTS(
              chunks[index], 
              selectedVoice, 
              audioSpeed, 
              () => playSequence(index + 1), // OnEnd cb
              () => setAudioStatus("stopped") // OnError cb
            );
          });
       } catch (e: any) {
          console.error("Audio sequence error:", e);
          showNotification(e.message || "Falha na leitura vocal. Tente novamente.");
          setAudioStatus("stopped");
       }
    };

    playSequence(0);
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

  // Livros formatados para a UI com informação de testamento
  const books = useMemo(() => {
    return dynamicBooks.map(b => {
      const staticInfo = bibleBooks.find(sb => sb.bollsId === b.bookid);
      return {
        name: b.name,
        chapters: b.chapters,
        bollsId: b.bookid,
        testament: staticInfo?.testament || (b.bookid <= 39 ? 'Velho' : 'Novo')
      };
    });
  }, [dynamicBooks]);

  // Fallback de compatibilidade ao trocar de versão (Preservar livro/capítulo)
  useEffect(() => {
    if (books.length > 0) {
      if (selectedBookId) {
        const bookByPk = books.find(b => b.bollsId === selectedBookId);
        if (bookByPk) {
           // Sincroniza nome se mudou (ex: Gênesis vs Genesis)
           if (bookByPk.name !== selectedBook) {
              setSelectedBook(bookByPk.name);
           }
           // Valida capítulo
           if (selectedChapter && selectedChapter > bookByPk.chapters) {
              setSelectedChapter(bookByPk.chapters);
              showNotification(`Este livro tem ${bookByPk.chapters} capítulos nesta versão.`);
           }
        } else if (selectedBook) {
           // Tenta por nome se ID falhar (raro)
           const bookByName = books.find(b => b.name === selectedBook);
           if (bookByName) {
              setSelectedBookId(bookByName.bollsId);
           } else {
              setSelectedBook(books[0]?.name || "Gênesis");
              setSelectedBookId(books[0]?.bollsId || 1);
              setSelectedChapter(1);
              showNotification("Livro indisponível nesta versão.");
           }
        }
      } else if (selectedBook) {
        // Se temos nome mas não ID, sincroniza ID
        const bookByName = books.find(b => b.name === selectedBook);
        if (bookByName) {
          setSelectedBookId(bookByName.bollsId);
        }
      }
    }
  }, [selectedVersion, books]);

  const currentVersionName = useMemo(() => {
    return translations.find(v => v.id === selectedVersion)?.name || "Almeida";
  }, [selectedVersion]);

  const handleVerseClick = (num: number) => {
    setSelectedVerses(prev => 
      prev.includes(num) ? prev.filter(v => v !== num) : [...prev, num]
    );
    if (selectedBook && selectedBookId && selectedChapter) {
      saveReadingProgress(selectedBook, selectedBookId, selectedChapter, num);
    }
  };

  const handleGlobalSearch = async () => {
    if (!searchQuery || searchQuery.length < 3) {
      if (searchQuery.length > 0) showNotification("Digite pelo menos 3 caracteres.");
      return;
    }
    setSearchingGlobal(true);
    setShowGlobalResults(true);
    setSelectedBook(null);
    setSelectedChapter(null);
    try {
      const results = await searchBible(selectedVersion, searchQuery);
      setGlobalResults(results);
    } catch (e) {
      console.error("Global Search Error:", e);
      showNotification("Erro na busca global.");
    } finally {
      setSearchingGlobal(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGlobalSearch();
    }
  };

  const handleUnderstandWithAi = async (passageText?: string, specificReference?: string) => {
    let textToExplain = passageText;
    let ref = specificReference;

    if (!textToExplain) {
      // Use selected verses
      const selected = verses.filter(v => selectedVerses.includes(v.v));
      if (selected.length === 0) return;
      textToExplain = selected.map(v => v.t).join(" ");
      ref = `${selectedBook} ${selectedChapter}:${selectedVerses.sort((a,b) => a-b).join(",")}`;
    }

    if (!textToExplain || !ref) return;

    setLoadingAi(true);
    try {
      const result = await explainPassage(textToExplain, ref, user);
      setAiExplanation({ ...result, reference: ref });
    } catch (error: any) {
      showNotification(error.message || "Erro ao consultar a IA.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSummarize = async () => {
    if (selectedVerses.length === 0) return;
    
    setLoadingSummary(true);
    try {
      const text = verses.filter(v => selectedVerses.includes(v.v)).map(v => v.t).join(' ');
      const summary = await summarizeVerse(text);
      setVerseSummary(summary);
    } catch (err) {
      console.error(err);
      showNotification("Erro ao resumir versículos.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSummarizeChapter = async () => {
    if (verses.length === 0) return;
    
    setLoadingChapterSummary(true);
    try {
      const text = verses.map(v => v.t).join(' ');
      const summary = await summarizeChapter(text);
      setChapterSummary(summary);
    } catch (err) {
      console.error(err);
      showNotification("Erro ao resumir capítulo.");
    } finally {
      setLoadingChapterSummary(false);
    }
  };

  const handleMark = async () => {
    if (selectedVerses.length === 0) return;
    
    // Sort selected verses to process in order
    const sortedSelected = [...selectedVerses].sort((a, b) => a - b);
    const firstVerse = sortedSelected[0];
    
    // Use the first verse to determine the collective action (if first is already marked, we'll try to remove, etc.)
    // But for a true multi-toggle, we'll process each verse independently
    const isAlreadyMarked = chapterMarkers.some(m => m.verse === firstVerse);
    
    setSavingAction(true);
    try {
      // Process all selected verses
      for (const vNum of sortedSelected) {
        await marcarVersiculo(user?.uid || null, selectedBook!, selectedChapter!, vNum);
      }
      
      const actionMsg = sortedSelected.length > 1 
        ? "Versículos atualizados!" 
        : (isAlreadyMarked ? "Marcador removido!" : "Versículo marcado!");
        
      showNotification(actionMsg);
      
      // Reload markers
      const updatedMarkers = await carregarMarcadores(user?.uid || null, selectedBook!, selectedChapter!);
      setChapterMarkers(updatedMarkers);
      setSelectedVerses([]);
    } catch (err) {
      console.error(err);
      showNotification("Erro ao sincronizar marcadores.");
      // Rollback/refresh on error
      const markers = await carregarMarcadores(user?.uid || null, selectedBook!, selectedChapter!);
      setChapterMarkers(markers);
    } finally {
      setSavingAction(false);
    }
  };

  const handleFavorite = async () => {
    if (selectedVerses.length === 0) return;
    
    const sortedSelected = [...selectedVerses].sort((a, b) => a - b);
    const firstVerse = sortedSelected[0];
    const isAlreadyFavorited = chapterFavorites.some(f => f.verse === firstVerse);
    
    setSavingAction(true);
    try {
      for (const vNum of sortedSelected) {
        await favoritarVersiculo(user?.uid || null, selectedBook!, selectedChapter!, vNum);
      }
      
      const actionMsg = sortedSelected.length > 1 
        ? "Favoritos atualizados!" 
        : (isAlreadyFavorited ? "Removido dos favoritos!" : "Adicionado aos favoritos!");
        
      showNotification(actionMsg);
      
      const updatedFavorites = await carregarFavoritos(user?.uid || null, selectedBook!, selectedChapter!);
      setChapterFavorites(updatedFavorites);
      setSelectedVerses([]);
    } catch (err) {
      console.error(err);
      showNotification("Erro ao sincronizar favoritos.");
      const favorites = await carregarFavoritos(user?.uid || null, selectedBook!, selectedChapter!);
      setChapterFavorites(favorites);
    } finally {
      setSavingAction(false);
    }
  };

  const handleOpenNoteModal = () => {
    if (selectedVerses.length === 0) return;
    
    const verse = selectedVerses[0];
    const existingNote = chapterNotes.find(n => n.verse === verse);
    setCurrentNoteText(existingNote?.text || "");
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (selectedVerses.length === 0) return;
    
    const verse = selectedVerses[0];
    const previousNotes = [...chapterNotes];
    
    // Semi-optimistic UI update (update local state while waiting)
    const tempNote = {
      userId: user?.uid || 'guest',
      book: selectedBook!,
      chapter: selectedChapter!,
      verse,
      text: currentNoteText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setChapterNotes(prev => {
      const index = prev.findIndex(n => n.verse === verse);
      if (index > -1) {
        const newNotes = [...prev];
        newNotes[index] = { ...newNotes[index], text: currentNoteText };
        return newNotes;
      }
      return [...prev, tempNote];
    });

    setSavingAction(true);
    try {
      const result = await salvarNota(user?.uid || null, selectedBook!, selectedChapter!, verse, currentNoteText);
      showNotification(result.action === 'created' ? "Nota criada!" : "Nota atualizada!");
      
      // Refresh to get actual IDs/timestamps
      const updatedNotes = await carregarNotas(user?.uid || null, selectedBook!, selectedChapter!);
      setChapterNotes(updatedNotes);
      
      setShowNoteModal(false);
      setSelectedVerses([]);
    } catch (err) {
      console.error(err);
      showNotification("Erro ao salvar nota.");
      setChapterNotes(previousNotes); // Rollback
    } finally {
      setSavingAction(false);
    }
  };

  const goToNextChapter = () => {
    if (!selectedBook || selectedChapter === null) return;
    
    const currentIndex = books.findIndex(b => b.name === selectedBook);
    if (currentIndex === -1) return;
    
    const currentBook = books[currentIndex];
    
    if (selectedChapter < currentBook.chapters) {
      setSelectedChapter(prev => prev! + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Go to next book
      if (currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setSelectedBook(nextBook.name);
        setSelectedBookId(nextBook.bollsId);
        setSelectedChapter(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showNotification("Você chegou ao fim da Bíblia!");
      }
    }
  };

  const goToPrevChapter = () => {
    if (!selectedBook || selectedChapter === null) return;
    
    const currentIndex = books.findIndex(b => b.name === selectedBook);
    if (currentIndex === -1) return;
    
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev! - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Go to prev book
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setSelectedBook(prevBook.name);
        setSelectedBookId(prevBook.bollsId);
        setSelectedChapter(prevBook.chapters);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showNotification("Você está no início da Bíblia!");
      }
    }
  };

  const handleDeleteNote = async (noteId?: string) => {
    try {
      const verse = selectedVerses[0];
      await deleteNoteAction(user?.uid || null, noteId, selectedBook!, selectedChapter!, verse);
      setChapterNotes(prev => prev.filter(n => n.id !== noteId && n.verse !== verse));
      showNotification("Nota excluída.");
      setShowNoteModal(false);
      setSelectedVerses([]);
    } catch (err) {
      console.error(err);
      showNotification("Erro ao excluir nota.");
    }
  };

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      const fetchVerses = async () => {
        setLoading(true);
        setError(null);
        setChapterTitle(null);
        try {
          // Robust book lookup checking both name and bollsId
          const bookData = books.find(b => b.bollsId === selectedBookId || b.name === selectedBook);
          
          if (!bookData) {
            console.error("Livro não encontrado:", { selectedBook, selectedBookId, availableCount: books.length });
            throw new Error("Livro não encontrado.");
          }

          // Carregar marcadores e notas em paralelo com os versículos
          carregarMarcadores(user?.uid || null, selectedBook!, selectedChapter!).then(markers => {
            setChapterMarkers(markers);
          }).catch(err => console.error("Erro ao carregar marcadores:", err));

          carregarFavoritos(user?.uid || null, selectedBook!, selectedChapter!).then(favorites => {
            setChapterFavorites(favorites);
          }).catch(err => console.error("Erro ao carregar favoritos:", err));

          carregarNotas(user?.uid || null, selectedBook!, selectedChapter!).then(notes => {
            setChapterNotes(notes);
          }).catch(err => console.error("Erro ao carregar notas:", err));

          // Fetch verses first to show them immediately
          const data = await getBibleChapter(selectedVersion, bookData.bollsId, selectedChapter);
          
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Não foram encontrados versículos para esta seleção.");
          }

          const formattedVerses = data.map((v: any) => ({
            v: v.verse,
            t: v.text.replace(/<[^>]*>?/gm, '') // Remove HTML tags if present
          }));
          
          setVerses(formattedVerses);
          setLoading(false); // Stop loading immediately after verses arrive

          // Save progress as the start of chapter
          if (!lastSavedVerse.current) {
            saveReadingProgress(selectedBook, bookData.bollsId, selectedChapter, 1);
          }

          // Load title in background asynchronously
          getChapterTitle(selectedBook, selectedChapter, selectedVersion).then(title => {
            if (title) setChapterTitle(title);
          });

          // Track spiritual action (only once per chapter per session)
          const chapterKey = `${selectedBook}-${selectedChapter}`;
          if (lastTrackedChapter.current !== chapterKey && user?.uid && !isGuest) {
            trackSpiritualAction(user.uid, "bibleRead").catch(console.error);
            lastTrackedChapter.current = chapterKey;
          }
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
    <div className="min-h-screen md:h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 relative">
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
        "bg-navy/90 md:bg-navy/50 border border-amber/20 md:border-amber/10 rounded-3xl p-4 md:p-6 transition-all duration-500 overflow-y-auto mb-20 md:mb-0 shadow-2xl md:shadow-none",
        selectedChapter ? "hidden md:flex flex-col w-64" : "flex flex-col w-full"
      )}>
        <div className="relative mb-6">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber/60 w-5 h-5 cursor-pointer hover:text-amber transition-colors" onClick={handleGlobalSearch} />
           <input 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Buscar livro ou palavra-chave..."
             className="w-full bg-white/5 border border-amber/20 md:border-amber/10 rounded-2xl pl-12 pr-4 py-4 md:py-3 outline-none focus:border-amber transition-colors text-pearl text-sm md:text-base"
           />
           {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(""); setShowGlobalResults(false); setGlobalResults([]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-pearl/40 hover:text-pearl/80"
              >
                 <X className="w-4 h-4" />
              </button>
           )}
        </div>

        {!selectedBook && !showGlobalResults && (
          <div className="flex flex-col gap-4 mb-6">
            <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={continueReading}
               className="w-full bg-amber text-navy p-5 md:p-4 rounded-2xl flex items-center justify-between shadow-xl shadow-amber/20 group"
            >
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-navy/10 rounded-xl group-hover:bg-navy/20 transition-colors">
                     <PlayCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                     <span className="block text-[10px] font-bold uppercase tracking-wider opacity-60">Sua última leitura</span>
                     <span className="block text-base md:text-sm font-bold">
                        {user?.bibleProgress 
                           ? `${user.bibleProgress.book} ${user.bibleProgress.chapter}:${user.bibleProgress.verse}`
                           : "Continuar Leitura"
                        }
                     </span>
                  </div>
               </div>
               <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <div className="flex p-1 bg-white/5 rounded-xl border border-amber/10">
               <button 
                 onClick={() => setActiveTestament('Velho')}
                 className={cn(
                   "flex-1 py-3 md:py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                   activeTestament === 'Velho' ? "bg-amber text-navy shadow-lg" : "text-pearl/40 hover:text-pearl/60"
                 )}
               >
                 Antigo
               </button>
               <button 
                 onClick={() => setActiveTestament('Novo')}
                 className={cn(
                   "flex-1 py-3 md:py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                   activeTestament === 'Novo' ? "bg-amber text-navy shadow-lg" : "text-pearl/40 hover:text-pearl/60"
                 )}
               >
                 Novo
               </button>
            </div>

            <div className="flex items-center justify-between px-1">
               <span className="text-[10px] text-amber/60 font-bold uppercase tracking-[0.2em] leading-none">
                 {loadingBooks ? (
                   <span className="animate-pulse">Sincronizando...</span>
                 ) : searchQuery ? (
                   "Busca Global"
                 ) : (
                   `${activeTestament === 'Velho' ? 'Antigo' : 'Novo'} Testamento`
                 )}
               </span>
               {!loadingBooks && (
                 <span className="text-[9px] text-pearl/30 font-medium">
                   {searchQuery 
                     ? `${books.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())).length} resultados`
                     : `${books.filter(b => b.testament === activeTestament).length} Livros`
                   }
                 </span>
               )}
            </div>
          </div>
        )}

        {!selectedBook && !showGlobalResults ? (
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {books
              .filter(b => searchQuery ? true : b.testament === activeTestament)
              .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(book => (
                <button 
                  key={book.name}
                  onClick={() => {
                    setSelectedBook(book.name);
                    setSelectedBookId(book.bollsId);
                    setShowGlobalResults(false);
                  }}
                  className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 md:bg-transparent border border-white/5 md:border-transparent hover:bg-white/10 text-left group transition-all"
                >
                  <div className="flex items-center gap-3">
                     <Book className="w-5 h-5 md:w-4 md:h-4 text-amber/40 group-hover:text-amber transition-colors" />
                     <span className="font-bold md:font-medium text-sm md:text-xs text-pearl/90 group-hover:text-pearl transition-colors">{book.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-pearl/20 group-hover:text-amber transition-transform group-hover:translate-x-1" />
                </button>
              ))}
          </div>
        ) : showGlobalResults ? (
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] text-amber font-bold uppercase tracking-widest">
                  Resultados da Busca
                </span>
                <button onClick={() => { setShowGlobalResults(false); setSearchQuery(""); }} className="text-[10px] text-pearl/40 hover:text-pearl underline">Limpar</button>
             </div>
             
             {searchingGlobal ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-40">
                   <div className="w-6 h-6 border-2 border-amber/20 border-t-amber rounded-full animate-spin" />
                   <p className="text-[10px] font-bold uppercase">Pesquisando...</p>
                </div>
             ) : globalResults.length === 0 ? (
                <div className="py-12 text-center opacity-40">
                   <Search className="w-8 h-8 mx-auto mb-2" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum versículo encontrado</p>
                </div>
             ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                   {globalResults.map((result, idx) => (
                      <button 
                         key={idx}
                         onClick={async () => {
                            const book = books.find(b => b.bollsId === result.book);
                            if (book) {
                               setSelectedBook(book.name);
                               setSelectedBookId(book.bollsId);
                               setSelectedChapter(result.chapter);
                               setShowGlobalResults(false);
                               // Scroll and highlighting would be better but let's start with navigation
                            }
                         }}
                         className="w-full text-left p-3 rounded-xl bg-white/5 border border-transparent hover:border-amber/20 transition-all group"
                      >
                         <p className="text-xs font-bold text-amber mb-1 group-hover:translate-x-1 transition-transform">
                            {books.find(b => b.bollsId === result.book)?.name} {result.chapter}:{result.verse}
                         </p>
                         <p className="text-[11px] text-pearl/60 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: result.text }} />
                      </button>
                   ))}
                 </div>
              )}
           </div>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={() => { setSelectedBook(null); setSelectedBookId(null); setSelectedChapter(null); }}
              className="text-amber text-sm font-bold uppercase flex items-center gap-2 bg-amber/10 px-4 py-2 rounded-xl border border-amber/20 hover:bg-amber/20 transition-all active:scale-95"
            >
               <ChevronLeft className="w-5 h-5" /> Trocar Livro
            </button>
            <div className="pt-2">
               <h2 className="text-3xl font-display font-bold text-pearl/90 leading-none">{selectedBook}</h2>
               <p className="text-[10px] text-amber/60 font-bold uppercase tracking-[0.2em] mt-2">Escolha o Capítulo</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-3">
               {Array.from({ length: books.find(b => b.name === selectedBook)?.chapters || 0 }).map((_, i) => (
                 <button 
                   key={i}
                   onClick={() => setSelectedChapter(i + 1)}
                   className={cn(
                     "aspect-square rounded-2xl flex items-center justify-center text-sm md:text-xs font-bold transition-all border",
                     selectedChapter === i + 1 
                        ? "bg-amber text-navy border-amber shadow-lg shadow-amber/20" 
                        : "bg-white/5 border-white/5 hover:border-amber/30 text-pearl/80"
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
                    className="md:hidden flex flex-col items-center justify-center bg-amber/10 border border-amber/20 p-2 rounded-xl text-amber hover:bg-amber/20 transition-all active:scale-95 shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-2xl font-display font-bold leading-none truncate mb-1">{selectedBook} {selectedChapter}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                       <button 
                            onClick={handleSummarizeChapter}
                            disabled={loadingChapterSummary}
                            className="bg-amber/10 hover:bg-amber/20 text-amber px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1.5 border border-amber/20"
                          >
                            {loadingChapterSummary ? (
                              <div className="w-2.5 h-2.5 border-2 border-amber border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <MessageSquareQuote className="w-3 h-3" />
                            )}
                            RESUMIR
                          </button>
                       <p className="text-[9px] text-pearl/40 font-bold tracking-widest hidden sm:block">
                         {currentVersionName}
                       </p>
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-1 md:gap-2">
                  <button 
                    onClick={toggleAudio}
                    className={cn(
                      "p-2 rounded-xl transition-colors flex items-center gap-2 text-[10px] md:text-sm font-bold",
                      audioStatus !== "stopped" ? "bg-amber text-navy hover:bg-amber/80" : "bg-white/5 hover:bg-white/10 text-pearl/60"
                    )}
                  >
                    {audioStatus === "loading" ? (
                      <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                    ) : audioStatus === "playing" ? (
                      <Square className="w-4 h-4 fill-navy" />
                    ) : (
                      <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-amber" />
                    )}
                    <span className="hidden sm:inline">{audioStatus === "playing" ? "Parar" : "Ouvir"}</span>
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
                                     onClick={() => handleVersionChange(v.id)}
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
                               <label className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest block mb-2">Voz da Narração HD</label>
                               <select 
                                 value={selectedVoice} 
                                 onChange={(e) => {
                                   setSelectedVoice(e.target.value as any);
                                   if (audioStatus !== "stopped") {
                                      toggleAudio(); // stops
                                      showNotification("Voz alterada. Clique em Ouvir novamente.");
                                   }
                                 }}
                                 className="w-full bg-white/5 border border-amber/10 rounded-lg px-3 py-2 text-xs text-pearl focus:border-amber outline-none appearance-none"
                               >
                                 {nativeVoices.length > 0 ? nativeVoices.map(v => (
                                   <option key={v.id} value={v.id} className="bg-navy text-pearl">
                                     {v.name}
                                   </option>
                                 )) : (
                                   <option value="pt-BR" className="bg-navy text-pearl">Voz do Sistema</option>
                                 )}
                               </select>
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
                                      const newSpeed = parseFloat(e.target.value);
                                      setAudioSpeed(newSpeed);
                                      if (audioRef.current) {
                                         audioRef.current.playbackRate = newSpeed;
                                      }
                                   }}
                                   className="flex-1 accent-amber"
                                 />
                                 <span className="text-xs font-bold text-amber">{audioSpeed}x</span>
                               </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                               <label className="flex items-center justify-between cursor-pointer group">
                                  <div className="flex items-center gap-3">
                                     <FileText className={cn("w-4 h-4 transition-colors", showNotes ? "text-amber" : "text-pearl/20")} />
                                     <span className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest">Exibir Notas</span>
                                  </div>
                                  <div 
                                    onClick={() => togglePreference('showNotes')}
                                    className={cn(
                                      "w-10 h-5 rounded-full relative transition-colors",
                                      showNotes ? "bg-amber" : "bg-white/10"
                                    )}
                                  >
                                    <motion.div 
                                      animate={{ x: showNotes ? 22 : 4 }}
                                      className={cn("absolute top-1 w-3 h-3 rounded-full", showNotes ? "bg-navy" : "bg-white/40")}
                                    />
                                  </div>
                               </label>
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
                   {chapterTitle && (
                     <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center space-y-2 border-b border-amber/5 pb-8"
                     >
                        <div className="flex items-center justify-center gap-4 mb-2">
                           <button onClick={goToPrevChapter} className="p-1 hover:text-amber transition-colors text-amber/40" title="Capítulo Anterior">
                              <ChevronLeft className="w-4 h-4" />
                           </button>
                           <span className="text-[10px] font-bold text-amber uppercase tracking-[0.2em] opacity-60">Capítulo {selectedChapter}</span>
                           <button onClick={goToNextChapter} className="p-1 hover:text-amber transition-colors text-amber/40" title="Próximo Capítulo">
                              <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-pearl/90 leading-tight">
                           {chapterTitle}
                        </h1>
                     </motion.div>
                   )}
                   {verses.map(v => {
                      const verseId = `${selectedBook}_${selectedChapter}_${v.v}`;
                      const isMarked = chapterMarkers.some(m => m.id === verseId || (m.book === selectedBook && m.chapter === selectedChapter && m.verse === v.v));
                      const isFavorited = chapterFavorites.some(f => f.id === verseId || (f.book === selectedBook && f.chapter === selectedChapter && f.verse === v.v));
                      const hasNote = chapterNotes.some(n => n.id === verseId || (n.book === selectedBook && n.chapter === selectedChapter && n.verse === v.v));
                      
                      return (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          key={v.v}
                          id={`verse-${v.v}`}
                          onClick={() => handleVerseClick(v.v)}
                          className={cn(
                            "font-serif leading-relaxed transition-all p-2 rounded-lg cursor-pointer border-l-2",
                            selectedVerses.includes(v.v) 
                              ? "bg-amber/10 text-amber border-amber" 
                              : isFavorited
                                ? "bg-amber/5 text-pearl/90 border-amber shadow-sm shadow-amber/10"
                                : isMarked 
                                  ? "text-pearl/90 border-amber/40 shadow-sm" 
                                  : "hover:bg-white/5 text-pearl/80 border-transparent"
                          )}
                          style={{ 
                            fontSize: `${fontSize}px`,
                            backgroundColor: isMarked && !selectedVerses.includes(v.v) && !isFavorited ? 'rgba(255, 215, 0, 0.15)' : undefined
                          }}
                        >
                          <sup className="text-[10px] mr-2 text-amber font-bold flex items-center gap-1 inline-flex">
                            {v.v}
                            {isFavorited && <Star className="w-2.5 h-2.5 fill-amber" />}
                            {hasNote && <FileText className="w-2.5 h-2.5 opacity-60" />}
                          </sup>
                          {v.t}
                        </motion.p>
                      );
                    })}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/10 gap-4 mb-20 md:mb-8">
                       <button
                          onClick={goToPrevChapter}
                          className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-pearl/80 transition-all border border-white/5 active:scale-95 group"
                       >
                          <ChevronLeft className="w-5 h-5 text-amber group-hover:-translate-x-1 transition-transform" />
                          <div className="text-left">
                             <p className="text-[10px] font-bold text-amber/60 uppercase tracking-wider">Anterior</p>
                             <p className="text-sm font-display font-medium">Voltar</p>
                          </div>
                       </button>

                       <button
                          onClick={goToNextChapter}
                          className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-amber/10 hover:bg-amber/20 text-pearl transition-all border border-amber/20 active:scale-95 group"
                       >
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-amber/60 uppercase tracking-wider">Próximo</p>
                             <p className="text-sm font-display font-medium">Avançar</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-amber group-hover:translate-x-1 transition-transform" />
                       </button>
                    </div>
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
                     <button 
                       onClick={() => handleUnderstandWithAi()}
                       disabled={loadingAi}
                       className="flex items-center gap-2 bg-amber text-navy px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber/80 transition-colors disabled:opacity-50"
                     >
                       {loadingAi ? (
                         <div className="w-3 h-3 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <Sparkles className="w-4 h-4" />
                       )}
                       Insights
                      </button>
                    <button 
                       onClick={handleSummarize}
                       disabled={loadingSummary}
                       className="flex items-center gap-2 bg-white/10 text-amber border border-amber/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                       {loadingSummary ? (
                         <div className="w-3 h-3 border-2 border-amber border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <MessageSquareQuote className="w-3 h-3" />
                       )}
                       Resumir
                    </button>
                    <button 
                       onClick={handleFavorite}
                       disabled={savingAction}
                       title="Favoritar Versículo"
                       className={cn(
                         "p-2 transition-colors",
                         chapterFavorites.some(f => f.verse === selectedVerses[0]) ? "text-amber" : "text-pearl/60 hover:text-amber"
                       )}
                     >
                       {savingAction ? (
                          <div className="w-4 h-4 border-2 border-amber border-t-transparent rounded-full animate-spin" />
                       ) : (
                          <Star className={cn("w-5 h-5", chapterFavorites.some(f => f.verse === selectedVerses[0]) && "fill-amber")} />
                       )}
                     </button>
                     <button 
                        onClick={handleMark}
                        disabled={savingAction}
                        title="Marcar Versículo"
                        className={cn(
                          "p-2 transition-colors",
                          chapterMarkers.some(m => m.verse === selectedVerses[0]) ? "text-amber" : "text-pearl/60 hover:text-amber"
                        )}
                      >
                        {savingAction ? <div className="w-4 h-4 border-2 border-amber border-t-transparent rounded-full animate-spin" /> : <Highlighter className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={handleOpenNoteModal}
                        title="Salvar Nota"
                        className={cn(
                          "p-2 transition-colors",
                          chapterNotes.some(n => n.verse === selectedVerses[0]) ? "text-amber" : "text-pearl/60 hover:text-amber"
                        )}
                      >
                        <FileText className="w-5 h-5" />
                      </button>
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
         <AnimatePresence>
            {showNoteModal && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowNoteModal(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-lg bg-[#0B1221] border border-amber/30 rounded-3xl p-8 shadow-2xl overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber" />
                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-amber">
                          <div className="p-2 bg-amber/10 rounded-xl">
                             <FileText className="w-5 h-5" />
                          </div>
                          <div>
                             <h3 className="font-display font-bold text-xl">Sua Nota</h3>
                             <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                                {selectedBook} {selectedChapter}:{selectedVerses[0]}
                             </p>
                          </div>
                       </div>
                       <button onClick={() => setShowNoteModal(false)} className="p-2 hover:bg-white/5 rounded-full text-pearl/40 transition-colors">
                          <X className="w-5 h-5" />
                       </button>
                    </div>

                    <textarea
                      value={currentNoteText}
                      onChange={(e) => setCurrentNoteText(e.target.value)}
                      placeholder="O que o Espírito Santo falou ao seu coração sobre este versículo?"
                      className="w-full h-40 bg-white/5 border border-amber/10 rounded-2xl p-4 text-pearl placeholder:text-pearl/20 focus:border-amber outline-none transition-colors resize-none font-serif"
                    />

                    <div className="flex gap-3">
                       {chapterNotes.find(n => n.verse === selectedVerses[0]) && (
                         <button 
                            onClick={() => handleDeleteNote(chapterNotes.find(n => n.verse === selectedVerses[0])?.id)}
                            className="p-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                       )}
                       <button 
                         onClick={handleSaveNote}
                         disabled={savingAction || !currentNoteText.trim()}
                         className="flex-1 bg-amber text-navy font-bold py-4 rounded-xl hover:bg-amber/80 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {savingAction ? (
                           <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                         ) : (
                           <Save className="w-5 h-5" />
                         )}
                         Salvar Reflexão
                       </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {chapterSummary && (
               <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   onClick={() => setChapterSummary(null)}
                   className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                 />
                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0, y: 20 }}
                   animate={{ scale: 1, opacity: 1, y: 0 }}
                   exit={{ scale: 0.9, opacity: 0, y: 20 }}
                   className="relative w-full max-w-lg bg-[#0B1221] border border-amber/30 rounded-3xl p-8 shadow-2xl overflow-hidden"
                 >
                   <div className="absolute top-0 left-0 w-full h-1 bg-amber" />
                   <div className="relative space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-amber">
                            <div className="p-2 bg-amber/10 rounded-xl">
                               <MessageSquareQuote className="w-5 h-5" />
                            </div>
                            <h3 className="font-display font-bold text-xl">Resumo do Capítulo</h3>
                         </div>
                         <button onClick={() => setChapterSummary(null)} className="p-2 hover:bg-white/5 rounded-full text-pearl/40 transition-colors">
                            <X className="w-5 h-5" />
                         </button>
                      </div>

                      <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
                         <p className="text-lg text-pearl font-serif italic leading-relaxed text-center">
                            "{chapterSummary}"
                         </p>
                      </div>

                      <button 
                        onClick={() => setChapterSummary(null)}
                        className="w-full bg-amber text-navy font-bold py-3 rounded-xl hover:bg-amber/80 transition-colors shadow-lg active:scale-95"
                      >
                        Concluído
                      </button>
                   </div>
                 </motion.div>
               </div>
            )}

            {verseSummary && (
               <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   onClick={() => setVerseSummary(null)}
                   className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                 />
                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0, y: 20 }}
                   animate={{ scale: 1, opacity: 1, y: 0 }}
                   exit={{ scale: 0.9, opacity: 0, y: 20 }}
                   className="relative w-full max-w-lg bg-[#0B1221] border border-amber/30 rounded-3xl p-8 shadow-2xl overflow-hidden"
                 >
                   <div className="absolute top-0 left-0 w-full h-1 bg-amber" />
                   <div className="relative space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-amber">
                            <div className="p-2 bg-amber/10 rounded-xl">
                               <MessageSquareQuote className="w-5 h-5" />
                            </div>
                            <h3 className="font-display font-bold text-xl">Resumo Direto</h3>
                         </div>
                         <button onClick={() => setVerseSummary(null)} className="p-2 hover:bg-white/5 rounded-full text-pearl/40 transition-colors">
                            <X className="w-5 h-5" />
                         </button>
                      </div>

                      <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
                         <p className="text-lg text-pearl font-serif italic leading-relaxed text-center">
                            "{verseSummary}"
                         </p>
                      </div>

                      <button 
                        onClick={() => setVerseSummary(null)}
                        className="w-full bg-amber text-navy font-bold py-3 rounded-xl hover:bg-amber/80 transition-colors shadow-lg active:scale-95"
                      >
                        Concluído
                      </button>
                   </div>
                 </motion.div>
               </div>
            )}

            {aiExplanation && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 text-pearl">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setAiExplanation(null)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-2xl bg-[#0B1221] border border-amber/20 rounded-[2rem] overflow-hidden shadow-2xl"
                >
                  <div className="p-6 md:p-10 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <header className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber/10 rounded-2xl">
                          <Sparkles className="w-8 h-8 text-amber" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-bold font-display text-white">Insight da IA</h3>
                           <p className="text-xs text-amber font-bold tracking-widest uppercase opacity-60">{aiExplanation.reference}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAiExplanation(null)}
                        className="p-3 hover:bg-white/5 rounded-full transition-colors group"
                      >
                        <X className="w-6 h-6 text-pearl/40 group-hover:text-amber" />
                      </button>
                    </header>

                    <div className="space-y-6 text-left">
                       <section className="bg-white/5 p-6 rounded-3xl border border-white/5 group hover:border-amber/10 transition-colors">
                          <div className="flex items-center gap-3 mb-4 text-amber">
                             <Brain className="w-4 h-4" />
                             <h4 className="text-[10px] font-bold uppercase tracking-widest">Contexto de Fé</h4>
                          </div>
                          <p className="text-base text-pearl/80 leading-relaxed font-serif italic">
                            {aiExplanation.context}
                          </p>
                       </section>
                       {/* Adicionar resumo se existir */}
                       {verseSummary && (
                          <section className="bg-amber/5 p-6 rounded-3xl border border-amber/20">
                             <div className="flex items-center gap-3 mb-4 text-amber">
                                <MessageSquareQuote className="w-4 h-4" />
                                <h4 className="text-[10px] font-bold uppercase tracking-widest">Resumo Direto</h4>
                             </div>
                             <p className="text-lg text-amber leading-relaxed font-medium">
                                "{verseSummary}"
                             </p>
                          </section>
                       )}

                       <section className="bg-white/5 p-6 rounded-3xl border border-white/5 group hover:border-amber/10 transition-colors">
                          <div className="flex items-center gap-3 mb-4 text-amber">
                             <Lightbulb className="w-4 h-4" />
                             <h4 className="text-[10px] font-bold uppercase tracking-widest">Entendimento Profundo</h4>
                          </div>
                          <p className="text-base text-pearl leading-relaxed">
                            {aiExplanation.meaning}
                          </p>
                       </section>

                       <section className="bg-white/5 p-6 rounded-3xl border border-white/5 group hover:border-amber/10 transition-colors">
                          <div className="flex items-center gap-3 mb-4 text-amber">
                             <Compass className="w-4 h-4" />
                             <h4 className="text-[10px] font-bold uppercase tracking-widest">Passos Práticos</h4>
                          </div>
                          <p className="text-base text-pearl/80 leading-relaxed">
                            {aiExplanation.application}
                          </p>
                       </section>

                       <div className="pt-6 flex items-start gap-4 text-amber/40 italic text-sm border-t border-white/5">
                          <MessageSquareQuote className="w-5 h-5 mt-1 shrink-0" />
                          <p className="leading-relaxed">"{aiExplanation.reflection}"</p>
                       </div>
                    </div>

                    <button 
                      onClick={() => setAiExplanation(null)}
                      className="w-full bg-amber text-navy font-bold py-5 rounded-2xl hover:bg-amber/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber/10 text-lg"
                    >
                       Amém, recebo essa palavra!
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
         </AnimatePresence>
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
