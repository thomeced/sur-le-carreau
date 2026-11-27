# Test réel : TV Samsung et vrai téléphone

> Story 2.5 (EF10). À faire par Ced, sur de vrais appareils. Les tests automatiques (`tests/`) tournent dans un seul navigateur récent : ils ne vérifient ni la liaison PeerJS entre deux appareils, ni le navigateur de la TV, ni la lisibilité à 3 m.
> Remplir les cases au fur et à mesure (✅ ok, ❌ problème, ➖ pas testé) et noter ce qui coince dans « Remarques ». Une photo de l'écran vaut mieux qu'une longue description.

## Avant de commencer
- Adresse du jeu : **https://thomeced.github.io/sur-le-carreau/**
- Appareils : la TV Samsung (TQ55S95C, navigateur « Internet ») pour l'écran du jeu ; ton téléphone pour la régie.
- **Version** : en bas à droite de l'accueil de la TV, « Version 2026-… ». Elle doit être celle de la dernière PR fusionnée (visible dans `index.html` sur GitHub, balise `slc-version`). Si la TV affiche une version plus ancienne : fermer l'onglet et rouvrir l'adresse ; en dernier recours, vider le cache du navigateur de la TV.
- Distance : regarder la TV depuis le canapé (environ 3 m) pour tout ce qui concerne la lisibilité.
- Dès la story 2.1 : ajouter `?debug=1` à l'adresse sur la TV (`…/sur-le-carreau/?debug=1`) et photographier le coin qui indique le navigateur et le mode allégé.

## Test express (5 minutes)
Si tu n'as pas le temps de tout faire : ces 6 points disent déjà l'essentiel.

| # | Vérification | Résultat | Remarques |
|---|---|---|---|
| E1 | La TV affiche l'accueil, le QR code et la bonne version | | |
| E2 | Le téléphone scanne le QR code et affiche « Écran XXXX · relié ✓ » en moins de 15 s | | |
| E3 | La TV passe à « Partie en préparation » avec les cartes « Comment jouer » | | |
| E4 | Duel simple lancé depuis le téléphone : il démarre sur la TV | | |
| E5 | « Bonne réponse » et « Passé » sur le téléphone agissent sur la TV en moins d'une seconde | | |
| E6 | Aucun blocage jusqu'à la fin du duel | | |

## A. Même wifi (TV et téléphone sur la box)

### A1. Accueil et connexion
| # | Vérification | Résultat | Remarques |
|---|---|---|---|
| A1.1 | Accueil lisible à 3 m : titre, code en grand, étapes | | |
| A1.2 | Le QR code se scanne du premier coup depuis le canapé | | |
| A1.3 | Le téléphone ouvre la régie et le **guide de l'arbitre** s'affiche (1re fois sur ce téléphone) | | |
| A1.4 | Guide : glisser d'une page à l'autre, « Suivant », « C'est parti » ; textes compréhensibles | | |
| A1.5 | « Écran XXXX · relié ✓ » sur le téléphone ; « Régie connectée » sur la TV. Temps de connexion : … s | | |
| A1.6 | La TV propose Funky ou Sérieux ; choix possible à la télécommande | | |
| A1.7 | Mode funky : l'intro se joue, avec le son, sans saccade | | |

### A2. Préparation
| # | Vérification | Résultat | Remarques |
|---|---|---|---|
| A2.1 | Cartes « Comment jouer » : texte lisible à 3 m | | |
| A2.2 | Les cartes changent toutes les 6 s environ, le fondu est fluide | | |
| A2.3 | Passer le mode en « Duel simple » sur le téléphone : la TV n'affiche plus que 3 cartes | | |
| A2.4 | Configuration d'une grille 3×3 avec des noms et au moins une catégorie photo : le bouton de lancement répond en moins de 8 s | | |

### A3. Partie en grille
| # | Vérification | Résultat | Remarques |
|---|---|---|---|
| A3.1 | Plateau lisible : noms et catégories dans les cases | | |
| A3.2 | Bandeau d'aide sous le titre, lisible à 3 m, sur une ligne | | |
| A3.3 | Choix de l'adversaire à la télécommande (flèches et OK) | | |
| A3.4 | Téléphone : consigne « Annoncez : … » en grand avant le duel | | |
| A3.5 | « Démarrer le duel » depuis le téléphone ; compte à rebours 3-2-1 sur la TV | | |
| A3.6 | Les photos s'affichent sur la TV sans attente visible | | |
| A3.7 | Les chronos de la TV et du téléphone restent d'accord (à 1 s près) | | |
| A3.8 | Verdicts : délai entre le toucher et la TV : … (instantané / moins d'1 s / plus) | | |
| A3.9 | Vague de capture à la fin du duel : **déborde-t-elle encore des cases ?** (problème connu, corrigé par la story 2.2) ; fluide ou saccadée ? | | |
| A3.10 | « Retourner sur le sol » : tirage au sort animé, fluide | | |
| A3.11 | Partie jusqu'au bout : « … a conquis tout le sol ! », puis retour à la configuration sur le téléphone | | |

### A4. Incidents
| # | Vérification | Résultat | Remarques |
|---|---|---|---|
| A4.1 | Bouton « ? » du téléphone pendant un duel : le guide s'ouvre, « Passer » le ferme, le duel continue | | |
| A4.2 | Mettre le téléphone en veille 30 s pendant une partie, le rallumer : la régie se reconnecte seule | | |
| A4.3 | Recharger la page du téléphone pendant une partie : la régie revient et la partie continue sur la TV | | |
| A4.4 | Le guide ne s'affiche plus tout seul après le rechargement | | |

## B. Téléphone en réseau mobile (wifi coupé sur le téléphone, TV sur la box)
| # | Vérification | Résultat | Remarques |
|---|---|---|---|
| B1 | Scan du QR code : « relié ✓ ». Temps de connexion : … s | | |
| B2 | Un duel complet avec des verdicts : délai : … | | |
| B3 | Passage du téléphone du wifi au réseau mobile pendant une partie : reconnexion ? | | |

## C. Ordinateur branché sur la TV (si possible)
| # | Vérification | Résultat | Remarques |
|---|---|---|---|
| C1 | Chrome sur l'ordinateur, plein écran (F11) : accueil, cartes et plateau lisibles | | |
| C2 | Un duel complet avec le téléphone en régie | | |

## Résultats
| Date | Version | Appareils (TV, téléphone, réseau) | Bilan |
|---|---|---|---|
| 27/11/2026 | 2026-11-27e | Ordinateur (écran du jeu) + téléphone (régie), même wifi | OK selon Ced (détail par ligne non rempli). TV Samsung et réseau mobile pas encore testés. |
| | | | |

Pour me remonter les résultats : coller ce fichier rempli (ou seulement les lignes ❌) dans une conversation, avec les photos. Les problèmes deviendront des stories ; ce tableau garde la trace de chaque session de test.
