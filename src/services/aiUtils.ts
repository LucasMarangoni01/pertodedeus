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

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "";
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    throw new Error(error.message || "Erro ao conectar com o servidor de IA.");
  }
};
