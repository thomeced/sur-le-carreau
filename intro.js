/* Intro « Sur le carreau » : générique animé avant l'écran de départ.
 *
 * Installation : une seule ligne dans le <head> de index.html, après la feuille de style du jeu :
 *   balise script avec src="intro.js" (sans defer ni async, pour masquer le jeu dès l'ouverture)
 * Le script charge intro.css et les images de assets/intro/ (plateau, animateur, 12 candidats, logo).
 * Mise en scène : décor immobile ; la caméra avance de 10 m dans un couloir de candidats et s'arrête devant l'animateur,
 * en pied, sous le logo.
 * Visuels originaux générés par IA, fournis par Ced (novembre 2026) : plus rien de l'émission.
 * Il ne touche pas à la logique du jeu : il pose un calque par-dessus la page, puis le retire.
 *
 * - Bouton « Passer l'intro » (et touche Échap).
 * - Bouton son (générique assets/intro/generique.mp3) : coupé par défaut, car les navigateurs
 *   bloquent le son sans geste de l'utilisateur. Le choix est retenu (localStorage) et réessayé à la visite suivante.
 * - Pas d'intro sur la vue arbitre (#arbitre).
 * - Écran de lancement : « mode funky » (intro + son) ou « mode sérieux » (sans intro, fond noir épuré, classe slc-serieux
 *   sur <html>). Il ne s'ouvre plus à l'ouverture de la page : le jeu appelle SLC_INTRO.start() une fois le téléphone
 *   (la régie) connecté. Le dernier choix est retenu (localStorage « slc-mode ») et pré-sélectionné. Liens directs :
 *   ?mode=serieux (pas d'écran de lancement) et ?mode=funky. Une fois le lancement fait dans l'onglet
 *   (sessionStorage « slc-lance »), un rechargement ne le redemande pas.
 * - Si une image ne se charge pas, l'intro est sautée.
 * - Fin de l'intro : événement « slc:intro-end » sur document, et window.SLC_INTRO_DONE = true.
 * - Version autonome (artefact claude.ai) : définir avant ce script window.SLC_INTRO_ASSETS
 *   = {decor, host, cands: [12 images], logo, music} (adresses data:) et window.SLC_INTRO_CSS_INLINE = true.
 */
