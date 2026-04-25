import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Trash2, Pause, Volume2, SkipBack, SkipForward, VolumeX, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const uploadTaskRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Status for playback UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setAudioUrl(existingAudioUrl || null);
  }, [existingAudioUrl]);

  useEffect(() => {
    if (onUploadingChange) onUploadingChange(isUploading);
  }, [isUploading, onUploadingChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (uploadTaskRef.current) uploadTaskRef.current.cancel();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
      'audio/wav'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    try {
      console.log("Starting recording process...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      const mimeType = getSupportedMimeType();
      console.log("Using MIME type:", mimeType);

      if (!mimeType) {
        throw new Error("Nenhum formato de áudio suportado encontrado neste navegador.");
      }

      const options: MediaRecorderOptions = { mimeType };
      // Safely apply bitrate if supported (some Safari versions might be picky)
      try {
        const testRecorder = new MediaRecorder(stream, { ...options, audioBitsPerSecond: 64000 });
        mediaRecorderRef.current = testRecorder;
      } catch (e) {
        console.warn("Bitrate adjustment not supported, using default", e);
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      }

      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log("Recording stopped. Processing chunks...");
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log("Blob created. Size:", finalBlob.size);

        if (finalBlob.size === 0) {
          setIsUploading(false);
          alert("O áudio gravado está vazio. Tente gravar novamente.");
          return;
        }

        const localUrl = URL.createObjectURL(finalBlob);
        setAudioUrl(localUrl);
        setIsUploading(true);
        setUploadProgress(0);

        try {
          const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
          const fileName = `${userId}_${Date.now()}.${extension}`;
          const fileRef = ref(storage, `users/${userId}/journal_audio/${fileName}`);
          
          console.log("Starting upload to Firebase Storage...");
          const uploadTask = uploadBytesResumable(fileRef, finalBlob, { contentType: mimeType });
          uploadTaskRef.current = uploadTask;

          const timeoutId = setTimeout(() => {
            if (uploadTaskRef.current) {
              console.warn("Upload timeout reached. Canceling...");
              uploadTask.cancel();
              setIsUploading(false);
              alert("O upload demorou muito e foi cancelado. Verifique sua conexão.");
            }
          }, 45000); // 45 seconds for audio upload
          
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              console.log(`Upload progress: ${progress.toFixed(2)}%`);
            }, 
            (error) => {
              clearTimeout(timeoutId);
              if (error.code === 'storage/canceled') {
                console.log("Upload canceled.");
                return;
              }
              console.error("Upload error:", error);
              setIsUploading(false);
              alert("Falha no upload do áudio. Verifique sua conexão.");
            }, 
            async () => {
              clearTimeout(timeoutId);
              try {
                const downloadUrl = await getDownloadURL(fileRef);
                console.log("Upload complete. Download URL:", downloadUrl);
                onAudioUploaded(downloadUrl);
              } catch (err) {
                console.error("Error getting download URL:", err);
                alert("Erro ao processar o áudio após o upload.");
              } finally {
                setIsUploading(false);
                uploadTaskRef.current = null;
              }
            }
          );
        } catch (uploadErr) {
          console.error("Upload setup error:", uploadErr);
          setIsUploading(false);
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      // Use a timeslice to ensure dataavailable is called regularly
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      
      // Start timer manually to ensure it runs immediately
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Microphone access or recorder start error:", err);
      alert(`Erro: ${err.message || "Não foi possível acessar o microfone."}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
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
          <div className="flex flex-col items-end gap-1 w-full max-w-[200px]">
            <div className="flex items-center gap-2 text-amber text-[10px] font-bold uppercase tracking-wider">
              <Loader2 className="w-3 h-3 animate-spin" /> 
              {uploadProgress < 100 ? `Otimizando Áudio (${uploadProgress.toFixed(0)}%)` : "Salvando..."}
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${uploadProgress}%` }}
                 transition={{ type: "spring", stiffness: 50, damping: 20 }}
                 className="h-full bg-amber shadow-[0_0_10px_rgba(201,168,76,0.5)]" 
               />
            </div>
            <p className="text-[9px] text-pearl/30 uppercase mt-1">Sua mensagem está sendo processada</p>
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
