import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, MessageCircle, CheckCircle2, History, Timer, Info, Send, Heart, BookOpen, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PrayerStatus = "Em oração" | "Respondido" | "Arquivado";
type Tab = "requests" | "guide" | "history";

export default function Prayer() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [testimonyDraft, setTestimonyDraft] = useState("");

  // Form State
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    category: "Família",
    urgency: "Média" as "Baixa" | "Média" | "Alta",
    isPublic: false
  });

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "prayer_requests"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(docs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "prayer_requests"), {
        userId: user.uid,
        ...newRequest,
        status: "Em oração",
        intercessorCount: 0,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewRequest({ title: "", description: "", category: "Família", urgency: "Média", isPublic: false });
    } catch (error) {
      console.error("Error creating prayer request:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsAnswered = async () => {
    if (!answeringId || !testimonyDraft.trim()) return;
    
    try {
      await updateDoc(doc(db, "prayer_requests", answeringId), {
        status: "Respondido",
        testimony: testimonyDraft,
        updatedAt: serverTimestamp()
      });
      setAnsweringId(null);
      setTestimonyDraft("");
    } catch (error) {
      console.error("Error marking as answered:", error);
      alert("Erro ao salvar testemunho.");
    }
  };

  const handleDeleteRequest = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try {
      await deleteDoc(doc(db, "prayer_requests", confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error deleting prayer request:", error);
      alert("Erro ao excluir oração. Verifique sua conexão ou permissões.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-amber font-medium tracking-widest uppercase text-xs">Comunhão</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Oração</h1>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-amber/10 self-start md:self-auto">
          {(["requests", "guide", "history"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === tab ? "bg-amber text-navy shadow-lg" : "text-pearl/60 hover:text-pearl"
              )}
            >
              {tab === "requests" ? "Pedidos" : tab === "guide" ? "Guia ACTS" : "Testemunhos"}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === "requests" && (
          <motion.div 
            key="requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold">Pedidos Ativos</h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-amber/10 text-amber hover:bg-amber hover:text-navy px-4 py-2 rounded-xl transition-all font-bold"
              >
                <Plus className="w-5 h-5" /> Novo Pedido
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.filter(r => r.status === "Em oração").map((request) => (
                <div key={request.id} className="glow-card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                        request.urgency === "Alta" ? "bg-red-500/20 text-red-400" : "bg-amber/20 text-amber"
                      )}>
                        {request.category} • {request.urgency}
                      </span>
                      <span className="text-pearl/40 text-[10px]">
                        {request.createdAt?.toDate ? format(request.createdAt.toDate(), "dd MMM 'às' HH:mm", { locale: ptBR }) : "Enviando..."}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{request.title}</h3>
                    <p className="text-pearl/60 text-sm line-clamp-3 mb-6">{request.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-auto">
                    <button 
                      onClick={() => setAnsweringId(request.id)}
                      className="flex-1 bg-amber/10 text-amber hover:bg-amber hover:text-navy py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Marcar como Respondido
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(request.id)}
                      disabled={deletingId === request.id}
                      className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 className={cn("w-4 h-4", deletingId === request.id && "animate-pulse")} />
                    </button>
                  </div>
                </div>
              ))}

              {requests.filter(r => r.status === "Em oração").length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-pearl/20 space-y-4">
                  <MessageCircle className="w-16 h-16 opacity-20" />
                  <p className="font-display text-xl italic">"Buscai ao Senhor enquanto se pode achar"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "guide" && (
           <motion.div 
             key="guide"
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             className="glow-card p-12 text-center space-y-8 paper-texture border-amber/10 min-h-[400px] flex flex-col items-center justify-center"
           >
             <Timer className="w-16 h-16 text-amber animate-pulse" />
             <div className="max-w-md space-y-4">
               <h2 className="text-3xl font-display font-bold">Guia de Oração ACTS</h2>
               <p className="text-pearl/60 italic font-serif">
                 Um método estruturado para deepened sua vida de oração através de Adoração, Confissão, Gratidão e Súplica.
               </p>
               <button className="bg-amber text-navy font-bold px-8 py-3 rounded-2xl shadow-xl hover:scale-105 transition-transform">
                 Iniciar Experiência Guiada (25 min)
               </button>
             </div>
           </motion.div>
        )}

        {activeTab === "history" && (
           <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
             <h2 className="text-xl font-display font-bold">Mural de Graças</h2>
             <div className="space-y-6">
                {requests.filter(r => r.status === "Respondido").map((request) => (
                  <div key={request.id} className="glow-card border-l-4 border-l-amber relative group">
                    <button 
                      onClick={() => setConfirmDeleteId(request.id)}
                      disabled={deletingId === request.id}
                      className="absolute top-4 right-4 p-2 text-pearl/20 hover:text-red-400 transition-all opacity-100 md:opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Excluir"
                    >
                       <Trash2 className={cn("w-4 h-4", deletingId === request.id && "animate-pulse")} />
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-8 h-8 rounded-full bg-amber/20 flex items-center justify-center text-amber">
                          <Heart className="w-4 h-4" fill="currentColor" />
                       </div>
                       <div>
                         <h4 className="font-bold">{request.title}</h4>
                         <p className="text-[10px] text-pearl/40 uppercase">Respondido em {request.updatedAt?.toDate ? format(request.updatedAt.toDate(), "PPP", { locale: ptBR }) : ""}</p>
                       </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl italic font-serif text-amber/90 border border-amber/5">
                      "{request.testimony}"
                    </div>
                 </div>
               ))}
               
               {requests.filter(r => r.status === "Respondido").length === 0 && (
                 <div className="py-20 flex flex-col items-center justify-center text-pearl/20 space-y-4">
                    <History className="w-16 h-16 opacity-20" />
                    <p className="font-display text-xl italic">Ainda não há testemunhos registrados.</p>
                 </div>
               )}
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/90 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-navy border border-amber/20 w-full max-w-lg rounded-3xl p-8 space-y-6 shadow-[0_0_100px_rgba(201,168,76,0.1)]"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-display font-bold">Abrir Clamor</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-pearl/40 hover:text-pearl transition-colors">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-pearl/40 uppercase">Título do Pedido</label>
                <input 
                  required
                  value={newRequest.title}
                  onChange={e => setNewRequest({...newRequest, title: e.target.value})}
                  className="w-full bg-white/5 border border-amber/10 rounded-xl px-4 py-3 focus:border-amber transition-colors outline-none"
                  placeholder="Ex: Saúde da minha mãe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-pearl/40 uppercase">Categoria</label>
                  <select 
                    value={newRequest.category}
                    onChange={e => setNewRequest({...newRequest, category: e.target.value})}
                    className="w-full bg-navy border border-amber/10 rounded-xl px-4 py-3 focus:border-amber outline-none"
                  >
                    {["Família", "Saúde", "Trabalho", "Finanças", "Cura Emocional", "Intercessão", "Ministério", "Outros"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-pearl/40 uppercase">Urgência</label>
                  <select 
                    value={newRequest.urgency}
                    onChange={e => setNewRequest({...newRequest, urgency: e.target.value as any})}
                    className="w-full bg-navy border border-amber/10 rounded-xl px-4 py-3 focus:border-amber outline-none"
                  >
                    {["Baixa", "Média", "Alta"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-pearl/40 uppercase">Detalhes (Opcional)</label>
                <textarea 
                  value={newRequest.description}
                  onChange={e => setNewRequest({...newRequest, description: e.target.value})}
                  rows={4}
                  className="w-full bg-white/5 border border-amber/10 rounded-xl px-4 py-3 focus:border-amber outline-none resize-none"
                  placeholder="Conte um pouco mais sobre esse pedido..."
                />
              </div>

              <div className="flex items-center gap-3 bg-amber/5 p-4 rounded-xl border border-amber/10">
                <input 
                  type="checkbox" 
                  checked={newRequest.isPublic}
                  onChange={e => setNewRequest({...newRequest, isPublic: e.target.checked})}
                  className="w-5 h-5 accent-amber"
                />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Pedido Público</p>
                  <p className="text-[10px] text-pearl/40">Outras pessoas da comunidade poderão orar por você (anônimo).</p>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-amber text-navy font-bold py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Consagrar Pedido"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Answer Testimony Modal */}
      {answeringId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-navy/95 backdrop-blur-md">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-navy border border-amber/30 w-full max-w-md rounded-[2rem] p-8 space-y-6"
           >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center text-amber mx-auto mb-4">
                  <Heart className="w-8 h-8" fill="currentColor" />
                </div>
                <h3 className="text-2xl font-display font-bold">Testemunho de Vitória</h3>
                <p className="text-pearl/60 text-sm italic">Como Deus respondeu a este clamor?</p>
              </div>

              <textarea 
                value={testimonyDraft}
                onChange={e => setTestimonyDraft(e.target.value)}
                placeholder="Escreva aqui seu testemunho..."
                className="w-full bg-white/5 border border-amber/10 rounded-2xl p-4 font-serif text-lg focus:border-amber outline-none h-40 resize-none"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => { setAnsweringId(null); setTestimonyDraft(""); }}
                  className="flex-1 py-3 text-pearl/40 font-bold hover:text-pearl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  disabled={!testimonyDraft.trim()}
                  onClick={markAsAnswered}
                  className="flex-3 bg-amber text-navy font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  Publicar Graça
                </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-navy/95 backdrop-blur-md">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-navy border border-red-500/30 w-full max-w-sm rounded-[2rem] p-8 space-y-6 text-center"
           >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold">Remover Oração?</h3>
                <p className="text-pearl/60 text-sm">Esta ação não pode ser desfeita. Deseja realmente excluir este pedido?</p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  disabled={deletingId !== null}
                  onClick={handleDeleteRequest}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-xl transition-all"
                >
                  {deletingId ? "Excluindo..." : "Sim, Excluir permanentemente"}
                </button>
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full py-3 text-pearl/40 font-bold hover:text-pearl transition-colors"
                >
                  Manter no mural
                </button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}
