/* Test du duel en bandeau (story 5.2, docs/ux.md §5.5), écran en 1920×1080, régie en 390×844.
   Lancer depuis la racine du dépôt :   node tests/duel.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie, sur un duel photo puis un duel mot à trous :
   - attente : étape ph-wait, logo, « A contre B », consigne du type, « Prêts ? », chronos éteints ;
   - compte à rebours : ph-cd, « X commence » et le chiffre, le chrono du joueur qui commence allumé, « Départ dans 3… » ;
   - en cours : ph-run, photo qui remplit le grand écran, niveau dans la zone de réponse ;
   - « Bonne réponse » : zone verte avec la réponse, étiquette « Bonne réponse », la main passe ;
   - « Passé » (mot à trous) : zone rouge avec la réponse, étiquette « Passé · NOM −3 s », lettres manquantes révélées ;
   - fin : ph-end, coupe et « NOM remporte le duel ! » dans le grand écran, zone violette « NOM gagne », chrono du
     vainqueur allumé ;
   - à chaque étape : rien à faire défiler, aucun texte visible sous 28 px dans #game.
   Le test échoue à la moindre erreur JavaScript ou console.error. */
const {lancer,ouvrirEcranEtRegie,pause,etape}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

const etat=jeu=>jeu.evaluate(()=>{
  const g=document.getElementById('game'),tailles=[];
  g.querySelectorAll('*').forEach(e=>{
    if(e.closest('.sr,form,#pass'))return;
    if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;
    const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
    tailles.push([parseFloat(getComputedStyle(e).fontSize),e.id||e.className||e.tagName]);
  });
  tailles.sort((a,b)=>a[0]-b[0]);
  const vis=id=>{const e=document.getElementById(id);return!!e&&e.getBoundingClientRect().height>0};
  return{ph:g.className,dans:document.getElementById('dans').className,tag:document.getElementById('dtag').textContent,
    txt:document.getElementById('dtxt').textContent,on:[0,1].map(i=>document.getElementById('s'+i).classList.contains('on')),
    min:tailles[0],deborde:document.documentElement.scrollHeight>innerHeight+1,
    attente:vis('dwait'),cd:vis('dcd'),carte:vis('card'),fin:vis('end'),cdw:document.getElementById('dcdw').textContent,
    cdn:document.getElementById('dcdn').textContent,win:document.getElementById('win').textContent,
    names:S&&S.names,turn:S&&S.turn};
});
const verifier=(e,quoi)=>{
  attendu(!e.deborde,quoi+' : l’écran déborde en 1920×1080');
  attendu(!e.min||e.min[0]>=27.5,quoi+' : texte trop petit '+JSON.stringify(e.min));
};

async function duel(jeu,regie,cat){
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.selectOption('#gmode','duel');await regie.fill('#n0','Léa');await regie.fill('#n1','Hugo');
  await regie.selectOption('#cat',cat);await regie.click('#gosubmit');
  await jeu.waitForSelector('#game:not([hidden])');await regie.waitForSelector('#rgo:not([hidden])');await pause(200);
  let e=await etat(jeu);
  attendu(e.ph==='ph-wait'&&e.attente&&!e.carte&&!e.cd,'Attente : '+JSON.stringify(e));
  attendu(e.txt==='Prêts ?','Zone de réponse en attente : '+e.txt);
  attendu(/Léa/.test(await jeu.textContent('#dvs0'))&&/Hugo/.test(await jeu.textContent('#dvs1'))&&(await jeu.textContent('#dcons')).length>10,'Attente : noms ou consigne absents');
  attendu(await jeu.evaluate(()=>getComputedStyle(document.querySelector('#s0 .nm')).backgroundColor===getComputedStyle(document.querySelector('#s1 .nm')).backgroundColor),'Un chrono est allumé avant le départ');
  verifier(e,'Attente');
  await regie.click('#rgo');await pause(200);
  e=await etat(jeu);
  attendu(e.ph==='ph-cd'&&e.cd&&e.cdn==='3'&&e.cdw===e.names[e.turn]+' commence'&&/Départ dans 3/.test(e.txt),'Compte à rebours : '+JSON.stringify(e));
  attendu(e.on[e.turn],'Le chrono du joueur qui commence n’est pas allumé pendant le compte à rebours');
  verifier(e,'Compte à rebours');
  await jeu.clock.runFor(3500);await jeu.waitForFunction(()=>S.started);
  await jeu.clock.pauseAt(await jeu.evaluate(()=>Date.now()+1000));await pause(200);
  e=await etat(jeu);
  attendu(e.ph==='ph-run'&&e.carte&&/Niveau 1/.test(e.txt)&&/\brun\b/.test(e.dans),'En cours : '+JSON.stringify(e));
  verifier(e,'En cours');
  return e;
}

