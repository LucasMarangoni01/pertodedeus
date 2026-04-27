import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { tts } from "edge-tts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON body parser
  app.use(express.json());
  
  // ----- DEBUG ENDPOINT -----
  app.get("/api/ai/health", (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    res.json({
      configured: !!key && key !== "YOUR_GEMINI_API_KEY",
      source: key === "YOUR_GEMINI_API_KEY" ? "placeholder" : (key ? "environment" : "none"),
      prefix: key && key.length > 4 ? key.substring(0, 4) + "..." : "none",
      nodeEnv: process.env.NODE_ENV
    });
  });

  // ----- GEMINI AI PROXY -----
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, contents, model: modelName = "gemini-1.5-flash", responseMimeType, systemInstruction } = req.body;
      let key = process.env.GEMINI_API_KEY;

      if (!key || key === "YOUR_GEMINI_API_KEY") {
        console.warn("GEMINI_API_KEY is missing or using placeholder value.");
        return res.status(400).json({ 
          error: "A Chave API do Gemini não está configurada corretamente no servidor. Se você é o administrador, verifique as variáveis de ambiente.",
          code: "MISSING_KEY"
        });
      }

      // Check if key looks like a real key (starts with AIza)
      if (key && !key.startsWith("AIza")) {
         console.warn(`GEMINI_API_KEY does not start with AIza (length: ${key.length}, prefix: ${key.substring(0, 4)}). It might be invalid.`);
      } else if (key) {
         console.log(`Using GEMINI_API_KEY (length: ${key.length}, prefix: ${key.substring(0, 4)}...)`);
      }

      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        ...(systemInstruction ? { systemInstruction } : {})
      });

      let result;
      if (contents) {
        // Multi-turn chat logic
        const chat = model.startChat({
          history: contents.slice(0, -1),
        });
        const lastMessage = contents[contents.length - 1];
        result = await chat.sendMessage(lastMessage.parts[0].text);
      } else {
        // Single prompt logic
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: responseMimeType || "text/plain",
          },
        });
      }

      const text = result.response.text();
      res.json({ text });
    } catch (error: any) {
      console.error("Erro no Gemini Backend:", error);
      res.status(500).json({ error: error.message || "Erro ao processar IA no servidor." });
    }
  });

  // ----- EDGE TTS API (FREE AZURE NEURAL) -----
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "pt-BR-FranciscaNeural", rate = "+0%" } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Texto ausente" });
      }

      // 'tts' gives a native Promise<Buffer>
      const audioBuffer = await tts(text, {
          voice: voice,
          rate: rate
      });

      res.setHeader("Content-Type", "audio/mpeg");
      res.send(audioBuffer);
      
    } catch (error) {
      console.error("Erro no Edge TTS Backend:", error);
      res.status(500).json({ error: "Falha na sintese de voz." });
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
