/* Test du plateau en perspective (story 5.3, docs/ux.md §5.4). Écran en 1920×1080, régie en 390×844.
   Lancer depuis la racine du dépôt :   node tests/plateau.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie, sur une grille 4×4 lancée depuis la régie :
   - perspective : le rang du fond est nettement plus étroit que le premier (rapport des boîtes des rangs entre 1,35 et 1,7) ; les cases du fond sont moins hautes ;
   - étiquettes droites et plus petites au fond : noms d'au moins 40 px au premier rang et 28 px au dernier (en pixels
     d'écran) ;
   - barre du haut : logo et phrase de l'étape (« X choisit qui attaquer », puis « X défie Y en « catégorie » ») ;
   - tout tient sans défiler en 1920×1080 et en 1440×900 ;
   - « Détails » : fermé par défaut, s'ouvre et se ferme (aria-expanded, libellé), contient le prochain duel, la
     légende, les joueurs en lice et les boutons ; reste ouvert après un nouveau rendu ;
   - vague de capture : dure au moins 2 s (on vérifie qu'elle est encore en cours à 1,5 s et finie à 3,5 s) ;
   - mode allégé : délai de 260 ms par case de distance.
   Le test échoue à la moindre erreur JavaScript ou console.error. */
const {lancer,ouvrirEcranEtRegie,pause,etape}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

