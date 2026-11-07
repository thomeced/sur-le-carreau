#!/usr/bin/env python3
"""Sur le carreau : télécharge depuis Wikimedia Commons les photos listées dans liste.txt.

Usage, dans le Terminal du Mac :
    cd ~/Documents/"The Floor Hess"/photos-commons
    python3 photos-commons.py                 # tout (relançable : ce qui est déjà téléchargé est gardé)
    python3 photos-commons.py pho_animaux     # une seule catégorie
    python3 photos-commons.py --refaire pho_animaux/okapi   # reprendre un élément (après correction de liste.txt)
    python3 photos-commons.py --candidats     # propositions Commons pour les éléments de candidats.txt, puis le reste

Pour chaque élément : article Wikipédia (fr) -> élément Wikidata -> image (P18, ou P41 pour un drapeau)
-> fichier Commons, avec auteur et licence. Seules les licences libres réutilisables sont gardées
(domaine public, CC0, CC BY, CC BY-SA). Résultat : photos/<catégorie>/<élément>.jpg et manifest.json.
"""
import html, json, os, re, shutil, subprocess, sys, time, unicodedata, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'photos')
MAN = os.path.join(HERE, 'manifest.json')
UA = 'SurLeCarreau/1.0 (jeu de salon familial; https://github.com/thomeced/sur-le-carreau)'
WD = 'https://www.wikidata.org/w/api.php'
CO = 'https://commons.wikimedia.org/w/api.php'
OK_LIC = re.compile(r'^\s*(public domain|domaine public|pd\b|pd-|cc0|cc[ -]by(-sa)?[ -]\d|attribution$|attribution only'
                    r'|no restrictions|copyrighted free use)', re.I)
MAXPX = 720       # plus grand côté des images gardées
MINPX = 400       # en dessous, image refusée (trop petite)


def api(url, **p):
    p.update(format='json', formatversion='2')
    err = ''
    for i in range(4):
        r = subprocess.run(['curl', '-sS', '-f', '-m', '40', '-A', UA, url + '?' + urllib.parse.urlencode(p)],
                           capture_output=True)
        if r.returncode == 0:
            return json.loads(r.stdout)
        err = r.stderr.decode(errors='replace').strip()
        time.sleep(2 + 4 * i)
    raise RuntimeError('réseau : ' + err[:200])


