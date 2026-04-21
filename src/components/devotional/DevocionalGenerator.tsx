import { useState, useEffect } from "react";
import { Book, Edit3, Send, ChevronDown, Check } from "lucide-react";
import { bibleBooks } from "../../constants/bibleData";
import { cn } from "../../lib/utils";

interface DevocionalGeneratorProps {
  onSubmit: (passage: string, simplify: boolean) => void;
}

export function DevocionalGenerator({ onSubmit }: DevocionalGeneratorProps) {
  const [mode, setMode] = useState<"digitar" | "selecionar">("selecionar");
  const [typedPassage, setTypedPassage] = useState("");
  const [selectedBook, setSelectedBook] = useState(bibleBooks[0]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedEndChapter, setSelectedEndChapter] = useState("");
  const [selectedStartVerse, setSelectedStartVerse] = useState("");
  const [selectedEndVerse, setSelectedEndVerse] = useState("");
  const [simplify, setSimplify] = useState(false);

  // Helper arrays for options
  const chapterOptions = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
  // Just allowing 1 to 150 verses arbitrarily for the dropdown limit to avoid API fetches here.
  const verseOptions = Array.from({ length: 150 }, (_, i) => i + 1);

  useEffect(() => {
    // Reset chapter/verse when book changes
    setSelectedChapter(1);
    setSelectedEndChapter("");
    setSelectedStartVerse("");
    setSelectedEndVerse("");
  }, [selectedBook]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalPassage = "";

    if (mode === "digitar") {
      finalPassage = typedPassage.trim();
    } else {
      if (selectedEndChapter && Number(selectedEndChapter) > selectedChapter) {
        finalPassage = `${selectedBook.name} capítulos ${selectedChapter} ao ${selectedEndChapter}`;
      } else {
        finalPassage = `${selectedBook.name} ${selectedChapter}`;
        // Only allow verses if choosing a single chapter
        if (selectedStartVerse) {
          finalPassage += `:${selectedStartVerse}`;
          if (selectedEndVerse) {
            finalPassage += `-${selectedEndVerse}`;
          }
        }
      }
    }

    if (!finalPassage && mode === "digitar") {
        return; // Retorna silencioso se tentar mandar texto vazio
    }

    onSubmit(finalPassage, simplify);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Tabs / Mode Selector */}
      <div className="flex p-1 bg-white/5 border border-amber/10 rounded-2xl w-full max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setMode("selecionar")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            mode === "selecionar" ? "bg-amber text-navy shadow-md" : "text-pearl/60 hover:text-pearl"
          )}
        >
          <Book className="w-4 h-4" /> Selecionar Bíblia
        </button>
        <button
          type="button"
          onClick={() => setMode("digitar")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            mode === "digitar" ? "bg-amber text-navy shadow-md" : "text-pearl/60 hover:text-pearl"
          )}
        >
          <Edit3 className="w-4 h-4" /> Digitar Passagem
        </button>
      </div>

      <div className="min-h-[220px]">
        {mode === "digitar" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">
               O que você quer estudar?
            </label>
            <textarea
              value={typedPassage}
              onChange={(e) => setTypedPassage(e.target.value)}
              placeholder="Ex: Refletir sobre Salmos 23 ou fale sobre o amor de Deus em 1 Coríntios 13..."
              className="w-full bg-navy/50 border border-amber/20 rounded-2xl p-6 text-lg text-pearl focus:border-amber focus:outline-none transition-colors resize-none h-[150px]"
              required
            />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="space-y-4">
                <label className="text-xs font-bold text-pearl/40 uppercase tracking-widest pl-2">
                   Vá para a passagem
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Livro */}
                  <div className="relative">
                    <select
                      value={selectedBook.name}
                      onChange={(e) => setSelectedBook(bibleBooks.find(b => b.name === e.target.value) || bibleBooks[0])}
                      className="w-full bg-navy/50 border border-amber/20 rounded-xl px-5 py-4 text-pearl focus:border-amber focus:outline-none appearance-none transition-colors font-medium"
                    >
                      {bibleBooks.map(book => (
                        <option key={book.bollsId} value={book.name}>{book.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber/50 pointer-events-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Select Capítulo Inicial */}
                    <div className="relative">
                      <select
                        value={selectedChapter}
                        onChange={(e) => setSelectedChapter(Number(e.target.value))}
                        className="w-full bg-navy/50 border border-amber/20 rounded-xl px-4 py-4 text-pearl focus:border-amber focus:outline-none appearance-none transition-colors font-medium text-sm"
                      >
                        {chapterOptions.map(cap => (
                          <option key={cap} value={cap}>Cap. {cap}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber/50 pointer-events-none" />
                    </div>

                    {/* Select Capítulo Final */}
                    <div className="relative">
                      <select
                        value={selectedEndChapter}
                        onChange={(e) => setSelectedEndChapter(e.target.value)}
                        className="w-full bg-navy/50 border border-amber/20 rounded-xl px-4 py-4 text-pearl focus:border-amber focus:outline-none appearance-none transition-colors font-medium text-sm"
                      >
                        <option value="">Ate Cap...</option>
                        {chapterOptions.filter(c => c > selectedChapter).map(cap => (
                          <option key={cap} value={cap}>Cap. {cap}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber/50 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                {/* Só mostra seleção de versículo se selecionou apenas 1 capítulo */}
                <div className={cn(
                  "grid grid-cols-2 gap-4 transition-all duration-300",
                  selectedEndChapter ? "opacity-20 pointer-events-none" : "opacity-100"
                )}>
                  {/* Select Versículo Inicial */}
                  <div className="relative">
                    <select
                      value={selectedStartVerse}
                      onChange={(e) => setSelectedStartVerse(e.target.value)}
                      className="w-full bg-navy/50 border border-amber/20 rounded-xl px-5 py-4 text-pearl focus:border-amber focus:outline-none appearance-none transition-colors font-medium"
                    >
                      <option value="">Versículo...</option>
                      {verseOptions.map(v => (
                        <option key={v} value={v}>V {v}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber/50 pointer-events-none" />
                  </div>

                  {/* Select Versículo Final */}
                  <div className="relative">
                    <select
                      value={selectedEndVerse}
                      onChange={(e) => setSelectedEndVerse(e.target.value)}
                      disabled={!selectedStartVerse}
                      className="w-full bg-navy/50 border border-amber/20 rounded-xl px-5 py-4 text-pearl focus:border-amber focus:outline-none appearance-none transition-colors font-medium disabled:opacity-50"
                    >
                      <option value="">Até o...</option>
                      {verseOptions.filter(v => Number(v) > Number(selectedStartVerse)).map(v => (
                        <option key={v} value={v}>Ate V {v}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber/50 pointer-events-none" />
                  </div>
                </div>
                {selectedEndChapter && (
                  <p className="text-[10px] text-amber/60 italic pl-2 text-center">
                    Seleção de versículos desabilitada para múltiplos capítulos.
                  </p>
                )}
             </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-amber/10 flex flex-col sm:flex-row items-center justify-between gap-6">
         <label 
           className="flex items-center gap-3 cursor-pointer group"
           onClick={() => setSimplify(!simplify)}
         >
           <div className={cn(
             "w-6 h-6 rounded border flex items-center justify-center transition-all",
             simplify ? "bg-amber border-amber text-navy" : "border-white/20 text-transparent group-hover:border-amber/50"
           )}>
              {simplify && <Check className="w-4 h-4" />}
           </div>
           <span className="text-sm text-pearl/80 select-none">Linguagem simples e direta (Sem enrolação)</span>
         </label>

         <button 
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber text-navy px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-xl"
         >
            Gerar Devocional <Send className="w-4 h-4" />
         </button>
      </div>
    </form>
  );
}
