/* Test du contenu et du tirage équilibré (story 4.1, EF18 à EF21).
   Lancer depuis la racine du dépôt :   node tests/contenu.js            (objectifs de quantité affichés)
                                         node tests/contenu.js --strict   (objectifs de quantité exigés)
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Charge le jeu dans le navigateur, pour vérifier les catégories avec la vraie validation (normItem, addCats). Vérifie :
   - aucun élément ignoré au chargement (format invalide, doublon) : avertissements de la console ;
   - chaque catégorie de categories.js et de photos.js a un domaine de DOMAINES dans DOM_CAT, et DOM_CAT ne cite
     aucune catégorie inexistante ;
   - quantités face aux objectifs d'E4 : types texte 60 éléments (12 par niveau), photos et emojis 40 (8 par niveau) ;
     affichées seulement, sauf avec --strict ;
   - tirage équilibré (ptirer, pdraw, pfill) : en 2×2, 3×3 et 4×4, sur 300 tirages chacun, chaque domaine apparaît
     autant de fois que les autres, à une près. */
const {lancer,etape}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};
const STRICT=process.argv.includes('--strict');

lancer('contenu',async env=>{
  const jeu=await env.page('jeu');
  const avert=[];
  jeu.on('console',m=>{if(m.type()==='warning'&&/ignoré|ignorée/.test(m.text()))avert.push(m.text())});
  await jeu.goto(env.url+'index.html?mode=serieux');
  await jeu.waitForFunction(()=>typeof ptirer==='function'&&Object.keys(DATA).length>0);

  etape('éléments ignorés à la validation');
  attendu(!avert.length,avert.length+' élément(s) ou catégorie(s) ignoré(s) au chargement :\n'+avert.join('\n'));

  etape('domaines');
  const dom=await jeu.evaluate(()=>{
    const cles=Object.keys(DATA).filter(k=>!DATA[k].perso);
    return {
      sans:cles.filter(k=>domaineDe(k)==='autre'),
      inconnues:Object.keys(DOM_CAT).filter(k=>!DATA[k]),
      invalides:Object.entries(DOM_CAT).filter(([k,d])=>!DOMAINES[d]).map(([k,d])=>k+' → '+d),
      parDom:Object.keys(DOMAINES).map(d=>[DOMAINES[d],cles.filter(k=>domaineDe(k)===d).length])
    };
  });
  attendu(!dom.sans.length,'Catégories sans domaine dans DOM_CAT : '+dom.sans.join(', '));
  attendu(!dom.inconnues.length,'DOM_CAT cite des catégories inexistantes : '+dom.inconnues.join(', '));
  attendu(!dom.invalides.length,'Domaines inconnus dans DOM_CAT : '+dom.invalides.join(', '));
  console.log('Catégories par domaine : '+dom.parDom.map(([n,c])=>n+' '+c).join(' · '));

  etape('quantités');
  const qte=await jeu.evaluate(()=>Object.keys(DATA).filter(k=>!DATA[k].perso).map(k=>{
    const d=DATA[k],img=d.type==='photo'||d.type==='emoji',obj=img?40:60,parNiv=img?8:12;
    const niv=LVLS.map(l=>d.items.filter(it=>it[2]===l).length);
    return {k,label:d.label,type:d.type,n:d.items.length,niv,obj,parNiv,ok:d.items.length>=obj&&niv.every(x=>x>=parNiv)};
  }));
  const manque=qte.filter(c=>!c.ok);
  console.log('Quantités (objectif : texte 60, 12 par niveau ; photo et emoji 40, 8 par niveau) : '+(qte.length-manque.length)+'/'+qte.length+' catégories à l’objectif');
  for(const c of manque)console.log('  à compléter : '+c.label+' ('+c.type+') '+c.n+'/'+c.obj+', par niveau '+c.niv.join('-'));
  if(STRICT)attendu(!manque.length,manque.length+' catégorie(s) sous l’objectif (--strict)');

  etape('tirage équilibré');
  const tir=await jeu.evaluate(()=>{
    const ecarts=[];
    const doms=new Set(Object.keys(DATA).map(domaineDe)),D=doms.size;
    const verif=(choix,n,quoi)=>{
      if(choix.length!==n||new Set(choix).size!==n)return ecarts.push(quoi+' : '+choix.length+' catégories au lieu de '+n+' distinctes');
      const c={};for(const k of choix){const d=domaineDe(k);c[d]=(c[d]||0)+1}
      const v=[...doms].map(d=>c[d]||0),max=Math.max(...v),min=Math.min(...v);
      if(max-min>1)ecarts.push(quoi+' : '+JSON.stringify(c));
    };
    for(const t of [2,3,4]){
      const n=t*t;
      for(let i=0;i<300;i++){
        verif(ptirer(n,[]),n,'ptirer '+t+'×'+t);
        // pfill : partir de la grille plus petite et compléter
        const a=ptirer((t-1)*(t-1),[]);verif(a.concat(ptirer(n-a.length,a)),n,'complément '+(t-1)+'×'+(t-1)+' → '+t+'×'+t);
      }
    }
    // pdraw (formulaire réel, taille par défaut) et pfill
    pdraw();verif(PICK.slice(),pneed(),'pdraw');
    PICK=PICK.slice(0,3);const ajout=pfill();verif(PICK.slice(),pneed(),'pfill');
    return {ecarts:ecarts.slice(0,5),nb:ecarts.length,D,besoin:pneed(),ajout};
  });
  attendu(!tir.nb,tir.nb+' tirage(s) déséquilibré(s), par exemple :\n'+tir.ecarts.join('\n'));
  attendu(tir.ajout===tir.besoin-3,'pfill a ajouté '+tir.ajout+' catégories au lieu de '+(tir.besoin-3));
  console.log('Tirage : '+tir.D+' domaines, 1 800 tirages équilibrés (2×2, 3×3, 4×4, et compléments)');
});
