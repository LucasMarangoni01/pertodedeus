import { callGeminiProxy } from "./aiUtils";

export const generateDevotional = async (userProfile: any, passage?: string, simplify?: boolean) => {
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
    const text = await callGeminiProxy({ prompt, model: "gemini-flash-latest", responseMimeType: "application/json", simplify });
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error generating devotional:", error);
    throw error;
  }
};

export const summarizeVerse = async (verseText: string) => {
  const prompt = `Resuma o versículo bíblico abaixo em apenas uma frase curta, usando palavras simples e diretas, mantendo fielmente o significado original. 
  Não adicione opiniões, interpretações complexas ou conteúdo fora do texto fornecido.
  
  Versículo: "${verseText}"
  
  Saída: (apenas a frase do resumo, sem formatação adicional)`;

  try {
    const text = await callGeminiProxy({ prompt, model: "gemini-flash-latest", simplify: true });
    return text.trim();
  } catch (error) {
    console.error("Error summarizing verse:", error);
    throw error;
  }
};

export const summarizeChapter = async (chapterText: string) => {
  const prompt = `Resuma o capítulo completo da Bíblia em poucas linhas (3 a 5 linhas). 
  Seja direto, use linguagem simples e foque apenas na mensagem principal do capítulo, sem detalhar versículo por versículo.
  
  Capítulo: "${chapterText}"
  
  Saída: (apenas o resumo, sem formatação adicional)`;

  try {
    const text = await callGeminiProxy({ prompt, model: "gemini-flash-latest", simplify: true });
    return text.trim();
  } catch (error) {
    console.error("Error summarizing chapter:", error);
    throw error;
  }
};

export const explainPassage = async (passage: string, reference: string, userProfile?: any) => {
  const simplify = userProfile?.simplifyAI;
  const prompt = `Você é um erudito bíblico e mentor espiritual. Explique o seguinte trecho da Bíblia de forma clara, profunda e aplicável.
  
  Referência: ${reference}
  Texto: "${passage}"
  
  Contexto do Usuário (se disponível):
  - Denominação: ${userProfile?.denomination || "Cristão"}
  - Desafios: ${userProfile?.challenges?.join(", ") || "Nenhum especificado"}
  
  ${simplify ? 'Responda de forma extremamente direta, curta e com linguagem simples. Evite textos longos, termos difíceis ou explicações complexas.' : ''}

  Sua explicação deve incluir:
  1. Contexto histórico/literário breve.
  2. Significado central do trecho.
  3. Como aplicar isso na vida cotidiana hoje.
  
  Responda em formato JSON:
  {
    "context": "breve contexto",
    "meaning": "significado central",
    "application": "aplicação prática",
    "reflection": "uma frase curta de reflexão final"
  }
  
  Use um tom acolhedor e encorajador.`;

  try {
    const text = await callGeminiProxy({ prompt, model: "gemini-flash-latest", responseMimeType: "application/json", simplify });
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error explaining passage:", error);
    throw error;
  }
};
