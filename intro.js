/* Intro « Sur le carreau » : générique animé avant l'écran de départ.
 *
 * Installation : une seule ligne dans le <head> de index.html, après la feuille de style du jeu :
 *   balise script avec src="intro.js" (sans defer ni async, pour masquer le jeu dès l'ouverture)
 * Le script charge intro.css et les images de assets/intro/ (décor, animateur, candidats gauche et droite).
 * Il ne touche pas à la logique du jeu : il pose un calque par-dessus la page, puis le retire.
 *
 * - Bouton « Passer l'intro » (et touche Échap).
 * - Pas d'intro sur la vue arbitre (#arbitre).
 * - Si une image ne se charge pas, l'intro est sautée.
 * - Fin de l'intro : événement « slc:intro-end » sur document.
 * - Version autonome (artefact claude.ai) : définir avant ce script window.SLC_INTRO_ASSETS
 *   = {decor, host, candLeft, candRight} (adresses data:) et window.SLC_INTRO_CSS_INLINE = true.
 */
(function(){
  if(location.hash==='#arbitre')return;
  const root=document.documentElement,me=document.currentScript;
  const base=(me&&me.src?me.src.replace(/[^/]*$/,''):'');
  const A=window.SLC_INTRO_ASSETS||{
    decor:base+'assets/intro/decor.webp',host:base+'assets/intro/host.webp',
    candLeft:base+'assets/intro/cand-left.webp',candRight:base+'assets/intro/cand-right.webp'};
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

  let box=null,done=false,timer=0;
  function end(){
    if(done)return;done=true;clearTimeout(timer);
    removeEventListener('keydown',onKey);
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
      '<button type="button" class="slci-skip">Passer l’intro</button>';
    document.body.appendChild(box);
    box.querySelector('.slci-skip').onclick=end;
    addEventListener('keydown',onKey);
    const fail=setTimeout(end,6000); // réseau trop lent : on n'attend pas plus
    Promise.all([cssReady,load(A.decor),load(A.host),load(A.candLeft),load(A.candRight)]).then(()=>{
      clearTimeout(fail);if(done)return;
      box.classList.add('slci-ready');
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        box.classList.add('slci-run');
        box.querySelector('.slci-skip').focus({preventScroll:true});
        timer=setTimeout(end,DUR);
      }));
    },()=>{clearTimeout(fail);end()});
  }
  if(document.body)build();else document.addEventListener('DOMContentLoaded',build,{once:true});
  addEventListener('hashchange',()=>{if(location.hash==='#arbitre')end()});
})();
