import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, BookOpen, MessageSquare, Heart, User, LayoutGrid, ShieldAlert, Calendar, Calculator, Flame, Users, Bot, MapPin, HelpCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

const navigationItems = [
  { path: "/", icon: LayoutGrid, label: "Painel", category: "Essencial" },
  { path: "/profile", icon: User, label: "Meu Perfil", category: "Essencial" },
  { path: "/sos", icon: ShieldAlert, label: "S.O.S (Ajuda)", category: "Essencial" },
  { path: "/bible", icon: BookOpen, label: "Bíblia Sagrada", category: "Espiritualidade" },
  { path: "/prayer", icon: MessageSquare, label: "Meus Pedidos", category: "Espiritualidade" },
  { path: "/devotional", icon: Heart, label: "Devocional IA", category: "Espiritualidade" },
  { path: "/study", icon: GraduationCap, label: "Estudos", category: "Espiritualidade" },
  { path: "/plans", icon: BookOpen, label: "Planos de Leitura", category: "Espiritualidade" },
  { path: "/struggles", icon: Flame, label: "Caminho de Liberdade", category: "Vida & Liberdade" },
  { path: "/diary", icon: PenTool, label: "Diário Espiritual", category: "Vida & Liberdade" },
  { path: "/agenda", icon: Calendar, label: "Minha Agenda", category: "Vida & Liberdade" },
  { path: "/calculator", icon: Calculator, label: "Cálculos Bíblicos", category: "Vida & Liberdade" },
  { path: "/community", icon: Users, label: "Mural da Fé", category: "Comunidade" },
  { path: "/churches", icon: MapPin, label: "Igrejas Próximas", category: "Comunidade" },
  { path: "/quiz", icon: HelpCircle, label: "Quiz de Fé", category: "Comunidade" },
  { path: "/assistant", icon: Bot, label: "Assistente IA", category: "Comunidade" },
  { path: "/guide", icon: HelpCircle, label: "Guia do App", category: "Suporte" },
  { path: "/settings", icon: Settings, label: "Configurações", category: "Suporte" }
];

// Helper for missing icons (PenTool and GraduationCap are often used)
import { PenTool, GraduationCap } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // The parent component should handle this, but we can also have it here if mounted
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filteredItems = query
    ? navigationItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : navigationItems.slice(0, 5); // Show first 5 items if empty

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-20 px-4 md:pt-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-xl bg-navy border border-amber/20 rounded-2xl shadow-2xl overflow-hidden relative z-10"
          >
            <div className="p-4 border-b border-amber/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-amber" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Para onde quer ir hoje?"
                className="flex-1 bg-transparent border-none outline-none text-pearl font-display text-lg placeholder:text-pearl/20"
              />
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-pearl/40 hover:text-pearl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-2">
              {filteredItems.length > 0 ? (
                <div className="space-y-4 py-2">
                  {/* Grouped results could be nice but simple list is fine for now */}
                  <div className="px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-pearl/20">
                    {query ? "Resultados encontrados" : "Sugestões rápidas"}
                  </div>
                  <div className="space-y-1">
                    {filteredItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-amber/10 group transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 rounded-lg text-pearl/40 group-hover:text-amber transition-colors">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-pearl/80 group-hover:text-pearl">{item.label}</p>
                            <p className="text-[10px] text-pearl/20 group-hover:text-amber/60">{item.category}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-pearl/10 group-hover:text-amber/40">Enter ⏎</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8 text-pearl/10" />
                  </div>
                  <p className="text-pearl/40 font-serif italic text-lg">"Pedi, e dar-se-vos-á; buscai, e encontrareis."</p>
                  <p className="text-xs text-pearl/20">Nenhum resultado encontrado para "{query}"</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-amber/10 flex items-center justify-between text-[10px] font-bold text-pearl/20 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-pearl/40">↑↓</span> Navegar
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-pearl/40">ESC</span> Fechar
                </span>
              </div>
              <span className="text-amber/40 italic">Guia de Fé</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
