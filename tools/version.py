#!/usr/bin/env python3
"""Version des fichiers du jeu (cache de la TV).

La version est définie une seule fois : la balise <meta name="slc-version"> d'index.html.
Ce script la recopie partout où elle sert, pour que la TV recharge les fichiers après une mise à jour :
  - « ?v=<version> » sur chaque fichier CSS et JS local d'index.html, editeur.html et credits.html ;
  - le texte « Version … » en pied de l'accueil (#hver).
(intro.css, chargé par intro.js, reprend tout seul la version d'intro.js.)

Usage, depuis la racine du dépôt :
  python3 tools/version.py             nouvelle version : date du jour + lettre (2026-11-27a, puis 2026-11-27b…)
  python3 tools/version.py 2026-12-01a version donnée
  python3 tools/version.py --verifier  vérifie seulement que tout est à jour (code de sortie 1 sinon)
À lancer dans chaque PR qui touche du code (JS, CSS ou HTML).
"""
import datetime, os, re, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['index.html', 'editeur.html', 'credits.html']
META = re.compile(r'<meta name="slc-version" content="([^"]*)">')
# Fichiers locaux .js ou .css (pas les adresses http…), avec ou sans ?v= déjà présent.
FICHIER = re.compile(r'((?:src|href)=")(?![a-z]+:)([^"?#]+\.(?:js|css))(?:\?v=[^"]*)?(")')
PIED = re.compile(r'(<p id="hver"[^>]*>Version )([^<]*)(</p>)')


def lire(nom):
    with open(os.path.join(RACINE, nom), encoding='utf-8') as f:
        return f.read()


def ecrire(nom, texte):
    with open(os.path.join(RACINE, nom), 'w', encoding='utf-8') as f:
        f.write(texte)


def actuelle():
    m = META.search(lire('index.html'))
    if not m:
        sys.exit('index.html : balise <meta name="slc-version"> introuvable')
    return m.group(1)


def suivante(v):
    jour = datetime.date.today().isoformat()
    if v.startswith(jour) and len(v) == len(jour) + 1 and v[-1].islower() and v[-1] != 'z':
        return jour + chr(ord(v[-1]) + 1)
    return jour + 'a'


def appliquer(v):
    """Renvoie {page: texte à jour} pour la version v."""
    out = {}
    for p in PAGES:
        t = FICHIER.sub(lambda m: m.group(1) + m.group(2) + '?v=' + v + m.group(3), lire(p))
        if p == 'index.html':
            t = META.sub('<meta name="slc-version" content="' + v + '">', t)
            t = PIED.sub(lambda m: m.group(1) + v + m.group(3), t)
        out[p] = t
    return out


def main():
    args = sys.argv[1:]
    if args == ['--verifier']:
        v = actuelle()
        faux = [p for p, t in appliquer(v).items() if t != lire(p)]
        if faux:
            sys.exit('Version ' + v + ' : pas à jour dans ' + ', '.join(faux) + ' (lancer python3 tools/version.py ' + v + ')')
        print('Version ' + v + ' : à jour dans ' + ', '.join(PAGES))
        return
    if len(args) > 1 or (args and not re.fullmatch(r'[0-9A-Za-z.-]+', args[0])):
        sys.exit(__doc__)
    v = args[0] if args else suivante(actuelle())
    for p, t in appliquer(v).items():
        if t != lire(p):
            ecrire(p, t)
    print('Version ' + v)


if __name__ == '__main__':
    main()
