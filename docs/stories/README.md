# Backlog des stories

> BMAD, phase 3 (Scrum Master). Créé le 24 novembre 2026.
> Sources : `docs/prd.md`, `docs/ux.md`, `docs/architecture.md`.
> Règle : les stories sont détaillées « juste à temps ». Celles de l'epic en cours sont écrites en entier dans ce dossier (statut **Prête**) ; les suivantes restent ici en une ligne (statut **Brouillon**) et sont détaillées quand leur epic commence, pour profiter de ce qu'on aura appris.
> Une story = une branche = une PR, relue et fusionnée par Ced.

Statuts : Brouillon · Prête · En cours · En revue · Terminée · Reportée

## E0 Socle technique
| Story | Titre | Exigences | Dépend de | Statut |
|---|---|---|---|---|
| [0.1](0.1-tests-fumee.md) | Tests de fumée et de régie (Playwright) | archi §8 | — | Terminée |
| [0.2](0.2-decoupage-index.md) | Découpage d'`index.html` en fichiers | archi §3 | 0.1 | Terminée |
| [0.3](0.3-version-cache.md) | Version des fichiers (cache de la TV) | archi §2 | 0.2 | Terminée |

## E1 Prise en main
| Story | Titre | Exigences | Dépend de | Statut |
|---|---|---|---|---|
| [1.1](1.1-cartes-comment-jouer.md) | Cartes « Comment jouer » pendant la préparation | EF1, EF2 | 0.2 | Terminée |
| [1.2](1.2-bandeau-aide.md) | Bandeau d'aide sur le plateau | EF5 | 1.1 | Terminée |
| [1.3](1.3-guide-arbitre.md) | Guide de l'arbitre et bouton « ? » | EF3, EF4 | 1.1 | Terminée |
| [1.4](1.4-consigne-annoncer.md) | Consigne à annoncer mise en avant | EF6 | 0.2 | Terminée |

