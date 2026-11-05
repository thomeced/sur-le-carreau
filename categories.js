/* Catégories de « Sur le carreau ».
 *
 * Pour ajouter une image : copier une ligne d'une catégorie et la modifier.
 *   ["emoji(s)", "réponse acceptée|autre réponse acceptée", niveau]
 *   - emoji(s) : ce que voient les joueurs (un rébus peut en utiliser plusieurs) ;
 *   - réponses : séparées par |, sans se soucier des accents, des majuscules
 *     ni des articles (le, la, un…) ; la première est celle affichée à l'arbitre ;
 *   - niveau : 1 facile, 2 moyen, 3 difficile (la difficulté monte au fil du duel).
 * Pour ajouter une catégorie : copier un bloc « clé: { label, items } » ci-dessous.
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
  }
};
