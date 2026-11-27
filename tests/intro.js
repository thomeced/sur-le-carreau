/* Test de l'intro (mode funky), story 2.4 : nouveaux visuels.
   Lancer depuis la racine du dépôt :   node tests/intro.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie : l'intro se lance (?mode=funky), ses 5 images (plateau, animateur, deux groupes de candidats, logo) se
   chargent sans erreur et avec les bonnes proportions, le logo remplace le titre en texte, l'écran du plateau ne porte
   plus de texte par-dessus, et « Passer l'intro » rend la main au jeu (slc:intro-end). */
const {lancer,pause}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

lancer('intro',async env=>{
  const p=await env.page('écran');
  await p.goto(env.url+'index.html?mode=funky');
  await p.evaluate(()=>{window.__fin=false;document.addEventListener('slc:intro-end',()=>window.__fin=true);SLC_INTRO.start()});
  await p.waitForSelector('.slci.slci-ready',{timeout:10000});
  const imgs=await p.evaluate(()=>[...document.querySelectorAll('.slci img')].map(i=>({src:i.getAttribute('src').split('?')[0].split('/').pop(),w:i.naturalWidth,h:i.naturalHeight,ok:i.complete&&i.naturalWidth>0})));
  const noms=imgs.map(i=>i.src).sort().join(',');
  attendu(noms==='cand-left.webp,cand-right.webp,decor.webp,host.webp,logo.webp','Images de l’intro : '+noms);
  attendu(imgs.every(i=>i.ok),'Image non chargée : '+JSON.stringify(imgs.filter(i=>!i.ok)));
  const r=Object.fromEntries(imgs.map(i=>[i.src,i.w/i.h]));
  // L'animateur garde la proportion de l'ancien calque (693/991), le plateau celle de sa boîte (16/9).
  attendu(Math.abs(r['host.webp']-693/991)<.01&&Math.abs(r['decor.webp']-16/9)<.01,'Proportions : '+JSON.stringify(r));
  const t=await p.evaluate(()=>({logo:!!document.querySelector('.slci-title.slci-logo img'),texte:document.querySelector('.slci-title').textContent.trim(),ecran:!!document.querySelector('.slci-screen')}));
  attendu(t.logo&&t.texte===''&&!t.ecran,'Titre de l’intro : '+JSON.stringify(t));
  await p.click('.slci-skip');
  await p.waitForFunction(()=>window.__fin&&!document.querySelector('.slci'),null,{timeout:5000});
  await pause(100);
});
