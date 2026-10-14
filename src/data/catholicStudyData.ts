import catholicStudyBibleImg from "../assets/images/catholic_study_bible_1791990112156.jpg";
import creationAdamImg from "../assets/images/creation_adam_art_1791990134031.jpg";
import tobiasRaphaelImg from "../assets/images/tobias_raphael_angel_1791990148541.jpg";
import annunciationMaryImg from "../assets/images/annunciation_mary_1791990165893.jpg";
import lastSupperImg from "../assets/images/last_supper_art_1791990186444.jpg";
import resurrectionImg from "../assets/images/resurrection_christ_1791990203376.jpg";
import pentecostImg from "../assets/images/pentecost_spirit_1791990221800.jpg";
import peterKeysImg from "../assets/images/peter_keys_art_1791990243943.jpg";

export {
  catholicStudyBibleImg,
  creationAdamImg,
  tobiasRaphaelImg,
  annunciationMaryImg,
  lastSupperImg,
  resurrectionImg,
  pentecostImg,
  peterKeysImg
};

export interface SacredArtItem {
  id: string;
  title: string;
  artist: string;
  period: string;
  biblicalRef: string;
  targetBook: string;
  targetChapter: number;
  category: "antigo-testamento" | "deuterocanonicos" | "evangelhos" | "paixao-ressurreicao" | "igreja-apostolos";
  image: string;
  description: string;
  theologicalReflection: string;
  visioDivinaPrompt: string;
  cicRef?: string;
}

