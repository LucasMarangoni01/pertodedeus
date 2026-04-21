import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple In-Memory Cache to speed up subsequent requests perfectly!
  const cache = new Map<string, any>();

  // ----- BIBLE CACHE PROXY ENDPOINTS -----
  
  // Endpoint to get chapters/verses
  app.get("/api/bible/chapter/:version/:bookId/:chapter", async (req, res) => {
    const { version, bookId, chapter } = req.params;
    const cacheKey = `chapter-${version}-${bookId}-${chapter}`;
    
    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    try {
      const bollsUrl = `https://bolls.life/get-chapter/${version}/${bookId}/${chapter}/`;
      const response = await fetch(bollsUrl);
      if (!response.ok) throw new Error("Bolls API failed");
      const data = await response.json();
      
      cache.set(cacheKey, data);
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch remote Bible API" });
    }
  });

  // Endpoint to get books metadata
  app.get("/api/bible/books/:version", async (req, res) => {
    const { version } = req.params;
    const cacheKey = `books-${version}`;
    
    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    try {
      const bollsUrl = `https://bolls.life/get-books/${version}/`;
      const response = await fetch(bollsUrl);
      if (!response.ok) throw new Error("Bolls API failed");
      const data = await response.json();
      
      cache.set(cacheKey, data);
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch books list" });
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
