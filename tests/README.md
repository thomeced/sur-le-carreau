# Tests automatiques

Tests de bout en bout du jeu dans un vrai navigateur (Chromium piloté par Playwright). Ils servent de **non-régression** : on les lance avant et après chaque story. Le jeu ne les charge jamais.

## Lancer

Depuis la racine du dépôt :

```
node tests/fumee.js
node tests/regie.js
node tests/aide.js
node tests/lite.js
node tests/photos.js
node tests/niveaux.js
node tests/contenu.js
node tests/intro.js
```

Chaque test sert lui-même le dépôt (`python3 -m http.server` sur un port libre), affiche `OK …` ou `ÉCHEC …` avec la raison, et rend un code de sortie 0 ou 1. `VERBEUX=1 node tests/regie.js` affiche les étapes, pour voir où un test bloque.

**Prérequis** : Node, Python 3 et Playwright avec Chromium. Rien n'est installé dans le dépôt (pas de `package.json`) : Playwright est pris dans l'environnement de Claude. Sur un autre ordinateur : `npm install -g playwright` puis `npx playwright install chromium`, et `NODE_PATH` qui pointe vers les modules globaux (`export NODE_PATH=$(npm root -g)`).

## Ce que couvre chaque test

| Fichier | Vérifie | Durée |
|---|---|---|
| `fumee.js` | Partie complète en grille 2×2 : accueil (`?mode=serieux`, 1440×900), « Configurer sur cet écran », tirage de 4 catégories, 3 duels (adversaire, « Lancer le duel », « Démarrer le duel », une « Bonne réponse » et un « Passé » envoyés par la régie, chronos vidés), jusqu'à « … remporte la partie ! » avec 1 joueur en lice ; puis vérifie que chaque fichier CSS et JS a été demandé avec `?v=<version>` (cache de la TV) et que le pied de l'accueil affiche cette version. | ~13 s |
| `regie.js` | Écran et régie (390×844) dans deux onglets. Guide de l'arbitre : affiché à la 1re connexion (3 pages, « Suivant », glissement, miniatures, « C'est parti », boutons ≥ 44 px), plus après un rechargement, rouvert par « ? » pendant un duel et fermé par « Passer » (annoncé). Puis la régie configure un duel simple et le lance ; la consigne à annoncer s'affiche en 24 px gras avant « Démarrer le duel », puis sur une ligne pendant le duel ; « Bonne réponse » donne 1 point et passe la main sans toucher aux chronos ; « Passé » affiche la réponse et retire exactement 3 s au joueur qui a la main ; la régie affiche les mêmes chronos que l'écran. | ~5 s |
| `aide.js` | Aide à la prise en main en 1920×1080. Cartes « Comment jouer » : apparition pendant la préparation (5 en grille), titre ≥ 56 px et phrase ≥ 40 px, panneau à 60 % de la largeur, 2e carte après 6 s, 3 cartes quand la régie passe en duel simple, disparition au lancement sans minuterie restante, redémarrage après « Arrêter la partie » avec une seule minuterie, mouvement réduit (9 s, sans fondu). Bandeau du plateau (grille 2×2) : un seul nœud `aria-live`, ≥ 32 px, les 5 phrases, absent du duel simple. | ~10 s |
| `lite.js` | Mode allégé (TV) : aucun `color-mix()` sans couleur de secours (ni avec `var()`) dans `style.css` et `intro.css` ; page normale sans mode allégé ; `?lite=1&debug=1` : classe `lite`, panneaux sans flou à fond opaque, cadre de débogage ; navigateur sans `color-mix()` simulé : mode allégé détecté seul. Vague case par case (`?lite=1`, grille 2×2) : aucun flou sur le plateau, rien de dessiné hors des cases, cases non capturées inchangées, cases capturées à la couleur du gagnant, délais croissants avec la distance, fin propre. | ~5 s |
| `photos.js` | Préchargement : duel simple dans une catégorie photo ; rien avant le lancement ; photo tirée et 3 suivantes demandées avant le départ ; chaque photo affichée après un verdict avait été demandée avant ; rien hors de la catégorie. | ~2 s |
| `niveaux.js` | Progressivité : `niveauPour(n)` suit `LVL_CURVE` ; duel simple dans une catégorie texte (8 éléments par niveau), 16 verdicts alternés « Bonne réponse » / « Passé » : niveaux tirés 1,1,1,2,2,2,3,3,3,3,4,4,4,4,5,5 ; un verdict reçu deux fois ne compte qu'une fois ; nouveau duel au niveau 1. | ~9 s |
| `contenu.js` | Contenu et tirage : aucun élément ignoré à la validation (avertissements de la console) ; chaque catégorie de `categories.js` et `photos.js` a un domaine valide dans `DOM_CAT`, qui ne cite aucune catégorie inexistante ; tirage équilibré par domaine (`ptirer`, `pdraw`, `pfill`) sur 1 800 tirages en 2×2, 3×3 et 4×4. Masquage du mot à trous : part de lettres cachées croissante du niveau 1 au niveau 5, aucun mot entièrement caché. Affiche les quantités par catégorie et par niveau face aux objectifs d'E4 ; `node tests/contenu.js --strict` les exige. | ~1 s |
| `intro.js` | Intro en mode funky (15 s) : 15 images (plateau, animateur en pied, 12 candidats, logo) chargées ; à 6 s la caméra a avancé (animateur plus grand, candidat le plus proche sorti du champ) ; à 12,5 s l'animateur est entier, au moins 1,6 fois plus grand, sous le logo ; « Passer l'intro » rend la main au jeu. | ~14 s |
| `serveur.js` | Pas un test : utilitaire commun (serveur local, navigateur, collecte des erreurs, ouverture de l'écran et de la régie reliée). | |

Les deux tests **échouent à la moindre erreur JavaScript ou `console.error`**, dans l'écran comme dans la régie.

## Comment ça marche

- **Guide de l'arbitre** : `ouvrirEcranEtRegie` le marque comme déjà vu dans l'onglet de la régie (`slc-guide-vu`), sauf avec l'option `guide: true` (utilisée par `regie.js`).
- **Deux onglets, un seul navigateur** : l'écran du jeu sur `index.html?mode=serieux`, la régie sur `index.html#arbitre=CODE` (code lu dans `#hcode`). Ils se parlent par `BroadcastChannel`. La régie est nécessaire même au test de fumée : sans elle, « Démarrer le duel » reste bloqué.
- **Hors ligne** : toute requête qui ne vise pas le serveur local (PeerJS sur jsDelivr, Google Fonts) reçoit une réponse vide. PeerJS n'est donc pas chargé et la liaison passe toujours par `BroadcastChannel`, que le réseau soit ouvert ou non. La liaison PeerJS entre deux vrais appareils n'est pas testée ici (test réel de Ced).
- **Horloge simulée** (`clock` de Playwright, commune aux deux onglets) : le temps s'écoule normalement, mais le test l'avance d'un coup pour vider un chrono de 40 s, ou l'arrête pour comparer les chronos à la seconde près. `DUEL_SEC` est une constante (`const`) : on ne peut pas la changer depuis le test, et ce n'est pas nécessaire.
- **Code du jeu intact** : les tests ne passent que par ce que voit un joueur (boutons, textes) ; les seuls accès internes sont des lectures d'éléments de la page.

## Tests prévus (architecture, §8)

`tests/types.js` (E3), `tests/niveaux.js` (E3), `tests/contenu.js` (E4).
