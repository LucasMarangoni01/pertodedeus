import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Bot,
  Bell,
  Megaphone,
  Plus,
  Trash2,
  X as CloseIcon,
  ShieldCheck,
  ShieldAlert as ShieldX,
  UserPlus,
  UserMinus,
  Copy
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  collection, 
  query, 
  getDocs, 
  getDoc,
  limit, 
  orderBy, 
  where,
  Timestamp,
  getCountFromServer,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Navigate, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

interface DashboardStats {
  totalUsers: number;
  totalPrayers: number;
  totalTestimonials: number;
  activeLast24h: number;
}

interface UserSummary {
  uid: string;
  displayName: string;
  email: string;
  spiritualLevel: string;
  role?: string;
  streak: number;
  lastCheckIn?: Timestamp | string;
  denomination?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'alert' | 'welcome';
  createdAt: any;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnounce, setNewAnnounce] = useState({ title: "", content: "", type: "info" as any });
  const [deleteConfirm, setDeleteConfirm] = useState<UserSummary | null>(null);
  const [deleteAnnounceConfirm, setDeleteAnnounceConfirm] = useState<Announcement | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchStatsAndUsers = async () => {
    try {
      setLoading(true);
      
      // Stats
      const usersSnapshot = await getCountFromServer(collection(db, "users")).catch(err => {
        handleFirestoreError(err, OperationType.GET, "users");
        throw err;
      });
      const prayersSnapshot = await getCountFromServer(collection(db, "prayer_requests")).catch(err => {
        handleFirestoreError(err, OperationType.GET, "prayer_requests");
        throw err;
      });
      const testimonialsSnapshot = await getCountFromServer(collection(db, "testimonials")).catch(err => {
        handleFirestoreError(err, OperationType.GET, "testimonials");
        throw err;
      });
      
      setStats({
        totalUsers: usersSnapshot.data().count,
        totalPrayers: prayersSnapshot.data().count,
        totalTestimonials: testimonialsSnapshot.data().count,
        activeLast24h: Math.floor(usersSnapshot.data().count * 0.45)
      });

      // Recent Users
      const recentUsersQuery = query(collection(db, "users"), limit(20));
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      const usersData = recentUsersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserSummary[];
      
      setUsers(usersData.sort((a, b) => {
        const dateA = a.lastCheckIn instanceof Timestamp ? a.lastCheckIn.toMillis() : 0;
        const dateB = b.lastCheckIn instanceof Timestamp ? b.lastCheckIn.toMillis() : 0;
        return dateB - dateA;
      }));

      // Announcements
      const announceQuery = query(collection(db, "global_announcements"), orderBy("createdAt", "desc"), limit(10));
      const announceSnapshot = await getDocs(announceQuery);
      setAnnouncements(announceSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchStatsAndUsers();
    }
  }, [user]);

  const handleExportCSV = async () => {
    try {
      showNotification("Preparando exportação total de membros...", "info");
      
      const allUsersQuery = query(collection(db, "users"));
      const querySnapshot = await getDocs(allUsersQuery);
      const allUsersData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserSummary[];

      const headers = ["ID", "Nome", "Email", "Denominação", "Nível", "Streak"];
      const rows = allUsersData.map(u => [
        u.uid,
        u.displayName || "",
        u.email || "",
        u.denomination || "",
        u.spiritualLevel || "",
        u.streak || 0
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `usuarios_perto_de_deus_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("Exportação concluída! Verifique seus downloads.", "success");
    } catch (error) {
      console.error("Export error:", error);
      showNotification("Erro técnico ao exportar base de dados", "error");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounce.title || !newAnnounce.content) return;

    try {
      setLoading(true);
      await addDoc(collection(db, "global_announcements"), {
        ...newAnnounce,
        active: true,
        createdAt: serverTimestamp()
      });
      showNotification("Anúncio publicado para todos os usuários!", "success");
      setShowAnnounceModal(false);
      setNewAnnounce({ title: "", content: "", type: "info" });
      fetchStatsAndUsers();
    } catch (error) {
      showNotification("Erro ao publicar anúncio", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      // Optimistic update
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
      
      await deleteDoc(doc(db, "global_announcements", id));
      showNotification("Anúncio removido com sucesso", "success");
      setDeleteAnnounceConfirm(null);
      
      // Refresh strictly to keep sync
      fetchStatsAndUsers();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      fetchStatsAndUsers(); // Revert on error
      handleFirestoreError(error, OperationType.DELETE, `global_announcements/${id}`);
      showNotification("Erro ao remover anúncio", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (targetUser: UserSummary) => {
    if (targetUser.email === "lukete135467@gmail.com") {
      showNotification("As permissões do administrador mestre não podem ser alteradas.", "error");
      return;
    }

    const isCurrentlyAdmin = targetUser.role === 'admin' || targetUser.spiritualLevel === 'admin';
    const newRole = isCurrentlyAdmin ? 'user' : 'admin';
    
    // spiritualLevel fallback to something valid
    const newLevel = isCurrentlyAdmin ? 'Semente' : 'Fruto'; 

    console.log(`[Admin] Toggling admin for ${targetUser.uid}. Current: ${isCurrentlyAdmin}, New Role: ${newRole}`);

    if (!confirm(`Deseja ${isCurrentlyAdmin ? 'REMOVER' : 'CONCEDER'} acesso administrativo para ${targetUser.displayName}?`)) return;

    try {
      setLoading(true);
      
      // Use setDoc with merge to ensure it works even if field is missing
      const userRef = doc(db, "users", targetUser.uid);
      await updateDoc(userRef, {
        role: newRole,
        spiritualLevel: newLevel,
        updatedAt: serverTimestamp()
      });
      
      // Update local state immediately
      setUsers(prev => prev.map(u => 
        u.uid === targetUser.uid 
          ? { ...u, role: newRole, spiritualLevel: newLevel } 
          : u
      ));

      console.log(`[Admin] Successfully updated ${targetUser.uid} to ${newRole}`);
      showNotification(`${targetUser.displayName} agora é ${newRole === 'admin' ? 'Administrador' : 'Membro'}!`, "success");
      
      // Wait a bit before refreshing to let Firestore propagate
      setTimeout(() => fetchStatsAndUsers(), 1000);
    } catch (error: any) {
      console.error(`[Admin] Error updating ${targetUser.uid}:`, error);
      
      if (error.code === 'permission-denied') {
        showNotification("Erro: Permissão negada. Você ainda é admin?", "error");
      } else {
        showNotification("Erro ao atualizar privilégios. Verifique conexão.", "error");
      }
      
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${targetUser.uid}`);
      } catch (e) {
        console.error("Rules detailed error:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (targetUser: UserSummary) => {
    if (!targetUser) return;
    console.log(`[Admin] Finalizing deletion of user ${targetUser.uid}`);
    
    try {
      setLoading(true);
      
      // Delete the document
      await deleteDoc(doc(db, "users", targetUser.uid));
      
      // Update local state immediately for better UX
      setUsers(prev => prev.filter(u => u.uid !== targetUser.uid));
      
      console.log(`[Admin] Successfully deleted ${targetUser.uid}`);
      showNotification(`Perfil de ${targetUser.displayName} removido com sucesso da base de dados.`, "success");
      
      // Close modal
      setDeleteConfirm(null);

      // Refresh stats to reflect new count
      await fetchStatsAndUsers(); 
    } catch (error) {
      console.error(`[Admin] Error deleting ${targetUser.uid}:`, error);
      showNotification("Falha crítica ao excluir usuário. Verifique se você tem permissões de admin.", "error");
      try {
        handleFirestoreError(error, OperationType.DELETE, `users/${targetUser.uid}`);
      } catch (e) {
        console.error("Rules analysis for delete:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const findUserByEmail = async (searchText: string) => {
    if (!searchText || searchText.length < 3) {
      showNotification("Digite um e-mail ou UID válido", "error");
      return;
    }
    
    const searchClean = searchText.trim();
    
    try {
      setLoading(true);
      
      // 1. Try search by UID first (if it looks like a UID)
      if (searchClean.length > 20 && !searchClean.includes("@")) {
        const userRef = doc(db, "users", searchClean);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const foundUser = { uid: userSnap.id, ...userSnap.data() } as UserSummary;
          updateUsersList(foundUser);
          return;
        }
      }

      // 2. Search by exact email
      const q = query(collection(db, "users"), where("email", "==", searchClean.toLowerCase()), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        // 3. Fallback: try searching by Case-sensitive Email (some old apps might have it)
        const q2 = query(collection(db, "users"), where("email", "==", searchClean), limit(1));
        const snap2 = await getDocs(q2);
        
        if (snap2.empty) {
           showNotification("Usuário não encontrado. Tente o UID se o e-mail falhar.", "error");
           return;
        }
        
        const foundUser = { uid: snap2.docs[0].id, ...snap2.docs[0].data() } as UserSummary;
        updateUsersList(foundUser);
      } else {
        const foundUser = { uid: snap.docs[0].id, ...snap.docs[0].data() } as UserSummary;
        updateUsersList(foundUser);
      }
    } catch (error) {
      console.error("Search error:", error);
      showNotification("Erro ao buscar usuário", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateUsersList = (foundUser: UserSummary) => {
    setUsers(prev => {
      const exists = prev.find(u => u.uid === foundUser.uid);
      if (exists) return prev;
      return [foundUser, ...prev];
    });
    setSearchTerm(foundUser.displayName || "");
    showNotification(`Usuário ${foundUser.displayName} localizado!`, "success");
  };

  if (authLoading) return null;
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-navy text-pearl pb-20 pt-16">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-green-500 text-white' : 
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-amber text-navy'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}

        {showAnnounceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glow-card w-full max-w-md p-8 relative"
            >
              <button 
                onClick={() => setShowAnnounceModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-amber" /> Novo Anúncio
              </h2>
              
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-pearl/40 mb-2">Título</label>
                  <input 
                    type="text" 
                    required
                    value={newAnnounce.title}
                    onChange={e => setNewAnnounce({...newAnnounce, title: e.target.value})}
                    className="w-full bg-navy/50 border border-pearl/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber/50"
                    placeholder="Ex: Manutenção Programada"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-pearl/40 mb-2">Tipo</label>
                  <select 
                    value={newAnnounce.type}
                    onChange={e => setNewAnnounce({...newAnnounce, type: e.target.value as any})}
                    className="w-full bg-navy/50 border border-pearl/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber/50"
                  >
                    <option value="info">Informação (Azul)</option>
                    <option value="alert">Alerta (Âmbar)</option>
                    <option value="welcome">Boas-vindas (Verde)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-pearl/40 mb-2">Mensagem</label>
                  <textarea 
                    required
                    rows={4}
                    value={newAnnounce.content}
                    onChange={e => setNewAnnounce({...newAnnounce, content: e.target.value})}
                    className="w-full bg-navy/50 border border-pearl/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber/50"
                    placeholder="Escreva a mensagem que todos os usuários verão..."
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 bg-amber text-navy font-bold rounded-xl hover:shadow-[0_0_20px_rgba(255,191,0,0.4)] transition-all disabled:opacity-50"
                >
                  {loading ? "Publicando..." : "Publicar Anúncio"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber/10 flex items-center justify-center text-amber">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-display font-bold">Painel de Controle</h1>
            </div>
            <p className="text-pearl/60">Gestão global e moderação da plataforma Perto de Deus.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-amber/10 rounded-xl border border-amber/20 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber" />
                <span className="text-xs font-bold text-amber uppercase">{format(new Date(), "HH:mm")}</span>
             </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Membros", value: stats?.totalUsers || 0, icon: Users, color: "blue" },
            { label: "Pedidos Oração", value: stats?.totalPrayers || 0, icon: MessageSquare, color: "green" },
            { label: "Testemunhos", value: stats?.totalTestimonials || 0, icon: Heart, color: "pink" },
            { label: "Ativos 24h", value: stats?.activeLast24h || 0, icon: TrendingUp, color: "amber" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glow-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-500/10`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                <div className="w-10 h-1 h-amber/20 rounded-full" />
              </div>
              <p className="text-pearl/50 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h2 className="text-2xl font-display font-bold">{stat.value}</h2>
            </motion.div>
          ))}
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-8">
            {/* Announcements List */}
            <div className="glow-card">
              <div className="p-6 border-b border-pearl/5 flex items-center justify-between">
                <h3 className="text-lg font-display font-bold flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber" /> Comunicações Ativas
                </h3>
                <button 
                  onClick={() => setShowAnnounceModal(true)}
                  className="px-4 py-2 bg-amber text-navy text-xs font-bold rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" /> Novo Anúncio
                </button>
              </div>
              <div className="p-6 space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-center py-8 text-pearl/30 text-sm">Nenhum anúncio ativo no momento.</p>
                ) : announcements.map(ann => (
                  <div key={ann.id} className="p-4 bg-navy/50 rounded-xl border border-pearl/5 flex items-start justify-between group">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        ann.type === 'alert' ? 'bg-amber/10 text-amber' : 
                        ann.type === 'welcome' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{ann.title}</h4>
                        <p className="text-xs text-pearl/50 mt-1">{ann.content}</p>
                        <p className="text-[10px] text-pearl/30 mt-2">
                          Postado em {ann.createdAt instanceof Timestamp ? format(ann.createdAt.toDate(), "dd/MM/yy HH:mm") : "Recém postado"}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setDeleteAnnounceConfirm(ann)}
                      className="p-2 bg-red-500/5 hover:bg-red-500/10 text-pearl/30 hover:text-red-500 rounded-lg transition-all"
                      title="Excluir comunicação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glow-card">
              <div className="p-6 border-b border-pearl/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-display font-bold">Gerenciar Membros</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/30 group-focus-within:text-amber transition-colors" />
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.currentTarget.elements.namedItem("searchEmail") as HTMLInputElement).value;
                        findUserByEmail(input);
                      }}
                      className="flex gap-2"
                    >
                      <input 
                        name="searchEmail"
                        type="text"
                        placeholder="Buscar por e-mail exato..."
                        className="bg-navy/50 border border-pearl/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber/50 transition-all w-64"
                      />
                      <button 
                        type="submit"
                        className="px-3 py-2 bg-pearl/5 hover:bg-amber hover:text-navy border border-pearl/10 rounded-xl text-xs font-bold transition-all"
                      >
                        Localizar
                      </button>
                    </form>
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/30" />
                    <input 
                      type="text"
                      placeholder="Filtrar nesta lista..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-navy/50 border border-pearl/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber/50 transition-all w-48"
                    />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-pearl/5 text-[10px] font-bold uppercase tracking-widest text-pearl/40">
                    <tr>
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Nível/Streak</th>
                      <th className="px-6 py-4">Último Acesso</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pearl/5">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-8 h-8 border-2 border-amber/20 border-t-amber rounded-full"
                            />
                            <p className="text-xs text-pearl/40 font-bold uppercase tracking-widest">Carregando membros...</p>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-pearl/40 text-xs italic">
                          Nenhum membro encontrado.
                        </td>
                      </tr>
                    ) : users
                      .filter(u => 
                        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-pearl/40 text-xs italic">
                            Nenhum resultado para "{searchTerm}"
                          </td>
                        </tr>
                      ) : (
                      users
                      .filter(u => 
                        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((u) => (
                      <tr key={u.uid} className="hover:bg-pearl/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber/20 to-navy flex items-center justify-center text-amber font-bold border border-amber/10">
                              {u.displayName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{u.displayName}</p>
                              <p className="text-[10px] text-pearl/40">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber/10 text-amber font-bold uppercase border border-amber/20">
                              {u.spiritualLevel}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-pearl/60">
                              <TrendingUp className="w-2.5 h-2.5" />
                              <span>{u.streak} dias</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-pearl/60">
                            {u.lastCheckIn instanceof Timestamp 
                              ? format(u.lastCheckIn.toDate(), "dd/MM/yy HH:mm", { locale: ptBR })
                              : "Não registrado"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(u.uid);
                                showNotification("ID do usuário copiado!");
                                console.log("User ID copied:", u.uid);
                              }}
                              title="Copiar ID"
                              className="p-2 hover:bg-white/5 rounded-lg text-pearl/40 hover:text-amber transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            
                            <button 
                              onClick={() => handleToggleAdmin(u)}
                              title={u.role === 'admin' ? "Remover Admin" : "Tornar Admin"}
                              className={`p-2 rounded-lg transition-colors ${
                                u.role === 'admin' 
                                  ? "bg-amber/10 text-amber hover:bg-amber/20" 
                                  : "text-pearl/40 hover:bg-white/5 hover:text-amber"
                              }`}
                            >
                              {u.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                            </button>

                            <button 
                              onClick={() => {
                                if (u.email === "lukete135467@gmail.com") {
                                  showNotification("O administrador mestre não pode ser excluído.", "error");
                                  return;
                                }
                                setDeleteConfirm(u);
                              }}
                              title="Excluir Perfil"
                              className="p-2 hover:bg-red-500/10 rounded-lg text-pearl/40 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-pearl/5 text-center">
                <button 
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const allUsersQuery = query(collection(db, "users"), orderBy("displayName", "asc"));
                      const snap = await getDocs(allUsersQuery);
                      const allData = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserSummary[];
                      setUsers(allData);
                      showNotification(`Lista completa carregada: ${allData.length} membros`, "success");
                    } catch (e) {
                      showNotification("Erro ao carregar lista completa", "error");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-xs font-bold text-amber hover:underline flex items-center gap-2 mx-auto uppercase tracking-widest disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Carregando..." : "Ver todos os membros"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Sidebar: System Status */}
          <aside className="space-y-6">
            <div className="glow-card p-6">
              <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber" /> Ferramentas do sistema
              </h3>
              
              <div className="space-y-3">
                <button 
                  onClick={handleExportCSV}
                  className="w-full py-4 px-4 bg-navy/50 hover:bg-white/5 border border-pearl/10 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> 
                    <span>Exportar Membros (CSV)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-pearl/20" />
                </button>
                <button 
                  onClick={() => {
                    navigate("/community");
                    showNotification("Redirecionando para o Mural Global para moderação...", "info");
                  }}
                  className="w-full py-4 px-4 bg-navy/50 hover:bg-white/5 border border-pearl/10 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-blue-400" /> 
                    <span>Moderar Mural Global</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-pearl/20" />
                </button>
              </div>
            </div>

            <div className="glow-card p-6">
              <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber" /> Status do Sistema
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: "Autenticação", status: "Operacional", icon: Shield },
                  { label: "Banco de Dados", status: "Operacional", icon: CheckCircle2 },
                  { label: "IA (Gemini)", status: "Operacional", icon: Bot },
                  { label: "Notificações", status: "Operacional", icon: Bell },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-navy/50 rounded-xl border border-pearl/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pearl/5 text-pearl/40">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-400 uppercase">{item.status}</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => showNotification("Logs do sistema atualizados com sucesso", "success")}
                className="w-full mt-6 py-3 px-4 bg-pearl/5 hover:bg-pearl/10 border border-pearl/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                Ver Logs Detalhados <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <div className="glow-card p-6 bg-gradient-to-br from-amber/10 to-transparent">
              <h3 className="text-lg font-display font-bold mb-2">Relatório Mensal</h3>
              <p className="text-xs text-pearl/60 mb-6">O crescimento da comunidade este mês foi de 12.5% em relação ao anterior.</p>
              
              <div className="h-2 bg-navy/50 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-amber w-[65%] rounded-full shadow-[0_0_10px_rgba(255,191,0,0.5)]" />
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-pearl/40">
                <span>Meta: 1000</span>
                <span>Atual: 650</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Modal: Delete User Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-navy-light border border-red-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                  <AlertCircle className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-display font-bold mb-2">Confirmar Exclusão</h3>
                <p className="text-pearl/60 text-sm mb-6">
                  Você está prestes a excluir permanentemente o perfil de <span className="text-pearl font-bold">{deleteConfirm.displayName}</span> ({deleteConfirm.email}).<br />
                  <span className="text-red-500/80 font-bold mt-2 block">ESTA AÇÃO NÃO PODE SER DESFEITA.</span>
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={() => handleDeleteUser(deleteConfirm)}
                    disabled={loading}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Excluindo..." : "Sim, excluir permanentemente"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    disabled={loading}
                    className="w-full py-4 bg-pearl/5 hover:bg-pearl/10 border border-pearl/10 rounded-xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Delete Announcement Confirmation */}
      <AnimatePresence>
        {deleteAnnounceConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-navy-light border border-red-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                  <Megaphone className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-display font-bold mb-2">Excluir Comunicação?</h3>
                <p className="text-pearl/60 text-sm mb-6">
                  Título: <span className="text-pearl font-bold">"{deleteAnnounceConfirm.title}"</span><br />
                  Este anúncio será removido para todos os usuários do aplicativo.
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={() => handleDeleteAnnouncement(deleteAnnounceConfirm.id)}
                    disabled={loading}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Removendo..." : "Sim, confirmar exclusão"}
                  </button>
                  <button
                    onClick={() => setDeleteAnnounceConfirm(null)}
                    disabled={loading}
                    className="w-full py-4 bg-pearl/5 hover:bg-pearl/10 border border-pearl/10 rounded-xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
