import { motion } from "motion/react";
import { Play, Music, Youtube, Pause, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

const tracks = [
  { 
    id: "J3_R_u1t-r0", 
    title: "Vim Para Adorar-te", 
    artist: "Adoração & Adoradores", 
    type: "Adoração Clássica",
    thumb: "https://img.youtube.com/vi/J3_R_u1t-r0/mqdefault.jpg"
  },
  { 
    id: "gNpw27-eK7k", 
    title: "Lindo És + Só Quero Ver Você", 
    artist: "Juliano Son e Livres", 
    type: "Ao Vivo",
    thumb: "https://img.youtube.com/vi/gNpw27-eK7k/mqdefault.jpg"
  },
  { 
    id: "1Jt1iEIfUcg", 
    title: "Lugar Secreto", 
    artist: "Gabriela Rocha", 
    type: "Adoração",
    thumb: "https://img.youtube.com/vi/1Jt1iEIfUcg/mqdefault.jpg"
  },
  { 
    id: "Z7l2x8aVnEo", 
    title: "Ousado Amor (Reckless Love)", 
    artist: "Isaías Saad", 
    type: "Acústico",
    thumb: "https://img.youtube.com/vi/Z7l2x8aVnEo/mqdefault.jpg"
  },
  { 
    id: "S8wP4fTigE0", 
    title: "Ninguém Explica Deus", 
    artist: "Preto no Branco", 
    type: "Contemplação",
    thumb: "https://img.youtube.com/vi/S8wP4fTigE0/mqdefault.jpg"
  },
  { 
    id: "tBqA1lJw1B4", 
    title: "É Tudo Sobre Você", 
    artist: "Morada", 
    type: "Espontâneo",
    thumb: "https://img.youtube.com/vi/tBqA1lJw1B4/mqdefault.jpg"
  }
];

export default function Worship() {
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="space-y-10 relative">
      <header className="space-y-2">
        <p className="text-amber font-medium tracking-widest uppercase text-xs">Louvor</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Adoração</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Player Area */}
        <div className="lg:col-span-2 space-y-6">
           <div className="glow-card p-4 md:p-8 border-none bg-gradient-to-br from-navy to-black/80 flex flex-col items-center">
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
                 {!isPlaying ? (
                    <div className="absolute inset-0 group cursor-pointer" onClick={() => setIsPlaying(true)}>
                       <img src={currentTrack.thumb} alt={currentTrack.title} className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-40" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 bg-amber/90 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(201,168,76,0.6)] group-hover:scale-110 transition-transform">
                             <Play className="w-8 h-8 text-navy ml-1" fill="currentColor" />
                          </div>
                       </div>
                    </div>
                 ) : (
                    <iframe 
                      className="w-full h-full border-0"
                      src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&rel=0`} 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      title={currentTrack.title}
                    />
                 )}
              </div>

              <div className="w-full mt-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                 <div className="space-y-1">
                    <p className="text-amber text-[10px] font-bold uppercase tracking-widest">{currentTrack.type}</p>
                    <h2 className="text-2xl md:text-3xl font-display font-bold">{currentTrack.title}</h2>
                    <p className="text-pearl/60">{currentTrack.artist}</p>
                 </div>
                 
                 <a 
                   href={`https://youtube.com/watch?v=${currentTrack.id}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors w-fit"
                 >
                    <Youtube className="w-4 h-4" /> Abrir no Youtube
                 </a>
              </div>
           </div>
        </div>

        {/* Playlist Collection */}
        <aside className="space-y-6">
           <div className="flex items-center gap-2 text-xs font-bold text-pearl/40 uppercase tracking-widest px-2 pb-2 border-b border-white/5">
              <Music className="w-4 h-4" /> Sala de Adoração
           </div>
           
           <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {tracks.map((track) => (
                <div 
                  key={track.id} 
                  onClick={() => {
                    setCurrentTrack(track);
                    setIsPlaying(true);
                  }}
                  className={cn(
                    "glow-card p-3 flex items-center gap-4 cursor-pointer transition-all border-l-4",
                    currentTrack.id === track.id 
                       ? "bg-white/5 border-l-amber/60 border-amber/10 shadow-[0_0_30px_rgba(201,168,76,0.1)]" 
                       : "hover:bg-white/5 border-transparent border-white/5 hover:border-l-amber/30"
                  )}
                >
                   <div className="w-16 h-12 rounded-lg overflow-hidden relative bg-black/50 shrink-0">
                      <img src={track.thumb} className="w-full h-full object-cover opacity-80" alt={track.title} />
                      {currentTrack.id === track.id && isPlaying && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="w-4 h-4 bg-amber rounded-full animate-pulse" />
                         </div>
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-bold truncate text-sm transition-colors",
                        currentTrack.id === track.id ? "text-amber" : "text-pearl group-hover:text-amber"
                      )}>
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-pearl/60 truncate">{track.artist}</p>
                   </div>
                </div>
              ))}
           </div>
        </aside>
      </div>
    </div>
  );
}
