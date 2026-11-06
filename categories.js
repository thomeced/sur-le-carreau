/* Catégories de « Sur le carreau ».
 *
 * Pour ajouter une image : copier une ligne d'une catégorie et la modifier.
 *   ["emoji(s)", "réponse acceptée|autre réponse acceptée", niveau]
 *   - emoji(s) : ce que voient les joueurs (un rébus peut en utiliser plusieurs) ;
 *   - réponses : séparées par |, sans se soucier des accents, des majuscules
 *     ni des articles (le, la, un…) ; la première est celle affichée à l'arbitre ;
 *   - niveau : 1 facile, 2 moyen, 3 difficile (la difficulté monte au fil du duel).
 * Pour ajouter une catégorie : copier un bloc « clé: { label, items } » ci-dessous.
 * Types de catégorie (champ « type », facultatif) :
 *   - "emoji" (par défaut) : les lignes ci-dessus ;
 *   - "trous" (mot à trous) : items: ["vache", "cochon|cochons", ["hippopotame", 3]] ; le jeu cache des
 *     lettres au hasard, niveau calculé d'après la longueur si on ne le donne pas ;
 *   - "photo" : items: [["assets/photos/velo.jpg", "vélo", 1]] (adresse de l'image, réponses, niveau).
 * Les catégories créées avec editeur.html restent dans le navigateur (voir perso.js), pas dans ce fichier.
 * Une ligne mal écrite est ignorée (avertissement dans la console du navigateur).
 */
