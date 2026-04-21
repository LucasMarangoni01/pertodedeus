import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
let currentKey: string | null = null;

const getAi = () => {
  const localKey = localStorage.getItem("USER_GEMINI_KEY");
  const fallbackKey = "AIzaSyCIphL2465bVZN0fNpw-oe6PsDA2caLjIE"; // Placeholder key
  const envKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : null;
  const importedMetaKey = (import.meta as any).env ? (import.meta as any).env.VITE_GEMINI_API_KEY : null;
  
  const key = localKey || importedMetaKey || envKey || fallbackKey;
  
  if (!aiInstance || currentKey !== key) {
    aiInstance = new GoogleGenAI({ apiKey: key });
    currentKey = key;
  }
  return aiInstance;
};

export const generateDevotional = async (userProfile: any) => {
  const ai = getAi();
  const prompt = `Gere um devocional cristão personalizado para hoje.
  Dados do Usuário:
  - Nome: ${userProfile.displayName}
  - Denominação: ${userProfile.denomination}
  - Anos de fé: ${userProfile.yearsAsChristian}
  - Desafios atuais: ${userProfile.challenges?.join(", ")}
  - Nível espiritual: ${userProfile.spiritualLevel}

  O devocional deve ter a seguinte estrutura JSON:
  - title (string): Título inspirador.
  - verse (string): Referência bíblica + texto (NVI ou ARA).
  - reflection (string): Texto de reflexão (300-500 palavras).
  - question (string): Uma pergunta para auto-exame.
  - practicalAction (string): Uma ação concreta para o dia.
  - suggestedPrayer (string): Uma oração curta.

  Use um tom ${userProfile.spiritualLevel === 'Semente' ? 'acolhedor e didático' : 'profundo e teológico'}.
  Sempre baseie-se estritamente na Bíblia.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            verse: { type: Type.STRING },
            reflection: { type: Type.STRING },
            question: { type: Type.STRING },
            practicalAction: { type: Type.STRING },
            suggestedPrayer: { type: Type.STRING },
          },
          required: ["title", "verse", "reflection", "question", "practicalAction", "suggestedPrayer"]
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Error generating devotional:", error);
    let errorMessage = error.message;

    try {
        if (errorMessage?.includes('{"error":')) {
            const parsed = JSON.parse(errorMessage.substring(errorMessage.indexOf('{')));
            if (parsed?.error?.status === "NOT_FOUND" || parsed?.error?.code === 404) {
               throw new Error("O modelo de IA não foi encontrado. Adicione sua chave de API correta nas configurações ou tente novamente mais tarde.");
            } else if (parsed?.error?.status === "RESOURCE_EXHAUSTED" || parsed?.error?.code === 429) {
               throw new Error("A inteligência artificial atingiu o limite de acessos. Por favor, aguarde alguns minutos ou adicione sua própria Chave API.");
            }
        }
    } catch (e: any) {
        if (e.message && e.message !== error.message && e.message.includes("O modelo de IA")) {
            throw e;
        }
    }

    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("429")) {
      throw new Error("O Google Gemini está com tráfego muito alto neste momento (Cota Excedida). Por favor, aguarde alguns minutos, ou adicione sua chave própria nas configurações.");
    }
    throw error;
  }
};
