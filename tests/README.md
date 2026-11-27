# Tests automatiques

Tests de bout en bout du jeu dans un vrai navigateur (Chromium piloté par Playwright). Ils servent de **non-régression** : on les lance avant et après chaque story. Le jeu ne les charge jamais.

## Lancer

Depuis la racine du dépôt :

```
node tests/fumee.js
node tests/regie.js
```

Chaque test sert lui-même le dépôt (`python3 -m http.server` sur un port libre), affiche `OK …` ou `ÉCHEC …` avec la raison, et rend un code de sortie 0 ou 1. `VERBEUX=1 node tests/regie.js` affiche les étapes, pour voir où un test bloque.

**Prérequis** : Node, Python 3 et Playwright avec Chromium. Rien n'est installé dans le dépôt (pas de `package.json`) : Playwright est pris dans l'environnement de Claude. Sur un autre ordinateur : `npm install -g playwright` puis `npx playwright install chromium`, et `NODE_PATH` qui pointe vers les modules globaux (`export NODE_PATH=$(npm root -g)`).

## Ce que couvre chaque test

| Fichier | Vérifie | Durée |
|---|---|---|
| `fumee.js` | Partie complète en grille 2×2 : accueil (`?mode=serieux`, 1440×900), « Configurer sur cet écran », tirage de 4 catégories, 3 duels (adversaire, « Lancer le duel », « Démarrer le duel », une « Bonne réponse » et un « Passé » envoyés par la régie, chronos vidés), jusqu'à « … remporte la partie ! » avec 1 joueur en lice. | ~13 s |
| `regie.js` | Écran et régie dans deux onglets : la régie configure un duel simple (noms, catégorie), le lance et le démarre ; « Bonne réponse » donne 1 point et passe la main sans toucher aux chronos ; « Passé » affiche la réponse et retire exactement 3 s au joueur qui a la main ; la régie affiche les mêmes chronos que l'écran. | ~2 s |
| `serveur.js` | Pas un test : utilitaire commun (serveur local, navigateur, collecte des erreurs, ouverture de l'écran et de la régie reliée). | |

Les deux tests **échouent à la moindre erreur JavaScript ou `console.error`**, dans l'écran comme dans la régie.

## Comment ça marche

- **Deux onglets, un seul navigateur** : l'écran du jeu sur `index.html?mode=serieux`, la régie sur `index.html#arbitre=CODE` (code lu dans `#hcode`). Ils se parlent par `BroadcastChannel`. La régie est nécessaire même au test de fumée : sans elle, « Démarrer le duel » reste bloqué.
- **Hors ligne** : toute requête qui ne vise pas le serveur local (PeerJS sur jsDelivr, Google Fonts) reçoit une réponse vide. PeerJS n'est donc pas chargé et la liaison passe toujours par `BroadcastChannel`, que le réseau soit ouvert ou non. La liaison PeerJS entre deux vrais appareils n'est pas testée ici (test réel de Ced).
- **Horloge simulée** (`clock` de Playwright, commune aux deux onglets) : le temps s'écoule normalement, mais le test l'avance d'un coup pour vider un chrono de 40 s, ou l'arrête pour comparer les chronos à la seconde près. `DUEL_SEC` est une constante (`const`) : on ne peut pas la changer depuis le test, et ce n'est pas nécessaire.
- **Code du jeu intact** : les tests ne passent que par ce que voit un joueur (boutons, textes) ; les seuls accès internes sont des lectures d'éléments de la page.

## Tests prévus (architecture, §8)

`tests/types.js` (E3), `tests/lite.js` (E2), `tests/niveaux.js` (E3), `tests/contenu.js` (E4).
