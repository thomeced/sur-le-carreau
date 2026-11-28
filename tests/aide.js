/* Test de l'aide à la prise en main, sur un écran 1920×1080 : cartes « Comment jouer » (story 1.1)
   et bandeau d'aide du plateau (story 1.2).
   Lancer depuis la racine du dépôt :   node tests/aide.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie : apparition des cartes pendant la préparation (5 en grille), tailles lisibles à 3 m (titre ≥ 56 px,
   phrase ≥ 40 px), passage à la 2e carte après 6 s, 3 cartes quand la régie choisit le duel simple, disparition
   au lancement de la partie sans minuterie restante, redémarrage propre après « Arrêter la partie » (une seule
   minuterie), et en mouvement réduit : 9 s par carte, sans fondu.
   Bandeau (grille 2×2 lancée par la régie) : un seul nœud aria-live, texte ≥ 32 px, phrases « choisit qui attaquer »,
   case d'or (état forcé : impossible à obtenir en 2×2), « gagne le duel », tirage au sort, « a conquis tout le sol ». */
const {lancer,ouvrirEcranEtRegie,pause,etape,ouvrirDetails}=require('./serveur.js');

// État visible des cartes sur l'écran du jeu.
const cartes=page=>page.evaluate(()=>{
  const c=document.getElementById('hcards'),dots=[...document.querySelectorAll('#hcdots li')];
  return{visible:!c.hidden&&!document.getElementById('home').hidden,titre:document.getElementById('hct').textContent,
    n:dots.length,active:dots.findIndex(d=>d.className==='on')};
});
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};
/* Avance l'horloge simulée par pas de 0,5 s en laissant passer les messages entre onglets : d'un seul bond, l'écran
   croirait la régie partie (plus de « hi » depuis 7 s) et arrêterait les cartes. */