lancer('duel',async env=>{
  const {jeu,regie}=await ouvrirEcranEtRegie(env,{});
  await regie.setViewportSize({width:390,height:844});

  etape('duel photo');
  let e=await duel(jeu,regie,'pho_outils');
  const img=await jeu.evaluate(()=>{const i=document.querySelector('#card img'),r=i.getBoundingClientRect(),s=document.querySelector('.dscreen').getBoundingClientRect();return{h:r.height,H:s.height}});
  attendu(img.h>img.H*0.85,'La photo ne remplit pas le grand écran : '+JSON.stringify(img));
  const rep=await jeu.evaluate(()=>{const a=S.cur[1].split('|')[0];return a.charAt(0).toUpperCase()+a.slice(1)});
  const avant=e.turn;
  await regie.click('#bok');await pause(150);
  e=await etat(jeu);
  attendu(/\bgood\b/.test(e.dans)&&e.tag==='Bonne réponse'&&e.txt===rep,'Bonne réponse : '+JSON.stringify(e));
  attendu(e.turn===(avant^1)&&e.on[avant^1],'La main n’est pas passée');
  verifier(e,'Bonne réponse');
  await jeu.clock.runFor(1500);await pause(100);
  e=await etat(jeu);
  attendu(/\brun\b/.test(e.dans),'La zone de réponse ne revient pas au niveau après 1,4 s : '+e.dans);

  etape('fin du duel');
  await jeu.evaluate(()=>{S.t[S.turn]=800});
  await jeu.clock.resume();await jeu.clock.runFor(2500);
  await jeu.waitForFunction(()=>S.over);await pause(200);
  e=await etat(jeu);
  const gagnant=e.names[e.turn^1];
  attendu(e.ph==='ph-end'&&e.fin&&e.win===gagnant+' remporte le duel !','Fin : '+JSON.stringify(e));
  attendu(/\bend\b/.test(e.dans)&&e.txt===gagnant+' gagne'&&e.tag==='Fin du duel','Zone de fin : '+JSON.stringify(e));
  attendu(await jeu.evaluate(w=>getComputedStyle(document.querySelector('#s'+w+' .nm')).backgroundColor!=='rgb(38, 50, 110)',e.turn^1),'Le chrono du vainqueur n’est pas allumé');
  attendu(await jeu.isVisible('#again'),'Bouton de fin absent');
  verifier(e,'Fin');
  await regie.click('#rnew');

  etape('duel mot à trous : « Passé »');
  e=await duel(jeu,regie,'anatomie');
  const mot=await jeu.evaluate(()=>({rep:S.cur[1].split('|')[0],trous:[...S.disp].filter(c=>c==='_').length,nom:S.names[S.turn]}));
  await jeu.evaluate(()=>{S.t[S.turn]=20000});
  await regie.click('#bpass');await pause(150);
  e=await etat(jeu);
  attendu(/\bpass\b/.test(e.dans)&&e.tag==='Passé · '+mot.nom+' −3 s'&&e.txt.toLowerCase()===mot.rep.toLowerCase(),'Passé : '+JSON.stringify(e));
  const rev=await jeu.evaluate(()=>({r:document.querySelectorAll('#card .slcm-l.r').length,h:document.querySelectorAll('#card .slcm-l.h').length,
    mot:[...document.querySelectorAll('#card .slcm-l,#card .slcm-p')].map(x=>x.textContent).join('')}));
  attendu(rev.r===mot.trous&&rev.h===0&&rev.mot===mot.rep.toUpperCase().replace(/\s/g,''),'Lettres révélées : '+JSON.stringify(rev)+' pour '+JSON.stringify(mot));
  verifier(e,'Passé');
  console.log('Duel en bandeau : attente, 3-2-1, photo, bonne réponse, fin, « Passé » révélé ('+mot.rep+')');
},{largeur:1920,hauteur:1080});
