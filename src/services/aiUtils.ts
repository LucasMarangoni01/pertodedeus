// Payload for the AI proxy
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
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: payload.prompt,
        contents: payload.contents,
        model: payload.model,
        isSimpleMode: payload.simplify, // Map simplify to backend's isSimpleMode
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
    console.error("AI Service Error:", error);
    throw new Error(error.message || "Erro ao comunicar com o assistente virtual.");
  }
};
