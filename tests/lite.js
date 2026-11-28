/* Test du mode allégé (TV Samsung) et des couleurs de secours (story 2.1 ; la vague case par case viendra en 2.2).
   Lancer depuis la racine du dépôt :   node tests/lite.js
   (Playwright vient de l'environnement ; rien à installer dans le dépôt. Voir tests/README.md.)

   Vérifie :
   - dans les CSS du jeu, aucun color-mix() ne contient var() (une déclaration de secours ne servirait à rien) et chaque
     color-mix() est précédé, dans la même règle, de la même propriété sans color-mix() ;
   - navigateur récent sans paramètre : pas de mode allégé, pas de cadre ?debug ;
   - ?lite=1&debug=1 : mode allégé, panneaux sans flou et à fond opaque, cadre de débogage (version, moteur, mode) ;
   - navigateur sans color-mix() (simulé) : mode allégé détecté tout seul, sans paramètre ;
   - TV récente avec color-mix() (user agent de la TV Samsung de Ced, Tizen 8.0, story 2.6) : mode allégé quand même,
     « TV détectée » dans le cadre ?debug ; ?lite=0 l'empêche ;
   - story 2.7 : la même TV en user agent « ordinateur » (SamsungBrowser sans Mobile) est détectée, un téléphone Samsung
     ne l'est pas ; ?lite=1 est mémorisé sur l'appareil, ?lite=0 efface ce choix ;
   - vague de capture en mode allégé (story 2.2), sur une grille 2×2 : pas de clip-path ni de dessin hors des cases,
     seules les cases capturées changent de couleur, avec un délai qui grandit avec la distance, et toutes finissent
     à la couleur du gagnant ; pas de flou SVG sur le plateau. */
