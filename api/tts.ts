import { tts } from "edge-tts";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { text, voice = "pt-BR-FranciscaNeural", rate = "+0%" } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Texto ausente" });
    }

    const audioBuffer = await tts(text, {
      voice: voice,
      rate: rate
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(audioBuffer);
    
  } catch (error: any) {
    console.error("Vercel Function Error (TTS):", error);
    res.status(500).json({ 
      error: "Falha na síntese de voz.",
      details: error.message 
    });
  }
}
