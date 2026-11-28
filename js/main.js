// Sur le carreau : démarrage, chargé en dernier (régie ou écran du jeu selon l'adresse).
if(isArb){
  document.documentElement.classList.add('slc-arb');
  ['sh1','toedit','tocredits','tophone'].forEach(id=>$(id).hidden=true);
  $('arb').insertBefore($('setup'),$('rl'));
  show('arb');
  let saved='';try{saved=localStorage.getItem('slc-arb-code')||''}catch(e){}
  if(ARB_CODE.length===4)arbJoin(ARB_CODE);
  else{if(/^[A-Z0-9]{4}$/.test(saved))$('rc').value=saved;arbView()}
}
if(!isArb){
  setInterval(pairTick,1000);
  // Le code et le QR code s'affichent dès l'ouverture. Après un rechargement ou un retour de l'éditeur,
  // le même code est repris (sessionStorage « slc-code ») : le téléphone se reconnecte seul.
  let vue='';try{vue=sessionStorage.getItem('slc-vue')||''}catch(e){}
  if(vue==='setup'){ORIGIN='screen';HOMEST='prep';show('setup');startIntro()}else show('home');
  getLink();pairRender();
}
addEventListener('hashchange',()=>location.reload());
/* ?debug=1 : navigateur détecté et mode allégé, en petit dans un coin, pour vérifier la TV d'un coup d'œil (test réel). */
if(/[?&]debug=1(&|$)/.test(location.search)){
  const ua=navigator.userAgent,chr=(ua.match(/Chrom(?:e|ium)\/(\d+)/)||[])[1],v=(document.querySelector('meta[name="slc-version"]')||{}).content;
  const cm=!!(window.CSS&&CSS.supports&&CSS.supports('color','color-mix(in srgb, red, blue)'));
  document.documentElement.classList.add('slc-debug'); // affiche aussi l'état de la liaison sur l'accueil (#hlnk)
  const d=document.createElement('div');d.id='slcdebug';d.className='slcdebug';
  d.textContent='Version '+v+' · '+(chr?'Chromium '+chr:'moteur non Chromium')+' · color-mix : '+(cm?'oui':'non')+
    ' · mode allégé : '+(LITE?'oui':'non')+(!LITE?'':LITE_PARAM_V==='1'?' (forcé par ?lite=1, mémorisé)':LITE_MEMO?' (mémorisé)':SLC_TV?' (TV détectée)':'')+' · '+innerWidth+'×'+innerHeight+' · '+ua;
  document.body.append(d);
}
