/* Test de l'accueil et du choix du lancement (story 5.1, docs/ux.md §5.2 et §5.3).
   Lancer depuis la racine du dépôt :   node tests/accueil.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie, en 1920×1080 (TV) :
   - accueil : logo, QR code, code, état ; tout tient sans défiler ; aucun texte visible sous 28 px (sauf la version) ;
   - l'état de la liaison (#hlnk) n'est visible qu'avec ?debug=1 ;
   - bascule « Lancement » : Sérieux met le fond noir tout de suite, est retenu (slc-mode) et reste choisi après un
     rechargement ; Funky revient ; boutons atteignables au clavier (Tab), aria-pressed à jour ;
   - en sérieux, la connexion du téléphone passe directement à la préparation (pas d'intro) ; en funky, l'intro démarre ;
   - préparation : tient sans défiler, textes de 28 px et plus ;
   - en 390×844 (téléphone) : l'accueil reste utilisable (QR code, code, bascule visibles).
   Le test échoue à la moindre erreur JavaScript ou console.error. */
const {lancer,ouvrirEcranEtRegie,pause,etape}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

// Plus petite taille de texte visible dans #home (hors version, textes réservés aux lecteurs d'écran, et #hlnk).
const tailles=p=>p.evaluate(()=>{
  const out=[];
  document.querySelectorAll('#home *').forEach(e=>{
    if(e.closest('.hver,.sr,#hlnk'))return;
    const txt=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
    if(!txt)return;
    const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
    out.push([parseFloat(getComputedStyle(e).fontSize),e.id||e.className||e.tagName,e.textContent.trim().slice(0,30)]);
  });
  return out.sort((a,b)=>a[0]-b[0]);
});
const deborde=p=>p.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1);

lancer('accueil',async env=>{
  const p=await env.page('écran');
  await p.goto(env.url+'index.html');
  await p.waitForFunction(()=>/^[A-Z0-9]{4}$/.test(document.getElementById('hcode').textContent));

  etape('accueil en 1920×1080');
  attendu(await p.evaluate(()=>{const i=document.querySelector('.hlogo img');return i.complete&&i.naturalWidth>0}),'Logo non chargé');
  attendu(await p.isVisible('#hqr svg'),'QR code absent');
  attendu(!await deborde(p),'L’accueil déborde de l’écran 1920×1080');
  let t=await tailles(p);
  attendu(t[0][0]>=27.5,'Texte trop petit sur l’accueil : '+JSON.stringify(t.slice(0,3)));
  attendu(!await p.isVisible('#hlnk'),'L’état de la liaison est visible sans ?debug=1');

  etape('bascule Lancement');
  attendu(await p.getAttribute('#home [data-lm="funky"]','aria-pressed')==='true','Funky n’est pas le mode par défaut');
  await p.focus('#home [data-lm="funky"]');await p.keyboard.press('Tab');
  attendu(await p.evaluate(()=>document.activeElement.dataset.lm)==='serieux','« Sérieux » pas atteignable au clavier');
  await p.keyboard.press('Enter');
  attendu(await p.evaluate(()=>document.documentElement.classList.contains('slc-serieux')&&localStorage.getItem('slc-mode')==='serieux'),'« Sérieux » ne passe pas en fond noir ou n’est pas retenu');
  attendu(await p.getAttribute('#home [data-lm="serieux"]','aria-pressed')==='true','aria-pressed pas à jour');
  await p.reload();await p.waitForFunction(()=>/^[A-Z0-9]{4}$/.test(document.getElementById('hcode').textContent));
  attendu(await p.evaluate(()=>document.documentElement.classList.contains('slc-serieux'))&&await p.getAttribute('#home [data-lm="serieux"]','aria-pressed')==='true','Le mode sérieux n’est pas gardé après un rechargement');
  await p.click('#home [data-lm="funky"]');
  attendu(await p.evaluate(()=>!document.documentElement.classList.contains('slc-serieux')&&localStorage.getItem('slc-mode')==='funky'),'Retour en funky raté');

  etape('?debug=1 montre l’état de la liaison');
  await p.goto(env.url+'index.html?debug=1');
  await p.waitForFunction(()=>/^[A-Z0-9]{4}$/.test(document.getElementById('hcode').textContent));
  attendu(await p.isVisible('#hlnk'),'#hlnk caché avec ?debug=1');

  etape('téléphone 390×844');
  await p.setViewportSize({width:390,height:844});
  await p.goto(env.url+'index.html');
  await p.waitForFunction(()=>/^[A-Z0-9]{4}$/.test(document.getElementById('hcode').textContent));
  for(const s of ['#hqr svg','#hcode','#home [data-lm="serieux"]'])attendu(await p.isVisible(s),s+' invisible sur téléphone');
  attendu(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'L’accueil déborde en largeur sur téléphone');
  await p.close();

  etape('mode sérieux retenu : connexion du téléphone → préparation sans intro');
  const pre=await env.page('réglage');await pre.goto(env.url+'index.html');
  await pre.evaluate(()=>localStorage.setItem('slc-mode','serieux'));await pre.close();
  const {jeu,regie}=await ouvrirEcranEtRegie(env,{lancement:true,horloge:false});
  await jeu.setViewportSize({width:1920,height:1080});
  await jeu.waitForFunction(()=>!document.getElementById('hprep').hidden&&/Partie en préparation/.test(document.getElementById('hph2').textContent));
  attendu(await jeu.evaluate(()=>!document.querySelector('.slci')),'Intro lancée alors que le mode est sérieux');
  await jeu.waitForFunction(()=>!document.getElementById('hcards').hidden);
  await pause(300);
  attendu(!await deborde(jeu),'La préparation déborde de l’écran 1920×1080');
  t=await tailles(jeu);
  attendu(t[0][0]>=27.5,'Texte trop petit pendant la préparation : '+JSON.stringify(t.slice(0,3)));
  attendu(/Régie reliée/.test(await jeu.textContent('#hpst')),'Pastille « Régie reliée » absente');

  etape('mode funky choisi sur la régie pendant la préparation : retenu pour la prochaine fois');
  await regie.setViewportSize({width:390,height:844});
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.click('#setup [data-lm="funky"]');
  await jeu.waitForFunction(()=>localStorage.getItem('slc-mode')==='funky'&&!document.documentElement.classList.contains('slc-serieux'));
  attendu(await jeu.evaluate(()=>!document.querySelector('.slci')),'Le choix funky pendant la préparation rejoue l’intro');
  console.log('Préparation 1920×1080 : plus petit texte '+t[0][0]+' px ('+t[0][2]+')');
},{largeur:1920,hauteur:1080});
