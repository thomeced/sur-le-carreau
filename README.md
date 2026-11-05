# Sur le carreau

Jeu web de duels de catégories, inspiré du principe des jeux télévisés de « territoires » : deux joueurs, une catégorie, des images à nommer le plus vite possible. Chaque bonne réponse passe la main à l'adversaire ; celui dont le chrono tombe à zéro perd.

## Jouer

Ouvrir `index.html` dans un navigateur. Aucune installation, aucune dépendance (hormis une police Google Fonts).

- **Mode clavier** : les joueurs tapent leurs réponses (tolérance aux accents, aux articles et aux petites fautes).
- **Mode arbitre** : les joueurs répondent à l'oral, un arbitre valide depuis une autre page (bouton « Je suis l'arbitre » ou `#arbitre` dans l'adresse) en saisissant le code à 4 caractères affiché par le jeu.

> La liaison entre deux appareils utilise la capacité `room` des artefacts claude.ai. Hors claude.ai, seuls deux onglets du même navigateur peuvent communiquer (`BroadcastChannel`).

## Contenu

Six thèmes : animaux, fruits et légumes, transports, drapeaux, films en rébus d'emojis, jeux vidéo. Chaque image a un niveau de 1 à 3, et la difficulté monte au fil du duel.

## Structure

```
index.html                 le jeu complet (HTML, CSS, JS)
docs/contexte-projet.md    règles, décisions, direction visuelle, plan
```

## Feuille de route

1. Duel à deux sur le même écran — fait
2. Plusieurs catégories, validation robuste — fait
3. Grille de territoires et conquête
4. Mode solo / défi
5. Multijoueur en ligne (Node.js + Socket.IO)
6. Finitions : sons, animations, mobile, réponse vocale

Détails dans [`docs/contexte-projet.md`](docs/contexte-projet.md).
