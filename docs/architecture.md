# Architecture : Sur le carreau, version « partageable »

> BMAD, phase 3 (Architecte). Validé par Ced le 24 novembre 2026.
> Entrées : `docs/prd.md`, `docs/ux.md`. L'état du code avant ces chantiers est décrit dans `CLAUDE.md`.

## 1. Contraintes qui structurent tout
- **100 % statique**, publié tel quel par GitHub Pages ; aucun outil de build, aucune dépendance npm à l'exécution (ENF3).
- **Navigateur minimal visé : Chromium M94**, celui des TV Samsung 2023 (Tizen 7.0), dont la TV de Ced (TQ55S95C). Source : tableau « Web Engine Specifications » de Samsung Developers. Une mise à jour de Tizen peut l'avoir fait monter, mais on ne compte pas dessus.
- Constaté sur cette TV : `clip-path` sur le SVG ignoré, pas de `color-mix()` (arrivé en M111), animations SVG coûteuses.

### Ce qu'on s'interdit (ou qu'on n'utilise qu'avec un secours)
| Fonction | Disponible depuis | Règle |
|---|---|---|
| `color-mix()` | M111 | seulement avec une couleur de secours déclarée avant |
| `clip-path` sur du SVG, filtres de flou SVG | (ignoré ou lent sur la TV) | jamais en mode allégé (§5.1) |
| `:has()`, requêtes de conteneur, CSS imbriqué | M105 à M112 | interdits |
| `structuredClone` | M98 | interdit |
| Modules ES (`import`) | M61, mais non retenu | scripts classiques (décision de Ced) |
| `?.`, `??`, `Array.prototype.at`, `replaceAll` | ≤ M92 | autorisés |

## 2. Stack
HTML, CSS et JavaScript sans framework ; scripts classiques qui partagent l'espace global, chargés dans un ordre fixe. Bibliothèques externes inchangées : PeerJS 1.5.4 (CDN). Outils hors exécution : Python (photos Commons, générique), Node + Playwright (tests, §8), utilisés seulement par Claude ou Ced, jamais par le jeu.

