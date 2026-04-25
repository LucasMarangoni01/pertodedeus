import { GoogleGenAI, Type } from "@google/genai";

const getAi = () => {
  const localKey = localStorage.getItem("USER_GEMINI_KEY");
  const fallbackKey = "AIzaSyCIphL2465bVZN0fNpw-oe6PsDA2caLjIE"; // Placeholder key
  const envKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : null;
  const importedMetaKey = (import.meta as any).env ? (import.meta as any).env.VITE_GEMINI_API_KEY : null;
  
  const key = localKey || importedMetaKey || envKey || fallbackKey;
  return new GoogleGenAI({ apiKey: key });
};

export interface FastingInput {
  experience: string;
  objective: string;
  duration: string;
  health: string;
}

export interface FastingPlan {
  diet: string;
  spiritualExercises: string;
  biblicalReferences: string[];
}

export async function generateFastingPlan(input: FastingInput, type: string): Promise<FastingPlan | null> {
  try {
    const ai = getAi();
    const prompt = `Gere um guia detalhado para um jejum cristão do tipo: ${type}.
      
      Perfil do Usuário:
      - Nível: ${input.experience === 'nunca' ? 'Iniciante' : input.experience === 'pouco' ? 'Intermediário' : 'Praticante regular'}
      - Propósito: ${input.objective}
      - Duração: ${input.duration}
      - Saúde: ${input.health === 'restrições' ? 'Com restrições médicas (foco em leveza e segurança)' : 'Saudável'}

      Por favor, forneça:
      1. Uma dieta específica para este tipo de jejum (o que comer no desjejum e preparação).
      2. Exercícios espirituais diários.
      3. 3 referências bíblicas de encorajamento.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um mentor cristão sábio e atencioso. Sua missão é guiar pessoas em seus jejuns espirituais, fornecendo orientações práticas e espirituais. Responda sempre em Português (Brasil) em formato JSON estruturado.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diet: { 
              type: Type.STRING, 
              description: "Orientações alimentares detalhadas (o que comer antes de começar, durante se for parcial, e como quebrar de forma saudável)." 
            },
            spiritualExercises: { 
              type: Type.STRING, 
              description: "Sugestões de práticas espirituais como oração, meditação e leitura durante o período." 
            },
            biblicalReferences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exatamente 3 referências bíblicas (Livro Capítulo:Versículo)."
            }
          },
          required: ["diet", "spiritualExercises", "biblicalReferences"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      console.warn("Gemini returned empty text for fasting plan");
      return null;
    }
    
    const data = JSON.parse(text.trim());
    console.log("Fasting Plan generated successfully:", data);
    return data;
  } catch (error) {
    console.error("Error generating fasting plan with Gemini:", error);
    return null;
  }
}
