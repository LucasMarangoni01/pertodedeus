import { useState, useRef } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface AudioPreviewProps {
  url: string;
}

export function AudioPreview({ url }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      audioRef.current.play().catch(err => {
        console.error("Playback failed", err);
        setIsPlaying(false);
        setIsLoading(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
          isPlaying ? "bg-amber text-navy" : "bg-amber/10 text-amber hover:bg-amber/20"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>
      
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        className="hidden"
      />
    </div>
  );
}
