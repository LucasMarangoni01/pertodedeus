/**
 * Singleton service to manage Web Speech API (TTS).
 * Being outside of the React lifecycle allows it to persist state 
 * even when components mount/unmount (like toggling edit mode).
 */

type SpeechStatus = 'playing' | 'paused' | 'stopped';

class SpeechService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: ((status: SpeechStatus) => void)[] = [];
  public status: SpeechStatus = 'stopped';

  private heartbeatInterval: any = null;

  constructor() {
    if (this.synth) {
      // Load voices and handle case where they load later
      this.synth.getVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.synth?.getVoices();
      }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.status === 'playing') {
        // Force a tiny pause/resume or just check if it's actually speaking
        // Chrome workaround: pause and resume every few seconds keeps it alive
        if (this.synth?.speaking) {
          this.synth.pause();
          this.synth.resume();
        } else {
          this.updateStatus('stopped');
        }
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private updateStatus(newStatus: SpeechStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    
    if (newStatus === 'playing') {
      this.startHeartbeat();
    } else {
      this.stopHeartbeat();
    }

    this.listeners.forEach(l => l(newStatus));
  }

  subscribe(listener: (status: SpeechStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  falar(texto: string, lang: string = 'pt-BR') {
    if (!this.synth) {
       console.warn('SpeechSynthesis not supported');
       return;
    }

    this.synth.cancel();

    // Small delay to ensure clean state
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = lang;
      
      // Try to find a better voice
      const voices = this.synth?.getVoices();
      const ptVoice = voices?.find(v => v.lang.startsWith('pt') && v.localService) || 
                      voices?.find(v => v.lang.startsWith('pt'));
      if (ptVoice) utterance.voice = ptVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => this.updateStatus('playing');
      utterance.onend = () => this.updateStatus('stopped');
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') {
          console.error('Speech error:', e);
        }
        this.updateStatus('stopped');
      };

      this.currentUtterance = utterance;
      this.synth?.speak(utterance);
      
      // Some browsers don't trigger onstart immediately
      if (this.synth?.speaking) {
        this.updateStatus('playing');
      }
    }, 50);
  }

  pausar() {
    if (this.synth?.speaking && !this.synth?.paused) {
      this.synth.pause();
      this.updateStatus('paused');
    } else if (this.synth?.paused) {
      this.synth.resume();
      this.updateStatus('playing');
    }
  }

  cancelar() {
    if (this.synth) {
      this.synth.cancel();
      this.updateStatus('stopped');
    }
  }
}

export const speechService = new SpeechService();
