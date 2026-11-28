# Spec UX : Sur le carreau, version « partageable »

> BMAD, phase 2 (UX). Validé par Ced le 23 novembre 2026 ; refonte visuelle (§5) validée le 28 novembre 2026.
> Entrée : `docs/prd.md`. Ne décrit que ce qui change ; le reste de l'interface est décrit dans `CLAUDE.md`.

## 1. Principes
- **Deux écrans, deux rôles** : la TV montre et explique au salon ; le téléphone guide l'arbitre. Une information destinée à tous va sur la TV, une consigne pour l'arbitre va sur le téléphone.
- **Lisible à 3 m** (ENF6), sur une TV 1080p : texte courant **28 px minimum**, consignes et propositions de QCM **40 px**, titres et réponses **56 px et plus**. Tailles en `clamp()` sur la largeur d'écran pour suivre les résolutions.
- **Télécommande** : tout élément cliquable de la TV a un focus très visible (contour clair épais) et s'atteint aux flèches ; OK = Entrée.
- **Mouvement réduit** : chaque animation a une version sans mouvement (indiquée par écran).
- Charte inchangée : bleus du plateau, violet du joueur en cours, jaune de la case d'or.

## 2. Parcours (rappel, avec les ajouts)
**TV** : accueil (QR code) → téléphone connecté → Funky ou Sérieux → intro → **préparation avec cartes « Comment jouer »** (nouveau) → plateau, **avec bandeau d'aide** (nouveau) → duel.
**Téléphone** : scan → **guide de l'arbitre, 3 écrans, la première fois** (nouveau) → attente → configuration → arbitrage, **avec consigne à annoncer en tête** (renforcé) et **bouton « ? »** (nouveau).

## 3. Écrans

### 3.1 TV : préparation avec cartes « Comment jouer » (EF1, EF2)
- Haut : « Partie en préparation sur le téléphone… » (existant), plus petit.
- Centre : une carte à la fois, grande (60 % de la largeur). Chaque carte = un pictogramme ou une mini-animation SVG + un titre + une phrase.
  1. **Le duel** : « Deux joueurs, une catégorie. On répond à voix haute. »
  2. **Les chronos** : « Chacun a 40 s. Seul le chrono de celui qui a la main tourne. Bonne réponse : la main passe. »
  3. **Passé** : « Bloqué ? Dites “Passé” : la réponse s'affiche, et vous perdez 3 s. »
  4. **Le territoire** (grille seulement) : « Le gagnant prend toutes les cases du perdant, puis attaque un voisin ou retourne sur le sol. »
  5. **La case d'or** (grille seulement) : « 3 duels gagnés d'affilée : +5 s à utiliser plus tard. »
  En duel simple : cartes 1 à 3 seulement.
- Bas : points de pagination (● ○ ○ ○ ○).
- Défilement : 6 s par carte, fondu enchaîné. Mouvement réduit : pas de fondu ni de mini-animation, 9 s par carte.
- Disparaît dès que la partie démarre.

### 3.2 TV : bandeau d'aide (EF5)
- Bandeau d'une ligne sous le titre du plateau, texte 32 px, annoncé en `aria-live`.
- Une phrase par étape :
  - choix de l'adversaire : « **Léa** choisit qui attaquer (case surlignée). »
  - avant le duel avec case d'or : « **Léa** peut utiliser sa case d'or : +5 s. »
  - après une victoire : « **Léa** a gagné ! Elle défie un voisin ou retourne sur le sol. »
  - tirage : « Retour sur le sol : un nouvel attaquant est tiré au sort… »
  - fin : « **Léa** a conquis tout le sol ! »
- Changement de phrase : fondu court (aucun en mouvement réduit).

### 3.3 TV : duel QCM (EF11, EF12)
- Zone de l'élément : la question en haut (40 px, 3 lignes maximum), puis **4 propositions en grille 2 × 2**, chacune dans une tuile avec sa lettre (A, B, C, D) à gauche.
- Bonne réponse : la tuile correcte passe en vert, les autres s'estompent, puis élément suivant (même délai qu'aujourd'hui).
- « Passé » ou « Mauvaise réponse » : la tuile correcte s'entoure de blanc, les autres s'estompent, −3 s affiché comme aujourd'hui.
- Sur un écran étroit (régie ou portrait) : propositions en colonne.

