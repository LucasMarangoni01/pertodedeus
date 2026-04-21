import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { Zap, Award, Book, Heart, MessageSquare, Edit2, Share2, Settings } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

const levelInfo = {
  "Semente": { icon: "🌱", color: "text-green-400" },
  "Raiz": { icon: "🪵", color: "text-amber-700" },
  "Árvore": { icon: "🌳", color: "text-amber-600" },
  "Fruto": { icon: "🍎", color: "text-amber-500" },
  "Luz": { icon: "✨", color: "text-amber-400" },
};

const mockStats = [
  { subject: 'Oração', A: 85, fullMark: 100 },
  { subject: 'Leitura', A: 65, fullMark: 100 },
  { subject: 'Gratidão', A: 90, fullMark: 100 },
  { subject: 'Comunidade', A: 45, fullMark: 100 },
  { subject: 'Devocional', A: 75, fullMark: 100 },
];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const level = (user?.spiritualLevel || "Semente") as keyof typeof levelInfo;

  return (
    <div className="space-y-10">
      {/* Profile Info Header */}
      <section className="flex flex-col items-center text-center space-y-6">
        <div className="relative group">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-2 border-amber/20 relative z-10 shadow-2xl">
             <img 
               src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/400`} 
               alt={user?.displayName || "Profile"} 
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
          </div>
          <div className="absolute inset-0 bg-amber/20 blur-3xl rounded-full scale-110 -z-0 opacity-50 group-hover:opacity-80 transition-opacity" />
          <button className="absolute bottom-0 right-0 p-2 bg-amber text-navy rounded-xl z-20 shadow-lg hover:scale-110 transition-transform">
             <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">{user?.displayName}</h1>
          <p className="text-pearl/60 font-serif italic text-lg">{user?.bio || "Seguindo os passos do Mestre."}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
           <span className="px-4 py-1 rounded-full bg-amber/10 border border-amber/20 text-amber text-xs font-bold uppercase tracking-widest">
             {user?.denomination || "Cristão"}
           </span>
           <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-pearl/40 text-xs font-bold uppercase tracking-widest">
             {user?.yearsAsChristian} anos de fé
           </span>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Spiritual Maturity Card */}
        <section className="glow-card space-y-8">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-display font-bold">Maturidade Espiritual</h3>
             <Award className="text-amber w-6 h-6" />
          </div>
          
          <div className="flex flex-col items-center text-center space-y-4">
             <div className="text-6xl">{levelInfo[level]?.icon}</div>
             <div>
                <p className="text-2xl font-display font-bold text-amber">{level}</p>
                <p className="text-sm text-pearl/40">Sua jornada de consistência e fé.</p>
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between text-xs font-bold text-pearl/60 uppercase tracking-widest">
                <span>Progresso até {level === 'Luz' ? 'Eternidade' : 'Próximo Nível'}</span>
                <span>68%</span>
             </div>
             <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-amber w-[68%] shadow-[0_0_15px_#C9A84C]" />
             </div>
          </div>
        </section>

        {/* Radar Stats Chart */}
        <section className="glow-card space-y-6 min-h-[300px] flex flex-col items-center justify-center">
          <h3 className="text-xl font-display font-bold w-full mb-4">Equilíbrio Espiritual</h3>
          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockStats}>
                <PolarGrid stroke="#C9A84C20" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#F5F0E860', fontSize: 10 }} />
                <Radar
                  name="Equilíbrio"
                  dataKey="A"
                  stroke="#C9A84C"
                  fill="#C9A84C"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Streak & Achievements Highlights */}
        <section className="glow-card col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
           <div className="text-center space-y-1">
              <p className="text-amber text-3xl font-display font-bold">{user?.streak || 0}</p>
              <p className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest">Dias Seguidos</p>
           </div>
           <div className="text-center space-y-1">
              <p className="text-pearl text-3xl font-display font-bold">42</p>
              <p className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest">Capítulos Lidos</p>
           </div>
           <div className="text-center space-y-1">
              <p className="text-pearl text-3xl font-display font-bold">12</p>
              <p className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest">Orações Respondidas</p>
           </div>
           <div className="text-center space-y-1">
              <p className="text-pearl text-3xl font-display font-bold">7</p>
              <p className="text-[10px] text-pearl/40 uppercase font-bold tracking-widest">Devocionais Favoritos</p>
           </div>
        </section>
      </div>

      {/* Profile Actions */}
      <div className="flex gap-4 pt-6">
        <button className="flex-1 bg-white/5 border border-amber/10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-amber/10 hover:border-amber transition-all">
           <Share2 className="w-5 h-5" /> Compartilhar Perfil
        </button>
        <button 
          onClick={() => navigate("/settings")}
          className="flex-1 bg-white/5 border border-amber/10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-amber/10 hover:border-amber transition-all"
        >
           <Settings className="w-5 h-5" /> Configurações
        </button>
      </div>
    </div>
  );
}
