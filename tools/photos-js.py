#!/usr/bin/env python3
"""Sur le carreau : verse les photos Wikimedia Commons dans le dépôt et génère photos.js.

Entrée : le dossier produit par photos-commons.py (manifest.json, photos/, et facultativement
photos-ecartees.txt : une ligne « catégorie/élément  raison » par photo refusée à la relecture).

    python3 tools/photos-js.py CHEMIN/photos-commons

Sortie, à la racine du dépôt :
  - assets/photos/<catégorie>/<élément>.jpg (ou .png pour les drapeaux) ;
  - photos.js : CATEGORIES_PHOTOS (format de categories.js, type « photo ») et PHOTO_CREDITS
    (auteur, licence, lien de chaque photo), lu par le jeu et par credits.html.
Les photos des catégories absentes du manifeste sont laissées telles quelles ; celles qui ne sont plus
retenues dans une catégorie traitée sont supprimées.
"""
import json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIN = 5


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    man = json.load(open(os.path.join(src, 'manifest.json'), encoding='utf-8'))
    out_ex = set()
    ex_path = os.path.join(src, 'photos-ecartees.txt')
    if os.path.exists(ex_path):
        for line in open(ex_path, encoding='utf-8'):
            line = line.strip()
            if line and not line.startswith('#'):
                out_ex.add(line.split()[0])
    cats, credits, kept, skipped = {}, {}, 0, []
    for key, cat in man.items():
        items = []
        dest_dir = os.path.join(ROOT, 'assets', 'photos', key)
        os.makedirs(dest_dir, exist_ok=True)
        wanted = set()
        for it in sorted(cat['items'], key=lambda x: (x['l'], x['a'])):
            ref = key + '/' + it['slug']
            if it.get('status') != 'ok' or ref in out_ex:
                skipped.append(ref)
                continue
            name = os.path.basename(it['chemin'])
            shutil.copyfile(os.path.join(src, 'photos', it['chemin']), os.path.join(dest_dir, name))
            wanted.add(name)
            path = 'assets/photos/%s/%s' % (key, name)
            items.append([path, it['a'], it['l']])
            auteur = re.sub(r'(?i)^(auteur inconnu|unknown author|unknown)(\s+(unknown author|auteur inconnu))?$', '',
                            (it.get('auteur') or '').strip())
            credits[path] = {'a': auteur[:160], 'l': it.get('licence', ''),
                             'u': it.get('licenceUrl', ''), 's': it.get('page', '')}
            kept += 1
        for f in os.listdir(dest_dir):
            if f not in wanted:
                os.remove(os.path.join(dest_dir, f))
        if len(items) >= MIN:
            cats[key] = {'label': cat['label'], 'type': 'photo', 'items': items}
    js = ['/* Catégories en photos de « Sur le carreau » : photos de Wikimedia Commons, sous licence libre.',
          ' * FICHIER GÉNÉRÉ par tools/photos-js.py (à partir du manifeste de photos-commons.py) : ne pas modifier',
          ' * à la main, corriger la liste et relancer les deux scripts.',
          ' * CATEGORIES_PHOTOS : même format que categories.js ([adresse, "réponse|variante", niveau 1 à 5]).',
          ' * PHOTO_CREDITS : auteur (a), licence (l), lien de la licence (u) et page Commons (s) de chaque photo,',
          ' * affichés dans credits.html (attribution exigée par les licences CC BY et CC BY-SA). */',
          'const CATEGORIES_PHOTOS = {']
    for key, c in cats.items():
        js.append('  %s: {' % key)
        js.append('    label: %s, type: "photo",' % json.dumps(c['label'], ensure_ascii=False))
        js.append('    items: [')
        js += ['      %s,' % json.dumps(i, ensure_ascii=False) for i in c['items']]
        js.append('    ],')
        js.append('  },')
    js.append('};')
    js.append('const PHOTO_CREDITS = {')
    js += ['  %s: %s,' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False)) for k, v in credits.items()]
    js.append('};')
    open(os.path.join(ROOT, 'photos.js'), 'w', encoding='utf-8').write('\n'.join(js) + '\n')
    print('%d photos dans %d catégories ; écartées : %d' % (kept, len(cats), len(skipped)))
    for s in skipped:
        print('  -', s)


if __name__ == '__main__':
    main()
