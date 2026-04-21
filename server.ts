import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { tts } from "edge-tts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON body parser for TTS endpoint
  app.use(express.json());

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
