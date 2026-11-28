/* Test des choix en grille sur la régie (story 2.8) : l'écran du jeu reste passif, tout se joue depuis le téléphone.
   Lancer depuis la racine du dépôt :   node tests/regie-grille.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Déroulé : écran du jeu sur index.html sans ?mode=serieux (mode funky par défaut : l'intro démarre à la connexion),
   régie en 390×844. La régie choisit « Sérieux » (story 5.1) : l'intro s'arrête, l'écran passe en
   préparation. Elle configure une grille 2×2, puis joue toute la partie sans toucher l'écran du jeu :
   adversaire choisi par un bouton (nom et catégorie), « Changer d'adversaire », « Retourner sur le sol »,
   « Lancer le duel », « Démarrer le duel », verdicts, « Retour à la grille » après chaque duel, jusqu'au vainqueur.
   Vérifie aussi que l'écran et la régie montrent le même adversaire choisi et que les boutons font au moins 44 px.
   Le test échoue à la moindre erreur JavaScript ou console.error, dans l'un ou l'autre onglet. */
const {lancer,ouvrirEcranEtRegie,pause,etape}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

async function avancerJusqua(jeu,page,cond,{pas=1000,max=120000,quoi='condition'}={}){
  for(let t=0;t<=max;t+=pas){
    if(await page.evaluate(cond))return;
    await jeu.clock.runFor(pas);
    await pause(40);
  }
  throw new Error('Toujours pas atteint après '+max/1000+' s simulées : '+quoi);
}
// Boutons visibles de la zone de choix en grille de la régie.
const choix=regie=>regie.evaluate(()=>[...document.querySelectorAll('#rgrid:not([hidden]) button')].map(b=>({f:b.dataset.f,t:b.textContent,h:b.getBoundingClientRect().height})));