const CATEGORIES = {
  animaux: {
    label: "Animaux",
    items: [
      // Niveau 1
      ["🐘", "éléphant", 1],
      ["🦁", "lion", 1],
      ["🐼", "panda", 1],
      ["🐬", "dauphin", 1],
      ["🐢", "tortue", 1],
      ["🦒", "girafe", 1],
      ["🐸", "grenouille", 1],
      ["🐝", "abeille", 1],
      // Niveau 2
      ["🦓", "zèbre", 2],
      ["🦋", "papillon", 2],
      ["🐌", "escargot", 2],
      ["🦅", "aigle", 2],
      ["🦈", "requin", 2],
      ["🦔", "hérisson", 2],
      // Niveau 3
      ["🐧", "manchot|pingouin", 3],
      ["🦉", "hibou|chouette", 3],
      ["🐙", "pieuvre|poulpe", 3],
      ["🦘", "kangourou", 3],
      ["🐪", "chameau|dromadaire", 3],
      ["🐊", "crocodile|alligator", 3],
    ],
  },

  fruits: {
    label: "Fruits et légumes",
    items: [
      // Niveau 1
      ["🍎", "pomme", 1],
      ["🍌", "banane", 1],
      ["🍓", "fraise", 1],
      ["🍒", "cerise", 1],
      ["🥕", "carotte", 1],
      ["🍅", "tomate", 1],
      ["🍋", "citron", 1],
      ["🍇", "raisin", 1],
      // Niveau 2
      ["🍍", "ananas", 2],
      ["🌽", "maïs", 2],
      ["🥔", "pomme de terre|patate", 2],
      ["🥦", "brocoli", 2],
      ["🍑", "pêche", 2],
      ["🍉", "pastèque", 2],
      ["🥝", "kiwi", 2],
      // Niveau 3
      ["🍆", "aubergine", 3],
      ["🌶️", "piment", 3],
      ["🥑", "avocat", 3],
      ["🧅", "oignon", 3],
      ["🍄", "champignon", 3],
    ],
  },

  transports: {
    label: "Transports",
    items: [
      // Niveau 1
      ["🚲", "vélo|bicyclette", 1],
      ["🚂", "train|locomotive", 1],
      ["✈️", "avion", 1],
      ["🚌", "bus|autobus|car", 1],
      ["🚕", "taxi", 1],
      ["🚑", "ambulance", 1],
      // Niveau 2
      ["🚢", "bateau|navire", 2],
      ["🚁", "hélicoptère", 2],
      ["🚜", "tracteur", 2],
      ["🚒", "camion de pompiers|camion de pompier|pompier", 2],
      ["🚀", "fusée", 2],
      ["🛴", "trottinette", 2],
      // Niveau 3
      ["🛵", "scooter|mobylette", 3],
      ["🏍️", "moto", 3],
      ["🛶", "canoë|kayak|pirogue", 3],
      ["🚡", "téléphérique", 3],
    ],
  },

  drapeaux: {
    label: "Drapeaux",
    items: [
      // Niveau 1
      ["🇫🇷", "france", 1],
      ["🇮🇹", "italie", 1],
      ["🇪🇸", "espagne", 1],
      ["🇩🇪", "allemagne", 1],
      ["🇬🇧", "royaume-uni|angleterre|grande-bretagne", 1],
      ["🇺🇸", "états-unis|etats unis|usa|amérique", 1],
      ["🇧🇷", "brésil", 1],
      ["🇯🇵", "japon", 1],
      ["🇨🇳", "chine", 1],
      ["🇨🇦", "canada", 1],
      ["🇧🇪", "belgique", 1],
      ["🇨🇭", "suisse", 1],
      // Niveau 2
      ["🇵🇹", "portugal", 2],
      ["🇳🇱", "pays-bas|hollande", 2],
      ["🇮🇪", "irlande", 2],
      ["🇸🇪", "suède", 2],
      ["🇳🇴", "norvège", 2],
      ["🇬🇷", "grèce", 2],
      ["🇹🇷", "turquie", 2],
      ["🇲🇽", "mexique", 2],
      ["🇦🇷", "argentine", 2],
      ["🇮🇳", "inde", 2],
      ["🇰🇷", "corée du sud|corée", 2],
      ["🇦🇺", "australie", 2],
      ["🇪🇬", "égypte", 2],
      ["🇲🇦", "maroc", 2],
      ["🇿🇦", "afrique du sud", 2],
      ["🇷🇺", "russie", 2],
      // Niveau 3
      ["🇳🇵", "népal", 3],
      ["🇨🇾", "chypre", 3],
      ["🇧🇹", "bhoutan", 3],
      ["🇨🇱", "chili", 3],
      ["🇨🇴", "colombie", 3],
      ["🇩🇰", "danemark", 3],
      ["🇵🇱", "pologne", 3],
      ["🇦🇹", "autriche", 3],
      ["🇭🇺", "hongrie", 3],
      ["🇱🇧", "liban", 3],
      ["🇯🇲", "jamaïque", 3],
      ["🇰🇪", "kenya", 3],
      ["🇳🇿", "nouvelle-zélande", 3],
      ["🇸🇬", "singapour", 3],
      ["🇵🇪", "pérou", 3],
      ["🇸🇳", "sénégal", 3],
      ["🇨🇮", "côte d'ivoire", 3],
      ["🇪🇨", "équateur", 3],
      ["🇷🇴", "roumanie", 3],
      ["🇨🇿", "tchéquie|république tchèque", 3],
      ["🇧🇬", "bulgarie", 3],
    ],
  },

  films: {
    label: "Films en rébus d'emojis",
    items: [
      // Niveau 1
      ["🦈", "les dents de la mer|dents de la mer", 1],
      ["❄️👸", "la reine des neiges|reine des neiges", 1],
      ["🦁👑", "le roi lion|roi lion", 1],
      ["🐠🔍", "le monde de nemo|nemo|trouver nemo", 1],
      ["💍🧙", "le seigneur des anneaux|seigneur des anneaux", 1],
      ["🚢🧊", "titanic", 1],
      ["🦖🏝️", "jurassic park|jurassic world", 1],
      ["🕷️🕸️", "spider-man|spiderman", 1],
      ["🧸🤠", "toy story", 1],
      ["👽📞", "e.t.|et|e.t. l'extra-terrestre", 1],
      // Niveau 2
      ["🐀🍲", "ratatouille", 2],
      ["🏠🎈", "là-haut|la haut", 2],
      ["🧞🏜️", "aladdin", 2],
      ["🌹🕯️", "la belle et la bête|belle et la bête", 2],
      ["🐼🥋", "kung fu panda", 2],
      ["💀🚢", "pirates des caraïbes", 2],
      ["⚡👓", "harry potter", 2],
      ["⭐⚔️", "star wars|la guerre des étoiles", 2],
      ["🕶️💊", "matrix", 2],
      ["🦍🏙️", "king kong", 2],
      ["🐧💃", "happy feet", 2],
      ["🚗⚡", "cars|flash mcqueen", 2],
      // Niveau 3
      ["💀🎸", "coco", 3],
      ["🍫🏭", "charlie et la chocolaterie|la chocolaterie", 3],
      ["🐯🌊", "l'odyssée de pi|la vie de pi|vie de pi", 3],
      ["👹🚪", "monstres et cie|monstres cie|monstres inc", 3],
      ["🥁🎷", "whiplash", 3],
      ["🛸🌾", "signes|signs", 3],
      ["🏔️🤠", "brokeback mountain", 3],
      ["🐜👑", "1001 pattes|mille et une pattes", 3],
    ],
  },

  jeux: {
    label: "Jeux vidéo",
    items: [
      // Niveau 1
      ["🍄", "super mario|mario", 1],
      ["⛏️", "minecraft", 1],
      ["🟡👻", "pac-man|pacman", 1],
      ["🧱", "tetris", 1],
      ["🐦🐷", "angry birds", 1],
      ["🏓", "pong", 1],
      ["🚗🚓", "gta|grand theft auto", 1],
      ["🏎️🍌", "mario kart", 1],
      ["⚽🎮", "fifa|ea fc|ea sports fc", 1],
      // Niveau 2
      ["🧝🗡️", "zelda|the legend of zelda|legend of zelda", 2],
      ["🦔💨", "sonic", 2],
      ["👾", "space invaders", 2],
      ["🧟🌱", "plantes contre zombies|plants vs zombies", 2],
      ["⚡🔴", "pokémon|pokemon", 2],
      ["🍬", "candy crush", 2],
      ["🦝🏝️", "animal crossing", 2],
      ["⚽🚗", "rocket league", 2],
      ["🐔🛣️", "crossy road", 2],
      // Niveau 3
      ["🦍🛢️", "donkey kong", 3],
      ["🐺⚔️", "the witcher|witcher", 3],
      ["🌀🔫", "portal", 3],
      ["🚀🔴", "among us", 3],
      ["🌾🎣", "stardew valley", 3],
      ["😈🔥", "diablo", 3],
    ],
  },

  sports: {
    label: "Sports et loisirs",
    items: [
      // Niveau 1
      ["⚽", "football|foot", 1],
      ["🏀", "basket|basketball|basket-ball", 1],
      ["🎾", "tennis", 1],
      ["🏊", "natation|nage", 1],
      ["🚴", "cyclisme|vélo", 1],
      ["⛷️", "ski", 1],
      ["🏉", "rugby", 1],
      ["🥊", "boxe", 1],
      // Niveau 2
      ["🏐", "volley|volley-ball|volleyball", 2],
      ["🏸", "badminton", 2],
      ["🏓", "ping-pong|tennis de table|ping pong", 2],
      ["⛳", "golf", 2],
      ["🎱", "billard", 2],
      ["🏹", "tir à l'arc|arc", 2],
      ["🏂", "snowboard", 2],
      ["⛸️", "patinage|patin à glace|patinage sur glace", 2],
      ["🏒", "hockey|hockey sur glace", 2],
      ["🎳", "bowling", 2],
      // Niveau 3
      ["🤺", "escrime", 3],
      ["🏇", "équitation|course de chevaux|hippisme", 3],
      ["🥋", "judo|arts martiaux|karaté", 3],
      ["🛹", "skateboard|skate", 3],
      ["🤿", "plongée", 3],
      ["🥍", "crosse|lacrosse", 3],
      ["🧗", "escalade", 3],
      ["🏄", "surf", 3],
      ["🤸", "gymnastique", 3],
      ["🏋️", "haltérophilie|musculation", 3],
      ["🏈", "football américain", 3],
    ],
  },

  musique: {
    label: "Musique",
    items: [
      // Niveau 1
      ["🎸", "guitare", 1],
      ["🎹", "piano|clavier", 1],
      ["🥁", "batterie|tambour", 1],
      ["🎺", "trompette", 1],
      ["🎻", "violon", 1],
      ["🎤", "micro|microphone", 1],
      // Niveau 2
      ["🎷", "saxophone|sax", 2],
      ["🪕", "banjo", 2],
      ["🪗", "accordéon", 2],
      ["🪈", "flûte|flute", 2],
      ["🎧", "casque|écouteurs", 2],
      ["🎼", "partition|clé de sol", 2],
      ["📻", "radio", 2],
      // Niveau 3
      ["🪘", "djembé|conga|tambour", 3],
      ["🔔", "cloche|clochette", 3],
      ["💿", "disque|cd|disque compact", 3],
      ["🎙️", "micro de studio|micro studio|microphone de studio", 3],
      ["🎵", "note de musique|note", 3],
    ],
  },

  metiers: {
    label: "Métiers",
    items: [
      // Niveau 1
      ["🧑‍🍳", "cuisinier|cuisinière|chef cuisinier|chef", 1],
      ["🧑‍⚕️", "médecin|docteur", 1],
      ["👮", "policier|police|gendarme", 1],
      ["🧑‍🚒", "pompier", 1],
      ["🧑‍🏫", "professeur|enseignant|prof|maître|maîtresse", 1],
      ["🧑‍🌾", "agriculteur|fermier|paysan", 1],
      // Niveau 2
      ["🧑‍✈️", "pilote|pilote d'avion", 2],
      ["🧑‍🔧", "mécanicien|garagiste", 2],
      ["🧑‍🎨", "peintre|artiste", 2],
      ["🧑‍🔬", "scientifique|chercheur", 2],
      ["🧑‍🚀", "astronaute|cosmonaute", 2],
      ["👷", "ouvrier|maçon|ouvrier du bâtiment", 2],
      ["🧑‍🎤", "chanteur|chanteuse", 2],
      ["🧑‍💻", "informaticien|développeur|programmeur", 2],
      // Niveau 3
      ["🧑‍⚖️", "juge", 3],
      ["🕵️", "détective|espion", 3],
      ["💂", "garde royal|garde britannique|garde", 3],
      ["🤹", "jongleur|artiste de cirque", 3],
      ["🧙", "magicien|sorcier|mage", 3],
    ],
  },

  outils: {
    label: "Outils et bricolage",
    items: [
      // Niveau 1
      ["🔨", "marteau", 1],
      ["🪚", "scie", 1],
      ["🔧", "clé à molette|clé", 1],
      ["🪛", "tournevis", 1],
      ["🧰", "boîte à outils|caisse à outils|malette à outils", 1],
      ["🪓", "hache", 1],
      // Niveau 2
      ["🪜", "échelle", 2],
      ["📏", "règle", 2],
      ["✂️", "ciseaux", 2],
      ["🧲", "aimant", 2],
      ["⛏️", "pioche", 2],
      ["🧹", "balai", 2],
      ["🧽", "éponge", 2],
      ["🖌️", "pinceau", 2],
      // Niveau 3
      ["🔩", "boulon|vis et écrou|écrou", 3],
      ["⚙️", "engrenage|rouage", 3],
      ["🗜️", "étau", 3],
      ["🪝", "crochet", 3],
      ["🧵", "fil|bobine de fil|fil à coudre", 3],
      ["🪡", "aiguille", 3],
      ["📐", "équerre", 3],
      ["🔗", "chaîne|maillon", 3],
      ["🪤", "piège à souris|souricière|piège", 3],
    ],
  },

  nature: {
    label: "Nature et météo",
    items: [
      // Niveau 1
      ["☀️", "soleil", 1],
      ["🌧️", "pluie", 1],
      ["❄️", "neige|flocon|flocon de neige", 1],
      ["🌈", "arc-en-ciel", 1],
      ["🌙", "lune", 1],
      ["⭐", "étoile", 1],
      ["🌳", "arbre", 1],
      ["🌸", "fleur de cerisier|fleur", 1],
      // Niveau 2
      ["⛈️", "orage", 2],
      ["🌪️", "tornade", 2],
      ["🌫️", "brouillard", 2],
      ["🌋", "volcan", 2],
      ["🌊", "vague", 2],
      ["🏔️", "montagne", 2],
      ["🏝️", "île|île déserte", 2],
      ["🌵", "cactus", 2],
      ["🌴", "palmier", 2],
      // Niveau 3
      ["☄️", "comète", 3],
      ["🍁", "feuille d'érable|érable", 3],
      ["🍂", "feuilles mortes|feuille d'automne|automne", 3],
      ["🪨", "rocher|pierre|caillou", 3],
      ["🌾", "blé|épi de blé|épi", 3],
      ["🏜️", "désert", 3],
      ["🌅", "lever de soleil|coucher de soleil|aube", 3],
      ["🌌", "voie lactée|galaxie|ciel étoilé", 3],
      ["🌀", "cyclone|ouragan|spirale", 3],
    ],
  },

  vetements: {
    label: "Vêtements et accessoires",
    items: [
      // Niveau 1
      ["👕", "t-shirt|tee-shirt|tshirt", 1],
      ["👖", "jean|pantalon", 1],
      ["👗", "robe", 1],
      ["🧥", "manteau|veste", 1],
      ["🧣", "écharpe", 1],
      ["🧤", "gants|gant", 1],
      ["🧢", "casquette", 1],
      ["👟", "basket|baskets|chaussure de sport", 1],
      // Niveau 2
      ["👠", "talons|chaussure à talon|escarpin", 2],
      ["👓", "lunettes", 2],
      ["🎩", "chapeau haut de forme|haut-de-forme|chapeau", 2],
      ["👑", "couronne", 2],
      ["👜", "sac à main|sac", 2],
      ["🩳", "short", 2],
      ["🧦", "chaussettes|chaussette", 2],
      ["👔", "cravate|chemise", 2],
      // Niveau 3
      ["🥾", "chaussure de randonnée|botte|chaussure de marche", 3],
      ["👙", "bikini|maillot de bain", 3],
      ["🩴", "tongs|claquettes|sandales", 3],
      ["🥿", "ballerine|chaussure plate", 3],
      ["👒", "chapeau de paille|chapeau", 3],
      ["🎓", "toque|bonnet de diplômé|chapeau de diplômé", 3],
      ["🕶️", "lunettes de soleil", 3],
      ["👘", "kimono", 3],
    ],
  },

  plats: {
    label: "Plats et gourmandises",
    items: [
      // Niveau 1
      ["🍕", "pizza", 1],
      ["🍔", "hamburger|burger", 1],
      ["🌭", "hot-dog|hot dog", 1],
      ["🥐", "croissant", 1],
      ["🥖", "baguette|pain", 1],
      ["🧀", "fromage", 1],
      ["🍟", "frites", 1],
      ["🍦", "glace", 1],
      // Niveau 2
      ["🥞", "crêpes|pancakes|crêpe", 2],
      ["🍣", "sushi", 2],
      ["🌮", "taco|tacos", 2],
      ["🍝", "spaghetti|pâtes|spaghettis", 2],
      ["🍩", "donut|beignet", 2],
      ["🍫", "chocolat|tablette de chocolat", 2],
      ["🥚", "œuf|oeuf", 2],
      ["🍿", "pop-corn|popcorn", 2],
      // Niveau 3
      ["🥨", "bretzel", 3],
      ["🥟", "raviolis|gyoza|dumpling", 3],
      ["🍜", "nouilles|ramen|soupe de nouilles", 3],
      ["🍙", "onigiri|boule de riz", 3],
      ["🥧", "tarte|tourte", 3],
      ["🧇", "gaufre", 3],
      ["🥗", "salade", 3],
      ["🥪", "sandwich", 3],
      ["🍪", "cookie|biscuit", 3],
    ],
  },

  monuments: {
    label: "Lieux et monuments",
    items: [
      // Niveau 1
      ["🗽", "statue de la liberté", 1],
      ["🏰", "château", 1],
      ["🏠", "maison", 1],
      ["🏫", "école", 1],
      ["🏥", "hôpital", 1],
      ["⛪", "église", 1],
      ["🌉", "pont", 1],
      ["🏟️", "stade", 1],
      // Niveau 2
      ["🕌", "mosquée", 2],
      ["🏯", "château japonais", 2],
      ["🏛️", "parthénon|temple grec|colonnes", 2],
      ["⛩️", "torii|portique japonais|temple japonais", 2],
      ["🗿", "moai|statue de l'île de pâques|statue", 2],
      ["🏦", "banque", 2],
      ["🏨", "hôtel", 2],
      ["🏭", "usine", 2],
      ["🗻", "mont fuji|fuji", 2],
      // Niveau 3
      ["🕍️", "synagogue", 3],
      ["🛖", "case|hutte|cabane", 3],
      ["🏗️", "chantier|grue", 3],
      ["🎡", "grande roue", 3],
      ["🎢", "montagnes russes", 3],
      ["🏚️", "maison abandonnée|maison en ruine|ruine", 3],
      ["🗼", "tour de tokyo|tour eiffel|tour", 3],
      ["⛲", "fontaine", 3],
      ["🏕️", "camping|tente|campement", 3],
    ],
  },

  fetes: {
    label: "Fêtes et célébrations",
    items: [
      // Niveau 1
      ["🎂", "gâteau d'anniversaire|gâteau", 1],
      ["🎄", "sapin de noël|sapin", 1],
      ["🎃", "citrouille|halloween", 1],
      ["🎁", "cadeau", 1],
      ["🎈", "ballon|ballon de baudruche", 1],
      ["🎉", "confettis|fête", 1],
      ["🎆", "feu d'artifice|feux d'artifice", 1],
      ["🎅", "père noël", 1],
      // Niveau 2
      ["🕯️", "bougie", 2],
      ["🥂", "trinquer|champagne|toast|verres de champagne", 2],
      ["🍾", "bouteille de champagne|champagne|bouteille", 2],
      ["🐣", "poussin|poussin de pâques", 2],
      ["💐", "bouquet|bouquet de fleurs", 2],
      ["🪅", "piñata|pinata", 2],
      ["🎭", "masques|théâtre|carnaval", 2],
      // Niveau 3
      ["🧨", "pétard|pétards", 3],
      ["🪔", "lampe à huile|diya|diwali", 3],
      ["🎑", "fête de la lune|cérémonie de la lune", 3],
      ["🎏", "koinobori|carpe koinobori|manche à air", 3],
      ["🎋", "tanabata|arbre à voeux", 3],
      ["🎍", "kadomatsu|décoration du nouvel an japonais|bambou", 3],
      ["🏮", "lanterne|lampion|lanterne rouge", 3],
      ["🎐", "carillon à vent|carillon", 3],
    ],
  },

  espace: {
    label: "Espace et sciences",
    items: [
      // Niveau 1
      ["🌍", "terre|planète terre|globe", 1],
      ["🌙", "lune", 1],
      ["⭐", "étoile", 1],
      ["🚀", "fusée", 1],
      ["🪐", "saturne|planète|planète avec anneaux", 1],
      ["☀️", "soleil", 1],
      ["👽", "alien|extraterrestre", 1],
      ["🛸", "ovni|soucoupe volante", 1],
      // Niveau 2
      ["☄️", "comète", 2],
      ["🛰️", "satellite", 2],
      ["🔭", "télescope", 2],
      ["🔬", "microscope", 2],
      ["🧪", "éprouvette|tube à essai|fiole", 2],
      ["🌌", "galaxie|voie lactée", 2],
      ["🔋", "pile|batterie", 2],
      ["🧲", "aimant", 2],
      // Niveau 3
      ["🧬", "adn|double hélice", 3],
      ["⚗️", "alambic|cornue", 3],
      ["🦠", "microbe|virus|bactérie", 3],
      ["🌡️", "thermomètre", 3],
      ["🧫", "boîte de pétri|boîte de petri", 3],
      ["⚛️", "atome", 3],
      ["💉", "seringue|piqûre", 3],
      ["🥼", "blouse|blouse de laboratoire|blouse de labo", 3],
    ],
  },

  techno: {
    label: "Technologie",
    items: [
      // Niveau 1
      ["📱", "téléphone|smartphone|portable", 1],
      ["💻", "ordinateur portable|ordinateur|pc portable", 1],
      ["🖥️", "ordinateur|écran|pc", 1],
      ["⌨️", "clavier", 1],
      ["🖱️", "souris", 1],
      ["🎧", "casque|écouteurs", 1],
      ["📷", "appareil photo|appareil", 1],
      ["🎮", "manette|console", 1],
      // Niveau 2
      ["📺", "télévision|télé|tv", 2],
      ["📻", "radio", 2],
      ["💾", "disquette", 2],
      ["📡", "antenne parabolique|parabole", 2],
      ["🔋", "pile|batterie", 2],
      ["🖨️", "imprimante", 2],
      ["⌚", "montre|montre connectée", 2],
      ["🕹️", "joystick|manette de jeu", 2],
      // Niveau 3
      ["☎️", "téléphone à cadran|téléphone fixe|téléphone", 3],
      ["📠", "fax|télécopieur", 3],
      ["📼", "cassette vidéo|cassette vhs|vhs", 3],
      ["💽", "minidisc|disque", 3],
      ["🔌", "prise|prise électrique|fiche", 3],
      ["📟", "bipeur|pager", 3],
      ["🧮", "boulier", 3],
      ["📽️", "projecteur de cinéma|projecteur|projecteur de film", 3],
    ],
  },

  corps: {
    label: "Corps humain",
    items: [
      // Niveau 1
      ["👁️", "œil|oeil|yeux", 1],
      ["👂", "oreille", 1],
      ["👃", "nez", 1],
      ["👄", "bouche|lèvres", 1],
      ["🦷", "dent", 1],
      ["🖐️", "main|main ouverte", 1],
      ["🦶", "pied", 1],
      ["🧠", "cerveau", 1],
      // Niveau 2
      ["🦴", "os", 2],
      ["💪", "biceps|muscle|bras musclé", 2],
      ["🫀", "cœur|coeur", 2],
      ["🫁", "poumons|poumon", 2],
      ["👅", "langue", 2],
      ["🦵", "jambe", 2],
      // Niveau 3
      ["🦻", "oreille avec appareil auditif|appareil auditif", 3],
      ["🦾", "bras mécanique|prothèse|bras bionique", 3],
      ["🩸", "sang|goutte de sang", 3],
      ["👣", "empreintes de pas|traces de pas|pas", 3],
      ["🦿", "jambe mécanique|prothèse de jambe", 3],
      ["🩻", "radiographie|radio", 3],
      ["💅", "vernis à ongles|ongles|manucure", 3],
    ],
  }
};