export const sacredArtCollection: SacredArtItem[] = [
  {
    id: "criacao-adao",
    title: "A Criação de Adão e do Universo",
    artist: "Michelangelo Buonarroti (Capela Sistina, Vaticano)",
    period: "Renascimento Italiano (c. 1511)",
    biblicalRef: "Gênesis 1:26-27; 2:7",
    targetBook: "Gênesis",
    targetChapter: 1,
    category: "antigo-testamento",
    image: creationAdamImg,
    description: "Deus Pai, cercado por anjos e manto divino em formato de coração e intelecto, estende o dedo criador em direção ao homem de barro para lhe insuflar a centelha da vida imortal.",
    theologicalReflection: "O homem foi criado à imagem e semelhança de Deus (Imago Dei). O toque quase infinitesimal entre o dedo divino e a mão humana ilustra a transcendência do Criador e a vocação sobrenatural de cada alma humana.",
    visioDivinaPrompt: "Feche os olhos por um instante e contemple: você não é fruto do acaso, mas de um pensamento eterno de amor do Pai. Sinta a proximidade da mão de Deus sobre a sua história.",
    cicRef: "CIC §§ 355-358"
  },
  {
    id: "tobias-sao-rafael",
    title: "Tobias e o Arcanjo São Rafael",
    artist: "Mestres Florentinos / Tradição Bíblica Católica",
    period: "Renascimento Católico",
    biblicalRef: "Tobias 5:1-22; 12:15",
    targetBook: "Tobias",
    targetChapter: 5,
    category: "deuterocanonicos",
    image: tobiasRaphaelImg,
    description: "O jovem Tobias caminha pelas margens verdejantes do rio Tigre, guiado com ternura soberana pelo Arcanjo São Rafael ('Deus cura'), acompanhado de seu cão fiel e do peixe milagroso.",
    theologicalReflection: "O Livro de Tobias, conservado exclusivamente na Bíblia Católica, testemunha a caridade familiar, a pureza no matrimônio santo e o ministério protetor dos Santos Anjos como companheiros celestes de peregrinação.",
    visioDivinaPrompt: "Olhe para a postura segura do Arcanjo segurando a mão de Tobias. Quais estradas desconhecidas você está percorrendo hoje? Peça a São Rafael que afugente as trevas e cure a sua cegueira.",
    cicRef: "CIC §§ 328-336"
  },
  {
    id: "anunciacao-maria",
    title: "A Anunciação à Virgem Maria",
    artist: "Fra Angelico & Escola Italiana",
    period: "Quattrocento Renascentista (c. 1438)",
    biblicalRef: "Lucas 1:26-38",
    targetBook: "Lucas",
    targetChapter: 1,
    category: "evangelhos",
    image: annunciationMaryImg,
    description: "O Arcanjo São Gabriel ajoelha-se reverente diante da humilde Donzela de Nazaré com o lírio da pureza. O Espírito Santo desce em raio luminoso no momento do 'Fiat' ('Faça-se em mim segundo a tua palavra').",
    theologicalReflection: "A encarnação do Verbo no seio puríssimo de Maria é o centro de toda a História da Salvação. Maria torna-se a Nova Eva e a Arca da Nova Aliança, desatando com sua obediência o nó da desobediência original.",
    visioDivinaPrompt: "Contemple a serenidade da Virgem acolhendo a vontade de Deus. Que 'sim' Deus está esperando de você hoje no silêncio do seu coração?",
    cicRef: "CIC §§ 484-494"
  },
  {
    id: "chaves-sao-pedro",
    title: "Entrega das Chaves a São Pedro",
    artist: "Pietro Perugino (Capela Sistina, Roma)",
    period: "Renascimento Clássico (1481–1482)",
    biblicalRef: "Mateus 16:18-19; João 21:15-17",
    targetBook: "Mateus",
    targetChapter: 16,
    category: "igreja-apostolos",
    image: peterKeysImg,
    description: "Jesus Cristo entrega as chaves de ouro e de prata do Reino dos Céus ao apóstolo Pedro que se prostra de joelhos, perante o colégio apostólico e o Templo central de Jerusalém em perfeita harmonia geométrica.",
    theologicalReflection: "Fundamento bíblico irrevogável do Primado Petrino e da Sucessão Apostólica. Cristo estabelece a Sua única Igreja visível sobre a rocha de Pedro, garantindo que 'as portas do inferno nunca prevalecerão contra ela'.",
    visioDivinaPrompt: "Observe as duas chaves: autoridade espiritual e poder de ligar e desligar no Céu e na Terra. Reze hoje pelo Santo Padre, o Papa, e pela unidade da Santa Igreja Católica no mundo.",
    cicRef: "CIC §§ 880-882"
  },
  {
    id: "ultima-ceia-eucaristia",
    title: "A Última Ceia & Instituição da Eucaristia",
    artist: "Leonardo da Vinci & Escola Sacra Católica",
    period: "Renascimento (c. 1495–1498)",
    biblicalRef: "Mateus 26:26-29; João 6:51-56; 1 Coríntios 11:23-26",
    targetBook: "Mateus",
    targetChapter: 26,
    category: "evangelhos",
    image: lastSupperImg,
    description: "Na noite do Cenáculo, Nosso Senhor parte o pão e ergue o cálice de bênção, pronunciando as palavras eternas da Consagração que transformam a substância do pão e do vinho em Seu verdadeiro Corpo e Sangue.",
    theologicalReflection: "A Santa Eucaristia é a fonte e o ápice (Fons et Culmen) da vida eclesial. Não se trata de mero memorial simbólico, mas da Presença Real, Verdadeira e Substancial de Cristo Ressuscitado (Transubstanciação).",
    visioDivinaPrompt: "Foque o olhar no rosto de Jesus repartindo o pão. 'Isto é o meu Corpo entregue por vós'. Renove a sua fé viva diante do Santíssimo Sacramento do Altar.",
    cicRef: "CIC §§ 1324-1336"
  },
  {
    id: "ressurreicao-gloriosa",
    title: "A Ressurreição Triunfante de Cristo",
    artist: "Peter Paul Rubens & Mestres Barrocos",
    period: "Barroco Católico (c. 1612)",
    biblicalRef: "Mateus 28:1-10; João 20:1-18",
    targetBook: "Mateus",
    targetChapter: 28,
    category: "paixao-ressurreicao",
    image: resurrectionImg,
    description: "Cristo sai vitorioso do sepulcro escavado na rocha com o estandarte da cruz triunfal. Soldados romanos caem aterrados enquanto anjos cantam o hino de vitória sobre a morte e o inferno.",
    theologicalReflection: "A Ressurreição é a comprovação máxima da divindade de Jesus e a garantia de nossa própria ressurreição corporal no último dia. 'Se Cristo não ressuscitou, vã é a nossa fé' (1 Cor 15,14).",
    visioDivinaPrompt: "Deixe a luz dourada da vitória de Cristo invadir as áreas escuras ou desanimadas da sua vida. O túmulo está vazio: Ele vive e reina para sempre!",
    cicRef: "CIC §§ 638-655"
  },
  {
    id: "pentecostes-espirito",
    title: "A Descida do Espírito Santo em Pentecostes",
    artist: "El Greco & Jean Restout",
    period: "Maneirismo / Barroco Sacro (c. 1600)",
    biblicalRef: "Atos dos Apóstolos 1:14; 2:1-13",
    targetBook: "Atos",
    targetChapter: 2,
    category: "igreja-apostolos",
    image: pentecostImg,
    description: "Reunidos no Cenáculo em oração perseverante em torno de Maria Santíssima, os doze apóstolos recebem o Espírito Consolador sob a forma de línguas de fogo e vento impetuoso.",
    theologicalReflection: "Pentecostes é a manifestação pública da Igreja Católica nascida do lado aberto de Cristo na Cruz. O mesmo Espírito Santo confere a infalibilidade ao magistério e anima os sacramentos da Crisma e da Ordem.",
    visioDivinaPrompt: "Contemple a chama ardente sobre cada cabeça. Suplique ao Paráclito divino: 'Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do vosso amor!'.",
    cicRef: "CIC §§ 731-741"
  }
];

