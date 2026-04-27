import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { 
  Zap, Award, Book, Heart, MessageSquare, Edit2, 
  Share2, Settings, Save, X, Camera, CheckCircle2, 
  AlertCircle, ChevronRight, MapPin, Calendar, BookOpen,
  Globe, HelpCircle, Trophy, Star, ArrowRight, MousePointer2
} from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";
import { getLevelInfo } from "../services/userService";

const BIBLE_VERSIONS = [
  { id: "ARA", name: "ARA - Almeida Revista e Atualizada" },
  { id: "NVIPT", name: "NVI - Nova Versão Internacional", alias: "NVI" },
  { id: "NTLH", name: "NTLH - Nova Tradução na Linguagem de Hoje" },
  { id: "NVT", name: "NVT - Nova Versão Transformadora" },
  { id: "NAA", name: "NAA - Nova Almeida Atualizada" },
  { id: "ACF", name: "ACF - Almeida Corrigida Fiel" },
  { id: "AA", name: "AA - Almeida Atualizada" }
];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // Edit Form State
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    denomination: "",
    yearsAsChristian: 0,
    bibleVersion: "NVI",
    isPublic: true,
  });

  // Sync form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        denomination: user.denomination || "",
        yearsAsChristian: user.yearsAsChristian || 0,
        bibleVersion: user.bibleVersion || "NVI",
        isPublic: user.isPublic ?? true,
      });
    }
  }, [user]);

  const xp = user?.experience || 0;
  const { currentLevel, nextLevel, progress } = getLevelInfo(xp);

  // Derive stats from real data
  const realRadarData = [
    { subject: 'Oração', A: Math.min(100, user?.ministerialBalance?.oracao || 10), fullMark: 100 },
    { subject: 'Palavra', A: Math.min(100, user?.ministerialBalance?.palavra || 10), fullMark: 100 },
    { subject: 'Caridade', A: Math.min(100, user?.ministerialBalance?.caridade || 10), fullMark: 100 },
    { subject: 'Jejum', A: Math.min(100, user?.ministerialBalance?.jejum || 10), fullMark: 100 },
    { subject: 'Louvor', A: Math.min(100, user?.ministerialBalance?.louvor || 10), fullMark: 100 },
  ];

  const dashboardStats = [
    { label: "Dias de Fé", val: user?.totalFaithDays || 0, icon: Zap, color: "text-amber" },
    { label: "Capítulos", val: user?.totalChaptersRead || 0, icon: BookOpen, color: "text-pearl/60" },
    { label: "Orações", val: user?.totalPrayers || 0, icon: Heart, color: "text-red-400/60" },
    { label: "Devocionais", val: user?.totalDevotionals || 0, icon: Book, color: "text-blue-400/60" }
  ];

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleShareProfile = async () => {
    const shareUrl = `${window.location.origin}/p/${user?.uid || 'share'}`;
    const shareText = `Confira o perfil de fé de ${user?.displayName || 'um discípulo'} no Perto de Deus!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Perto de Deus - Perfil",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        showNotification("Link de compartilhamento copiado!", "success");
      } catch (err) {
        showNotification("Erro ao copiar link.", "error");
      }
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      setIsEditing(false);
      showNotification("Perfil atualizado com sucesso!", "success");
    } catch (error) {
      console.error("[Profile] Error saving changes:", error);
      showNotification("Erro ao salvar alterações. Verifique sua conexão.", "error");
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const tutorialSteps = [
    {
      title: "Sua Jornada de Fé",
      description: "O Nível Espiritual é uma representação da sua constância e dedicação ao Reino. Cada ação sua aproxima você mais do Pai.",
      icon: <Trophy className="w-12 h-12 text-amber" />,
      color: "amber"
    },
    {
      title: "Como ganhar XP?",
      description: "Você ganha experiência (XP) realizando ações diárias:\n• Leitura Bíblica (10 XP)\n• Momentos de Oração (5 XP)\n• Devocional Completo (15 XP)",
      icon: <Zap className="w-12 h-12 text-amber" />,
      color: "amber"
    },
    {
      title: "O Segredo: Constância",
      description: "O Perto de Deus valoriza a disciplina. Acessar o app diariamente mantém sua chama acesa e multiplica seu progresso.",
      icon: <Star className="w-12 h-12 text-amber" />,
      color: "amber"
    },
    {
      title: "Radar Espiritual",
      description: "O gráfico de radar mostra quais áreas da sua fé estão fortes e quais precisam de mais atenção hoje.",
      icon: <BookOpen className="w-12 h-12 text-amber" />,
      color: "amber"
    },
    {
      title: "Pronto para Evoluir?",
      description: "Comece sua jornada hoje mesmo. O Senhor se agrada de um coração que O busca com dedicação.",
      icon: <Heart className="w-12 h-12 text-amber" />,
      color: "amber"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 pt-4">
      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTutorial(false)}
              className="absolute inset-0 bg-navy/90 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-navy-light border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="p-5 bg-amber/10 rounded-[2rem] shadow-inner">
                  {tutorialSteps[tutorialStep].icon}
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                    {tutorialSteps[tutorialStep].title}
                  </h2>
                  <p className="text-pearl/60 text-sm leading-relaxed whitespace-pre-line">
                    {tutorialSteps[tutorialStep].description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 py-4">
                  {tutorialSteps.map((_, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        i === tutorialStep ? "w-8 bg-amber" : "w-2 bg-white/10"
                      )}
                    />
                  ))}
                </div>
                
                <div className="flex gap-3 w-full">
                  {tutorialStep > 0 && (
                    <button
                      onClick={() => setTutorialStep(prev => prev - 1)}
                      className="flex-1 py-4 rounded-2xl bg-white/5 text-pearl/40 font-bold border border-white/5 hover:bg-white/10 transition-all"
                    >
                      Voltar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (tutorialStep < tutorialSteps.length - 1) {
                        setTutorialStep(prev => prev + 1);
                      } else {
                        setShowTutorial(false);
                        setTutorialStep(0);
                      }
                    }}
                    className="flex-[2] py-4 rounded-2xl bg-amber text-navy font-bold shadow-lg shadow-amber/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? "Começar Agora" : "Continuar"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Dynamic Notification */}
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

      {/* Profile Header section */}
      <section className="flex flex-col items-center text-center space-y-8 relative">
        <div className="relative group">
          <motion.div 
            layoutId="profile-border"
            className="w-32 h-32 md:w-44 md:h-44 rounded-[3rem] overflow-hidden border-2 border-amber/20 p-2 bg-navy relative z-10 shadow-2xl"
          >
             <img 
               src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
               alt={user?.displayName || "Profile"} 
               className="w-full h-full object-cover rounded-[2.4rem] bg-navy-light"
               referrerPolicy="no-referrer"
             />
             {isEditing && (
               <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-navy/40 transition-all">
                 <Camera className="text-white w-8 h-8" />
               </div>
             )}
          </motion.div>
          <div className="absolute inset-0 bg-amber/10 blur-3xl rounded-full scale-125 -z-0 opacity-40 group-hover:opacity-60 transition-opacity" />
          
          <button 
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            className={cn(
              "absolute -bottom-2 -right-2 p-3 rounded-2xl z-20 shadow-xl transition-all scale-100 hover:scale-110 active:scale-95 group",
              isEditing ? "bg-green-500 text-white shadow-green-500/20" : "bg-amber text-navy shadow-amber/20"
            )}
          >
             {isSaving ? (
               <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
             ) : isEditing ? (
               <Save className="w-5 h-5" />
             ) : (
               <Edit2 className="w-5 h-5" />
             )}
          </button>
        </div>

        <div className="space-y-4 w-full max-w-xl">
          {isEditing ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
              <input 
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                placeholder="Seu Nome de Fé"
                className="w-full bg-navy border border-pearl/10 rounded-2xl px-6 py-4 text-center text-2xl font-display font-bold focus:outline-none focus:border-amber/50 transition-all shadow-inner"
              />
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Sua bio (ex: Seguindo os passos do Mestre...)"
                rows={2}
                className="w-full bg-navy border border-pearl/10 rounded-2xl px-6 py-4 text-center text-pearl/60 font-serif italic text-lg focus:outline-none focus:border-amber/50 transition-all resize-none shadow-inner"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-white">{user?.displayName || "Discípulo"}</h1>
              <p className="text-pearl/50 font-serif italic text-lg line-clamp-2 px-4 max-w-md mx-auto">{user?.bio || "Seguindo os passos do Mestre."}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4">
                 <div className="flex-1 flex items-center gap-3 bg-navy border border-pearl/10 rounded-2xl px-4 py-3">
                   <MapPin className="w-4 h-4 text-amber/60" />
                   <input 
                    type="text"
                    value={formData.denomination}
                    onChange={(e) => setFormData({...formData, denomination: e.target.value})}
                    placeholder="Sua Igreja"
                    className="bg-transparent border-none w-full text-sm font-bold focus:outline-none"
                  />
                 </div>
                 <div className="flex-1 flex items-center gap-3 bg-navy border border-pearl/10 rounded-2xl px-4 py-3">
                   <Calendar className="w-4 h-4 text-amber/60" />
                   <input 
                    type="number"
                    value={formData.yearsAsChristian}
                    onChange={(e) => setFormData({...formData, yearsAsChristian: parseInt(e.target.value) || 0})}
                    placeholder="Anos de caminhada"
                    className="bg-transparent border-none w-full text-sm font-bold focus:outline-none"
                  />
                 </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber/5 border border-amber/10 text-amber text-xs font-bold uppercase tracking-wider">
                  <MapPin className="w-3 h-3" />
                  {user?.denomination || "Membro da Igreja"}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-pearl/40 text-xs font-bold uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  {user?.yearsAsChristian || 0} anos de caminhada
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-4">
        
        {/* Spiritual Maturity Card - Column 4 */}
        <section className="md:col-span-4 glow-card flex flex-col items-center text-center space-y-8 p-8 self-start group transition-all hover:border-amber/20">
           <div className="flex items-center justify-between w-full">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-pearl/40">Nível Espiritual</h3>
              <button 
                onClick={() => {
                  setTutorialStep(0);
                  setShowTutorial(true);
                }}
                className="p-2 bg-white/5 hover:bg-amber/10 rounded-xl text-pearl/40 hover:text-amber transition-all group/btn flex items-center gap-2"
                title="Como evoluir?"
              >
                <span className="text-[9px] font-bold hidden group-hover/btn:block animate-in fade-in slide-in-from-right-2">COMO EVOLUIR?</span>
                <HelpCircle className="w-5 h-5" />
              </button>
           </div>
           
           <div className="relative">
              <div className="text-7xl mb-4 drop-shadow-[0_0_15px_rgba(201,168,76,0.1)] flex items-center justify-center">
                {currentLevel?.title === "Semente" && "🌱"}
                {currentLevel?.title === "Broto" && "🌿"}
                {currentLevel?.title === "Raiz" && "🪵"}
                {currentLevel?.title === "Tronco" && "🪵"}
                {currentLevel?.title === "Árvore" && "🌳"}
                {currentLevel?.title === "Fruto" && "🍎"}
                {currentLevel?.title === "Multiplicação" && "🍇"}
                {currentLevel?.title === "Discípulo" && "✨"}
                {currentLevel?.title === "Mestre" && "👑"}
              </div>
              <div className="absolute -inset-6 bg-amber/5 blur-3xl rounded-full -z-10 animate-pulse" />
           </div>

           <div className="space-y-1">
              <p className="text-2xl font-display font-bold text-amber">{currentLevel.title}</p>
              <p className="text-[10px] text-pearl/30 uppercase tracking-[0.1em]">XP Total: {xp}</p>
           </div>

           <div className="w-full space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between text-[9px] font-bold text-pearl/40 uppercase tracking-widest">
                 <span>Rumo ao nível {nextLevel?.title || "Máximo"}</span>
                 <span>{Math.round(progress)}%</span>
              </div>
              <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className="h-full bg-gradient-to-r from-amber/40 to-amber rounded-full shadow-[0_0_12px_rgba(201,168,76,0.2)]" 
                 />
              </div>
           </div>
        </section>

        {/* Dashboard/Stats - Column 8 */}
        <div className="md:col-span-8 space-y-8">
          
          {/* Detailed Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {dashboardStats.map((stat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.03)" }}
                className="bg-navy-light/50 border border-white/5 rounded-2xl p-5 text-center flex flex-col items-center gap-2 group transition-all"
              >
                  <stat.icon className={cn("w-5 h-5 mb-1 group-hover:scale-110 transition-transform", stat.color)} />
                  <p className="text-2xl font-display font-bold text-white leading-none">{stat.val}</p>
                  <p className="text-[9px] text-pearl/40 uppercase font-bold tracking-[0.1em]">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Balance/Radar Chart Card */}
          <section className="glow-card overflow-hidden">
            <div className="flex items-center justify-between mb-8 px-2">
               <h3 className="text-lg font-display font-bold">Equilíbrio Ministerial</h3>
               <div className="flex gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber shadow-[0_0_8px_#C9A84C]" />
                 <div className="w-1.5 h-1.5 rounded-full bg-amber/20" />
               </div>
            </div>
            
            <div className="w-full h-64 md:h-80 -mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={realRadarData}>
                  <PolarGrid stroke="#C9A84C10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#F5F0E840', fontSize: 10, fontWeight: 600 }} />
                  <Radar
                    name="Equilíbrio"
                    dataKey="A"
                    stroke="#C9A84C"
                    fill="#C9A84C"
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Preferences / Bible Version */}
          <section className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-8">
             <div className="flex items-center gap-3">
               <div className="p-2.5 bg-pearl/5 rounded-xl text-pearl/40">
                 <Settings className="w-5 h-5" />
               </div>
               <h3 className="text-lg font-display font-bold">Preferências</h3>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-[0.2em] block">Bíblia Padrão</label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        {BIBLE_VERSIONS.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              console.log("[Profile] Selecting bible:", v.id);
                              setFormData(prev => ({ ...prev, bibleVersion: v.id }));
                            }}
                            className={cn(
                              "px-3 py-3 rounded-xl border text-[10px] font-bold transition-all text-center",
                              formData.bibleVersion === v.id || (v.alias && formData.bibleVersion === v.alias)
                                ? "bg-amber border-amber text-navy shadow-lg" 
                                : "bg-navy border-white/5 text-pearl/40 hover:bg-white/10"
                            )}
                          >
                            <span className="text-xs font-bold">{v.alias || v.id}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-5 bg-navy/40 border border-white/5 rounded-2xl group hover:border-amber/20 transition-all">
                        <div className="flex items-center gap-3">
                          <Book className="w-4 h-4 text-amber/40" />
                          <span className="text-sm font-medium">{BIBLE_VERSIONS.find(v => v.id === (user?.bibleVersion || "NVI") || (v.alias && v.alias === user?.bibleVersion))?.name || "Nova Versão Internacional"}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-pearl/10 group-hover:text-amber/50 transition-colors" />
                      </div>
                    )}
                  </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-[0.2em] block">Visibilidade</label>
                   <button 
                    type="button"
                    onClick={async () => {
                      const newIsPublic = !formData.isPublic;
                      setFormData(prev => ({ ...prev, isPublic: newIsPublic }));
                      
                      // If not in editing mode, save immediately
                      if (!isEditing && user?.uid) {
                        try {
                          const userRef = doc(db, "users", user.uid);
                          await updateDoc(userRef, { isPublic: newIsPublic });
                          showNotification(`Perfil agora está ${newIsPublic ? 'público' : 'privado'}`, "success");
                        } catch (e) {
                          showNotification("Erro ao atualizar visibilidade", "error");
                        }
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-5 border rounded-2xl transition-all shadow-md group hover:border-amber/40 cursor-pointer",
                      (isEditing ? formData.isPublic : user?.isPublic) ? "bg-amber/5 border-amber/20" : "bg-white/5 border-white/5"
                    )}
                   >
                      <div className="flex items-center gap-3">
                        <Globe className={cn("w-4 h-4", (isEditing ? formData.isPublic : user?.isPublic) ? "text-amber/60" : "text-pearl/20")} />
                        <span className="text-sm font-medium">Perfil Público</span>
                      </div>
                      <div className={cn(
                        "w-10 h-5 rounded-full relative transition-all duration-300",
                        (isEditing ? formData.isPublic : user?.isPublic) ? "bg-amber" : "bg-white/10"
                      )}>
                         <motion.div 
                           animate={{ x: (isEditing ? formData.isPublic : user?.isPublic) ? 22 : 2 }}
                           className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" 
                         />
                      </div>
                   </button>
                </div>
             </div>
          </section>
        </div>
      </div>

      {/* Footer Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 px-4 mt-8"
      >
        <button 
          onClick={handleShareProfile}
          className="flex-1 group bg-white/5 border border-white/5 py-5 rounded-[2.5rem] font-bold flex items-center justify-center gap-3 hover:bg-navy-light hover:border-amber/30 transition-all"
        >
           <Share2 className="w-5 h-5 text-pearl/40 group-hover:text-amber transition-colors" /> 
           <span className="group-hover:text-amber transition-colors">Compartilhar Perfil</span>
        </button>
        
        {isEditing ? (
          <button 
            disabled={isSaving}
            onClick={() => {
              setIsEditing(false);
              // Reset form
              if (user) {
                setFormData({
                  displayName: user.displayName || "",
                  bio: user.bio || "",
                  denomination: user.denomination || "",
                  yearsAsChristian: user.yearsAsChristian || 0,
                  bibleVersion: user.bibleVersion || "NVI",
                  isPublic: user.isPublic ?? true,
                });
              }
            }}
            className="flex-1 bg-red-500/10 border border-red-500/20 py-5 rounded-[2.5rem] font-bold text-red-500/80 flex items-center justify-center gap-3 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
             <X className="w-5 h-5" /> Cancelar
          </button>
        ) : (
          <button 
            onClick={() => navigate("/settings")}
            className="flex-1 group bg-white/5 border border-white/5 py-5 rounded-[2.5rem] font-bold flex items-center justify-center gap-3 hover:bg-navy-light hover:border-amber/30 transition-all"
          >
             <Settings className="w-5 h-5 text-pearl/40 group-hover:text-amber transition-colors" /> 
             <span className="group-hover:text-amber transition-colors">Configurações Avançadas</span>
          </button>
        )}
      </motion.div>
    </div>
  );
}
