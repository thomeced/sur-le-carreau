# Sur le carreau

Jeu web de duels de catégories, inspiré du principe des jeux télévisés de « territoires » : deux joueurs, une catégorie, des images à nommer le plus vite possible. Chaque bonne réponse passe la main à l'adversaire ; celui dont le chrono tombe à zéro perd.

## Jouer

Ouvrir `index.html` dans un navigateur (le fichier `categories.js` doit rester à côté). Aucune installation, aucune dépendance (hormis une police Google Fonts).

Au lancement, un écran propose le **mode funky** (générique animé et son) ou le **mode sérieux** (sans intro, fond noir). Pour aller directement au jeu sobre, mettre `?mode=serieux` à la fin de l'adresse en favori.

Un compte à rebours 3-2-1 précède chaque duel.

- **Réponses à l'oral** : les joueurs répondent de vive voix, un arbitre valide depuis une autre page (bouton « Je suis l'arbitre » ou `#arbitre` dans l'adresse) en saisissant le code à 4 caractères affiché par le jeu. Le code reste valable d'une partie à l'autre : l'arbitre n'a pas à recharger sa page ; le bouton « Nouveau code » en génère un autre si besoin.

> **Liaison jeu ↔ arbitre.** Sur claude.ai, elle passe par la capacité `room` des artefacts. Partout ailleurs (GitHub Pages…), elle passe par [PeerJS](https://peerjs.com) : les deux appareils se connectent en direct, le service public de PeerJS ne sert qu'à les mettre en relation. Si aucun des deux n'est disponible, seuls deux onglets du même navigateur peuvent communiquer (`BroadcastChannel`). Un indicateur affiche l'état de la liaison sur les deux écrans.
> Sur certains réseaux mobiles très fermés, la connexion directe peut échouer : mettre alors le jeu et l'arbitre sur le même wifi.

## Héberger sur GitHub Pages

Dépôt → **Settings** → **Pages** → *Build and deployment* : source **Deploy from a branch**, branche `main`, dossier `/ (root)`. Le jeu est ensuite servi à `https://<utilisateur>.github.io/sur-le-carreau/`. L'arbitre ouvre la même adresse (bouton « Je suis l'arbitre ») et saisit le code affiché sur l'écran du jeu.

## Grille de territoires

Mode par défaut au départ (l'autre choix est « Duel à deux »). Taille 2×2, 3×3 ou 4×4 (4×4 par défaut) : un joueur par case, chaque case a sa catégorie. Le duel se joue dans la catégorie de la case défendue ; le perdant est éliminé et le gagnant prend toutes ses cases. Le gagnant choisit ensuite une case voisine (haut, bas, gauche, droite) à défier. Le dernier joueur en lice gagne. Le plateau est dessiné en SVG : quadrillage droit dont les territoires fusionnés forment des pièces façon Tetris, bleu pour toutes les cases, violet pour le joueur en cours, bleu clair pour les adversaires possibles, vague violette au front organique quand un territoire est capturé. On attaque un joueur dans sa catégorie d'origine. Le bouton « Retourner sur le sol » fait tirer au sort un autre candidat (en priorité un qui n'a pas encore joué). Les adversaires se choisissent aussi au clavier (Tab puis Entrée). En mode arbitre, l'arbitre voit la catégorie du duel ; le choix de la case se fait sur l'écran du jeu.

## Contenu

28 catégories. 18 en images emoji (441 images) : animaux, fruits et légumes, transports, drapeaux, films en rébus, jeux vidéo, sports, musique, métiers, outils, nature, vêtements, plats, monuments, fêtes, espace, technologie, corps humain. Chaque image a un niveau de 1 à 3, et la difficulté monte au fil du duel.

10 catégories en **mot à trous** (319 mots, public adulte) : capitales du monde, villes de France, départements français, fleuves, mers et montagnes, personnages historiques, mythologie, peintres et sculpteurs, fromages, desserts et pâtisseries, anatomie. Le jeu cache des lettres au hasard, mot par mot ; le niveau dépend de la longueur du mot le plus long.

### Ajouter des images ou une catégorie

Tout se passe dans `categories.js`, sans toucher au jeu : copier une ligne et la modifier.

```js
["🐘", "éléphant", 1],            // emoji, réponses acceptées (séparées par |), niveau 1 à 3
["🐧", "manchot|pingouin", 3],
```

Une catégorie est un bloc `clé: { label: "Nom affiché", items: [ … ] }`. Une ligne mal écrite est ignorée, avec un avertissement dans la console du navigateur (F12).

### Mes catégories (éditeur)

Le bouton « ✏️ Créer mes catégories » de l'écran de départ ouvre `editeur.html`, pensé pour les enfants : on nomme la catégorie, on choisit le jeu, puis on ajoute les éléments un par un.

- **Mot à trous** : on écrit des mots (plusieurs d'un coup, séparés par des virgules) ; le jeu cache des lettres au hasard, davantage quand le niveau monte.
- **Photos** : on prend ou choisit des photos, puis on écrit ce qu'elles montrent.

Une catégorie apparaît dans le jeu (avec la mention « perso ») dès 5 éléments. Tout est enregistré dans le navigateur de l'appareil (catégories dans `localStorage`, photos dans IndexedDB) ; l'« Espace parents » permet de sauvegarder dans un fichier et de restaurer ce fichier sur un autre appareil. Pendant le duel, la page arbitre affiche le type de jeu et la consigne à annoncer aux candidats.

## Structure

```
index.html                 le jeu (HTML, CSS, JS)
categories.js              les catégories et leurs images : le fichier à modifier pour ajouter du contenu
editeur.html               l'éditeur « Mes catégories » (mots à trous, photos)
perso.js                   types de jeu, mot à trous, enregistrement des catégories perso (jeu + éditeur)
CLAUDE.md                  état actuel du projet (règles, fichiers, conventions, risques)
docs/journal.md            historique détaillé des chantiers et des décisions
```

## Feuille de route

1. Duel à deux sur le même écran — fait
2. Plusieurs catégories, validation robuste — fait
3. Grille de territoires et conquête — fait (à essayer avec de vrais appareils)
4. Mode solo / défi
5. Multijoueur en ligne (Node.js + Socket.IO)
6. Finitions : sons, animations, mobile, réponse vocale (sons et plateau SVG faits)

État actuel dans [`CLAUDE.md`](CLAUDE.md), historique dans [`docs/journal.md`](docs/journal.md).