export interface CatholicTheologicalTopic {
  id: string;
  title: string;
  badge: string;
  keyVerse: string;
  book: string;
  chapter: number;
  doctrine: string;
  patristicQuote: string;
  author: string;
  cic: string;
  artId: string;
}

export const catholicKeyPassages: CatholicTheologicalTopic[] = [
  {
    id: "primado-pedro",
    title: "O Primado de Pedro e as Chaves do Reino",
    badge: "Eclesiologia & Papado",
    keyVerse: "Mateus 16:18-19",
    book: "Mateus",
    chapter: 16,
    doctrine: "Jesus confere a Simão o novo nome de Pedro (Cefas / Pedra), estabelecendo sobre ele o alicerce perpétuo de Sua Igreja e outorgando as Chaves régias de ligar e desligar no Céu e na Terra.",
    patristicQuote: "Onde está Pedro, aí está a Igreja; e onde está a Igreja, aí não há morte alguma, mas a vida eterna.",
    author: "Santo Ambrósio de Milão (340–397 d.C.)",
    cic: "CIC §§ 880–883",
    artId: "chaves-sao-pedro"
  },
  {
    id: "eucaristia-presenca-real",
    title: "A Eucaristia Real: O Pão Vivo Descido do Céu",
    badge: "Santíssimo Sacramento",
    keyVerse: "João 6:51-56",
    book: "João",
    chapter: 6,
    doctrine: "No Discurso do Pão da Vida, Jesus insiste 6 vezes que é necessário comer a Sua Carne e beber o Seu Sangue, refutando qualquer metáfora e instituindo a Presença Real preservada na Missa Católica.",
    patristicQuote: "Não veja no pão e no vinho meros elementos naturais, pois eles são, segundo a declaração expressa do Senhor, Seu Corpo e Seu Sangue. A fé lhe dá essa certeza, embora os sentidos sugiram o contrário.",
    author: "São Cirilo de Jerusalém (313–386 d.C.)",
    cic: "CIC §§ 1373–1377",
    artId: "ultima-ceia-eucaristia"
  },
  {
    id: "oracao-pelos-falecidos",
    title: "A Oração pelos Mortos & O Purgatório",
    badge: "Deuterocanônicos & Escatologia",
    keyVerse: "2 Macabeus 12:43-46",
    book: "2 Macabeus",
    chapter: 12,
    doctrine: "Judas Macabeu manda oferecer sacrifício em Jerusalém pelos soldados caídos, pois 'é um santo e salutar pensamento orar pelos mortos, para que sejam perdoados dos seus pecados'. Prova clara da purificação após a morte (Purgatório).",
    patristicQuote: "A Igreja ora por todos os que partiram nesta comunhão, certos de que as almas recebem alívio mediante o Santo Sacrifício oferecido nos altares.",
    author: "Santo Agostinho (354–430 d.C., Confissões IX)",
    cic: "CIC §§ 1030–1032",
    artId: "tobias-sao-rafael"
  },
  {
    id: "maria-cheia-de-graca",
    title: "Maria Santíssima: Cheia de Graça & Mãe de Deus",
    badge: "Mariologia",
    keyVerse: "Lucas 1:28, 42-43; Apocalipse 12:1",
    book: "Lucas",
    chapter: 1,
    doctrine: "O Arcanjo Gabriel saúda Maria com o título único 'Kecharitomene' (perfeitamente preenchida pela graça divina), confirmando sua Imaculada Conceição e sua cooperação singular na Redenção.",
    patristicQuote: "Ela é a Virgem bendita, Terra santa e incorruptível onde o novo Adão foi formado pelo Espírito sem concurso de semente terrena.",
    author: "São João Damasceno (676–749 d.C.)",
    cic: "CIC §§ 490–493; 963–975",
    artId: "anunciacao-maria"
  },
  {
    id: "fe-e-obras",
    title: "A Fé Viva que Opera pela Caridade",
    badge: "Soteriologia & Moral",
    keyVerse: "Tiago 2:14-26",
    book: "Tiago",
    chapter: 2,
    doctrine: "A doutrina católica ensina que somos salvos pela graça mediante uma fé operante e viva. 'O homem é justificado pelas obras e não somente pela fé' (Tg 2,24).",
    patristicQuote: "A fé sem as boas obras não é viva, mas morta; pois quem ama a Deus observa com fidelidade os Seus mandamentos.",
    author: "São João Crisóstomo (347–407 d.C.)",
    cic: "CIC §§ 1814–1816; 1996–2005",
    artId: "ressurreicao-gloriosa"
  },
  {
    id: "sacramento-confissao",
    title: "O Poder de Perdoar Pecados (Reconciliação)",
    badge: "Sacramentos de Cura",
    keyVerse: "João 20:21-23",
    book: "João",
    chapter: 20,
    doctrine: "Jesus sopra sobre os apóstolos e diz: 'Recebei o Espírito Santo. A quem perdoardes os pecados, ser-lhes-ão perdoados; a quem os retiverdes, ser-lhes-ão retidos'. Origem divina da confissão auricular católica.",
    patristicQuote: "Os sacerdotes receberam de Deus um poder que Ele não concedeu nem aos anjos nem aos arcanjos: o que eles atam ou desatam na terra, Deus ratifica nos céus.",
    author: "São João Crisóstomo (Tratado sobre o Sacerdócio)",
    cic: "CIC §§ 1440–1449",
    artId: "pentecostes-espirito"
  }
];

