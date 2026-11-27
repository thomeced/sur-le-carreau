/* Test de l'intro (mode funky), story 2.4 : nouveaux visuels.
   Lancer depuis la racine du dépôt :   node tests/intro.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie : l'intro se lance (?mode=funky), ses 15 images (plateau, animateur en pied, 12 candidats, logo) se chargent
   sans erreur ; la caméra traverse le couloir (les candidats les plus proches grandissent puis s'effacent, l'animateur
   grandit) ; à la fin, l'animateur est entier à l'écran et sous le logo ; « Passer l'intro » rend la main au jeu. */
const {lancer,pause}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

lancer('intro',async env=>{
  const p=await env.page('écran');
  await p.goto(env.url+'index.html?mode=funky');
  await p.evaluate(()=>{window.__fin=false;document.addEventListener('slc:intro-end',()=>window.__fin=true);SLC_INTRO.start()});
  await p.waitForSelector('.slci.slci-ready',{timeout:10000});
  const imgs=await p.evaluate(()=>[...document.querySelectorAll('.slci img')].map(i=>({src:i.getAttribute('src').split('?')[0].split('/').pop(),ok:i.complete&&i.naturalWidth>0})));
  const noms=imgs.map(i=>i.src).sort();
  attendu(noms.length===15&&noms.includes('decor.webp')&&noms.includes('host.webp')&&noms.includes('logo.webp')&&noms.filter(n=>/^cand-\d\d\.webp$/.test(n)).length===12,'Images de l’intro : '+noms.join(', '));
  attendu(imgs.every(i=>i.ok),'Image non chargée : '+JSON.stringify(imgs.filter(i=>!i.ok)));
  // Boîtes à l'écran : animateur (2e image de la scène) et candidat le plus proche (3e).
  const boite=()=>p.evaluate(()=>{const o=[...document.querySelectorAll('.slci-o')],r=e=>{const b=e.getBoundingClientRect();return{h:b.height,top:b.top,bot:b.bottom,op:+getComputedStyle(e).opacity}};
    const l=document.querySelector('.slci-logo img').getBoundingClientRect();return{host:r(o[1]),proche:r(o[2]),logoBas:l.bottom,H:innerHeight}});
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const debut=await boite();
  await pause(6000);
  const milieu=await boite();
  attendu(milieu.host.h>debut.host.h*1.15,'L’animateur ne grandit pas assez : '+debut.host.h+' → '+milieu.host.h);
  attendu(milieu.proche.op<1,'Le candidat le plus proche ne s’efface pas en passant la caméra');
  await pause(6500);
  const fin=await boite();
  attendu(fin.host.h>debut.host.h*1.6,'La caméra n’approche pas assez de l’animateur : '+debut.host.h+' → '+fin.host.h);
  attendu(fin.host.top>=0&&fin.host.bot<=fin.H,'Animateur coupé à la fin : '+JSON.stringify(fin.host));
  attendu(fin.host.top>fin.logoBas,'Le logo recouvre la tête de l’animateur : haut de l’animateur '+Math.round(fin.host.top)+' px, bas du logo '+Math.round(fin.logoBas)+' px');
  await p.click('.slci-skip');
  await p.waitForFunction(()=>window.__fin&&!document.querySelector('.slci'),null,{timeout:5000});
  await pause(100);
});
