/* Test des cartes « Comment jouer » (story 1.1), sur un écran 1920×1080.
   Lancer depuis la racine du dépôt :   node tests/aide.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie : apparition des cartes pendant la préparation (5 en grille), tailles lisibles à 3 m (titre ≥ 56 px,
   phrase ≥ 40 px), passage à la 2e carte après 6 s, 3 cartes quand la régie choisit le duel simple, disparition
   au lancement de la partie sans minuterie restante, redémarrage propre après « Arrêter la partie » (une seule
   minuterie), et en mouvement réduit : 9 s par carte, sans fondu. */
const {lancer,ouvrirEcranEtRegie,pause,etape}=require('./serveur.js');

// État visible des cartes sur l'écran du jeu.
const cartes=page=>page.evaluate(()=>{
  const c=document.getElementById('hcards'),dots=[...document.querySelectorAll('#hcdots li')];
  return{visible:!c.hidden&&!document.getElementById('home').hidden,titre:document.getElementById('hct').textContent,
    n:dots.length,active:dots.findIndex(d=>d.className==='on')};
});
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

lancer('aide',async env=>{
  const {jeu,regie}=await ouvrirEcranEtRegie(env);
  regie.on('dialog',d=>d.accept()); // « Arrêter la partie en cours ? »

  etape('apparition pendant la préparation');
  await jeu.waitForFunction(()=>!document.getElementById('hcards').hidden);
  let c=await cartes(jeu);
  attendu(c.titre==='Le duel'&&c.n===5&&c.active===0,'Première carte inattendue : '+JSON.stringify(c));

  etape('tailles lisibles à 3 m');
  const px=await jeu.evaluate(()=>[parseFloat(getComputedStyle(document.getElementById('hct')).fontSize),parseFloat(getComputedStyle(document.getElementById('hcp')).fontSize)]);
  attendu(px[0]>=56&&px[1]>=40,'Textes trop petits en 1920×1080 : titre '+px[0]+' px, phrase '+px[1]+' px');
  const larg=await jeu.evaluate(()=>document.getElementById('hprep').getBoundingClientRect().width);
  attendu(Math.abs(larg-0.6*1920)<30,'Largeur du panneau des cartes : '+Math.round(larg)+' px au lieu de 60 % de l’écran');

  etape('2e carte après 6 s');
  await jeu.clock.runFor(5500);
  attendu((await cartes(jeu)).active===0,'La carte a changé avant 6 s');
  await jeu.clock.runFor(1000);
  c=await cartes(jeu);
  attendu(c.titre==='Les chronos'&&c.active===1,'Après 6,5 s : '+JSON.stringify(c));

  etape('duel simple sur la régie : 3 cartes');
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.selectOption('#gmode','duel');
  await jeu.waitForFunction(()=>document.querySelectorAll('#hcdots li').length===3);
  c=await cartes(jeu);
  attendu(c.titre==='Le duel'&&c.active===0,'Après le passage en duel simple : '+JSON.stringify(c));
  await jeu.clock.runFor(6500*3);
  attendu((await cartes(jeu)).titre==='Le duel','En duel simple, la boucle doit revenir à la 1re carte après 3 cartes');

  etape('lancement : les cartes disparaissent, sans minuterie');
  await regie.fill('#n0','Léa');await regie.fill('#n1','Tom');
  await regie.click('#gosubmit');
  await jeu.waitForSelector('#game:not([hidden])');
  const st=await jeu.evaluate(()=>({mode:AIDE.mode,t:AIDE.t,f:AIDE.f,cache:document.getElementById('hcards').hidden}));
  attendu(st.mode===null&&!st.t&&!st.f&&st.cache,'Carrousel pas arrêté au lancement : '+JSON.stringify(st));

  etape('arrêt de la partie : redémarrage avec une seule minuterie');
  await regie.waitForSelector('#rquit:not([hidden])');
  await regie.click('#rquit');
  await jeu.waitForFunction(()=>!document.getElementById('hcards').hidden);
  await jeu.clock.runFor(6500);
  c=await cartes(jeu);
  attendu(c.active===1,'Après 6,5 s, une seule carte doit avoir passé : '+JSON.stringify(c));

  etape('mouvement réduit : 9 s par carte, sans fondu');
  await jeu.emulateMedia({reducedMotion:'reduce'});
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.selectOption('#gmode','grid'); // changement de mode : le carrousel repart de la 1re carte
  await jeu.waitForFunction(()=>document.querySelectorAll('#hcdots li').length===5);
  const tr=await jeu.evaluate(()=>getComputedStyle(document.getElementById('hcard')).transitionDuration);
  attendu(tr==='0s','Fondu encore présent en mouvement réduit : '+tr);
  await jeu.clock.runFor(8500);
  attendu((await cartes(jeu)).active===0,'En mouvement réduit, la carte a changé avant 9 s');
  await jeu.clock.runFor(1000);
  c=await cartes(jeu);
  attendu(c.active===1&&c.titre==='Les chronos','En mouvement réduit, après 9,5 s : '+JSON.stringify(c));
  await pause(100);
},{largeur:1920,hauteur:1080});
