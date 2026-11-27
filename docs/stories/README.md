# Backlog des stories

> BMAD, phase 3 (Scrum Master). Créé le 24 novembre 2026.
> Sources : `docs/prd.md`, `docs/ux.md`, `docs/architecture.md`.
> Règle : les stories sont détaillées « juste à temps ». Celles de l'epic en cours sont écrites en entier dans ce dossier (statut **Prête**) ; les suivantes restent ici en une ligne (statut **Brouillon**) et sont détaillées quand leur epic commence, pour profiter de ce qu'on aura appris.
> Une story = une branche = une PR, relue et fusionnée par Ced.

Statuts : Brouillon · Prête · En cours · En revue · Terminée

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
| [1.4](1.4-consigne-annoncer.md) | Consigne à annoncer mise en avant | EF6 | 0.2 | En revue |

## E2 TV et identité
| Story | Titre | Exigences | Statut |
|---|---|---|---|
| 2.1 | Couleurs de secours, détection `LITE`, `?debug=1` | EF8 | Brouillon |
| 2.2 | Vague de capture case par case (`js/plateau-lite.js`) | EF7 | Brouillon |
| 2.3 | Préchargement des 3 photos suivantes (absent aujourd'hui) | ENF2 | Brouillon |
| 2.4 | Nouveau calque de l'intro (esquisses à choisir par Ced) | EF9 | Brouillon |
| [2.5](2.5-test-reel.md) | Checklist de test réel `docs/test-reel.md` (test fait par Ced) | EF10 | Checklist livrée, test à faire |

## E3 Nouveaux types et progressivité
| Story | Titre | Exigences | Statut |
|---|---|---|---|
| 3.1 | Progressivité : `LVL_CURVE` et compteur `S.n` | EF23 | Brouillon |
| 3.2 | Type QCM et verdict « Mauvaise réponse » (ajouter aussi sa miniature au guide de l'arbitre, `AIDE_TXT.guide`) | EF11, EF12, EF16 | Brouillon |
| 3.3 | Type Devinette (bloc et révélée) | EF15, EF16 | Brouillon |
| 3.4 | Variante Gros plan des catégories photo (`@gp`) | EF13, EF16 | Brouillon |
| 3.5 | Catégories Gros plan dédiées (foyer, `liste.txt`, `photos-js.py`) | EF14 | Brouillon |

## E4 Contenu
| Story | Titre | Exigences | Statut |
|---|---|---|---|
| 4.1 | Domaines (`DOMAINES`, `DOM_CAT`), tirage équilibré, `tests/contenu.js` | EF21 | Brouillon |
| 4.2 | Mot à trous : 10 catégories de 40 à 60 éléments | EF18 | Brouillon |
| 4.3 | Indices, lettres mélangées, titres à l'envers : 9 catégories de 40 à 60 | EF18 | Brouillon |
| 4.4 | 4 nouvelles catégories QCM | EF18, EF20 | Brouillon |
| 4.5 | 3 Devinettes, Séries et dessins animés, Sports en vrac, Musique | EF18, EF20 | Brouillon |
| 4.6 | Emojis : 5 catégories à 40 éléments | EF19 | Brouillon |
| 4.7 | Photos : `liste.txt` à 40 par catégorie et 2 catégories Gros plan (préparation par Claude) | EF19, EF20 | Brouillon |
| 4.8 | Photos : téléchargement et relecture (Ced, sur son Mac), intégration et crédits | EF19, EF22 | Brouillon |

## Ordre de passage
0.1 → 0.2 → 0.3 → 1.1 → 1.2 → 1.3 → 1.4 → E2 → E3 → E4.
Les stories 1.4 et 0.3 sont indépendantes et peuvent être glissées plus tôt.
