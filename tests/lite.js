/* Test du mode allégé (TV Samsung) et des couleurs de secours (story 2.1 ; la vague case par case viendra en 2.2).
   Lancer depuis la racine du dépôt :   node tests/lite.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie :
   - dans les CSS du jeu, aucun color-mix() ne contient var() (une déclaration de secours ne servirait à rien) et chaque
     color-mix() est précédé, dans la même règle, de la même propriété sans color-mix() ;
   - navigateur récent sans paramètre : pas de mode allégé, pas de cadre ?debug ;
   - ?lite=1&debug=1 : mode allégé, panneaux sans flou et à fond opaque, cadre de débogage (version, moteur, mode) ;
   - navigateur sans color-mix() (simulé) : mode allégé détecté tout seul, sans paramètre. */
const fs=require('fs'),path=require('path');
const {lancer,RACINE}=require('./serveur.js');
const attendu=(ok,msg)=>{if(!ok)throw new Error(msg)};

// Contrôle statique des feuilles de style.
function controleCSS(){
  const fichiers=['style.css','intro.css'],pbs=[];
  for(const f of fichiers){
    const css=fs.readFileSync(path.join(RACINE,f),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
    for(const m of css.matchAll(/\{([^{}]*)\}/g)){
      const decl=m[1].split(';').map(d=>d.trim()).filter(Boolean);
      decl.forEach((d,i)=>{
        if(!/color-mix\(/.test(d))return;
        const prop=d.split(':')[0].trim();
        if(/color-mix\([^;]*var\(/.test(d))pbs.push(f+' : color-mix() avec var() : « '+d+' »');
        else if(!decl.slice(0,i).some(e=>e.split(':')[0].trim()===prop&&!/color-mix\(/.test(e)))pbs.push(f+' : color-mix() sans couleur de secours avant : « '+d+' »');
      });
    }
  }
  attendu(!pbs.length,pbs.join('\n'));
}

// État visible du mode allégé dans une page.
const etat=page=>page.evaluate(()=>{const p=document.querySelector('#home .panel')||document.querySelector('.panel'),cs=getComputedStyle(p);
  return{lite:typeof LITE!=='undefined'&&LITE,classe:document.documentElement.classList.contains('lite'),
    flou:cs.backdropFilter,fond:cs.backgroundColor,debug:(document.getElementById('slcdebug')||{}).textContent||null}});

lancer('lite',async env=>{
  controleCSS();

  const p1=await env.page('récent');
  await p1.goto(env.url+'index.html?mode=serieux');
  let e=await etat(p1);
  attendu(!e.lite&&!e.classe&&e.debug===null,'Navigateur récent sans paramètre : '+JSON.stringify(e));

  const p2=await env.page('lite');
  await p2.goto(env.url+'index.html?mode=serieux&lite=1&debug=1');
  e=await etat(p2);
  const version=await p2.getAttribute('meta[name="slc-version"]','content');
  attendu(e.lite&&e.classe,'?lite=1 : mode allégé attendu ('+JSON.stringify(e)+')');
  attendu(e.flou==='none'&&e.fond==='rgb(4, 7, 31)','Panneau en mode allégé : flou '+e.flou+', fond '+e.fond);
  attendu(e.debug&&e.debug.includes('Version '+version)&&/Chromium \d+/.test(e.debug)&&e.debug.includes('mode allégé : oui (forcé par ?lite=1)'),'Cadre ?debug=1 : « '+e.debug+' »');

  // Navigateur sans color-mix() (comme la TV) : CSS.supports répond non pour color-mix, sans paramètre dans l'adresse.
  const p3=await env.page('sans color-mix');
  await p3.addInitScript(()=>{const s=CSS.supports.bind(CSS);CSS.supports=(a,b)=>/color-mix/.test(String(a)+String(b))?false:s(a,b)});
  await p3.goto(env.url+'index.html?mode=serieux&debug=1');
  e=await etat(p3);
  attendu(e.lite&&e.classe&&e.debug.includes('color-mix : non')&&e.debug.includes('mode allégé : oui')&&!e.debug.includes('forcé'),'Navigateur sans color-mix : '+JSON.stringify(e));
});
