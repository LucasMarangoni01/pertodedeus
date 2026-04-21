export async function playNativeTTS(
  text: string, 
  voiceURI: string,
  rate: number = 1.0,
  onEnd: () => void,
  onError: () => void
): Promise<SpeechSynthesisUtterance> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Seu navegador não suporta navegação por voz."));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = rate; // Ex: 1.0, 1.5, etc.

    // Tentar encontrar a voz escolhida pelo usuário, ou a voz nativa em pt-BR.
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.voiceURI === voiceURI);
    
    // Se não achar a exata, tente qualquer uma em pt-BR
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes("pt-BR") || v.lang.includes("pt_BR"));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => onEnd();
    utterance.onerror = (e) => {
      console.error("Native TTS Error:", e);
      onError();
    };

    window.speechSynthesis.speak(utterance);
    resolve(utterance);
  });
}

export function stopNativeTTS() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function getAvailableNativeVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices.filter(v => v.lang.includes("pt")));
      return;
    }

    // Se as vozes não foram carregadas ainda (Chrome delay):
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices().filter(v => v.lang.includes("pt")));
    };
  });
}
