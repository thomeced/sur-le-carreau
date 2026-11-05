# Projet : jeu web inspiré de The Floor ("Sur le carreau")

## Objectif
Réaliser un jeu web inspiré du jeu télévisé The Floor : des duels de catégories sur une grille de territoires. Nom de travail : « Sur le carreau » (nom et identité visuelle propres, pour ne pas reprendre ceux de l'émission, qui sont protégés).

## Règles du duel retenues
- Deux joueurs, une catégorie (animaux, fruits et légumes, transports…), des images qui défilent.
- Chaque joueur a un chrono (30, 45 ou 60 s) qui ne tourne que pendant son tour.
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
- Compte à rebours 3-2-1 avant chaque duel (mode clavier et mode arbitre). Le chrono et les réponses ne démarrent qu'après ; l'arbitre voit aussi le décompte (`count` dans l'état `st`). Pas de son pour l'instant.
- Le code d'arbitre est conservé d'une partie à l'autre (`getLink()` ouvre la liaison une seule fois, `resetLink()` la ferme). L'arbitre n'a pas à recharger sa page : il voit « Partie terminée · en attente du prochain duel », puis le duel suivant. Bouton « Nouveau code » sur l'écran d'attente. Le bouton Démarrer est activé tout de suite si l'arbitre a été vu dans les 7 dernières secondes.
- Les catégories sont dans `categories.js` (`const CATEGORIES = {…}`, une ligne `["emoji", "réponse|autre", niveau]` par image), chargé par `<script src="categories.js">` avant le script du jeu (fonctionne en ouvrant le fichier directement, contrairement à un `fetch` de JSON). Le jeu valide les données au chargement : lignes, doublons et catégories invalides sont ignorés avec un avertissement en console ; si le fichier manque, un message s'affiche et le lancement est désactivé.
- Artefact claude.ai : page unique, `categories.js` est inséré dans le HTML au moment de la publication (la balise `<script src="categories.js"></script>` est remplacée par son contenu). Le fichier du projet `sur-le-carreau.html` est cette version autonome ; la référence reste le dépôt.
- Prochaine étape pour les catégories : un éditeur (ajout d'images dans la page, export du `categories.js`).

## Grille de territoires (novembre 2026)
- Choix « Mode de jeu : grille » au départ ; taille 2×2, 3×3 ou 4×4 (désactivée si moins de catégories que de cases) ; un joueur par case, noms saisis (par défaut « Joueur n »), conservés quand on change la taille.
- 18 catégories (441 images) pour que chaque case ait une catégorie distincte (tirage aléatoire).
- Règles : le duel se joue dans la catégorie de la case défendue ; le perdant est éliminé, le gagnant prend toutes ses cases et choisit ensuite un voisin orthogonal à défier ; dernier joueur en lice = vainqueur. Le premier attaquant est tiré au sort.
- Écran de grille : cases colorées par propriétaire (cadre blanc = cases de l'attaquant, jaune = cibles possibles), panneau « X défie Y en <catégorie> », boutons « Lancer le duel » / « Changer d'adversaire ». Après un duel : « Retour à la grille ». Possible de revenir à la grille avant le départ du duel (`#wback`).
- Mode arbitre dans la grille : le même code est réutilisé d'un duel à l'autre ; l'arbitre voit « Catégorie : X » et « Duel terminé · en attente du prochain duel ». Il ne choisit pas la case : cela se fait sur l'écran du jeu.
- Tests (navigateur automatisé) : tailles 2/3/4, voisinage, partie 2×2 jusqu'au vainqueur, grille avec arbitre simulé. Pas encore essayé avec deux vrais appareils ni le vrai PeerJS.
- Limites : pas de sauvegarde ni de reprise d'une grille ; pas de mode équipes ; 4-voisinage uniquement.

## Prochaines étapes suggérées
- Éditeur de catégories (voir ci-dessus).
- Extras arbitre : bouton « mauvaise réponse », pause, annulation ; sons ; vraies images ; image floue qui se précise ; mode solo.
- Éditeur de catégories (voir ci-dessus).
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
- **Fichiers** : `intro.js`, `intro.css` (classes préfixées `.slci`) et `assets/intro/*.webp`, à la racine du dépôt. Installation : une seule ligne dans le `<head>` de `index.html`, après la feuille de style, sans `defer` : `<script src="intro.js"></script>`. Le script charge lui-même `intro.css` et les images, et masque le jeu (`main`) pendant l'intro. Durée réglée à deux endroits : `--slci-dur` dans `intro.css` et `DUR` dans `intro.js`.
- **Comportement** : bouton « Passer l'intro » et touche Échap ; pas d'intro sur la vue arbitre (`#arbitre`) ; intro sautée si une image ne charge pas (délai max. 6 s) ; mode « animations réduites » : fondu court sans zoom (2,4 s). Événement `slc:intro-end` sur `document` à la fin.
- **Version autonome** (artefact claude.ai, aperçu) : définir `window.SLC_INTRO_ASSETS = {decor, host, candLeft, candRight}` (adresses data: en base64) et `window.SLC_INTRO_CSS_INLINE = true` avant le script, CSS inséré dans une balise style. Le texte d'`intro.js` ne doit pas contenir de balise de fermeture de script (sinon il casse une fois inséré dans la page).
- **Tests** : captures dans un navigateur automatisé, sur ordinateur (1440×900) et sur mobile (390×844), sans erreur JavaScript. Sur mobile (portrait), l'image est recadrée au centre : on voit surtout l'animateur, les candidats sortent vite du cadre.
- **Choix par défaut, à revoir si besoin** : intro à chaque ouverture de la page (pas de mémoire du navigateur), pas de son.
- **Point d'attention** : le calque des candidats reproduit des candidats reconnaissables de l'émission. À remplacer par des silhouettes ou des personnages inventés avant une publication publique sur GitHub Pages.
