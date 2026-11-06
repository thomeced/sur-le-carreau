# Sur le carreau : état actuel (novembre 2026)

> Doc court : à la fin de chaque chantier, **remplacer** les lignes concernées, ne pas ajouter de section datée.
> Le code du dépôt fait foi. L'historique détaillé est dans `docs/journal.md` (ne le lire qu'en cas de besoin).
> Une copie de ce fichier se trouve dans le projet claude.ai « The Floor Hess » (`contexte-projet-sur-le-carreau.md`) : garder les deux identiques.
> `reference/analyse-the-floor.md` (projet claude.ai) sert de source d'idées, pas de cahier des charges.

## Objectif
Jeu web de salon inspiré de The Floor : duels de catégories sur une grille de territoires. Les joueurs répondent à l'oral et un arbitre valide sur un second appareil. Nom et identité propres : rien de l'émission (nom, logo, polices, musiques, visuels). Ced veut aussi que sa fille puisse créer des catégories.

## Dépôt et façon de travailler
- https://github.com/thomeced/sur-le-carreau, branche `main`, publié avec GitHub Pages (racine).
- Un chantier = une conversation = une branche = une PR, relue et fusionnée par Ced. Commits signés `thomeced@users.noreply.github.com`.
- Aucune copie du code dans le projet claude.ai. Pour un aperçu sur claude.ai : reconstruire une page autonome depuis le dépôt et la publier en artefact.

## Fichiers
- `index.html` : le jeu (HTML, CSS, JS) et la vue arbitre (`#arbitre`).
- `categories.js` : `const CATEGORIES={clé:{label,type?,items:[…]}}` ; format expliqué en tête du fichier. Validé au chargement (lignes invalides et doublons ignorés avec un avertissement en console).
- `perso.js` : catégories perso de l'éditeur, `normItem`, masquage du mot à trous.
- `editeur.html` : éditeur de catégories.
- `intro.js`, `intro.css`, `assets/intro/` : écran de lancement et intro. `tools/generique-intro.py` génère le générique.
- `sons.js` : sons synthétisés (Web Audio), appelés par `snd(nom)`.

## Règles
- **Duel** : deux chronos de 40 s (`DUEL_SEC`, plus de sélecteur sur l'écran de départ ; 45 s avec la case d'or), seul celui du joueur qui a la main tourne. Bonne réponse : la main passe. « Passé » : réponse révélée, −3 s. À 0 s, le joueur perd. Compte à rebours 3-2-1 avant le départ. Niveaux 1 à 3 : +1 toutes les 4 bonnes réponses du duel ; un niveau épuisé est recyclé.
- **Grille** (mode par défaut) : 2×2, 3×3 ou 4×4 (4×4 par défaut), un joueur et une catégorie par case. Premier attaquant tiré au sort. On attaque un voisin orthogonal (n'importe quelle case de son territoire) ; le duel se joue dans la **catégorie d'origine du défenseur**. Le perdant est éliminé et le gagnant prend toutes ses cases, puis il défie un voisin ou **retourne sur le sol** : tirage en priorité parmi ceux qui n'ont pas encore joué (`G.played`), sinon parmi tous. Le dernier en lice gagne.
- **Case d'or** (toujours active, en grille) : 3 duels gagnés d'affilée (attaque ou défense) donnent un bonus de +5 s, que le détenteur peut ajouter à son chrono au début d'un duel ultérieur (bouton avant « Lancer le duel »). Retourner sur le sol remet la série à 0. Un seul bonus à la fois (une 3e victoire en le détenant est sans effet, sauf s'il vient de servir). Consommé à la fin du duel où il a servi ; perdu si le détenteur est éliminé ; pas attribué au dernier duel. Constantes `GOLD_STREAK`, `GOLD_SEC` ; état `G.players[i].streak`, `.gold`, `G.use`, `G.note` ; `goldEarns`.
- **Réponses** : toujours à l'oral, avec arbitre. Le mode clavier (validation tolérante : accents, articles, Levenshtein) reste dans le code, inutilisé, pour les tests.