const fs=require('fs'),path=require('path');
const {lancer,RACINE,ouvrirEcranEtRegie,pause,etape,ouvrirDetails}=require('./serveur.js');
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
  attendu(e.debug&&e.debug.includes('Version '+version)&&/Chromium \d+/.test(e.debug)&&e.debug.includes('mode allégé : oui (forcé par ?lite=1, mémorisé)'),'Cadre ?debug=1 : « '+e.debug+' »');

  await p2.goto(env.url+'index.html?mode=serieux&lite=0'); // ?lite=1 est mémorisé (story 2.7) : on efface pour la suite

  // Navigateur sans color-mix() (comme la TV) : CSS.supports répond non pour color-mix, sans paramètre dans l'adresse.
  const p3=await env.page('sans color-mix');
  await p3.addInitScript(()=>{const s=CSS.supports.bind(CSS);CSS.supports=(a,b)=>/color-mix/.test(String(a)+String(b))?false:s(a,b)});
  await p3.goto(env.url+'index.html?mode=serieux&debug=1');
  e=await etat(p3);
  attendu(e.lite&&e.classe&&e.debug.includes('color-mix : non')&&e.debug.includes('mode allégé : oui')&&!e.debug.includes('forcé'),'Navigateur sans color-mix : '+JSON.stringify(e));

  // TV récente (story 2.6) : la TV Samsung de Ced a color-mix() (Chromium 120) mais ignore le clip-path de la vague.
  const UA_TV='Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/7.0 Chrome/120.0.6099.5 TV Safari/537.36';
  const p4=await env.page('TV Tizen 8');
  await p4.addInitScript(ua=>Object.defineProperty(navigator,'userAgent',{get:()=>ua}),UA_TV);
  await p4.goto(env.url+'index.html?mode=serieux&debug=1');
  e=await etat(p4);
  attendu(e.lite&&e.classe&&e.debug.includes('color-mix : oui')&&e.debug.includes('mode allégé : oui (TV détectée)'),'TV Tizen 8 avec color-mix : '+JSON.stringify(e));
  // Story 2.7 : la même TV s'annonce aussi comme un ordinateur Linux (photo de Ced du 28/11).
  const UA_TV_PC='Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/7.0 Chrome/120.0.6099.5 Safari/537.36';
  const UA_TEL='Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';
  const p6=await env.page('TV en mode ordinateur');
  await p6.addInitScript(ua=>Object.defineProperty(navigator,'userAgent',{get:()=>ua}),UA_TV_PC);
  await p6.goto(env.url+'index.html?mode=serieux&debug=1');
  e=await etat(p6);
  attendu(e.lite&&e.debug.includes('mode allégé : oui (TV détectée)'),'TV Samsung en user agent « ordinateur » : '+JSON.stringify(e));
  const p7=await env.page('téléphone Samsung');
  await p7.addInitScript(ua=>Object.defineProperty(navigator,'userAgent',{get:()=>ua}),UA_TEL);
  await p7.goto(env.url+'index.html?mode=serieux');
  e=await etat(p7);
  attendu(!e.lite,'Téléphone Samsung (Samsung Internet) : mode allégé non attendu ('+JSON.stringify(e)+')');
  // ?lite=1 mémorisé sur l'appareil : un navigateur récent sans paramètre reste en mode allégé, jusqu'à ?lite=0.
  const p8=await env.page('mémoire');
  await p8.goto(env.url+'index.html?mode=serieux&lite=1');
  await p8.goto(env.url+'index.html?mode=serieux&debug=1');
  e=await etat(p8);
  attendu(e.lite&&e.debug.includes('mode allégé : oui (mémorisé)'),'?lite=1 non mémorisé : '+JSON.stringify(e));
  await p8.goto(env.url+'index.html?mode=serieux&lite=0');
  await p8.goto(env.url+'index.html?mode=serieux');
  e=await etat(p8);
  attendu(!e.lite,'?lite=0 n\'a pas effacé la mémoire : '+JSON.stringify(e));

  const p5=await env.page('TV, ?lite=0');
  await p5.addInitScript(ua=>Object.defineProperty(navigator,'userAgent',{get:()=>ua}),UA_TV);
  await p5.goto(env.url+'index.html?mode=serieux&lite=0');
  e=await etat(p5);
  attendu(!e.lite&&!e.classe,'?lite=0 sur une TV : mode allégé non attendu ('+JSON.stringify(e)+')');

  etape('vague case par case (?lite=1)');
  const {jeu}=await ouvrirEcranEtRegie(env,{params:'&lite=1'});
  await jeu.click('#hlocal');
  await jeu.selectOption('#gmode','grid');await jeu.selectOption('#gsize','2');await jeu.click('#pdraw');
  await jeu.click('#gosubmit');
  await jeu.waitForSelector('#grid:not([hidden])');
  const flou=await jeu.evaluate(()=>[...document.querySelectorAll('#gboard [filter]')].map(n=>getComputedStyle(n).filter).filter(f=>f!=='none').length);
  attendu(flou===0,'Flou SVG encore actif sur le plateau en mode allégé ('+flou+' éléments)');
  await jeu.locator('#gboard path.gz.t').first().dispatchEvent('click');
  await ouvrirDetails(jeu);
  await jeu.getByRole('button',{name:'Lancer le duel'}).click();
  await jeu.waitForSelector('#game:not([hidden])');
  for(let k=0;k<20&&await jeu.isDisabled('#go');k++){await jeu.clock.runFor(1000);await pause(30)}
  await jeu.click('#go');
  for(let k=0;k<60&&await jeu.isHidden('#end');k++){await jeu.clock.runFor(2000);await pause(20)}
  // Espion : cases capturées et couleur du gagnant ; couleurs de toutes les cases juste avant la vague.
  await jeu.evaluate(()=>{const o=gcaptureLite;gcaptureLite=function(A,V0,ox,oy,col){
    window.__vague={cases:A.cells.slice(),col,avant:V0.zones.map(z=>z.getAttribute('fill')),
      delais:A.cells.map(i=>parseInt(V0.zones[i].style.transition.split(' ').pop())||0)};
    const r=o.apply(this,arguments);
    window.__vague.delais=A.cells.map(i=>{const t=V0.zones[i].style.transition.match(/(\d+)ms$/);return t?+t[1]:-1});
    window.__vague.dist=A.cells.map(i=>Math.hypot((V0.cells[i].cx-ox)/V0.sx,(V0.cells[i].cy-oy)/V0.sy));
    window.__vague.pendant=V0.zones.map(z=>z.getAttribute('fill'));
    window.__vague.dessin=V0.gan.childNodes.length+(document.getElementById('gcap')?1:0);
    return r}});
  await jeu.click('#again');
  await jeu.waitForSelector('#grid:not([hidden])');
  const v=await jeu.evaluate(()=>window.__vague);
  attendu(v&&v.cases.length>0,'La vague allégée n’a pas été jouée');
  attendu(v.dessin===0,'La vague allégée a dessiné hors des cases (clip-path ou calque de vague)');
  const autres=v.avant.map((f,i)=>v.cases.includes(i)?null:[i,f,v.pendant[i]]).filter(x=>x&&x[1]!==x[2]);
  attendu(!autres.length,'Des cases non capturées ont changé de couleur : '+JSON.stringify(autres));
  attendu(v.cases.every(i=>v.pendant[i]===v.col),'Les cases capturées ne passent pas à la couleur du gagnant');
  const ordre=v.cases.map((_,k)=>[v.dist[k],v.delais[k]]).sort((a,b)=>a[0]-b[0]);
  attendu(ordre.every((x,k)=>x[1]>=0&&(!k||x[1]>=ordre[k-1][1])),'Délais non croissants avec la distance : '+JSON.stringify(ordre));
  await jeu.clock.runFor(3000);await pause(50);
  const finale=await jeu.evaluate(()=>({anim:gAnimT,trans:GV.zones.filter(z=>z.style.transition).length}));
  attendu(finale.anim===null&&finale.trans===0,'Vague allégée pas terminée proprement : '+JSON.stringify(finale));
});
