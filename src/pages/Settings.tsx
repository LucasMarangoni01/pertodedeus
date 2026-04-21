import { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Save, User, Bell, Lock, Globe, LogOut, ChevronRight, Moon, Sun, Languages } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";

const denominations = ["Católico", "Evangélico", "Batista", "Presbiteriano", "Pentecostal", "Sem denominação", "Outro"];

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    denomination: user?.denomination || "Sem denominação",
    isPublic: true,
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setSuccess(false);
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="space-y-2">
        <p className="text-amber font-medium tracking-widest uppercase text-xs">Preferências</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Configurações</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-4 space-y-2">
          {[
            { id: 'profile', label: 'Perfil', icon: User },
            { id: 'app', label: 'Aplicativo', icon: Globe },
            { id: 'notif', label: 'Notificações', icon: Bell },
            { id: 'privacy', label: 'Privacidade', icon: Lock },
          ].map((item) => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm",
                item.id === 'profile' ? "bg-amber text-navy" : "hover:bg-white/5 text-pearl/60"
              )}
            >
              <div className="flex items-center gap-3">
                 <item.icon className="w-5 h-5" />
                 {item.label}
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </button>
          ))}
          
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-amber hover:bg-grape/40 transition-all font-bold text-sm mt-8 border border-grape"
          >
             <LogOut className="w-5 h-5" /> Sair da Conta
          </button>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-8 space-y-8">
          <section className="glow-card space-y-8">
             <div className="space-y-6">
                <h3 className="text-xl font-display font-bold flex items-center gap-3">
                   <User className="text-amber w-6 h-6" /> Informações Pessoais
                </h3>
                
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Nome de Exibição</label>
                      <input 
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full bg-white/5 border border-amber/10 rounded-2xl px-6 py-4 outline-none focus:border-amber transition-colors"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Bio / Inspiração</label>
                      <textarea 
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={3}
                        className="w-full bg-white/5 border border-amber/10 rounded-2xl px-6 py-4 outline-none focus:border-amber transition-colors resize-none"
                        placeholder="Uma frase que define sua caminhada..."
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Denominação</label>
                      <div className="flex flex-wrap gap-2">
                        {denominations.map((d) => (
                          <button
                            key={d}
                            onClick={() => setFormData({ ...formData, denomination: d })}
                            className={cn(
                              "px-4 py-2 rounded-xl border text-xs transition-all",
                              formData.denomination === d 
                                ? "bg-amber border-amber text-navy font-bold" 
                                : "bg-white/5 border-amber/10 text-pearl/60 hover:border-amber/40"
                            )}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
             </div>

             <div className="pt-6 border-t border-amber/10 space-y-6">
                <h3 className="text-xl font-display font-bold flex items-center gap-3">
                   <Globe className="text-amber w-6 h-6" /> Preferências do App
                </h3>
                
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber">
                            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                         </div>
                         <div>
                            <p className="text-sm font-bold">Modo Escuro</p>
                            <p className="text-[10px] text-pearl/40 font-bold uppercase">Mais conforto visual</p>
                         </div>
                      </div>
                      <button 
                        onClick={toggleTheme}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative p-1",
                          theme === 'dark' ? "bg-amber" : "bg-white/10"
                        )}
                      >
                         <div className={cn(
                           "w-4 h-4 rounded-full bg-white transition-all",
                           theme === 'dark' ? "ml-6" : "ml-0"
                         )} />
                      </button>
                   </div>

                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber">
                            <Languages className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-bold">Idioma Principal</p>
                            <p className="text-[10px] text-pearl/40 font-bold uppercase">Português (BR)</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-pearl/20" />
                   </div>
                   
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber">
                            <Lock className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-bold">Acesso Seguro IA (Opcional)</p>
                            <p className="text-[10px] text-pearl/40 font-bold uppercase">Sua própria API Key do Gemini</p>
                         </div>
                      </div>
                      <input 
                         type="password"
                         placeholder="Cole sua chave AIzaSy... aqui"
                         defaultValue={localStorage.getItem("USER_GEMINI_KEY") || ""}
                         onChange={(e) => {
                            if(e.target.value.trim()){
                               localStorage.setItem("USER_GEMINI_KEY", e.target.value.trim());
                            } else {
                               localStorage.removeItem("USER_GEMINI_KEY");
                            }
                         }}
                         className="w-full bg-navy/50 border border-amber/10 rounded-xl px-4 py-3 outline-none focus:border-amber transition-colors text-xs font-mono"
                      />
                      <p className="text-[10px] text-amber/60">Configure isso caso a Nuvem Oficial da IA da igreja esteja bloqueando o seu acesso ao Assistente Bíblico e aos Devocionais no seu aplicativo.</p>
                   </div>
                </div>
             </div>

             <footer className="pt-6 flex items-center justify-between">
                <div className={cn(
                   "text-xs font-bold text-amber transition-opacity",
                   success ? "opacity-100" : "opacity-0"
                )}>
                   Alterações salvas com sucesso!
                </div>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-amber text-navy font-bold px-8 py-3 rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
             </footer>
          </section>
        </main>
      </div>
    </div>
  );
}
