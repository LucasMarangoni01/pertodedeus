import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import os from "os";
import { EdgeTTS } from "node-edge-tts";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON body parser
  app.use(express.json());
  
  // ----- DEBUG ENDPOINT -----
  app.get("/api/ai/health", (req, res) => {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    res.json({
      configured: !!key && key !== "YOUR_GEMINI_API_KEY",
      source: process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : (process.env.GOOGLE_API_KEY ? "GOOGLE_API_KEY" : "none"),
      isPlaceholder: key === "YOUR_GEMINI_API_KEY",
      prefix: key && key.length > 4 ? key.substring(0, 4) + "..." : "none",
      nodeEnv: process.env.NODE_ENV
    });
  });

  // ----- GEMINI PROXY (SECURE) -----
  app.post("/api/ai/proxy", async (req, res) => {
    try {
      const { prompt, contents, model, responseMimeType, systemInstruction, simplify } = req.body;
      
      const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!key || key === "YOUR_GEMINI_API_KEY") {
        return res.status(500).json({ error: "Chave de API do sistema não configurada." });
      }

      const ai = new GoogleGenAI({ apiKey: key });
      const modelName = model === "gemini-1.5-flash" ? "gemini-3-flash-preview" : (model || "gemini-3-flash-preview");

      // Prepare system instruction
      let finalSystemInstruction = systemInstruction || "";
      if (simplify) {
        const simplifyInstruction = "Responda de forma extremamente direta, curta e com linguagem simples. Evite textos longos, termos difíceis ou explicações complexas.";
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
      res.json({ text });

    } catch (error: any) {
      console.error("Erro no Proxy Gemini:", error);
      res.status(500).json({ 
        error: "Falha na comunicação com a IA.", 
        details: error.message 
      });
    }
  });

  // ----- EDGE TTS API (FREE AZURE NEURAL) -----
  app.post("/api/tts", async (req, res) => {
    let tempFile = "";
    try {
      const { text, voice = "pt-BR-FranciscaNeural", rate = "default" } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Texto ausente" });
      }

      // Convert rate to node-edge-tts format if it's like "+0%"
      // node-edge-tts expects 'default' or a string like 'fast', 'slow' or a percentage
      let adjustedRate = rate;
      if (rate === "+0%") adjustedRate = "default";

      const ttsService = new EdgeTTS({
        voice: voice,
        rate: adjustedRate
      });

      tempFile = path.join(os.tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`);
      
      await ttsService.ttsPromise(text, tempFile);
      
      const audioBuffer = await fs.promises.readFile(tempFile);
      
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(audioBuffer);
      
    } catch (error) {
      console.error("Erro no Edge TTS Backend:", error);
      res.status(500).json({ error: "Falha na sintese de voz." });
    } finally {
      if (tempFile && fs.existsSync(tempFile)) {
        try {
          await fs.promises.unlink(tempFile);
        } catch (e) {
          console.error("Erro ao remover arquivo temporário:", e);
        }
      }
    }
  });


  // ----- PLATFORM STANDARD VITE INTEGRATION -----
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
