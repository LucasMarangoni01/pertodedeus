import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Trash2, 
  Edit2, 
  X,
  CheckCircle2,
  Circle,
  Bell,
  Sparkles,
  Search,
  LayoutGrid,
  List
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO,
  isToday,
  startOfToday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  deleteDoc,
  where,
  Timestamp
} from "firebase/firestore";
import { cn } from "../lib/utils";

const categories = ["Oração", "Compromisso", "Evento", "Jejum", "Ministério"] as const;
type Category = typeof categories[number];

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  date: string; // YYYY-MM-DD
  category: Category;
  isDone: boolean;
  createdAt: Timestamp;
}

export default function Agenda() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<"month" | "day">("month");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    time: format(new Date(), "HH:mm"),
    category: "Compromisso" as Category
  });

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "users", user.uid, "calendar_events"),
      orderBy("startTime", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as CalendarEvent));
      setEvents(docs);
    });

    return () => unsubscribe();
  }, [user]);

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedDayEvents = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return events.filter(e => e.date === dateStr);
  }, [events, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const [hours, minutes] = formData.time.split(":").map(Number);
      const eventTime = new Date(selectedDate);
      eventTime.setHours(hours, minutes, 0, 0);

      const eventData = {
        title: formData.title,
        description: formData.description,
        startTime: Timestamp.fromDate(eventTime),
        date: format(selectedDate, "yyyy-MM-dd"),
        category: formData.category,
        isDone: false,
        updatedAt: serverTimestamp()
      };

      if (editingEvent) {
        await updateDoc(doc(db, "users", user.uid, "calendar_events", editingEvent.id), eventData);
      } else {
        await addDoc(collection(db, "users", user.uid, "calendar_events"), {
          ...eventData,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      time: format(new Date(), "HH:mm"),
      category: "Compromisso"
    });
  };

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      time: format(event.startTime.toDate(), "HH:mm"),
      category: event.category
    });
    setIsModalOpen(true);
  };

  const toggleDone = async (event: CalendarEvent) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "calendar_events", event.id), {
        isDone: !event.isDone
      });
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user || !confirm("Deseja remover este compromisso?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "calendar_events", id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const currentMonthLabel = format(currentMonth, "MMMM yyyy", { locale: ptBR });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber font-bold text-[10px] uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" /> Organização e Paz
          </div>
          <h1 className="text-4xl font-display font-bold">Minha Agenda</h1>
          <p className="text-pearl/40 font-serif italic">"Para tudo há um tempo determinado..." (Eclesiastes 3:1)</p>
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setView("month")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              view === "month" ? "bg-amber text-navy shadow-lg shadow-amber/20" : "text-pearl/40 hover:text-pearl"
            )}
          >
            <LayoutGrid className="w-4 h-4" /> Mês
          </button>
          <button 
            onClick={() => setView("day")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              view === "day" ? "bg-amber text-navy shadow-lg shadow-amber/20" : "text-pearl/40 hover:text-pearl"
            )}
          >
            <List className="w-4 h-4" /> Dia
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Calendar Grid */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 md:p-10 space-y-8 overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold capitalize">{currentMonthLabel}</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber hover:bg-amber/10 rounded-xl transition-all"
                >
                  Hoje
                </button>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-px rounded-3xl overflow-hidden bg-white/5 border border-white/5">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                <div key={day} className="py-4 text-center text-[10px] uppercase font-bold tracking-widest text-pearl/30 bg-navy/40">
                  {day}
                </div>
              ))}
              {daysInMonth.map((day, idx) => {
                const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[100px] md:min-h-[120px] p-2 flex flex-col gap-1 transition-all relative group",
                      isCurrentMonth ? "bg-navy/40" : "bg-navy/20 opacity-30",
                      isSelected ? "ring-2 ring-inset ring-amber z-10" : "hover:bg-white/5"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                      isToday(day) ? "bg-amber text-navy font-bold" : "text-pearl/60 group-hover:text-pearl",
                      isSelected && !isToday(day) && "bg-white/10 text-amber"
                    )}>
                      {format(day, "d")}
                    </span>

                    <div className="flex flex-col gap-1 mt-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div 
                          key={event.id}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-lg truncate whitespace-nowrap",
                            event.isDone ? "bg-pearl/5 text-pearl/30 line-through" : 
                            event.category === "Oração" ? "bg-sky-500/10 text-sky-400" :
                            event.category === "Jejum" ? "bg-amber-500/10 text-amber-400" :
                            "bg-grape/10 text-grape"
                          )}
                        >
                          {format(event.startTime.toDate(), "HH:mm")} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-pearl/30 pl-2">
                          + {dayEvents.length - 3} mais
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Day View / Events List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-8 flex flex-col h-full min-h-[600px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-bold">
                    {format(selectedDate, "eeee", { locale: ptBR })}
                  </h3>
                  <p className="text-sm text-pearl/40">
                    {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-12 h-12 bg-amber text-navy rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-amber/20"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <AnimatePresence mode="popLayout">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((event) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      key={event.id}
                      className={cn(
                        "group p-5 rounded-3xl border border-white/5 transition-all flex flex-col gap-3",
                        event.isDone ? "opacity-50" : "bg-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <button 
                            onClick={() => toggleDone(event)}
                            className={cn(
                              "mt-1 transition-all",
                              event.isDone ? "text-green-400" : "text-pearl/20 hover:text-amber"
                            )}
                          >
                            {event.isDone ? <CheckCircle2 className="w-5 h-5 fill-current/20" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <div className="space-y-1 flex-1">
                            <h4 className={cn(
                              "font-bold text-lg",
                              event.isDone && "line-through text-pearl/40"
                            )}>{event.title}</h4>
                            <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-pearl/40">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {format(event.startTime.toDate(), "HH:mm")}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full border",
                                event.category === "Oração" ? "border-sky-500/20 text-sky-400" :
                                event.category === "Jejum" ? "border-amber-500/20 text-amber-400" :
                                "border-grape/20 text-grape"
                              )}>
                                {event.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => openEdit(event)}
                            className="p-2 text-pearl/20 hover:text-amber hover:bg-amber/10 rounded-xl"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteEvent(event.id)}
                            className="p-2 text-pearl/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-sm text-pearl/60 font-serif italic border-l-2 border-white/10 pl-3 py-1">
                          {event.description}
                        </p>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-20"
                  >
                    <CalendarIcon className="w-16 h-16" />
                    <div className="space-y-1">
                      <p className="font-display font-bold text-xl">Nada agendado</p>
                      <p className="text-sm font-serif italic text-balance">
                        Que este dia seja preenchido pela paz que excede todo entendimento.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-amber/5 border border-amber/10 p-6 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-amber font-bold text-[10px] uppercase tracking-widest">
                <Bell className="w-3 h-3" /> Foco Espiritual
              </div>
              <p className="text-xs text-pearl/60 leading-relaxed italic">
                Organizar o tempo é um ato de mordomia. Dedique cada momento do seu dia à glória de Deus.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-navy border border-amber/20 w-full max-w-xl rounded-[3rem] p-8 md:p-12 space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <CalendarIcon className="w-32 h-32" />
              </div>

              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <h2 className="text-3xl font-display font-bold">
                    {editingEvent ? "Editar Compromisso" : "Agendar Momento"}
                  </h2>
                  <p className="text-sm text-pearl/40">
                    {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <button onClick={closeModal} className="text-pearl/40 hover:text-pearl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest pl-2">O que será realizado?</label>
                    <input 
                      required
                      autoFocus
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-amber transition-colors outline-none text-xl font-display"
                      placeholder="Ex: Vigília, Estudo Bíblico..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest pl-2">Horário</label>
                      <input 
                        type="time"
                        required
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-amber transition-colors outline-none text-pearl/80"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest pl-2">Categoria</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as Category})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-amber transition-colors outline-none text-pearl/80 appearance-none"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat} className="bg-navy">{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-pearl/40 uppercase tracking-widest pl-2">Observações (Opcional)</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-amber transition-colors outline-none resize-none font-serif text-pearl/80"
                      placeholder="Algum detalhe espiritual importante?"
                    />
                  </div>
                </div>

                <div className="pt-4 flex flex-col md:flex-row gap-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-amber text-navy font-bold py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-base"
                  >
                    {loading ? "Salvando..." : editingEvent ? "Salvar Alterações" : "Salvar na Agenda"}
                  </button>
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="px-8 py-5 text-pearl/40 font-bold hover:text-pearl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
