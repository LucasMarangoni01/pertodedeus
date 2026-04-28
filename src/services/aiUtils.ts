import { GoogleGenAI, GenerateContentParameters } from "@google/genai";

export interface GeminiPayload {
  prompt?: string;
  contents?: any;
  model?: string;
  responseMimeType?: string;
  systemInstruction?: string;
  simplify?: boolean;
}

// Lazy initialization of the SDK
let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
      throw new Error("Chave de API do Gemini não configurada. Por favor, adicione sua chave nas configurações do projeto.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const callGeminiProxy = async (payload: GeminiPayload): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Choose model based on skill guidelines
    let modelName = payload.model || "gemini-3-flash-preview";
    
    // Safety check for legacy/deprecated names
    if (modelName === "gemini-1.5-flash" || modelName === "gemini-flash-latest") {
      modelName = "gemini-3-flash-preview";
    }

    // Handle system instruction and simplification
    let finalSystemInstruction = payload.systemInstruction || "";
    if (payload.simplify) {
      const simplifyInstruction = "Responda de forma extremamente direta, curta e com linguagem simples. Evite textos longos.";
      finalSystemInstruction = finalSystemInstruction 
        ? `${finalSystemInstruction}\n\n${simplifyInstruction}`
        : simplifyInstruction;
    }

    const params: GenerateContentParameters = {
      model: modelName,
      contents: payload.contents || payload.prompt || "",
      config: {
        systemInstruction: finalSystemInstruction || undefined,
        responseMimeType: (payload.responseMimeType as any) || "text/plain",
      }
    };

    const response = await ai.models.generateContent(params);
    
    // SDK v2: access .text property directly
    return response.text || "";

  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    const message = error.message || "";
    if (message.includes("API key not valid") || message.includes("403")) {
      throw new Error("Chave de API do Gemini inválida ou desativada. Verifique suas configurações.");
    }
    
    throw new Error(message || "Erro ao comunicar com a inteligência artificial.");
  }
};
