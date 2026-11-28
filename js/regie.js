// Sur le carreau : régie du téléphone (#arbitre) : vue selon l'étape de l'écran, configuration, arbitrage.
/* ---------- Régie (téléphone) ----------
   Connexion à l'écran du jeu (code ou QR code), configuration de la partie (formulaire #setup, déplacé ici),
   puis arbitrage. La vue suit l'étape envoyée par l'écran (message gs). Le code est retenu (localStorage
   « slc-arb-code » et adresse #arbitre=CODE) : après une mise en veille ou un rechargement, la régie se reconnecte seule. */
let ATK='',R,L,cool=false,AFACE='',AIMG={k:null,src:null},GSAT=0,RCODE='',CFGW=null,CFGT=0,PSK='',RWIN=null;
function arbRender(){
  if(!R){$('ast').textContent='En attente du duel…';$('bok').disabled=$('bpass').disabled=true;return}
  $('ast').textContent='';
  const t=R.t.slice();if(R.started&&!R.over)t[R.turn]-=performance.now()-R.at;
  for(let i=0;i<2;i++){const s=$('a'+i);s.querySelector('.nm').textContent=R.names[i];s.querySelector('.tm').textContent=Math.ceil(Math.max(0,t[i])/1000);s.classList.toggle('on',R.turn===i&&!R.over);s.classList.toggle('low',t[i]<=5000)}
  // Story 5.4 : « A contre B » avant le départ ; catégorie et niveau à côté de la vignette ; réponse attendue en grand.
  const avant=!R.started&&!R.count;
  $('avs').hidden=!avant;if(avant){$('avs0').textContent=R.names[0];$('avs1').textContent=R.names[1]}
  $('acard').hidden=avant;$('rduel').querySelector('.abtns').hidden=!R.started; // verdicts seulement une fois le duel parti
  const ctx=R.cat?(R.cat+(R.started&&!R.over?' · niveau '+R.lvl:'')):'';if($('actx').textContent!==ctx)$('actx').textContent=ctx;
  const qui=R.over?'Duel terminé':R.count?'Départ dans '+R.count+'…':!R.started?'':'À '+R.names[R.turn]+' de répondre';
  if($('aqui').textContent!==qui)$('aqui').textContent=qui;
  $('agold').textContent=R.gold||'';
  const rep=R.started&&!R.over&&R.card?R.card[1].split('|').map(x=>x.trim()):null;
  $('arep').hidden=!rep;
  if(rep){const a=rep[0].charAt(0).toUpperCase()+rep[0].slice(1),v=rep.length>1?'Aussi accepté : '+rep.slice(1).join(' / '):'';
    if($('arept').textContent!==a)$('arept').textContent=a;if($('arepv').textContent!==v)$('arepv').textContent=v}
  // Consigne à annoncer aux joueurs : en grand avant le départ, réduite à une ligne (icône, type) pendant le duel.
  $('atype').hidden=!R.consigne;
  if(R.consigne)arbConsigne(!R.started||!!R.count);
  const fk=R.started?'c|'+R.card[0]+'|'+R.disp+'|'+(R.type==='photo'&&AIMG.k===R.card[0]):'n|'+(R.count||'?');
  if(fk!==AFACE){AFACE=fk;if(R.started)paintCard($('acard'),R.type||'emoji',R.disp!=null?R.disp:R.card[0],AIMG.k===R.card[0]?AIMG.src:null);else{$('acard').className='';$('acard').textContent=R.count||'?'}}
  $('aans').textContent=R.over?'Duel terminé':R.count?'Départ dans '+R.count+'…':!R.started?'Le duel n’a pas encore démarré':'À '+R.names[R.turn]+' (niveau '+R.lvl+') · réponse : '+R.card[1].split('|').join(' / ');
  $('bok').disabled=$('bpass').disabled=!R.started||R.over||R.lock||cool;
}
function arbConsigne(grand){
  const ic=R.icone||'🖼️',nom=R.tnom||'Images',k=grand+'|'+ic+'|'+nom+'|'+R.consigne;
  if(k===ATK)return;ATK=k; // arbRender tourne toutes les 100 ms : on ne touche au texte que s'il change
  const el=$('atype');el.classList.toggle('mini',!grand);el.textContent='';
  const i=document.createElement('span');i.className='ti';i.setAttribute('aria-hidden','true');i.textContent=ic+' ';el.append(i);
  if(!grand)return el.append(nom);
  const b=document.createElement('strong');b.textContent='Annoncez : ';el.append(b);
  // « Mot à trous, retrouvez le mot complet. » : la consigne suit le nom du type, sans majuscule.
  el.append(nom+', '+R.consigne.charAt(0).toLowerCase()+R.consigne.slice(1));
}
function act(a){if(!L||!R||cool)return;L.send('act',{a,c:R.card[0]});cool=true;arbRender();setTimeout(()=>{cool=false;arbRender()},700)}
$('bok').onclick=()=>act('ok');
$('bpass').onclick=()=>act('pass');
const cmd=(c,p)=>{if(L)L.send('cmd',p==null?{c}:{c,p})};
// Vue de la régie : code, attente, configuration ou partie, d'après l'étape de l'écran du jeu.
function arbView(){
  const fresh=GS&&Date.now()-GSAT<9000,ph=GS&&GS.phase;
  const v=!RCODE?'code':!GS?'wait':ph==='prep'?'cfg':ph==='play'||ph==='over'?'play':'wait';
  $('rscreen').textContent=RCODE?'Écran '+RCODE+(fresh?' ✓':' · connexion…'):'';$('rscreen').classList.toggle('on',!!fresh);
  $('rmenu').hidden=!RCODE;if(!RCODE)menuOpen(false);
  $('rj').hidden=v!=='code';$('rwait').hidden=v!=='wait';$('setup').hidden=v!=='cfg';$('rl').hidden=v!=='play';
  setSteps($('rsteps'),!GS?0:v==='play'?2:1);
  let m='',b='';
  if(v==='wait'){
    if(!GS)m='Connexion à l’écran '+RCODE+'…';
    else if(ph==='local'){m='La partie se configure sur l’écran du jeu.';b='Configurer depuis le téléphone'}
    else if(ph==='launch')m='Connecté ✓ Lancement sur l’écran du jeu…';
    else m='Connecté ✓';
  }
  $('rlance').hidden=!(v==='wait'&&GS&&ph!=='local');
  // Bascule « Lancement sur l'écran » (attente et configuration) : reflète le mode retenu par l'écran du jeu.
  const lm=GS&&GS.mode==='serieux'?'serieux':'funky';
  document.querySelectorAll('[data-lm]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lm===lm?'true':'false'));
  if($('rwmsg').textContent!==m)$('rwmsg').textContent=m;
  $('rwbtn').hidden=!b;$('rwbtn').textContent=b;
  if(v==='play'){
    $('rduel').hidden=!GS.duel;
    const inf=GS.duel||(GS.grid&&!GS.grid.over&&!GS.grid.draw)?'':GS.info||'';if($('rinfo').textContent!==inf)$('rinfo').textContent=inf;
    $('rgo').hidden=!GS.wait;$('rnew').hidden=ph!=='over';$('rquit').hidden=ph!=='play';
    $('rback').hidden=!GS.back;$('ragain').hidden=!GS.again;
  }
  gridView(v==='play'&&!GS.duel&&GS.grid);
}
/* Choix en grille (story 2.8) : la régie choisit l'adversaire, la case d'or, lance le duel ou retourne sur le sol.
   L'écran du jeu applique (gridCmd) et renvoie son état ; on ne reconstruit que si l'état a changé (focus gardé). */
let RGK='';
function gridView(g){
  const box=$('rgrid'),k=g?JSON.stringify(g):'';
  box.hidden=!g||g.over||g.draw;
  if(k===RGK)return;
  const fid=document.activeElement&&box.contains(document.activeElement)?document.activeElement.dataset.f:null;
  RGK=k;box.textContent='';
  if(!g||g.over||g.draw)return;
  const el=(t,txt,cl)=>{const e=document.createElement(t);if(txt!=null)e.textContent=txt;if(cl)e.className=cl;return e};
  const btn=(txt,cl,f,on)=>{const b=el('button',txt,cl);b.type='button';b.dataset.f=f;b.onclick=on;return b};
  // Mini-plateau aux couleurs de la TV (story 5.4) : où sont le joueur en cours et ses adversaires possibles.
  if(g.mini){
    const m=el('div',null,'rmini'),foes=g.foes.map(x=>x[0]);m.style.gridTemplateColumns='repeat('+g.mini.n+',minmax(0,1fr))';
    m.setAttribute('role','img');m.setAttribute('aria-label','Plateau : '+g.name+' en violet, adversaires possibles en bleu clair');
    g.mini.c.forEach(o=>{const c=el('span');c.className=o===g.ch?'me':o===g.sel?'sel':g.mini.or[o]?'or':foes.includes(o)?'foe':'';m.append(c)});
    const top=el('div',null,'rgtop');top.append(m);
    const h=el('h3',null);h.append(el('span',g.name,'rme'),g.sel==null?' choisit son adversaire':' défie son adversaire');
    top.append(h);box.append(top);
  }
  if(g.sel==null){
    box.append(el('p','Touchez l’adversaire annoncé par le joueur :','rtip'));
    const l=el('div',null,'rfoes');
    for(const[q,name,label,icone,gold]of g.foes){
      const b=btn(name,gold?'gold':'','sel'+q,()=>cmd('sel',q));
      b.append(el('small',(icone?icone+' ':'')+label+(gold?' · ★ case d’or':'')));
      b.setAttribute('aria-label','Défier '+name+' en '+label);l.append(b);
    }
    box.append(l);
    if(g.hold)box.append(el('p','★ '+g.name+' détient la case d’or (+'+GOLD_SEC+' s).'));
    else if(g.streak)box.append(el('p','Série : '+g.streak+' victoire'+(g.streak>1?'s':'')+' d’affilée, encore '+(GOLD_STREAK-g.streak)+' pour la case d’or.'));
    if(g.sol)box.append(btn('Retourner sur le sol','alt','sol',()=>cmd('sol')));
  }else{
    const f=g.foes.find(x=>x[0]===g.sel);
    box.append(el('p',g.name+' défie '+(f?f[1]+' en « '+f[2]+' »':'son adversaire')+'.','rtip'));
    for(const[q,name,on]of g.gold){
      const b=btn((on?'★ ':'☆ ')+name+' utilise sa case d’or (+'+GOLD_SEC+' s)','alt rgold','or'+q,()=>cmd('or',q));
      b.setAttribute('aria-pressed',on?'true':'false');box.append(b);
    }
    box.append(btn('Lancer le duel','big','duel',()=>cmd('duel')),btn('Changer d’adversaire','alt','unsel',()=>cmd('unsel')));
  }
  const again=fid&&box.querySelector('[data-f="'+fid+'"]');if(again)again.focus();
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
$('rback').onclick=()=>cmd('back');
$('ragain').onclick=()=>cmd('grille');
if(isArb)document.querySelectorAll('[data-lm]').forEach(b=>b.onclick=()=>{cmd('lance',b.dataset.lm);document.querySelectorAll('[data-lm]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.lm===b.dataset.lm?'true':'false'))});
$('rnew').onclick=()=>cmd('new');
$('rquit').onclick=()=>{menuOpen(false);if(confirm('Arrêter la partie en cours ?'))cmd('quit')};
$('rchange').onclick=()=>{try{localStorage.removeItem('slc-arb-code')}catch(e){}location.hash='#arbitre'};
/* Menu « ⋯ » (story 5.4) : « Arrêter la partie » et « Changer d'écran », à l'écart des boutons de jeu. */
function menuOpen(on){$('rmenup').hidden=!on;$('rmenu').setAttribute('aria-expanded',String(!!on))}
$('rmenu').onclick=e=>{e.stopPropagation();menuOpen($('rmenup').hidden);if(!$('rmenup').hidden){const b=[...$('rmenup').querySelectorAll('button')].find(x=>!x.hidden);if(b)b.focus()}};
document.addEventListener('click',e=>{if(!$('rmenup').hidden&&!$('rmenup').contains(e.target))menuOpen(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('rmenup').hidden){menuOpen(false);$('rmenu').focus()}});
/* Configuration compacte sur le téléphone (story 5.4) : mode et taille en boutons côte à côte (les listes restent,
   masquées, et gardent toute la logique), 6 catégories visibles puis « Voir les N autres », liste d'ajout derrière
   « Ajouter… », noms des joueurs derrière « Saisir les noms ». */
if(isArb){
  const seg=(sel,lab)=>{
    const s=$(sel),box=document.createElement('div');box.className='seg segw';box.setAttribute('role','group');box.setAttribute('aria-label',lab);
    s.classList.add('sr');s.closest('label').after(box);
    const build=()=>{box.textContent='';[...s.options].forEach(o=>{
      const b=document.createElement('button');b.type='button';b.textContent=sel==='gsize'?o.value+'×'+o.value:o.textContent;b.disabled=o.disabled;
      b.setAttribute('aria-pressed',String(o.value===s.value));
      b.onclick=()=>{if(s.value===o.value)return;s.value=o.value;s.dispatchEvent(new Event('change'));build()};box.append(b)})};
    s.addEventListener('change',build);new MutationObserver(build).observe(s,{childList:true});build();
    return build;
  };
  seg('gmode','Mode de jeu');seg('gsize','Taille de la grille');
  let PALL=false,PADD=false,GNOMS=false;
  const compact=()=>{
    const chips=[...$('pchosen').querySelectorAll('.chip')],cache=!PALL&&chips.length>7;
    chips.forEach((c,i)=>c.hidden=cache&&i>=6);
    $('pchosen').querySelectorAll('.pgroup').forEach(g=>g.hidden=[...g.querySelectorAll('.chip')].every(c=>c.hidden));
    let m=$('pmore');if(!m){m=document.createElement('button');m.type='button';m.id='pmore';m.className='lnk pmore';m.onclick=()=>{PALL=!PALL;pickRender()}}
    $('pchosen').after(m);m.hidden=chips.length<=7;m.textContent=PALL?'Voir moins':'Voir les '+(chips.length-6)+' autres';
    $('padd').hidden=false;$('ppool').hidden=!PADD;$('padd').setAttribute('aria-expanded',String(PADD));$('padd').textContent=PADD?'Fermer la liste':'Ajouter…';
  };
  const pr=pickRender;pickRender=function(f){pr(f);compact()};
  $('padd').onclick=()=>{PADD=!PADD;compact();if(PADD){const b=$('ppool').querySelector('button');if(b)b.focus()}};
  const noms=()=>{$('gnbtn').hidden=false;$('gnames').hidden=!GNOMS;$('gnbtn').setAttribute('aria-expanded',String(GNOMS));$('gnbtn').textContent=GNOMS?'Masquer les noms':'Saisir les noms'};
  $('gnbtn').onclick=()=>{GNOMS=!GNOMS;noms();if(GNOMS){const i=$('gnames').querySelector('input');if(i)i.focus()}};
  noms();pickRender();
}
// Retour depuis la régie : on quitte #arbitre (la page se recharge sur l'écran d'accueil).
$('arback').onclick=()=>{location.hash=''};
