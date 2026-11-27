# Brief produit : Sur le carreau

> BMAD, phase 1 (Analyste). Validé par Ced le 23 novembre 2026.
> Entrée du PRD (`docs/prd.md`). L'état du code reste décrit dans `CLAUDE.md`.

## Problème
Le jeu fonctionne chez Ced, mais une autre famille ne peut pas encore y jouer sans lui : les règles ne sont expliquées nulle part, l'arbitre doit deviner son rôle, on fait vite le tour du contenu, et l'affichage est défaillant sur les TV Samsung.

## Utilisateurs cibles
- **Familles et groupes d'amis** (enfants et adultes) qui reçoivent le lien, sans Ced pour expliquer.
- **L'arbitre** : un adulte qui découvre le jeu sur son téléphone.
- **Les joueurs** : regardent la TV, répondent à l'oral.
- **Les créateurs de catégories**, enfants compris (cas d'origine : la fille de Ced).

## Contexte d'usage
Au salon. Écran du jeu : navigateur d'une **TV connectée** (Samsung/Tizen compris) ou **ordinateur branché sur la TV**. Dans les deux cas, le **téléphone sert de régie**.

## Proposition de valeur
Un jeu de duels de catégories sur une grille de territoires, lancé en scannant un QR code : sans installation, sans compte, gratuit, avec une identité propre (rien de l'émission).

## Socle existant
Grille 2×2 à 4×4 et duel simple, chronos de 40 s, case d'or ; 39 catégories de 6 types (photo, emoji, mot à trous, indices, lettres mélangées, titres à l'envers) ; régie et arbitrage sur le téléphone ; éditeur de catégories ; lancement Funky ou Sérieux et intro.

## Périmètre de la prochaine version (« partageable »)
1. **Prise en main** : règles expliquées dans le jeu (écran et téléphone), guide de l'arbitre sur le téléphone.
2. **Contenu, en quantité** : viser **environ 50 catégories de 60 éléments** (environ 3 000 éléments). Aujourd'hui : 39 catégories ; 40 éléments pour les types texte, 25 pour les photos, 20 à 25 pour les emojis.
3. **Contenu, en variété** : nouveaux types **Devinette** (« Je suis… »), **QCM** (4 propositions à l'écran, réponse à l'oral) et **Gros plan** (image très zoomée qui se dézoome peu à peu, à partir des photos).
4. **Champ sémantique varié**, à la manière de l'émission : des catégories qui couvrent beaucoup de domaines (géographie, histoire, cinéma et séries, musique, sport, sciences et nature, cuisine, arts et lettres, langue et mots, vie quotidienne, loisirs…), avec un équilibre entre domaines et des catégories précises autant que larges. Aujourd'hui, la géographie, la cuisine et l'histoire sont bien couvertes ; le sport, la musique, les sciences et la langue le sont peu. La carte des domaines est à établir en PM.
5. **TV** : vague de capture compatible Samsung et animation plus légère.
6. **Identité propre** : remplacer le calque des candidats de l'intro, obligatoire dès que le jeu est partagé.

## Hors périmètre
Serveur, jeu en ligne, mode solo ; partage de catégories entre familles ; profils de difficulté par joueur ; types audio et vidéo ; finale et échange de catégorie ; sauvegarde de partie, pause, annulation (jugées secondaires).

## Contraintes
100 % statique et gratuit (GitHub Pages, PeerJS public) ; licences libres seulement, pas de marques ni de personnes vivantes ; accessibilité (clavier, `aria-live`, `prefers-reduced-motion`) ; une branche et une PR par chantier.

## Risques
- **Liaison PeerJS jamais testée entre deux vrais appareils.** Jugée secondaire par Ced, gardée en risque n°1 : si elle casse chez une autre famille, rien d'autre ne compte. Test réel à faire avant le partage.
- Navigateur Samsung limité (`clip-path` sur le SVG ignoré, pas de `color-mix()`) et lent.
- Volume de contenu : environ 900 photos au lieu de 375, chacune relue à l'œil et licence vérifiée ; chargement sur la TV et poids du dépôt (de l'ordre de 50 à 60 Mo). Le plus gros chantier en temps.
- `index.html` volumineux : chaque chantier y est plus risqué.
- PeerJS et relais TURN : services publics sans garantie.

## Indicateurs de succès
- Une famille qui n'a jamais vu le jeu lance et termine une partie 4×4 sans aide.
- Partie fluide sur la TV Samsung, vague contenue dans les cases.
- Plusieurs soirées sans retomber sur les mêmes éléments (60 éléments par catégorie).
- Une grille 4×4 tirée au hasard mélange des domaines variés.
- Aucun élément de l'émission dans la version partagée.

## Questions ouvertes (pour le PM)
- Ordre des chantiers : prise en main, contenu, nouveaux types, TV, intro.
- Carte des domaines et liste des ~11 nouvelles catégories.
- Répartition des 60 éléments par niveau (12 par niveau ?) et place des nouveaux types dans l'éditeur.
