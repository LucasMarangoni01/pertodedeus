import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Music as MusicIcon, Play, Pause, SkipBack, SkipForward, Volume2, Search, Heart, Share2, List, Youtube } from "lucide-react";
import { cn } from "../lib/utils";

interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  thumbnail: string;
  duration: string;
}

const christianSongs: Song[] = [
  {
    id: "1",
    title: "Porque Ele Vive",
    artist: "Harpa Cristã",
    youtubeId: "unvOnfnt9kE",
    thumbnail: "https://img.youtube.com/vi/unvOnfnt9kE/hqdefault.jpg",
    duration: "4:15"
  },
  {
    id: "2",
    title: "Bondade de Deus",
    artist: "Isaías Saad",
    youtubeId: "fS_A7rVp4uU",
    thumbnail: "https://img.youtube.com/vi/fS_A7rVp4uU/hqdefault.jpg",
    duration: "5:30"
  },
  {
    id: "3",
    title: "A Casa é Sua",
    artist: "Casa Worship",
    youtubeId: "8O6L7-Wp4v0",
    thumbnail: "https://img.youtube.com/vi/8O6L7-Wp4v0/hqdefault.jpg",
    duration: "7:45"
  },
  {
    id: "4",
    title: "Ousado Amor",
    artist: "Isaias Saad",
    youtubeId: "k578Y-o6zB8",
    thumbnail: "https://img.youtube.com/vi/k578Y-o6zB8/hqdefault.jpg",
    duration: "5:18"
  },
  {
    id: "5",
    title: "Vitorioso És",
    artist: "Gabriel Guedes",
    youtubeId: "J8mR2_mX-6Q",
    thumbnail: "https://img.youtube.com/vi/J8mR2_mX-6Q/hqdefault.jpg",
    duration: "6:20"
  }
];

