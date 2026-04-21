import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipForward, SkipBack, Loader2, Music2, AlertCircle, Search, Heart } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import ReactPlayer from "react-player";
const Player = ReactPlayer as any;

// Lista de Músicas Originais
const tracksData = [
  { id: "gNpw27-eK7k", title: "Lindo És + Só Quero Ver Você", artist: "Juliano Son e Livres", category: "Adoração" },
  { id: "W_qL73i5sF8", title: "Ressuscita-me", artist: "Aline Barros", category: "Fé e Esperança" },
  { id: "1Jt1iEIfUcg", title: "Lugar Secreto", artist: "Gabriela Rocha", category: "Momento com Deus" },
  { id: "D4uFjV6Z6jA", title: "Algo Novo", artist: "Kemuel", category: "Celebração" },
  { id: "Z7l2x8aVnEo", title: "Ousado Amor", artist: "Isaías Saad", category: "Graça" },
  { id: "S8wP4fTigE0", title: "Ninguém Explica Deus", artist: "Preto no Branco", category: "Reflexão" },
  { id: "jfKfPfyJRdk", title: "Lofi Christian Worship", artist: "Background Soaking", category: "Instrumental" }, 
];

const categories = ["Todos", "Adoração", "Momento com Deus", "Fé e Esperança", "Celebração", "Graça", "Reflexão", "Instrumental"];

