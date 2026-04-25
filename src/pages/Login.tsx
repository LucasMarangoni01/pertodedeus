import { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Heart, Chrome } from "lucide-react";

export default function Login() {
  const { user, signInWithGoogle, loading: authLoading, isGuest, enterGuestMode } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If already logged in or in guest mode, redirect
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber/20 border-t-amber rounded-full animate-spin" />
      </div>
    );
  }

  if (isGuest || (user && user.spiritualLevel)) {
    return <Navigate to="/" replace />;
  }

  const handleGuestEnter = () => {
    enterGuestMode();
    navigate("/");
  };

  if (user && !user.spiritualLevel) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === "auth/popup-blocked") {
        alert("O popup foi bloqueado pelo seu navegador. Por favor, permita popups para este site.");
      } else if (error.code === "auth/cancelled-popup-request") {
        // Just user closing it, no need to alert
      } else {
        alert("Erro ao entrar: " + (error.message || "Tente novamente."));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-grape/10 blur-[100px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 max-w-md w-full space-y-12"
      >
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 bg-amber rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(201,168,76,0.3)]"
          >
            <Heart className="text-navy w-12 h-12" fill="currentColor" />
          </motion.div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-display font-bold tracking-tight text-amber glow-text">
              Perto de Deus
            </h1>
            <p className="text-pearl/60 font-serif text-lg leading-relaxed italic">
              "Permanecerei em vós, e vós em mim."
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-navy font-bold py-4 px-6 rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              ) : (
                <Chrome className="w-6 h-6" />
              )}
              {isLoggingIn ? "Autenticando..." : "Entrar com Google"}
            </button>

            <button 
              onClick={handleGuestEnter}
              disabled={isLoggingIn}
              className="w-full py-4 text-pearl/40 font-bold hover:text-amber transition-colors text-sm uppercase tracking-widest"
            >
              Entrar como Visitante
            </button>
          </div>
          
          <p className="text-pearl/40 text-sm">
            Ao entrar, você concorda com nossos <br />
            <span className="underline cursor-pointer hover:text-amber transition-colors">Termos de Uso</span> e <span className="underline cursor-pointer hover:text-amber transition-colors">Privacidade</span>.
          </p>
        </div>
      </motion.div>
      
      {/* Floating Particles Decoration */}
      {[...Array(6)].map((_, i) => (
        <motion.div
           key={i}
           className="absolute w-1 h-1 bg-amber/20 rounded-full"
           animate={{
              y: [0, -100, 0],
              opacity: [0, 0.4, 0],
              x: [0, (i % 2 === 0 ? 50 : -50), 0]
           }}
           transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2
           }}
           style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`
           }}
        />
      ))}
      <footer className="absolute bottom-6 left-0 right-0 z-10">
        <p className="text-pearl/20 text-[10px] font-medium tracking-wide">
          © {new Date().getFullYear()} Perto de Deus • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
