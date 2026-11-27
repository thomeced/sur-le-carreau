/* Test du préchargement des photos (story 2.3, ENF2).
   Lancer depuis la racine du dépôt :   node tests/photos.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   La régie lance un duel simple dans une catégorie photo. Vérifie :
   - avant même le départ, la photo tirée et les 3 suivantes de la réserve ont été demandées au serveur ;
   - après « Bonne réponse » et « Passé », chaque nouvelle photo affichée avait été demandée avant d'être affichée ;
   - seules des photos de la catégorie en jeu ont été demandées. */
const {lancer,ouvrirEcranEtRegie,pause,etape}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

lancer('photos',async env=>{
  const {jeu,regie}=await ouvrirEcranEtRegie(env);
  const photos=()=>env.requetes.filter(u=>u.startsWith('assets/photos/')).map(u=>decodeURIComponent(u.split('?')[0]));

  etape('duel simple dans une catégorie photo');
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.selectOption('#gmode','duel');
  const cat=await regie.evaluate(()=>[...document.getElementById('cat').options].map(o=>o.value).find(k=>DATA[k]&&DATA[k].type==='photo'&&!/drapeau/i.test(k)));
  attendu(cat,'Aucune catégorie photo dans la régie');
  await regie.selectOption('#cat',cat);
  attendu(photos().length===0,'Des photos ont été chargées avant le duel : '+photos().slice(0,3).join(', '));
  await regie.click('#gosubmit');
  await jeu.waitForSelector('#game:not([hidden])');
  await pause(300);

  etape('avant le départ : photo tirée et 3 suivantes');
  const attendues=await jeu.evaluate(()=>{const L=lvl();return[S.cur].concat(S.pool[L].slice(-3)).map(it=>decodeURIComponent(it[3].img))});
  let vues=photos();
  const manquantes=attendues.filter(u=>!vues.includes(u));
  attendu(!manquantes.length,'Photos pas préchargées avant le départ : '+manquantes.join(', '));
  const dossier=attendues[0].split('/').slice(0,3).join('/')+'/';
  attendu(vues.every(u=>u.startsWith(dossier)),'Photos d’une autre catégorie chargées : '+vues.filter(u=>!u.startsWith(dossier)).join(', '));

  etape('chaque nouvelle photo était déjà demandée');
  await regie.waitForSelector('#rgo:not([hidden])');
  await regie.click('#rgo');
  await jeu.clock.runFor(3500);
  for(const verdict of ['#bok','#bpass','#bok','#bok']){
    const avant=photos();
    await regie.waitForFunction(()=>!document.getElementById('bok').disabled);
    const k0=await jeu.evaluate(()=>S.cur[0]);
    await regie.click(verdict);
    if(verdict==='#bpass')await jeu.clock.runFor(1500); // la réponse reste affichée 1,3 s
    await jeu.waitForFunction(k=>S.cur[0]!==k,k0);
    const img=await jeu.evaluate(()=>decodeURIComponent(S.cur[3].img));
    attendu(avant.includes(img),'Photo affichée sans préchargement : '+img);
    await jeu.clock.runFor(800);await pause(50);
  }
  vues=photos();
  attendu(vues.every(u=>u.startsWith(dossier)),'Photos d’une autre catégorie chargées pendant le duel');
  console.log(new Set(vues).size+' photos demandées pendant le test, toutes de « '+cat+' »');
});
