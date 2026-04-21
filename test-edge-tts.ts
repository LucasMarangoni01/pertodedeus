import { tts } from "edge-tts";

async function run() {
  try {
    const text = "Olá, mundo.";
    const voice = "pt-BR-FranciscaNeural";
    console.log("Synthesizing...");
    const buffer = await tts(text, { voice, rate: "+0%" });
    console.log("Success! Buffer size:", buffer.byteLength);
  } catch (error) {
    console.error("FAIL:", error);
  }
}

run();
