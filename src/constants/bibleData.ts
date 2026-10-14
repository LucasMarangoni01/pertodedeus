export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'Velho' | 'Novo';
  isDeuterocanonical?: boolean;
  bollsId: number;
  category?: string;
  description?: string;
}

export const bibleBooks: BibleBook[] = [
  // Antigo Testamento (Cânon Católico e Tradicional)
  { name: "Gênesis", chapters: 50, testament: 'Velho', bollsId: 1, category: "Pentateuco" },
  { name: "Êxodo", chapters: 40, testament: 'Velho', bollsId: 2, category: "Pentateuco" },
  { name: "Levítico", chapters: 27, testament: 'Velho', bollsId: 3, category: "Pentateuco" },
  { name: "Números", chapters: 36, testament: 'Velho', bollsId: 4, category: "Pentateuco" },
  { name: "Deuteronômio", chapters: 34, testament: 'Velho', bollsId: 5, category: "Pentateuco" },
  { name: "Josué", chapters: 24, testament: 'Velho', bollsId: 6, category: "Históricos" },
  { name: "Juízes", chapters: 21, testament: 'Velho', bollsId: 7, category: "Históricos" },
  { name: "Rute", chapters: 4, testament: 'Velho', bollsId: 8, category: "Históricos" },
  { name: "1 Samuel", chapters: 31, testament: 'Velho', bollsId: 9, category: "Históricos" },
  { name: "2 Samuel", chapters: 24, testament: 'Velho', bollsId: 10, category: "Históricos" },
  { name: "1 Reis", chapters: 22, testament: 'Velho', bollsId: 11, category: "Históricos" },
  { name: "2 Reis", chapters: 25, testament: 'Velho', bollsId: 12, category: "Históricos" },
  { name: "1 Crônicas", chapters: 29, testament: 'Velho', bollsId: 13, category: "Históricos" },
  { name: "2 Crônicas", chapters: 36, testament: 'Velho', bollsId: 14, category: "Históricos" },
  { name: "Esdras", chapters: 10, testament: 'Velho', bollsId: 15, category: "Históricos" },
  { name: "Neemias", chapters: 13, testament: 'Velho', bollsId: 16, category: "Históricos" },
  
  // Livros Deuterocanônicos Católicos - Históricos
  { 
    name: "Tobias", 
    chapters: 14, 
    testament: 'Velho', 
    bollsId: 68, 
    isDeuterocanonical: true, 
    category: "Históricos",
    description: "Narrativa da piedade familiar, a virtude de Tobias e o auxílio do Arcanjo São Rafael."
  },
  { 
    name: "Judite", 
    chapters: 16, 
    testament: 'Velho', 
    bollsId: 69, 
    isDeuterocanonical: true, 
    category: "Históricos",
    description: "A corajosa heroína israelita que salvou seu povo do exército assírio de Holofernes."
  },
  
  { name: "Ester", chapters: 10, testament: 'Velho', bollsId: 17, category: "Históricos" },
  
  // Livros Deuterocanônicos Católicos - Macabeus
  { 
    name: "1 Macabeus", 
    chapters: 16, 
    testament: 'Velho', 
    bollsId: 74, 
    isDeuterocanonical: true, 
    category: "Históricos",
    description: "A resistência heróica dos Macabeus contra a tirania selêucida e a purificação do Templo."
  },
  { 
    name: "2 Macabeus", 
    chapters: 15, 
    testament: 'Velho', 
    bollsId: 75, 
    isDeuterocanonical: true, 
    category: "Históricos",
    description: "O martírio dos sete irmãos, a fé na ressurreição dos mortos e a oração pelos falecidos."
  },

  // Livros Sapienciais e Poéticos
  { name: "Jó", chapters: 42, testament: 'Velho', bollsId: 18, category: "Sapienciais" },
  { name: "Salmos", chapters: 150, testament: 'Velho', bollsId: 19, category: "Sapienciais" },
  { name: "Provérbios", chapters: 31, testament: 'Velho', bollsId: 20, category: "Sapienciais" },
  { name: "Eclesiastes", chapters: 12, testament: 'Velho', bollsId: 21, category: "Sapienciais" },
  { name: "Cânticos", chapters: 8, testament: 'Velho', bollsId: 22, category: "Sapienciais" },
  
  // Livros Deuterocanônicos Católicos - Sapienciais
  { 
    name: "Sabedoria", 
    chapters: 19, 
    testament: 'Velho', 
    bollsId: 70, 
    isDeuterocanonical: true, 
    category: "Sapienciais",
    description: "A imortalidade da alma humana, a justiça divina e o elogio da Sabedoria de Deus."
  },
  { 
    name: "Eclesiástico", 
    chapters: 51, 
    testament: 'Velho', 
    bollsId: 71, 
    isDeuterocanonical: true, 
    category: "Sapienciais",
    description: "Também conhecido como Sirácida ou Ben Sirá; riquíssimo manual de conduta moral e amor a Deus."
  },

  // Profetas Maiores
  { name: "Isaías", chapters: 66, testament: 'Velho', bollsId: 23, category: "Proféticos" },
  { name: "Jeremias", chapters: 52, testament: 'Velho', bollsId: 24, category: "Proféticos" },
  { name: "Lamentações", chapters: 5, testament: 'Velho', bollsId: 25, category: "Proféticos" },
  
  // Livro Deuterocanônico Católico - Profético
  { 
    name: "Baruque", 
    chapters: 6, 
    testament: 'Velho', 
    bollsId: 73, 
    isDeuterocanonical: true, 
    category: "Proféticos",
    description: "Orações de penitência do exílio na Babilônia e a carta com a sátira contra os ídolos."
  },

  { name: "Ezequiel", chapters: 48, testament: 'Velho', bollsId: 26, category: "Proféticos" },
  { name: "Daniel", chapters: 12, testament: 'Velho', bollsId: 27, category: "Proféticos" },

  // Profetas Menores
  { name: "Oseias", chapters: 14, testament: 'Velho', bollsId: 28, category: "Proféticos" },
  { name: "Joel", chapters: 3, testament: 'Velho', bollsId: 29, category: "Proféticos" },
  { name: "Amós", chapters: 9, testament: 'Velho', bollsId: 30, category: "Proféticos" },
  { name: "Obadias", chapters: 1, testament: 'Velho', bollsId: 31, category: "Proféticos" },
  { name: "Jonas", chapters: 4, testament: 'Velho', bollsId: 32, category: "Proféticos" },
  { name: "Miqueias", chapters: 7, testament: 'Velho', bollsId: 33, category: "Proféticos" },
  { name: "Naum", chapters: 3, testament: 'Velho', bollsId: 34, category: "Proféticos" },
  { name: "Habacuque", chapters: 3, testament: 'Velho', bollsId: 35, category: "Proféticos" },
  { name: "Sofonias", chapters: 3, testament: 'Velho', bollsId: 36, category: "Proféticos" },
  { name: "Ageu", chapters: 2, testament: 'Velho', bollsId: 37, category: "Proféticos" },
  { name: "Zacarias", chapters: 14, testament: 'Velho', bollsId: 38, category: "Proféticos" },
  { name: "Malaquias", chapters: 4, testament: 'Velho', bollsId: 39, category: "Proféticos" },

  // Novo Testamento (27 Livros Comuns a Toda a Cristandade)
  { name: "Mateus", chapters: 28, testament: 'Novo', bollsId: 40, category: "Evangelhos" },
  { name: "Marcos", chapters: 16, testament: 'Novo', bollsId: 41, category: "Evangelhos" },
  { name: "Lucas", chapters: 24, testament: 'Novo', bollsId: 42, category: "Evangelhos" },
  { name: "João", chapters: 21, testament: 'Novo', bollsId: 43, category: "Evangelhos" },
  { name: "Atos", chapters: 28, testament: 'Novo', bollsId: 44, category: "Histórico NT" },
  { name: "Romanos", chapters: 16, testament: 'Novo', bollsId: 45, category: "Cartas Paulinas" },
  { name: "1 Coríntios", chapters: 16, testament: 'Novo', bollsId: 46, category: "Cartas Paulinas" },
  { name: "2 Coríntios", chapters: 13, testament: 'Novo', bollsId: 47, category: "Cartas Paulinas" },
  { name: "Gálatas", chapters: 6, testament: 'Novo', bollsId: 48, category: "Cartas Paulinas" },
  { name: "Efésios", chapters: 6, testament: 'Novo', bollsId: 49, category: "Cartas Paulinas" },
  { name: "Filipenses", chapters: 4, testament: 'Novo', bollsId: 50, category: "Cartas Paulinas" },
  { name: "Colossenses", chapters: 4, testament: 'Novo', bollsId: 51, category: "Cartas Paulinas" },
  { name: "1 Tessalonicenses", chapters: 5, testament: 'Novo', bollsId: 52, category: "Cartas Paulinas" },
  { name: "2 Tessalonicenses", chapters: 3, testament: 'Novo', bollsId: 53, category: "Cartas Paulinas" },
  { name: "1 Timóteo", chapters: 6, testament: 'Novo', bollsId: 54, category: "Cartas Paulinas" },
  { name: "2 Timóteo", chapters: 4, testament: 'Novo', bollsId: 55, category: "Cartas Paulinas" },
  { name: "Tito", chapters: 3, testament: 'Novo', bollsId: 56, category: "Cartas Paulinas" },
  { name: "Filemon", chapters: 1, testament: 'Novo', bollsId: 57, category: "Cartas Paulinas" },
  { name: "Hebreus", chapters: 13, testament: 'Novo', bollsId: 58, category: "Cartas Gerais" },
  { name: "Tiago", chapters: 5, testament: 'Novo', bollsId: 59, category: "Cartas Gerais" },
  { name: "1 Pedro", chapters: 5, testament: 'Novo', bollsId: 60, category: "Cartas Gerais" },
  { name: "2 Pedro", chapters: 3, testament: 'Novo', bollsId: 61, category: "Cartas Gerais" },
  { name: "1 João", chapters: 5, testament: 'Novo', bollsId: 62, category: "Cartas Gerais" },
  { name: "2 João", chapters: 1, testament: 'Novo', bollsId: 63, category: "Cartas Gerais" },
  { name: "3 João", chapters: 1, testament: 'Novo', bollsId: 64, category: "Cartas Gerais" },
  { name: "Judas", chapters: 1, testament: 'Novo', bollsId: 65, category: "Cartas Gerais" },
  { name: "Apocalipse", chapters: 22, testament: 'Novo', bollsId: 66, category: "Profético NT" },
];

/**
 * Retorna os 7 livros deuterocanônicos católicos
 */
export const deuterocanonicalBooks = bibleBooks.filter(b => b.isDeuterocanonical);

/**
 * Retorna os 73 livros completos da Bíblia Católica
 */
export const catholicBibleBooks = bibleBooks;

/**
 * Retorna os 66 livros do cânon protestante
 */
export const protestantBibleBooks = bibleBooks.filter(b => !b.isDeuterocanonical);
