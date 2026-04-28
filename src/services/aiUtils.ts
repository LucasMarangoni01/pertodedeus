import { GoogleGenAI } from "@google/genai";

// Payload for the AI proxy (kept for interface compatibility)
export interface GeminiPayload {
  prompt?: string;
  contents?: any;
  model?: string;
  responseMimeType?: string;
  systemInstruction?: string;
  simplify?: boolean;
}

// Model alias handler based on gemini-api skill
const resolveModel = (name?: string) => {
  if (!name) return "gemini-3-flash-preview";
  if (name.includes("gemini-3") || name.includes("gemini-1.5") || name === "gemini-flash") {
    return "gemini-3-flash-preview";
  }
  return name;
};

export const callGeminiProxy = async (payload: GeminiPayload): Promise<string> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
      throw new Error("Chave de API do Gemini não configurada. Por favor, adicione sua chave nas configurações do projeto.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const modelName = resolveModel(payload.model);
    const contents = payload.contents || payload.prompt;
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: payload.systemInstruction || (payload.simplify ? "Responda de forma extremamente direta, curta e com linguagem simples. Evite textos longos." : undefined),
        responseMimeType: payload.responseMimeType || "text/plain",
      },
    });

    return response.text || "";

  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Check if it's a key error
    if (error.message?.includes("API key not valid") || error.message?.includes("400")) {
      throw new Error("A chave de API do Google é inválida ou não tem permissão para este modelo. Verifique as configurações do projeto.");
    }
    
    throw new Error(error.message || "Erro ao comunicar com a inteligência artificial.");
  }
};
