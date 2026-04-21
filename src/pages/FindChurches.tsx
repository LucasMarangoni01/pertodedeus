import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Phone, Globe, Navigation, Church, Loader2, Info } from "lucide-react";
import { cn } from "../lib/utils";

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

export default function FindChurches() {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
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
    setCity(s.display_name.split(',')[0] + (s.address?.state ? `, ${s.address.state}` : ""));
    setSuggestions([]);
    setShowSuggestions(false);
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
    if (str.includes("evangélica") || str.includes("evangelical") || str.includes("pentecostal") || str.includes("universal") || str.includes("claudia")) return "Evangélica";
    return d || "Cristã";
  };

  const filteredChurches = churches.filter(church => {
    if (filter === "all") return true;
    const normalized = normalizeDenomination(church.denomination, church.name);
    if (filter === "catholic") return normalized === "Católica";
    if (filter === "evangelical") return ["Evangélica", "Assembleia de Deus", "Batista", "Presbiteriana", "Metodista", "Universal", "Congregação Cristã"].includes(normalized);
    if (filter === "adventist") return normalized === "Adventista";
    return true;
  });

  const fetchWikidataImages = async (results: ChurchData[]) => {
    const withWikidata = results.filter(c => c.wikidata && !c.image);
    if (withWikidata.length === 0) return;

    try {
      const ids = withWikidata.map(c => c.wikidata).join('|');
      const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&ids=${ids}&format=json&origin=*`;
      const res = await fetch(url);
      const data = await res.json();

      setChurches(prev => prev.map(church => {
        const wikidataInfo = data.entities?.[church.wikidata || ''];
        const imageName = wikidataInfo?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        if (imageName) {
          return {
            ...church,
            image: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}?width=800`,
            isRealPhoto: true
          };
        }
        return church;
      }));
    } catch (e) {
      console.error("Error fetching Wikidata images", e);
    }
  };

  const searchChurches = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setChurches([]);

    try {
      // 1. Geocode city name (restricted to Brazil)
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&countrycodes=br`;
      const geoRes = await fetch(geoUrl, { headers: { "Accept-Language": "pt-BR" } });
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        throw new Error("Cidade não encontrada.");
      }

      const { lat, lon } = geoData[0];

      // 2. Fetch churches
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="christian"](around:10000, ${lat}, ${lon});
          way["amenity"="place_of_worship"]["religion"="christian"](around:10000, ${lat}, ${lon});
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
      fetchWikidataImages(sorted);

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao buscar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 min-h-screen">
      <header className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex p-3 bg-amber/10 rounded-2xl text-amber mb-4">
          <MapPin className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Encontrar Igrejas</h1>
        <p className="text-pearl/60 font-serif italic text-lg text-balance">
          "Onde dois ou três estiverem reunidos em meu nome, ali eu estarei no meio deles." — Mateus 18:20
        </p>
      </header>

      <section className="max-w-xl mx-auto space-y-6 relative" ref={suggestionRef}>
        <form onSubmit={searchChurches} className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-pearl/40 group-focus-within:text-amber transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="Digite sua cidade (ex: São Paulo, SP)" 
            value={city}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full bg-white/5 border border-amber/10 rounded-2xl py-5 pl-14 pr-32 outline-none focus:border-amber focus:ring-1 focus:ring-amber/50 transition-all text-lg placeholder:text-pearl/20"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-3 top-2 bottom-2 bg-amber text-navy font-bold px-6 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buscar"}
          </button>
        </form>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full mt-2 bg-navy/95 backdrop-blur-xl border border-amber/20 rounded-2xl overflow-hidden z-50 shadow-2xl"
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
                      {s.display_name.split(',').slice(1, 3).join(',')}
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: "all", label: "Todas" },
            { id: "catholic", label: "Católica" },
            { id: "evangelical", label: "Evangélica" },
            { id: "adventist", label: "Adventista" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-medium transition-all border",
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

      <div className="space-y-8">
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
              <p className="font-display italic">Semeando a busca nas cidades...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glow-card border-grape/20 bg-grape/10 p-8 text-center space-y-4"
            >
               <Info className="w-10 h-10 text-pearl mx-auto" />
               <p className="text-grape font-medium">{error}</p>
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
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredChurches.map((church, idx) => (
                <motion.div
                  key={church.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glow-card group hover:border-amber/40 transition-all flex flex-col h-full overflow-hidden"
                >
                  {/* Church Image Cover */}
                  <div className="relative h-48 w-full overflow-hidden bg-navy/50 shrink-0 border-b border-amber/10">
                    <img 
                      src={church.image || `https://static-maps.yandex.ru/1.x/?ll=${church.lon},${church.lat}&z=18&l=sat&size=600,450`} 
                      alt={church.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Avoid infinite loops
                        if (!target.src.includes('static-maps')) {
                          target.src = `https://static-maps.yandex.ru/1.x/?ll=${church.lon},${church.lat}&z=18&l=sat&size=600,450`;
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />
                    {/* Visual indicators */}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                      <div className="p-2 bg-navy/80 backdrop-blur-md rounded-lg text-amber border border-amber/20 group-hover:bg-amber group-hover:text-navy transition-colors">
                        <Church className="w-4 h-4" />
                      </div>
                      {church.isRealPhoto ? (
                        <div className="bg-grape/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-tight">
                           Foto Real
                        </div>
                      ) : (
                        <div className="bg-amber/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-tight">
                           Satélite Real
                        </div>
                      )}
                    </div>
                    {church.denomination && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-amber bg-navy/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded">
                          {normalizeDenomination(church.denomination, church.name)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-60" />
                  </div>

                  <div className="p-6 space-y-4 flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold group-hover:text-amber transition-colors line-clamp-1">
                          {church.name}
                        </h3>
                        {church.city && (
                          <span className="text-[10px] text-pearl/20 font-medium whitespace-nowrap bg-white/5 px-1.5 py-0.5 rounded">
                            {church.city}
                          </span>
                        )}
                      </div>
                      {church.address && (
                        <p className="text-pearl/40 text-sm mt-2 flex items-start gap-2 italic">
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                          {church.address}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 flex flex-wrap gap-4 text-xs font-medium text-pearl/40">
                      {church.phone && (
                        <a href={`tel:${church.phone}`} className="flex items-center gap-1 hover:text-amber">
                          <Phone className="w-3 h-3" /> {church.phone}
                        </a>
                      )}
                      {church.website && (
                        <a href={church.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-amber">
                          <Globe className="w-3 h-3" /> Website
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-amber/10 p-4 bg-white/[0.02]">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lon}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-2 hover:text-amber transition-colors"
                    >
                      <Navigation className="w-4 h-4" /> Ver Rota no Mapas
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {!searched && (
        <section className="bg-white/[0.02] border border-amber/10 p-12 rounded-[2.5rem] text-center space-y-6 max-w-4xl mx-auto">
          <div className="flex justify-center -space-x-4">
             {[1,2,3].map(i => (
               <div key={i} className="w-12 h-12 rounded-full border-4 border-navy overflow-hidden bg-white/10">
                 <img src={`https://picsum.photos/seed/church${i}/100/100`} alt="Christian Community" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
               </div>
             ))}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold">Encontre sua Comunidade</h2>
            <p className="text-pearl/40 max-w-lg mx-auto">
              Seja para congregar, visitar ou buscar apoio pastoral, use nossa ferramenta para localizar igrejas cristãs próximas a você.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
