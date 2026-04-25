import { GoogleGenerativeAI } from "@google/generative-ai";

const getAiModel = () => {
  const localKey = localStorage.getItem("USER_GEMINI_KEY");
  const fallbackKey = "AIzaSyCIphL2465bVZN0fNpw-oe6PsDA2caLjIE"; // Placeholder key
  const envKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : null;
  const importedMetaKey = (import.meta as any).env ? (import.meta as any).env.VITE_GEMINI_API_KEY : null;
  
  const key = localKey || importedMetaKey || envKey || fallbackKey;
  const genAI = new GoogleGenerativeAI(key || "");
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

// Simple in-memory cache for titles
const titleCache: Record<string, string> = {};

export async function getChapterTitle(book: string, chapter: number, version: string) {
  const cacheKey = `${book}-${chapter}-${version}`;
  if (titleCache[cacheKey]) return titleCache[cacheKey];

  try {
    const model = getAiModel();
    const prompt = `For the Bible book "${book}", chapter ${chapter} (version: ${version}), 
    provide a short, poetic and descriptive title in Portuguese that captures the main theme of this chapter. 
    Examples: 
    - Gênesis 1: "O Despertar da Criação"
    - Salmos 23: "O Descanso no Pastor"
    Return ONLY the title string, no extra words, no quotes. Use at most 4-5 words.`;

    const response = await model.generateContent(prompt);
    const title = response.response.text()?.trim() || "";
    
    if (title) titleCache[cacheKey] = title;
    return title;
  } catch (error) {
    console.error("Error generating chapter title:", error);
    return null;
  }
}
