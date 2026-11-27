// Sur le carreau : le duel (niveaux, tirage des éléments, cartes, chronos, bonne réponse et « Passé », envoi à la régie).
const lvl=()=>Math.min(LVL_MAX,1+Math.floor((S.sc[0]+S.sc[1])/LVL_STEP));
function fill(){PRE.vu.clear();S.pool=LVLS.map(()=>[]).concat([[]]);for(const it of S.src)S.pool[it[2]].push(it);S.pool.forEach(shuffle)}
function card(){
  const L=lvl(),order=[L,L-1,L+1,L-2,L+2,L-3,L+3,L-4,L+4].filter(l=>l>=1&&l<=LVL_MAX);
  if(!S.pool[L].length)S.pool[L]=shuffle(S.src.filter(x=>x[2]===L&&x!==S.cur));
  let l=order.find(x=>S.pool[x].length);
  if(!l){fill();l=order.find(x=>S.pool[x].length)}
  S.cur=S.pool[l].pop();
  S.lvl=S.cur[2]; // niveau affiché : celui de l'élément tiré
  const P=window.SLC_PERSO,t=S.type;
  S.disp=t==='trous'&&P?P.masque(S.cur[1],S.cur[2]):t==='melange'&&P?P.melange(S.cur[1],S.cur[2]):t==='photo'?'':t==='indices'?S.cur[3].clues.join('\n'):t==='envers'?S.cur[3].env:S.cur[0];
  showCard();
  precharger();
}
/* Préchargement des photos (ENF2, TV) : la photo tirée (affichée au départ du duel) et les 3 suivantes. Les réserves
   S.pool sont déjà mélangées et card() prend le dernier élément : les suivantes sont donc connues d'avance. On prend
   aussi les 2 prochaines du niveau au-dessus, au cas où le niveau monterait. Seule la catégorie en jeu est chargée. */
