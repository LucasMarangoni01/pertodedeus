import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const generateDevotional = async (userProfile: any) => {
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
};
