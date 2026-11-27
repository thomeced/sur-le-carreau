# PRD : Sur le carreau, version « partageable »

> BMAD, phase 2 (PM). Validé par Ced le 23 novembre 2026.
> Entrée : `docs/brief.md`. Sortie : `docs/ux.md`, puis `docs/architecture.md`.

## 1. Objectifs et contexte
Rendre le jeu jouable par une autre famille, sans Ced : on comprend les règles, l'arbitre sait quoi faire, le contenu tient plusieurs soirées et la TV Samsung affiche correctement. Le jeu reste 100 % statique et gratuit (GitHub Pages, PeerJS public).

**Ordre des epics** (décision de Ced) : E1 prise en main → E2 TV et identité → E3 nouveaux types → E4 contenu.

**Reporté** (décisions de Ced, 27 novembre 2026) : les trois nouveaux types, QCM (EF11, EF12), Gros plan (EF13, EF14) et Devinette (EF15), avec EF16 et leurs 9 catégories (§6), deviennent une évolution future (« on est bien en termes de types de jeu »). Leur spec est gardée telle quelle pour plus tard. E3 se limite à la progressivité (EF23).

## 2. Exigences fonctionnelles

### Prise en main (E1)
- **EF1** : pendant la préparation (« Partie en préparation sur le téléphone… »), l'écran du jeu fait défiler en boucle 5 cartes « Comment jouer » : le duel et la main qui passe, les deux chronos, « Passé » (−3 s), la conquête du territoire et le retour sur le sol, la case d'or. Les cartes s'adaptent au mode choisi (grille ou duel simple).
- **EF2** : les cartes avancent seules (environ 6 s chacune) et respectent `prefers-reduced-motion` (pas d'animation, défilement plus lent).
- **EF3** : à la première connexion d'un téléphone, la régie affiche un guide en 3 écrans (« Vous êtes l'arbitre » ; « Configurez la partie » ; « Jugez à l'oral : Bonne réponse, Passé »). On peut le passer, et il ne revient pas ensuite sur ce téléphone.
- **EF4** : un bouton « ? » dans la régie rouvre le guide à tout moment, sans interrompre la partie.
- **EF5** : à chaque étape d'une partie en grille, l'écran du jeu affiche une phrase d'aide courte (« Léa choisit qui attaquer », « Léa a gagné : elle défie un voisin ou retourne sur le sol », « Retourner sur le sol : un nouvel attaquant est tiré au sort », « Léa peut utiliser sa case d'or : +5 s »).
- **EF6** : avant chaque duel, la régie affiche en évidence la phrase à annoncer aux joueurs (type de jeu et consigne, par exemple « Mot à trous : trouvez le mot complet »).

### TV et identité (E2)
- **EF7** : sur un navigateur qui ne gère pas `color-mix()` (test `CSS.supports`), la vague de capture se joue case par case : chaque case capturée prend la couleur du gagnant avec un délai qui dépend de sa distance au point de départ, sans `clip-path` ni flou. Rien ne déborde des cases capturées.
- **EF8** : des couleurs de secours remplacent toutes les valeurs en `color-mix()` et `backdrop-filter`.
- **EF9** : le calque des candidats de l'intro est remplacé par un visuel original (aucune personne reconnaissable de l'émission).
- **EF10** : une checklist de test réel (deux vrais appareils, PeerJS, TV Samsung, réseau mobile et wifi) est fournie à Ced dans `docs/test-reel.md`, et ses résultats sont consignés.

