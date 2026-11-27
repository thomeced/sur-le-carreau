/* Test de la progressivité dans le duel (story 3.1, EF23).
   Lancer depuis la racine du dépôt :   node tests/niveaux.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie :
   - niveauPour(n) suit la courbe LVL_CURVE (éléments 1 à 3 → 1 ; 4 à 6 → 2 ; 7 à 10 → 3 ; 11 à 14 → 4 ; 15 et plus → 5) ;
   - dans un vrai duel lancé par la régie, « Bonne réponse » et « Passé » (des deux joueurs) font monter le niveau :
     les 16 premiers éléments tirés ont les niveaux 1,1,1,2,2,2,3,3,3,3,4,4,4,4,5,5 ;
   - un verdict envoyé deux fois pour le même élément ne compte qu'une fois ;
   - un nouveau duel repart au niveau 1. */
const {lancer,ouvrirEcranEtRegie,pause,etape}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};
const COURBE=[1,1,1,2,2,2,3,3,3,3,4,4,4,4,5,5];

lancer('niveaux',async env=>{
  const {jeu,regie}=await ouvrirEcranEtRegie(env);

  etape('niveauPour(n)');
  const pur=await jeu.evaluate(()=>Array.from({length:21},(_,n)=>niveauPour(n)));
  const purAttendu=COURBE.concat([5,5,5,5,5]);
  attendu(pur.join()===purAttendu.join(),'niveauPour : '+pur.join()+' au lieu de '+purAttendu.join());
  attendu(await jeu.evaluate(()=>typeof LVL_STEP==='undefined'),'LVL_STEP existe encore');

  // Catégorie texte avec au moins 8 éléments à chaque niveau : aucun niveau ne s'épuise en 16 éléments.
  await regie.waitForSelector('#arb #setup:not([hidden])');
  await regie.selectOption('#gmode','duel');
  const cat=await regie.evaluate(()=>[...document.getElementById('cat').options].map(o=>o.value).find(k=>{
    const d=DATA[k];if(!d||d.type==='photo'||d.type==='emoji')return false;
    return LVLS.every(l=>d.items.filter(it=>it[2]===l).length>=8);
  }));
  attendu(cat,'Aucune catégorie texte avec 8 éléments par niveau');

  async function duel(){
    await regie.waitForSelector('#arb #setup:not([hidden])');
    await regie.selectOption('#gmode','duel');
    await regie.selectOption('#cat',cat);
    await regie.click('#gosubmit');
    await jeu.waitForSelector('#game:not([hidden])');
    await regie.waitForSelector('#rgo:not([hidden])');
    await regie.click('#rgo');
    await jeu.clock.runFor(3500);
    await jeu.waitForFunction(()=>S.started);
  }
  // Envoie un verdict et attend l'élément suivant ; renvoie le niveau de l'élément qui vient d'être jugé.
  async function verdict(bouton,double){
    await regie.waitForFunction(()=>!document.getElementById('bok').disabled);
    const [k0,niv]=await jeu.evaluate(()=>[S.cur[0],S.cur[2]]);
    if(double){
      // Deux verdicts pour le même élément (double clic sur deux téléphones, message répété) : un seul compte.
      await jeu.evaluate(k=>{onmsg('act',{a:'ok',c:k});onmsg('act',{a:'ok',c:k})},k0);
    }else await regie.click(bouton);
    if(bouton==='#bpass')await jeu.clock.runFor(1500); // la réponse reste affichée 1,3 s
    await jeu.waitForFunction(k=>S.cur[0]!==k,k0);
    await jeu.clock.runFor(300);await pause(30);
    return niv;
  }

  etape('duel 1 : 16 éléments, verdicts alternés');
  await duel();
  const vus=[];
  for(let i=0;i<16;i++)vus.push(await verdict(i%2?'#bpass':'#bok',i===4));
  attendu(vus.join()===COURBE.join(),'niveaux tirés : '+vus.join()+' au lieu de '+COURBE.join());
  attendu(await jeu.evaluate(()=>S.joues)===16,'S.joues = '+await jeu.evaluate(()=>S.joues)+' au lieu de 16');
  attendu(await jeu.evaluate(()=>S.cur[2])===5,'17e élément pas au niveau 5');

  etape('fin du duel, puis nouveau duel au niveau 1');
  await jeu.clock.runFor(60000);
  await jeu.waitForFunction(()=>S.over);
  await regie.waitForSelector('#rnew:not([hidden])');
  await regie.click('#rnew');
  await duel();
  const [j,n]=await jeu.evaluate(()=>[S.joues,S.cur[2]]);
  attendu(j===0&&n===1,'nouveau duel : S.joues = '+j+', niveau '+n);
  console.log('catégorie « '+cat+' » : niveaux '+vus.join(','));
});