export interface CatholicBookCategory {
  id: string;
  name: string;
  description: string;
  books: string[];
}

export const catholicBookCategories: CatholicBookCategory[] = [
  {
    id: "pentateuco",
    name: "Pentateuco (A Lei de Moisés)",
    description: "Os 5 primeiros livros fundamentais da Aliança, desde a Criação até as portas da Terra Prometida.",
    books: ["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio"]
  },
  {
    id: "historicos",
    name: "Livros Históricos (com Deuterocanônicos)",
    description: "A epopeia do Povo de Deus, dos Reis, do Exílio e os livros católicos de Tobias, Judite e os Macabeus.",
    books: [
      "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", 
      "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Tobias", "Judite", "Ester", 
      "1 Macabeus", "2 Macabeus"
    ]
  },
  {
    id: "sapienciais",
    name: "Livros Sapienciais & Poéticos",
    description: "Cânticos de adoração, oração dos Salmos e a sabedoria divina em Sabedoria de Salomão e Eclesiástico.",
    books: ["Jó", "Salmos", "Provérbios", "Eclesiastes", "Cânticos", "Sabedoria", "Eclesiástico"]
  },
  {
    id: "profeticos",
    name: "Profetas Maiores e Menores",
    description: "O anúncio do Messias, a fidelidade de Deus e o livro de Baruque, preservado no cânon apostólico.",
    books: [
      "Isaías", "Jeremias", "Lamentações", "Baruque", "Ezequiel", "Daniel",
      "Oseias", "Joel", "Amós", "Obadias", "Jonas", "Miqueias",
      "Naum", "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias"
    ]
  },
  {
    id: "evangelhos",
    name: "Santos Evangelhos & Atos",
    description: "A Boa-Nova da Vida, Morte e Ressurreição de Jesus Cristo e o nascimento da Igreja Católica em Pentecostes.",
    books: ["Mateus", "Marcos", "Lucas", "João", "Atos"]
  },
  {
    id: "epistolas",
    name: "Cartas Paulinas e Epístolas Gerais",
    description: "As cartas inspiradas de São Paulo, São Pedro, São João, São Tiago e São Judas à Igreja Universal.",
    books: [
      "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses",
      "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo",
      "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro",
      "1 João", "2 João", "3 João", "Judas", "Apocalipse"
    ]
  }
];