### Nouveaux types (E3)
- **EF11 (QCM, reportée)** : un élément QCM porte une question, 4 propositions (dont une bonne) et un niveau. L'écran affiche la question et les 4 propositions (A, B, C, D) dans un ordre mélangé à chaque tirage. Le joueur répond à l'oral.
- **EF12 (QCM, arbitrage, reportée)** : pendant un duel QCM, la régie affiche un bouton supplémentaire « Mauvaise réponse ». Il agit comme « Passé » : la bonne réponse s'affiche, −3 s, élément suivant.
- **EF13 (Gros plan, variante, reportée)** : toute catégorie photo peut se jouer en gros plan. Dans la zone « Catégories de la partie », une catégorie photo existe en deux versions : normale et « en gros plan ». En gros plan, l'image commence très zoomée sur un point choisi au hasard dans sa zone centrale (×3 au niveau 1 jusqu'à ×8 au niveau 5), puis se dézoome jusqu'à l'image entière en 10 s environ.
- **EF14 (Gros plan, catégories dédiées, reportée)** : `categories.js` (ou `photos.js`) peut déclarer une catégorie dont le type est `grosplan` d'emblée, éventuellement avec un point de zoom imposé par élément.
- **EF15 (Devinette, reportée)** : un élément Devinette porte 2 à 4 phrases, une réponse (avec variantes) et un niveau. Chaque catégorie Devinette choisit sa présentation : `bloc` (tout affiché d'emblée) ou `revele` (une phrase de plus toutes les 3 s environ, en commençant par la plus vague).
- **EF16 (reportée avec les types)** : chaque nouveau type a son nom, son icône et sa consigne dans `TYPES`, affichés sur la régie (EF6) et dans le choix des catégories.
- **EF17** : l'éditeur de catégories ne change pas (décision de Ced) : les nouveaux types ne se créent que dans `categories.js`.

### Progressivité dans le duel (E3)
- **EF23** : le niveau des éléments suit le **nombre d'éléments déjà joués dans le duel** (bonnes réponses, « Passé » et « Mauvaise réponse », des deux joueurs), et non plus le seul nombre de bonnes réponses. Courbe par défaut, réglable dans une table `LVL_CURVE` : éléments 1 à 3 → niveau 1 ; 4 à 6 → 2 ; 7 à 10 → 3 ; 11 à 14 → 4 ; 15 et plus → 5. Chaque duel repart au niveau 1. Les 5 niveaux sont conservés ; le comportement en cas de niveau manquant ou épuisé ne change pas.
- Écartés par Ced : départ plus haut en fin de partie, mémoire des éléments déjà vus, grille de calibrage des niveaux.

### Contenu (E4)
- **EF18** : toutes les catégories texte (mot à trous, indices, lettres mélangées, titres à l'envers, devinette, QCM) ont **60 éléments, 12 par niveau**.
- **EF19** : les catégories photo et emoji ont **40 éléments, 8 par niveau**.
- **EF20** : le jeu compte **environ 50 catégories** (39 actuelles + une douzaine de nouvelles, voir §6).
- **EF21** : chaque catégorie porte un **domaine** (`dom`) tiré d'une liste fixe (§6). Le tirage au hasard des catégories d'une partie évite de prendre deux catégories du même domaine tant que c'est possible.
- **EF22** : `credits.html` couvre toutes les nouvelles photos ; les règles de licence et de contenu existantes s'appliquent.

## 3. Exigences non fonctionnelles
- **ENF1 (plateformes)** : écran du jeu sur navigateur de TV Samsung (Tizen, ancien Chromium) et sur ordinateur (Chrome, Firefox, Safari, Edge récents). Régie sur Safari iOS et Chrome Android.
- **ENF2 (performance TV)** : la vague de capture et le dézoom du Gros plan restent fluides sur la TV Samsung (pas de saccade visible). Les photos d'une catégorie ne sont chargées que lorsqu'elle est en jeu.
- **ENF3 (statique)** : aucun serveur ni service payant ; GitHub Pages et PeerJS public seulement.
- **ENF4 (accessibilité)** : tout jouable au clavier et à la télécommande (flèches, OK), messages en `aria-live`, `prefers-reduced-motion` respecté (les cartes et le Gros plan compris : en mouvement réduit, le Gros plan se dézoome par paliers).
- **ENF5 (droits)** : aucun nom, logo, son, visuel ou personne reconnaissable de l'émission ; licences libres seulement ; pas de marques ni de personnes vivantes dans le contenu.
- **ENF6 (lisibilité)** : textes de l'écran du jeu lisibles à 3 m sur une TV 1080p (corps minimal à définir en UX) ; QCM et devinettes tiennent sans défilement.
- **ENF7 (qualité du contenu)** : `categories.js` valide chaque nouveau format au chargement (nombre de propositions, une seule bonne réponse, 2 à 4 phrases), comme aujourd'hui pour les autres types.
- **ENF8 (poids)** : dépôt sous 80 Mo ; photos en 640 px.

## 4. Epics

| Epic | Objectif | Exigences |
|---|---|---|
| **E1 Prise en main** | Une famille comprend le jeu et l'arbitre sait quoi faire, sans explication extérieure. | EF1 à EF6 |
| **E2 TV et identité** | Le jeu s'affiche correctement sur la TV Samsung, ne contient plus rien de l'émission, et la liaison a été vérifiée en conditions réelles. | EF7 à EF10 |
| **E3 Nouveaux types et progressivité** | Un duel monte réellement jusqu'aux niveaux 4 et 5 (nouveaux types reportés). | EF23 (EF11 à EF16 reportées) |
| **E4 Contenu** | Environ 50 catégories variées, avec 60 éléments (texte) ou 40 (photo, emoji). | EF18 à EF22 |

Proposition à confirmer en architecture : faire précéder E1 d'une story technique de **découpage d'`index.html`** en modules, puisque chaque epic y touche.

## 5. Hypothèses
- Ced fait lui-même le test réel (EF10) et les téléchargements Commons sur son Mac.
- Le contenu texte est rédigé par Claude et relu par Ced ; les photos sont relues à l'œil par Ced.
- Le navigateur de la TV Samsung gère `CSS.supports`, les transformations CSS (`transform: scale`) et les transitions simples.

## 6. Contenu : domaines et nouvelles catégories (proposition)

**Domaines (`dom`)** : Géographie · Histoire · Cinéma et séries · Musique · Sport et jeux · Sciences et nature · Animaux · Cuisine · Arts et lettres · Langue et mots · Vie quotidienne.

**Nouvelles catégories proposées (12)** :

| Catégorie | Type | Domaine |
|---|---|---|
| Sports et Jeux olympiques | QCM (reportée) | Sport et jeux |
| Sciences du quotidien | QCM (reportée) | Sciences et nature |
| Expressions françaises (sens) | QCM (reportée) | Langue et mots |
| Histoire de France | QCM (reportée) | Histoire |
| Objets de la maison | Devinette (bloc) (reportée) | Vie quotidienne |
| Animaux | Devinette (révélée) (reportée) | Animaux |
| Contes et légendes | Devinette (révélée) (reportée) | Arts et lettres |
| Textures et matières | Gros plan dédié (reportée) | Sciences et nature |
| Objets du quotidien | Gros plan dédié (reportée) | Vie quotidienne |
| Séries et dessins animés | Indices | Cinéma et séries |
| Sports en vrac | Lettres mélangées | Sport et jeux |
| Musique (genres, termes) | Mot à trous | Musique |

Total : 51 catégories proposées, **42** sans les 9 des types reportés, sans compter les variantes Gros plan des 15 catégories photo.

## 7. Questions ouvertes
- Liste des nouvelles catégories (§6) : validée par Ced.
- Corps de texte minimal à 3 m (ENF6) : à fixer en UX.
- Story de découpage d'`index.html` avant E1 : à trancher en architecture.
