import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Save, User, Bell, Lock, Globe, LogOut, ChevronRight, Moon, Sun, Languages } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";

const denominations = ["Católico", "Evangélico", "Batista", "Presbiteriano", "Pentecostal", "Sem denominação", "Outro"];
const bibleVersions = ["NVI", "ARA", "NVT", "NAA", "NTLH"];

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'app' | 'notif' | 'privacy'>('profile');
  const [bibleVersionState, setBibleVersionState] = useState("NVI");

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    denomination: "Sem denominação",
    bibleVersion: "NVI",
    isPublic: true,
    notifications: {
      dailyDevotional: true,
      prayerRequests: true,
      communityActivity: true,
    },
    privacy: {
      showProfile: true,
      showStreak: true,
      showStruggles: false,
    }
  });

  // Sync formData with user profile once on load
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (user && !hasLoaded) {
      console.log("DEBUG - DADO DO FIRESTORE NO useAuth:", user);
      
      const v = user.bibleVersion || "NVI";
      setBibleVersionState(v);
      
      setFormData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        denomination: user.denomination || "Sem denominação",
        bibleVersion: v,
        isPublic: user.isPublic ?? true,
        notifications: {
          dailyDevotional: user.notifications?.dailyDevotional ?? true,
          prayerRequests: user.notifications?.prayerRequests ?? true,
          communityActivity: user.notifications?.communityActivity ?? true,
        },
        privacy: {
          showProfile: user.privacy?.showProfile ?? true,
          showStreak: user.privacy?.showStreak ?? true,
          showStruggles: user.privacy?.showStruggles ?? false,
        }
      });
      setHasLoaded(true);
    }
  }, [user, hasLoaded]);

  // Log state on every render for debugging
  console.log("DEBUG - STATE bibleVersion local:", bibleVersionState);

  if (authLoading) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
 
  const handleToggleSetting = (category: 'notifications' | 'privacy', field: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [field]: !(prev[category] as any)[field]
      }
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSave = async () => {
    if (!user || loading) return;
    
    // Validation match with firestore.rules
    if (!formData.displayName || !formData.displayName.trim()) {
      alert("O nome de exibição não pode estar vazio.");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      console.log("DEBUG - SALVANDO bibleVersion:", bibleVersionState);
      console.log("DEBUG - UID PARA SALVAR:", user.uid);

      const updateData = {
        displayName: formData.displayName.trim(),
        bio: formData.bio || "",
        denomination: formData.denomination || "Sem denominação",
        bibleVersion: bibleVersionState,
        isPublic: formData.isPublic ?? true,
        notifications: {
          dailyDevotional: formData.notifications?.dailyDevotional ?? true,
          prayerRequests: formData.notifications?.prayerRequests ?? true,
          communityActivity: formData.notifications?.communityActivity ?? true,
        },
        privacy: {
          showProfile: formData.privacy?.showProfile ?? true,
          showStreak: formData.privacy?.showStreak ?? true,
          showStruggles: formData.privacy?.showStruggles ?? false,
        },
        spiritualLevel: user.spiritualLevel || "Semente",
        streak: user.streak ?? 0,
        updatedAt: serverTimestamp(),
      };

      console.log("DEBUG - PAYLOAD COMPLETO:", updateData);
      
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, updateData, { merge: true });
      
      console.log("DEBUG - SALVO NO FIRESTORE COM SUCESSO");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("DEBUG - ERRO AO SALVAR:", error);
      
      // Implement handleFirestoreError as instructed in the system rules
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        operationType: 'write',
        path: `users/${user.uid}`,
        authInfo: {
          userId: user.uid,
          email: user.email,
        }
      };
      console.error('Firestore Error Payload:', JSON.stringify(errInfo));
      
      alert(`Erro de permissão ou rede ao salvar. Verifique se seu perfil está completo.`);
    } finally {
      setLoading(false);
    }
  };

  const renderFooter = () => (
    <footer className="pt-6 border-t border-white/5 flex items-center justify-between">
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
  );

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
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm",
                item.id === activeTab ? "bg-amber text-navy shadow-lg shadow-amber/10" : "hover:bg-white/5 text-pearl/60"
              )}
            >
              <div className="flex items-center gap-3">
                 <item.icon className="w-5 h-5" />
                 {item.label}
              </div>
              <ChevronRight className={cn("w-4 h-4 transition-transform", activeTab === item.id ? "rotate-90 opacity-100" : "opacity-40")} />
            </button>
          ))}
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm mt-8 border border-red-400/20"
          >
             <LogOut className="w-5 h-5" /> Sair da Conta
          </button>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {activeTab === 'profile' && (
              <section className="glow-card space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-display font-bold flex items-center gap-3">
                    <User className="text-amber w-6 h-6" /> Informações do Perfil
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Nome de Exibição</label>
                       <input 
                         value={formData.displayName}
                         onChange={(e) => handleFieldChange("displayName", e.target.value)}
                         className="w-full bg-white/5 border border-amber/10 rounded-2xl px-6 py-4 outline-none focus:border-amber transition-colors"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Bio / Versículo Favorito</label>
                       <textarea 
                         value={formData.bio}
                         onChange={(e) => handleFieldChange("bio", e.target.value)}
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
                             onClick={() => handleFieldChange("denomination", d)}
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

                    <div className="space-y-2 pt-2">
                       <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">Versão da Bíblia Preferida</label>
                       <div className="flex flex-wrap gap-2">
                         {bibleVersions.map((v) => (
                           <button
                             key={v}
                             onClick={() => setBibleVersionState(v)}
                             className={cn(
                               "px-4 py-2 rounded-xl border text-xs transition-all",
                               bibleVersionState === v 
                                 ? "bg-amber border-amber text-navy font-bold" 
                                 : "bg-white/5 border-amber/10 text-pearl/60 hover:border-amber/40"
                             )}
                           >
                             {v}
                           </button>
                         ))}
                       </div>
                       <p className="text-[10px] text-pearl/40 italic">Esta versão será usada em todos os seus devocionais e estudos gerados por IA.</p>
                    </div>
                  </div>
                </div>
                {renderFooter()}
              </section>
            )}

            {activeTab === 'app' && (
              <section className="glow-card space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-display font-bold flex items-center gap-3">
                    <Globe className="text-amber w-6 h-6" /> Sistema e Interface
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
                             <p className="text-sm font-bold">Idioma do Sistema</p>
                             <p className="text-[10px] text-pearl/40 font-bold uppercase">Português (Brasil)</p>
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
                             <p className="text-sm font-bold">Chave de IA Privada (Gemini)</p>
                             <p className="text-[10px] text-pearl/40 font-bold uppercase">Opcional para maior autonomia</p>
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
                       <p className="text-[10px] text-amber/60">Use sua chave pessoal caso a conexão padrão esteja lenta ou limitada na sua região.</p>
                    </div>
                  </div>
                </div>
                {renderFooter()}
              </section>
            )}

            {activeTab === 'notif' && (
              <section className="glow-card space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-display font-bold flex items-center gap-3">
                    <Bell className="text-amber w-6 h-6" /> Notificações
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'dailyDevotional', label: 'Devocional Diário', desc: 'Lembrar de ler a palavra todas as manhãs' },
                      { id: 'prayerRequests', label: 'Pedidos de Oração', desc: 'Novas intercessões da comunidade' },
                      { id: 'communityActivity', label: 'Atividade no Mural', desc: 'Comentários e respostas em suas publicações' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">{item.label}</p>
                          <p className="text-[10px] text-pearl/40 font-bold uppercase">{item.desc}</p>
                        </div>
                        <button 
                          onClick={() => handleToggleSetting('notifications', item.id)}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative p-1",
                            formData.notifications[item.id as keyof typeof formData.notifications] ? "bg-amber" : "bg-white/10"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full bg-white transition-all",
                            formData.notifications[item.id as keyof typeof formData.notifications] ? "ml-6" : "ml-0"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {renderFooter()}
              </section>
            )}

            {activeTab === 'privacy' && (
              <section className="glow-card space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-display font-bold flex items-center gap-3">
                    <Lock className="text-amber w-6 h-6" /> Privacidade e Segurança
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'showProfile', label: 'Perfil Público', desc: 'Permitir que outros vejam sua bio e denominação' },
                      { id: 'showStreak', label: 'Mostrar Ofensiva', desc: 'Exibir sua constância de dias no mural' },
                      { id: 'showStruggles', label: 'Histórico de Lutas Privado', desc: 'Suas lutas são visíveis apenas para você' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold">{item.label}</p>
                          <p className="text-[10px] text-pearl/40 font-bold uppercase">{item.desc}</p>
                        </div>
                        <button 
                          onClick={() => handleToggleSetting('privacy', item.id)}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative p-1",
                            formData.privacy[item.id as keyof typeof formData.privacy] ? "bg-amber" : "bg-white/10"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full bg-white transition-all",
                            formData.privacy[item.id as keyof typeof formData.privacy] ? "ml-6" : "ml-0"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {renderFooter()}
              </section>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
