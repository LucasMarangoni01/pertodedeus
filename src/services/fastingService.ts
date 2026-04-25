import { GoogleGenerativeAI } from "@google/generative-ai";

const getAiModel = () => {
  const localKey = localStorage.getItem("USER_GEMINI_KEY");
  const fallbackKey = "AIzaSyCIphL2465bVZN0fNpw-oe6PsDA2caLjIE"; // Placeholder key
  const envKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : null;
  const importedMetaKey = (import.meta as any).env ? (import.meta as any).env.VITE_GEMINI_API_KEY : null;
  
  const key = localKey || importedMetaKey || envKey || fallbackKey;
  const genAI = new GoogleGenerativeAI(key || "");
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "Você é um mentor cristão sábio e atencioso. Sua missão é guiar pessoas em seus jejuns espirituais, fornecendo orientações práticas e espirituais. Responda sempre em Português (Brasil) em formato JSON estruturado."
  });
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
    const model = getAiModel();
    const prompt = `Gere um guia detalhado para um jejum cristão do tipo: ${type}.
      
      Perfil do Usuário:
      - Nível: ${input.experience === 'nunca' ? 'Iniciante' : input.experience === 'pouco' ? 'Intermediário' : 'Praticante regular'}
      - Propósito: ${input.objective}
      - Duração: ${input.duration}
      - Saúde: ${input.health === 'restrições' ? 'Com restrições médicas (foco em leveza e segurança)' : 'Saudável'}

      Por favor, forneça o seguinte JSON:
      {
        "diet": "Orientações alimentares detalhadas",
        "spiritualExercises": "Sugestões de práticas espirituais",
        "biblicalReferences": ["Ref 1", "Ref 2", "Ref 3"]
      }`;

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const text = response.response.text();
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
