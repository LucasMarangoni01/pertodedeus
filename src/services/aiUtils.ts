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
    // Determine the model - ensure it's a modern one
    let modelName = payload.model || "gemini-1.5-flash";
    if (modelName === "gemini-3-flash-preview") {
      modelName = "gemini-2.0-flash-exp"; // Fallback to a stable high-performance model if preview is used
    }

    const response = await fetch("/api/ai/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: payload.contents || payload.prompt,
        model: modelName,
        systemInstruction: payload.systemInstruction || (payload.simplify ? "Responda de forma extremamente direta, curta e com linguagem simples. Evite textos longos." : undefined),
        responseMimeType: payload.responseMimeType || "text/plain",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro no servidor: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "";

  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    throw new Error(error.message || "Erro ao comunicar com a inteligência artificial.");
  }
};
