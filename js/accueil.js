// Sur le carreau : écran du jeu côté liaison (messages reçus, code, #pair, connexion de la régie) et écran d'accueil (QR code, HOMEST, lancement).
let LINKP=null,LINK=null,LCODE='',lastHi=0,LSTAT=null;
const onmsg=(topic,d)=>{
  if(topic==='hi'){
    const was=arbOn();lastHi=Date.now();if(S)S.imgK=null;
    homeArb();pairTick();
    if(!was)gsSend(true);
    push();
  }else if(topic==='act'&&S&&S.oral&&S.started&&!S.over&&!S.lock&&d.c===S.cur[0]){d.a==='ok'?good():d.a==='pass'&&skip()}
  else if(topic==='cfg'){
    lastHi=Date.now();
    const ph=gphase();
    const err=ph==='prep'||ph==='local'?applyCfg(d.cfg):'Une partie est déjà en cours sur l’écran du jeu.';
    if(!err)ORIGIN='phone';
    if(LINK)LINK.send('cfgr',{rid:d.rid,ok:!err,err});
    gsSend(true);
  }else if(topic==='cmd'){
    lastHi=Date.now();
    if(d.c==='go'){if(S&&S.oral&&S.link&&!S.started&&!S.counting&&!S.over&&!$('game').hidden)launch()}
    else if(d.c==='new'||d.c==='quit'||d.c==='prep')toPrep();
    gsSend(true);
  }
};
function getLink(){
  if(LINKP)return LINKP;
  return LINKP=(async()=>{
    let saved='';try{saved=sessionStorage.getItem('slc-code')||''}catch(e){}
    for(let n=0;n<8;n++){
      // On reprend d'abord le code de cet onglet (rechargement, retour de l'éditeur) : l'arbitre se reconnecte seul.
      const code=n===0&&/^[A-Z0-9]{4}$/.test(saved)?saved:Array.from({length:4},()=>CH[Math.floor(Math.random()*CH.length)]).join('');
      const l=await link(code,'game',onmsg,(m,st)=>{LSTAT=[m,st];pairTick()});
      if(!l.taken){LINK=l;LCODE=code;try{sessionStorage.setItem('slc-code',code)}catch(e){}pairRender();return l}
    }
    return null;
  })();
}
function resetLink(){if(LINK&&LINK.close)LINK.close();LINK=null;LINKP=null;LCODE='';lastHi=0;LSTAT=null;try{sessionStorage.removeItem('slc-code')}catch(e){}}
/* ---------- Connexion de l'arbitre ----------
   Écran « Connecter l'arbitre » (#pair) : ouvert au premier lancement dans l'onglet, puis par le badge
   « Arbitre » ou le bouton du panneau d'attente. Seul endroit où le code (et son QR code) s'affiche.
   L'arbitre est « connecté » s'il a envoyé un « hi » depuis moins de 7 s (il en envoie toutes les 3 s). */
const arbOn=()=>Date.now()-lastHi<7000;
let pairBack=null;
function pairURL(){return /^https?:$/.test(location.protocol)?location.origin+location.pathname+'#arbitre='+LCODE:''}
// QR code (SVG) du lien de la régie, dans la boîte donnée.
function qrInto(box,u){
  box.textContent='';if(!u)return;
  const m=SLC_QR(u),n=m.length,q=3,NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 '+(n+2*q)+' '+(n+2*q));svg.setAttribute('shape-rendering','crispEdges');
  let d='';m.forEach((row,r)=>row.forEach((on,c)=>{if(on)d+='M'+(c+q)+' '+(r+q)+'h1v1h-1z'}));
  const bg=document.createElementNS(NS,'rect');bg.setAttribute('width',n+2*q);bg.setAttribute('height',n+2*q);bg.setAttribute('fill','#fff');
  const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('fill','#03040E');
  svg.append(bg,p);box.appendChild(svg);
}
const HOWTXT=u=>u?'Scannez le QR code avec le téléphone. Sinon, ouvrez le jeu sur le téléphone, touchez « Ouvrir la régie sur cet appareil » et saisissez le code.'
  :'Sur le téléphone, ouvrez le jeu, touchez « Ouvrir la régie sur cet appareil » et saisissez le code.';