export const patristicCommentariesSample: Record<string, { father: string; period: string; note: string; cic: string }> = {
  "Gênesis 1": {
    father: "Santo Agostinho (De Genesi ad Litteram)",
    period: "Século IV–V",
    note: "Deus não criou o mundo no tempo, mas criou o tempo juntamente com as criaturas. Toda a criação visível é um sacramento velado do amor do Criador.",
    cic: "CIC § 290: 'No princípio, Deus criou o céu e a terra'."
  },
  "Tobias 5": {
    father: "São Jerônimo (Prefácio à Vulgata)",
    period: "Século IV",
    note: "Traduzi o Livro de Tobias a pedido dos Santos Bispos Cromácio e Heliodoro, para que a Igreja pudesse beber da admirável caridade, paciência e pureza desta nobre família.",
    cic: "CIC § 335: Na liturgia, a Igreja une-se aos anjos para adorar a Deus."
  },
  "Mateus 16": {
    father: "São João Crisóstomo (Homilias sobre São Mateus)",
    period: "Século IV",
    note: "Vede a sabedoria do Senhor: Ele confia o rebanho não aos anjos, mas ao homem que Ele mesmo estabeleceu como fundamento visível da comunhão.",
    cic: "CIC § 881: O Senhor fez de Simão o pastor de todo o Seu rebanho."
  },
  "João 6": {
    father: "São Tomás de Aquino (Catena Aurea)",
    period: "Século XIII",
    note: "A Eucaristia não é figura ou sombra; pelo poder da Palavra sacerdotal, opera-se a admirável e singular conversão de toda a substância no verdadeiro Corpo de Cristo.",
    cic: "CIC § 1374: Na Eucaristia, Cristo está presente de modo incomparável."
  },
  "Lucas 1": {
    father: "Santo Ireneu de Lião (Contra as Heresias)",
    period: "Século II",
    note: "Como Eva, desobediente, causou a morte para si e para todo o gênero humano, assim Maria, obediente, tornou-se causa de salvação para si e para toda a humanidade.",
    cic: "CIC § 494: Por sua obediência, Maria tornou-se a Nova Eva."
  },
  "Atos 2": {
    father: "São Gregório de Nazianzo (Discursos Teológicos)",
    period: "Século IV",
    note: "Em Babel, a soberba dividiu as línguas dos homens; em Pentecostes, o Espírito Santo reuniu todas as nações numa só confissão católica e universal.",
    cic: "CIC § 732: No dia de Pentecostes, a Páscoa de Cristo consuma-se pela efusão do Espírito."
  }
};
