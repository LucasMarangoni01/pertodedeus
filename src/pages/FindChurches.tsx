import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Phone, Globe, Navigation, Church, Loader2, Info, Map as MapIcon, LayoutGrid, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Leaflet marker bug fix for Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface ChurchData {
  id: number;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  website?: string;
  denomination?: string;
  city?: string;
  image?: string;
  wikidata?: string;
  isRealPhoto?: boolean;
}

// Component to recenter map
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

export default function FindChurches() {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.5505, -46.6333]); // Default SP
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&addressdetails=1&limit=5&featuretype=settlement&countrycodes=br`;
      const res = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (e) {
      console.error("Autocomplete error", e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCity(value);
    fetchSuggestions(value);
  };

  const selectSuggestion = (s: any) => {
    const cityName = s.display_name.split(',')[0];
    const stateAbbr = s.address?.state ? `, ${s.address.state}` : "";
    setCity(`${cityName}${stateAbbr}`);
    setSuggestions([]);
    setShowSuggestions(false);
    setMapCenter([parseFloat(s.lat), parseFloat(s.lon)]);
  };

  const normalizeDenomination = (d?: string, name?: string) => {
    const str = `${d || ""} ${name || ""}`.toLowerCase();
    if (str.includes("católica") || str.includes("catholic")) return "Católica";
    if (str.includes("adventista") || str.includes("adventist")) return "Adventista";
    if (str.includes("batista") || str.includes("baptist")) return "Batista";
    if (str.includes("presbiteriana") || str.includes("presbyterian")) return "Presbiteriana";
    if (str.includes("metodista") || str.includes("methodist")) return "Metodista";
    if (str.includes("assembleia de deus") || str.includes("assembly of god")) return "Assembleia de Deus";
    if (str.includes("universal do reino") || str.includes("iurd")) return "Universal";
    if (str.includes("congregação cristã") || str.includes("ccb")) return "Congregação Cristã";
    if (str.includes("evangélica") || str.includes("evangelical") || str.includes("pentecostal") || str.includes("claudia") || str.includes("gospel")) return "Evangélica";
    return d || "Cristã";
  };

  const filteredChurches = useMemo(() => {
    return churches.filter(church => {
      if (filter === "all") return true;
      const normalized = normalizeDenomination(church.denomination, church.name);
      
      if (filter === "catholic") return normalized === "Católica";
      if (filter === "evangelical") {
        return ["Evangélica", "Assembleia de Deus", "Batista", "Presbiteriana", "Metodista", "Universal", "Congregação Cristã"].includes(normalized);
      }
      if (filter === "adventist") return normalized === "Adventista";
      if (filter === "others") {
        return !["Católica", "Adventista", "Evangélica", "Assembleia de Deus", "Batista", "Presbiteriana", "Metodista", "Universal", "Congregação Cristã"].includes(normalized);
      }
      return true;
    });
  }, [churches, filter]);

  const searchChurches = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setShowSuggestions(false);

    try {
      // 1. Geocode city name (restricted to Brazil) if mapCenter is default or inconsistent
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&countrycodes=br`;
      const geoRes = await fetch(geoUrl, { headers: { "Accept-Language": "pt-BR" } });
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        throw new Error("Cidade não encontrada.");
      }

      const { lat, lon } = geoData[0];
      const targetLat = parseFloat(lat);
      const targetLon = parseFloat(lon);
      setMapCenter([targetLat, targetLon]);

      // 2. Fetch churches
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="christian"](around:8000, ${targetLat}, ${targetLon});
          way["amenity"="place_of_worship"]["religion"="christian"](around:8000, ${targetLat}, ${targetLon});
        );
        out center;
      `;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      const overpassRes = await fetch(overpassUrl);
      const overpassData = await overpassRes.json();

      const foundChurches: ChurchData[] = overpassData.elements.map((el: any) => {
        let image = el.tags.image || el.tags["contact:image"] || el.tags.thumbnail;
        let isReal = !!image;
        if (el.tags.mapillary) {
          image = `https://images.mapillary.com/${el.tags.mapillary}/thumb-2048.jpg`;
          isReal = true;
        }
        if (el.tags.wikimedia_commons) {
          const fileName = el.tags.wikimedia_commons.replace(/^(File:|Image:)/i, '').trim().replace(/ /g, '_');
          image = `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=800`;
          isReal = true;
        }
        if (image && !image.startsWith('http')) image = undefined;

        return {
          id: el.id,
          name: el.tags.name || "Igreja sem nome",
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          address: el.tags["addr:street"] ? `${el.tags["addr:street"]}${el.tags["addr:housenumber"] ? ", " + el.tags["addr:housenumber"] : ""}` : el.tags["addr:full"],
          phone: el.tags.phone || el.tags["contact:phone"],
          website: el.tags.website || el.tags["contact:website"],
          denomination: el.tags.denomination || el.tags.church,
          city: el.tags["addr:city"] || geoData[0].display_name.split(',')[0],
          image: image,
          wikidata: el.tags.wikidata,
          isRealPhoto: isReal
        };
      });

      const sorted = foundChurches.sort((a, b) => a.name.localeCompare(b.name));
      setChurches(sorted);

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao buscar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 min-h-screen pb-20">
      <header className="space-y-4 text-center max-w-2xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex p-3 bg-amber/10 rounded-2xl text-amber mb-4"
        >
          <Church className="w-8 h-8" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Encontrar Igrejas</h1>
        <p className="text-pearl/60 font-serif italic text-lg text-balance">
          "Pois onde se reunirem dois ou três em meu nome, ali eu estou no meio deles." — Mateus 18:20
        </p>
      </header>

      <section className="max-w-2xl mx-auto space-y-6 px-4 relative z-40" ref={suggestionRef}>
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={searchChurches} className="flex-1 relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-pearl/40 group-focus-within:text-amber transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Digite sua cidade (ex: São Paulo, SP)" 
              value={city}
              onChange={handleInputChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full bg-white/5 border border-amber/10 rounded-2xl py-4 pl-14 pr-32 outline-none focus:border-amber focus:ring-1 focus:ring-amber/50 transition-all text-base md:text-lg placeholder:text-pearl/20"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-amber text-navy font-bold px-4 md:px-6 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buscar"}
            </button>
          </form>

          <div className="flex bg-white/5 border border-amber/10 rounded-2xl p-1 shrink-0 h-[60px] md:h-auto">
             <button 
               onClick={() => setViewMode("grid")}
               className={cn(
                 "flex-1 md:w-16 flex items-center justify-center rounded-xl transition-all",
                 viewMode === "grid" ? "bg-amber text-navy shadow-lg" : "text-pearl/40 hover:text-pearl"
               )}
               title="Visualização em Grade"
             >
               <LayoutGrid className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setViewMode("map")}
               className={cn(
                 "flex-1 md:w-16 flex items-center justify-center rounded-xl transition-all",
                 viewMode === "map" ? "bg-amber text-navy shadow-lg" : "text-pearl/40 hover:text-pearl"
               )}
               title="Visualização no Mapa"
             >
               <MapIcon className="w-5 h-5" />
             </button>
          </div>
        </div>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-4 right-4 md:left-0 md:right-20 top-full mt-2 bg-navy/95 backdrop-blur-xl border border-amber/20 rounded-2xl overflow-hidden z-50 shadow-2xl"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full px-6 py-4 text-left hover:bg-amber/10 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-amber" />
                  <div className="flex flex-col">
                    <span className="text-pearl font-medium">{s.display_name.split(',')[0]}</span>
                    <span className="text-pearl/40 text-[10px] uppercase tracking-wider">
                      {s.display_name.split(',').slice(1, 4).join(',')}
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: "all", label: "Todas" },
            { id: "catholic", label: "Católica" },
            { id: "evangelical", label: "Evangélica" },
            { id: "adventist", label: "Adventista" },
            { id: "others", label: "Outras" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-medium transition-all border whitespace-nowrap",
                filter === f.id 
                  ? "bg-amber border-amber text-navy shadow-[0_0_20px_rgba(201,168,76,0.3)]" 
                  : "bg-white/5 border-amber/10 text-pearl/40 hover:text-pearl hover:border-amber/40"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center gap-4 text-pearl/40"
            >
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-display italic">Mapeando templos e comunidades...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glow-card border-rose-500/20 bg-rose-500/5 p-8 text-center space-y-4 max-w-xl mx-auto"
            >
               <Info className="w-10 h-10 text-rose-400 mx-auto" />
               <p className="text-rose-400 font-medium">{error}</p>
            </motion.div>
          ) : searched && filteredChurches.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-6"
            >
              <Church className="w-20 h-20 text-pearl/5 mx-auto" />
              <div className="space-y-2">
                <p className="text-2xl font-display font-medium text-pearl/40">Nenhuma igreja encontrada com este filtro</p>
                <p className="text-pearl/20">Tente mudar o filtro ou buscar uma área diferente.</p>
              </div>
            </motion.div>
          ) : searched ? (
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
            >
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredChurches.map((church, idx) => (
                    <motion.div
                      key={church.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="glow-card group hover:border-amber/40 transition-all flex flex-col h-full overflow-hidden p-0"
                    >
                      <div className="relative h-48 w-full overflow-hidden bg-navy/50 shrink-0 border-b border-amber/10">
                        <img 
                          src={church.image || `https://static-maps.yandex.ru/1.x/?ll=${church.lon},${church.lat}&z=18&l=sat&size=600,450`} 
                          alt={church.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('static-maps')) {
                              target.src = `https://static-maps.yandex.ru/1.x/?ll=${church.lon},${church.lat}&z=18&l=sat&size=600,450`;
                            } else {
                              target.style.display = 'none';
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <div className="p-2 bg-navy/80 backdrop-blur-md rounded-lg text-amber border border-amber/20">
                            <Church className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-amber bg-navy/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full shadow-lg">
                            {normalizeDenomination(church.denomination, church.name)}
                          </span>
                        </div>
                        {church.isRealPhoto && (
                          <div className="absolute bottom-3 left-3">
                            <span className="bg-grape text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Foto Real</span>
                          </div>
                        )}
                      </div>

                      <div className="p-6 space-y-4 flex-1">
                        <h3 className="text-xl font-display font-bold group-hover:text-amber transition-colors line-clamp-2 leading-tight">
                          {church.name}
                        </h3>
                        {church.address && (
                          <p className="text-pearl/40 text-sm flex items-start gap-2 italic">
                            <MapPin className="w-4 h-4 shrink-0 text-amber" />
                            {church.address}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs font-medium text-pearl/40">
                          {church.phone && (
                            <a href={`tel:${church.phone}`} className="flex items-center gap-1.5 hover:text-amber transition-colors">
                              <Phone className="w-3.5 h-3.5" /> {church.phone}
                            </a>
                          )}
                          {church.website && (
                            <a href={church.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-amber transition-colors">
                              <Globe className="w-3.5 h-3.5" /> Website
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-white/[0.02] border-t border-amber/10">
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lon}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 w-full py-3 bg-amber/5 text-amber hover:bg-amber hover:text-navy rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                        >
                          <Navigation className="w-4 h-4" /> Ver Rota no Mapas
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-[60vh] md:h-[70vh] rounded-[2.5rem] overflow-hidden border border-amber/20 shadow-2xl relative z-10">
                  <MapContainer 
                    center={mapCenter} 
                    zoom={14} 
                    scrollWheelZoom={false}
                    className="w-full h-full"
                    style={{ background: "#0D1B2A" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapRecenter center={mapCenter} />
                    {filteredChurches.map((church) => (
                      <Marker 
                        key={church.id} 
                        position={[church.lat, church.lon]} 
                        icon={DefaultIcon}
                      >
                        <Popup className="church-popup">
                          <div className="p-2 space-y-3 min-w-[220px]">
                            <p className="text-[10px] uppercase font-bold text-amber mb-1">
                              {normalizeDenomination(church.denomination, church.name)}
                            </p>
                            <h4 className="font-bold text-navy text-lg leading-tight">{church.name}</h4>
                            {church.address && (
                              <p className="text-xs text-navy/60 flex items-start gap-1">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {church.address}
                              </p>
                            )}
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2 bg-amber text-navy rounded-lg text-[10px] font-bold uppercase tracking-wider"
                            >
                              <Navigation className="w-3 h-3" /> Ver Rota
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              )}
            </motion.div>
          ) : (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white/5 border border-amber/10 rounded-[2.5rem] p-12 text-center space-y-6 max-w-4xl mx-auto"
             >
                <div className="w-20 h-20 bg-amber/10 rounded-full flex items-center justify-center text-amber mx-auto mb-4">
                  <MapIcon className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold">Inicie sua Busca</h2>
                  <p className="text-pearl/40 max-w-lg mx-auto">
                    Digite o nome de uma cidade acima para localizar igrejas e templos cristãos próximos a você. Explore em grade ou mapa.
                  </p>
                </div>
                <div className="flex justify-center gap-4 pt-4">
                   <div className="flex -space-x-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-navy overflow-hidden">
                          <img src={`https://picsum.photos/seed/community${i}/100/100`} alt="Community" className="w-full h-full object-cover" />
                        </div>
                      ))}
                   </div>
                   <div className="flex flex-col items-start justify-center text-xs">
                      <span className="text-pearl font-bold uppercase tracking-tighter">Milhares de templos</span>
                      <span className="text-pearl/40">Integrado com Base Mundial</span>
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {searched && filteredChurches.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mt-20">
          <div className="bg-amber/5 border border-amber/10 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 shadow-inner">
             <div className="w-20 h-20 bg-amber text-navy rounded-full flex items-center justify-center shrink-0">
                <Info className="w-10 h-10" />
             </div>
             <div className="space-y-2 flex-1 text-center md:text-left">
                <h3 className="text-xl font-display font-bold">Como funcionam as buscas?</h3>
                <p className="text-pearl/40 text-sm leading-relaxed">
                  Utilizamos dados abertos do <strong>OpenStreetMap</strong> para localizar templos cristãos. Os filtros de denominação são automáticos baseados nos nomes e etiquetas das igrejas. Algumas fotos são geradas via satélite histórico por geolocalização.
                </p>
             </div>
             <ChevronRight className="w-8 h-8 text-amber/20 hidden md:block" />
          </div>
        </section>
      )}
    </div>
  );
}
