import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment,
  onSnapshot 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { CatholicBook, INITIAL_CATHOLIC_BOOKS } from "../data/catholicBooksData";
import { callGeminiProxy } from "./aiUtils";

const LOCAL_STORAGE_KEY = "catholic_community_books_v1";
const USER_SHELF_KEY = "catholic_user_shelf_v1";
const LIKES_KEY = "catholic_books_likes_v1";

export interface UserShelf {
  wantToRead: string[];
  read: string[];
  favorites: string[];
}

// Get user shelf from localStorage
export const getUserShelf = (): UserShelf => {
  try {
    const data = localStorage.getItem(USER_SHELF_KEY);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.error("Error reading shelf from localStorage:", err);
  }
  return { wantToRead: [], read: [], favorites: [] };
};

// Save user shelf to localStorage
export const saveUserShelf = (shelf: UserShelf) => {
  try {
    localStorage.setItem(USER_SHELF_KEY, JSON.stringify(shelf));
  } catch (err) {
    console.error("Error saving shelf to localStorage:", err);
  }
};

// Check if user has liked a book
export const hasUserLikedBook = (bookId: string): boolean => {
  try {
    const likes = JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");
    return likes.includes(bookId);
  } catch {
    return false;
  }
};

// Mark book as liked in localStorage
export const markBookLiked = (bookId: string) => {
  try {
    const likes = JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");
    if (!likes.includes(bookId)) {
      likes.push(bookId);
      localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    }
  } catch (err) {
    console.error("Error marking book liked:", err);
  }
};

// Local storage fallback for added books
export const getLocalCustomBooks = (): CatholicBook[] => {
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) return JSON.parse(local);
  } catch (err) {
    console.error("Error reading local books:", err);
  }
  return [];
};

export const saveLocalCustomBook = (book: CatholicBook) => {
  try {
    const existing = getLocalCustomBooks();
    const updated = [book, ...existing];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving local book:", err);
  }
};

// Realtime subscription to Firestore community books
export const subscribeToCommunityBooks = (
  onUpdate: (books: CatholicBook[]) => void
) => {
  try {
    const q = query(collection(db, "community_books"), orderBy("createdAt", "desc"));
    
    return onSnapshot(
      q,
      (snapshot) => {
        const firestoreBooks: CatholicBook[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreBooks.push({
            id: docSnap.id,
            title: data.title || "Sem título",
            author: data.author || "Autor desconhecido",
            category: data.category || "Clássicos da Fé",
            description: data.description || "",
            whyRead: data.whyRead || "",
            keyQuote: data.quote || data.keyQuote || "",
            level: data.level || "Iniciante",
            tags: Array.isArray(data.tags) ? data.tags : ["Comunidade", "Fé Católica"],
            isAIRecommended: Boolean(data.isAIRecommended),
            aiHighlight: data.aiHighlight || "",
            pagesEstimate: data.pagesEstimate || "",
            link: data.link || "",
            likes: Number(data.likes) || 0,
            badge: data.isAIRecommended ? "Indicado por IA" : "Indicação da Comunidade",
            addedByName: data.addedByName || "Membro da Comunidade",
            addedByUserId: data.userId || "",
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
          });
        });
        onUpdate(firestoreBooks);
      },
      (error) => {
        console.warn("Firestore onSnapshot error for community_books, using fallback:", error);
        onUpdate(getLocalCustomBooks());
      }
    );
  } catch (err) {
    console.warn("Could not subscribe to community_books in Firestore, using local fallback:", err);
    onUpdate(getLocalCustomBooks());
    return () => {};
  }
};

// Add a new book (to Firestore and/or localStorage)
export const addCommunityBook = async (
  bookInput: {
    title: string;
    author: string;
    category: CatholicBook["category"];
    description: string;
    whyRead: string;
    keyQuote?: string;
    level: CatholicBook["level"];
    tags?: string[];
    link?: string;
    pagesEstimate?: string;
    isAIRecommended?: boolean;
    aiHighlight?: string;
  },
  user?: { uid?: string; displayName?: string | null } | null
): Promise<CatholicBook> => {
  const authorName = user?.displayName || "Irmão na Fé";
  const userId = user?.uid || "anonymous";

  const newBook: CatholicBook = {
    id: "book_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    title: bookInput.title.trim(),
    author: bookInput.author.trim(),
    category: bookInput.category,
    description: bookInput.description.trim(),
    whyRead: bookInput.whyRead.trim(),
    keyQuote: bookInput.keyQuote?.trim() || "",
    level: bookInput.level,
    tags: bookInput.tags && bookInput.tags.length > 0 ? bookInput.tags : [bookInput.category, "Catolicismo"],
    isAIRecommended: Boolean(bookInput.isAIRecommended),
    aiHighlight: bookInput.aiHighlight || "",
    pagesEstimate: bookInput.pagesEstimate || "",
    link: bookInput.link?.trim() || "",
    likes: 1,
    badge: bookInput.isAIRecommended ? "Indicado por IA" : "Indicação da Comunidade",
    addedByName: authorName,
    addedByUserId: userId,
    createdAt: new Date().toISOString()
  };

  // Always save locally first for instant, flawless UX
  saveLocalCustomBook(newBook);
  markBookLiked(newBook.id);

  // Try to write to Firestore
  try {
    const docRef = await addDoc(collection(db, "community_books"), {
      userId: userId,
      title: newBook.title,
      author: newBook.author,
      category: newBook.category,
      description: newBook.description,
      whyRead: newBook.whyRead,
      quote: newBook.keyQuote || "",
      link: newBook.link || "",
      level: newBook.level,
      tags: newBook.tags,
      pagesEstimate: newBook.pagesEstimate,
      addedByName: authorName,
      isAIRecommended: newBook.isAIRecommended,
      aiHighlight: newBook.aiHighlight || "",
      likes: 1,
      createdAt: serverTimestamp()
    });
    newBook.id = docRef.id;
  } catch (err) {
    console.warn("Could not save to Firestore directly (offline or permissions), saved locally:", err);
  }

  return newBook;
};

