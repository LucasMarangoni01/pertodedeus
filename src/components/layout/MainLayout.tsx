import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, BookOpen, MessageSquare, Heart, User, LogOut, Search, PenTool, GraduationCap, Users, Bot, MapPin, HelpCircle, ShieldAlert, Calculator } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NotificationManager } from "../NotificationManager";
import { useNotificationTriggers } from "../../hooks/useNotificationTriggers";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/bible", icon: BookOpen, label: "Bíblia" },
  { path: "/prayer", icon: MessageSquare, label: "Oração" },
  { path: "/sos", icon: ShieldAlert, label: "S.O.S" },
  { path: "/diary", icon: PenTool, label: "Diário" },
  { path: "/plans", icon: BookOpen, label: "Planos" },
  { path: "/calculator", icon: Calculator, label: "Cálculos" },
  { path: "/churches", icon: MapPin, label: "Igrejas" },
  { path: "/study", icon: GraduationCap, label: "Estudos" },
  { path: "/community", icon: Users, label: "Mural" },
  { path: "/assistant", icon: Bot, label: "AI" },
  { path: "/devotional", icon: Heart, label: "Devocional com IA" },
  { path: "/profile", icon: User, label: "Perfil" },
  { path: "/guide", icon: HelpCircle, label: "Guia" },
];

export default function MainLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  useNotificationTriggers();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-navy text-pearl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-navy/80 border-r border-amber/10 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 bg-amber rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(201,168,76,0.5)]">
             <Heart className="text-navy w-6 h-6" fill="currentColor" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight bg-gradient-to-br from-amber to-amber/60 bg-clip-text text-transparent">
            Perto de Deus
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                  isActive 
                    ? "bg-amber/10 text-amber" 
                    : "text-pearl/60 hover:text-pearl hover:bg-white/5"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-amber/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-pearl/40 hover:text-grape hover:bg-grape/20 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-navy/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber/10">
        <div className="flex items-center gap-2">
          <Heart className="text-amber w-6 h-6" fill="currentColor" />
          <span className="font-display font-bold text-lg tracking-tight">Perto de Deus</span>
        </div>
        <button className="p-2 text-pearl/60 hover:text-amber transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl pb-24 md:pb-10">
          <Outlet />
        </div>
        <NotificationManager />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 h-16 bg-navy/90 backdrop-blur-xl border border-amber/20 rounded-2xl flex items-center px-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] overflow-x-auto custom-scrollbar no-scrollbar gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "p-3 rounded-xl transition-all duration-300 relative group flex-shrink-0 flex items-center justify-center",
                isActive ? "text-amber bg-amber/10" : "text-pearl/40 hover:text-pearl/60"
              )
            }
          >
            <item.icon className="w-6 h-6" />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
