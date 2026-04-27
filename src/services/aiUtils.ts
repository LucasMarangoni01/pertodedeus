import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
let currentKey: string | null = null;

export interface GeminiPayload {
  prompt?: string;
  contents?: any; // Updated to match new SDK expectations if needed, but keeping it flexible
  model?: string;
  responseMimeType?: string;
  systemInstruction?: string;
}

const getAIClient = (key: string) => {
  if (!aiInstance || currentKey !== key) {
    aiInstance = new GoogleGenAI({ apiKey: key });
    currentKey = key;
  }
  return aiInstance;
};

export const callGeminiProxy = async (payload: GeminiPayload) => {
  const rawLocalKey = localStorage.getItem("USER_GEMINI_KEY");
  const localKey = (rawLocalKey && rawLocalKey.trim().startsWith("AIza")) ? rawLocalKey.trim() : null;
  
  // Use local key if provided, otherwise use system key
  const keyToUse = localKey || process.env.GEMINI_API_KEY;

  if (!keyToUse || keyToUse === "YOUR_GEMINI_API_KEY") {
    throw new Error("A chave de API Gemini não está configurada. Por favor, verifique as configurações.");
  }

  const ai = getAIClient(keyToUse);
  const modelName = payload.model === "gemini-1.5-flash" || !payload.model ? "gemini-flash-latest" : payload.model;

  try {
    let response;

    if (payload.contents) {
      // In @google/genai, generateContent handles chat-like contents too
      response = await ai.models.generateContent({
        model: modelName,
        contents: payload.contents,
        config: {
          systemInstruction: payload.systemInstruction,
          responseMimeType: payload.responseMimeType || "text/plain"
        }
      });
    } else {
      response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: payload.prompt || "" }] }],
        config: {
          systemInstruction: payload.systemInstruction,
          responseMimeType: payload.responseMimeType || "text/plain"
        }
      });
    }

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    let msg = error.message || "Erro ao processar IA.";
    
    if (msg.includes("API key not valid") || msg.includes("401") || msg.includes("403")) {
      if (localKey) {
        msg = "Sua chave API personalizada é inválida. Verifique em Configurações ou remova-a para usar a do sistema.";
      } else {
        msg = "Erro de autenticação com a IA do sistema. O desenvolvedor precisa verificar a GEMINI_API_KEY.";
      }
    } else if (msg.includes("404")) {
      msg = `O modelo '${modelName}' não foi encontrado ou não está disponível para esta chave.`;
    }
    
    throw new Error(msg);
  }
};
