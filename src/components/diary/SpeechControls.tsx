import { useRef } from "react";
import { motion } from "motion/react";
import { Play, Pause, Square } from "lucide-react";
import { useTTS } from "../../hooks/useTTS";
import { cn } from "../../lib/utils";

interface SpeechControlsProps {
  text: string;
  className?: string;
}

export function SpeechControls({ text, className }: SpeechControlsProps) {
  const { speak, pause, cancel, isPlaying, isPaused } = useTTS();
  const lastTextRef = useRef(text);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If text changed since we last started, we should probably restart
    if (text !== lastTextRef.current && (isPlaying || isPaused)) {
      cancel();
      setTimeout(() => {
        speak(text);
        lastTextRef.current = text;
      }, 50);
      return;
    }

    if (isPlaying) {
      pause();
    } else if (isPaused) {
      pause();
    } else {
      speak(text);
      lastTextRef.current = text;
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancel();
  };

  if (!text) return null;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleToggle}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
            isPlaying 
              ? "bg-amber text-navy shadow-[0_0_15px_rgba(201,168,76,0.4)] scale-110" 
              : isPaused
                ? "bg-amber/40 text-navy animate-pulse"
                : "bg-amber/10 text-amber hover:bg-amber/20 hover:scale-105"
          )}
          title={isPlaying ? "Pausar leitura" : "Ouvir texto"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 pl-0.5 fill-current" />
          )}
        </button>

        {(isPlaying || isPaused) && (
          <button
            onClick={handleStop}
            className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 transition-all border border-rose-500/20 hover:scale-105"
            title="Parar leitura"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>
      
      <div className="flex flex-col">
        {isPlaying && (
          <div className="flex gap-0.5 h-3 items-end mb-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={{
                  height: [4, 12, 4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                className="w-0.5 bg-amber rounded-full"
              />
            ))}
          </div>
        )}
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
          isPlaying ? "text-amber" : "text-pearl/40"
        )}>
          {isPlaying ? "Lendo..." : isPaused ? "Pausado" : "Ouvir Diário"}
        </span>
      </div>
    </div>
  );
}
