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
| [2.5](2.5-test-reel.md) | Checklist de test réel `docs/test-reel.md` (test fait par Ced) | EF10 | Ordinateur + téléphone en wifi : OK (27/11) ; TV Samsung et réseau mobile à faire |

## E3 Nouveaux types et progressivité
Objectif : Gros plan et Devinette sont jouables et arbitrables ; un duel monte réellement jusqu'aux niveaux 4 et 5.
Fini quand : les 2 nouveaux types se jouent de bout en bout (écran, régie, choix des catégories) sur ordinateur et en `?lite=1`, et `tests/types.js`, `tests/niveaux.js` et les tests existants passent. Le contenu complet arrive en E4.

| Story | Titre | Exigences | Dépend de | Statut |
|---|---|---|---|---|
| [3.1](3.1-progressivite.md) | Progressivité : `LVL_CURVE` et compteur `S.joues` | EF23 | — | Terminée |
| 3.2 | Type QCM et verdict « Mauvaise réponse » | EF11, EF12, EF16 | — | Reportée (évolution future, décision de Ced, 27/11) |
| 3.3 | Type Devinette (bloc et révélée) | EF15, EF16 | 3.1 | Brouillon |
| 3.4 | Variante Gros plan des catégories photo (`@gp`) | EF13, EF16 | 3.3 | Brouillon |
| 3.5 | Catégories Gros plan dédiées (foyer, `liste.txt`, `photos-js.py`) | EF14 | 3.4 | Brouillon |

### E3 en détail (périmètre de chaque story, à écrire en entier au moment de la commencer)
- **3.1 Progressivité** : petite story, sans nouvel écran ; elle passe en premier parce que le verdict `bad` de 3.2 s'appuie sur le compteur.
- **3.2 QCM** : **reportée** (évolution future, décision de Ced, 27/11). La spec reste valable pour plus tard : PRD EF11 et EF12, UX §3.3 et §3.8, architecture §4.1 et §5.4. Ce qu'elle devait poser pour les autres types passe en 3.3.
- **3.3 Devinette** : crée `js/types.js` (rendu des nouveaux types, appelé par `paintCard`), le champ `extra` du message `st` et `tests/types.js`, repris par 3.4 ; entrée `devinette` de `TYPES`, icône 💭 (phylactère, décision de Ced), 2 à 4 phrases, catégorie de démonstration (10 devinettes « Animaux », en présentation `revele`), complétée en 4.5, champ de catégorie `presentation` (`bloc` par défaut, `revele`) ; révélation toutes les 3 s (`DEV_PAS`) arrêtée avec le chrono, lignes à venir en pointillés, tout affiché à la réponse (archi §5.3, UX §3.5) ; `extra.lignes` vers la régie.
- **3.4 Variante Gros plan** : clé `<clé>@gp` construite au chargement (aussi pour les catégories photo perso), bascule « 🔍 » dans « Catégories de la partie », entrée « Gros plan » du menu « + » ; zoom `GP_ZOOM` par niveau, foyer au hasard dans le carré central, dézoom de 10 s en `transform` seul, 0,4 s à la réponse, 4 paliers en mouvement réduit (archi §5.2, UX §3.4) ; la régie reçoit la photo entière.
- **3.5 Gros plan dédié** : type `grosplan` déclaré d'emblée et 5e champ facultatif `[x, y]` (foyer imposé, validé de 0 à 100) ; prise en charge dans `liste.txt` et `tools/photos-js.py`. Le contenu des 2 catégories dédiées est fait en 4.7 et 4.8.

### Pièges repérés dans le code (pour les stories 3.3 à 3.5)
- Plusieurs endroits testent `type === 'photo'` : `precharger()`, l'envoi de l'image à la régie dans `push()`, `paintCard()`, l'avertissement du choix des catégories. Le Gros plan doit y être traité comme une photo.
- L'icône 🧩 est déjà celle des Indices (`perso.js`) : la Devinette prend 💭 (UX §3.6 à corriger en 3.3).
- `js/types.js` ne déclare que des fonctions appelées pendant le jeu : il peut être chargé après `js/duel.js`, avant `js/main.js`.

## E4 Contenu
| Story | Titre | Exigences | Statut |
|---|---|---|---|
| 4.1 | Domaines (`DOMAINES`, `DOM_CAT`), tirage équilibré, `tests/contenu.js` | EF21 | Brouillon |
| 4.2 | Mot à trous : 10 catégories de 40 à 60 éléments | EF18 | Brouillon |
| 4.3 | Indices, lettres mélangées, titres à l'envers : 9 catégories de 40 à 60 | EF18 | Brouillon |
| 4.4 | 4 nouvelles catégories QCM | EF18, EF20 | Reportée avec la 3.2 |
| 4.5 | 3 Devinettes, Séries et dessins animés, Sports en vrac, Musique | EF18, EF20 | Brouillon |
| 4.6 | Emojis : 5 catégories à 40 éléments | EF19 | Brouillon |
| 4.7 | Photos : `liste.txt` à 40 par catégorie et 2 catégories Gros plan (préparation par Claude) | EF19, EF20 | Brouillon |
| 4.8 | Photos : téléchargement et relecture (Ced, sur son Mac), intégration et crédits | EF19, EF22 | Brouillon |

## Ordre de passage
0.1 → 0.2 → 0.3 → 1.1 → 1.2 → 1.3 → 1.4 → E2 → E3 → E4.
Les stories 1.4 et 0.3 sont indépendantes et peuvent être glissées plus tôt.
