import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

const denominations = ["Católico", "Evangélico", "Batista", "Presbiteriano", "Pentecostal", "Sem denominação", "Outro"];
const bibleVersions = ["NVI", "ARA", "NVT", "NAA", "NTLH"];
const challengesList = ["Oração constante", "Leitura bíblica", "Fé em momentos difíceis", "Perdão", "Vícios", "Relacionamentos", "Propósito de vida"];

export default function Onboarding() {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    denomination: "Sem denominação",
    bibleVersion: "NVI",
    yearsAsChristian: 0,
    challenges: [] as string[],
  });

  if (!user) return <Navigate to="/login" replace />;
  if (user.spiritualLevel) return <Navigate to="/" replace />;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        photoURL: user.photoURL,
        spiritualLevel: "Semente",
        streak: 0,
        lastCheckIn: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      await refreshUserProfile();
      navigate("/");
    } catch (error) {
      console.error("Error creating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChallenge = (challenge: string) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.includes(challenge)
        ? prev.challenges.filter(c => c !== challenge)
        : [...prev.challenges, challenge]
    }));
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber/5 via-navy to-navy">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-bold">Bem-vindo(a)</h2>
                <p className="text-pearl/60">Como você prefere ser chamado(a) por Deus?</p>
              </div>
              <input 
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full bg-white/5 border border-amber/20 rounded-2xl px-6 py-4 text-pearl focus:outline-none focus:border-amber transition-colors"
                placeholder="Seu nome"
              />
              <button 
                onClick={handleNext}
                disabled={!formData.displayName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-amber text-navy font-bold py-4 rounded-2xl shadow-lg disabled:opacity-50"
              >
                Continuar <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button onClick={handleBack} className="text-pearl/40 flex items-center gap-2 hover:text-pearl transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-bold">Sua Jornada</h2>
                <p className="text-pearl/60">Qual é a sua denominação ou base cristã?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {denominations.map((d) => (
                  <button
                    key={d}
                    onClick={() => setFormData({ ...formData, denomination: d })}
                    className={cn(
                      "px-4 py-3 rounded-xl border text-sm transition-all animate-in fade-in zoom-in duration-300",
                      formData.denomination === d 
                        ? "bg-amber border-amber text-navy font-bold" 
                        : "bg-white/5 border-amber/10 text-pearl/60 hover:border-amber/40"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-pearl/60 text-sm">Há quanto tempo é cristão? ({formData.yearsAsChristian} anos)</p>
                <input 
                  type="range"
                  min="0"
                  max="50"
                  value={formData.yearsAsChristian}
                  onChange={(e) => setFormData({ ...formData, yearsAsChristian: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber"
                />
              </div>
              <button 
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 bg-amber text-navy font-bold py-4 rounded-2xl shadow-lg"
              >
                Continuar <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step-version"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button onClick={handleBack} className="text-pearl/40 flex items-center gap-2 hover:text-pearl transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-bold">Tradução Preferida</h2>
                <p className="text-pearl/60">Qual versão da Bíblia você prefere para seus estudos e devocionais?</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {bibleVersions.map((v) => (
                  <button
                    key={v}
                    onClick={() => setFormData({ ...formData, bibleVersion: v })}
                    className={cn(
                      "px-4 py-4 rounded-xl border text-sm transition-all",
                      formData.bibleVersion === v 
                        ? "bg-amber border-amber text-navy font-bold" 
                        : "bg-white/5 border-amber/10 text-pearl/60 hover:border-amber/40"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-amber/40 italic text-center">Isso pode ser alterado depois nas configurações.</p>
              <button 
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 bg-amber text-navy font-bold py-4 rounded-2xl shadow-lg"
              >
                Continuar <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button onClick={handleBack} className="text-pearl/40 flex items-center gap-2 hover:text-pearl transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-bold">Desafios</h2>
                <p className="text-pearl/60">Quais são seus maiores desafios espirituais hoje?</p>
              </div>
              <div className="space-y-3">
                {challengesList.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleChallenge(c)}
                    className={cn(
                      "w-full px-6 py-4 rounded-xl border text-left flex items-center justify-between transition-all",
                      formData.challenges.includes(c)
                        ? "bg-amber/10 border-amber text-amber font-medium"
                        : "bg-white/5 border-amber/10 text-pearl/60 hover:border-amber/40"
                    )}
                  >
                    {c}
                    {formData.challenges.includes(c) && <div className="w-2 h-2 bg-amber rounded-full shadow-[0_0_8px_#C9A84C]" />}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleSubmit}
                disabled={loading || formData.challenges.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-amber text-navy font-bold py-4 rounded-2xl shadow-lg disabled:opacity-50"
              >
                {loading ? "Criando Altar..." : "Começar Jornada"}
                {!loading && <ChevronRight className="w-5 h-5" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