(function(){
  if(location.hash.startsWith('#arbitre')){window.SLC_INTRO_DONE=true;return}
  const root=document.documentElement,me=document.currentScript;
  const base=(me&&me.src?me.src.replace(/[^/]*$/,''):'');
  const A=window.SLC_INTRO_ASSETS||{
    decor:base+'assets/intro/decor.webp',host:base+'assets/intro/host.webp',
    cands:[1,2,3,4,5,6,7,8,9,10,11,12].map(k=>base+'assets/intro/cand-'+(k<10?'0':'')+k+'.webp'),
    logo:base+'assets/intro/logo.webp',
    music:base+'assets/intro/generique.mp3'};
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DUR=reduce?2400:15000;

  // Le calque qui masque le jeu n'est posé qu'au lancement de l'intro (l'écran d'accueil reste visible avant).
  const hide=document.createElement('style');
  hide.textContent='html.slci-on body>main{visibility:hidden}.slci:not(.slci-ready)>*{visibility:hidden}.slci{position:fixed;inset:0;z-index:1000;background:#03040E}';
  let cssReady=Promise.resolve();
  if(!window.SLC_INTRO_CSS_INLINE){
    const l=document.createElement('link');l.rel='stylesheet';l.href=base+'intro.css'+((me&&me.src.match(/\?v=[^#]*/))||[''])[0]; // même version qu'intro.js (cache de la TV)
    cssReady=new Promise((ok,ko)=>{l.onload=ok;l.onerror=ko});
    document.head.appendChild(l);
  }

  let box=null,done=false,timer=0,t0=0,audio=null,sndBtn=null;
  const KEY='slc-intro-son';
  const getPref=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
  const setPref=v=>{try{localStorage.setItem(KEY,v?'1':'0')}catch(e){}};
  function showSnd(on){if(!sndBtn)return;sndBtn.setAttribute('aria-pressed',on?'true':'false');sndBtn.textContent=on?'🔊 Son':'🔇 Son';sndBtn.setAttribute('aria-label',on?'Couper le son':'Activer le son')}
  function fadeOut(ms){
    if(!audio||audio.paused)return;const a=audio,v0=a.volume,s=performance.now();
    const f=()=>{const k=Math.min(1,(performance.now()-s)/ms);a.volume=v0*(1-k);if(k<1)requestAnimationFrame(f);else{a.pause();a.volume=1}};f();
  }
  function soundOn(){
    if(done||!A.music)return;
    if(!audio){audio=new Audio(A.music);audio.preload='auto'}
    audio.volume=1;
    try{audio.currentTime=t0?Math.max(0,(performance.now()-t0)/1000):0}catch(e){}
    const p=audio.play();showSnd(true);
    if(p&&p.catch)p.catch(()=>showSnd(false)); // lecture refusée (pas de geste) : on reste muet
  }
  function toggleSnd(){if(audio&&!audio.paused){fadeOut(250);showSnd(false);setPref(false)}else{setPref(true);soundOn()}}
  function end(){
    if(done)return;done=true;clearTimeout(timer);
    removeEventListener('keydown',onKey);
    fadeOut(450);
    root.classList.remove('slci-on');
    const fin=()=>{if(box)box.remove();hide.remove();window.SLC_INTRO_DONE=true;document.dispatchEvent(new CustomEvent('slc:intro-end'))};
    if(box&&box.classList.contains('slci-ready')){box.classList.add('slci-out');setTimeout(fin,500)}else fin();
  }
  function onKey(e){if(e.key==='Escape')end()}
  const load=src=>new Promise((ok,ko)=>{const i=new Image();i.onload=()=>(i.decode?i.decode().catch(()=>{}):Promise.resolve()).then(()=>ok(i));i.onerror=ko;i.src=src});

  /* Caméra dans le couloir : le plateau, l'animateur et les candidats sont immobiles, posés sur un sol quadrillé ;
     seule la caméra avance (de 3 m), en ligne droite, à hauteur d'yeux. Tout est projeté en perspective avec les
     mêmes règles (sol compris), d'où l'impression d'un vrai travelling. Unités : mètres. Œil à 1,6 m ; focale
     f = 0,9 × hauteur de l'écran ; horizon à 53 % de la hauteur. Candidats serrés par deux de part et d'autre
     d'une allée étroite, de 1,8 à 4,7 m : les quatre premiers groupes sortent du champ, les deux derniers encadrent l'animateur) ; animateur à 6,8 m,
     fond du plateau à 8,4 m (8,4 m × 4,7 m) ; la caméra s'arrête à 3,8 m de l'animateur : il est en pied,
     sous le logo de l'écran. */
  const OEIL=1.6,FOND=8.4,FOND_H=4.7,HOST_Z=6.8,CAM1=3,HORIZON=.53;
  const CANDS=[ // [X, Z, taille] : groupes de deux, de part et d'autre de l'allée, du plus proche au plus lointain
    [-.6,1.8,1.82],[-1.1,2.0,1.8],[.6,2.3,1.72],[1.1,2.5,1.85],[-.6,2.7,1.78],[-1.1,2.9,1.7],
    [.6,3.1,1.84],[1.1,3.3,1.76],[-.85,4.5,1.7],[-1.4,4.7,1.8],[.85,4.5,1.75],[1.4,4.7,1.82]];
  function couloir(){
    const imgs=[...box.querySelectorAll('.slci-o')],sol=box.querySelector('.slci-sol path'),fond=box.querySelector('.slci-sol rect');
    // [élément, X (centre), Z, hauteur (m)] ; tous posés sur le sol
    const objs=[[imgs[0],0,FOND,FOND_H],[imgs[1],0,HOST_Z,1.78]].concat(CANDS.map((c,k)=>[imgs[k+2],c[0],c[1],c[2]]));
    objs.forEach(o=>o.push(o[0].naturalHeight/o[0].naturalWidth*100)); // hauteur affichée pour 100 px de large
    const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
    const D0=1000,D1=10500; // l'avancée, lente, commence après le fondu et finit quand le logo arrive (10 s), tenu jusqu'à 15 s
    const frame=now=>{
      if(done||!box)return;
      const p=reduce?0:Math.max(0,Math.min(1,(now-t0-D0)/(D1-D0))),cam=CAM1*ease(p);
      const H=innerHeight,W=innerWidth,f=.9*H,y0=HORIZON*H,cx=W/2;
      const px=(X,Z)=>cx+X*f/(Z-cam),py=Z=>y0+OEIL*f/(Z-cam);
      // Sol : lignes dans l'axe (tous les mètres) et en travers (tous les mètres), du pied de la caméra au fond.
      const zn=cam+.35;let d='';
      for(let X=-8;X<=8;X++)d+='M'+px(X,zn).toFixed(1)+' '+py(zn).toFixed(1)+'L'+px(X,FOND).toFixed(1)+' '+py(FOND).toFixed(1);
      for(let Z=Math.ceil(zn);Z<=FOND;Z++)d+='M'+px(-8,Z).toFixed(1)+' '+py(Z).toFixed(1)+'L'+px(8,Z).toFixed(1)+' '+py(Z).toFixed(1);
      sol.setAttribute('d',d);
      fond.setAttribute('y',py(FOND).toFixed(1));fond.setAttribute('height',Math.max(0,H-py(FOND)).toFixed(1));
      for(const [el,X,Z,h,hpx] of objs){
        const dz=Z-cam;
        if(dz<.3){el.style.opacity=0;continue} // déjà sorti du champ par le côté
        const s=f/dz,k=h*s/hpx,x=px(X,Z)-50*k,y=py(Z)-h*s;
        el.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) scale('+k.toFixed(4)+')';
        el.style.opacity='1';
        el.style.zIndex=Math.round(1000-Z*10);
      }
      if(!reduce&&p<1)requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    addEventListener('resize',()=>requestAnimationFrame(frame)); // écran redimensionné : on recalcule la scène
  }
  function build(){
    root.classList.add('slci-on');document.head.appendChild(hide);
    box=document.createElement('div');box.className='slci';
    box.innerHTML=
      '<div class="slci-sky" aria-hidden="true"></div>'+
      '<div class="slci-stage" aria-hidden="true">'+
        '<svg class="slci-sol" width="100%" height="100%"><defs><linearGradient id="slci-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1F7A"/><stop offset="1" stop-color="#1740C8"/></linearGradient></defs>'+
          '<rect x="0" width="100%" fill="url(#slci-g)"/><path fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/></svg>'+
        '<img class="slci-o" alt="" src="'+A.decor+'"><img class="slci-o" alt="" src="'+A.host+'">'+
        A.cands.map(c=>'<img class="slci-o" alt="" src="'+c+'">').join('')+
      '</div>'+
      '<div class="slci-vign" aria-hidden="true"></div>'+
      '<p class="slci-title slci-logo" aria-hidden="true"><img alt="" src="'+A.logo+'"></p>'+
      '<div class="slci-black" aria-hidden="true"></div>'+
      '<div class="slci-ctrl">'+(A.music?'<button type="button" class="slci-snd" aria-pressed="false">🔇 Son</button>':'')+'<button type="button" class="slci-skip">Passer l’intro</button></div>';
    document.body.appendChild(box);
    box.querySelector('.slci-skip').onclick=end;
    sndBtn=box.querySelector('.slci-snd');if(sndBtn){sndBtn.onclick=toggleSnd;showSnd(false);if(!audio){audio=new Audio(A.music);audio.preload='auto'}}
    addEventListener('keydown',onKey);
    const fail=setTimeout(end,6000); // réseau trop lent : on n'attend pas plus
    Promise.all([cssReady,load(A.decor),load(A.host),load(A.logo)].concat(A.cands.map(load))).then(()=>{
      clearTimeout(fail);if(done)return;
      box.classList.add('slci-ready');
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        box.classList.add('slci-run');t0=performance.now();couloir();
        if(getPref())soundOn();
        box.querySelector('.slci-skip').focus({preventScroll:true});
        timer=setTimeout(end,DUR);
      }));
    },()=>{clearTimeout(fail);end()});
  }
  // ---- Écran de lancement : mode « funky » (intro + son) ou mode « sérieux » (sans intro, fond noir) ----
  const MKEY='slc-mode';
  const getMode=()=>{try{return localStorage.getItem(MKEY)}catch(e){return null}};
  const setMode=v=>{try{localStorage.setItem(MKEY,v)}catch(e){}};
  function serious(){root.classList.add('slc-serieux')}
  function skipAll(){ // pas d'intro : on rend la main au jeu tout de suite
    done=true;root.classList.remove('slci-on');hide.remove();
    window.SLC_INTRO_DONE=true;document.dispatchEvent(new CustomEvent('slc:intro-end'));
  }
  function launchScreen(){
    const last=getMode();
    const lb=document.createElement('div');lb.className='slcl';
    lb.innerHTML=
      '<div class="slcl-in">'+
        '<h1 class="slcl-title">Sur le carreau</h1>'+
        '<p class="slcl-ok">Téléphone connecté ✓</p>'+
        '<p class="slcl-lead">Comment voulez-vous lancer le jeu ?</p>'+
        '<button type="button" class="slcl-funky"><b>🎬 Mode funky</b><span>Générique animé et son</span></button>'+
        '<button type="button" class="slcl-serious"><b>Mode sérieux</b><span>Sans intro, fond noir épuré</span></button>'+
      '</div>';
    document.body.appendChild(lb);
    const kill=()=>{lb.remove();lanced()};
    lb.querySelector('.slcl-funky').onclick=()=>{
      setMode('funky');setPref(true);try{localStorage.setItem('slc-sons','1')}catch(e){}
      // Ce clic est le geste qui autorise le son : on « débloque » l'élément audio (utile sur iPhone).
      if(A.music){try{audio=new Audio(A.music);audio.preload='auto';audio.muted=true;
        const p=audio.play();const un=()=>{try{audio.pause();audio.currentTime=0;audio.muted=false}catch(e){}};
        if(p&&p.then)p.then(un,()=>{audio.muted=false});else un()}catch(e){}}
      kill();build();
    };
    lb.querySelector('.slcl-serious').onclick=()=>{setMode('serieux');setPref(false);try{localStorage.setItem('slc-sons','0')}catch(e){}serious();kill();skipAll()};
    (lb.querySelector(last==='serieux'?'.slcl-serious':'.slcl-funky')).focus({preventScroll:true});
  }
  /* Le lancement n'a plus lieu à l'ouverture : la page affiche d'abord l'écran d'accueil (QR code), et le jeu
     appelle SLC_INTRO.start() quand le téléphone (la régie) est connecté. PRE = choix déjà fait :
     ?mode=serieux, ?mode=funky, retour de l'éditeur ou des crédits, ou lancement déjà fait dans cet onglet. */
  let PRE=null,started=false;
  const LKEY='slc-lance';
  function lanced(){try{sessionStorage.setItem(LKEY,'1')}catch(e){}}
  const q=new URLSearchParams(location.search).get('mode');
  if(q==='serieux'||q==='sérieux'){PRE='serieux';serious()}
  else if(q==='funky')PRE='funky';
  try{
    if(sessionStorage.getItem('slc-retour')){sessionStorage.removeItem('slc-retour');PRE=PRE||'skip'}
    if(sessionStorage.getItem(LKEY))PRE=PRE||'skip';
  }catch(e){}
  if(PRE==='skip'&&getMode()==='serieux')serious();
  function start(){
    if(started)return;started=true;
    if(PRE==='serieux'||PRE==='skip'){lanced();return skipAll()}
    if(PRE==='funky'){lanced();return build()}
    cssReady.then(launchScreen,()=>{lanced();skipAll()});
  }
  window.SLC_INTRO={start,get started(){return started}};
  addEventListener('hashchange',()=>{if(location.hash.startsWith('#arbitre')){if(box)end();else{const l=document.querySelector('.slcl');if(l)l.remove();skipAll()}}});
})();
