export const BIBLE_CACHE_PREFIX = '@bible_cache_';
export const BOOKS_CACHE_PREFIX = '@bible_books_';

// Função auxiliar para buscar com fallback
async function fetchWithFallback(url: string, isBooksUrl: boolean) {
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
  const cacheKey = `${BOOKS_CACHE_PREFIX}${version}`;
  
  // 1. Verifica Cache na Memória Local (Session ou LocalStorage)
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("LocalStorage indisponível");
  }

  // 2. Se não tem em cache, busca na rede
  const url = `https://bolls.life/get-books/${version}/`;
  const data = await fetchWithFallback(url, true);

  // 3. Salva no Cache para a eternidade (livros não mudam)
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    // Pode falhar em navegação privada ou limite de cota, ignora.
  }

  return data;
}

export async function getBibleChapter(version: string, bookId: number, chapter: number) {
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
  const url = `https://bolls.life/get-chapter/${version}/${bookId}/${chapter}/`;
  const data = await fetchWithFallback(url, false);

  // 3. Salva no Cache local garantindo performance infinita futura
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    // Se estourar a memória do celular (muitos caps), limpa os mais antigos (opcional, simplificado)
  }

  return data;
}
