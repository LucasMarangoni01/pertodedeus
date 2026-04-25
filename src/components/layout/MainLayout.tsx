import { Outlet, NavLink, useNavigate, Navigate, useOutletContext } from "react-router-dom";
import { Home, BookOpen, MessageSquare, Heart, User, LogOut, Search, PenTool, GraduationCap, Users, Bot, MapPin, HelpCircle, ShieldAlert, Calculator, Flame, LayoutGrid, Menu, X, Settings as SettingsIcon, Calendar as CalendarIcon, Music as MusicIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { NotificationManager } from "../NotificationManager";
import { useNotificationTriggers } from "../../hooks/useNotificationTriggers";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import SearchModal from "../SearchModal";

const navigationGroups = [
  {
    title: "Essencial",
    items: [
      { path: "/", icon: LayoutGrid, label: "Painel" },
      { path: "/profile", icon: User, label: "Meu Perfil" },
      { path: "/sos", icon: ShieldAlert, label: "S.O.S (Ajuda)" },
    ]
  },
  {
    title: "Espiritualidade",
    items: [
      { path: "/bible", icon: BookOpen, label: "Bíblia Sagrada" },
      { path: "/music", icon: MusicIcon, label: "Louvor & Adoração" },
      { path: "/jejum", icon: Flame, label: "Jejum Espiritual" },
      { path: "/prayer", icon: MessageSquare, label: "Meus Pedidos" },
      { path: "/devotional", icon: Heart, label: "Devocional IA" },
      { path: "/study", icon: GraduationCap, label: "Estudos" },
      { path: "/plans", icon: BookOpen, label: "Planos de Leitura" },
    ]
  },
  {
    title: "Vida & Liberdade",
    items: [
      { path: "/struggles", icon: Flame, label: "Caminho de Liberdade" },
      { path: "/diary", icon: PenTool, label: "Diário Espiritual" },
      { path: "/agenda", icon: CalendarIcon, label: "Minha Agenda" },
      { path: "/calculator", icon: Calculator, label: "Cálculos Bíblicos" },
    ]
  },
  {
    title: "Comunidade",
    items: [
      { path: "/community", icon: Users, label: "Mural da Fé" },
      { path: "/churches", icon: MapPin, label: "Igrejas Próximas" },
      { path: "/quiz", icon: HelpCircle, label: "Quiz de Fé" },
      { path: "/assistant", icon: Bot, label: "Assistente IA" },
    ]
  },
  {
    title: "Suporte",
    items: [
      { path: "/guide", icon: HelpCircle, label: "Guia do App" },
      { path: "/settings", icon: SettingsIcon, label: "Configurações" },
    ]
  }
];

export default function MainLayout() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  useNotificationTriggers();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.clear();
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber/20 border-t-amber rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Flattened for mobile/logic and filtering
  const allNavItems = navigationGroups.flatMap(g => g.items);
  
  const filteredGroups = globalSearch 
    ? [{ 
        title: "Resultados da Busca", 
        items: allNavItems.filter(item => 
          item.label.toLowerCase().includes(globalSearch.toLowerCase())
        ) 
      }]
    : navigationGroups;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-navy text-pearl">
      {/* Global Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-navy/90 border-r border-amber/10 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-8 group cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 bg-amber rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(201,168,76,0.3)]">
             <Heart className="text-navy w-6 h-6" fill="currentColor" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight text-amber">
            Perto de Deus
          </h1>
        </div>

        {/* Global Search Bar */}
        <div className="mb-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/20 group-focus-within:text-amber transition-colors" />
          <input 
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Buscar funções..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-amber/50 transition-all placeholder:text-pearl/20"
          />
          {globalSearch && (
            <button 
              onClick={() => setGlobalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-pearl/20 hover:text-pearl"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-10">
          {filteredGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-pearl/20">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.length > 0 ? group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
                        isActive 
                          ? "bg-amber/10 text-amber" 
                          : "text-pearl/50 hover:text-pearl hover:bg-white/5"
                      )
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                )) : (
                  <p className="px-4 py-2 text-[10px] text-pearl/20 font-serif italic">Nenhum resultado encontrado</p>
                )}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-amber/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-pearl/30 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sair da Conta</span>
          </button>
          <div className="mt-6 text-[10px] text-pearl/20 text-center font-medium">
            © {new Date().getFullYear()} Perto de Deus<br />
            Todos os direitos reservados
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-navy/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber/10">
        <div className="flex items-center gap-2">
          <Heart className="text-amber w-6 h-6" fill="currentColor" />
          <span className="font-display font-bold text-lg tracking-tight">Perto de Deus</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="p-2 text-pearl/40 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-navy/95 backdrop-blur-xl p-8 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold text-amber">Navegação</h2>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-pearl/40 hover:text-pearl"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="mb-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pearl/20" />
              <input 
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Para onde quer ir?"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-amber/50 transition-all font-display"
              />
              {globalSearch && (
                <button 
                  onClick={() => setGlobalSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full text-pearl"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-10 pb-20">
              {filteredGroups.map((group) => (
                <div key={group.title} className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-pearl/20">{group.title}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {group.items.length > 0 ? group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2",
                            isActive 
                              ? "bg-amber/10 border-amber/30 text-amber" 
                              : "bg-white/5 border-white/5 text-pearl/60"
                          )
                        }
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">{item.label}</span>
                      </NavLink>
                    )) : (
                      <p className="col-span-2 text-center py-4 text-pearl/20 text-xs italic">Nenhum resultado para "{globalSearch}"</p>
                    )}
                  </div>
                </div>
              ))}
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-red-500/10 text-red-500 font-bold"
              >
                <LogOut className="w-5 h-5" /> Sair da Conta
              </button>

              <div className="text-center text-[10px] text-pearl/20 pb-10">
                © {new Date().getFullYear()} Perto de Deus • Todos os direitos reservados
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl pb-24 md:pb-10">
          <Outlet context={{ openSearch: () => setIsSearchModalOpen(true) }} />
        </div>
        <NotificationManager />
      </main>

      {/* Mobile Bottom Navigation (Streamlined) */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-navy/90 backdrop-blur-xl border border-amber/20 rounded-2xl flex items-center justify-around px-2 z-50 shadow-2xl">
        {[
          { path: "/", icon: LayoutGrid, label: "Painel" },
          { path: "/bible", icon: BookOpen, label: "Bíblia" },
          { path: "/prayer", icon: MessageSquare, label: "Oração" },
          { path: "/sos", icon: ShieldAlert, label: "Ajuda" },
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300 px-3",
                isActive ? "text-amber scale-110" : "text-pearl/40"
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </NavLink>
        ))}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 text-pearl/40 px-3"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>
      </nav>
    </div>
  );
}