// Like a book
export const likeBookAction = async (bookId: string): Promise<boolean> => {
  if (hasUserLikedBook(bookId)) return false;

  markBookLiked(bookId);

  // Update in Firestore if not an initial local ID
  if (!bookId.startsWith("confissoes-") && !bookId.startsWith("imitacao-") && !bookId.startsWith("book_")) {
    try {
      const bookRef = doc(db, "community_books", bookId);
      await updateDoc(bookRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.warn("Could not increment like in Firestore:", err);
    }
  }

  return true;
};

// AI: Ask Gemini for tailored book recommendations
export const getAIBookRecommendations = async (params: {
  topicPrompt?: string;
  categoryFilter?: string;
  spiritualDifficulty?: string;
}): Promise<CatholicBook[]> => {
  const prompt = `Você é um erudito em Teologia Católica, História da Igreja e Literatura Cristã dos Santos e Doutores.
O usuário está buscando recomendações de livros espirituais e teológicos profundos sobre Deus Cristão, Catolicismo, Vida de Oração, Santos, Apologética ou Mística.

${params.topicPrompt ? `Tema/Pergunta específica do usuário: "${params.topicPrompt}"` : ""}
${params.categoryFilter ? `Foco de Categoria: "${params.categoryFilter}"` : ""}
${params.spiritualDifficulty ? `Necessidade/Dificuldade da alma: "${params.spiritualDifficulty}"` : ""}

Recomende de 3 a 4 livros católicos/cristãos REAIS, consagrados e maravilhosos (de autores como Santos Padres, Doutores da Igreja, Santos, teólogos como Bento XVI, Chesterton, C.S. Lewis, Scott Hahn, Santa Teresa, etc.).

Retorne EXCLUSIVAMENTE um array JSON de objetos com esta estrutura exata:
[
  {
    "title": "Título exato da obra em português",
    "author": "Nome completo do autor (ex: Santo Agostinho, São João da Cruz, Joseph Ratzinger)",
    "category": "Clássicos da Fé" | "Deus & Trindade" | "Espiritualidade & Oração" | "Santos & Biografias" | "Apologética & Doutrina" | "Mística & Contemplação" | "Bíblia & Teologia" | "Vida Cristã Prática",
    "description": "Sinopse rica e envolvente de 3 a 5 frases explicando o coração da obra",
    "whyRead": "Por que esta obra é transformadora para quem quer conhecer Deus ou o Catolicismo",
    "keyQuote": "Uma citação marcante e célebre do livro ou do autor",
    "level": "Iniciante" | "Intermediário" | "Avançado / Teológico",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "aiHighlight": "Uma frase de impacto da IA resumindo por que esta recomendação é cirúrgica para o tema solicitado",
    "pagesEstimate": "~250 págs"
  }
]`;

  try {
    const rawJson = await callGeminiProxy({
      prompt,
      model: "gemini-3-flash-preview",
      responseMimeType: "application/json"
    });

    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any, idx: number) => ({
      id: "ai_rec_" + Date.now() + "_" + idx,
      title: item.title || "Livro Recomendado",
      author: item.author || "Autor Cristão",
      category: item.category || "Clássicos da Fé",
      description: item.description || "",
      whyRead: item.whyRead || "",
      keyQuote: item.keyQuote || "",
      level: item.level || "Iniciante",
      tags: Array.isArray(item.tags) ? item.tags : ["Recomendação IA", "Catolicismo"],
      isAIRecommended: true,
      aiHighlight: item.aiHighlight || "Selecionado especialmente pela IA Católica",
      pagesEstimate: item.pagesEstimate || "~200 págs",
      likes: 12,
      badge: "Recomendado por IA",
      addedByName: "Mentor Espiritual IA",
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Error generating AI book recommendations:", error);
    throw error;
  }
};

// AI: Get spiritual summary and 5 core lessons of any book
export const getAIBookDeepAnalysis = async (title: string, author: string) => {
  const prompt = `Você é um teólogo e diretor espiritual católico.
Faça uma análise espiritual profunda e inspiradora do livro católico/cristão "${title}" de ${author}.

Retorne em formato JSON:
{
  "resumoTeologico": "Resumo de 2 a 3 parágrafos sobre a mensagem de Deus no livro.",
  "licoesEspirituais": [
    { "titulo": "Título da lição 1", "explicacao": "Explicação prática e profunda" },
    { "titulo": "Título da lição 2", "explicacao": "Explicação prática e profunda" },
    { "titulo": "Título da lição 3", "explicacao": "Explicação prática e profunda" },
    { "titulo": "Título da lição 4", "explicacao": "Explicação prática e profunda" },
    { "titulo": "Título da lição 5", "explicacao": "Explicação prática e profunda" }
  ],
  "oracaoInspirada": "Uma linda oração inspirada nos ensinamentos deste livro para rezar a Deus.",
  "passagemBiblicaRelacionada": "Livro Capítulo, Versículo com texto do versículo bíblico correspondente."
}`;

  try {
    const rawJson = await callGeminiProxy({
      prompt,
      model: "gemini-3-flash-preview",
      responseMimeType: "application/json"
    });
    return JSON.parse(rawJson);
  } catch (err) {
    console.error("Error generating book deep analysis:", err);
    throw err;
  }
};
