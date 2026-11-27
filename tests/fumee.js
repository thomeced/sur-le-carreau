/* Test de fumée : une partie complète en grille 2×2, jusqu'à l'écran du vainqueur, sans erreur JavaScript.
   Lancer depuis la racine du dépôt :   node tests/fumee.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Déroulé : écran du jeu sur index.html?mode=serieux (1440×900), régie dans un 2e onglet (#arbitre=CODE, liaison
   BroadcastChannel). La régie est nécessaire : sans elle, « Démarrer le duel » reste bloqué sur l'écran du jeu.
   Sur l'écran : « Configurer sur cet écran », grille 2×2, nouveau tirage de 4 catégories, « Commencer la partie ».
   Chaque duel : un adversaire, « Lancer le duel », « Démarrer le duel », une « Bonne réponse » et un « Passé »
   envoyés par la régie, puis on avance l'horloge simulée (commune aux deux onglets) jusqu'à ce qu'un chrono tombe à 0.
   Le test échoue à la moindre erreur JavaScript ou console.error, dans l'un ou l'autre onglet. */
const {lancer,ouvrirEcranEtRegie,pause}=require('./serveur.js');

// Avance l'horloge simulée par petits pas jusqu'à ce que `cond` soit vraie dans la page.
async function avancerJusqua(page,cond,{pas=2000,max=120000,quoi='condition'}={}){
  for(let t=0;t<=max;t+=pas){
    if(await page.evaluate(cond))return;
    await page.clock.runFor(pas);
    await pause(30); // laisse passer les messages entre onglets
  }
  throw new Error('Toujours pas atteint après '+max/1000+' s simulées : '+quoi);
}

lancer('fumee',async env=>{
  const {jeu,regie}=await ouvrirEcranEtRegie(env);

  // Configuration sur l'écran du jeu.
  await jeu.click('#hlocal');
  await jeu.waitForSelector('#setup:not([hidden])');
  await jeu.selectOption('#gmode','grid');
  await jeu.selectOption('#gsize','2');
  await jeu.click('#pdraw'); // 4 catégories tirées au hasard pour la grille 2×2
  const compte=await jeu.textContent('#pcount');
  if(!/^4 \/ 4\b/.test(compte))throw new Error('Choix des catégories inattendu : « '+compte+' »');
  await jeu.click('#gosubmit');
  await jeu.waitForSelector('#grid:not([hidden])');

  let duels=0;
  for(;;){
    // Laisse finir la vague de capture ou le tirage animé, puis lit le panneau.
    await avancerJusqua(jeu,()=>!document.getElementById('gpanel').textContent.includes('Tirage au sort'),{quoi:'fin du tirage au sort'});
    await jeu.clock.runFor(3000);
    const fini=await jeu.evaluate(()=>[...document.querySelectorAll('#gpanel button')].some(b=>b.textContent==='Nouvelle partie'));
    if(fini)break;
    if(duels>=3)throw new Error('Plus de 3 duels dans une grille 2×2 : la partie ne se termine pas');

    // Choix de l'adversaire : première case bleu clair, puis « Lancer le duel ».
    const cibles=jeu.locator('#gboard path.gz.t');
    if(!await cibles.count())throw new Error('Aucun adversaire possible sur le plateau : '+await jeu.textContent('#gpanel'));
    await cibles.first().dispatchEvent('click');
    await jeu.getByRole('button',{name:'Lancer le duel'}).click();
    await jeu.waitForSelector('#game:not([hidden])');

    // « Démarrer le duel » sur l'écran, compte à rebours 3-2-1.
    await avancerJusqua(jeu,()=>!document.getElementById('go').disabled,{pas:1000,max:15000,quoi:'« Démarrer le duel » actif (régie connectée)'});
    await jeu.click('#go');
    await avancerJusqua(jeu,()=>/de jouer/.test(document.getElementById('who').textContent),{pas:1000,max:10000,quoi:'début du duel'});

    // La régie juge : une bonne réponse, puis un « Passé ».
    await regie.waitForSelector('#bok:not([disabled])');
    await regie.click('#bok');
    await jeu.waitForFunction(()=>parseInt(document.getElementById('sc0').textContent)+parseInt(document.getElementById('sc1').textContent)===1);
    await regie.click('#bpass');
    await jeu.waitForFunction(()=>/^C'était/.test(document.getElementById('msg').textContent));

    // Les chronos tombent : écran de fin du duel, puis retour à la grille.
    await avancerJusqua(jeu,()=>!document.getElementById('end').hidden,{quoi:'fin du duel '+(duels+1)});
    duels++;
    const bouton=await jeu.textContent('#again');
    if(bouton!=='Retour à la grille')throw new Error('Bouton de fin de duel inattendu : « '+bouton+' »');
    await jeu.click('#again');
    await jeu.waitForSelector('#grid:not([hidden])');
  }

  // Écran du vainqueur.
  const titre=(await jeu.textContent('#gtitle')).trim();
  const enLice=(await jeu.textContent('#gstat')).trim();
  if(duels!==3)throw new Error('Une grille 2×2 doit se jouer en 3 duels, joués : '+duels);
  if(enLice!=='1 joueur en lice')throw new Error('Fin de partie inattendue : « '+enLice+' »');
  console.log('Vainqueur : '+titre+' ('+duels+' duels)');

  // Cache de la TV : chaque fichier CSS et JS du jeu est demandé avec la version de la page (?v=…),
  // qui est aussi affichée en pied de l'accueil.
  const version=await jeu.getAttribute('meta[name="slc-version"]','content');
  const pied=(await jeu.textContent('#hver')).trim();
  if(pied!=='Version '+version)throw new Error('Pied de l’accueil « '+pied+' » au lieu de « Version '+version+' »');
  const fichiers=env.requetes.filter(u=>/\.(js|css)(\?|$)/.test(u));
  const sansVersion=fichiers.filter(u=>!u.endsWith('?v='+version));
  if(!fichiers.some(u=>u.startsWith('intro.css')))throw new Error('intro.css n’a pas été demandé');
  if(sansVersion.length)throw new Error('Fichiers demandés sans ?v='+version+' : '+[...new Set(sansVersion)].join(', '));
  console.log('Version '+version+' : '+new Set(fichiers).size+' fichiers CSS et JS, tous avec ?v=');
});