### 3.4 TV : duel Gros plan (EF13, EF14)
- Même cadre que les photos. L'image est agrandie dans le cadre (le dépassement est masqué), centrée sur le point de zoom, puis se dézoome jusqu'à l'image entière en 10 s, en ralentissant à la fin.
- Petite étiquette « 🔍 Gros plan » dans le coin.
- À la réponse (bonne, passée ou mauvaise) : dézoom immédiat en 0,4 s pour montrer l'image entière avec la réponse.
- Mouvement réduit : 4 paliers nets (toutes les 2,5 s) au lieu d'un dézoom continu.
- Masquage du débordement par `overflow: hidden` sur le cadre (pas de `clip-path`, pour la TV Samsung).

### 3.5 TV : duel Devinette (EF15)
- **Bloc** : les phrases en liste, comme les Indices, 40 px, puis « Qui suis-je ? » en italique.
- **Révélée** : les phrases arrivent une à une (fondu, toutes les 3 s), les précédentes restent visibles ; les phrases à venir sont figurées par des lignes en pointillés, pour qu'on voie combien il en reste. Mouvement réduit : apparition sans fondu.
- À la réponse : toutes les phrases s'affichent, puis la réponse.

### 3.6 TV et téléphone : choix des catégories (EF13, EF16)
- Chaque catégorie affiche l'icône de son type (nouvelles icônes : ❓ QCM, 🔍 Gros plan, 🧩 Devinette, à confirmer en Dev).
- Catégorie photo : un bouton à bascule « 🔍 » sur sa ligne la passe en version Gros plan (libellé « Animaux en gros plan »).
- Dans le menu « + » (ajout par type) : entrées « QCM », « Gros plan », « Devinette ».

### 3.7 Téléphone : guide de l'arbitre (EF3, EF4)
- Plein écran, 3 pages, glisser ou boutons « Suivant » ; « Passer » en haut à droite.
  1. **Vous êtes l'arbitre** : « Les joueurs répondent à voix haute ; c'est vous qui décidez. »
  2. **Configurez** : « Choisissez le mode, les joueurs et les catégories, puis lancez la partie. »
  3. **Jugez** : les boutons réels en miniature : « Bonne réponse », « Passé », et « Mauvaise réponse » (QCM seulement).
- Dernière page : « C'est parti ».
- Affiché une seule fois par téléphone (`localStorage`), sauf via le bouton « ? ».
- **Bouton « ? »** : rond, en haut à droite de la régie, à côté du nom de l'écran ; ouvre le guide par-dessus, sans rien interrompre.

### 3.8 Téléphone : consigne à annoncer et arbitrage (EF6, EF12)
- Avant chaque duel, encadré en tête : icône du type + « Annoncez : » + consigne (24 px, gras). Exemple : « 🧩 Annoncez : Devinette, trouvez qui je suis. »
- Pendant le duel, l'encadré se réduit à une ligne.
- Duel QCM : trois boutons, de haut en bas : « Bonne réponse » (vert), « Mauvaise réponse » (rouge), « Passé » (gris). Hors QCM : inchangé.
- Le niveau de l'élément reste affiché comme aujourd'hui.

## 4. Hors spec
Le visuel de remplacement de l'intro (EF9) sera proposé en Dev sous forme de deux ou trois esquisses à choisir par Ced.

## 5. Refonte visuelle (validée par Ced le 28 novembre 2026)

