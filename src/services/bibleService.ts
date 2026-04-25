import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple in-memory cache for titles
const titleCache: Record<string, string> = {};

export async function getChapterTitle(book: string, chapter: number, version: string) {
  const cacheKey = `${book}-${chapter}-${version}`;
  if (titleCache[cacheKey]) return titleCache[cacheKey];

  try {
    const prompt = `For the Bible book "${book}", chapter ${chapter} (version: ${version}), 
    provide a short, poetic and descriptive title in Portuguese that captures the main theme of this chapter. 
    Examples: 
    - Gênesis 1: "O Despertar da Criação"
    - Salmos 23: "O Descanso no Pastor"
    Return ONLY the title string, no extra words, no quotes. Use at most 4-5 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const title = response.text?.trim() || "";
    if (title) titleCache[cacheKey] = title;
    return title;
  } catch (error) {
    console.error("Error generating chapter title:", error);
    return null;
  }
}
