import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Garantir que é um POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { prompt, contents, model, responseMimeType, systemInstruction, simplify } = req.body;

    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key || key === "YOUR_GEMINI_API_KEY") {
      return res.status(500).json({ error: "Chave de API não configurada no ambiente." });
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const modelName = model === "gemini-1.5-flash" ? "gemini-3-flash-preview" : (model || "gemini-3-flash-preview");

    // Lógica do System Prompt
    let finalSystemInstruction = systemInstruction || "";
    if (simplify) {
      const simplifyInstruction = "Responda de forma extremamente direta, curta e com linguagem simples. Evite textos longos ou termos complexos.";
      finalSystemInstruction = finalSystemInstruction 
        ? `${finalSystemInstruction}\n\n${simplifyInstruction}`
        : simplifyInstruction;
    }

    let response;
    if (contents) {
      response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: finalSystemInstruction || undefined,
          responseMimeType: responseMimeType || "text/plain"
        }
      });
    } else if (prompt) {
      response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: finalSystemInstruction || undefined,
          responseMimeType: responseMimeType || "text/plain"
        }
      });
    } else {
      return res.status(400).json({ error: "Nenhum prompt ou conteúdo fornecido." });
    }

    const text = response.text;
    
    return res.status(200).json({ text });

  } catch (error: any) {
    console.error("Erro no Proxy Vercel:", error);
    return res.status(500).json({ 
      error: "Falha na comunicação com a IA.", 
      details: error.message 
    });
  }
}
