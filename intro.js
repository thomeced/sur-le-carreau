/* Intro « Sur le carreau » : générique animé avant l'écran de départ.
 *
 * Installation : une seule ligne dans le <head> de index.html, après la feuille de style du jeu :
 *   balise script avec src="intro.js" (sans defer ni async, pour masquer le jeu dès l'ouverture)
 * Le script charge intro.css et les images de assets/intro/ (décor, animateur, candidats gauche et droite).
 * Il ne touche pas à la logique du jeu : il pose un calque par-dessus la page, puis le retire.
 *
 * - Bouton « Passer l'intro » (et touche Échap).
 * - Bouton son (générique assets/intro/generique.mp3) : coupé par défaut, car les navigateurs
 *   bloquent le son sans geste de l'utilisateur. Le choix est retenu (localStorage) et réessayé à la visite suivante.
 * - Pas d'intro sur la vue arbitre (#arbitre).
 * - Écran de lancement : « mode funky » (intro + son) ou « mode sérieux » (sans intro, fond noir épuré, classe slc-serieux
 *   sur <html>). Le dernier choix est retenu (localStorage « slc-mode ») et pré-sélectionné. Liens directs :
 *   ?mode=serieux (saute l'écran de lancement) et ?mode=funky.
 * - Si une image ne se charge pas, l'intro est sautée.
 * - Fin de l'intro : événement « slc:intro-end » sur document.
 * - Version autonome (artefact claude.ai) : définir avant ce script window.SLC_INTRO_ASSETS
 *   = {decor, host, candLeft, candRight, music} (adresses data:) et window.SLC_INTRO_CSS_INLINE = true.
 */
(function(){
  if(location.hash==='#arbitre')return;
  const root=document.documentElement,me=document.currentScript;
  const base=(me&&me.src?me.src.replace(/[^/]*$/,''):'');
  const A=window.SLC_INTRO_ASSETS||{
    decor:base+'assets/intro/decor.webp',host:base+'assets/intro/host.webp',
    candLeft:base+'assets/intro/cand-left.webp',candRight:base+'assets/intro/cand-right.webp',
    music:base+'assets/intro/generique.mp3'};
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DUR=reduce?2400:10000;

  // Masquer le jeu tout de suite, avant même que la page ne s'affiche.
  root.classList.add('slci-on');
  const hide=document.createElement('style');
  hide.textContent='html.slci-on body>main{visibility:hidden}.slci:not(.slci-ready)>*{visibility:hidden}.slci{position:fixed;inset:0;z-index:1000;background:#03040E}';
  document.head.appendChild(hide);
  let cssReady=Promise.resolve();
  if(!window.SLC_INTRO_CSS_INLINE){
    const l=document.createElement('link');l.rel='stylesheet';l.href=base+'intro.css';
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
    const fin=()=>{if(box)box.remove();hide.remove();document.dispatchEvent(new CustomEvent('slc:intro-end'))};
    if(box&&box.classList.contains('slci-ready')){box.classList.add('slci-out');setTimeout(fin,500)}else fin();
  }
  function onKey(e){if(e.key==='Escape')end()}
  const load=src=>new Promise((ok,ko)=>{const i=new Image();i.onload=()=>(i.decode?i.decode().catch(()=>{}):Promise.resolve()).then(()=>ok(i));i.onerror=ko;i.src=src});

  function build(){
    box=document.createElement('div');box.className='slci';
    box.innerHTML=
      '<div class="slci-sky" aria-hidden="true"></div>'+
      '<div class="slci-scene" aria-hidden="true">'+
        '<div class="slci-plane slci-p-decor"><div class="slci-decor-box"><img alt="" src="'+A.decor+'"><div class="slci-screen">Sur le<br>carreau</div></div></div>'+
        '<div class="slci-plane slci-p-floor slci-floor"></div>'+
        '<div class="slci-plane slci-p-host"><img class="slci-host" alt="" src="'+A.host+'"></div>'+
        '<div class="slci-plane slci-p-cl"><img class="slci-cl" alt="" src="'+A.candLeft+'"></div>'+
        '<div class="slci-plane slci-p-cr"><img class="slci-cr" alt="" src="'+A.candRight+'"></div>'+
      '</div>'+
      '<div class="slci-vign" aria-hidden="true"></div>'+
      '<p class="slci-title" aria-hidden="true">Sur le carreau</p>'+
      '<div class="slci-black" aria-hidden="true"></div>'+
      '<div class="slci-ctrl">'+(A.music?'<button type="button" class="slci-snd" aria-pressed="false">🔇 Son</button>':'')+'<button type="button" class="slci-skip">Passer l’intro</button></div>';
    document.body.appendChild(box);
    box.querySelector('.slci-skip').onclick=end;
    sndBtn=box.querySelector('.slci-snd');if(sndBtn){sndBtn.onclick=toggleSnd;showSnd(false);if(!audio){audio=new Audio(A.music);audio.preload='auto'}}
    addEventListener('keydown',onKey);
    const fail=setTimeout(end,6000); // réseau trop lent : on n'attend pas plus
    Promise.all([cssReady,load(A.decor),load(A.host),load(A.candLeft),load(A.candRight)]).then(()=>{
      clearTimeout(fail);if(done)return;
      box.classList.add('slci-ready');
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        box.classList.add('slci-run');t0=performance.now();
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
    document.dispatchEvent(new CustomEvent('slc:intro-end'));
  }
  function launchScreen(){
    const last=getMode();
    const lb=document.createElement('div');lb.className='slcl';
    lb.innerHTML=
      '<div class="slcl-in">'+
        '<h1 class="slcl-title">Sur le carreau</h1>'+
        '<p class="slcl-lead">Comment voulez-vous lancer le jeu ?</p>'+
        '<button type="button" class="slcl-funky"><b>🎬 Mode funky</b><span>Générique animé et son</span></button>'+
        '<button type="button" class="slcl-serious"><b>Mode sérieux</b><span>Sans intro, fond noir épuré</span></button>'+
      '</div>';
    document.body.appendChild(lb);
    const kill=()=>lb.remove();
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
  function begin(){
    const q=new URLSearchParams(location.search).get('mode');
    if(q==='serieux'||q==='sérieux'){serious();return skipAll()}   // lien direct : ?mode=serieux
    if(q==='funky'){return build()}                                  // lien direct : ?mode=funky (le son suit le dernier choix)
    cssReady.then(launchScreen,skipAll);
  }
  if(document.body)begin();else document.addEventListener('DOMContentLoaded',begin,{once:true});
  addEventListener('hashchange',()=>{if(location.hash==='#arbitre'){if(box)end();else{const l=document.querySelector('.slcl');if(l)l.remove();skipAll()}}});
})();
