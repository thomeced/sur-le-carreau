/* Test de la régie : l'écran du jeu et la régie du téléphone dans deux onglets (liaison BroadcastChannel).
   Lancer depuis la racine du dépôt :   node tests/regie.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Déroulé : écran du jeu sur index.html?mode=serieux, régie sur index.html#arbitre=CODE (code lu dans #hcode).
   La régie configure un duel simple (noms, catégorie), le lance puis appuie sur « Démarrer le duel ».
   Elle envoie « Bonne réponse » : le joueur qui avait la main marque 1 point et la main passe.
   Puis « Passé » : la réponse s'affiche sur l'écran et le chrono du joueur perd 3 s.
   L'horloge simulée (commune aux deux onglets) est mise en pause pendant les vérifications, pour comparer les chronos
   à la seconde près.
   Le test échoue à la moindre erreur JavaScript ou console.error, dans l'un ou l'autre onglet. */
const {lancer,ouvrirEcranEtRegie,pause,etape}=require('./serveur.js');

// Lit l'état visible du duel sur l'écran du jeu : noms, chronos (s), scores, joueur qui a la main.
const etat=page=>page.evaluate(()=>{
  const t=id=>document.getElementById(id).textContent;
  return{noms:[t('nm0'),t('nm1')],chronos:[+t('tm0'),+t('tm1')],scores:[parseInt(t('sc0')),parseInt(t('sc1'))],
    main:document.getElementById('s0').classList.contains('on')?0:1,msg:t('msg')};
});

lancer('regie',async env=>{
  const {jeu,regie}=await ouvrirEcranEtRegie(env);

  etape('configuration par la régie');
  // L'écran attend la configuration ; la régie affiche le formulaire.
  await jeu.waitForFunction(()=>/Partie en préparation/.test(document.getElementById('hph2').textContent)&&!document.getElementById('hprep').hidden);
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.selectOption('#gmode','duel');
  await regie.fill('#n0','Léa');
  await regie.fill('#n1','Tom');
  const cat=await regie.evaluate(()=>{const s=document.getElementById('cat');return s.value&&s.options[s.selectedIndex].textContent});
  if(!cat)throw new Error('Aucune catégorie proposée dans la régie');
  await regie.click('#gosubmit');

  etape('démarrage du duel');
  // L'écran du jeu ouvre le duel ; la régie le démarre.
  await jeu.waitForSelector('#game:not([hidden])');
  await regie.waitForSelector('#rgo:not([hidden])');
  await regie.click('#rgo');
  await jeu.waitForFunction(()=>/Départ dans/.test(document.getElementById('who').textContent));
  await jeu.clock.runFor(3500); // compte à rebours 3-2-1
  await jeu.waitForFunction(()=>/de jouer/.test(document.getElementById('who').textContent));
  // On arrête le temps : les chronos ne bougent plus que par les verdicts et quand le test avance l'horloge.
  await jeu.clock.pauseAt(await jeu.evaluate(()=>Date.now()+1000));
  await pause(200);

  etape('état de départ');
  const e0=await etat(jeu);
  if(e0.noms.join()!=='Léa,Tom')throw new Error('Noms inattendus sur l’écran : '+e0.noms.join(', '));
  if(e0.scores.join()!=='0,0')throw new Error('Scores de départ inattendus : '+e0.scores.join(', '));

  etape('Bonne réponse');
  // « Bonne réponse » : +1 pour le joueur qui avait la main, la main passe, les chronos ne bougent pas.
  await regie.waitForSelector('#bok:not([disabled])');
  await regie.click('#bok');
  await jeu.waitForFunction(m=>!document.getElementById('s'+m).classList.contains('on'),e0.main);
  const e1=await etat(jeu);
  if(e1.scores[e0.main]!==1||e1.scores[e0.main^1]!==0)throw new Error('Score après « Bonne réponse » : '+e1.scores.join(', '));
  if(e1.main!==(e0.main^1))throw new Error('La main n’est pas passée après « Bonne réponse »');
  if(e1.chronos.join()!==e0.chronos.join())throw new Error('Chronos modifiés par « Bonne réponse » : '+e0.chronos+' → '+e1.chronos);

  etape('Passé');
  // « Passé » : réponse révélée, −3 s pour le joueur qui a la main, qui la garde.
  // L'horloge simulée est commune aux deux onglets : on l'avance un peu pour que la régie réactive ses boutons
  // (pause de 0,7 s contre les doubles clics). Le chrono du joueur qui a la main baisse d'autant.
  await jeu.clock.runFor(800);
  await regie.waitForFunction(()=>!document.getElementById('bpass').disabled);
  const e1b=await etat(jeu);
  await regie.click('#bpass');
  await jeu.waitForFunction(()=>/^C'était/.test(document.getElementById('msg').textContent));
  const e2=await etat(jeu);
  const j=e1.main;
  if(e2.chronos[j]!==e1b.chronos[j]-3)throw new Error('Chrono après « Passé » : '+e1b.chronos[j]+' s → '+e2.chronos[j]+' s (attendu −3 s)');
  if(e2.chronos[j^1]!==e1b.chronos[j^1])throw new Error('Le chrono de l’autre joueur a bougé après « Passé »');
  if(e2.main!==j)throw new Error('La main a changé après « Passé »');
  if(e2.scores.join()!==e1.scores.join())throw new Error('Score modifié par « Passé »');

  etape('chrono sur la régie');
  // La régie affiche les mêmes chronos que l'écran (à 1 s près : elle reçoit l'état environ chaque seconde).
  await jeu.clock.runFor(1500); // fin de l'affichage de la réponse, élément suivant
  const ecran=(await etat(jeu)).chronos;
  const reg=await regie.evaluate(()=>[0,1].map(i=>+document.querySelector('#a'+i+' .tm').textContent));
  if(Math.abs(reg[0]-ecran[0])>1||Math.abs(reg[1]-ecran[1])>1)throw new Error('Chronos de la régie ('+reg.join(' / ')+') différents de l’écran ('+ecran.join(' / ')+')');
  console.log('Duel Léa contre Tom en « '+cat+' » : scores '+e2.scores.join('-')+', chronos '+e2.chronos.join(' s / ')+' s');
});
