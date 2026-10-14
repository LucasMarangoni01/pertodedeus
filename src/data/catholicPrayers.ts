export interface CatholicPrayerItem {
  id: string;
  title: string;
  subtitle: string;
  category: "fundamentais" | "marianas" | "protecao" | "santos" | "eucaristicas" | "cotidianas" | "pessoal";
  latinTitle?: string;
  origin?: string;
  traditionNote?: string;
  textPt: string;
  textLa?: string;
  isCustom?: boolean;
}

export const CATHOLIC_PRAYERS_DATA: CatholicPrayerItem[] = [
  // 1. FUNDAMENTAIS
  {
    id: "pai-nosso",
    title: "Pai Nosso",
    subtitle: "A oração dominical ensinada por Nosso Senhor Jesus Cristo",
    latinTitle: "Pater Noster",
    category: "fundamentais",
    origin: "Mateus 6:9-13 / Liturgia Romana",
    traditionNote: "A oração por excelência, modelo de toda prece cristã segundo Santo Agostinho e o Catecismo da Igreja Católica (§2759).",
    textPt: `Pai nosso, que estais nos céus,
santificado seja o vosso nome;
venha a nós o vosso reino,
seja feita a vossa vontade,
assim na terra como no céu.
O pão nosso de cada dia nos dai hoje;
perdoai-nos as nossas ofensas,
assim como nós perdoamos a quem nos tem ofendido;
e não nos deixeis cair em tentação,
mas livrai-nos do mal.
Amém.`,
    textLa: `Pater noster, qui es in caelis:
sanctificetur nomen tuum;
adveniat regnum tuum;
fiat voluntas tua,
sicut in caelo et in terra.
Panem nostrum cotidianum da nobis hodie;
et dimitte nobis debita nostra,
sicut et nos dimittimus debitoribus nostris;
et ne nos inducas in tentationem;
sed libera nos a malo.
Amen.`
  },
  {
    id: "ave-maria",
    title: "Ave Maria",
    subtitle: "A saudação angélica e louvor à Mãe do Redentor",
    latinTitle: "Ave Maria",
    category: "marianas",
    origin: "Lucas 1:28, 42 / Tradição da Igreja",
    traditionNote: "Une o anúncio de São Gabriel, a exclamação profética de Santa Isabel e a intercessão suplicante da Igreja militante.",
    textPt: `Ave Maria, cheia de graça, o Senhor é convosco.
Bendita sois vós entre as mulheres,
e bendito é o fruto do vosso ventre, Jesus.
Santa Maria, Mãe de Deus,
rogai por nós, pecadores,
agora e na hora de nossa morte.
Amém.`,
    textLa: `Ave Maria, gratia plena, Dominus tecum.
Benedicta tu in mulieribus,
et benedictus fructus ventris tui, Iesus.
Sancta Maria, Mater Dei,
ora pro nobis peccatoribus,
nunc et in hora mortis nostrae.
Amen.`
  },
  {
    id: "gloria-patri",
    title: "Glória ao Pai",
    subtitle: "Doxologia menor de adoração à Santíssima Trindade",
    latinTitle: "Gloria Patri",
    category: "fundamentais",
    origin: "Liturgia Tradicional dos Primeiros Séculos",
    traditionNote: "Consagra o final de cada salmo do Ofício Divino e as dezenas do Santo Terço em adoração trinitária.",
    textPt: `Glória ao Pai, e ao Filho, e ao Espírito Santo.
Como era no princípio, agora e sempre.
Amém.`,
    textLa: `Gloria Patri, et Filio, et Spiritui Sancto.
Sicut erat in principio, et nunc, et semper,
et in saecula saeculorum.
Amen.`
  },
  {
    id: "credo-apostolico",
    title: "Credo Apostólico",
    subtitle: "O Símbolo dos Apóstolos e síntese da fé cristã",
    latinTitle: "Symbolum Apostolorum",
    category: "fundamentais",
    origin: "Tradição Apostólica / Século II-V",
    traditionNote: "A mais antiga profissão de fé baptismal da Igreja de Roma, conservada fielmente ao longo dos milênios.",
    textPt: `Creio em Deus Pai todo-poderoso,
Criador do céu e da terra.
E em Jesus Cristo, seu único Filho, nosso Senhor,
que foi concebido pelo poder do Espírito Santo,
nasceu da Virgem Maria,
padeceu sob Pôncio Pilatos,
foi crucificado, morto e sepultado;
desceu à mansão dos mortos;
ressuscitou ao terceiro dia;
subiu aos céus,
está sentado à direita de Deus Pai todo-poderoso,
donde há de vir a julgar os vivos e os mortos.
Creio no Espírito Santo,
na santa Igreja católica,
na comunhão dos santos,
na remissão dos pecados,
na ressurreição da carne,
na vida eterna.
Amém.`,
    textLa: `Credo in Deum Patrem omnipotentem, Creatorem caeli et terrae.
Et in Iesum Christum, Filium eius unicum, Dominum nostrum,
qui conceptus est de Spiritu Sancto, natus ex Maria Virgine,
passus sub Pontio Pilato, crucifixus, mortuus, et sepultus,
descendit ad inferos, tertia die resurrexit a mortuis,
ascendit ad caelos, sedet ad dexteram Dei Patris omnipotentis,
inde venturus est iudicare vivos et mortuos.
Credo in Spiritum Sanctum,
sanctam Ecclesiam catholicam,
sanctorum communionem,
remissionem peccatorum,
carnis resurrectionem,
vitam aeternam.
Amen.`
  },
  {
    id: "credo-niceno",
    title: "Credo Niceno-Constantinopolitano",
    subtitle: "A solene proclamação dos Concílios ecumênicos de Nicéia e Constantinopla",
    latinTitle: "Symbolum Nicaenum Constantinopolitanum",
    category: "fundamentais",
    origin: "Concílio de Nicéia (325) e Constantinopla (381)",
    traditionNote: "Recitado nas Missas solenes e dominicais de rito romano, afirmando a consubstancialidade do Filho e do Espírito Santo com o Pai.",
    textPt: `Creio em um só Deus, Pai todo-poderoso,
Criador do céu e da terra,
de todas as coisas visíveis e invisíveis.
Creio em um só Senhor, Jesus Cristo,
Filho Unigênito de Deus,
nascido do Pai antes de todos os séculos:
Deus de Deus, luz da luz,
Deus verdadeiro de Deus verdadeiro,
gerado, não criado, consubstancial ao Pai.
Por Ele todas as coisas foram feitas.
E por nós, homens, e para nossa salvação,
desceu dos céus:
e se encarnou pelo Espírito Santo,
no seio da Virgem Maria, e se fez homem.
Também por nós foi crucificado sob Pôncio Pilatos;
padeceu e foi sepultado.
Ressuscitou ao terceiro dia,
conforme as Escrituras,
e subiu aos céus, onde está sentado à direita do Pai.
E de novo há de vir, em sua glória,
para julgar os vivos e os mortos;
e o seu reino não terá fim.
Creio no Espírito Santo, Senhor que dá a vida,
e procede do Pai e do Filho;
e com o Pai e o Filho é adorado e glorificado:
Ele que falou pelos profetas.
Creio na Igreja, una, santa, católica e apostólica.
Professo um só batismo para a remissão dos pecados.
E espero a ressurreição dos mortos
e a vida do mundo que há de vir.
Amém.`
  },
  {
    id: "salve-rainha",
    title: "Salve Rainha",
    subtitle: "A comovente antífona mariana de súplica filial",
    latinTitle: "Salve Regina",
    category: "marianas",
    origin: "Beato Hermano Contrato (1013–1054)",
    traditionNote: "Cantada ao fim das Completas na Liturgia das Horas e concluindo o Santo Terço em todo o orbe católico.",
    textPt: `Salve, Rainha, Mãe de misericórdia,
vida, doçura e esperança nossa, salve!
A vós bradamos, os degredados filhos de Eva.
A vós suspiramos, gemendo e chorando
neste vale de lágrimas.
Eia, pois, advogada nossa,
esses vossos olhos misericordiosos a nós volvei,
e depois deste desterro mostrai-nos Jesus,
bendito fruto do vosso ventre,
ó clemente, ó piedosa, ó doce sempre Virgem Maria.
Rogai por nós, Santa Mãe de Deus,
para que sejamos dignos das promessas de Cristo.
Amém.`,
    textLa: `Salve, Regina, Mater misericordiae,
vita, dulcedo, et spes nostra, salve.
Ad te clamamus exsules filii Hevae,
ad te suspiramus, gementes et flentes
in hac lacrimarum valle.
Eia, ergo, advocata nostra,
illos tuos misericordes oculos ad nos converte;
et Iesum, benedictum fructum ventris tui,
nobis post hoc exsilium ostende.
O clemens, o pia, o dulcis Virgo Maria.
Ora pro nobis, Sancta Dei Genetrix,
ut digni efficiamur promissionibus Christi.
Amen.`
  },
  {
    id: "ato-contricao",
    title: "Ato de Contrição",
    subtitle: "Oração penitencial para o Sacramento da Reconciliação",
    latinTitle: "Actus Contritionis",
    category: "fundamentais",
    origin: "Ritual Romano da Penitência",
    traditionNote: "Oração indispensável para obter o perdão dos pecados na Confissão e reconciliar o coração com o amor infinito de Deus.",
    textPt: `Meu Deus, eu me arrependo de todo o coração de vos ter ofendido,
porque sois infinitamente bom e amável, e o pecado vos desprazer.
Proponho firmemente, com a ajuda de vossa divina graça,
fazer penitência, não mais pecar e evitar as ocasiões próximas de pecado.
Senhor, tende misericórdia de mim, que sou pecador.
Amém.`,
    textLa: `Deus meus, ex toto corde me paenitet omnium meorum peccatorum,
eaque detestor, quia peccando laesi amorem tuum infinitum,
ac firmitate propono, adiuvante gratia tua,
de cetero me emendare ac vitare peccandi occasiones.
Domine, miserere mei.
Amen.`
  },
  {
    id: "vinde-espirito-santo",
    title: "Vinde, Espírito Santo",
    subtitle: "Invocação ao Paráclito e seus sete dons divinos",
    latinTitle: "Veni Sancte Spiritus",
    category: "fundamentais",
    origin: "Liturgia Tradicional de Pentecostes",
    traditionNote: "Oração para pedir discernimento, sabedoria e fortaleza antes de orar, trabalhar, estudar ou tomar decisões importantes.",
    textPt: `Vinde, Espírito Santo,
enchei os corações dos vossos fiéis
e acendei neles o fogo do vosso amor.
Enviai o vosso Espírito e tudo será criado,
e renovareis a face da terra.

Oremos:
Ó Deus, que instruístes os corações dos vossos fiéis
com a luz do Espírito Santo,
fazei que apreciemos retamente todas as coisas
segundo o mesmo Espírito
e gozemos sempre da sua consolação.
Por Cristo, Senhor Nosso.
Amém.`,
    textLa: `Veni, Sancte Spiritus,
reple tuorum corda fidelium,
et tui amoris in eis ignem accende.
Emitte Spiritum tuum et creabuntur,
et renovabis faciem terrae.

Oremus:
Deus, qui corda fidelium Sancti Spiritus illustratione docuisti,
da nobis in eodem Spiritu recta sapere,
et de eius semper consolatione gaudere.
Per Christum Dominum nostrum.
Amen.`
  },
  {
    id: "angelus",
    title: "O Angelus",
    subtitle: "Comemoração da Encarnação do Verbo às 6h, 12h e 18h",
    latinTitle: "Angelus Domini",
    category: "cotidianas",
    origin: "Tradição Franciscana / Século XIII",
    traditionNote: "Costume secular de interromper as atividades diárias três vezes ao dia para agradecer o mistério da Encarnação.",
    textPt: `V. O Anjo do Senhor anunciou a Maria.
R. E Ela concebeu do Espírito Santo.
(Ave Maria...)

V. Eis aqui a serva do Senhor.
R. Faça-se em mim segundo a vossa palavra.
(Ave Maria...)

V. E o Verbo se fez carne.
R. E habitou entre nós.
(Ave Maria...)

V. Rogai por nós, Santa Mãe de Deus.
R. Para que sejamos dignos das promessas de Cristo.

Oremos:
Infundi, Senhor, vos pedimos, a vossa graça em nossas almas,
para que nós, que pela anunciação do Anjo conhecemos a encarnação de Jesus Cristo, vosso Filho,
pela sua paixão e cruz cheguemos à glória da ressurreição.
Por Cristo, Nosso Senhor.
Amém.`
  },
  {
    id: "regina-caeli",
    title: "Regina Caeli",
    subtitle: "Antífona pascal que substitui o Angelus no Tempo da Ressurreição",
    latinTitle: "Regina Caeli",
    category: "marianas",
    origin: "Século XII / Tempo Litúrgico Pascal",
    traditionNote: "Recitada da Vigília Pascal até o Domingo de Pentecostes, exultando pela Ressurreição do Senhor com a Santíssima Virgem.",
    textPt: `Rainha do Céu, alegrai-vos, aleluia!
Porque Aquele que merecestes trazer em vosso seio, aleluia!
Ressuscitou como disse, aleluia!
Rogai por nós a Deus, aleluia!

V. Alegrai-vos e exultai, ó Virgem Maria, aleluia!
R. Porque o Senhor ressuscitou verdadeiramente, aleluia!

Oremos:
Ó Deus, que vos dignastes alegrar o mundo com a ressurreição do vosso Filho, Nosso Senhor Jesus Cristo,
concedei-nos, nós vos suplicamos, que por sua Mãe, a Virgem Maria, alcancemos as alegrias da vida eterna.
Por Cristo, Nosso Senhor.
Amém.`,
    textLa: `Regina caeli, laetare, alleluia;
Quia quem meruisti portare, alleluia,
Resurrexit, sicut dixit, alleluia:
Ora pro nobis Deum, alleluia.

V. Gaude et laetare, Virgo Maria, alleluia.
R. Quia surrexit Dominus vere, alleluia.

Oremus:
Deus, qui per resurrectionem Filii tui, Domini nostri Iesu Christi, mundum laetificare dignatus es:
praesta, quaesumus, ut per eius Genetricem Virginem Mariam, perpetuae capiamus gaudia vitae.
Per Christum Dominum nostrum.
Amen.`
  },
  {
    id: "magnificat",
    title: "O Magnificat",
    subtitle: "O cântico evangélico de júbilo e gratidão de Nossa Senhora",
    latinTitle: "Canticum B. Mariae Virginis",
    category: "marianas",
    origin: "Lucas 1:46-55 / Vésperas da Liturgia das Horas",
    traditionNote: "O hino com que a Mãe de Deus louvou as maravilhas que o Todo-Poderoso realizou em sua humildade.",
    textPt: `A minha alma engrandece o Senhor,
e o meu espírito se alegra em Deus, meu Salvador,
porque olhou para a humildade de sua serva.
Doravante todas as gerações me chamarão bem-aventurada,
porque o Todo-Poderoso fez em mim grandes coisas,
e santo é o seu nome.
A sua misericórdia se estende de geração em geração
sobre os que o temem.
Manifestou o poder do seu braço:
dispersou os soberbos no coração.
Derrubou os poderosos de seus tronos
e exaltou os humildes.
Aos famintos encheu de bens
e aos ricos despediu de mãos vazias.
Acolheu a Israel, seu servo,
lembrado da sua misericórdia,
como havia prometido a nossos pais,
em favor de Abraão e de sua descendência para sempre.
Glória ao Pai, e ao Filho, e ao Espírito Santo.
Como era no princípio, agora e sempre.
Amém.`
  },

  // 2. PROTEÇÃO E COMBATE ESPIRITUAL
  {
    id: "sao-miguel",
    title: "Oração a São Miguel Arcanjo",
    subtitle: "Poderosa oração de proteção e livramento contra o maligno",
    latinTitle: "Sancte Michael Archangele",
    category: "protecao",
    origin: "Papa Leão XIII (1886)",
    traditionNote: "Escrita após uma visão profética do Santo Padre e vivamente recomendada por São João Paulo II na batalha espiritual diária.",
    textPt: `São Miguel Arcanjo, defendei-nos no combate,
sede o nosso refúgio contra as maldades e ciladas do demônio.
Ordene-lhe Deus, instantemente o pedimos,
e vós, príncipe da milícia celeste, pelo divino poder,
precipitai no inferno a Satanás e a todos os espíritos malignos,
que andam pelo mundo para perder as almas.
Amém.`,
    textLa: `Sancte Michael Archangele, defende nos in proelio;
contra nequitiam et insidias diaboli esto praesidium.
Imperet illi Deus, supplices deprecamur:
tuque, Princeps militiae caelestis,
Satanam aliosque spiritus malignos,
qui ad perditionem animarum pervagantur in mundo,
divina virtute, in infernum detrude.
Amen.`
  },
  {
    id: "sao-bento",
    title: "Oração da Cruz de São Bento",
    subtitle: "A oração da Medalha de São Bento contra as ciladas do demônio",
    latinTitle: "Crux Sacra Sit Mihi Lux",
    category: "protecao",
    origin: "Abadia de Monte Cassino / Tradição Beneditina",
    traditionNote: "Inscrita na célebre Medalha de São Bento, consagrada sacramentalmente pela Igreja para proteção e libertação espiritual.",
    textPt: `A Cruz Sagrada seja a minha luz,
não seja o dragão meu guia.
Retira-te, Satanás!
Nunca me aconselhes coisas vãs.
É mau o que tu me ofereces,
bebe tu mesmo o teu veneno!
Em nome do Pai, do Filho e do Espírito Santo.
Amém.`,
    textLa: `Crux Sacra Sit Mihi Lux!
Non Draco Sit Mihi Dux!
Vade Retro Satana!
Nunquam Suade Mihi Vana!
Sunt Mala Quae Libas,
Ipse Venena Bibas!
In nomine Patris, et Filii, et Spiritus Sancti.
Amen.`
  },
  {
    id: "santo-anjo",
    title: "Santo Anjo do Senhor",
    subtitle: "Invocação filial ao Santo Anjo da Guarda",
    latinTitle: "Angele Dei",
    category: "protecao",
    origin: "Tradição Católica Medieval",
    traditionNote: "Nosso anjo da guarda recebeu de Deus a missão perpétua de nos proteger e iluminar no caminho para o céu.",
    textPt: `Santo Anjo do Senhor,
meu zeloso guardador,
se a ti me confiou a piedade divina,
sempre me rege, me guarde,
me governe, me ilumine.
Amém.`,
    textLa: `Angele Dei,
qui custos es mei,
me, tibi commissum pietate superna,
illumina, custodi,
rege et guberna.
Amen.`
  },
  {
    id: "alma-de-cristo",
    title: "Alma de Cristo",
    subtitle: "Oração mística de união profunda com a Paixão do Senhor",
    latinTitle: "Anima Christi",
    category: "protecao",
    origin: "Século XIV / Difundida por Santo Inácio de Loyola",
    traditionNote: "Muito querida pelos santos, frequentemente rezada após receber a Sagrada Eucaristia ou em momentos de provação espiritual.",
    textPt: `Alma de Cristo, santificai-me.
Corpo de Cristo, salvai-me.
Sangue de Cristo, inebriai-me.
Água do lado de Cristo, lavai-me.
Paixão de Cristo, confortai-me.
Ó bom Jesus, ouvi-me.
Dentro de vossas chagas, escondei-me.
Não permitais que eu me separe de Vós.
Do espírito maligno, defendei-me.
Na hora da minha morte, chamai-me.
E mandai-me ir para Vós,
para que com os vossos Santos Vos louve,
por todos os séculos dos séculos.
Amém.`,
    textLa: `Anima Christi, sanctifica me.
Corpus Christi, salva me.
Sanguis Christi, inebria me.
Aqua lateris Christi, lava me.
Passio Christi, conforta me.
O bone Iesu, exaudi me.
Intra tua vulnera absconde me.
Ne permittas me separari a te.
Ab hoste maligno defende me.
In hora mortis meae voca me.
Et iube me venire ad te,
ut cum Sanctis tuis laudem te
in saecula saeculorum.
Amen.`
  },
  {
    id: "couraca-sao-patricio",
    title: "Couraça de São Patrício",
    subtitle: "Poderosa oração de proteção e presença de Cristo",
    latinTitle: "Lorica Sancti Patricii",
    category: "protecao",
    origin: "São Patrício da Irlanda (Século V)",
    traditionNote: "Invocada pelos monges celtas como um escudo espiritual absoluto contra todo perigo do corpo e da alma.",
    textPt: `Cristo comigo, Cristo diante de mim,
Cristo atrás de mim, Cristo em mim,
Cristo abaixo de mim, Cristo acima de mim,
Cristo à minha direita, Cristo à minha esquerda,
Cristo ao me deitar, Cristo ao me sentar, Cristo ao me levantar,
Cristo no coração de todo homem que pensar em mim,
Cristo na boca de todo homem que falar de mim,
Cristo em todo olho que me vê,
Cristo em todo ouvido que me ouve.
Do Senhor é a salvação,
de Cristo é a salvação;
a tua salvação, Senhor, esteja sempre conosco!
Amém.`
  },

  // 3. EUCARÍSTICAS E ADORAÇÃO
  {
    id: "tantum-ergo",
    title: "Tão Sublime Sacramento",
    subtitle: "Hino solene de adoração a Jesus no Santíssimo Sacramento",
    latinTitle: "Tantum Ergo Sacramentum",
    category: "eucaristicas",
    origin: "São Tomás de Aquino (Século XIII)",
    traditionNote: "As duas últimas estrofes do hino 'Pange Lingua', entoadas obrigatoriamente na Bênção solene do Santíssimo Sacramento.",
    textPt: `Tão sublime Sacramento, adoremos curvados;
E a antiga lei dê lugar ao novo rito;
Supram a fé o defeito dos sentidos.

Ao Pai e ao Filho sejam dados louvor e júbilo,
Saudação, honra, poder e bênção;
E procedendo de ambos, ao Espírito seja dado igual louvor.
Amém.

V. Vós lhes destes o pão do céu.
R. Que contém em si todo o sabor.

Oremos:
Senhor Jesus Cristo, que neste admirável sacramento nos deixastes o memorial da vossa paixão,
concedei-nos venerar de tal modo os sagrados mistérios do vosso Corpo e do vosso Sangue,
que sintamos continuamente em nós o fruto da vossa redenção.
Vós que sois Deus com o Pai, na unidade do Espírito Santo.
Amém.`,
    textLa: `Tantum ergo Sacramentum
veneremur cernui:
et antiquum documentum
novo cedat ritui:
praestet fides supplementum
sensuum defectui.

Genitori, Genitoque
laus et iubilatio,
salus, honor, virtus quoque
sit et benedictio:
Procedenti ab utroque
compar sit laudatio.
Amen.`
  },
  {
    id: "comunhao-espiritual",
    title: "Comunhão Espiritual",
    subtitle: "Oração ardente para desejar Jesus quando impossibilitado de comungar sacramentalmente",
    latinTitle: "Communio Spiritualis",
    category: "eucaristicas",
    origin: "Santo Afonso Maria de Ligório (1696–1787)",
    traditionNote: "O Concílio de Trento ensina que a comunhão espiritual acende o coração com os mesmos frutos da comunhão sacramental.",
    textPt: `Meu Jesus, eu creio que estais presente no Santíssimo Sacramento do Altar.
Amo-Vos sobre todas as coisas e desejo ardentemente receber-Vos em minha alma.
Já que agora não posso receber-Vos sacramentalmente,
vinde ao menos espiritualmente ao meu coração.
E, como se já estivésseis comigo,
eu Vos abraço e me uno totalmente a Vós;
nunca permitais que eu me separe de Vós.
Amém.`
  },
  {
    id: "terco-divina-misericordia",
    title: "Terço da Divina Misericórdia",
    subtitle: "A prece ensinada por Jesus a Santa Faustina para apaziguar a cólera divina",
    category: "eucaristicas",
    origin: "Revelações a Santa Faustina Kowalska (1935)",
    traditionNote: "Rezado no terço comum, especialmente às 15h (Hora da Misericórdia). Promessa de salvação na hora da morte.",
    textPt: `No início: Pai Nosso, Ave Maria e Credo.

Nas contas grandes do Pai Nosso:
"Eterno Pai, eu Vos ofereço o Corpo e o Sangue, a Alma e a Divindade de Vosso diletíssimo Filho, Nosso Senhor Jesus Cristo, em expiação dos nossos pecados e dos do mundo inteiro."

Nas 10 contas pequenas da Ave Maria:
"Pela sua dolorosa Paixão, tende misericórdia de nós e do mundo inteiro."

Ao final de cinco dezenas, repete-se três vezes:
"Santo Deus, Santo Forte, Santo Imortal, tende piedade de nós e do mundo inteiro."

Oração conclusiva:
"Ó Sangue e Água que jorrastes do Coração de Jesus como fonte de misericórdia para nós, eu confio em Vós!"`
  },

  // 4. MARIANAS PROFUNDAS
  {
    id: "consagracao-nossa-senhora",
    title: "Consagração a Nossa Senhora",
    subtitle: "A entrega amorosa sob o manto da Virgem Mãe",
    category: "marianas",
    origin: "Tradição Pessoal de São Luís de Montfort",
    traditionNote: "Oração com a qual milhões de fiéis se entregam inteiramente à Mãe de Deus como seus filhos e escravos de amor.",
    textPt: `Ó minha Senhora, ó minha Mãe,
eu me ofereço todo a vós,
e em prova da minha devoção para convosco,
vos consagro neste dia e para sempre,
os meus olhos, os meus ouvidos, a minha boca,
o meu coração e inteiramente todo o meu ser.
E porque assim sou vosso, ó incomparável Mãe,
guardai-me e defendei-me como coisa e propriedade vossa.
Amém.`
  },
  {
    id: "lembrai-vos",
    title: "Lembrai-vos (Memorare)",
    subtitle: "A mais confiante invocação da piedade de Maria",
    latinTitle: "Memorare",
    category: "marianas",
    origin: "Atribuída a São Bernardo de Claraval (1090–1153)",
    traditionNote: "A Igreja professa que jamais se ouviu dizer no mundo que alguém tenha recorrido à proteção de Maria e sido desamparado.",
    textPt: `Lembrai-vos, ó piíssima Virgem Maria,
que nunca se ouviu dizer que algum daqueles que têm recorrido à vossa proteção,
implorado a vossa assistência e reclamado o vosso socorro,
tenha sido por vós desamparado.
Animado eu, pois, de igual confiança,
a vós, Virgem entre todas singular, como a Mãe recorro,
de vós me valho e, gemendo sob o peso dos meus pecados,
me prostro a vossos pés.
Não desprezeis as minhas súplicas, ó Mãe do Filho de Deus humanado,
mas dignai-vos de as ouvir propícia e de me alcançar o que vos peço.
Amém.`,
    textLa: `Memorare, o piissima Virgo Maria,
a saeculo non esse auditum,
quemquam ad tua currentem praesidia,
tua implorantem auxilia, tua petentem suffragia,
esse derelictum.
Ego tali animatus confidentia,
ad te, Virgo Virginum, Mater, curro,
ad te venio, coram te gemens peccator assisto.
Noli, Mater Verbi, verba mea despicere;
sed audi propitia et exaudi.
Amen.`
  },
  {
    id: "nossa-senhora-aparecida",
    title: "Oração a Nossa Senhora Aparecida",
    subtitle: "Invocação à Rainha e Padroeira do Brasil",
    category: "marianas",
    origin: "Santuário Nacional de Aparecida",
    traditionNote: "Consagração do povo brasileiro à Mãe Aparecida, pedindo paz, união e perseverança cristã nas famílias.",
    textPt: `Ó incomparável Senhora da Conceição Aparecida,
Mãe de meu Deus, Rainha dos Anjos, Advogada dos pecadores,
refúgio e consolação dos aflitos e atribulados,
ó Virgem Santíssima, cheia de poder e bondade,
lançai sobre nós um olhar favorável,
para que sejamos socorridos em todas as necessidades.
Protegei a nossa Santa Igreja Católica,
guardai a nossa Pátria, protegei a nossa família,
e livrai-nos de todos os males da alma e do corpo.
Nossa Senhora Aparecida, padroeira do Brasil, rogai por nós!`
  },
  {
    id: "nossa-senhora-desatadora",
    title: "Oração a N. Sra. Desatadora dos Nós",
    subtitle: "Para desfazer as amarras, dificuldades e problemas aparentemente sem solução",
    category: "marianas",
    origin: "Devoção Mariana de Augsburg (Alemanha)",
    traditionNote: "Muito difundida pelo Papa Francisco, meditada para reconciliação conjugal, vícios e nós da existência.",
    textPt: `Santa Maria, cheia da presença de Deus,
durante os dias de vossa vida aceitastes com toda a humildade a vontade do Pai,
e o maligno nunca foi capaz de vos envolver em suas confusões.
Junto a vosso Filho, intercedestes por nossas dificuldades e,
com toda paciência e amor, nos destes exemplo de como desenredar as linhas de nossa vida.
E ao permanecerdes para sempre como nossa Mãe,
pondes em ordem os laços que nos unem ao Senhor.
Santa Maria, Mãe de Deus e nossa Mãe,
que com coração maternal desatais os nós que sufocam a nossa vida,
vos peço que acolhais em vossas mãos este nó (fazer o pedido),
e que me livreis das amarras e amarguras com que o inimigo nos castiga.
Por vossa graça, por vossa intercessão, por vosso exemplo,
livrai-nos de todo o mal e desatai os nós que impedem de nos unirmos a Deus.
Amém.`
  },

  // 5. SANTOS E MÍSTICOS
  {
    id: "sao-francisco",
    title: "Oração da Paz de São Francisco",
    subtitle: "Instrumento límpido de caridade, perdão e concórdia",
    category: "santos",
    origin: "Espiritualidade Franciscana de Assis",
    traditionNote: "Síntese perfeita do Sermão da Montanha vivida na alegre simplicidade evangélica.",
    textPt: `Senhor, fazei-me instrumento de vossa paz.
Onde houver ódio, que eu leve o amor;
Onde houver ofensa, que eu leve o perdão;
Onde houver discórdia, que eu leve a união;
Onde houver dúvida, que eu leve a fé;
Onde houver erro, que eu leve a verdade;
Onde houver desespero, que eu leve a esperança;
Onde houver tristeza, que eu leve a alegria;
Onde houver trevas, que eu leve a luz.

Ó Mestre, fazei que eu procure mais
Consolar, que ser consolado;
Compreender, que ser compreendido;
Amar, que ser amado.
Pois é dando que se recebe,
É perdoando que se é perdoado,
E é morrendo que se vive para a vida eterna.
Amém.`
  },
  {
    id: "santo-agostinho-tarde-amei",
    title: "Tarde Te Amei",
    subtitle: "A comovente oração da conversão e busca da Verdade",
    latinTitle: "Sero Te Amavi",
    category: "santos",
    origin: "Santo Agostinho (Confissões, Livro X, 27)",
    traditionNote: "Uma das mais sublimes orações da literatura cristã, revelando que Deus habita no íntimo de quem o busca.",
    textPt: `Tarde te amei, ó Beleza tão antiga e tão nova, tarde te amei!
Eis que habitavas dentro de mim, e eu te procurava fora;
eu, disforme, me lançava sobre as belas formas de tuas criaturas.
Estavas comigo, mas eu não estava contigo.
Retinham-me longe de ti as coisas que não existiriam se não existissem em ti.
Chamaste-me, clamaste por mim e rompeste a minha surdez.
Brilhaste, resplandeceste e dissipaste a minha cegueira.
Exalaste o teu perfume e respirei, e agora anseio por ti.
Provei-te, e tenho fome e sede de ti.
Tocaste-me, e inflamei-me no desejo de tua paz.
Amém.`,
    textLa: `Sero te amavi, pulchritudo tam antiqua et tam nova, sero te amavi!
Et ecce intus eras et ego foris, et ibi te quaerebam;
et in ista formosa quae fecisti, deformis irruebam.
Mecum eras, et tecum non eram.
Ea me tenebant longe a te, quae si in te non essent, non essent.
Vocasti et clamasti et rupisti surditatem meam;
coruscasti, splenduisti et fugasti caecitatem meam;
flagrasti, et duxi spiritum, et anhelo tibi;
gustavi et esurio et sitio;
tetigisti me, et exarsi in pacem tuam.
Amen.`
  },
  {
    id: "santa-teresa-nada-te-turbe",
    title: "Nada Te Turbe",
    subtitle: "A oração da paciência e confiança absoluta em Deus",
    category: "santos",
    origin: "Santa Teresa de Jesus / Teresa d'Ávila (1515–1582)",
    traditionNote: "Encontrada escrita de próprio punho no livro de orações da grande mística carmelita e Doutora da Igreja.",
    textPt: `Nada te turbe,
Nada te espante,
Tudo passa,
Deus não muda.
A paciência tudo alcança.
Quem a Deus tem, nada lhe falta:
Só Deus basta!
Amém.`
  },
  {
    id: "suscipe-inacio",
    title: "Tomai, Senhor, e Recebei (Suscipe)",
    subtitle: "Oração de consagração e abandono total da vontade",
    latinTitle: "Suscipe, Domine",
    category: "santos",
    origin: "Santo Inácio de Loyola (Exercícios Espirituais, §234)",
    traditionNote: "O cume dos Exercícios Espirituais (Contemplação para Alcançar Amor): entregar liberdade, inteligência e memória a Deus.",
    textPt: `Tomai, Senhor, e recebei
toda a minha liberdade, a minha memória,
o meu entendimento e toda a minha vontade,
tudo o que tenho e possuo.
Vós me destes, a Vós, Senhor, o restituo.
Tudo é vosso, disponde de tudo inteiramente segundo a vossa vontade.
Dai-me apenas o vosso amor e a vossa graça,
pois esta me basta.
Amém.`,
    textLa: `Suscipe, Domine, universam meam libertatem.
Accipe memoriam, intellectum atque voluntatem omnem.
Quidquid habeo vel possideo, mihi largitus es;
id tibi totum restituo ac tuae prorsus voluntati trado gubernandum.
Amorem tui solum cum gratia tua mihi dones,
et dives sum satis, nec aliud quidquam ultra posco.
Amen.`
  },
  {
    id: "sao-tomas-estudo",
    title: "Oração antes do Estudo",
    subtitle: "Para pedir iluminação da inteligência e fidelidade à Verdade",
    latinTitle: "Oratio Ante Studium",
    category: "santos",
    origin: "São Tomás de Aquino, O.P. (Doutor Angélico)",
    traditionNote: "Oração insigne rezada por estudantes e acadêmicos cristãos antes de abrir qualquer livro ou realizar exames.",
    textPt: `Criador inefável,
que das vossas infinitas riquezas estabelecestes três hierarquias de Anjos
e as colocastes em ordem admirável sobre o céu empíreo,
e distribuístes as partes do universo com tanto encanto;
Vós que sois chamado a verdadeira Fonte de Luz e o Princípio supremo da Sabedoria,
dignai-vos derramar um raio da vossa claridade
sobre as trevas da minha inteligência,
afastando de mim a dupla escuridão em que nasci: o pecado e a ignorância.
Vós que tornais eloquente a língua das criancinhas,
instruí a minha língua e derramai nos meus lábios a graça da vossa bênção.
Dai-me penetração para compreender,
capacidade para reter,
método e facilidade para aprender,
sutileza para interpretar
e graça copiosa para falar.
Orientai o meu início, dirigi o meu progresso e coroai o meu término.
Vós que sois verdadeiro Deus e verdadeiro Homem,
e viveis e reinais pelos séculos dos séculos.
Amém.`
  },
  {
    id: "padre-pio-fica-comigo",
    title: "Fica Comigo, Senhor (São Padre Pio)",
    subtitle: "A oração fervorosa após a Santa Comunhão",
    category: "santos",
    origin: "São Pio de Pietrelcina (1887–1968)",
    traditionNote: "O estigmatizado do Monte Gargano rezava estas súplicas ardentes para não vacilar no caminho da santidade.",
    textPt: `Fica comigo, Senhor, porque preciso de tua presença para não te esquecer.
Sabes quão facilmente te abandono.
Fica comigo, Senhor, porque sou fraco e preciso de tua força para não cair tantas vezes.
Fica comigo, Senhor, porque tu és a minha vida e sem ti perco o fervor.
Fica comigo, Senhor, porque tu és a minha luz e sem ti ando nas trevas.
Fica comigo, Senhor, para me dares a conhecer a tua divina vontade.
Fica comigo, Senhor, para que ouça a tua voz e a siga.
Fica comigo, Senhor, porque desejo amar-te muito e estar sempre em tua companhia.
Fica comigo, Senhor, se queres que te seja fiel.
Fica comigo, Jesus, porque, por mais pobre que seja minha alma,
deseja ser para ti um lugar de consolo e um ninho de amor.
Amém.`
  },

  // 6. COTIDIANAS E FAMÍLIA
  {
    id: "oracao-manha",
    title: "Oferecimento da Manhã",
    subtitle: "Consagração do novo dia e das intenções ao Coração de Jesus",
    category: "cotidianas",
    origin: "Apostolado da Oração",
    traditionNote: "Maneira católica tradicional de começar a jornada, unindo as alegrias e sacrifícios cotidianos ao Santo Sacrifício da Missa.",
    textPt: `Senhor, no silêncio deste dia que amanhece,
venho pedir-vos a paz, a sabedoria e a fortaleza.
Quero olhar hoje o mundo com olhos cheios de amor:
ser paciente, compreensivo, manso e prudente;
ver, além das aparências, os vossos filhos como Vós mesmos os vedes,
e assim não ver senão o bem em cada um.
Cerrai os meus ouvidos a toda calúnia,
guardai a minha língua de toda maldade,
e que só de bênçãos se encha o meu espírito.
Que eu seja tão bom e tão alegre,
que todos aqueles que se aproximarem de mim sintam a vossa presença.
Revesti-me de vossa beleza, Senhor,
e que, no decurso deste dia, eu Vos revele a todos.
Amém.`
  },
  {
    id: "oracao-noite",
    title: "Oração da Noite e Exame",
    subtitle: "Agradecimento pelo dia findo e súplica do perdão",
    category: "cotidianas",
    origin: "Completas da Liturgia das Horas",
    traditionNote: "Conclui o dia com gratidão, arrependimento sincero das faltas cometidas e entrega filial antes do repouso.",
    textPt: `Meu Deus, eu vos dou graças por todos os benefícios
que hoje me concedestes: a vida, a saúde, o alimento,
o trabalho e a companhia dos meus entes queridos.
Iluminai o meu espírito para que eu reconheça as minhas faltas,
as ofensas que cometi por pensamentos, palavras, atos e omissões.
(Fazer um breve instante de silêncio e exame de consciência...)
Senhor, perdoai-me com a vossa infinita misericórdia.
Em vossas mãos, Senhor, entrego o meu espírito.
Vós nos redimistes, Senhor, Deus da verdade.
Guardai-nos, Senhor, como a pupila dos olhos;
protegei-nos à sombra de vossas asas.
Concedei-nos, Senhor, uma noite tranquila e um fim perfeito.
Amém.`
  },
  {
    id: "oracao-familia",
    title: "Oração pelas Famílias",
    subtitle: "Consagração do lar, união e santificação dos lares católicos",
    category: "cotidianas",
    origin: "São João Paulo II (Papa das Famílias)",
    traditionNote: "Para proteger os lares cristãos contra desavenças, infidelidades e desânimo, erguendo a família como Igreja doméstica.",
    textPt: `Deus, de quem provém toda paternidade no céu e na terra,
Pai, que sois amor e vida,
fazei que cada família humana sobre a terra se converta,
por meio de vosso Filho, Jesus Cristo, nascido de mulher,
e do Espírito Santo, fonte de caridade divina,
em verdadeiro santuário da vida e do amor para as gerações que sempre se renovam.
Fazei que a vossa graça guie os pensamentos e as obras dos esposos
para o bem das suas famílias e de todas as famílias do mundo.
Fazei que as jovens gerações encontrem na família um apoio forte
para a sua humanidade e para o seu crescimento na verdade e no amor.
Fazei que o amor, corroborado pela graça do sacramento do Matrimônio,
se mostre mais forte que qualquer fraqueza e que qualquer crise.
Nós vo-lo pedimos pela intercessão da Sagrada Família de Nazaré:
Jesus, Maria e José.
Amém.`
  },
  {
    id: "bencao-alimentos",
    title: "Bênção das Refeições",
    subtitle: "Agradecimento a Deus antes do alimento cotidiano",
    latinTitle: "Benedictio Mensae",
    category: "cotidianas",
    origin: "Tradição Cristã Monástica e Familiar",
    traditionNote: "Lembra que o pão material é dom da providência divina, ensinando a partilha com os que têm fome.",
    textPt: `Abençoai-nos, Senhor,
e a estes alimentos que pela vossa generosidade vamos tomar.
Por Cristo, Nosso Senhor.
Dai pão a quem tem fome,
e fome de justiça a quem tem pão.
Amém.`,
    textLa: `Benedic, Domine, nos et haec tua dona,
quae de tua largitate sumus sumpturi.
Per Christum Dominum nostrum.
Amen.`
  }
];