Maquettes : planche Design « Sur le carreau — Accueil TV » (https://claude.ai/artifact/SooGA1em5qFjNB8TgRqq22), rangées « Piste B », « Plateau en perspective », « Variante 1 (retenue) » et « Régie ». Les autres rangées (pistes A et C, duel « studio », variante 2) sont gardées pour l'historique et ne sont pas à coder.

### 5.1 Commun
- Logo doré « Sur le carreau » (`assets/intro/logo.webp`) à la place du titre en police simple.
- Cadre « grand écran » : bord doré `#F2C44E` de 6 px, liseré bleu nuit `#071340`, halo bleu ; fond dégradé bleu `#2353E0` → `#0B1F8A`.
- Tailles TV : 28 px minimum partout (exception : catégories dans les cases d'une grille 4×4, 24 px au fond ; voir 5.4).
- Messages techniques (« Liaison entre appareils : indisponible… ») retirés de l'écran des joueurs, visibles seulement avec `?debug=1`.
- Mode allégé (TV Samsung) : pas de flou ni de halo flou ; un trait net les remplace.

### 5.2 TV : accueil (piste B)
- Ciel étoilé et sol quadrillé actuels.
- En haut, logo agrandi (environ 750 × 300 px en 1080p) avec léger halo doré.
- Dessous, cadre « grand écran » compact (environ 1160 px de large) : QR code à gauche (280 px, environ 18 cm sur une TV de 55 pouces), à droite « Scannez avec votre téléphone pour prendre la main » (48 px), « Code » + code en 96 px jaune, pastille « En attente du téléphone… » (28 px).
- Étapes en pastilles (30 px), puis les trois accès discrets en vrais boutons (28 px) : « Configurer sur cet écran », « Créer mes catégories », « Ouvrir la régie ici ». Focus télécommande : contour jaune de 6 px.
- **Choix du lancement toujours accessible** : en bas à gauche, bascule « Lancement : Funky | Sérieux » (28 px), modifiable à tout moment sur l'accueil ; le même réglage est dans la configuration de la régie (« Lancement sur l'écran »). Le mode choisi est retenu sur l'appareil (`slc-mode`).
- À la connexion du téléphone, le mode retenu s'applique directement : Funky lance l'intro, Sérieux passe à la préparation. L'écran de lancement séparé (« Comment voulez-vous lancer le jeu ? ») et la mémoire d'onglet `slc-lance`, qui le faisaient disparaître sans prévenir après un premier lancement, sont supprimés. Le son du générique n'est garanti que si quelqu'un a touché l'écran du jeu (la bascule compte) ; sinon l'intro démarre muette avec son bouton « Son ».

### 5.3 TV : partie en préparation
- Logo, puis « Partie en préparation sur le téléphone… » (40 px) et pastille verte « Régie reliée · CODE ».
- Carte « Comment jouer » dans le cadre « grand écran » (1280 px) : surtitre « Comment jouer · 1 sur 5 », pictogramme, titre 76 px jaune, phrase 48 px, pagination en tirets.
- Étapes en bas : « 1. Connexion ✓ » en vert, étape en cours en jaune.

### 5.4 TV : plateau en perspective
- Plateau vu en perspective, comme depuis les gradins (référence : photo de l'émission fournie par Ced). Chaque case est un polygone SVG calculé par projection (pas de transformation 3D en CSS, pour la TV Samsung). Le rang du fond est environ 1,6 fois plus étroit que le premier.
- Sol bleu vif (`#2457D6`), lignes blanches de 4 px, liseré violet néon autour (`#C07BFF`, halo `#A24DFF` flou hors mode allégé), points lumineux sur les côtés (projecteurs), rang du fond légèrement assombri.
- Couleurs : joueur en cours `#7A3FD8`, adversaires possibles `#5B95F5`, adversaire choisi `#A9C8FF` avec contour blanc épais, case d'or `#E0AC22`.
- Étiquettes droites, centrées sur la case d'origine, taille réduite avec la profondeur : nom 44 px et catégorie 30 px au premier rang, environ 33 et 23 px au dernier en 4×4 (plus grand en 3×3 et 2×2).
- Pas de barre du haut (Ced, 28/11 : plateau épuré, il prend toute la hauteur) : la phrase de l'étape reste pour les lecteurs d'écran (`aria-live`, masquée visuellement) et sur la régie ; la couleur violette montre qui a la main ; badge de la régie masqué tant qu'elle est reliée.
- Plus de colonne d'informations à droite : bouton « Détails » en bas à droite (atteignable à la télécommande) qui ouvre un panneau en bas de l'écran, sur trois colonnes : prochain duel (qui contre qui, catégorie, type), légende des couleurs avec la case d'or, joueurs en lice avec « Lancer le duel » et « Changer ».
- La vague de capture suit les polygones en perspective.

### 5.5 TV : duel (variante 1, « bandeau »)
D'après la photo de l'émission fournie par Ced : plus de barre en haut ; grand écran central, chronos et réponse dans un bandeau en bas.
- Grand écran central (environ 1440 × 780 px), cadre doré ; deux colonnes néon violettes sur les côtés de la scène.
- Bandeau en bas, sur toute la largeur :
  - à gauche et à droite, chaque joueur : nom en majuscules dans sa couleur (jaune `#FFC53D`, cyan `#5CE1FF`), chrono 128 px ; le joueur qui a la main est allumé (bord et chiffre à sa couleur), l'autre éteint ; chrono en rouge à 5 s ou moins ;
  - au centre, onglet violet de la catégorie (36 px), puis zone de réponse (142 px de haut).
- Zone de réponse selon l'étape :
  - attente du départ : « Prêts ? » ;
  - compte à rebours : « Départ dans 3… » ;
  - en cours : discrète (« Niveau 1 · à vous de répondre ») ;
  - bonne réponse : fond vert, réponse en 72 px, sans étiquette (Ced, 28/11 : la couleur suffit) ; la main passe à l'autre chrono ;
  - « Passé » : fond rouge, réponse en 72 px, sans étiquette ; pour un mot à trous, les lettres manquantes apparaissent dans les tuiles ;
  - fin du duel : fond violet, « NOM gagne ».
- Grand écran selon l'étape :
  - attente du départ : le logo seul, centré (Ced, 28/11 : « A contre B », consigne, état de la régie et boutons sont sur le téléphone ; badge de la régie masqué tant qu'elle est reliée) ; les deux chronos à 40, éteints ;
  - compte à rebours : « Joueur 1 commence » (44 px) au-dessus d'un chiffre blanc de 340 px, sans cercle ni points ; le chrono du joueur qui commence s'allume déjà. Animation : chaque chiffre arrive en grossissant légèrement puis s'efface ; en mouvement réduit ou en mode allégé, simple changement ;
  - en cours : photo, ou tuiles du mot (92 px) ;
  - fin du duel : coupe, « NOM remporte le duel ! » (96 px), « NOM2 est éliminé. NOM prend son territoire. », « Retour au plateau… » ; chrono du perdant estompé.

### 5.6 Téléphone : régie
- En-tête : petit logo, pastille « Écran CODE ✓ », bouton « ? », menu « ⋯ » (« Arrêter la partie », « Changer d'écran » : retirés de la zone des boutons de jeu). Étapes en barre de progression fine.
- Configuration : titre « Préparez la partie » (sans texte d'introduction) ; mode, taille et lancement sur l'écran (Funky ou Sérieux) en boutons côte à côte au lieu de listes déroulantes ; catégories en liste (nom, type, ✕), 6 visibles puis « Voir les N autres », boutons « Nouveau tirage » et « Ajouter… » ; noms des joueurs repliés derrière « Saisir les noms » ; « Commencer la partie » collé en bas.
- Choix de l'adversaire : mini-plateau aux couleurs de la TV, « NOM choisit son adversaire », adversaires possibles en grands boutons (nom, catégorie, type), « Retourner sur le sol ».
- Avant le duel : « Joueur 5 contre Joueur 1 », consigne à annoncer dans un encadré violet (24 px), ligne case d'or avec « Utiliser +5 s », puis en bas « Démarrer le duel » (68 px de haut) et « Changer d'adversaire ».
- Arbitrage : chronos sur une ligne, vignette de l'image avec catégorie et niveau, **réponse attendue en 40 px** avec les variantes acceptées, puis en bas « Bonne réponse » (vert, 96 px de haut) et « Passé (−3 s) » (rouge, 76 px).

### 5.7 Plus tard (après la refonte)
- Intro en vraie vidéo (MP4) pour supprimer les saccades sur la TV : écartée pour l'instant (Ced, 28/11).
- Vague de capture plus lente : faite en story 5.3 (2 à 3 s ; 260 ms par case en mode allégé), à régler sur la TV.
- Tirage au sort du premier attaquant à l'ouverture du plateau, avec la même animation que « Retourner sur le sol » : fait en story 5.5 (« Tirage au sort : qui attaque en premier ? », 6 s de clignotement parmi tous les candidats, puis « NOM commence ! » 2 s, case tirée en violet).