const PRE={vu:new Set(),im:[]};
function precharger(){
  if(S.type!=='photo')return;
  const L=lvl(),up=Math.min(LVL_MAX,L+1),next=[S.cur].concat(S.pool[L].slice(-3).reverse(),up!==L?S.pool[up].slice(-2).reverse():[]);
  for(const it of next){
    const src=it&&it[3]&&it[3].img;if(!src||PRE.vu.has(src))continue;
    PRE.vu.add(src);const im=new Image();im.src=src;PRE.im.push(im); // garder une référence : le navigateur ne l'abandonne pas
    if(PRE.im.length>12)PRE.im.shift();
  }
}
// Carte affichée : emoji (texte), mot à trous ou lettres mélangées (tuiles), photo, indices (liste) ou titre à l'envers. Sert aussi à la page arbitre.
function paintCard(el,type,disp,img){
  el.className=type==='trous'||type==='melange'?'mot':type==='photo'?'pho':type==='indices'?'ind':type==='envers'?'env':'';
  if((type==='trous'||type==='melange')&&window.SLC_PERSO)return SLC_PERSO.renderMot(el,disp);
  if(type==='envers'&&window.SLC_PERSO)return SLC_PERSO.renderEnv(el,disp);
  if(type==='indices'&&window.SLC_PERSO)return SLC_PERSO.renderInd(el,disp);
  if(type==='photo'){el.textContent='';if(img){const im=new Image();im.src=img;im.alt='Photo à nommer';el.appendChild(im)}else el.textContent='📷';return}
  el.textContent=disp;
}
function showCard(){
  if(!S.started){$('card').className='';$('card').textContent='?';return}
  paintCard($('card'),S.type,S.disp,S.cur[3]&&S.cur[3].img);
}
function flash(cls,txt){$('msg').className=cls;$('msg').textContent=txt;clearTimeout(flashT);flashT=setTimeout(()=>{$('msg').className='';$('msg').textContent=''},1000)}
function render(){
  for(let i=0;i<2;i++){
    $('nm'+i).textContent=S.names[i];
    $('tm'+i).textContent=Math.ceil(Math.max(0,S.t[i])/1000);
    const n=S.sc[i];$('sc'+i).textContent=n+' trouvé'+(n>1?'s':'');
    $('s'+i).classList.toggle('on',S.turn===i);
    $('s'+i).classList.toggle('low',S.t[i]<=5000);
  }
  $('who').textContent='À '+S.names[S.turn]+' de jouer (niveau '+S.lvl+')';
}
function push(){
  if(!(S&&S.oral&&S.link))return;
  const k=S.cur[0],d={names:S.names,t:S.t.map(Math.round),sc:S.sc,turn:S.turn,card:[k,S.cur[1],S.cur[2]],disp:S.disp,lvl:S.lvl,over:S.over,lock:S.lock,started:S.started,count:S.counting?S.count:0,cat:S.cat,type:S.type,tnom:TYPES[S.type].nom,icone:TYPES[S.type].icone,consigne:TYPES[S.type].consigne,gold:S.gold};
  // Photo : la vignette n'est envoyée à l'arbitre qu'au changement d'image (et de temps en temps, au cas où).
  if(S.type==='photo'&&S.cur[3]&&(S.imgK!==k||++S.imgN%8===0)){d.img=S.cur[3].thumb;S.imgK=k}
  S.link.send('st',d);
}
const snd=(n,a)=>{try{window.SLC_SND&&SLC_SND.play(n,a)}catch(e){}};
function finish(){
  snd('end');S.over=true;clearInterval(S.h);clearInterval(S.cd);
  const w=S.turn^1;
  $('win').textContent=S.names[w]+' remporte le duel';
  let res=S.names[0]+' : '+S.sc[0]+' trouvé'+(S.sc[0]>1?'s':'')+'. '+S.names[1]+' : '+S.sc[1]+' trouvé'+(S.sc[1]>1?'s':'')+'.';
  if(S.pid&&G){
    S.winP=S.pid[w];S.loseP=S.pid[w^1];
    const nc=G.cells.filter(c=>c.owner===S.loseP).length;
    res+=' '+S.names[w]+' prend '+(nc>1?'les '+nc+' cases':'la case')+' de '+S.names[w^1]+'.';
    if(goldEarns(S.winP))res+=' '+S.names[w]+' gagne la case d’or : +'+GOLD_SEC+' s à utiliser au début d’un prochain duel.';
    $('again').textContent='Retour à la grille';
  }else $('again').textContent='Nouvelle partie';
  $('res').textContent=res;
  show('end');push();
}
function tick(){
  const n=performance.now(),s0=Math.ceil(S.t[S.turn]/1000);S.t[S.turn]-=n-S.last;S.last=n;
  if(S.t[S.turn]<=0){S.t[S.turn]=0;render();return finish()}
  // Tic-tac des 5 dernières secondes : un son à chaque seconde franchie (5, 4, 3, 2, 1) du joueur qui a la main.
  const s1=Math.ceil(S.t[S.turn]/1000);if(s1<s0&&s1<=5)snd('urgent',s1);
  render();if(++S.n%10===0)push();
}
function launch(){
  if(!S||S.started||S.counting||S.over)return;
  S.counting=true;S.count=3;$('go').disabled=true;$('wait').hidden=true;
  const step=()=>{snd('beep');$('card').className='';$('card').textContent=S.count;$('who').textContent='Départ dans '+S.count+'…';push()};
  step();
  S.cd=setInterval(()=>{S.count--;if(S.count>0)return step();clearInterval(S.cd);S.counting=false;S.count=0;begin()},1000);
}
function begin(){snd('go');S.started=true;showCard();S.last=performance.now();S.h=setInterval(tick,100);$('wait').hidden=true;push();$('ans').focus()}
function good(){snd('good');S.sc[S.turn]++;S.turn^=1;card();flash('ok','Bonne réponse');render();push()}
function skip(){
  if(!S.started||S.lock||S.over)return;
  S.lock=true;S.t[S.turn]-=3000;
  if(S.t[S.turn]<=0){S.t[S.turn]=0;render();return finish()}
  snd('pass');clearTimeout(flashT);$('msg').className='';$('msg').textContent='C\'était : '+S.cur[1].split('|')[0]+' (−3 s)';
  render();push();
  setTimeout(()=>{if(S.over)return;S.lock=false;card();$('msg').textContent='';render();push();$('ans').focus()},1300);
}