**Cache de la TV** : chaque `<script>` et `<link>` porte `?v=<VERSION>`, pour que la TV ne garde pas un vieux fichier après une mise à jour. La version est définie une seule fois (`<meta name="slc-version">` d'`index.html`), recopiée dans les trois pages et le pied de l'accueil par `tools/version.py`, lancé dans chaque PR qui touche du code (story 0.3).

## 3. Structure du code après découpage (story 0)
Découpage **à comportement identique** du bloc `<style>` et du bloc `<script>` d'`index.html`, en suivant les sections déjà repérées dans le code :

```
index.html             balisage seulement + ordre de chargement
style.css              le <style> d'origine
js/base.js             DATA, TYPES, normItem, validation (addCats), utilitaires ($, norm, isOk, shuffle, show), LVL_*, DUEL_SEC, isArb, ARB_CODE
js/liaison.js          link(), LTOPICS, PeerJS / BroadcastChannel / room, linkMsg
js/duel.js             niveaux (lvl), tirage des éléments (card), paintCard, chronos, good/skip, rendu du duel, push vers la régie
js/accueil.js          liaison côté écran (onmsg, getLink), connexion de la régie (#pair), accueil, QR code, HOMEST, lancement, applyCfg
js/grille.js           état G, case d'or (GOLD_*, goldEarns), voisinage (gadj, gfoes, gtargets), noms des joueurs
js/choix-categories.js PICK, pdraw, pfill, pickRender…, startGrid
js/plateau.js          plateau SVG, vague de capture, « Retourner sur le sol » (gdraw), gridRender, startGridDuel, gridAfterDuel, boutons du duel
js/regie.js            régie du téléphone (#arbitre), arbView, sendCfg, arbitrage
js/aide.js             AIDE_TXT, cartes « Comment jouer » (story 1.1) ; bandeau et guide à venir (1.2, 1.3)
js/main.js             démarrage (ce qui s'exécutait en fin de script)
```
Ordre de chargement : celui de la liste ci-dessus, qui est l'ordre du code d'origine. Chaque fichier est un morceau contigu de l'ancien script (story 0.2) : c'est pourquoi la logique de la grille est répartie entre `grille.js`, `choix-categories.js` (`startGrid`) et `plateau.js` (`gridRender`, `gridAfterDuel`). Un rangement plus fin se fera, si besoin, dans une story dédiée.
Fichiers existants inchangés : `categories.js`, `photos.js`, `perso.js`, `sons.js`, `intro.js`, `qrcode.js`, `editeur.html`.
Nouveaux fichiers des epics suivants : `js/aide.js` (E1 : cartes, bandeau, guide de l'arbitre ; chargé avant `main.js`), `js/types.js` (E3 : QCM, Gros plan, Devinette), `js/plateau-lite.js` (E2 : vague case par case).

**Règle de la story 0** : aucun renommage, aucune correction au passage ; un fichier par section ; le diff doit pouvoir se relire comme un déplacement. Validée par les tests de non-régression (§8) avant et après.

## 4. Modèle de données

### 4.1 Nouveaux formats d'éléments (`categories.js`)
| Type | Format d'un élément | Forme normalisée (`normItem`) |
|---|---|---|
| `qcm` | `["Question ?", ["bonne réponse", "faux 1", "faux 2", "faux 3"], niveau]` (la première proposition est la bonne ; ses variantes après `|` valent pour l'arbitre) | `['qcm:'+question, bonne, niveau, {q, choix:[4]}]` |
| `devinette` | `[["phrase vague", "phrase plus précise", …], "réponse|variante", niveau]`, de 2 à 4 phrases, de la plus vague à la plus précise | `['dev:'+réponse, réponse, niveau, {lignes}]` |
| `grosplan` | comme `photo`, plus un 5e champ facultatif `[x, y]` (point de zoom en %, de 0 à 100) | comme `photo`, plus `{foyer}` |

- Champ de catégorie **`presentation`** pour `devinette` : `"bloc"` (par défaut) ou `"revele"`.
- **Variante Gros plan** d'une catégorie photo : pas de copie des données. Le choix des catégories utilise la clé `<clé>@gp` ; `DATA['animaux@gp']` est construite au chargement avec les mêmes éléments et `type: 'grosplan'`. Fonctionne aussi pour les catégories photo perso.
- **Zoom** par niveau : `GP_ZOOM = [3, 4, 5, 6.5, 8]`. Foyer sans valeur imposée : tiré au hasard dans le carré central (de 30 à 70 % en x et en y).
- **Validation** (ENF7, au chargement, comme aujourd'hui) : QCM = 4 propositions non vides et toutes différentes ; devinette = 2 à 4 phrases ; foyer = deux nombres de 0 à 100. Un élément invalide est ignoré avec un avertissement en console.

### 4.2 Domaines (EF21)
- Liste fixe `DOMAINES` dans `categories.js` : `geo`, `histoire`, `cinema`, `musique`, `sport`, `sciences`, `animaux`, `cuisine`, `arts`, `langue`, `quotidien`.
- Une table unique `DOM_CAT = {clé: domaine}` dans `categories.js` couvre toutes les catégories, y compris celles de `photos.js` (qui reste généré et n'a pas à changer). Une catégorie sans domaine est rangée dans `autre`, comme les catégories perso.
- Tirage (`pdraw`) : on tire d'abord une catégorie par domaine différent, au hasard ; on ne reprend un domaine que lorsqu'ils sont tous utilisés. Une variante Gros plan compte dans le domaine de sa catégorie d'origine.

### 4.3 Progressivité (EF23)
- `LVL_CURVE = [3, 6, 10, 14]` : seuils du nombre d'éléments déjà joués dans le duel. Niveau = 1 + nombre de seuils atteints (0 à 3 éléments joués → 1 ; 15 et plus → 5).
- Nouveau compteur `S.n` (éléments joués : bonnes réponses, « Passé », « Mauvaise réponse », des deux joueurs), remis à 0 à chaque duel. `lvl()` lit `S.n` au lieu de `S.sc[0] + S.sc[1]`. `LVL_STEP` disparaît.
- Recherche du niveau le plus proche et recyclage d'un niveau épuisé : inchangés.

### 4.4 Stockage local (nouveau)
| Clé | Où | Contenu |
|---|---|---|
| `slc-guide-vu` | téléphone, `localStorage` | `1` quand le guide de l'arbitre a été vu ou passé (EF3) |
Rien d'autre de nouveau : pas de mémoire des éléments déjà vus (écartée par Ced).

## 5. Flux principaux

### 5.1 Mode allégé de la TV (E2)
- `const LITE = !CSS.supports('color', 'color-mix(in srgb, red, blue)') || /[?&]lite=1/.test(location.search)` (le paramètre sert aux tests et au dépannage).
- En mode allégé : `gcapture` délègue à `js/plateau-lite.js`. Chaque case capturée passe à la couleur du gagnant par une transition CSS sur `fill`, avec un délai proportionnel à sa distance (en cases) au bord du duel : environ 90 ms par case, pour une durée totale proche de la vague actuelle. Ni `clip-path`, ni `#gglow`, ni contours recalculés.
- Toujours (allégé ou non) : chaque `color-mix()` du CSS est précédé d'une déclaration de secours en couleur pleine ; `backdrop-filter` reçoit un fond opaque de secours.
- `?debug=1` affiche dans un coin le navigateur détecté (user agent) et l'état de `LITE`, pour que Ced vérifie la TV d'un coup d'œil.

### 5.2 Gros plan (E3)
- Cadre photo existant avec `overflow: hidden` (pas de `clip-path`) ; l'image reçoit `transform-origin: x% y%` et `transform: scale(z)`, puis une transition CSS de 10 s (`cubic-bezier(.2,.6,.3,1)`, qui ralentit à la fin) vers `scale(1)`. Seul `transform` est animé : le plus léger pour la TV.
- À la réponse : transition de 0,4 s vers `scale(1)`.
- Mouvement réduit : 4 paliers posés par `setTimeout` toutes les 2,5 s, sans transition.
- La régie reçoit la photo entière, sans zoom (l'arbitre doit reconnaître la réponse).

### 5.3 Devinette révélée (E3)
- Une ligne de plus toutes les 3 s (`DEV_PAS = 3000`), minuterie arrêtée quand le chrono du joueur s'arrête ou que l'élément change ; lignes à venir en pointillés. À la réponse, toutes les lignes s'affichent.

### 5.4 Messages entre l'écran et la régie
- `act` : nouveau verdict `bad` (« Mauvaise réponse », QCM seulement). L'écran le traite comme « Passé » (réponse révélée, −3 s), et compte l'élément dans `S.n`. Comme aujourd'hui, chaque verdict porte l'élément concerné, pour ignorer les doubles clics.
- `st` : ajoute `extra` selon le type (`choix` pour le QCM, `lignes` pour la devinette) et `qcm: true` pour que la régie affiche le bouton rouge.
- Pas de nouveau sujet de message. Le bandeau d'aide (EF5) et les cartes (EF1) sont calculés sur l'écran du jeu seul ; le guide (EF3) vit sur le téléphone seul.

### 5.5 Aide (E1), dans `js/aide.js`
- `aideCartes(mode)` : démarre ou arrête le carrousel dans le panneau « Partie en préparation » ; arrêté par `gphase()` dès que la partie commence.
- `aideBandeau(texte)` : appelé aux transitions de la grille déjà existantes (choix de l'adversaire, fin de duel, `gdraw`, fin de partie) ; un seul nœud `aria-live="polite"`.
- `guideArbitre(force)` : 3 pages par-dessus la régie ; `force` vient du bouton « ? ».
- Textes centralisés dans un objet `AIDE_TXT` (une seule source pour les cartes, le bandeau et le guide).

## 6. Contenu (E4)
- Rédaction des catégories texte par Claude dans `categories.js`, relecture par Ced. 60 éléments, 12 par niveau (EF18).
- Photos : `tools/photos-commons/liste.txt` étendu à 40 éléments (8 par niveau) par catégorie, plus les 2 catégories Gros plan dédiées ; téléchargement par Ced sur son Mac, relecture à l'œil, puis `tools/photos-js.py` (EF19, EF22). Le type `grosplan` des 2 catégories dédiées est déclaré dans `liste.txt` et repris par `photos-js.py`.
- Emojis : 40 par catégorie, 8 par niveau.
- Script de contrôle `tests/contenu.js` (Node, §8) : nombre d'éléments par catégorie et par niveau, domaine présent, formats valides.

## 7. Déploiement
Inchangé : branche `main` → GitHub Pages (racine). Une story = une branche = une PR, relue et fusionnée par Ced. La version est montée dans chaque PR qui touche du code : `python3 tools/version.py` (§2).

## 8. Standards de code et stratégie de test
**Standards** : style existant (noms courts, commentaires en français qui expliquent le pourquoi) ; aucune nouvelle dépendance ; fonctionnalités limitées à M94 (§1) ; accessibilité (focus visible pour la télécommande, `aria-live`, mouvement réduit) pour tout nouvel écran ; `CLAUDE.md` et sa copie du projet claude.ai mis à jour en fin de story.

**Tests**, dans un nouveau dossier `tests/` (Node + Playwright, lancés par Claude dans sa session ; pas d'intégration continue, pour rester simple) :
| Fichier | Vérifie |
|---|---|
| `tests/fumee.js` | accueil, « Configurer sur cet écran », partie 2×2 complète jusqu'au vainqueur ; aucune erreur en console. Sert de non-régression à chaque story, à commencer par la story 0. |
| `tests/regie.js` | écran + régie dans deux onglets (`BroadcastChannel`) : configuration depuis la régie, verdicts, « Mauvaise réponse » en QCM |
| `tests/types.js` | rendu du QCM, du Gros plan (zoom puis dézoom), de la Devinette (bloc et révélée), en 1440×900 et 390×844 |
| `tests/lite.js` | `?lite=1` : la vague ne colore que les cases capturées (comparaison des couleurs de chaque case avant et après) |
| `tests/niveaux.js` | `LVL_CURVE` : niveau des éléments tirés selon le nombre d'éléments joués |
| `tests/contenu.js` | Node seul : comptes par catégorie et par niveau, domaines, formats |
Tests manuels : `docs/test-reel.md` (EF10), checklist pour Ced sur deux vrais appareils et sur la TV, avec `?debug=1`.

## 9. Couverture du PRD
| Exigence | Où |
|---|---|
| EF1, EF2 | `js/aide.js` (cartes), §5.5 |
| EF3, EF4 | `js/aide.js` (guide), `slc-guide-vu`, §4.4 |
| EF5 | `js/aide.js` (bandeau), appels dans `js/grille.js` |
| EF6 | `js/regie.js`, `TYPES[...].consigne` (existant) |
| EF7, EF8 | `js/plateau-lite.js`, `LITE`, secours CSS, §5.1 |
| EF9 | `assets/intro/` (nouveau calque), sans changement de code prévu |
| EF10 | `docs/test-reel.md`, `?debug=1` |
| EF11, EF12 | `js/types.js`, verdict `bad`, §4.1, §5.4 |
| EF13, EF14 | `js/types.js`, clé `@gp`, `GP_ZOOM`, §5.2 |
| EF15 | `js/types.js`, `presentation`, §5.3 |
| EF16 | `TYPES` de `perso.js` : 3 entrées de plus |
| EF17 | aucun changement de `editeur.html` |
| EF18 à EF20, EF22 | `categories.js`, `liste.txt`, `photos-js.py`, `tests/contenu.js`, §6 |
| EF21 | `DOMAINES`, `DOM_CAT`, `pdraw`, §4.2 |
| EF23 | `LVL_CURVE`, `S.n`, §4.3 |
| ENF1, ENF2 | §1, §5.1, §5.2 ; préchargement des 3 éléments suivants de la catégorie en jeu |
| ENF3 | §2, §7 |
| ENF4 | §8 (standards), mouvement réduit en §5.2, §5.3 |
| ENF5, ENF7, ENF8 | §4.1 (validation), §6 |
| ENF6 | `style.css` : tailles de la spec UX en `clamp()` |

Écart signalé : aucun. Point d'attention : le préchargement (ENF2) est à vérifier dans le code actuel lors de la story 0 ; s'il manque, il fera l'objet d'une story dans E2.

## 10. Risques techniques
- La story 0 touche tout le code : risque de régression. Parade : diff de simple déplacement, test de fumée avant et après, aucune autre modification dans la même PR.
- Le moteur de la TV peut différer du tableau Samsung (navigateur « Internet » mis à jour séparément) : `?debug=1` le dira.
- Playwright tourne sur un Chrome récent : il ne reproduit pas la TV. `?lite=1` simule le mode allégé, mais seul le test réel de Ced fait foi.