def slug(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def text(v):
    v = re.sub(r'<[^>]+>', ' ', v or '')
    return re.sub(r'\s+', ' ', html.unescape(v)).strip()


def parse():
    cats, cur = [], None
    for n, line in enumerate(open(os.path.join(HERE, 'liste.txt'), encoding='utf-8'), 1):
        line = line.strip()
        if not line or (line.startswith('#') and not line.startswith('##')):
            continue
        if line.startswith('##'):
            k, label, prop = [x.strip() for x in line[2:].split('|')]
            cur = {'key': k, 'label': label, 'prop': prop, 'items': []}
            cats.append(cur)
            continue
        m = re.match(r'^([1-5])\|(.+?)(?:\s*>\s*(.+))?$', line)
        if not m or not cur:
            print('  ligne %d ignorée : %s' % (n, line))
            continue
        a = m.group(2).strip()
        cur['items'].append({'l': int(m.group(1)), 'a': a, 'q': (m.group(3) or a.split('|')[0]).strip(),
                             'slug': slug(a.split('|')[0])})
    return cats


def claim_files(ent, prop):
    cl = [c for c in ((ent or {}).get('claims') or {}).get(prop) or [] if c.get('rank') != 'deprecated']
    cl.sort(key=lambda c: 0 if c.get('rank') == 'preferred' else 1)
    out = []
    for c in cl:
        v = ((c.get('mainsnak') or {}).get('datavalue') or {}).get('value')
        if isinstance(v, str) and v not in out:
            out.append(v)
    return out


def claim_file(ent, prop):
    f = claim_files(ent, prop)
    return f[0] if f else None


def page_image(wiki, title):
    """Image principale d'un article Wikipédia (si elle est sur Commons)."""
    if not title:
        return None
    try:
        d = api('https://%s.wikipedia.org/w/api.php' % wiki, action='query', titles=title, prop='pageimages',
                piprop='name', redirects='1')
        pg = (d.get('query') or {}).get('pages') or [{}]
        return pg[0].get('pageimage')
    except Exception:
        return None


def imageinfo(fname, width=960):
    d = api(CO, action='query', titles='File:' + fname, prop='imageinfo', iiprop='url|size|mime|extmetadata',
            iiurlwidth=str(width), iiextmetadatalanguage='fr',
            iiextmetadatafilter='Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired')
    page = (d.get('query') or {}).get('pages', [{}])[0]
    return page['imageinfo'][0] if page.get('imageinfo') else None


def lic(ii):
    return text(((ii.get('extmetadata') or {}).get('LicenseShortName') or {}).get('value'))


def entity(q, a, prop):
    """Élément Wikidata : par article Wikipédia (ou Q…), sinon par recherche sur la réponse."""
    pr = 'claims|labels|descriptions|sitelinks'
    if re.match(r'^Q\d+$', q):
        d = api(WD, action='wbgetentities', ids=q, props=pr, languages='fr', sitefilter='frwiki|enwiki')
    else:
        d = api(WD, action='wbgetentities', sites='frwiki', titles=q, normalize='1', props=pr, languages='fr',
                sitefilter='frwiki|enwiki')
    ents = [e for e in (d.get('entities') or {}).values() if 'missing' not in e]
    if ents and claim_file(ents[0], prop):
        return ents[0], 'article'
    s = api(WD, action='wbsearchentities', search=a.split('|')[0], language='fr', uselang='fr', limit='6', type='item')
    ids = [x['id'] for x in s.get('search', [])]
    if ids:
        d = api(WD, action='wbgetentities', ids='|'.join(ids), props=pr, languages='fr', sitefilter='frwiki|enwiki')
        for i in ids:
            e = (d.get('entities') or {}).get(i)
            if e and claim_file(e, prop):
                return e, 'recherche'
    return (ents[0] if ents else None), None


def fr(e, k):
    return (((e or {}).get(k) or {}).get('fr') or {}).get('value', '')


def resize(src, dst, png):
    if shutil.which('sips'):
        fmt = ['-s', 'format', 'png'] if png else ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72']
        r = subprocess.run(['sips', '-Z', str(MAXPX)] + fmt + [src, '--out', dst], capture_output=True)
        if r.returncode == 0:
            return
    try:
        from PIL import Image
        im = Image.open(src)
        im.thumbnail((MAXPX, MAXPX))
        if png:
            im.save(dst, 'PNG', optimize=True)
        else:
            im.convert('RGB').save(dst, 'JPEG', quality=72, optimize=True)
        return
    except ImportError:
        shutil.copyfile(src, dst)


def fetch(cat, it):
    q = it['q']
    if q.startswith('File:'):
        files, ent, how = [q[5:]], None, 'fichier imposé'
    else:
        ent, how = entity(q, it['a'], cat['prop'])
        files = claim_files(ent, cat['prop']) if ent else []
        # Images de secours (si celle de Wikidata n'a pas une licence retenue) : images principales des articles.
        sl = (ent or {}).get('sitelinks') or {}
        if cat['prop'] == 'P18':
            for w in ('frwiki', 'enwiki'):
                f = page_image(w[:2], (sl.get(w) or {}).get('title'))
                if f and f not in files:
                    files.append(f)
        if not files:
            return {'status': 'erreur', 'err': 'pas d’image Wikidata' if ent else 'article et élément Wikidata introuvables',
                    'entite': (ent or {}).get('id', ''), 'elabel': fr(ent, 'labels'), 'edesc': fr(ent, 'descriptions')}
    ii, fname, refused = None, None, []
    for f in files:
        x = imageinfo(f)
        if x and OK_LIC.match(lic(x)):
            ii, fname = x, f
            break
        refused.append('%s (%s)' % (f, lic(x) if x else 'introuvable'))
    if not ii:
        return {'status': 'refusée', 'err': 'licence non retenue : ' + '; '.join(refused)[:250],
                'entite': (ent or {}).get('id', ''), 'elabel': fr(ent, 'labels'), 'edesc': fr(ent, 'descriptions')}
    em = ii.get('extmetadata') or {}
    meta = {'fichier': fname, 'page': ii.get('descriptionurl', ''), 'licence': text(em.get('LicenseShortName', {}).get('value')),
            'licenceUrl': text(em.get('LicenseUrl', {}).get('value')), 'auteur': text(em.get('Artist', {}).get('value')),
            'credit': text(em.get('Credit', {}).get('value'))[:300], 'larg': ii.get('width'), 'haut': ii.get('height'),
            'entite': (ent or {}).get('id', ''), 'elabel': fr(ent, 'labels'), 'edesc': fr(ent, 'descriptions'), 'via': how}
    if not OK_LIC.match(meta['licence']):
        return dict(meta, status='refusée', err='licence non retenue : ' + (meta['licence'] or 'inconnue'))
    svg = ii.get('mime') == 'image/svg+xml'
    if not svg and max(ii.get('width') or 0, ii.get('height') or 0) < MINPX:
        return dict(meta, status='refusée', err='image trop petite')
    png = svg or ii.get('mime') == 'image/png'
    url = ii.get('thumburl') or ii.get('url')
    os.makedirs(os.path.join(OUT, cat['key']), exist_ok=True)
    tmp = os.path.join(OUT, cat['key'], '.tmp-' + it['slug'])
    r = subprocess.run(['curl', '-sS', '-f', '-L', '-m', '90', '--retry', '3', '-A', UA, '-o', tmp, url], capture_output=True)
    if r.returncode != 0:
        return dict(meta, status='erreur', err='téléchargement : ' + r.stderr.decode(errors='replace')[:150])
    rel = '%s/%s.%s' % (cat['key'], it['slug'], 'png' if png else 'jpg')
    resize(tmp, os.path.join(OUT, rel), png)
    os.remove(tmp)
    return dict(meta, status='ok', chemin=rel)


def candidats():
    """Pour chaque ligne « catégorie/élément | mots-clés » de candidats.txt : jusqu'à 8 images libres trouvées par
    la recherche Commons, en vignettes dans candidats/<catégorie>__<élément>/, et leur liste dans candidats.json."""
    path = os.path.join(HERE, 'candidats.txt')
    if not os.path.exists(path):
        return
    res = {}
    lines = [l.strip() for l in open(path, encoding='utf-8') if l.strip() and not l.startswith('#')]
    for n, line in enumerate(lines, 1):
        ref, terms = [x.strip() for x in line.split('|', 1)]
        d = os.path.join(HERE, 'candidats', ref.replace('/', '__'))
        os.makedirs(d, exist_ok=True)
        try:
            r = api(CO, action='query', generator='search', gsrnamespace='6', gsrlimit='24',
                    gsrsearch=terms + ' filetype:bitmap', prop='imageinfo', iiprop='url|size|mime|extmetadata',
                    iiurlwidth='400', iiextmetadatafilter='LicenseShortName|Artist')
        except Exception as e:
            print('  [%d/%d] ✗ %s : %s' % (n, len(lines), ref, e))
            continue
        pages = sorted((r.get('query') or {}).get('pages') or [], key=lambda p: p.get('index', 99))
        out = []
        for p in pages:
            ii = (p.get('imageinfo') or [{}])[0]
            if not ii.get('thumburl') or not OK_LIC.match(lic(ii)) or min(ii.get('width') or 0, ii.get('height') or 0) < 500:
                continue
            k = len(out) + 1
            f = os.path.join(d, '%d.jpg' % k)
            if subprocess.run(['curl', '-sS', '-f', '-L', '-m', '60', '-A', UA, '-o', f, ii['thumburl']]).returncode == 0:
                out.append({'n': k, 'fichier': p['title'][5:], 'licence': lic(ii)})
            if len(out) == 8:
                break
            time.sleep(0.2)
        res[ref] = out
        print('  [%d/%d] %s : %d propositions' % (n, len(lines), ref, len(out)))
        json.dump(res, open(os.path.join(HERE, 'candidats.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def main():
    args = sys.argv[1:]
    if '--candidats' in args:
        args.remove('--candidats')
        print('== Propositions pour les photos à remplacer')
        candidats()
    redo = set()
    if '--refaire' in args:
        i = args.index('--refaire')
        redo = set(args[i + 1:])
        args = args[:i]
    only = set(args)
    man = json.load(open(MAN, encoding='utf-8')) if os.path.exists(MAN) else {}
    cats = parse()
    total = sum(len(c['items']) for c in cats if not only or c['key'] in only)
    n = 0
    for cat in cats:
        if only and cat['key'] not in only:
            continue
        old = {x['slug']: x for x in (man.get(cat['key']) or {}).get('items', [])}
        items = []
        print('\n== %s (%d)' % (cat['label'], len(cat['items'])))
        for it in cat['items']:
            n += 1
            prev = old.get(it['slug'])
            key = cat['key'] + '/' + it['slug']
            if (prev and prev.get('status') == 'ok' and prev.get('q') == it['q'] and key not in redo
                    and os.path.exists(os.path.join(OUT, prev.get('chemin', '')))):
                items.append(dict(prev, l=it['l'], a=it['a']))
                continue
            try:
                res = fetch(cat, it)
            except Exception as e:  # réseau, réponse inattendue…
                res = {'status': 'erreur', 'err': str(e)[:200]}
            rec = dict(it, **res)
            items.append(rec)
            mark = '✓' if rec['status'] == 'ok' else '✗'
            print('  [%d/%d] %s %s%s' % (n, total, mark, it['a'].split('|')[0],
                                         '' if rec['status'] == 'ok' else ' : ' + rec.get('err', '')))
            man[cat['key']] = {'label': cat['label'], 'prop': cat['prop'], 'items': items + [x for s, x in old.items() if s not in {y['slug'] for y in items} and s in {y['slug'] for y in cat['items']}]}
            json.dump(man, open(MAN, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            time.sleep(0.4)
        man[cat['key']] = {'label': cat['label'], 'prop': cat['prop'], 'items': items}
        json.dump(man, open(MAN, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ok = [(k, x) for k, c in man.items() for x in c['items'] if x.get('status') == 'ok']
    ko = [(k, x) for k, c in man.items() for x in c['items'] if x.get('status') != 'ok']
    print('\nTerminé : %d photos prêtes, %d à revoir.' % (len(ok), len(ko)))
    for k, x in ko:
        print('  - %s/%s : %s' % (k, x['slug'], x.get('err', '')))
    print('Tu peux revenir dans la conversation avec Claude.')


if __name__ == '__main__':
    main()
