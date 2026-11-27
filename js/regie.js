// Sur le carreau : régie du téléphone (#arbitre) : vue selon l'étape de l'écran, configuration, arbitrage.
/* ---------- Régie (téléphone) ----------
   Connexion à l'écran du jeu (code ou QR code), configuration de la partie (formulaire #setup, déplacé ici),
   puis arbitrage. La vue suit l'étape envoyée par l'écran (message gs). Le code est retenu (localStorage
   « slc-arb-code » et adresse #arbitre=CODE) : après une mise en veille ou un rechargement, la régie se reconnecte seule. */
let R,L,cool=false,AFACE='',AIMG={k:null,src:null},GSAT=0,RCODE='',CFGW=null,CFGT=0,PSK='',RWIN=null;
function arbRender(){
  if(!R){$('ast').textContent='En attente du duel…';$('bok').disabled=$('bpass').disabled=true;return}
  $('ast').textContent='';
  const t=R.t.slice();if(R.started&&!R.over)t[R.turn]-=performance.now()-R.at;
  for(let i=0;i<2;i++){const s=$('a'+i);s.querySelector('.nm').textContent=R.names[i];s.querySelector('.tm').textContent=Math.ceil(Math.max(0,t[i])/1000);s.classList.toggle('on',R.turn===i&&!R.over);s.classList.toggle('low',t[i]<=5000)}
  $('actx').textContent=R.cat?'Catégorie : '+R.cat:'';$('agold').textContent=R.gold||'';
  // Type de jeu et consigne à annoncer aux candidats.
  $('atype').hidden=!R.consigne;
  if(R.consigne){$('atype').querySelector('.tn').textContent='Type de jeu : '+(R.tnom||'Images');$('atype').querySelector('.tc').textContent='À annoncer : « '+R.consigne+' »'}
  const fk=R.started?'c|'+R.card[0]+'|'+R.disp+'|'+(R.type==='photo'&&AIMG.k===R.card[0]):'n|'+(R.count||'?');
  if(fk!==AFACE){AFACE=fk;if(R.started)paintCard($('acard'),R.type||'emoji',R.disp!=null?R.disp:R.card[0],AIMG.k===R.card[0]?AIMG.src:null);else{$('acard').className='';$('acard').textContent=R.count||'?'}}
  $('aans').textContent=R.over?'Duel terminé':R.count?'Départ dans '+R.count+'…':!R.started?'Le duel n’a pas encore démarré':'À '+R.names[R.turn]+' (niveau '+R.lvl+') · réponse : '+R.card[1].split('|').join(' / ');
  $('bok').disabled=$('bpass').disabled=!R.started||R.over||R.lock||cool;
}
function act(a){if(!L||!R||cool)return;L.send('act',{a,c:R.card[0]});cool=true;arbRender();setTimeout(()=>{cool=false;arbRender()},700)}
$('bok').onclick=()=>act('ok');
$('bpass').onclick=()=>act('pass');
const cmd=c=>{if(L)L.send('cmd',{c})};
// Vue de la régie : code, attente, configuration ou partie, d'après l'étape de l'écran du jeu.
function arbView(){
  const fresh=GS&&Date.now()-GSAT<9000,ph=GS&&GS.phase;
  const v=!RCODE?'code':!GS?'wait':ph==='prep'?'cfg':ph==='play'||ph==='over'?'play':'wait';
  $('rscreen').textContent=RCODE?'Écran '+RCODE+(fresh?' · relié ✓':' · connexion…'):'';
  $('rj').hidden=v!=='code';$('rwait').hidden=v!=='wait';$('setup').hidden=v!=='cfg';$('rl').hidden=v!=='play';
  setSteps($('rsteps'),!GS?0:v==='play'?2:1);
  let m='',b='';
  if(v==='wait'){
    if(!GS)m='Connexion à l’écran '+RCODE+'…';
    else if(ph==='local'){m='La partie se configure sur l’écran du jeu.';b='Configurer depuis le téléphone'}
    else m='Connecté ✓ Sur l’écran du jeu, choisissez « Mode funky » ou « Mode sérieux ».';
  }
  if($('rwmsg').textContent!==m)$('rwmsg').textContent=m;
  $('rwbtn').hidden=!b;$('rwbtn').textContent=b;
  if(v==='play'){
    $('rduel').hidden=!GS.duel;
    const inf=GS.duel?'':GS.info||'';if($('rinfo').textContent!==inf)$('rinfo').textContent=inf;
    $('rgo').hidden=!GS.wait;$('rnew').hidden=ph!=='over';$('rquit').hidden=ph!=='play';
  }
}
// Catégories perso : créées sur l'ordinateur du jeu, la régie n'en reçoit que la liste (clé, nom, type, nombre).
function persoSync(list){
  const k=JSON.stringify(list||[]);if(k===PSK)return;PSK=k;
  for(const x of Object.keys(DATA))if(DATA[x].stub)delete DATA[x];
  for(const it of Array.isArray(list)?list:[]){
    const[key,label,type,n]=Array.isArray(it)?it:[];
    if(typeof key!=='string'||hasCat(key)||!TYPES[type])continue;
    DATA[key]={label:String(label),type,items:Array.from({length:Math.max(0,Math.min(999,+n||0))},()=>['','',1]),perso:true,stub:true};
  }
  catsUI();
}
const goText=()=>$('gmode').value==='grid'?'Commencer la partie':'Lancer le duel';
function cfgDone(err){
  CFGW=null;clearTimeout(CFGT);
  $('gosubmit').textContent=goText();pickRender();
  if(err){$('gosubmit').disabled=false;$('gowhy').hidden=false;$('gowhy').textContent=err}
}
function sendCfg(){
  if(!L||CFGW)return;
  const rid=rnd();CFGW=rid;
  $('gosubmit').disabled=true;$('gosubmit').textContent='Envoi à l’écran…';$('gowhy').hidden=true;
  L.send('cfg',{rid,cfg:formCfg()});
  CFGT=setTimeout(()=>{if(CFGW===rid)cfgDone('L’écran du jeu ne répond pas : vérifiez la liaison et réessayez.')},8000);
}
const ronmsg=(topic,d)=>{
  if(topic==='st'){if(d.img)AIMG={k:d.card[0],src:d.img};R=d;R.at=performance.now();arbRender()}
  else if(topic==='gs'){
    GS=d;GSAT=Date.now();persoSync(d.perso);
    if(RWIN!==!!d.win){RWIN=!!d.win;if(!$('setup').hidden)pickRender()}
    if(d.phase!=='play'&&d.phase!=='over')R=null;
    arbView();
  }else if(topic==='cfgr'&&d.rid===CFGW)cfgDone(d.ok?'':d.err||'Configuration refusée par l’écran du jeu.');
};
function arbJoin(c){
  RCODE=c;try{localStorage.setItem('slc-arb-code',c)}catch(e){}
  // L'adresse garde le code : un rechargement rejoint le même écran (replaceState ne recharge pas la page).
  try{if(location.hash!=='#arbitre='+c)history.replaceState(null,'','#arbitre='+c)}catch(e){}
  arbView();$('alk').textContent=$('rwlk').textContent='Liaison entre appareils : connexion…';
  guideArbitre(false); // première fois sur ce téléphone : guide de l'arbitre (js/aide.js)
  link(c,'arb',ronmsg,(m,st)=>{$('alk').textContent=$('rwlk').textContent=linkMsg(m,st)}).then(l=>{
    // Le message de présence porte le mode choisi : l'écran du jeu adapte ses cartes « Comment jouer ».
    L=l;const hi=()=>L.send('hi',{mode:$('gmode').value});hi();$('gmode').addEventListener('change',hi);setInterval(hi,3000);setInterval(arbRender,100);setInterval(arbView,1000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)hi()});
  });
}
$('rj').onsubmit=e=>{
  e.preventDefault();
  const c=$('rc').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(c.length!==4){$('rc').setCustomValidity('Le code compte 4 caractères.');$('rc').reportValidity();return}
  arbJoin(c);
};
$('rc').oninput=()=>$('rc').setCustomValidity('');
$('rwbtn').onclick=()=>cmd('prep');
$('rgo').onclick=()=>cmd('go');
$('rnew').onclick=()=>cmd('new');
$('rquit').onclick=()=>{if(confirm('Arrêter la partie en cours ?'))cmd('quit')};
$('rchange').onclick=()=>{try{localStorage.removeItem('slc-arb-code')}catch(e){}location.hash='#arbitre'};
// Retour depuis la régie : on quitte #arbitre (la page se recharge sur l'écran d'accueil).
$('arback').onclick=()=>{location.hash=''};
