import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Trash2, Pause, Volume2, SkipBack, SkipForward, VolumeX, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase";

interface AudioRecorderProps {
  onAudioUploaded: (url: string | null) => void;
  userId: string;
  existingAudioUrl?: string;
  onDeleteExisting?: () => void;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function AudioRecorder({ onAudioUploaded, userId, existingAudioUrl, onDeleteExisting, onUploadingChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isUploadingRef = useRef(false);

  useEffect(() => {
    isUploadingRef.current = isUploading;
    if (onUploadingChange) onUploadingChange(isUploading);
  }, [isUploading, onUploadingChange]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setAudioUrl(existingAudioUrl || null);
  }, [existingAudioUrl]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const currentMimeType = mediaRecorder.mimeType || mimeType;
        const blob = new Blob(chunksRef.current, { type: currentMimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        setIsUploading(true);
        // Clear parent URL while uploading a new one to prevent saving stale data
        onAudioUploaded(null);

        const uploadTimeout = setTimeout(() => {
          if (isUploadingRef.current) {
            setIsUploading(false);
          }
        }, 30000); // 30s timeout

        try {
          const extension = currentMimeType.split('/')[1]?.split(';')[0] || 'webm';
          const fileRef = ref(storage, `users/${userId}/journal_audio/${Date.now()}.${extension}`);
          
          await uploadBytes(fileRef, blob, { contentType: currentMimeType });
          const downloadUrl = await getDownloadURL(fileRef);
          
          // Only update parent if we are still the relevant upload
          onAudioUploaded(downloadUrl);
        } catch (err) {
          console.error("Upload error caught:", err);
          setIsUploading(false);
          // If upload fails, notify parent that we have no remote URL
          onAudioUploaded(null);
          alert("Não conseguimos salvar seu áudio na nuvem. Você pode salvar o texto ou tentar gravar novamente.");
        } finally {
          clearTimeout(uploadTimeout);
          setIsUploading(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      setAudioBlob(null);
      setCurrentTime(0);
      setDuration(0);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    onAudioUploaded(null);
    if (onDeleteExisting) onDeleteExisting();
    setCurrentTime(0);
    setDuration(0);
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      }
    } catch (err) {
      console.error("Playback error:", err);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (vol === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMute = !isMuted;
      setIsMuted(newMute);
      audioRef.current.volume = newMute ? 0 : volume;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-white/5 border border-amber/10 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest flex items-center gap-2">
          <Mic className="w-4 h-4 text-amber" /> Nota de Voz
        </label>
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-pearl/60">{formatTime(recordingTime)}</span>
          </div>
        )}

        {isUploading && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-amber text-[10px] font-bold uppercase tracking-wider">
              <Loader2 className="w-3 h-3 animate-spin" /> Consagrando áudio...
            </div>
            <button 
              type="button"
              onClick={() => setIsUploading(false)}
              className="text-[8px] text-pearl/40 hover:text-amber underline decoration-dotted"
            >
              Cancelar Espera
            </button>
          </div>
        )}

        {audioUrl && !isRecording && !isUploading && (
          <span className="text-[10px] font-mono text-pearl/40">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {!audioUrl && !isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-3 bg-amber/10 border border-amber/20 text-amber hover:bg-amber hover:text-navy transition-all py-4 rounded-2xl font-bold"
          >
            <Mic className="w-5 h-5" /> Iniciar Gravação
          </button>
        ) : isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all py-4 rounded-2xl font-bold"
          >
            <Square className="w-5 h-5" /> Parar Gravação
          </button>
        ) : (
          <div className="space-y-4">
            {/* Main Controls */}
            <div className="flex items-center gap-3 bg-navy/40 border border-amber/20 p-3 rounded-2xl">
              <button
                type="button"
                onClick={() => skip(-10)}
                className="p-2 text-pearl/60 hover:text-amber transition-colors"
                title="Voltar 10s"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 bg-amber text-navy rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shrink-0 disabled:opacity-50"
                disabled={isLoadingAudio}
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 pl-1" />
                )}
              </button>

              <button
                type="button"
                onClick={() => skip(10)}
                className="p-2 text-pearl/60 hover:text-amber transition-colors"
                title="Avançar 10s"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              
              <div className="flex-1 flex flex-col gap-1 px-2">
                 <input 
                   type="range"
                   min="0"
                   max={duration || 0}
                   step="0.1"
                   value={currentTime}
                   onChange={handleSeek}
                   className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber"
                 />
              </div>

              <button
                type="button"
                onClick={deleteRecording}
                className="p-2 text-pearl/40 hover:text-red-400 transition-colors shrink-0"
                title="Excluir áudio"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl">
              <button
                type="button"
                onClick={toggleMute}
                className="text-pearl/60 hover:text-amber transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber/60"
              />
            </div>
            
            <audio 
              key={audioUrl || 'none'}
              ref={audioRef} 
              src={audioUrl || ""} 
              preload="auto"
              crossOrigin="anonymous"
              onEnded={() => setIsPlaying(false)}
              onPlay={() => { setIsPlaying(true); setIsLoadingAudio(false); }}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsLoadingAudio(true)}
              onCanPlay={() => setIsLoadingAudio(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              className="hidden" 
            />
          </div>
        )}
      </div>
      
      {!audioUrl && !isRecording && (
        <p className="text-[10px] text-pearl/30 text-center uppercase tracking-widest">
          Grave um áudio sobre o que Deus falou com você hoje
        </p>
      )}
    </div>
  );
}