lancer('plateau',async env=>{
  const {jeu,regie}=await ouvrirEcranEtRegie(env,{});
  await regie.setViewportSize({width:390,height:844});
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.selectOption('#gmode','grid');await regie.selectOption('#gsize','4');
  await regie.click('#pdraw');await regie.click('#gosubmit');
  await jeu.waitForSelector('#grid:not([hidden])');
  // Tirage du premier attaquant (story 5.5) : clignotement de 6 s, puis « X commence ! » pendant 2 s.
  await pause(100);
  const ouv=await jeu.evaluate(()=>({draw:G.draw,ouv:G.drawOpen,aide:document.getElementById('gaide').textContent,titre:document.getElementById('gtitle').textContent}));
  attendu(ouv.draw&&ouv.ouv&&ouv.aide==='Tirage au sort : qui attaque en premier ?'&&ouv.titre==='Tirage au sort : qui commence ?','Ouverture : '+JSON.stringify(ouv));
  attendu(await jeu.isDisabled('#gdet')===false,'« Détails » reste utilisable pendant le tirage');
  const regieTirage=await regie.evaluate(()=>document.getElementById('rgrid').hidden);
  attendu(regieTirage,'La régie ne propose pas d’adversaire pendant le tirage');
  for(let k=0;k<6;k++){await jeu.clock.runFor(1000);await pause(30)}
  await pause(100);
  const tire=await jeu.evaluate(()=>({draw:G.draw,aide:document.getElementById('gaide').textContent,pick:document.querySelectorAll('#gboard .pick').length}));
  attendu(tire.draw&&/ commence !$/.test(tire.aide)&&tire.pick>=1,'Candidat tiré : '+JSON.stringify(tire));
  const info=await regie.evaluate(()=>document.getElementById('rinfo').textContent);
  attendu(/ commence !$/.test(info),'La régie annonce le premier attaquant : « '+info+' »');
  for(let k=0;k<3;k++){await jeu.clock.runFor(1000);await pause(30)}
  attendu(!(await jeu.evaluate(()=>G.draw)),'Tirage terminé après 8 s');
  await pause(200);

  etape('perspective');
  const g=await jeu.evaluate(()=>{
    const z=[...document.querySelectorAll('#gboard path.gz')].map(e=>e.getBoundingClientRect());
    const row=r=>z.slice(r*4,r*4+4),w=r=>row(r)[3].right-row(r)[0].left,h=r=>row(r)[0].height;
    const noms=[...document.querySelectorAll('#gboard tspan.gn')].map(t=>({y:t.getBoundingClientRect().top,px:t.getBoundingClientRect().height}));
    return{w0:w(0),w3:w(3),h0:h(0),h3:h(3),noms};
  });
  const ratio=g.w3/g.w0;
  attendu(ratio>1.35&&ratio<1.7,'Rapport premier rang / fond : '+ratio.toFixed(2));
  attendu(g.h3>g.h0*1.3,'Les cases du fond ne sont pas moins hautes : '+g.h0+' / '+g.h3);
  // Taille des noms à l'écran (hauteur de la boîte du texte ≈ taille de police) : plus grands devant.
  const parRang=[...g.noms].sort((a,b)=>a.y-b.y),fond=parRang[0].px,devant=parRang[parRang.length-1].px;
  attendu(devant>fond,'Noms pas plus petits au fond');
  const tailles=await jeu.evaluate(()=>{
    const svg=document.querySelector('#gboard svg'),k=svg.getBoundingClientRect().width/svg.viewBox.baseVal.width;
    const t=[...document.querySelectorAll('#gboard tspan.gn')].map(e=>({y:e.getBoundingClientRect().top,px:parseFloat(e.getAttribute('font-size'))*k})).sort((a,b)=>a.y-b.y);
    return{fond:t[0].px,devant:t[t.length-1].px};
  });
  attendu(tailles.devant>=40&&tailles.fond>=28,'Taille des noms (px à l’écran) : '+JSON.stringify(tailles));

  etape('barre du haut et place');
  attendu(await jeu.evaluate(()=>{const i=document.querySelector('.glogo');return i.complete&&i.naturalWidth>0}),'Logo absent de la barre du haut');
  const n=await jeu.evaluate(()=>G.players[G.ch].name);
  attendu((await jeu.textContent('#gaide'))===n+' choisit qui attaquer (case surlignée).','Phrase de la barre : '+await jeu.textContent('#gaide'));
  attendu(!await jeu.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),'Le plateau déborde en 1920×1080');

  etape('Détails');
  attendu(await jeu.isHidden('#gdetails')&&await jeu.getAttribute('#gdet','aria-expanded')==='false','« Détails » ouvert par défaut');
  await jeu.locator('#gboard path.gz.t').first().dispatchEvent('click');
  await jeu.clock.runFor(400); // fondu de la phrase (0,18 s)
  const d=await jeu.evaluate(()=>({nom:G.players[G.sel].name,cat:DATA[G.cells[G.sel].cat].label}));
  attendu((await jeu.textContent('#gaide'))===n+' défie '+d.nom+' en « '+d.cat+' ».','Phrase après le choix : '+await jeu.textContent('#gaide'));
  await jeu.click('#gdet');
  attendu(await jeu.isVisible('#gdetails')&&await jeu.getAttribute('#gdet','aria-expanded')==='true'&&(await jeu.textContent('#gdett'))==='Masquer les détails','« Détails » ne s’ouvre pas');
  for(const t of ['Lancer le duel','Changer d’adversaire','Quitter la partie'])attendu(await jeu.getByRole('button',{name:t}).isVisible(),'Bouton absent des détails : '+t);
  attendu(/en lice/.test(await jeu.textContent('#gstat'))&&/Adversaires possibles/.test(await jeu.textContent('#ghint')),'Légende ou joueurs en lice absents');
  await jeu.evaluate(()=>gridRender());
  attendu(await jeu.isVisible('#gdetails'),'« Détails » se referme après un nouveau rendu');
  await jeu.click('#gdet');
  attendu(await jeu.isHidden('#gdetails'),'« Détails » ne se ferme pas');

  etape('vague de capture ralentie');
  await jeu.clock.pauseAt(await jeu.evaluate(()=>Date.now()+500));
  await jeu.evaluate(()=>{S={winP:G.ch,loseP:G.sel,goldUse:[]};gridAfterDuel()});
  await jeu.clock.runFor(1500);await pause(50);
  attendu(await jeu.evaluate(()=>!!gAnimT),'Vague déjà finie à 1,5 s');
  await jeu.clock.runFor(2000);await pause(50);
  attendu(await jeu.evaluate(()=>!gAnimT),'Vague pas finie à 3,5 s');
  await jeu.clock.resume();

  etape('1440×900');
  await jeu.setViewportSize({width:1440,height:900});await pause(400);
  attendu(!await jeu.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),'Le plateau déborde en 1440×900');

  etape('mode allégé');
  attendu(await jeu.evaluate(()=>LITE_PAS)===260,'Délai par case du mode allégé : '+await jeu.evaluate(()=>LITE_PAS));
  console.log('Plateau 4×4 : rapport '+ratio.toFixed(2)+', noms '+Math.round(tailles.devant)+' px devant et '+Math.round(tailles.fond)+' px au fond');
},{largeur:1920,hauteur:1080});
