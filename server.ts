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
  
  // ----- AI CHAT PROXY (SECURE) -----
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { prompt, contents, model = "gemini-3-flash-preview", isSimpleMode, responseMimeType = "text/plain" } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      
      if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
        console.error("ERRO: Chave de API não configurada no servidor.");
        return res.status(500).json({ error: "Configuração de IA incompleta no servidor." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Resolve model (ensure it's modern)
      let modelName = model;
      if (modelName.includes("gemini-3") || modelName.includes("gemini-1.5") || modelName === "gemini-flash") {
        modelName = "gemini-3-flash-preview";
      }

      // Logic for system instruction based on mode
      const systemInstruction = isSimpleMode 
        ? "Responda de forma extremamente direta, curta e com linguagem simples. Use termos do dia a dia. Evite parágrafos longos ou termos teológicos complexos."
        : "Responda de forma pastoral, acolhedora e inspiradora.";

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents || prompt,
        config: {
          systemInstruction,
          responseMimeType,
        },
      });

      res.json({ text: response.text });
      
    } catch (error: any) {
      console.error("Erro no Proxy de IA:", error);
      res.status(500).json({ 
        error: "Falha na comunicação com a IA",
        details: error.message 
      });
    }
  });

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

  const startupKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  console.log("-----------------------------------------");
  console.log("Server status:");
  console.log(`Port: 3000`);
  console.log(`Node Env: ${process.env.NODE_ENV}`);
  console.log("-----------------------------------------");

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
