# Sur le carreau

Jeu web de duels de catégories, inspiré du principe des jeux télévisés de « territoires » : deux joueurs, une catégorie, des images à nommer le plus vite possible. Chaque bonne réponse passe la main à l'adversaire ; celui dont le chrono tombe à zéro perd.

## Jouer

Ouvrir `index.html` dans un navigateur (le fichier `categories.js` doit rester à côté). Aucune installation, aucune dépendance (hormis une police Google Fonts).

Un compte à rebours 3-2-1 précède chaque duel.

- **Mode clavier** : les joueurs tapent leurs réponses (tolérance aux accents, aux articles et aux petites fautes).
- **Mode arbitre** : les joueurs répondent à l'oral, un arbitre valide depuis une autre page (bouton « Je suis l'arbitre » ou `#arbitre` dans l'adresse) en saisissant le code à 4 caractères affiché par le jeu. Le code reste valable d'une partie à l'autre : l'arbitre n'a pas à recharger sa page ; le bouton « Nouveau code » en génère un autre si besoin.

> **Liaison jeu ↔ arbitre.** Sur claude.ai, elle passe par la capacité `room` des artefacts. Partout ailleurs (GitHub Pages…), elle passe par [PeerJS](https://peerjs.com) : les deux appareils se connectent en direct, le service public de PeerJS ne sert qu'à les mettre en relation. Si aucun des deux n'est disponible, seuls deux onglets du même navigateur peuvent communiquer (`BroadcastChannel`). Un indicateur affiche l'état de la liaison sur les deux écrans.
> Sur certains réseaux mobiles très fermés, la connexion directe peut échouer : mettre alors le jeu et l'arbitre sur le même wifi.

## Héberger sur GitHub Pages

Dépôt → **Settings** → **Pages** → *Build and deployment* : source **Deploy from a branch**, branche `main`, dossier `/ (root)`. Le jeu est ensuite servi à `https://<utilisateur>.github.io/sur-le-carreau/`. L'arbitre ouvre la même adresse (bouton « Je suis l'arbitre ») et saisit le code affiché sur l'écran du jeu.

## Grille de territoires

Choisir « Grille de territoires » au départ, puis une taille (2×2, 3×3 ou 4×4) : un joueur par case, chaque case a sa catégorie. Le duel se joue dans la catégorie de la case défendue ; le perdant est éliminé et le gagnant prend toutes ses cases. Le gagnant choisit ensuite une case voisine (haut, bas, gauche, droite) à défier. Le dernier joueur en lice gagne. En mode arbitre, l'arbitre voit la catégorie du duel ; le choix de la case se fait sur l'écran du jeu.

## Contenu

18 catégories (441 images) : animaux, fruits et légumes, transports, drapeaux, films en rébus, jeux vidéo, sports, musique, métiers, outils, nature, vêtements, plats, monuments, fêtes, espace, technologie, corps humain. Chaque image a un niveau de 1 à 3, et la difficulté monte au fil du duel.

### Ajouter des images ou une catégorie

Tout se passe dans `categories.js`, sans toucher au jeu : copier une ligne et la modifier.

```js
["🐘", "éléphant", 1],            // emoji, réponses acceptées (séparées par |), niveau 1 à 3
["🐧", "manchot|pingouin", 3],
```

Une catégorie est un bloc `clé: { label: "Nom affiché", items: [ … ] }`. Une ligne mal écrite est ignorée, avec un avertissement dans la console du navigateur (F12).

## Structure

```
index.html                 le jeu (HTML, CSS, JS)
categories.js              les catégories et leurs images : le fichier à modifier pour ajouter du contenu
docs/contexte-projet.md    règles, décisions, direction visuelle, plan
```

## Feuille de route

1. Duel à deux sur le même écran — fait
2. Plusieurs catégories, validation robuste — fait
3. Grille de territoires et conquête — fait (à essayer avec de vrais appareils)
4. Mode solo / défi
5. Multijoueur en ligne (Node.js + Socket.IO)
6. Finitions : sons, animations, mobile, réponse vocale

Détails dans [`docs/contexte-projet.md`](docs/contexte-projet.md).
