import { bibleBooks } from "../constants/bibleData";
import deuterocanonicalDataRaw from "../data/deuterocanonical.json";

export const BIBLE_CACHE_PREFIX = '@bible_cache_';
export const BOOKS_CACHE_PREFIX = '@bible_books_';

interface DeuterocanonicalVerse {
  v: number;
  t: string;
}

interface DeuterocanonicalChapter {
  chapter: number;
  verses: DeuterocanonicalVerse[];
}

interface DeuterocanonicalBook {
  name: string;
  originalTitle: string;
  bollsId: number;
  chapters: DeuterocanonicalChapter[];
}

const deuterocanonicalData = deuterocanonicalDataRaw as Record<string, DeuterocanonicalBook>;

// Lista padrão de livros deuterocanônicos formatados para a API
const deuterocanonicalApiBooks = [
  { bookid: 68, name: "Tobias", chapters: 14 },
  { bookid: 69, name: "Judite", chapters: 16 },
  { bookid: 70, name: "Sabedoria", chapters: 19 },
  { bookid: 71, name: "Eclesiástico", chapters: 51 },
  { bookid: 73, name: "Baruque", chapters: 6 },
  { bookid: 74, name: "1 Macabeus", chapters: 16 },
  { bookid: 75, name: "2 Macabeus", chapters: 15 },
];

// Função auxiliar para buscar com fallback
async function fetchWithFallback(url: string, _isBooksUrl: boolean) {
  try {
    // 1. Tenta a API original direta (Bolls suporta CORS nativamente)
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha na chamada principal");
    return await res.json();
  } catch (e1) {
    console.warn("Bolls direto falhou, usando proxy 1...");
    try {
      // 2. Tenta via AllOrigins Proxy
      const proxy1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res2 = await fetch(proxy1);
      if (!res2.ok) throw new Error("Proxy 1 falhou");
      return await res2.json();
    } catch (e2) {
      console.warn("Proxy 1 falhou, usando proxy 2...");
      // 3. Tenta via CorsProxy.io
      const proxy2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const res3 = await fetch(proxy2);
      if (!res3.ok) throw new Error("Todas as rotas falharam");
      return await res3.json();
    }
  }
}

export async function getBibleBooks(version: string) {
  // Tradução Matos Soares (Católica Tradicional com 73 livros completos)
  if (version === "MATOS") {
    return bibleBooks.map(b => ({
      bookid: b.bollsId,
      name: b.name,
      chapters: b.chapters
    }));
  }

  const cacheKey = `${BOOKS_CACHE_PREFIX}${version}`;
  
  // 1. Verifica Cache na Memória Local
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return ensureCatholicBooks(parsed);
    }
  } catch (e) {
    console.warn("LocalStorage indisponível");
  }

  // 2. Se não tem em cache, busca na rede
  try {
    const url = `https://bolls.life/get-books/${version}/`;
    const data = await fetchWithFallback(url, true);
    const withCatholic = ensureCatholicBooks(data);

    // 3. Salva no Cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(withCatholic));
    } catch (e) {
      // Ignora erro de cota
    }

    return withCatholic;
  } catch (err) {
    console.warn("Falha ao buscar livros da API bolls, usando lista local:", err);
    return bibleBooks.map(b => ({
      bookid: b.bollsId,
      name: b.name,
      chapters: b.chapters
    }));
  }
}

/**
 * Garante que os livros deuterocanônicos católicos estejam presentes na lista
 */
function ensureCatholicBooks(booksList: any[]) {
  if (!Array.isArray(booksList)) return booksList;
  const existingIds = new Set(booksList.map(b => b.bookid));
  
  const missingDeutero = deuterocanonicalApiBooks.filter(d => !existingIds.has(d.bookid));
  if (missingDeutero.length === 0) return booksList;

  // Insere mantendo a ordenação canônica
  return [...booksList, ...missingDeutero].sort((a, b) => {
    const idxA = bibleBooks.findIndex(sb => sb.bollsId === a.bookid);
    const idxB = bibleBooks.findIndex(sb => sb.bollsId === b.bookid);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.bookid - b.bookid;
  });
}

export async function getBibleChapter(version: string, bookId: number, chapter: number) {
  const deuteroKey = String(bookId);

  // Se for livro deuterocanônico católico, carrega diretamente do acervo católico em português
  if (deuterocanonicalData[deuteroKey]) {
    const bookData = deuterocanonicalData[deuteroKey];
    const targetChapter = bookData.chapters.find(c => c.chapter === chapter);
    if (targetChapter && targetChapter.verses) {
      return targetChapter.verses.map(v => ({
        pk: bookId * 10000 + chapter * 100 + v.v,
        verse: v.v,
        text: v.t
      }));
    }
  }

  const cacheKey = `${BIBLE_CACHE_PREFIX}${version}_${bookId}_${chapter}`;
  
  // 1. Verifica Cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("LocalStorage indisponível");
  }

  // 2. Busca na rede
  try {
    const url = `https://bolls.life/get-chapter/${version}/${bookId}/${chapter}/`;
    const data = await fetchWithFallback(url, false);

    // 3. Salva no Cache local
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
      // Ignora erro de cota
    }

    return data;
  } catch (netErr) {
    // Se a versão CNBB ou outra falhar para um livro específico, tenta fallback com ARA
    if (version !== "ARA") {
      try {
        const fallbackUrl = `https://bolls.life/get-chapter/ARA/${bookId}/${chapter}/`;
        return await fetchWithFallback(fallbackUrl, false);
      } catch (fallbackErr) {
        throw netErr;
      }
    }
    throw netErr;
  }
}

export async function searchBible(version: string, query: string) {
  if (!query || query.length < 3) return [];
  
  let networkResults: any[] = [];
  try {
    const url = `https://bolls.life/search/${version}/?search=${encodeURIComponent(query)}&method=1`;
    networkResults = await fetchWithFallback(url, false);
    if (!Array.isArray(networkResults)) networkResults = [];
  } catch (err) {
    console.warn("Busca na API falhou:", err);
  }

  // Busca também nos livros deuterocanônicos católicos
  const deuteroMatches: any[] = [];
  const lowerQuery = query.toLowerCase();

  for (const [idStr, book] of Object.entries(deuterocanonicalData)) {
    const bollsId = parseInt(idStr, 10);
    for (const cap of book.chapters) {
      for (const v of cap.verses) {
        if (v.t.toLowerCase().includes(lowerQuery)) {
          deuteroMatches.push({
            pk: bollsId * 10000 + cap.chapter * 100 + v.v,
            book: bollsId,
            chapter: cap.chapter,
            verse: v.v,
            text: v.t
          });
          if (deuteroMatches.length >= 25) break;
        }
      }
      if (deuteroMatches.length >= 25) break;
    }
    if (deuteroMatches.length >= 25) break;
  }

  return [...networkResults, ...deuteroMatches];
}