## E2 TV et identité
| Story | Titre | Exigences | Statut |
|---|---|---|---|
| [2.1](2.1-lite-secours.md) | Couleurs de secours, détection `LITE`, `?debug=1` | EF8 | Terminée |
| [2.2](2.2-vague-lite.md) | Vague de capture case par case (`js/plateau-lite.js`) | EF7 | Terminée |
| [2.3](2.3-prechargement-photos.md) | Préchargement des 3 photos suivantes | ENF2 | Terminée |
| [2.4](2.4-intro-visuels.md) | Nouveaux visuels de l'intro (plateau, animateur, candidats, logo) | EF9 | En revue |
| [2.5](2.5-test-reel.md) | Checklist de test réel `docs/test-reel.md` (test fait par Ced) | EF10 | Ordinateur + téléphone en wifi : OK (27/11) ; TV Samsung : vague corrigée (2.6, 2.7, OK le 28/11) ; intro saccadée et télécommande pénible (28/11), choix déplacés sur la régie en 2.8 ; réseau mobile à faire |
| [2.6](2.6-lite-tv.md) | Mode allégé sur les TV récentes (détection par le user agent) | EF7 | Terminée ; insuffisant au test du 28/11 |
| [2.7](2.7-lite-samsung.md) | Mode allégé : Samsung en user agent « ordinateur », `?lite=1` mémorisé | EF7 | Terminée |
| [2.8](2.8-regie-grille.md) | Choix en grille et lancement depuis la régie (écran passif, sans télécommande) | EF7, EF10 | Terminée (PR #44) |

## E3 Nouveaux types et progressivité
Objectif (revu par Ced le 27/11) : un duel monte réellement jusqu'aux niveaux 4 et 5. Les nouveaux types (QCM, Devinette, Gros plan) sont reportés en évolution future : « on est bien en termes de types de jeu ».
Epic terminé avec la story 3.1.

| Story | Titre | Exigences | Dépend de | Statut |
|---|---|---|---|---|
| [3.1](3.1-progressivite.md) | Progressivité : `LVL_CURVE` et compteur `S.joues` | EF23 | — | Terminée |
| 3.2 | Type QCM et verdict « Mauvaise réponse » | EF11, EF12, EF16 | — | Reportée (évolution future, 27/11) |
| 3.3 | Type Devinette (bloc et révélée) | EF15, EF16 | — | Reportée (évolution future, 27/11) |
| 3.4 | Variante Gros plan des catégories photo (`@gp`) | EF13, EF16 | 3.3 | Reportée (évolution future, 27/11) |
| 3.5 | Catégories Gros plan dédiées (foyer, `liste.txt`, `photos-js.py`) | EF14 | 3.4 | Reportée (évolution future, 27/11) |

### Pour reprendre les nouveaux types plus tard
- Spec gardée telle quelle : PRD EF11 à EF16, UX §3.3 à §3.6 et §3.8, architecture §4.1, §5.2 à §5.4.
- Décisions déjà prises par Ced : icône 💭 pour la Devinette (🧩 est celle des Indices) ; une petite catégorie de démonstration livrée avec chaque type.
- La première story reprise crée les bases communes : `js/types.js` (rendu des nouveaux types, appelé par `paintCard`, chargé après `js/duel.js`), le champ `extra` du message `st`, `tests/types.js`.
- Pièges repérés dans le code : plusieurs endroits testent `type === 'photo'` (`precharger()`, l'envoi de l'image dans `push()`, `paintCard()`, l'avertissement du choix des catégories) ; le Gros plan devra y être traité comme une photo. Le verdict « Mauvaise réponse » du QCM passera par le chemin de `skip()`, déjà compté dans `S.joues`.

## E4 Contenu
| Story | Titre | Exigences | Statut |
|---|---|---|---|
| [4.1](4.1-domaines.md) | Domaines (`DOMAINES`, `DOM_CAT`), tirage équilibré, `tests/contenu.js` | EF21 | Terminée |
| [4.2](4.2-mots-a-trous.md) | Mot à trous : 10 catégories de 60 éléments, niveaux 1 à 5 | EF18 | Terminée |
| [4.3](4.3-indices-vrac-envers.md) | Indices, lettres mélangées, titres à l'envers : 9 catégories de 60 éléments | EF18 | Terminée |
| 4.4 | 4 nouvelles catégories QCM | EF18, EF20 | Reportée avec la 3.2 |
| [4.5](4.5-nouvelles-categories.md) | Séries et dessins animés (indices), Sports en vrac, Musique (les 3 Devinettes sont reportées avec la 3.3) | EF18, EF20 | Terminée |
| [4.6](4.6-emojis.md) | Emojis : 5 catégories à 40 éléments, niveaux 1 à 5 | EF19 | Terminée |
| [4.7](4.7-photos-liste.md) | Photos : `liste.txt` à 40 par catégorie (préparation par Claude ; les 2 catégories Gros plan sont reportées avec la 3.5) | EF19 | Terminée (liste à relire par Ced) |
| [4.8](4.8-photos-telechargement.md) | Photos : téléchargement et relecture (Ced, sur son Mac), intégration et crédits | EF19, EF22 | En revue |

Constat de la story 4.1 (`node tests/contenu.js`) : plusieurs catégories n'avaient aucun élément aux niveaux 4 et 5 ; réglé en 4.2 (mots à trous), 4.3 (indices) et 4.6 (emojis). Après la 4.6, toutes les catégories sauf les 15 catégories photo sont à l'objectif ; après la 4.8, les 42 le sont. Le domaine « Langue et mots » n'a aucune catégorie.

## E5 Refonte visuelle
Maquettes validées par Ced le 28 novembre 2026 : `docs/ux.md` §5, planche https://claude.ai/artifact/SooGA1em5qFjNB8TgRqq22.

| Story | Titre | Exigences | Statut |
|---|---|---|---|
| [5.1](5.1-accueil-refonte.md) | Socle, accueil, préparation, choix Funky ou Sérieux toujours accessible | UX §5.1 à §5.3 | Terminée (PR #47) |
| [5.2](5.2-duel-bandeau.md) | Duel en bandeau (attente, compte à rebours, réponse, fin du duel) | UX §5.5 | Terminée (PR #48) |
| [5.3](5.3-plateau-perspective.md) | Plateau en perspective, panneau « Détails », vague ralentie (2 à 3 s) | UX §5.4, §5.7 | Terminée (PR #49) |
| [5.4](5.4-regie.md) | Régie : menu « ⋯ », configuration compacte, réponse attendue en grand | UX §5.6 | Terminée (PR #50) |
| [5.5](5.5-tirage-ouverture.md) | Tirage au sort du premier attaquant à l'ouverture du plateau | UX §5.7 | En revue |

## Ordre de passage
0.1 → 0.2 → 0.3 → 1.1 → 1.2 → 1.3 → 1.4 → E2 → E3 (3.1 seule) → E4.
Les stories 1.4 et 0.3 sont indépendantes et peuvent être glissées plus tôt.
