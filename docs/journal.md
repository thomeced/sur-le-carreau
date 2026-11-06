> **Historique figé (novembre 2026).** L'état actuel du projet est dans [`CLAUDE.md`](../CLAUDE.md). Ce journal n'est plus mis à jour section par section ; il sert de mémoire des décisions passées.

# Projet : jeu web inspiré de The Floor ("Sur le carreau")

## Objectif
Réaliser un jeu web inspiré du jeu télévisé The Floor : des duels de catégories sur une grille de territoires. Nom de travail : « Sur le carreau » (nom et identité visuelle propres, pour ne pas reprendre ceux de l'émission, qui sont protégés).

## Versionnage (novembre 2026)
- Dépôt GitHub : https://github.com/thomeced/sur-le-carreau (branche `main`).
- Dans le dépôt : `index.html` (le jeu, pour GitHub Pages), `categories.js` (les catégories), `intro.js`, `intro.css` et `assets/intro/` (l'intro), `tools/generique-intro.py` (génération du générique), `docs/journal.md` (ce document, anciennement `docs/contexte-projet.md`), `README.md` et `.gitignore`.
- Commits signés avec l'adresse anonyme `thomeced@users.noreply.github.com` (l'adresse personnelle est protégée par GitHub). Modifications proposées par Claude via des demandes de fusion (PR) que Ced relit et fusionne.
- Hébergement via GitHub Pages (Settings → Pages → branche `main`, dossier racine) : à activer par le propriétaire du dépôt. La liaison arbitre entre deux appareils y passe par PeerJS (voir « Hébergement et liaison »).

## Règles du duel retenues
- Deux joueurs, une catégorie (animaux, fruits et légumes, transports…), des images qui défilent.
- Chaque joueur a un chrono (40 ou 45 s) qui ne tourne que pendant son tour.
- Il faut nommer ce qu'on voit. Une bonne réponse passe la main à l'adversaire.
- On peut passer : la réponse est révélée et le joueur perd 3 s.
- Celui dont le temps tombe à zéro perd.
- Dans le jeu complet, le gagnant récupère le territoire et la catégorie de l'adversaire sur une grille.

## Plan de développement
1. Duel jouable à deux sur le même écran, une catégorie. **(fait)**
2. Plusieurs catégories et validation de réponses robuste. **(fait en partie : 3 catégories, tolérance aux accents, articles et petites fautes via distance de Levenshtein)**
3. Grille de cases et conquête de territoires. **(fait, novembre 2026)**
4. Mode solo contre l'ordinateur ou mode défi.
5. Multijoueur en ligne : Node.js + WebSocket (Socket.IO), le serveur arbitre les chronos et les réponses.
6. Finitions : sons, animations, mobile, éventuellement réponse vocale (Web Speech API). **(intro animée faite, novembre 2026)**

## Mode arbitre (ajouté en novembre 2026)
- Besoin : réponses données à l'oral, un arbitre valide avec des boutons (« Bonne réponse » ou « Passé », −3 s), sur une page à part qui communique avec le jeu.
- Réalisation : même fichier, la vue arbitre s'ouvre en ajoutant `#arbitre` à l'adresse de la page. Le jeu affiche un code à 4 caractères (choix « À l'oral, validées par un arbitre » au départ), l'arbitre le saisit, voit l'image, la réponse attendue et les chronos, puis valide. Le duel démarre quand l'arbitre est connecté.
- Transport : capacité `room` d'Artifact (appareils différents, comptes claude.ai uniquement) et `BroadcastChannel` (deux onglets du même navigateur). Messages : `st` (état du jeu), `act` (décision de l'arbitre), `hi` (présence de l'arbitre).
- Hors claude.ai, la liaison passe par PeerJS (voir « Hébergement et liaison » plus bas). Pour un vrai multijoueur en ligne avec serveur de référence pour les chronos, il faudra un serveur (étape 5 du plan).

## Décisions prises
- Premier prototype : duel à deux joueurs sur le même écran.
- Images du prototype : emojis (les images externes ne se chargent pas dans une page publiée). À remplacer plus tard par des visuels libres de droits (Wikimedia Commons) ou originaux. Les logos et marques posent des questions de droits.
- Contenu : une entrée par catégorie dans `categories.js`, avec une ligne `[emoji, réponses acceptées séparées par |, niveau]` par image.

## État du prototype
Style mis à jour (novembre 2026) pour correspondre à l'ambiance du plateau.
Fichiers : `index.html` (le jeu : HTML, CSS, JS) et `categories.js` (les catégories), sans autre dépendance qu'une police Google Fonts. Intro animée dans `intro.js`, `intro.css` et `assets/intro/` (voir « Intro animée »).
- Écran de départ : noms des joueurs, catégorie, durée.
- Duel : chronos, carte d'image, champ de réponse (ou arbitre), bouton « Passer (−3 s) », écran de fin.
- Validation : minuscules, accents retirés, articles retirés, tolérance de 1 faute (mots de 5 lettres ou plus) ou 2 fautes (9 lettres ou plus).

## Direction visuelle (référence : photo du plateau de l'émission)
- Ambiance : plateau de télévision, sol bleu électrique quadrillé de lignes blanches, ciel noir étoilé, projecteurs, grand écran lumineux bleu, animateur en veste blanche.
- Traduit dans le prototype : fond noir étoilé avec halo de lumière, sol bleu en perspective et grille blanche, panneaux sombres translucides aux angles peu arrondis, carte d'image encadrée comme un écran lumineux, joueur actif entouré d'un halo (ambre pour le joueur 1, cyan pour le joueur 2). Thème sombre uniquement, pour garder l'ambiance plateau.
- On reprend l'ambiance, pas l'identité : pas de logo, pas de police ni de nom de l'émission. Le visuel de référence sert uniquement de moodboard et n'est pas intégré au jeu.

## Vue arbitre (novembre 2026)
- Mode « Réponses : à l'oral, validées par un arbitre » : les joueurs répondent de vive voix, l'arbitre juge depuis sa propre page.
- La vue arbitre est dans le même fichier que le jeu (`index.html`), accessible par le bouton « Je suis l'arbitre » de l'écran de départ (ou par `#arbitre` dans l'adresse).
- Appairage : l'écran du duel affiche un code à 4 caractères ; l'arbitre le saisit sur sa page. Le duel ne démarre que sur clic du bouton « Démarrer le duel », activé une fois l'arbitre connecté.
- L'arbitre voit les deux chronos, l'image en cours et la réponse attendue avec ses variantes. Deux boutons : « Bonne réponse » (passe la main) et « Passé (−3 s) » (révèle la réponse).
- Communication : capacité `room` des artefacts claude.ai (messages `st`, `act`, `hi` dans une salle nommée d'après le code), avec `BroadcastChannel` en secours entre deux onglets du même navigateur. Chaque verdict porte l'image concernée pour ignorer les doubles clics ou les retards.
- Limites connues : pas de bouton « mauvaise réponse » ni de pause ; la communication via PeerJS n'a pas encore été testée en conditions réelles (voir « Hébergement et liaison »).

## Niveaux de difficulté et thèmes (novembre 2026)
- Chaque image porte un niveau de 1 à 3 : `['🐘','éléphant',1]`. Le niveau monte avec le nombre total de bonnes réponses du duel (+1 tous les 4), et le niveau en cours est affiché aux joueurs et à l'arbitre. Un niveau épuisé est recyclé plutôt que de redescendre.
- Thèmes d'origine : animaux, fruits et légumes, transports, drapeaux, films en rébus d'emojis, jeux vidéo (12 autres ajoutés avec la grille). Les rébus n'utilisent que des titres et des emojis génériques (pas de personnages ni de logos protégés).
- Limite : les drapeaux en emoji ne s'affichent pas sous Windows (les lettres du pays apparaissent à la place).
- Idées non faites : image floue qui se précise avec bonus de vitesse, pénalité de « passer » croissante, vraies images (Wikimedia Commons ou originales), thèmes monuments et plats du monde.

## Hébergement et liaison (novembre 2026)
- Dépôt : https://github.com/thomeced/sur-le-carreau (branche `main`, `index.html` à la racine), publié avec GitHub Pages. La même page est aussi publiée comme artefact sur claude.ai pour tester les évolutions.
- `link()` essaie trois chemins dans l'ordre : capacité `room` de claude.ai, puis PeerJS (script `peerjs@1.5.4` chargé à la demande depuis jsDelivr, service de mise en relation public gratuit), puis `BroadcastChannel`. Les messages (`st`, `act`, `hi`) sont les mêmes sur les trois.
- PeerJS : le jeu crée un pair d'identifiant `slc-<code>` ; si le code est déjà pris, un autre est tiré (jusqu'à 8 essais). L'arbitre s'y connecte et réessaie toutes les 2 s tant que ce n'est pas fait. Connexion directe entre appareils, sans serveur à maintenir.
- Limites : le service public est sans garantie de disponibilité ; la connexion directe peut échouer sur certains réseaux mobiles (pas de relais TURN). Les codes à 4 caractères sont devinables : acceptable pour un jeu de salon, à renforcer pour un usage public.
- Test : la logique de liaison a été vérifiée avec un faux PeerJS dans un navigateur automatisé (2 pages, code déjà pris, démarrage, verdict « bonne réponse », verdict « passé », repli sans liaison). Elle n'a pas encore été essayée avec le vrai service PeerJS sur deux appareils.

## Compte à rebours, code d'arbitre conservé, catégories externes (novembre 2026)
- Compte à rebours 3-2-1 avant chaque duel (mode arbitre). Le chrono et les réponses ne démarrent qu'après ; l'arbitre voit aussi le décompte (`count` dans l'état `st`). Pas de son pour l'instant.
- Le code d'arbitre est conservé d'une partie à l'autre (`getLink()` ouvre la liaison une seule fois, `resetLink()` la ferme). L'arbitre n'a pas à recharger sa page : il voit « Duel terminé · en attente du prochain duel », puis le duel suivant. Bouton « Nouveau code » sur l'écran d'attente. Le bouton Démarrer est activé tout de suite si l'arbitre a été vu dans les 7 dernières secondes.
- Les catégories sont dans `categories.js` (`const CATEGORIES = {…}`, une ligne `["emoji", "réponse|autre", niveau]` par image), chargé par `<script src="categories.js">` avant le script du jeu (fonctionne en ouvrant le fichier directement, contrairement à un `fetch` de JSON). Le jeu valide les données au chargement : lignes, doublons et catégories invalides sont ignorés avec un avertissement en console ; si le fichier manque, un message s'affiche et le lancement est désactivé.
- Artefact claude.ai : page unique, `categories.js` est inséré dans le HTML au moment de la publication (la balise `<script src="categories.js"></script>` est remplacée par son contenu). Le fichier du projet `sur-le-carreau.html` est cette version autonome ; la référence reste le dépôt.
- Prochaine étape pour les catégories : un éditeur (ajout d'images dans la page, export du `categories.js`).

## Grille de territoires (novembre 2026)
- Choix « Mode de jeu : grille » au départ ; taille 2×2, 3×3 ou 4×4 (désactivée si moins de catégories que de cases) ; un joueur par case, noms saisis (par défaut « Joueur n »), conservés quand on change la taille.
- 18 catégories (441 images) pour que chaque case ait une catégorie distincte (tirage aléatoire).
- Règles : on attaque un joueur voisin (n'importe quelle case de son territoire) et le duel se joue dans sa **catégorie d'origine** (celle de sa case de départ ; les catégories des cases conquises disparaissent) ; le perdant est éliminé, le gagnant prend toutes ses cases et choisit ensuite un voisin orthogonal à défier, ou **retourne sur le sol** (voir « Plateau de jeu en SVG ») ; dernier joueur en lice = vainqueur. Le premier attaquant est tiré au sort.
- Écran de grille : plateau SVG (voir « Plateau de jeu en SVG »), violet = joueur en cours, bleu clair = adversaires possibles, panneau « X défie Y en <catégorie> », boutons « Lancer le duel » / « Changer d'adversaire ». Après un duel : « Retour à la grille ». Possible de revenir à la grille avant le départ du duel (`#wback`).
- Mode arbitre dans la grille : le même code est réutilisé d'un duel à l'autre ; l'arbitre voit « Catégorie : X » et « Duel terminé · en attente du prochain duel ». Il ne choisit pas la case : cela se fait sur l'écran du jeu.
- Tests (navigateur automatisé) : tailles 2/3/4, voisinage, partie 2×2 jusqu'au vainqueur, grille avec arbitre simulé. Pas encore essayé avec deux vrais appareils ni le vrai PeerJS.
- Limites : pas de sauvegarde ni de reprise d'une grille ; pas de mode équipes ; 4-voisinage uniquement.

## Prochaines étapes suggérées
- Extras arbitre : bouton « mauvaise réponse », pause, annulation (mis de côté pour l'instant) ; vraies images ; image floue qui se précise ; mode solo.
- Éditeur de catégories : premier jet fait (mots à trous, photos) ; suites possibles listées dans sa section.
- Intro : remplacer les candidats par des silhouettes ou des personnages inventés avant une publication publique (voir « Intro animée »).

## Réglages de départ simplifiés (novembre 2026)
- Le mode « au clavier » est supprimé de l'écran de départ : les réponses se donnent toujours à l'oral, validées par un arbitre (le code interne du mode clavier reste dans `index.html`, inutilisé, et sert seulement aux tests automatisés).
- Temps par joueur : 40 ou 45 secondes (45 par défaut).
- Mode par défaut : grille de territoires ; taille par défaut 4×4 (3×3 puis 2×2 si pas assez de catégories).
- Le texte sous le titre (`#lead`) change selon le mode de jeu.

## Intro animée (faite, novembre 2026)
Réalisée dans une conversation séparée du même projet, sans toucher à la logique du jeu.
- **Scène** : plateau vu par la caméra, composition reprise de la photo de référence. Décor au fond, animateur devant l'écran, et une file de candidats de chaque côté, en grand et resserrés vers le centre pour créer un effet « tunnel » vers l'animateur. Sol bleu quadrillé (CSS, comme dans le jeu), ciel étoilé.
- **Déroulé (10 s, demandé par Ced)** : fondu d'ouverture, puis la caméra avance vers l'animateur de 1 s à 7,5 s environ. Chaque calque grossit à sa propre vitesse (décor ×1,45, sol ×1,7, animateur ×2,3, candidats ×3 avec sortie par les côtés vers 6,8 s), ce qui crée la profondeur. Le titre « Sur le carreau » apparaît en bas vers 7-8 s et reste affiché jusqu'au fondu vers l'écran de départ.
- **Placement des candidats** (`intro.css`) : `.slci-cl` à gauche (left −1 %, largeur 43 %), `.slci-cr` à droite (left 58 %, largeur 49 %), haut à 23 % de la scène ; l'animateur reste visible entre les deux groupes.
- **Calques** : image fournie par Ced (PNG avec un damier dessiné, pas de vraie transparence). Le damier a été retiré d'après sa couleur, puis l'image a été découpée en 4 calques : `decor.webp`, `host.webp`, `cand-left.webp`, `cand-right.webp` (les candidats en deux groupes). 184 Ko au total.
- **Logo** : le logo de l'émission sur l'écran du décor a été remplacé par un mur de dalles bleues neutre ; le texte « Sur le carreau » y est affiché en HTML.
- **Fichiers** : `intro.js`, `intro.css` (classes préfixées `.slci`), `assets/intro/*.webp` et `assets/intro/generique.mp3`, à la racine du dépôt. Installation : une seule ligne dans le `<head>` de `index.html`, après la feuille de style, sans `defer` : `<script src="intro.js"></script>`. Le script charge lui-même `intro.css` et les images, et masque le jeu (`main`) pendant l'intro. Durée réglée à deux endroits : `--slci-dur` dans `intro.css` et `DUR` dans `intro.js`.
- **Comportement** : bouton « Passer l'intro » et touche Échap ; pas d'intro sur la vue arbitre (`#arbitre`) ; intro sautée si une image ne charge pas (délai max. 6 s) ; mode « animations réduites » : fondu court sans zoom (2,4 s). Événement `slc:intro-end` sur `document` à la fin.
- **Version autonome** (artefact claude.ai, aperçu) : définir `window.SLC_INTRO_ASSETS = {decor, host, candLeft, candRight, music}` (adresses data: en base64) et `window.SLC_INTRO_CSS_INLINE = true` avant le script, CSS inséré dans une balise style. Le texte d'`intro.js` ne doit pas contenir de balise de fermeture de script (sinon il casse une fois inséré dans la page).
- **Tests** : captures dans un navigateur automatisé, sur ordinateur (1440×900) et sur mobile (390×844), sans erreur JavaScript. Sur mobile (portrait), l'image est recadrée au centre : on voit surtout l'animateur, les candidats sortent vite du cadre.
- **Son (générique)** : `assets/intro/generique.mp3` (10 s, 157 Ko), musique originale générée en code par `tools/generique-intro.py` (Python, numpy/scipy ; relancer puis convertir en MP3 avec ffmpeg pour la modifier). Style jeu télé électro à 120 bpm : nappe d'ouverture (0-1 s), basse et arpège pulsés avec filtre qui s'ouvre pendant le zoom (accords La mineur, Fa, Sol, 1-7 s), roulement de caisse claire qui accélère et montée de bruit (5-7 s), impact au moment où le titre apparaît (7 s : grosse caisse, chute de sub, cymbale, accord de La majeur), petit motif final puis fondu jusqu'à 10 s. Pas de reprise de la musique de l'émission (protégée).
- **Bouton son** : « 🔇 Son / 🔊 Son » à côté de « Passer l'intro ». Coupé par défaut, car les navigateurs bloquent le son sans geste de l'utilisateur. Activé en cours d'intro, la musique reprend au bon moment (calée sur le temps écoulé). Le choix est retenu (`localStorage`, clé `slc-intro-son`) et réessayé à la visite suivante ; si le navigateur refuse, le bouton repasse sur « coupé ». Fondu de sortie du son à la fin ou quand on passe l'intro.
- **Choix par défaut, à revoir si besoin** : intro à chaque ouverture de la page (pas de mémoire du navigateur).
- **Point d'attention** : le calque des candidats reproduit des candidats reconnaissables de l'émission. À remplacer par des silhouettes ou des personnages inventés avant une publication publique sur GitHub Pages.

## Écran de lancement : mode funky / mode sérieux (novembre 2026)
- Au chargement de la page (hors vue arbitre), un écran propose deux boutons : **Mode funky** (générique animé + son activé : le clic est le geste qui autorise le son) et **Mode sérieux** (pas d'intro, fond noir uni sans étoiles ni sol bleu, sans lueur sur le titre). Le dernier choix est retenu (`localStorage`, clé `slc-mode`) et pré-sélectionné, mais l'écran revient à chaque ouverture.
- Liens directs, pour sauter l'écran : `?mode=serieux` (idéal en favori au bureau) et `?mode=funky` (le son suit alors le dernier choix, car il faut un geste pour l'activer).
- Mise en œuvre : tout dans `intro.js` et `intro.css` (écran `.slcl`, classe `slc-serieux` sur `<html>`) ; `index.html` n'a pas changé. Pas d'écran de lancement ni d'intro sur `#arbitre`.
- Limite : le mode sérieux ne s'applique pas à la page arbitre (autre appareil, autre navigateur). Les tests automatisés ouvrent le jeu avec `?mode=serieux`.
- Version autonome (aperçu claude.ai) : pas encore reconstruite avec l'intro ni l'écran de lancement.

## Sons du jeu et chrono rouge (novembre 2026)
- `sons.js` (chargé après `intro.js`) : sons synthétisés avec la Web Audio API, sans fichier audio ni droits à gérer. Cinq sons : `beep` (bip de chaque chiffre du 3-2-1), `go` (départ), `good` (bonne réponse), `pass` (passé), `end` (fin de temps). Appelés depuis `index.html` par la fonction `snd(nom)` (dans `launch`, `begin`, `good`, `skip`, `finish`). Les sons sont joués sur l'écran du jeu, pas sur la page arbitre.
- Réglage : bouton 🔊/🔇 en haut à droite (absent de la vue arbitre), retenu dans `localStorage` (clé `slc-sons`). Le choix du mode au lancement le fixe : funky = sons actifs, sérieux = sons coupés ; avec `?mode=serieux` sans choix enregistré, les sons sont coupés aussi.
- Chrono : le nombre du joueur passe en rouge quand il lui reste 5 secondes ou moins (avant : moins de 10 s), sur l'écran du jeu et sur la page arbitre.
- **Tic-tac des 5 dernières secondes** (son `urgent` dans `sons.js`, déclenché par `tick()` dans `index.html`) : un son à chaque seconde franchie à 5, 4, 3, 2 et 1 s du joueur qui a la main, en même temps que le chiffre affiché. Tic et tac alternés, de plus en plus aigus et forts, avec un petit bip en plus à 1 s ; à 0, c'est le son `end`. Une passe (−3 s) qui fait sauter des secondes ne joue pas de rafale : le tic-tac reprend à la seconde suivante. Il s'arrête pendant le tour de l'adversaire et reprend quand la main revient. Joué sur l'écran du jeu seulement, et coupé avec les autres sons (bouton 🔊/🔇, mode sérieux).
- Idées non faites : son de victoire de partie (le son de capture est fait, voir « Plateau de jeu en SVG »).

## Chantiers à venir (briefs, novembre 2026)
Chaque chantier est prévu dans sa propre conversation du projet, sur sa propre branche, avec une PR.
### Éditeur de catégories (premier jet fait : voir « Éditeur de catégories : mots à trous et photos »)
- Besoin (Ced) : ajouter facilement des catégories et des images sans toucher au code, y compris par sa fille. Les catégories sont aujourd'hui dans `categories.js` (`const CATEGORIES={clé:{label,items:[[emoji,"réponse|variante",niveau 1-3],…]}}`, validé au chargement par `index.html`).
- Piste : page d'édition (par exemple `editeur.html` ou une vue de l'application) pour créer et modifier catégories et images, avec export du `categories.js` à copier dans le dépôt, ou enregistrement local (`localStorage`) fusionné avec `categories.js`. À trancher avec Ced selon qui doit pouvoir éditer et où.
- **Vision à terme** : d'autres types de jeux, par exemple **basés sur des propositions textuelles** (et non des images emoji). Le format des données devra donc distinguer le type d'élément (image, texte, etc.) sans casser l'existant : prévoir un champ de type, ou une structure extensible, et ne pas lier l'éditeur au seul format `[emoji, réponse, niveau]`.

## Plateau de jeu en SVG (fait, novembre 2026)
- La grille de boutons est remplacée par un plateau SVG (`#gboard`), dessiné à la largeur réelle de l'écran (texte en pixels, donc lisible sur mobile) et redessiné si la largeur change ou quand la police est chargée.
- **Formes** (précisé par Ced) : le quadrillage de base reste droit, une case carrée par joueur. Les formes irrégulières, façon pièces de Tetris, naissent des captures : les cases d'un même joueur sont fusionnées visuellement. Voisinage inchangé (`gadj`, `gtargets`, règles).
- **Territoires** : les cases d'un même joueur sont séparées par un trait blanc très léger ; frontières entre joueurs et bord du plateau en trait blanc franc (toutes les bordures sont blanches). Seule la **case d'origine** d'un joueur en lice porte une étiquette : son nom (un peu plus grand quand le territoire grandit) et sa catégorie d'origine. Les cases conquises n'ont plus de libellé (retour de Ced : un joueur ne peut être attaqué que sur sa catégorie d'origine). Noms longs : police réduite jusqu'à 11 px, puis « … » ; catégorie sur 2 lignes au plus.
- **Couleurs** (`GC`, `gfill`, retour de Ced) : un bleu unique `#1B3DB0` pour toutes les cases ; violet `#7A3FD8` pour le territoire du joueur en cours ; bleu clair `#3D78EA` pour les territoires des adversaires possibles ; bleu plus clair `#6A9CFF` pour l'adversaire choisi. Contour blanc lumineux autour du joueur en cours et de l'adversaire choisi.
- **Sélection** : on choisit un joueur (`G.sel` = numéro du joueur) en touchant n'importe quelle case de son territoire ; `gfoes()` donne les adversaires possibles, `gtargets()` leurs cases.
- **Retourner sur le sol** (`gdraw`) : bouton sur l'écran de grille. Le joueur en cours rend la main et un autre candidat est tiré au sort, en priorité parmi ceux qui n'ont pas encore joué (`G.played` : attaquants et défenseurs des duels passés) ; à défaut, parmi tous les joueurs en lice. Pendant 6 s, les territoires des candidats tirables s'allument au hasard en bleus clairs (un ou deux à la fois, de plus en plus lentement), avec un tic-tac rythmé (`tick`/`tock`). Puis le candidat tiré clignote en bleu très clair, contour blanc, pendant 2 s, avec un coup de batterie (grosse caisse, caisse claire, cymbale et accord tenu qui s'éteint : son `impact`). Il devient le joueur en cours. Avec « animations réduites » : pas de clignotement, seulement la mise en avant.
- **Capture** (`gcapture`, `gblob`) : une vague violette (couleur du joueur en cours, c'est-à-dire le gagnant) part du bord où s'est joué le duel (entre la case défendue et la case voisine de l'attaquant) et recouvre les cases prises (0,95 à 1,9 s selon leur nombre, départ et arrivée en douceur). C'est là qu'est l'irrégularité : le front de la vague est organique (rayon modulé par plusieurs ondulations qui bougent pendant l'avancée), avec un halo bleu clair et un liseré blanc, découpé aux cases capturées. Puis les frontières intérieures s'effacent en fondu. Son `capture` ajouté dans `sons.js`.
- **Accessibilité** : cases attaquables atteignables au clavier (Tab, puis Entrée ou Espace), avec contour de focus ; chaque case a une étiquette (« joueur, catégorie d'origine, adversaire possible ») ; avec « animations réduites », pas de vague ni de clignotement, simple fondu.
- **Tests** (navigateur automatisé, ordinateur 1440×900 et mobile 390×844, noms longs) : 4×4, 3×3 jusqu'au vainqueur, 2×2 ; cibles du dessin = `gtargets()`, frontières dessinées = paires de voisins de propriétaires différents, sélection au clavier, étiquettes = joueurs en lice, tirage « Retourner sur le sol » (candidat tiré parmi ceux qui n'ont pas joué), aucune erreur JavaScript.

## Éditeur de catégories : mots à trous et photos (novembre 2026)
- Besoin (Ced) : que sa fille puisse créer des catégories elle-même, sans toucher au code, avec d'autres jeux que les emojis. Retenus : **mot à trous** et **photos**. Demande associée : la page arbitre doit afficher le type de jeu de la catégorie pour le présenter aux candidats.
- **Éditeur** (`editeur.html`, bouton « ✏️ Créer mes catégories » sur l'écran de départ) : écran volontairement minimal. Accueil « Mes catégories » (cartes avec nombre d'éléments et « Prête à jouer » / « Encore N »), « Nouvelle catégorie » (nom + choix du jeu en deux grosses cartes), puis ajout un par un. Mots : un champ, Entrée, plusieurs mots possibles séparés par des virgules, aperçu des tuiles, doublons et mots d'une lettre refusés avec un message. Photos : bouton « Prendre ou choisir des photos » (appareil photo sur mobile, plusieurs à la fois), puis « Qu'est-ce que c'est ? » photo par photo (ou « Passer cette photo »), réponse modifiable ensuite sous la vignette. Suppression d'un élément (✕) ou de la catégorie (confirmation dans la page, sans boîte de dialogue). Pas de niveaux ni de variantes à saisir : niveau automatique, et l'arbitre valide à l'oral.
- **Seuils** : une catégorie apparaît dans le jeu dès 5 éléments (`MIN` dans `perso.js`) ; barre de progression jusqu'à 20 (conseillé).
- **Enregistrement** : dans le navigateur de l'appareil, catégories dans `localStorage` (clé `slc-perso`), photos dans IndexedDB (base `slc-perso`, réduites à 900 px en JPEG, plus une vignette de 200 px). « Espace parents » : sauvegarde en fichier JSON (photos incluses) et restauration sur un autre appareil. Demande de stockage persistant au navigateur. Les catégories perso ne vont pas dans le dépôt.
- **Jeu** (`index.html`) : `perso.js` est chargé après `categories.js` ; les catégories perso sont ajoutées à `DATA` au chargement (mention « (perso) » et type dans la liste). Elles entrent aussi dans le tirage des cases de la grille. Chaque catégorie a un `type` : `emoji` (défaut), `trous`, `photo` ; les éléments sont ramenés à `[clé unique, "réponse|variante", niveau, {img, thumb}]` (`normItem`). Les mêmes types sont acceptés dans `categories.js` (voir l'en-tête du fichier).
- **Mot à trous** : lettres cachées au hasard à chaque tirage, environ 1/3 au niveau 1 (jamais la première lettre), 1/2 au niveau 2, 2/3 au niveau 3 ; au moins une lettre cachée et une visible ; affichage en tuiles (trou = tuile en pointillés jaunes), taille adaptée à la largeur. Niveau automatique d'après la longueur (5 lettres ou moins : 1, 6 à 8 : 2, au-delà : 3).
- **Arbitre** : l'état `st` contient `type`, `tnom`, `consigne` et `disp` (le mot masqué, identique à celui des joueurs). La page arbitre affiche un encadré « Type de jeu : … » et « À annoncer : « consigne » », dès l'attente du duel. Photos : la vignette (200 px) n'est envoyée qu'au changement d'image, à la connexion de l'arbitre, et de temps en temps par sécurité.
- **Retour au jeu** depuis l'éditeur : pas d'écran de lancement ni d'intro (`sessionStorage` `slc-retour`, géré dans `intro.js`), dernier mode conservé.
- **Tests** (navigateur automatisé, ordinateur 1440×900 et mobile 390×844) : création des deux types, doublons, suppression, file de 6 photos avec une passée, retour au jeu, duel arbitré dans chaque type (carte identique jeu / arbitre, vignette mise à jour, bonne réponse, passe), grille à 20 catégories, sauvegarde puis restauration dans un navigateur vierge ; aucune erreur JavaScript. Pas encore essayé sur un vrai téléphone ni avec PeerJS entre deux appareils (photos).
- **Limites** : catégories perso propres à un appareil et un navigateur (effacer les données du site les supprime : d'où la sauvegarde) ; pas de modification des catégories d'origine ; photos d'enfants ou de la maison : à garder pour un usage privé ; la version autonome `sur-le-carreau.html` du projet ne contient pas encore l'éditeur.
- Idées non faites : niveaux réglables à la main, devinettes et lettres mélangées, faire passer des photos dans le dépôt (`assets/photos/` + `categories.js`).

## Catégories « mot à trous » pour adultes (novembre 2026)
- Demande de Ced : une dizaine de catégories en mot à trous, public adulte, directement dans `categories.js` (type `"trous"`, une chaîne `"réponse|variante"` par mot, niveau automatique).
- 10 catégories, 319 mots : capitales du monde (37), villes de France (30), départements français (33), fleuves, mers, monts (31), personnages historiques (30), mythologie (33), peintres et sculpteurs (30), fromages (30), desserts et pâtisseries (31), anatomie (34). Le jeu compte maintenant 28 catégories.
- Partis pris : pas de marques ni de personnes vivantes ; thèmes impossibles à dessiner en emoji ; variantes pour les noms composés ou à orthographe double (« Jeanne d'Arc|jeanne darc », « Pékin|beijing »).
- Ajustement du masquage (`perso.js`) découvert avec les noms composés : les lettres sont cachées **mot par mot**, chaque mot garde au moins une lettre visible, les mots de 2 lettres ou moins (« de », « d' ») restent entiers, et au niveau 1 la première lettre de chaque mot reste visible. Le niveau automatique se base sur le mot le plus long (« Léonard de Vinci » : niveau 2 et non 3).
- Tests (navigateur automatisé, ordinateur et mobile) : 28 catégories chargées sans avertissement, répartition des niveaux par catégorie, affichage d'un nom long en tuiles sur mobile, grille 4×4.

## Choix des catégories de la grille (novembre 2026)
- Demande de Ced : voir et modifier les catégories de la partie sur l'écran de départ, avant de lancer la grille.
- **Zone « Catégories de la partie »** (mode grille, sous la taille) : à l'ouverture, autant de catégories que de cases sont tirées au hasard (tirage pur, toutes catégories confondues, perso comprises). Elles s'affichent en étiquettes rangées par type de jeu (Images, Mot à trous, Photos), avec leur nombre d'éléments et un ✕ pour les retirer. Compteur « n / N catégories » : vert si le compte est bon, ambre s'il en manque, rouge s'il y en a trop.
- **Ajouter** : liste « Ajouter une catégorie » des catégories non choisies, en sections repliables par type, un bouton « + » par catégorie ; grisés quand la grille est complète (message « La grille est complète : retirez une catégorie pour en ajouter une autre »).
- **Boutons** : « 🎲 Nouveau tirage » (tout refaire au hasard), « Compléter au hasard » (s'il en manque), « Retirer au hasard » (s'il y en a trop).
- **Erreurs bloquantes** : tant que le compte n'est pas exact, « Commencer la partie » est désactivé, avec le message sous la zone (« Il manque 2 catégories pour une grille 4×4… », « 7 catégories de trop pour une grille 3×3… ») et un rappel au-dessus du bouton.
- **Avertissements non bloquants** (étiquette encadrée en ambre, ⚠, et liste sous les étiquettes) : catégorie de moins de 15 éléments (`PFEW`), des éléments risquant de revenir pendant le duel ; catégorie à drapeaux sous Windows (affichés en lettres).
- **Taille de grille** : agrandie, la sélection est complétée au hasard (« 7 catégories ajoutées au hasard pour la grille 4×4 ») ; réduite, rien n'est retiré sans l'accord du joueur (erreur + « Retirer au hasard »). Le choix de taille est conservé quand les catégories perso finissent de charger.
- **Catégories perso** : chargées un peu après la page ; si le joueur n'a pas encore touché à la sélection, le tirage est refait pour les inclure, sinon elles rejoignent seulement la liste d'ajout.
- La sélection est gardée en changeant de mode ou de taille et après une partie ; nouveau tirage à chaque ouverture de la page (pas de mémoire entre visites). Le placement sur le plateau reste aléatoire parmi les catégories choisies.
- Duel à deux : la liste des catégories est rangée par type (`optgroup`).
- Code : `PICK` (clés choisies), `pdraw`, `pfill`, `ptrim`, `pickSync`, `pickRender` dans `index.html` ; `startGrid` utilise `PICK`.
- Accessibilité : compteur et messages annoncés (`aria-live`), boutons ✕ et « + » étiquetés, focus replacé après un ajout ou un retrait.
- Tests (navigateur automatisé, 1440×900 et 390×844, avec une catégorie perso de 7 mots) : tirage initial de 16 catégories distinctes, fréquence de la catégorie perso conforme à un tirage pur, retrait / ajout / blocage / déblocage, ajouts grisés, réduction 3×3 puis « Retirer au hasard », agrandissement 4×4, plateaux 2×2 et 4×4 = catégories choisies, sélection conservée, duel par type, avertissement ; aucune erreur JavaScript.
- Pas fait : réglage des niveaux à la main.

## Case d'or (novembre 2026)
- Demande de Ced : la règle française de la « case d'or » (série de victoires), toujours active, libellé « Case d'or », récompense +5 s.
- **Règle** : 3 duels gagnés d'affilée (en attaque comme en défense) donnent la case d'or. Retourner sur le sol remet la série à 0. Avant un duel, chaque détenteur concerné (attaquant ou défenseur) peut cocher « ☆ Nom utilise sa case d'or (+5 s) » : son chrono démarre à 50 s au lieu de 45. Un seul bonus à la fois ; une 3e victoire en le détenant est sans effet, sauf s'il vient d'être utilisé dans ce duel. Le bonus est consommé à la fin du duel (« Retour à la grille » avant le départ ne le consomme pas) ; il disparaît si son détenteur est éliminé ; il n'est pas attribué au dernier duel de la partie. Pas de case d'or en mode « Duel à deux ».
- **Affichage** : annonce sur l'écran de fin de duel et sur la grille (`#gnote`, annoncée), carillon `gold`, « ★ Case d'or » sous le nom du détenteur sur le plateau (et dans l'étiquette accessible), série en cours dans le panneau, rappel sur l'écran de duel (`#dgold`) et chez l'arbitre (`#agold`).
- Code : `GOLD_STREAK`, `GOLD_SEC`, `goldEarns` ; `G.players[i].streak` et `.gold`, `G.use` (bonus cochés), `G.note` ; `startDuel` accepte `bonus`, `goldUse`, `gold`.
- Tests (navigateur automatisé, 1440×900 et 390×844, grille 3×3) : trois victoires → case d'or, bouton coché / décoché au clavier, chrono à 50 s, bonus consommé, série relancée à 1, retour sur le sol → série à 0 ; aucune erreur JavaScript.
- Écarts possibles avec l'émission, à confirmer par Ced : les victoires en défense comptent ; pas d'échange de catégorie à la place du bonus.

## Comment reprendre dans un nouveau projet Claude
Reliez le dépôt GitHub (référence du code) et gardez ce document dans le projet, puis demandez par exemple : « Lis le document de contexte et reprends le jeu : ajoute l'éditeur de catégories. » Le fichier `sur-le-carreau.html` du projet est la version autonome du jeu (catégories incluses) ; la référence reste le dépôt.