function pairRender(){
  $('pcode').textContent=LCODE||'…';$('hcode').textContent=LCODE||'…';
  const u=LCODE&&window.SLC_QR&&pairURL();
  qrInto($('pqr'),u);qrInto($('hqr'),u);
  $('phow').textContent=$('hhow').textContent=HOWTXT(u);
  pairTick();
}
function pairTick(){
  if(isArb)return;
  const on=arbOn(),b=$('arbadge'),busy=S&&(S.counting||(S.started&&!S.over));
  b.textContent=on?'Régie connectée ✓':'Régie non connectée';b.classList.toggle('on',on);
  b.setAttribute('aria-label',(on?'Régie connectée':'Régie non connectée')+' : ouvrir la connexion de la régie');
  b.hidden=!$('pair').hidden||!LINKP||!$('home').hidden;
  document.documentElement.classList.toggle('slc-badge',!b.hidden);
  const st=$('pst'),txt=!LCODE?'Création du code…':on?'Régie connectée ✓':'En attente du téléphone…';
  if(st.textContent!==txt)st.textContent=txt;st.classList.toggle('on',on);
  $('plnk').textContent=$('hlnk').textContent=LSTAT?linkMsg(LSTAT[0],LSTAT[1]):'';
  homeRender();gsSend();
  $('pok').textContent=on?'Continuer':'Continuer sans attendre';$('pok').className=on?'':'alt';
  $('pnew').disabled=!!busy;
  // Panneau d'attente avant un duel : pas de code, seulement l'état et, si besoin, l'accès à la connexion.
  if(S&&S.oral&&!S.started&&!S.counting&&!S.over){
    $('go').disabled=!on||!S.link;$('wpair').hidden=on;
    const w=on?'Régie connectée. Démarrez ici ou sur le téléphone.':'La régie (le téléphone) n’est pas connectée.';
    if($('wst').textContent!==w)$('wst').textContent=w;
  }
}
function openPair(){
  if(isArb)return;
  pairBack=document.activeElement;$('pair').hidden=false;
  getLink();pairRender();$('pok').focus();
}
function closePair(){
  $('pair').hidden=true;pairTick();
  const t=pairBack&&pairBack!==document.body&&document.contains(pairBack)&&!pairBack.closest('[hidden]')?pairBack:null;pairBack=null;
  (t||(!$('wait').hidden&&!$('game').hidden?($('go').disabled?$('wpair'):$('go')):null)||(!$('setup').hidden?$('gosubmit'):null)||($('home').hidden?$('arbadge'):document.body)).focus();
}
$('pok').onclick=closePair;
$('pair').addEventListener('keydown',e=>{if(e.key==='Escape')closePair()});
$('arbadge').onclick=openPair;
$('wpair').onclick=openPair;
$('pnew').onclick=()=>{
  if(S&&(S.counting||(S.started&&!S.over)))return;
  resetLink();if(S)S.link=null;pairRender();
  getLink().then(()=>{if(S&&S.oral&&!S.started)attach(S)});
};
/* ---------- Écran d'accueil de l'écran du jeu ----------
   HOMEST : 'home' (QR code, en attente du téléphone), 'launch' (choix Funky ou Sérieux puis intro, sur l'écran
   du jeu : ce geste débloque le son), 'prep' (le téléphone configure la partie).
   ORIGIN : d'où vient la partie en cours ('phone' ou 'screen'), pour savoir où revenir à la fin. */