export default function Worship() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Novos estados para Diferenciais pedido
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [favorites, setFavorites] = useState<string[]>([]);

  const playerRef = useRef<any>(null);

  // Filtragem
  const filteredTracks = useMemo(() => {
    return tracksData.filter(track => {
      const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            track.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "Todos" || track.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // Se estou tocando uma musica ela ta vindo direto do array filtrado ou do array principal? 
  // O Player de index se baseia no array filtrado agora para poder tocar seguidas
  const activeTrack = activeIndex !== null ? filteredTracks[activeIndex] : null;

  // Lidar com Favoritos
  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Lidar com clique em uma música
  const handlePlayTrack = (index: number) => {
    if (activeIndex === index) {
       // Se clicou na que já está carregada, apenas pausa/despausa
      setIsPlaying(!isPlaying);
    } else {
       // Trocar para uma nova música
      setActiveIndex(index);
      setIsPlaying(true);
      setIsReady(false);
      setIsBuffering(true);
      setPlayedSeconds(0);
      setDuration(0);
      setErrorMsg(null);
    }
  };

  const handleNext = () => {
    if (activeIndex === null) return;
    const nextIndex = (activeIndex + 1) % filteredTracks.length;
    handlePlayTrack(nextIndex);
  };

  const handlePrev = () => {
    if (activeIndex === null) return;
    const prevIndex = activeIndex === 0 ? filteredTracks.length - 1 : activeIndex - 1;
    handlePlayTrack(prevIndex);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = Math.min(Math.max((e.clientX - bounds.left) / bounds.width, 0), 1);
    playerRef.current.seekTo(percent, "fraction");
    setPlayedSeconds(percent * duration);
  };

  // Formatar segundos (ex: 215 -> 3:35)
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pb-32 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      
      {/* Header com Filtros e Busca */}
      <header className="space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-amber text-xs font-bold tracking-widest uppercase">
            <Music2 className="w-4 h-4" /> 
            Top Louvores
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Adoração</h1>
          <p className="text-pearl/60">Sua playlist de devoção. Escolha uma música para sentir a paz.</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-pearl/40" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-2xl leading-5 bg-navy/40 text-pearl placeholder-pearl/40 focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber sm:text-sm backdrop-blur-md transition-all transition-colors"
            placeholder="Buscar música, banda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
           {categories.map((cat) => (
             <button
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
                 activeCategory === cat 
                 ? 'bg-amber text-navy shadow-[0_0_15px_rgba(201,168,76,0.3)]' 
                 : 'bg-white/5 text-pearl hover:bg-white/10 border border-white/5'
               }`}
             >
               {cat}
             </button>
           ))}
        </div>
      </header>

      {/* Banner de Erro do Youtube */}
      <AnimatePresence>
        {errorMsg && (
            <motion.div 
              initial={{opacity:0, height:0, marginBottom: 0}} 
              animate={{opacity:1, height:'auto', marginBottom: 24}} 
              exit={{opacity:0, height:0, marginBottom: 0}} 
              className="bg-grape/10 border border-grape/50 text-pearl p-4 rounded-xl flex items-center gap-3 overflow-hidden"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Músicas (Design Limpo - Estilo Spotify/Apple Music) */}
      <div className="bg-navy/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        {filteredTracks.length === 0 ? (
           <div className="p-8 text-center text-pearl/50">
              Nenhum louvor encontrado para essa busca.
           </div>
        ) : (
          filteredTracks.map((track, i) => {
            const isActive = activeIndex === i;
            const isFav = favorites.includes(track.id);
            
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(i)}
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer transition-colors border-b border-white/5 last:border-0 hover:bg-white/10 group ${
                  isActive ? 'bg-amber/10 hover:bg-amber/15' : ''
                }`}
              >
                {/* Número da Faixa / Indicador de Play */}
                <div className="w-6 sm:w-8 flex justify-center items-center text-pearl/40 text-xs sm:text-base font-bold group-hover:text-white transition-colors">
                  {isActive && isPlaying ? (
                      <div className="flex items-end gap-[2px] h-3 w-3">
                        <motion.div animate={{ height: [3, 12, 3] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-amber rounded-t-sm" />
                        <motion.div animate={{ height: [9, 3, 9] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-amber rounded-t-sm" />
                        <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-amber rounded-t-sm" />
                      </div>
                  ) : (
                      <span>{i + 1}</span>
                  )}
                </div>
                
                {/* Thumbnail (Mini Capa) */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden relative bg-black shadow-md flex-shrink-0">
                  <img 
                    src={`https://img.youtube.com/vi/${track.id}/default.jpg`} 
                    className={`w-full h-full object-cover transition-opacity ${isActive ? 'opacity-80' : 'opacity-100'}`} 
                    alt={track.title} 
                  />
                  {!isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
                    </div>
                  )}
                </div>
                
                {/* Informações da Música */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className={`font-bold text-sm sm:text-base truncate ${isActive ? 'text-amber' : 'text-pearl group-hover:text-white transition-colors'}`}>
                    {track.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-[10px] sm:text-xs truncate ${isActive ? 'text-amber/70' : 'text-pearl/50'}`}>
                      {track.artist}
                    </p>
                    <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-pearl/20" />
                    <span className="hidden sm:inline-block text-[10px] text-pearl/30 border border-pearl/10 px-1.5 py-0.5 rounded-md">
                      {track.category}
                    </span>
                  </div>
                </div>

                {/* Favorite Heart */}
                <button 
                  onClick={(e) => toggleFavorite(e, track.id)}
                  className={`p-2 lg:mx-4 transition-transform active:scale-90 ${isFav ? 'text-amber' : 'text-pearl/20 hover:text-white'}`}
                >
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFav ? 'fill-current' : ''}`} />
                </button>

                {/* Duração (Se estiver vazia pode ocultar ou exibir tocando) */}
                <div className="hidden sm:block text-xs text-pearl/40 pr-2 sm:pr-4 min-w-[40px] text-right">
                   {isActive && typeof duration === 'number' && duration > 0 ? formatTime(duration) : null}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 
        ========================================================================
        PLAYER FIXO INFERIOR (Onde a Mágica Acontece para bypassar restrições)
        ======================================================================== 
      */}
      <AnimatePresence>
        {activeTrack && (
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-navy/95 backdrop-blur-2xl border-t border-white/10 p-3 sm:p-4 px-4 sm:px-8 z-50 flex items-center justify-between gap-4 md:gap-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              {/* Lado Esquerdo: Info + Iframe visível disfarçado */}
              <div className="flex items-center gap-3 w-[45%] md:w-1/3 min-w-0">
                  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-black flex-shrink-0 shadow-lg border border-white/10 pointer-events-none">
                    
                    {(!isReady || isBuffering) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-navy z-20">
                          <Loader2 className="w-5 h-5 text-amber animate-spin" />
                      </div>
                    )}
                    
                    {/* 
                      O SEGREDO REVELADO: O ReactPlayer do YouTube FICA AQUI.
                      Ele é literalmente renderizado FISICAMENTE na tela em vez de nascosto no absoluto -2000px.
                      Por ser visível ao usuário de forma pequena (simulando a capa original do Spotify),
                      o navegador não entende como bot, carregando o áudio 100% normal. E a gente da um scale de 200% 
                      para esconder as bordas pretas de vídeos antigos.
                    */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] h-[220%] pointer-events-none z-10">
                      <Player
                          ref={playerRef}
                          url={`https://www.youtube.com/watch?v=${activeTrack.id}`}
                          playing={isPlaying}
                          controls={false}
                          width="100%"
                          height="100%"
                          style={{ pointerEvents: 'none' }}
                          onReady={() => setIsReady(true)}
                          onPlay={() => {
                             setIsReady(true);
                             setIsBuffering(false);
                          }}
                          onProgress={(prog: any) => {
                             setIsBuffering(false); // Failsafe para destravar
                             setPlayedSeconds(prog.playedSeconds);
                             if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
                                const dur = playerRef.current.getDuration();
                                if (dur && dur > 0) setDuration(dur);
                             }
                          }}
                          onEnded={handleNext}
                          onError={(e: any) => {
                            console.error("Player do YouTube proibiu embed deste id:", e);
                            setErrorMsg(`A gravadora bloqueou a reprodução externa da música "${activeTrack.title}". Pulando para a próxima...`);
                            setIsPlaying(false);
                            setTimeout(() => {
                              setErrorMsg(null);
                              handleNext();
                            }, 5000);
                          }}
                          config={{
                            youtube: {
                              playerVars: { 
                                showinfo: 0, 
                                modestbranding: 1,
                                playsinline: 1,
                                origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000' 
                              }
                            }
                          } as any}
                      />
                    </div>
                  </div>
                  
                  <div className="truncate">
                    <h4 className="font-bold text-white text-sm truncate">{activeTrack.title}</h4>
                    <p className="text-[11px] text-pearl/60 truncate">{activeTrack.artist}</p>
                  </div>
              </div>

              {/* Centro: Controles & Barra de Progresso */}
              <div className="w-[50%] md:flex-1 max-w-xl space-y-2 flex flex-col items-center">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <button onClick={handlePrev} className="text-pearl/50 hover:text-white transition active:scale-95">
                      <SkipBack className="w-5 h-5 fill-current" />
                    </button>
                    
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)} 
                        className="w-10 h-10 md:w-12 md:h-12 bg-white text-navy rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        {isBuffering && !isReady ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                          (isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-navy" /> : <Play className="w-5 h-5 md:w-6 md:h-6 ml-1 fill-navy" />)
                        }
                    </button>
                    
                    <button onClick={handleNext} className="text-pearl/50 hover:text-white transition active:scale-95">
                       <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  
                  <div className="hidden sm:flex w-full items-center gap-3 text-[10px] text-pearl/50 font-medium">
                    <span className="w-8 text-right">{formatTime(playedSeconds)}</span>
                    <div 
                      className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group py-2" // py-2 expande hitbox
                      onClick={handleSeek}
                    >
                        <div 
                          className="h-1.5 bg-white group-hover:bg-amber transition-colors relative"
                          style={{ width: `${duration ? (playedSeconds / duration) * 100 : 0}%` }}
                        />
                    </div>
                    <span className="w-8">{formatTime(duration)}</span>
                  </div>
              </div>

              {/* Placeholder Invisível no Mobile, usado no Desktop para equilibrar o Flex (Volume Area) */}
              <div className="hidden md:flex justify-end w-1/3">
                 {/* Uma barra de volume futura pode ir aqui, estilo spotify */}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