export default function Music() {
  const [currentSong, setCurrentSong] = useState<Song>(christianSongs[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [searchQuery, setSearchQuery] = useState("");
  const playerRef = useRef<any>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.id = 'youtube-api-script';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        initPlayer(currentSong.youtubeId);
      };
    } else {
      initPlayer(currentSong.youtubeId);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const initPlayer = (id: string) => {
    if ((window as any).YT && (window as any).YT.Player) {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: id,
        playerVars: {
          autoplay: 0,
          controls: 0,
          showinfo: 0,
          rel: 0,
        },
        events: {
          onStateChange: onPlayerStateChange,
        }
      });
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressTimer();
    } else {
      setIsPlaying(false);
      stopProgressTimer();
    }
  };

  const timerRef = useRef<number | null>(null);

  const startProgressTimer = () => {
    stopProgressTimer();
    timerRef.current = window.setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0) {
          setProgress((current / duration) * 100);
          setCurrentTime(formatTime(current));
        }
      }
    }, 1000);
  };

  const stopProgressTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const changeSong = (song: Song) => {
    setCurrentSong(song);
    setProgress(0);
    setCurrentTime("0:00");
    if (playerRef.current) {
      playerRef.current.loadVideoById(song.youtubeId);
      playerRef.current.playVideo();
    } else {
      initPlayer(song.youtubeId);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (playerRef.current) {
      const duration = playerRef.current.getDuration();
      const newTime = (newProgress / 100) * duration;
      playerRef.current.seekTo(newTime, true);
    }
  };

  const filteredSongs = christianSongs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-amber font-medium tracking-widest uppercase text-xs">Adoração</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Louvor</h1>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pearl/20 group-focus-within:text-amber transition-colors" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar hinos ou louvores..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-amber/50 transition-all font-display"
          />
        </div>
      </header>

      <div id="youtube-player" className="hidden"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Player Section */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            layoutId="active-player"
            className="glow-card p-0 overflow-hidden relative group"
          >
            <div className="aspect-video relative overflow-hidden bg-navy-light">
              <img 
                src={currentSong.thumbnail} 
                alt={currentSong.title}
                className="w-full h-full object-cover blur-sm opacity-30 scale-110"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={currentSong.id}
                  className="w-48 h-48 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-navy/50 border-4 border-white/10 relative group-hover:scale-105 transition-transform duration-500"
                >
                  <img 
                    src={currentSong.thumbnail} 
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={cn(
                    "absolute inset-0 bg-navy/40 flex items-center justify-center backdrop-blur-[2px] transition-opacity",
                    isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                  )}>
                    <button 
                      onClick={togglePlay}
                      className="w-16 h-16 bg-amber text-navy rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                    >
                      {isPlaying ? <Pause className="w-8 h-8" fill="currentColor" /> : <Play className="w-8 h-8 ml-1" fill="currentColor" />}
                    </button>
                  </div>
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-display font-bold text-white">{currentSong.title}</h2>
                  <p className="text-amber font-medium tracking-wide uppercase text-sm">{currentSong.artist}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 bg-navy/80 backdrop-blur-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-pearl/40 uppercase tracking-widest px-1">
                  <span>{currentTime}</span>
                  <span>{currentSong.duration}</span>
                </div>
                <div className="relative group/progress">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber shadow-[0_0_15px_rgba(201,168,76,0.6)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={progress}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-8">
                <button className="text-pearl/40 hover:text-amber transition-colors"><SkipBack className="w-8 h-8" fill="currentColor" /></button>
                <button 
                   onClick={togglePlay}
                  className="w-20 h-20 bg-amber text-navy rounded-3xl flex items-center justify-center shadow-2xl shadow-amber/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause className="w-10 h-10" fill="currentColor" /> : <Play className="w-10 h-10 ml-1.5" fill="currentColor" />}
                </button>
                <button className="text-pearl/40 hover:text-amber transition-colors"><SkipForward className="w-8 h-8" fill="currentColor" /></button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-pearl/40 hover:text-grape transition-colors text-xs font-bold uppercase tracking-widest">
                    <Heart className="w-4 h-4" /> Favoritar
                  </button>
                  <button className="flex items-center gap-2 text-pearl/40 hover:text-amber transition-colors text-xs font-bold uppercase tracking-widest">
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </button>
                </div>
                <div className="flex items-center gap-2 text-pearl/40">
                  <Volume2 className="w-4 h-4" />
                  <div className="w-24 h-1 bg-white/10 rounded-full">
                    <div className="w-3/4 h-full bg-pearl/40 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Playlist Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold flex items-center gap-2">
              <List className="w-5 h-5 text-amber" /> Recomendados
            </h3>
            <span className="text-[10px] font-bold text-pearl/20 uppercase tracking-widest">{filteredSongs.length} músicas</span>
          </div>

          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
            {filteredSongs.map((song) => (
              <motion.button
                key={song.id}
                whileHover={{ x: 4 }}
                onClick={() => changeSong(song)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-2xl transition-all border group",
                  currentSong.id === song.id 
                    ? "bg-amber/10 border-amber/20" 
                    : "bg-white/[0.02] border-transparent hover:bg-white/5"
                )}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden relative">
                  <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                  {currentSong.id === song.id && isPlaying && (
                    <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                      <div className="flex gap-0.5 items-end h-4">
                        <motion.div animate={{ height: [4, 16, 8, 12] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-amber" />
                        <motion.div animate={{ height: [8, 4, 16, 10] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-amber" />
                        <motion.div animate={{ height: [16, 8, 12, 4] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-amber" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h4 className={cn("text-sm font-bold line-clamp-1", currentSong.id === song.id ? "text-amber" : "text-pearl")}>
                    {song.title}
                  </h4>
                  <p className="text-[10px] text-pearl/40 uppercase tracking-widest font-medium">{song.artist}</p>
                </div>
                <span className="text-[10px] text-pearl/20 font-bold font-mono">{song.duration}</span>
              </motion.button>
            ))}
          </div>

          <div className="p-6 bg-amber/5 border border-amber/10 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-3 text-amber">
               <Youtube className="w-6 h-6" />
               <h4 className="font-bold text-sm">Integração YouTube</h4>
            </div>
            <p className="text-xs text-pearl/60 leading-relaxed">
              Ouça seus louvores favoritos com a melhor fidelidade direto da maior plataforma de vídeos do mundo.
            </p>
            <button className="w-full py-3 bg-navy text-amber text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-navy-light transition-colors border border-amber/10">
              Conectar Minha Playlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
