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
