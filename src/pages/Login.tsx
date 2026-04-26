import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Heart, Chrome, Mail, Lock, UserPlus, LogIn, ChevronLeft, Eye, EyeOff, AlertCircle } from "lucide-react";

type AuthMode = 'initial' | 'email-login' | 'email-register';

export default function Login() {
  const { 
    user, 
    signInWithGoogle, 
    signInWithEmail,
    registerWithEmail,
    loading: authLoading, 
    isGuest, 
    enterGuestMode 
  } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('initial');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  if (user && !user.spiritualLevel) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleGuestEnter = () => {
    enterGuestMode();
    navigate("/");
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === "auth/popup-blocked") {
        setError("O popup foi bloqueado pelo seu navegador.");
      } else {
        setError("Erro ao entrar: " + (error.message || "Tente novamente."));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoggingIn(true);
    setError(null);
    try {
      if (mode === 'email-login') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (error: any) {
      console.error("Email auth failed:", error);
      let msg = "Erro na autenticação. Verifique os dados.";
      if (error.code === 'auth/wrong-password') msg = "Senha incorreta.";
      if (error.code === 'auth/user-not-found') msg = "E-mail não cadastrado.";
      if (error.code === 'auth/email-already-in-use') msg = "E-mail já está em uso.";
      if (error.code === 'auth/weak-password') msg = "Senha muito fraca (mínimo 6 caracteres).";
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido ou mal formatado.";
      if (error.code === 'auth/operation-not-allowed') msg = "O login por e-mail ainda não foi ativado no console do Firebase.";
      setError(msg);
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
        className="z-10 max-w-md w-full space-y-8"
      >
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 bg-amber rounded-[1.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(201,168,76,0.3)]"
          >
            <Heart className="text-navy w-10 h-10" fill="currentColor" />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold tracking-tight text-amber glow-text">
              Perto de Deus
            </h1>
            <p className="text-pearl/60 font-serif text-base leading-relaxed italic">
              {mode === 'email-register' ? "Comece sua jornada espiritual" : "\"Permanecerei em vós, e vós em mim.\""}
            </p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-amber/80 font-bold text-xl md:text-2xl mt-4 tracking-tighter uppercase"
            >
              Desenvolvido por Lucas Marangoni
            </motion.p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'initial' ? (
            <motion.div 
              key="initial"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button 
                onClick={handleGoogleLogin}
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
                onClick={() => setMode('email-login')}
                className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-pearl font-bold py-4 px-6 rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98] hover:bg-white/10"
              >
                <Mail className="w-5 h-5 text-amber" />
                Usar E-mail e Senha
              </button>

              <button 
                onClick={handleGuestEnter}
                disabled={isLoggingIn}
                className="w-full py-4 text-pearl/40 font-bold hover:text-amber transition-colors text-sm uppercase tracking-widest"
              >
                Entrar como Visitante
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              onSubmit={handleEmailAuth}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 text-left"
            >
              <div className="flex items-center gap-2 mb-4">
                <button 
                  type="button"
                  onClick={() => { setMode('initial'); setError(null); }}
                  className="p-2 hover:bg-white/5 rounded-full text-pearl/60"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-pearl/40">
                  {mode === 'email-login' ? "Entrar com E-mail" : "Criar nova conta"}
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pearl/30 group-focus-within:text-amber transition-colors" />
                  <input 
                    type="email"
                    required
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-navy/50 border border-pearl/10 rounded-2xl py-4 pl-12 pr-4 text-pearl focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pearl/30 group-focus-within:text-amber transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Sua senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-navy/50 border border-pearl/10 rounded-2xl py-4 pl-12 pr-12 text-pearl focus:outline-none focus:border-amber/50 transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-pearl/30 hover:text-pearl transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 bg-amber text-navy font-bold py-4 px-6 rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 mt-4"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                ) : (
                  mode === 'email-login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />
                )}
                {isLoggingIn ? "Processando..." : (mode === 'email-login' ? "Entrar" : "Criar Conta")}
              </button>

              <button 
                type="button"
                onClick={() => {
                  setMode(mode === 'email-login' ? 'email-register' : 'email-login');
                  setError(null);
                }}
                className="w-full text-center text-xs text-pearl/40 font-bold hover:text-amber transition-colors mt-2"
              >
                {mode === 'email-login' ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre aqui"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        
        <p className="text-pearl/40 text-[10px] uppercase tracking-widest">
          Ao participar, você aceita nossos <br />
          <span className="underline cursor-pointer hover:text-amber transition-colors">Termos</span> e <span className="underline cursor-pointer hover:text-amber transition-colors">Privacidade</span>.
        </p>
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