lancer('regie-grille',async env=>{
  const {jeu,regie}=await ouvrirEcranEtRegie(env,{lancement:true});
  await regie.setViewportSize({width:390,height:844});

  etape('lancement : intro en funky à la connexion, puis « Sérieux » choisi sur le téléphone');
  await regie.waitForSelector('#rlance:not([hidden])');
  attendu(await jeu.evaluate(()=>SLC_INTRO.started&&!document.documentElement.classList.contains('slc-serieux')),'Intro pas lancée en funky à la connexion du téléphone');
  attendu(await regie.getAttribute('#rlance [data-lm="funky"]','aria-pressed')==='true','La régie ne montre pas le mode funky de l’écran');
  await regie.click('#rlance [data-lm="serieux"]');
  await avancerJusqua(jeu,jeu,()=>document.documentElement.classList.contains('slc-serieux')&&!document.querySelector('.slci')&&/Partie en préparation/.test(document.getElementById('hph2').textContent)&&!document.getElementById('hprep').hidden,{pas:500,max:10000,quoi:'intro arrêtée et préparation après « Sérieux »'});
  attendu(await jeu.evaluate(()=>localStorage.getItem('slc-mode'))==='serieux','Choix « sérieux » pas retenu');
  attendu(await jeu.getAttribute('#home [data-lm="serieux"]','aria-pressed')==='true','La bascule de l’accueil ne suit pas le choix de la régie');

  etape('configuration d’une grille 2×2 sur la régie');
  await regie.waitForSelector('#arb #setup:not([hidden])');
  attendu(await regie.isHidden('#rlance'),'Bascule de l’attente encore visible pendant la configuration');
  attendu(await regie.getAttribute('#setup [data-lm="serieux"]','aria-pressed')==='true','La configuration de la régie ne montre pas le mode sérieux');
  await regie.selectOption('#gmode','grid');
  await regie.selectOption('#gsize','2');
  await regie.click('#pdraw');
  await regie.click('#gosubmit');
  await jeu.waitForSelector('#grid:not([hidden])');

  let duels=0,solFait=false,changeFait=false;
  for(;;){
    await avancerJusqua(jeu,jeu,()=>!document.getElementById('gpanel').textContent.includes('Tirage au sort'),{quoi:'fin du tirage'});
    await jeu.clock.runFor(2000);await pause(100);
    if(await jeu.evaluate(()=>G.over))break;
    attendu(duels<3,'Plus de 3 duels dans une grille 2×2');
    await regie.waitForFunction(()=>document.querySelector('#rgrid:not([hidden]) [data-f^="sel"]'));
    let c=await choix(regie);
    const foes=c.filter(b=>b.f.startsWith('sel'));
    const attendus=await jeu.evaluate(()=>gfoes().map(q=>G.players[q].name).sort().join('|'));
    attendu(foes.every(b=>attendus.split('|').some(n=>b.t.startsWith(n))),'Adversaires de la régie '+foes.map(b=>b.t).join(', ')+' ≠ écran '+attendus);
    attendu(c.every(b=>b.h>=44),'Bouton de la régie trop petit : '+JSON.stringify(c));

    // Une fois : « Retourner sur le sol » depuis la régie (tirage animé sur l'écran).
    if(!solFait&&c.some(b=>b.f==='sol')){
      solFait=true;etape('retourner sur le sol');
      await regie.click('#rgrid [data-f="sol"]');
      await jeu.waitForFunction(()=>G.draw);
      await regie.waitForSelector('#rgrid',{state:'hidden'});
      continue;
    }
    etape('choix de l’adversaire');
    await regie.click('#rgrid [data-f="'+foes[0].f+'"]');
    const q=+foes[0].f.slice(3);
    await jeu.waitForFunction(q=>G.sel===q,q);
    await regie.waitForSelector('#rgrid [data-f="duel"]');
    if(!changeFait){
      changeFait=true;
      await regie.click('#rgrid [data-f="unsel"]');
      await jeu.waitForFunction(()=>G.sel==null);
      await regie.waitForSelector('#rgrid [data-f="'+foes[0].f+'"]');
      await regie.click('#rgrid [data-f="'+foes[0].f+'"]');
      await regie.waitForSelector('#rgrid [data-f="duel"]');
    }
    await regie.click('#rgrid [data-f="duel"]');
    await jeu.waitForSelector('#game:not([hidden])');

    etape('duel '+(duels+1));
    await regie.waitForSelector('#rgo:not([hidden])');
    attendu(await regie.isVisible('#rback'),'« Changer d’adversaire » absent de la régie avant le duel');
    await regie.click('#rgo');
    await avancerJusqua(jeu,jeu,()=>/de jouer/.test(document.getElementById('who').textContent),{max:10000,quoi:'début du duel'});
    await regie.waitForSelector('#bok:not([disabled])');
    attendu(await regie.isHidden('#rgrid'),'Choix en grille visibles pendant le duel');
    await regie.click('#bok');
    await jeu.waitForFunction(()=>parseInt(document.getElementById('sc0').textContent)+parseInt(document.getElementById('sc1').textContent)===1);
    await avancerJusqua(jeu,jeu,()=>!document.getElementById('end').hidden,{pas:2000,quoi:'fin du duel'});
    duels++;
    await regie.waitForSelector('#ragain:not([hidden])');
    await regie.click('#ragain');
    await jeu.waitForSelector('#grid:not([hidden])');
  }
  attendu(duels===3,'Une grille 2×2 doit se jouer en 3 duels, joués : '+duels);
  attendu(solFait&&changeFait,'« Retourner sur le sol » ou « Changer d’adversaire » pas essayé');
  await regie.waitForSelector('#rnew:not([hidden])');
  attendu(await regie.isHidden('#rgrid'),'Choix en grille encore visibles en fin de partie');
  console.log('Partie 2×2 jouée depuis la régie : '+duels+' duels, '+(await jeu.textContent('#gtitle')).trim());
});
