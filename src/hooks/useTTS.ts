import { useState, useEffect, useCallback } from 'react';
import { speechService } from '../services/speechService';

export function useTTS() {
  const [status, setStatus] = useState(speechService.status);

  useEffect(() => {
    const unsubscribe = speechService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const speak = useCallback((text: string) => {
    speechService.falar(text);
  }, []);

  const pause = useCallback(() => {
    speechService.pausar();
  }, []);

  const cancel = useCallback(() => {
    speechService.cancelar();
  }, []);

  return {
    status,
    speak,
    pause,
    cancel,
    isPlaying: status === 'playing',
    isPaused: status === 'paused',
    isStopped: status === 'stopped',
  };
}