async function avance(page,ms){for(let t=0;t<ms;t+=500){await page.clock.runFor(Math.min(500,ms-t));await pause(15)}}

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
  // Cadre « grand écran » des cartes (story 5.1, docs/ux.md §5.3) : 1280 px de large en 1920×1080.
  const larg=await jeu.evaluate(()=>document.getElementById('hcards').getBoundingClientRect().width);
  attendu(Math.abs(larg-1280)<30,'Largeur du cadre des cartes : '+Math.round(larg)+' px au lieu de 1280 px');

  etape('2e carte après 6 s');
  await avance(jeu,5500);
  attendu((await cartes(jeu)).active===0,'La carte a changé avant 6 s');
  await avance(jeu,1000);
  c=await cartes(jeu);
  attendu(c.titre==='Les chronos'&&c.active===1,'Après 6,5 s : '+JSON.stringify(c));

  etape('duel simple sur la régie : 3 cartes');
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.selectOption('#gmode','duel');
  await jeu.waitForFunction(()=>document.querySelectorAll('#hcdots li').length===3);
  c=await cartes(jeu);
  attendu(c.titre==='Le duel'&&c.active===0,'Après le passage en duel simple : '+JSON.stringify(c));
  await avance(jeu,6500*3);
  attendu((await cartes(jeu)).titre==='Le duel','En duel simple, la boucle doit revenir à la 1re carte après 3 cartes');

  etape('lancement : les cartes disparaissent, sans minuterie');
  await regie.fill('#n0','Léa');await regie.fill('#n1','Tom');
  await regie.click('#gosubmit');
  await jeu.waitForSelector('#game:not([hidden])');
  const st=await jeu.evaluate(()=>({mode:AIDE.mode,t:AIDE.t,f:AIDE.f,cache:document.getElementById('hcards').hidden}));
  attendu(st.mode===null&&!st.t&&!st.f&&st.cache,'Carrousel pas arrêté au lancement : '+JSON.stringify(st));

  etape('arrêt de la partie : redémarrage avec une seule minuterie');
  await regie.waitForSelector('#rquit:not([hidden])',{state:'attached'});
  await regie.click('#rmenu'); // « Arrêter la partie » est dans le menu « ⋯ » (story 5.4)
  await regie.click('#rquit');
  await jeu.waitForFunction(()=>!document.getElementById('hcards').hidden);
  await avance(jeu,6500);
  c=await cartes(jeu);
  attendu(c.active===1,'Après 6,5 s, une seule carte doit avoir passé : '+JSON.stringify(c));

  etape('mouvement réduit : 9 s par carte, sans fondu');
  await jeu.emulateMedia({reducedMotion:'reduce'});
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.selectOption('#gmode','grid'); // changement de mode : le carrousel repart de la 1re carte
  await jeu.waitForFunction(()=>document.querySelectorAll('#hcdots li').length===5);
  const tr=await jeu.evaluate(()=>getComputedStyle(document.getElementById('hcard')).transitionDuration);
  attendu(tr==='0s','Fondu encore présent en mouvement réduit : '+tr);
  await avance(jeu,8500);
  attendu((await cartes(jeu)).active===0,'En mouvement réduit, la carte a changé avant 9 s');
  await avance(jeu,1000);
  c=await cartes(jeu);
  attendu(c.active===1&&c.titre==='Les chronos','En mouvement réduit, après 9,5 s : '+JSON.stringify(c));

  etape('bandeau : grille 2×2 lancée par la régie');
  await regie.selectOption('#gsize','2');
  await regie.click('#pdraw');
  await regie.click('#gosubmit');
  await jeu.waitForSelector('#grid:not([hidden])');
  const bandeau=()=>jeu.evaluate(()=>{const b=document.getElementById('gaide');return{txt:b.textContent,gras:(b.querySelector('strong')||{}).textContent||''}});
  const nomEnCours=()=>jeu.evaluate(()=>G.players[G.ch].name);
  const live=await jeu.evaluate(()=>[...document.querySelectorAll('#grid [aria-live]')].filter(e=>e.id==='gaide').length+'/'+document.getElementById('gaide').getAttribute('aria-live'));
  attendu(live==='1/polite','Bandeau : un seul nœud aria-live="polite" attendu ('+live+')');
  const taille=await jeu.evaluate(()=>parseFloat(getComputedStyle(document.getElementById('gaide')).fontSize));
  attendu(taille>=32,'Bandeau trop petit en 1920×1080 : '+taille+' px');
  let b=await bandeau(),n;
  // Tirage du premier attaquant (story 5.5) : en mouvement réduit, pas de clignotement, la phrase reste 0,6 s.
  attendu(b.txt==='Tirage au sort : qui attaque en premier ?','Ouverture du plateau : « '+b.txt+' »');
  await avance(jeu,700);
  b=await bandeau();
  attendu(/^Joueur \d commence !$/.test(b.txt)&&b.txt.startsWith(b.gras),'Premier attaquant tiré : « '+b.txt+' »');
  await avance(jeu,2500);
  b=await bandeau();n=await nomEnCours();
  attendu(b.txt===n+' choisit qui attaquer (case surlignée).'&&b.gras===n,'Message 1 : « '+b.txt+' »');

  etape('bandeau : case d’or (état forcé)');
  await jeu.evaluate(()=>{G.players[G.ch].gold=true;gridRender()});
  await jeu.locator('#gboard path.gz.t').first().dispatchEvent('click');
  b=await bandeau();
  attendu(b.txt===n+' peut utiliser sa case d’or : +5 s.','Message 2 : « '+b.txt+' »');
  await jeu.evaluate(()=>{G.players[G.ch].gold=false;G.use.clear();G.sel=null;gridRender()});
  b=await bandeau();
  attendu(b.txt===n+' choisit qui attaquer (case surlignée).','Retour au message 1 : « '+b.txt+' »');

  // Joue un duel de la grille : premier adversaire, démarrage, chronos vidés, retour à la grille.
  const duel=async()=>{
    await jeu.locator('#gboard path.gz.t').first().dispatchEvent('click');
    await ouvrirDetails(jeu);
    await jeu.getByRole('button',{name:'Lancer le duel'}).click();
    await jeu.waitForSelector('#game:not([hidden])');
    for(let k=0;k<20&&await jeu.isDisabled('#go');k++){await avance(jeu,1000);await pause(30)}
    await jeu.click('#go');
    for(let k=0;k<60&&await jeu.isHidden('#end');k++){await avance(jeu,2000);await pause(20)}
    await jeu.click('#again');
    await jeu.waitForSelector('#grid:not([hidden])');
    await avance(jeu,3000);
  };

  etape('bandeau : gagne le duel');
  await duel();
  n=await nomEnCours();b=await bandeau();
  attendu(b.txt===n+' gagne le duel : défier un voisin ou retourner sur le sol ?'&&b.gras===n,'Message 3 : « '+b.txt+' »');

  etape('bandeau : retour sur le sol');
  await ouvrirDetails(jeu);
  await jeu.getByRole('button',{name:'Retourner sur le sol'}).click();
  b=await bandeau();
  attendu(b.txt==='Retour sur le sol : un nouvel attaquant est tiré au sort…','Message 4 : « '+b.txt+' »');
  await avance(jeu,4000); // tirage (0,6 s en mouvement réduit) puis 2 s de mise en avant
  n=await nomEnCours();b=await bandeau();
  attendu(b.txt===n+' choisit qui attaquer (case surlignée).','Après le tirage : « '+b.txt+' »');

  etape('bandeau : fin de partie');
  for(let k=0;k<3&&!await jeu.evaluate(()=>G.over);k++)await duel();
  n=await nomEnCours();b=await bandeau();
  attendu(b.txt===n+' a conquis tout le sol !'&&b.gras===n,'Message 5 : « '+b.txt+' »');

  etape('bandeau absent du duel simple');
  attendu(await jeu.evaluate(()=>!document.getElementById('game').contains(document.getElementById('gaide'))),'Le bandeau ne doit pas être dans l’écran du duel');
},{largeur:1920,hauteur:1080});
