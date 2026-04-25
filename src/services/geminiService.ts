import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
let currentKey: string | null = null;

const getAiModel = (modelName: string = "gemini-1.5-flash") => {
  const localKey = localStorage.getItem("USER_GEMINI_KEY");
  const fallbackKey = "AIzaSyCIphL2465bVZN0fNpw-oe6PsDA2caLjIE"; // Placeholder key
  const envKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : null;
  const importedMetaKey = (import.meta as any).env ? (import.meta as any).env.VITE_GEMINI_API_KEY : null;
  
  const key = localKey || importedMetaKey || envKey || fallbackKey;
  
  if (!genAI || currentKey !== key) {
    genAI = new GoogleGenerativeAI(key || "");
    currentKey = key;
  }
  return genAI.getGenerativeModel({ model: modelName });
};

export const generateDevotional = async (userProfile: any, passage?: string, simplify?: boolean) => {
  const model = getAiModel("gemini-1.5-flash");
  const baseInstructions = `Gere um devocional cristão personalizado para hoje.
  Dados do Usuário:
  - Nome: ${userProfile.displayName}
  - Denominação: ${userProfile.denomination}
  - Versão da Bíblia preferida: ${userProfile.bibleVersion || "NVI"}
  - Anos de fé: ${userProfile.yearsAsChristian}
  - Desafios atuais: ${userProfile.challenges?.join(", ")}
  - Nível espiritual: ${userProfile.spiritualLevel}`;

  const prompt = `${baseInstructions}
  
  Instruções de Conteúdo:
  ${passage ? `- TEMA CENTRAL OBRIGATÓRIO: Baseie este devocional EXCLUSIVAMENTE na seguinte passagem/texto: "${passage}".
  - NOTA SOBRE INTERVALOS: Se o tema for um intervalo de capítulos (ex: "Capítulos 1 ao 5"), sua reflexão DEVE abranger o contexto geral desse conjunto de capítulos. No campo "verse", você pode escolher um versículo chave DESTE intervalo para destacar, mas a reflexão deve ser sobre todo o texto solicitado.` : '- Use uma passagem bíblica aleatória relevante para os desafios do usuário.'}
  ${simplify ? '- MODO COMPREENSÃO FACILITADA OBRIGATÓRIO: Você DEVE usar palavras muito simples e comuns. Seja extremamente direto e evite qualquer "enrolação" ou textos longos demais. Explique como se estivesse falando com alguém que nunca leu a Bíblia. FOCO EM CLAREZA TOTAL.' : '- Use um tom profundo e reflexivo.'}
  - VERSÃO DA BÍBLIA OBRIGATÓRIA: Você DEVE fornecer as referências e todas as citações de textos bíblicos EXCLUSIVAMENTE na versão "${userProfile.bibleVersion || "NVI"}".

  O devocional deve ter a seguinte estrutura JSON:
  - title (string): Título inspirador e simples.
  - verse (string): Referência bíblica + texto (${userProfile.bibleVersion || "NVI"}).
  - explanation (string): Uma explicação ultra-direta e simples do versículo (obrigatório em modo facilitado, caso contrário "").
  - reflection (string): Texto de reflexão (${simplify ? 'Máximo 150 palavras, muito direto e sem palavras difíceis' : '300-500 palavras'}).
  - question (string): Uma pergunta simples para pensar.
  - practicalAction (string): Uma ação curta e fácil de fazer.
  - suggestedPrayer (string): Uma oração curta e direta.

  Sempre baseie-se estritamente na Bíblia.`;

  try {
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const text = response.response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error generating devotional:", error);
    let errorMessage = error.message;

    try {
        if (errorMessage?.includes('{"error":')) {
            const parsed = JSON.parse(errorMessage.substring(errorMessage.indexOf('{')));
            if (parsed?.error?.status === "NOT_FOUND" || parsed?.error?.code === 404) {
               throw new Error("O modelo de IA não foi encontrado. Adicione sua chave de API correta nas configurações ou tente novamente mais tarde.");
            } else if (parsed?.error?.status === "RESOURCE_EXHAUSTED" || parsed?.error?.code === 429) {
               throw new Error("A inteligência artificial atingiu o limite de acessos. Por favor, aguarde alguns minutos ou adicione sua própria Chave API.");
            }
        }
    } catch (e: any) {
        if (e.message && e.message !== error.message && e.message.includes("O modelo de IA")) {
            throw e;
        }
    }

    if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("429")) {
      throw new Error("O Google Gemini está com tráfego muito alto neste momento (Cota Excedida). Por favor, aguarde alguns minutos, ou adicione sua chave própria nas configurações.");
    }
    throw error;
  }
};
