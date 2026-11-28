/* Test de la régie refaite (story 5.4, docs/ux.md §5.6), régie en 390×844.
   Lancer depuis la racine du dépôt :   node tests/regie-ui.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie :
   - en-tête : « Écran CODE ✓ », bouton « ? », menu « ⋯ » (aria-expanded, « Changer d'écran », fermeture par Échap) ;
   - configuration : titre « Préparez la partie », mode et taille en boutons (aria-pressed, la liste masquée suit,
     3×3 donne 9 noms), 6 catégories visibles puis « Voir les N autres », liste d'ajout derrière « Ajouter… », noms des
     joueurs derrière « Saisir les noms » ;
   - choix de l'adversaire : mini-plateau (une case par joueur, joueur en cours en violet), phrase « X choisit son
     adversaire », adversaires en boutons ;
   - avant le duel : « A contre B », pas de boutons de verdict ; pendant le duel : réponse attendue en grand (celle de
     l'élément affiché sur l'écran), vignette, « Bonne réponse » et « Passé » ; « Arrêter la partie » dans le menu.
   Le test échoue à la moindre erreur JavaScript ou console.error. */
const {lancer,ouvrirEcranEtRegie,pause,etape}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

lancer('regie-ui',async env=>{
  const {jeu,regie,code}=await ouvrirEcranEtRegie(env,{});
  await regie.setViewportSize({width:390,height:844});
  await regie.waitForSelector('#arb #setup:not([hidden])');

  etape('en-tête et menu');
  attendu((await regie.textContent('#rscreen'))==='Écran '+code+' ✓','Pastille de l’écran : '+await regie.textContent('#rscreen'));
  attendu(await regie.isVisible('#rhelp')&&await regie.isVisible('#rmenu'),'« ? » ou « ⋯ » absent');
  await regie.click('#rmenu');
  attendu(await regie.isVisible('#rchange')&&await regie.getAttribute('#rmenu','aria-expanded')==='true','Menu pas ouvert');
  attendu(!await regie.isVisible('#rquit'),'« Arrêter la partie » visible hors partie');
  await regie.keyboard.press('Escape');
  attendu(await regie.isHidden('#rmenup')&&await regie.getAttribute('#rmenu','aria-expanded')==='false','Échap ne ferme pas le menu');

  etape('configuration compacte');
  attendu((await regie.textContent('#sh1'))==='Préparez la partie'&&await regie.isHidden('#lead'),'Titre de la configuration');
  const seg=s=>regie.locator('#setup .segw[aria-label="'+s+'"] button');
  attendu(await seg('Mode de jeu').count()===2&&await seg('Taille de la grille').count()===3,'Boutons de mode ou de taille absents');
  await seg('Taille de la grille').filter({hasText:'3×3'}).click();
  attendu(await regie.inputValue('#gsize')==='3'&&await seg('Taille de la grille').filter({hasText:'3×3'}).getAttribute('aria-pressed')==='true','Taille 3×3 pas appliquée');
  attendu(await regie.isHidden('#gnames'),'Noms dépliés par défaut');
  await regie.click('#gnbtn');
  attendu(await regie.locator('#gnames input').count()===9&&await regie.isVisible('#gnames input'),'« Saisir les noms » : 9 champs attendus');
  await regie.click('#gnbtn');
  // Une grille réduite ne retire rien sans l'accord du joueur : les 16 catégories du 4×4 restent choisies.
  const tot=await regie.locator('#pchosen .chip').count();
  const vis=await regie.evaluate(()=>[...document.querySelectorAll('#pchosen .chip')].filter(c=>!c.hidden).length);
  attendu(tot>7&&vis===6&&(await regie.textContent('#pmore'))==='Voir les '+(tot-6)+' autres','Catégories visibles : '+vis+' sur '+tot+', bouton : '+await regie.textContent('#pmore'));
  await regie.click('#pmore');
  attendu(await regie.evaluate(()=>[...document.querySelectorAll('#pchosen .chip')].filter(c=>!c.hidden).length)===tot,'« Voir les autres » ne montre pas tout');
  attendu(await regie.isHidden('#ppool'),'Liste d’ajout ouverte par défaut');
  await regie.click('#padd');
  attendu(await regie.isVisible('#ppool')&&await regie.getAttribute('#padd','aria-expanded')==='true','« Ajouter… » ne montre pas la liste');
  await regie.click('#padd');
  await seg('Taille de la grille').filter({hasText:'2×2'}).click();
  await regie.click('#ptrim'); // retire les catégories en trop pour la grille 2×2
  await seg('Mode de jeu').filter({hasText:'Duel'}).click();
  attendu(await regie.inputValue('#gmode')==='duel'&&await regie.isVisible('#n0'),'Mode duel pas appliqué');
  await seg('Mode de jeu').filter({hasText:'Grille'}).click();

  etape('choix de l’adversaire');
  await regie.click('#gosubmit');
  await jeu.waitForSelector('#grid:not([hidden])');
  for(let k=0;k<9;k++){await jeu.clock.runFor(1000);await pause(30)}
  await regie.waitForSelector('#rgrid .rmini');
  const mini=await regie.evaluate(()=>({n:document.querySelectorAll('#rgrid .rmini span').length,me:document.querySelectorAll('#rgrid .rmini .me').length,h:document.querySelector('#rgrid h3').textContent}));
  const nom=await jeu.evaluate(()=>G.players[G.ch].name);
  attendu(mini.n===4&&mini.me===1&&mini.h===nom+' choisit son adversaire','Mini-plateau : '+JSON.stringify(mini));
  const f=await regie.getAttribute('#rgrid [data-f^="sel"]','data-f');
  await regie.click('#rgrid [data-f="'+f+'"]');
  await regie.waitForSelector('#rgrid [data-f="duel"]');await regie.click('#rgrid [data-f="duel"]');

  etape('avant le duel, puis arbitrage');
  await regie.waitForSelector('#rgo:not([hidden])');
  const noms=await jeu.evaluate(()=>S.names);
  attendu(await regie.isVisible('#avs')&&(await regie.textContent('#avs')).replace(/\s+/g,' ').trim()===noms[0]+' contre '+noms[1],'« A contre B » : '+await regie.textContent('#avs'));
  attendu(!await regie.isVisible('#bok')&&!await regie.isVisible('#bpass'),'Boutons de verdict visibles avant le départ');
  await regie.click('#rgo');await jeu.clock.runFor(3500);await jeu.waitForFunction(()=>S.started);
  await regie.waitForSelector('#arep:not([hidden])');
  const rep=await jeu.evaluate(()=>{const a=S.cur[1].split('|')[0].trim();return a.charAt(0).toUpperCase()+a.slice(1)});
  attendu((await regie.textContent('#arept'))===rep,'Réponse attendue : '+await regie.textContent('#arept')+' au lieu de '+rep);
  const px=await regie.evaluate(()=>parseFloat(getComputedStyle(document.getElementById('arept')).fontSize));
  attendu(px>=36,'Réponse attendue trop petite : '+px+' px');
  attendu(await regie.isVisible('#bok')&&await regie.isVisible('#bpass')&&await regie.isHidden('#avs'),'Arbitrage : boutons absents ou « contre » encore affiché');
  const h=await regie.evaluate(()=>[document.getElementById('bok').getBoundingClientRect().height,document.getElementById('bpass').getBoundingClientRect().height]);
  attendu(h[0]>=90&&h[1]>=70,'Boutons de verdict trop petits : '+h);
  await regie.click('#rmenu');
  attendu(await regie.isVisible('#rquit'),'« Arrêter la partie » absent du menu pendant la partie');
  await regie.keyboard.press('Escape');
  console.log('Régie : en-tête, configuration compacte, mini-plateau, réponse attendue « '+rep+' » en '+px+' px');
});