## Fonctionnalités en place
- **Écran de lancement** : Mode funky (intro de 10 s, son activé) ou Mode sérieux (pas d'intro, fond noir uni, sons coupés). Choix retenu (`slc-mode`), raccourcis `?mode=serieux` et `?mode=funky`. Absent sur `#arbitre` et au retour de l'éditeur.
- **Écran de départ** : mode (grille ou duel), taille, noms. Zone « Catégories de la partie » : tirage au hasard, ✕ pour retirer, + pour ajouter (par type), compteur ; lancement bloqué si le compte est faux ; avertissement si une catégorie a moins de 15 éléments ou contient des drapeaux (Windows). Code : `PICK`, `pdraw`, `pfill`, `ptrim`, `pickSync`, `pickRender`.
- **Plateau SVG** (`#gboard`) : cases `#1B3DB0`, joueur en cours en violet `#7A3FD8`, adversaires possibles `#3D78EA`, adversaire choisi `#6A9CFF`. Territoires fusionnés, étiquette (nom et catégorie) sur la case d'origine seulement. Vague de capture (`gcapture`, `gblob`), tirage animé « Retourner sur le sol » (`gdraw`). `G.sel` = numéro du joueur ; voisinage via `gadj`, `gfoes`, `gtargets`. Accessible au clavier. Territoire du détenteur de la case d'or en jaune `#D9A21B` (`#F2C44E` s'il est l'adversaire choisi), y compris pendant la vague de capture et le tirage ; série affichée dans le panneau.
- **Arbitre** : code à 4 caractères gardé d'un duel à l'autre (`getLink`, `resetLink`, bouton « Nouveau code »). L'arbitre voit les chronos, l'image ou le mot masqué, les réponses acceptées, le type de jeu, la consigne à annoncer et l'usage de la case d'or. Boutons « Bonne réponse » et « Passé ». Messages `st`, `act`, `hi` ; chaque verdict porte l'élément concerné, pour ignorer les doubles clics.
- **Liaison** `link()` : capacité `room` de claude.ai, sinon PeerJS 1.5.4 (identifiant `slc-<code>`, serveurs STUN et relais TURN publics), sinon `BroadcastChannel`.
- **Sons** : `beep`, `go`, `good`, `pass`, `end`, `urgent` (tic-tac des 5 dernières secondes), `capture`, `tick`/`tock`, `impact`, `gold` (case d'or gagnée). Bouton 🔊/🔇 (`slc-sons`). Chrono en rouge à 5 s ou moins.
- **Contenu** : 28 catégories, dont 18 en emojis (441 images) et 10 en mot à trous pour adultes (319 mots). Types : `emoji`, `trous`, `photo`.
- **Éditeur** (`editeur.html`) : catégories perso en mot à trous ou en photos. Stockage dans `localStorage` (`slc-perso`) et IndexedDB (photos réduites à 900 px, vignettes de 200 px). Jouable dès 5 éléments (`MIN`), 20 conseillés. Sauvegarde et restauration en JSON (« Espace parents »). Mot à trous : lettres masquées mot par mot selon le niveau ; niveau automatique d'après le mot le plus long.
- **Intro** : 4 calques webp et `generique.mp3` (musique originale), boutons « Passer » et son, touche Échap. Durée réglée par `DUR` (`intro.js`) et `--slci-dur` (`intro.css`).

## Conventions
- Pas de visuel ni de musique protégés ; pas de marques ni de personnes vivantes dans les catégories.
- `prefers-reduced-motion` respecté partout ; messages annoncés (`aria-live`) ; tout jouable au clavier.
- Tests automatisés : page ouverte avec `?mode=serieux`, écrans 1440×900 et 390×844.

## Risques et points ouverts
- **Jamais testé sur deux vrais appareils avec PeerJS** (ni avec les photos) : priorité, test à faire par Ced.
- Le calque des candidats de l'intro reproduit des candidats reconnaissables de l'émission : à remplacer avant toute publication publique.
- Drapeaux en emoji illisibles sous Windows. Codes à 4 caractères devinables. PeerJS et les relais TURN sont des services publics sans garantie.
- Catégories perso liées à un appareil et un navigateur ; photos d'enfants : usage privé.
- Pas de sauvegarde de partie ; ni pause ni bouton « mauvaise réponse » pour l'arbitre.
- `index.html` est volumineux : le découper en modules facilitera les prochains chantiers.

## Pistes (non priorisées)
Mode solo ; multijoueur en ligne avec serveur (Node.js et WebSocket) ; extras arbitre (mauvaise réponse, pause, annulation) ; vraies images libres ; image floue qui se précise ; niveaux réglables à la main ; devinettes et lettres mélangées ; son de victoire de partie ; photos dans le dépôt.

## Reprendre
« Lis l'état actuel du projet, puis [chantier]. » Fin de chantier : mettre à jour ce fichier et sa copie dans le projet claude.ai (remplacer, pas ajouter).
