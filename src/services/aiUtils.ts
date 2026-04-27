import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
let currentKey: string | null = null;

export interface GeminiPayload {
  prompt?: string;
  contents?: any[];
  model?: string;
  responseMimeType?: string;
  systemInstruction?: string;
}

export const callGeminiProxy = async (payload: GeminiPayload) => {
  const rawLocalKey = localStorage.getItem("USER_GEMINI_KEY");
  const localKey = (rawLocalKey && rawLocalKey.trim().startsWith("AIza")) ? rawLocalKey.trim() : null;
  
  // Use local key if user provided one in Settings
  if (localKey) {
    if (!genAI || currentKey !== localKey) {
      genAI = new GoogleGenerativeAI(localKey);
      currentKey = localKey;
    }
    const model = genAI.getGenerativeModel({ 
      model: payload.model || "gemini-1.5-flash",
      ...(payload.systemInstruction ? { systemInstruction: payload.systemInstruction } : {})
    });

    let result;
    try {
      if (payload.contents) {
        const chat = model.startChat({ history: payload.contents.slice(0, -1) });
        result = await chat.sendMessage(payload.contents[payload.contents.length - 1].parts[0].text);
      } else {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: payload.prompt || "" }] }],
          generationConfig: { 
            responseMimeType: payload.responseMimeType || "text/plain" 
          }
        });
      }
      return result.response.text();
    } catch (error: any) {
      console.error("Local Gemini Error:", error);
      if (error.message?.includes("API key not valid")) {
        throw new Error("Sua chave API personalizada (salva nas Configurações) é inválida. Por favor, corrija-a ou remova-a para usar a chave padrão do sistema.");
      }
      throw error;
    }
  }

  // Otherwise use the server-side proxy which has the environment API KEY
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      model: payload.model || "gemini-1.5-flash"
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    let msg = errorData.error || "Falha na comunicação com a inteligência artificial.";
    
    if (msg.includes("API key not valid")) {
      msg = "A chave de API configurada no servidor parece ser inválida. Se você for o administrador, verifique se a variável GEMINI_API_KEY no ambiente do Google AI Studio está correta. Se você for um usuário e adicionou sua própria chave nas configurações, tente removê-la ou atualizá-la.";
    }
    
    throw new Error(msg);
  }

  const data = await response.json();
  return data.text;
};
