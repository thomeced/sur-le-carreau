// Sur le carreau : choix des catégories de la partie (PICK, tirage, ajout, retrait) et démarrage de la grille (startGrid).
/* ---------- Choix des catégories de la grille ----------
   Autant de catégories que de cases, tirées au hasard (tirage pur) puis modifiables : ✕ pour retirer,
   « + » pour ajouter. Le lancement est bloqué tant que le compte n'est pas exact. Les catégories
   choisies sont ensuite placées au hasard sur le plateau. */
let PICK=[],PTOUCH=false,PNOTE='';
const POPEN=new Set();
const PFEW=15; // en dessous, avertissement : des éléments risquent de revenir pendant un duel
const psize=()=>{const k=+$('gsize').value||2;return k+'×'+k};
const pneed=()=>(+$('gsize').value||2)**2;
const ptypes=()=>{const o=Object.keys(TYPES),u=[...new Set(Object.values(DATA).map(v=>v.type))];return u.sort((a,b)=>o.indexOf(a)-o.indexOf(b))};
const pkeys=(t,keys)=>(keys||Object.keys(DATA)).filter(k=>DATA[k].type===t).sort((a,b)=>DATA[a].label.localeCompare(DATA[b].label,'fr'));
const plabel=k=>DATA[k].label+(DATA[k].perso?' (perso)':'');
const pnote=t=>{PNOTE=t};
const pplural=(n,w)=>n+' '+w+(n>1?'s':'');
function pdraw(){PICK=shuffle(Object.keys(DATA)).slice(0,pneed())}
function pfill(){const rest=shuffle(Object.keys(DATA).filter(k=>!PICK.includes(k))),n=Math.max(0,Math.min(rest.length,pneed()-PICK.length));PICK.push(...rest.slice(0,n));return n}
function ptrim(){const n=Math.max(0,PICK.length-pneed());for(let i=0;i<n;i++)PICK.splice(Math.floor(Math.random()*PICK.length),1);return n}
// Après un (re)chargement des catégories : on garde le choix du joueur, ou on refait le tirage s'il n'y a pas touché
// (ainsi les catégories perso, chargées un peu après, entrent dans le tirage de départ).
function pickSync(){PICK=PICK.filter(k=>DATA[k]);if(!PTOUCH)pdraw();pickRender()}
// Avertissements non bloquants sur une catégorie choisie.
const flagRe=/[\u{1F1E6}-\u{1F1FF}]{2}/u;
// Les drapeaux dépendent de l'appareil qui affiche le jeu : sur la régie, c'est l'écran du jeu qui compte.
const scrWin=()=>isArb?!!(GS&&GS.win):/Windows/.test(navigator.userAgent);
function pwarnOf(k){
  const v=DATA[k],w=[];
  if(v.items.length<PFEW)w.push('seulement '+pplural(v.items.length,'élément')+', certains risquent de revenir pendant le duel');
  if(v.type==='emoji'&&scrWin()&&v.items.some(it=>flagRe.test(it[0])))w.push('les drapeaux s’affichent en lettres sous Windows');
  return w;
}
function pickRender(focus){
  const grid=$('gmode').value==='grid',need=pneed(),n=PICK.length,total=Object.keys(DATA).length;
  const go=$('gosubmit'),why=$('gowhy');
  if(!grid||!total){why.hidden=true;if(total)go.disabled=false;return}
  const pc=$('pcount');pc.textContent=n+' / '+pplural(need,'catégorie');pc.className='pcount '+(n===need?'ok':n<need?'short':'over');
  $('pnote').textContent=PNOTE;PNOTE='';
  // Catégories choisies, par type de jeu.
  const box=$('pchosen');box.textContent='';
  if(!n){const p=document.createElement('p');p.className='pinfo';p.textContent='Aucune catégorie choisie.';box.appendChild(p)}
  const warns=[];
  for(const t of ptypes()){
    const ks=pkeys(t,PICK);if(!ks.length)continue;
    const g=document.createElement('div'),h=document.createElement('h3'),c=document.createElement('div');
    g.className='pgroup';c.className='chips';h.textContent=(TYPES[t].icone?TYPES[t].icone+' ':'')+TYPES[t].nom+' ('+ks.length+')';
    for(const k of ks){
      const w=pwarnOf(k),ch=document.createElement('span'),nm=document.createElement('span'),ct=document.createElement('span'),x=document.createElement('button');
      ch.className='chip'+(w.length?' warn':'');nm.className='cn';ct.className='ci';
      nm.textContent=(w.length?'⚠ ':'')+plabel(k);ct.textContent=DATA[k].items.length;ct.title=pplural(DATA[k].items.length,'élément');
      x.type='button';x.textContent='✕';x.dataset.k=k;x.setAttribute('aria-label','Retirer '+plabel(k));
      x.onclick=()=>{const i=PICK.indexOf(k);PTOUCH=true;PICK.splice(i,1);pickRender('rm:'+k)};
      ch.append(nm,ct,x);c.appendChild(ch);
      for(const m of w)warns.push(plabel(k)+' : '+m+'.');
    }
    g.append(h,c);box.appendChild(g);
  }
  const ul=$('pwarn');ul.textContent='';ul.hidden=!warns.length;
  for(const m of warns){const li=document.createElement('li');li.textContent=m;ul.appendChild(li)}
  // Boutons et message d'erreur.
  $('pfill').hidden=n>=need;$('ptrim').hidden=n<=need;
  let err='';
  if(n<need)err='Il manque '+pplural(need-n,'catégorie')+' pour une grille '+psize()+' : ajoutez-en ci-dessous ou cliquez sur « Compléter au hasard ».';
  else if(n>need)err=pplural(n-need,'catégorie')+' de trop pour une grille '+psize()+' : retirez-en '+(n-need)+' (✕) ou cliquez sur « Retirer au hasard ».';
  $('perr').textContent=err;$('perr').hidden=!err;
  go.disabled=!!err;why.hidden=!err;why.textContent=err?'Impossible de commencer : '+(n<need?'il manque '+pplural(need-n,'catégorie'):pplural(n-need,'catégorie')+' en trop')+'.':'';
  // Catégories à ajouter, par type de jeu (sections repliables).
  const pool=$('ppool'),full=n>=need;pool.textContent='';
  const rest=Object.keys(DATA).filter(k=>!PICK.includes(k));
  if(rest.length){
    const h=document.createElement('h3');h.textContent='Ajouter une catégorie';pool.appendChild(h);
    if(full){const p=document.createElement('p');p.className='pinfo';p.textContent='La grille est complète : retirez une catégorie pour en ajouter une autre.';pool.appendChild(p)}
    for(const t of ptypes()){
      const ks=pkeys(t,rest);if(!ks.length)continue;
      const d=document.createElement('details'),sm=document.createElement('summary'),c=document.createElement('div');
      d.open=POPEN.has(t);d.ontoggle=()=>{d.open?POPEN.add(t):POPEN.delete(t)};
      sm.textContent=(TYPES[t].icone?TYPES[t].icone+' ':'')+TYPES[t].nom+' ('+ks.length+')';c.className='chips';
      for(const k of ks){
        const b=document.createElement('button'),w=pwarnOf(k);
        b.type='button';b.className='padd';b.dataset.k=k;b.disabled=full;
        b.textContent='+ '+plabel(k)+' · '+DATA[k].items.length+(w.length?' ⚠':'');
        b.title=w.length?w.join(' ; '):pplural(DATA[k].items.length,'élément');
        b.setAttribute('aria-label','Ajouter '+plabel(k)+', '+pplural(DATA[k].items.length,'élément')+(w.length?' ; attention : '+w.join(' ; '):''));
        b.onclick=()=>{if(PICK.length>=pneed())return;PTOUCH=true;PICK.push(k);pickRender('add:'+t)};
        c.appendChild(b);
      }
      d.append(sm,c);pool.appendChild(d);
    }
  }else{const p=document.createElement('p');p.className='pinfo';p.textContent='Toutes les catégories sont déjà choisies.';pool.appendChild(p)}
  // Rendre le focus clavier à un endroit logique après un ajout ou un retrait.
  if(focus){
    let el=null;
    if(focus.startsWith('rm:'))el=box.querySelector('.chip button')||$('pdraw');
    else if(focus.startsWith('add:'))el=[...pool.querySelectorAll('.padd')].find(b=>!b.disabled&&DATA[b.dataset.k].type===focus.slice(4))||box.querySelector('.chip button:last-of-type');
    if(el)el.focus();
  }
}
$('pdraw').onclick=()=>{PTOUCH=true;pdraw();pnote('Nouveau tirage : '+pplural(PICK.length,'catégorie')+'.');pickRender()};
$('pfill').onclick=()=>{PTOUCH=true;const n=pfill();pnote(pplural(n,'catégorie')+' ajoutée'+(n>1?'s':'')+' au hasard.');pickRender();$('pdraw').focus()};
$('ptrim').onclick=()=>{PTOUCH=true;const n=ptrim();pnote(pplural(n,'catégorie')+' retirée'+(n>1?'s':'')+' au hasard.');pickRender();$('pdraw').focus()};
function gmodeRender(){
  const grid=$('gmode').value==='grid';
  $('duelfields').hidden=grid;$('gridfields').hidden=!grid;
  $('gosubmit').textContent=grid?'Commencer la partie':'Lancer le duel';
  $('lead').textContent=grid
    ?'Un joueur par case, chacune avec sa catégorie. Les duels se jouent à l’oral, validés par un arbitre : le gagnant prend les cases du perdant et défie un voisin, jusqu’au dernier joueur en lice.'
    :'Un duel à deux, à l’oral, validé par un arbitre : nommez les images le plus vite possible. Chaque bonne réponse passe la main à l’adversaire, et celui dont le temps tombe à zéro perd.';
  if(grid)gnamesRender();
  pickRender();
}
// Listes de catégories et tailles de grille : remplies avec categories.js, puis complétées par les catégories perso.
function catsUI(){
  const nCat=Object.keys(DATA).length,cur=$('cat').value;
  $('cat').textContent='';
  // Liste du duel à deux : catégories rangées par type de jeu.
  for(const t of ptypes()){
    const g=document.createElement('optgroup');g.label=(TYPES[t].icone?TYPES[t].icone+' ':'')+TYPES[t].nom;
    for(const k of pkeys(t)){const v=DATA[k],o=document.createElement('option');o.value=k;o.textContent=v.label+(v.perso?' (perso)':'');g.appendChild(o)}
    $('cat').appendChild(g);
  }
  if(cur&&DATA[cur])$('cat').value=cur;
  const prev=$('gsize').value;
  $('gsize').innerHTML=[2,3,4].map(k=>'<option value="'+k+'"'+(k*k>nCat?' disabled':'')+'>'+k+'×'+k+' ('+k*k+' joueurs)'+(k*k>nCat?' : pas assez de catégories':'')+'</option>').join('');
  $('gsize').value=prev&&(+prev)**2<=nCat?prev:nCat>=16?'4':nCat>=9?'3':'2';
  const none=!nCat;$('cerr').hidden=!none;
  if(none)$('cerr').textContent='Les catégories n’ont pas pu être chargées : le fichier categories.js est introuvable ou vide.';
  $('form').querySelector('button[type=submit]').disabled=none;
  if($('gmode').value==='grid')gnamesRender();
  pickSync();
}
$('gmode').onchange=gmodeRender;
$('gsize').onchange=()=>{
  gnamesRender();
  // Grille agrandie : on complète au hasard. Grille réduite : rien n'est retiré sans l'accord du joueur.
  const n=pfill();if(n)pnote(n+' catégorie'+(n>1?'s':'')+' ajoutée'+(n>1?'s':'')+' au hasard pour la grille '+psize()+'.');
  pickRender();
};
gmodeRender();
catsUI();
if(window.SLC_PERSO&&!isArb)SLC_PERSO.load().then(p=>{if(Object.keys(p).length){addCats(p);catsUI()}}).catch(e=>console.warn('Catégories perso indisponibles :',e));
// o = {size, names, keys} : depuis l'écran de départ (gridFromForm) ou depuis la régie (cfg).
function startGrid(o){
  if(S){clearInterval(S.h);clearInterval(S.cd)}
  aideCartesStop();
  const size=o.size,n=size*size,names=o.names;
  const keys=shuffle(o.keys.slice());
  G={size,n,players:names.map(name=>({name,alive:true,streak:0,gold:false})),cells:names.map((_,i)=>({cat:keys[i%keys.length],owner:i})),
     ch:Math.floor(Math.random()*n),sel:null,anim:null,draw:false,drawT:null,played:new Set(),use:new Set(),note:'',seed:Math.floor(Math.random()*4294967296),shape:null,over:false,T:DUEL_SEC*1000,oral:true};
  S=null;
  show('grid');gridRender();
}
