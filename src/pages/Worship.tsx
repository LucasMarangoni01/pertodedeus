import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Youtube, ListMusic, Heart, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

const playlists = [
  { title: "Manhã com Deus", desc: "Louvores suaves para começar o dia.", icon: "🌅" },
  { title: "Intercessão Profunda", desc: "Instrumentais para momentos de clamor.", icon: "🙏" },
  { title: "Gratidão e Celebração", desc: "Ritmos vibrantes de agradecimento.", icon: "🙌" },
  { title: "Soaking Worship", desc: "Música contemplativa para meditação.", icon: "🌊" },
];

export default function Worship() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState({
    title: "Vim Para Adorar-te",
    artist: "Adoração & Adoradores",
    cover: "https://picsum.photos/seed/worship/400/400"
  });

  const showWipAlert = (feature: string) => {
    setNotification(`${feature} disponível em breve!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleNext = () => {
    showWipAlert("Próxima música");
  };

  const handlePrev = () => {
    showWipAlert("Música anterior");
  };

  return (
    <div className="space-y-10 relative">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-amber text-navy px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 border border-white/20 whitespace-nowrap"
          >
            <Star className="w-5 h-5" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="space-y-2">
        <p className="text-amber font-medium tracking-widest uppercase text-xs">Louvor</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Adoração</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Player */}
        <div className="lg:col-span-2 space-y-8">
           <div className="glow-card p-10 bg-gradient-to-br from-navy to-grape/20 border-none relative overflow-hidden flex flex-col items-center text-center space-y-8">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Music className="w-32 h-32" />
              </div>

              <motion.div 
                animate={isPlaying ? { rotate: 360 } : {}}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-amber/20 p-2 shadow-2xl relative z-10"
              >
                 <img src={currentTrack.cover} alt="Cover" className="w-full h-full rounded-full object-cover" />
              </motion.div>

              <div className="space-y-2 z-10">
                 <h2 className="text-3xl font-display font-bold text-amber">{currentTrack.title}</h2>
                 <p className="text-pearl/60 font-medium tracking-wide">{currentTrack.artist}</p>
              </div>

              <div className="w-full max-w-md space-y-4 z-10">
                 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber w-1/3 shadow-[0_0_10px_#C9A84C]" />
                 </div>
                 <div className="flex justify-between text-[10px] font-bold text-pearl/40 uppercase tracking-widest">
                    <span>1:24</span>
                    <span>4:50</span>
                 </div>
              </div>

              <div className="flex items-center gap-8 z-10">
                 <button onClick={handlePrev} className="text-pearl/40 hover:text-amber transition-colors"><SkipBack className="w-8 h-8" /></button>
                 <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-amber text-navy rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                 >
                    {isPlaying ? <Pause className="w-10 h-10" fill="currentColor" /> : <Play className="w-10 h-10 ml-1" fill="currentColor" />}
                 </button>
                 <button onClick={handleNext} className="text-pearl/40 hover:text-amber transition-colors"><SkipForward className="w-8 h-8" /></button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => showWipAlert("YouTube Clip")}
                className="glow-card flex items-center gap-4 py-4 hover:bg-white/5 cursor-pointer group"
              >
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                     <Youtube className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold group-hover:text-amber transition-colors">Ver no YouTube</p>
                    <p className="text-[10px] text-pearl/40">Abrir clipe oficial</p>
                  </div>
              </div>
              <div 
                onClick={() => showWipAlert("Letras Sincronizadas")}
                className="glow-card flex items-center gap-4 py-4 hover:bg-white/5 cursor-pointer group"
              >
                  <div className="w-12 h-12 bg-amber/10 rounded-xl flex items-center justify-center text-amber">
                     <ListMusic className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold group-hover:text-amber transition-colors">Letra Sincronizada</p>
                    <p className="text-[10px] text-pearl/40">Acompanhar louvor</p>
                  </div>
              </div>
           </div>
        </div>

        {/* Playlists sidebar */}
        <aside className="space-y-6">
           <h3 className="text-xs font-bold text-pearl/40 uppercase tracking-widest px-2">Playlists Temáticas</h3>
           <div className="space-y-4">
              {playlists.map((pl, i) => (
                <div 
                  key={i} 
                  onClick={() => showWipAlert(`Playlist: ${pl.title}`)}
                  className="glow-card flex items-center gap-4 hover:border-amber/40 cursor-pointer group"
                >
                   <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">
                      {pl.icon}
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold group-hover:text-amber transition-colors">{pl.title}</h4>
                      <p className="text-[10px] text-pearl/60">{pl.desc}</p>
                   </div>
                   <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-pearl/20 group-hover:text-amber">
                      <ChevronRight className="w-4 h-4" />
                   </div>
                </div>
              ))}
           </div>

           <div className="glow-card border-none bg-amber/5 p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber font-bold text-xs">
                 <Volume2 className="w-4 h-4" /> Sons para Oração
              </div>
              <p className="text-xs text-pearl/60">Misture sons da natureza com piano instrumental para o seu momento a sós.</p>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[10px]">
                    <span>Piano Worship</span>
                    <input type="range" className="w-24 h-1 bg-white/10 rounded-full appearance-none accent-amber" />
                 </div>
                 <div className="flex justify-between items-center text-[10px]">
                    <span>Chuva Suave</span>
                    <input type="range" className="w-24 h-1 bg-white/10 rounded-full appearance-none accent-amber" />
                 </div>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
