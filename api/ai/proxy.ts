import { Request, Response } from "express";
import { GoogleGenAI, GenerateContentParameters } from "@google/genai";

export default async function handler(req: Request, res: Response) {
  console.log("--- AI PROXY REQUEST ---");
  console.log("Body:", JSON.stringify(req.body, null, 2));

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
    console.error("ERRO: Chave de API ausente no servidor");
    return res.status(500).json({ 
      error: "ERRO: Chave de API ausente no servidor",
      details: "Certifique-se de que a variável GEMINI_API_KEY está configurada no ambiente."
    });
  }

  try {
    const { prompt, model = "gemini-2.0-flash", systemInstruction, responseMimeType } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt ausente na requisição" });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Choose model - map incoming preview names to stable ones if needed
    let modelName = model;
    if (modelName === "gemini-3-flash-preview") {
      modelName = "gemini-2.0-flash";
    }

    const params: GenerateContentParameters = {
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || undefined,
        responseMimeType: responseMimeType || "text/plain",
      }
    };

    console.log(`Chamando Gemini SDK v2 (${modelName})...`);
    
    // SDK v2 standard call
    const result = await ai.models.generateContent(params);
    
    console.log("Resposta da IA recebida com sucesso.");
    return res.json({ text: result.text || "" });

  } catch (error: any) {
    console.error("--- ERROR IN AI PROXY ---");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    const status = error.status || 500;
    const errorMessage = error.message || "Erro interno ao processar requisição de IA";
    
    return res.status(status).json({ 
      error: errorMessage,
      details: error.details || "Consulte os logs do servidor para mais informações.",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