let HOMEST='home',ORIGIN='phone';
const setSteps=(ol,cur)=>[...ol.children].forEach((li,i)=>{li.className=i<cur?'done':i===cur?'cur':'';if(i===cur)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
function startIntro(){const I=window.SLC_INTRO;if(I&&!I.started)I.start()}
// Le téléphone vient de se connecter : choix du lancement sur l'écran du jeu, puis attente de la configuration.
function homeArb(){
  if(isArb||HOMEST!=='home'||$('home').hidden)return;
  const I=window.SLC_INTRO;
  if(!I||I.started||window.SLC_INTRO_DONE){HOMEST='prep';homeRender();return}
  HOMEST='launch';homeRender();
  document.addEventListener('slc:intro-end',()=>{HOMEST='prep';homeRender();gsSend(true)},{once:true});
  I.start();
}
function homeRender(){
  if(isArb)return;
  const on=arbOn(),prep=HOMEST!=='home';
  $('hconnect').hidden=prep&&on;$('hprep').hidden=!prep;
  $('hh2').textContent=prep?'Reconnectez le téléphone':'Scannez pour prendre la main';
  const t=!LCODE?'Création du code…':on?'Téléphone connecté ✓':'En attente du téléphone…',st=$('hst');
  if(st.textContent!==t)st.textContent=t;st.classList.toggle('on',on);
  const pt=on?'Régie connectée ✓ · écran '+LCODE:'La régie s’est déconnectée : reconnectez le téléphone.',ps=$('hpst');
  if(ps.textContent!==pt)ps.textContent=pt;ps.classList.toggle('on',on);
  $('hph2').textContent=HOMEST==='launch'?'Lancement…':'Partie en préparation sur le téléphone…';
  setSteps($('hsteps'),prep&&on?1:0);
}
// Étape de l'écran du jeu, envoyée à la régie : home, launch, prep, local (configuration sur l'écran), play, over.
function gphase(){
  if(!$('home').hidden)return HOMEST;
  if(!$('setup').hidden)return'local';
  if(G&&!$('grid').hidden)return G.over?'over':'play';
  if(S&&S.pid)return'play';
  if(S&&S.over&&!$('end').hidden)return'over';
  return S?'play':'prep';
}
function ginfo(){
  if(G&&!$('grid').hidden)return $('gtitle').textContent;
  if(!$('end').hidden)return $('win').textContent;
  if(S&&!$('game').hidden)return S.names[0]+' contre '+S.names[1]+' · '+S.cat;
  return'';
}
const persoList=()=>Object.keys(DATA).filter(k=>DATA[k].perso).map(k=>[k,DATA[k].label,DATA[k].type,DATA[k].items.length]);
let GSK='',GST=0;
function gsSend(force){
  if(isArb||!LINK)return;
  const d={phase:gphase(),code:LCODE,info:ginfo(),win:/Windows/.test(navigator.userAgent),perso:persoList(),
    duel:!!(S&&!S.over&&!$('game').hidden),wait:!!(S&&S.oral&&S.link&&!S.started&&!S.counting&&!S.over&&!$('game').hidden)};
  const k=JSON.stringify(d);
  if(!force&&k===GSK&&Date.now()-GST<3000)return;
  GSK=k;GST=Date.now();LINK.send('gs',d);
}
// Retour à l'attente de la configuration par le téléphone (nouvelle partie, partie arrêtée).
function toPrep(){
  if(isArb)return;
  if(S){clearInterval(S.h);clearInterval(S.cd);if(!S.over){S.over=true;push()}}
  if(G){clearTimeout(G.drawT);G.draw=false}
  if(gAnimT){cancelAnimationFrame(gAnimT);gAnimT=null}
  S=null;G=null;ORIGIN='phone';HOMEST='prep';
  try{sessionStorage.removeItem('slc-vue')}catch(e){}
  if(!$('pair').hidden)$('pair').hidden=true;
  show('home');pairTick();gsSend(true);
}
function backToStart(){
  if(ORIGIN!=='screen')return toPrep();
  if(G){clearTimeout(G.drawT);G.draw=false}
  show('setup');gsSend(true);
}
$('hlocal').onclick=()=>{ORIGIN='screen';HOMEST='prep';try{sessionStorage.setItem('slc-vue','setup')}catch(e){}show('setup');pairTick();gsSend(true);startIntro();$('gmode').focus()};
$('tophone').onclick=toPrep;
function attach(me){
  getLink().then(l=>{
    if(me!==S)return;
    if(!l){$('wst').textContent='Impossible de créer un code : rechargez la page.';return}
    S.code=LCODE;S.link=l;pairTick();
    push();
  });
}
function startDuel(o){
  if(S){clearInterval(S.h);clearInterval(S.cd)}
  const bo=o.bonus||[0,0];
  S={names:o.names,t:[o.T+bo[0],o.T+bo[1]],goldUse:o.goldUse||[],gold:o.gold||'',turn:Math.random()<.5?0:1,sc:[0,0],src:o.src,cat:o.cat,type:TYPES[o.type]?o.type:'emoji',disp:'',imgK:null,imgN:0,pid:o.pid||null,pool:null,lvl:1,last:performance.now(),lock:false,over:false,started:false,counting:false,count:0,oral:o.oral,n:0};
  fill();card();render();show('game');$('msg').textContent='';$('dcat').textContent='Catégorie : '+o.cat+(typeName(S.type)?' · '+typeName(S.type):'');$('dgold').textContent=S.gold;
  $('f2').hidden=$('pass').hidden=o.oral;$('wait').hidden=!o.oral;$('wback').hidden=!S.pid;
  if(!o.oral)return launch();
  $('go').disabled=true;$('wst').textContent='';
  if(LINK)S.link=LINK;
  attach(S);pairTick();
}
// Configuration lue sur le formulaire de départ (le même sur l'écran du jeu et sur la régie).
function formCfg(){
  if($('gmode').value==='grid')return{mode:'grid',size:+$('gsize').value,names:[...$('gnames').querySelectorAll('input')].map(x=>x.value.trim()),keys:PICK.slice()};
  return{mode:'duel',names:[$('n0').value.trim(),$('n1').value.trim()],cat:$('cat').value};
}
// Vérifie une configuration et lance la partie. Renvoie un message d'erreur, ou '' si tout va bien.
function applyCfg(c){
  if(!c||typeof c!=='object')return'Configuration illisible.';
  const nm=(a,n)=>Array.from({length:n},(_,i)=>(Array.isArray(a)&&typeof a[i]==='string'?a[i].replace(/\s+/g,' ').trim().slice(0,14):'')||'Joueur '+(i+1));
  if(c.mode==='grid'){
    const size=+c.size;if(![2,3,4].includes(size))return'Taille de grille inconnue.';
    const keys=Array.isArray(c.keys)?[...new Set(c.keys)]:[];
    const miss=keys.filter(k=>!hasCat(k));
    if(miss.length)return'Catégorie inconnue sur l’écran du jeu : '+miss.join(', ')+'. Rechargez les deux appareils.';
    if(keys.length!==size*size)return'Il faut '+size*size+' catégories pour une grille '+size+'×'+size+' ('+keys.length+' reçues).';
    startGrid({size,names:nm(c.names,size*size),keys});return'';
  }
  if(c.mode==='duel'){
    const d=hasCat(c.cat)&&DATA[c.cat];if(!d)return'Catégorie inconnue sur l’écran du jeu. Rechargez les deux appareils.';
    startDuel({names:nm(c.names,2),src:d.items,cat:d.label,type:d.type,T:DUEL_SEC*1000,oral:true});return'';
  }
  return'Mode de jeu inconnu.';
}
$('form').onsubmit=e=>{
  e.preventDefault();
  if($('gmode').value==='grid'&&PICK.length!==pneed()){pickRender();return}
  if(isArb)return sendCfg();
  ORIGIN='screen';applyCfg(formCfg());
};

