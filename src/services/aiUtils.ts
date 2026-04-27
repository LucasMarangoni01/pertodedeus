export interface GeminiPayload {
  prompt?: string;
  contents?: any;
  model?: string;
  responseMimeType?: string;
  systemInstruction?: string;
  simplify?: boolean;
}

export const callGeminiProxy = async (payload: GeminiPayload): Promise<string> => {
  try {
    const response = await fetch("/api/ai/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type");
    
    if (!response.ok) {
      // Try to parse error as JSON if content-type matches, otherwise use statusText
      let errorMessage = `Erro do servidor: ${response.status} ${response.statusText}`;
      if (contentType && contentType.includes("application/json")) {
        try {
          const errData = await response.json();
          errorMessage = errData.error || errData.message || errorMessage;
        } catch (e) {
          // Fallback if JSON parse fails
        }
      }
      throw new Error(errorMessage);
    }

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Resposta inválida do servidor (não é JSON). Verifique se a rota da API está configurada corretamente.");
    }

    const data = await response.json();
    return data.text || "";
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    // Return a friendly message instead of technical details when possible
    if (error.message.includes("Unexpected token") || error.message.includes("is not valid JSON")) {
      throw new Error("O servidor retornou um formato inesperado. Isso geralmente acontece quando o endpoint da API não é encontrado.");
    }
    throw new Error(error.message || "Erro ao conectar com o servidor de IA.");
  }
};
