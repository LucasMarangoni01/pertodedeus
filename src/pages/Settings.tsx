import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db, withTimeout } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  Save, User, Bell, Lock, Globe, LogOut, ChevronRight, 
  Moon, Sun, Languages, RefreshCw, AlertTriangle, 
  CheckCircle2, AlertCircle, X, ExternalLink, Clipboard,
  Eye, EyeOff, Info
} from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";
import { usePreference } from "../contexts/PreferenceContext";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

const denominations = ["Católico", "Evangélico", "Batista", "Presbiteriano", "Pentecostal", "Sem denominação", "Outro"];
const BIBLE_VERSIONS = [
  { id: "ARA", name: "ARA - Almeida Revista e Atualizada" },
  { id: "NVIPT", name: "NVI - Nova Versão Internacional", alias: "NVI" },
  { id: "NTLH", name: "NTLH - Nova Tradução na Linguagem de Hoje" },
  { id: "NVT", name: "NVT - Nova Versão Transformadora" },
  { id: "NAA", name: "NAA - Nova Almeida Atualizada" },
  { id: "ACF", name: "ACF - Almeida Corrigida Fiel" },
  { id: "AA", name: "AA - Almeida Atualizada" }
];

export default function Settings() {
  const { user, loading: authLoading, signOut, isGuest } = useAuth();
  const { preferences, togglePreference } = usePreference();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'app' | 'notif' | 'privacy' | 'advanced'>('profile');
  
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem("USER_GEMINI_KEY") || "");
  const [showApiKey, setShowApiKey] = useState(false);
  
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

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!hasLoaded && user) {
      let v = localStorage.getItem("bibleVersion") || user.bibleVersion || "NVI";
      let localData = null;

      if (isGuest) {
        const saved = localStorage.getItem("guestSettings");
        if (saved) {
          localData = JSON.parse(saved);
          v = localData.bibleVersion || v;
        }
      }

      setFormData({
        displayName: localData?.displayName || user.displayName || (isGuest ? "Visitante" : ""),
        bio: localData?.bio || user.bio || "",
        denomination: localData?.denomination || user.denomination || "Sem denominação",
        bibleVersion: v,
        isPublic: localData?.isPublic ?? (user.isPublic ?? true),
        notifications: {
          dailyDevotional: localData?.notifications?.dailyDevotional ?? (user.notifications?.dailyDevotional ?? true),
          prayerRequests: localData?.notifications?.prayerRequests ?? (user.notifications?.prayerRequests ?? true),
          communityActivity: localData?.notifications?.communityActivity ?? (user.notifications?.communityActivity ?? true),
        },
        privacy: {
          showProfile: localData?.privacy?.showProfile ?? (user.privacy?.showProfile ?? true),
          showStreak: localData?.privacy?.showStreak ?? (user.privacy?.showStreak ?? true),
          showStruggles: localData?.privacy?.showStruggles ?? (user.privacy?.showStruggles ?? false),
        }
      });
      setHasLoaded(true);
    }
  }, [user, hasLoaded, isGuest]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasteAndSave = async () => {
    try {
      // Trying to use Clipboard API
      let text = "";
      try {
        if (!navigator.clipboard) {
          throw new Error("Clipboard API not available");
        }
        text = await navigator.clipboard.readText();
      } catch (err) {
        // Fallback or just inform the user if permission is denied
        console.warn("Clipboard access denied", err);
        showNotification("Permita o acesso à área de transferência ou cole manualmente.", "error");
        return;
      }

      const val = text.trim();
      setApiKeyInput(val);
      
      if (val.startsWith("AIza")) {
        localStorage.setItem("USER_GEMINI_KEY", val);
        showNotification("Chave configurada com sucesso!", "success");
      } else {
        showNotification("Chave inválida. Certifique-se de copiar a chave completa (começa com AIza).", "error");
      }
    } catch (err) {
      console.error("Error with paste and save:", err);
      showNotification("Erro ao processar chave.", "error");
    }
  };

  const handleManualSave = (val: string) => {
    const trimmed = val.trim();
    setApiKeyInput(trimmed);
    if (trimmed === "") {
      localStorage.removeItem("USER_GEMINI_KEY");
      showNotification("Chave removida.", "success");
    } else if (trimmed.startsWith("AIza")) {
      localStorage.setItem("USER_GEMINI_KEY", trimmed);
      showNotification("Chave salva com sucesso!", "success");
    } else {
      showNotification("Formato de chave inválido.", "error");
    }
  };
 
  const handleToggleSetting = (category: 'notifications' | 'privacy', field: string) => {
    setFormData(prev => {
      const newValue = !(prev[category] as any)[field];
      const newState = {
        ...prev,
        [category]: {
          ...(prev[category] as any),
          [field]: newValue
        }
      };
      
      // Sync showProfile with isPublic
      if (category === 'privacy' && field === 'showProfile') {
        newState.isPublic = newValue;
      }
      
      return newState;
    });
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
    if ((!user && !isGuest) || loading) return;
    
    // Allow empty name, but fallback to "Visitante" or original
    let finalName = formData.displayName.trim();
    if (!finalName) {
      finalName = isGuest ? "Visitante" : (user?.displayName || "Discípulo");
      setFormData(prev => ({ ...prev, displayName: finalName }));
    }

    setLoading(true);

    try {
      const updateData = {
        ...formData,
        displayName: finalName,
        updatedAt: isGuest ? new Date().toISOString() : serverTimestamp(),
      };

      if (isGuest) {
        localStorage.setItem("guestSettings", JSON.stringify(updateData));
      } else if (user) {
        const userRef = doc(db, "users", user.uid);
        await withTimeout(setDoc(userRef, updateData, { merge: true }), 15000);
        
        // Sync bible version locally for performance
        localStorage.setItem("bibleVersion", formData.bibleVersion);
      }
      
      showNotification("Configurações salvas com sucesso!", "success");
    } catch (error: any) {
      console.error("[Settings] Error saving settings:", error);
      showNotification("Erro ao salvar. Verifique sua conexão.", "error");
      if (user?.uid) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFooter = () => (
    <footer className="pt-8 border-t border-white/5 flex items-center justify-end">
      <button 
        onClick={handleSave}
        disabled={loading}
        className="flex items-center gap-3 bg-amber text-navy font-bold px-10 py-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        {loading ? "Salvando..." : "Salvar Alterações"}
      </button>
    </footer>
  );

  if (authLoading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: "-50%" }}
            className={cn(
              "fixed top-24 left-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border",
              notification.type === 'success' 
                ? "bg-green-500/20 border-green-500/30 text-green-400" 
                : "bg-red-500/20 border-red-500/30 text-red-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-tight">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="space-y-3 px-4 pt-4">
        <p className="text-amber font-medium tracking-[0.3em] uppercase text-[10px]">Preferências do Discípulo</p>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight">Configurações</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 px-4">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-4 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 gap-2 md:gap-3 scrollbar-none snap-x h-min">
          {[
            { id: 'profile', label: 'Meu Perfil', icon: User },
            { id: 'app', label: 'Aplicativo', icon: Globe },
            { id: 'notif', label: 'Notificações', icon: Bell },
            { id: 'privacy', label: 'Privacidade', icon: Lock },
            { id: 'advanced', label: 'Avançado', icon: RefreshCw },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl transition-all font-bold text-xs md:text-sm group whitespace-nowrap snap-start shrink-0 lg:shrink",
                item.id === activeTab 
                  ? "bg-amber text-navy shadow-xl shadow-amber/10 lg:translate-x-1" 
                  : "hover:bg-white/5 text-pearl/40 hover:text-pearl/70"
              )}
            >
              <div className="flex items-center gap-2 md:gap-3">
                 <item.icon className={cn("w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110", item.id === activeTab ? "text-navy" : "text-amber/40")} />
                 {item.label}
              </div>
              <ChevronRight className={cn("hidden lg:block w-4 h-4 transition-transform", activeTab === item.id ? "rotate-90 opacity-100" : "opacity-0")} />
            </button>
          ))}
          
          <button 
            onClick={handleLogout}
            className="lg:w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-xs md:text-sm lg:mt-10 border border-red-400/20 shadow-lg shadow-red-400/5 group whitespace-nowrap snap-start shrink-0 lg:shrink"
          >
             <LogOut className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" /> 
              Sair
          </button>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {activeTab === 'profile' && (
                <section className="glow-card space-y-8 p-8">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber/10 rounded-xl text-amber">
                        <User className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-display font-bold">Identidade de Fé</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-[0.2em] pl-1">Nome Missionário</label>
                         <input 
                           value={formData.displayName}
                           onChange={(e) => handleFieldChange("displayName", e.target.value)}
                           className="w-full bg-navy border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-amber/50 transition-all shadow-inner font-medium text-white"
                           placeholder="Ex: Lucas de Deus"
                         />
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-[0.2em] pl-1">Bio / Testemunho</label>
                         <textarea 
                           value={formData.bio}
                           onChange={(e) => handleFieldChange("bio", e.target.value)}
                           rows={4}
                           className="w-full bg-navy border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-amber/50 transition-all resize-none shadow-inner text-pearl/70 font-medium"
                           placeholder="Fale um pouco sobre sua caminhada com Cristo..."
                         />
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-[0.2em] pl-1">Denominação</label>
                         <div className="flex flex-wrap gap-2 pt-1">
                           {denominations.map((d) => (
                             <button
                               key={d}
                               onClick={() => handleFieldChange("denomination", d)}
                               className={cn(
                                 "px-4 py-2.5 rounded-xl border text-[11px] font-bold transition-all",
                                 formData.denomination === d 
                                   ? "bg-amber border-amber text-navy shadow-lg shadow-amber/20" 
                                   : "bg-white/5 border-white/5 text-pearl/40 hover:bg-white/10"
                               )}
                             >
                               {d}
                             </button>
                           ))}
                         </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                         <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-[0.2em] pl-1">Versão da Bíblia Preferida</label>
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                           {BIBLE_VERSIONS.map((v) => (
                             <button
                               key={v.id}
                               type="button"
                               onClick={() => handleFieldChange("bibleVersion", v.id)}
                               className={cn(
                                 "px-3 py-3 rounded-xl border text-xs font-bold transition-all text-center",
                                 formData.bibleVersion === v.id || (v.alias && formData.bibleVersion === v.alias)
                                   ? "bg-amber border-amber text-navy shadow-lg" 
                                   : "bg-navy border-white/5 text-pearl/40 hover:bg-white/10"
                               )}
                               title={v.name}
                             >
                               {v.alias || v.id}
                             </button>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
                  {renderFooter()}
                </section>
              )}

              {activeTab === 'app' && (
                <section className="glow-card space-y-8 p-8">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber/10 rounded-xl text-amber">
                        <Globe className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-display font-bold">Ambiente de Uso</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-navy/40 border border-white/5 rounded-2xl group transition-all hover:border-amber/20 shadow-md">
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-amber/10 flex items-center justify-center text-amber shadow-inner">
                               {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                            </div>
                            <div>
                               <p className="font-bold text-white tracking-tight">Modo Escuro</p>
                               <p className="text-[10px] text-pearl/40 font-bold uppercase tracking-wider">Interface noturna</p>
                            </div>
                         </div>
                         <button 
                           onClick={toggleTheme}
                           className={cn(
                             "w-14 h-7 rounded-full transition-all relative p-1.5",
                             theme === 'dark' ? "bg-amber" : "bg-white/10"
                           )}
                         >
                            <motion.div 
                              animate={{ x: theme === 'dark' ? 26 : 0 }}
                              className="w-4 h-4 rounded-full bg-white shadow-sm" 
                            />
                         </button>
                      </div>

                      <div className="p-8 bg-navy/40 border border-white/5 rounded-3xl space-y-8 shadow-xl relative overflow-hidden group/card">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-amber/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover/card:bg-amber/10 transition-colors" />
                         
                         <div className="flex items-center gap-5 relative">
                            <div className="w-14 h-14 rounded-2xl bg-amber/10 flex items-center justify-center text-amber shadow-inner border border-amber/20">
                               <RefreshCw className="w-7 h-7" />
                            </div>
                            <div>
                               <p className="font-display font-bold text-xl text-white tracking-tight">Personalização de IA (Gemini)</p>
                               <p className="text-[10px] text-pearl/40 font-bold uppercase tracking-widest pl-0.5">Potencialize seus devocionais</p>
                            </div>
                         </div>

                         <div className="space-y-6 relative">
                            <div className="space-y-4">
                               <p className="text-sm text-pearl/60 font-medium leading-relaxed">
                                 Para maior estabilidade e respostas mais rápidas, conecte sua própria chave do Google AI Studio. É gratuito e garante que você sempre tenha acesso à IA.
                               </p>
                               
                               <div className="flex items-center justify-between p-5 bg-navy/60 border border-white/5 rounded-2xl group transition-all hover:border-amber/20 shadow-inner">
                                 <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-amber/10 flex items-center justify-center text-amber">
                                       <RefreshCw className="w-6 h-6" />
                                    </div>
                                    <div>
                                       <p className="font-bold text-white tracking-tight">Linguagem Simplificada</p>
                                       <p className="text-[10px] text-pearl/40 font-bold uppercase tracking-wider">Respostas curtas, diretas e fáceis de entender.</p>
                                    </div>
                                 </div>
                                 <button 
                                   onClick={() => togglePreference("simplifyAI")}
                                   className={cn(
                                     "w-14 h-7 rounded-full transition-all relative p-1.5",
                                     preferences.simplifyAI ? "bg-amber" : "bg-white/10"
                                   )}
                                 >
                                    <motion.div 
                                      animate={{ x: preferences.simplifyAI ? 26 : 0 }}
                                      className="w-4 h-4 rounded-full bg-white shadow-sm" 
                                    />
                                 </button>
                               </div>
                               
                               <div className="flex flex-col gap-4">
                                  {/* Step 1 */}
                                  <div className="space-y-2">
                                     <p className="text-[10px] font-black text-amber/60 uppercase tracking-widest flex items-center gap-2">
                                       <span className="w-4 h-4 rounded-full bg-amber/20 flex items-center justify-center text-[8px]">1</span>
                                       Obter a Chave
                                     </p>
                                     <a 
                                       href="https://aistudio.google.com/app/apikey" 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       className="flex items-center justify-center gap-3 w-full bg-amber/10 hover:bg-amber/20 text-amber font-bold py-4 rounded-2xl border border-amber/20 transition-all group"
                                     >
                                        Passo 1: Gerar chave no Google AI Studio
                                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                     </a>
                                  </div>

                                  {/* Step 2 */}
                                  <div className="space-y-2">
                                     <p className="text-[10px] font-black text-amber/60 uppercase tracking-widest flex items-center gap-2">
                                       <span className="w-4 h-4 rounded-full bg-amber/20 flex items-center justify-center text-[8px]">2</span>
                                       Inserir e Salvar
                                     </p>
                                     <div className="flex items-center gap-2">
                                        <div className="relative flex-1 group/input">
                                           <input 
                                              type={showApiKey ? "text" : "password"}
                                              value={apiKeyInput}
                                              onChange={(e) => setApiKeyInput(e.target.value)}
                                              onBlur={(e) => handleManualSave(e.target.value)}
                                              placeholder="Cole sua chave (AIzaSy...)"
                                              className="w-full bg-navy/60 border border-white/10 rounded-2xl px-6 py-4 pr-12 outline-none focus:border-amber transition-all text-xs font-mono tracking-wider shadow-inner text-white group-hover/input:border-white/20"
                                           />
                                           <button 
                                             onClick={() => setShowApiKey(!showApiKey)}
                                             className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-pearl/30 hover:text-amber transition-colors"
                                           >
                                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                           </button>
                                        </div>
                                        <button 
                                          onClick={handlePasteAndSave}
                                          title="Colar da área de transferência e Salvar"
                                          className="bg-amber text-navy p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber/20 flex items-center gap-2 group"
                                        >
                                           <Clipboard className="w-5 h-5" />
                                           <span className="hidden sm:inline font-bold text-sm">Colar e Salvar</span>
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex items-start gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                               <Info className="w-5 h-5 text-amber/40 mt-0.5 shrink-0" />
                               <p className="text-[11px] text-pearl/40 leading-relaxed font-medium">
                                 Sua chave é armazenada apenas no seu dispositivo. Ela permite que você use os recursos de IA sem as filas do servidor gratuito.
                               </p>
                            </div>
                         </div>
                      </div>
                    </div>
                    {renderFooter()}
                  </div>
                </section>
              )}

              {activeTab === 'notif' && (
                <section className="glow-card space-y-8 p-8">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber/10 rounded-xl text-amber">
                        <Bell className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-display font-bold">Lembretes Gratuitos</h3>
                    </div>
                    
                    <div className="grid gap-4">
                      {[
                        { id: 'dailyDevotional', label: 'Devocional Diário', desc: 'Alertar para a leitura matinal' },
                        { id: 'prayerRequests', label: 'Intercessões', desc: 'Novos clamores da comunidade' },
                        { id: 'communityActivity', label: 'Interação Social', desc: 'Curtidas e comentários no seu mural' }
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-5 bg-navy/40 border border-white/5 rounded-2xl shadow-md">
                          <div className="space-y-1">
                            <p className="font-bold text-white text-sm">{item.label}</p>
                            <p className="text-[10px] text-pearl/30 font-bold uppercase tracking-wider">{item.desc}</p>
                          </div>
                          <button 
                            onClick={() => handleToggleSetting('notifications', item.id)}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative p-1",
                              formData.notifications[item.id as keyof typeof formData.notifications] ? "bg-amber" : "bg-white/10"
                            )}
                          >
                            <motion.div 
                              animate={{ x: formData.notifications[item.id as keyof typeof formData.notifications] ? 24 : 0 }}
                              className="w-4 h-4 rounded-full bg-white shadow-sm" 
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {renderFooter()}
                </section>
              )}

              {activeTab === 'privacy' && (
                <section className="glow-card space-y-8 p-8">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber/10 rounded-xl text-amber">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-display font-bold">Privacidade Espiritual</h3>
                    </div>
                    
                    <div className="grid gap-4">
                      {[
                        { id: 'showProfile', label: 'Perfil Visível', desc: 'Permitir que te encontrem no mural' },
                        { id: 'showStreak', label: 'Mostrar Ofensiva', desc: 'Exibir seus dias de constância' },
                        { id: 'showStruggles', label: 'Confissão Privada', desc: 'Seus relatos são visíveis apenas para você' }
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-5 bg-navy/40 border border-white/5 rounded-2xl shadow-md">
                          <div className="space-y-1">
                            <p className="font-bold text-white text-sm">{item.label}</p>
                            <p className="text-[10px] text-pearl/30 font-bold uppercase tracking-wider">{item.desc}</p>
                          </div>
                          <button 
                            onClick={() => handleToggleSetting('privacy', item.id)}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative p-1",
                              formData.privacy[item.id as keyof typeof formData.privacy] ? "bg-amber" : "bg-white/10"
                            )}
                          >
                            <motion.div 
                              animate={{ x: formData.privacy[item.id as keyof typeof formData.privacy] ? 24 : 0 }}
                              className="w-4 h-4 rounded-full bg-white shadow-sm" 
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {renderFooter()}
                </section>
              )}

              {activeTab === 'advanced' && (
                <section className="glow-card space-y-8 p-8">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-display font-bold">Ações Críticas</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-5">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
                               <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                               <p className="font-bold text-red-400 text-lg">Redefinição de Dados Locais</p>
                               <p className="text-[10px] text-pearl/40 font-bold uppercase tracking-wider">Limpeza completa de cache</p>
                            </div>
                         </div>
                         
                         <p className="text-xs text-pearl/50 leading-relaxed">
                           Se encontrar dificuldades com devocionais duplicados ou falhas de carregamento, resetar seus dados locais pode ajudar a forçar uma nova sincronização com o céu.
                         </p>

                         <button 
                           onClick={() => {
                             if(window.confirm("Atenção! Isso limpará todas as configurações locais salvas. O aplicativo irá recarregar. Deseja continuar?")){
                               localStorage.clear();
                               window.location.reload();
                             }
                           }}
                           className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold px-8 py-5 rounded-[2rem] transition-all border border-red-500/20 group"
                         >
                           <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> 
                           Limpar Tudo e Recarregar
                         </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="mt-20 text-center pb-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-12 bg-white/5" />
                <p className="text-[9px] text-pearl/20 uppercase tracking-[0.5em] font-black">SOLI DEO GLORIA</p>
                <div className="h-[1px] w-12 bg-white/5" />
              </div>
              <h2 className="text-5xl font-display font-black text-amber/20 tracking-tighter hover:text-amber/40 transition-colors pointer-events-none">
                MARANGONI
              </h2>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
