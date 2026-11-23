# Spec UX : Sur le carreau, version « partageable »

> BMAD, phase 2 (UX). Validé par Ced le 23 novembre 2026.
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
