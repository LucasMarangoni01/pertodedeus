import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
const getAi = () => {
  const localKey = localStorage.getItem("USER_GEMINI_KEY");
  const key = localKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || "DUMMY_KEY_TO_PREVENT_CRASH";
  
  if (!aiInstance || aiInstance.apiKey !== key) {
    aiInstance = new GoogleGenAI({ apiKey: key });
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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
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
};
