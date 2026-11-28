// Sur le carreau : le duel (niveaux, tirage des éléments, cartes, chronos, bonne réponse et « Passé », envoi à la régie).
const lvl=()=>niveauPour(S.joues); // S.joues : éléments déjà joués dans ce duel (S.n compte les ticks du chrono)
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
  if(!S.started){$('card').className='';$('card').textContent='';return}
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
  $('who').textContent=S.counting?'Départ dans '+S.count+'…':'À '+S.names[S.turn]+' de jouer (niveau '+S.lvl+')';
  dphase();bandRender();
}
/* Duel en bandeau (story 5.2, docs/ux.md §5.5). Étape du duel en classe sur #game (ph-wait, ph-cd, ph-run, ph-end) ;
   zone de réponse du bandeau (#dans) : « Prêts ? », « Départ dans 3… », niveau en cours, puis la réponse après une
   bonne réponse (vert) ou un « Passé » (rouge), et le vainqueur à la fin (violet). */
const repTxt=it=>{const a=String(it&&it[1]||'').split('|')[0].trim();return a.charAt(0).toUpperCase()+a.slice(1)};
function dphase(){
  const g=$('game'),ph=S.over?'end':S.counting?'cd':S.started?'run':'wait';
  if(g.dataset.ph!==ph){g.dataset.ph=ph;g.className='ph-'+ph}
}
let bandT=0;
function bandSet(k,tag,txt,ms){
  S.band={k,tag,txt};clearTimeout(bandT);
  const me=S;if(ms)bandT=setTimeout(()=>{if(me.band&&me.band.k===k){me.band=null;if(me===S)bandRender()}},ms);
  bandRender();
}
function bandRender(){
  if(!S)return;
  const b=S.band;let k='',tag='',txt='';
  if(S.over){k='end';tag='Fin du duel';txt=S.names[S.turn^1]+' gagne'}
  else if(b){k=b.k;tag=b.tag;txt=b.txt}
  else if(S.counting)txt='Départ dans '+S.count+'…';
  else if(!S.started)txt='Prêts ?';
  else{k='run';txt='Niveau '+S.lvl+' · à '+S.names[S.turn]+' de répondre'}
  const d=$('dans'),c='dans'+(k?' '+k:'');
  if(d.className!==c)d.className=c;
  if($('dtag').textContent!==tag)$('dtag').textContent=tag;
  if($('dtxt').textContent!==txt)$('dtxt').textContent=txt;
}
// « Passé » sur un mot à trous : le mot complet s'affiche, les lettres qui manquaient en couleur.
function revele(){
  if(S.type!=='trous'||!window.SLC_PERSO)return;
  const a=String(S.cur[1]).split('|')[0].toUpperCase(),d=[...String(S.disp)];
  if([...a].length!==d.length)return;
  paintCard($('card'),'trous',a);
  const spans=[...$('card').querySelectorAll('.slcm-l,.slcm-p')];let n=0;
  [...a].forEach((c,i)=>{if(/\s/.test(c))return;const sp=spans[n++];if(sp&&d[i]==='_')sp.classList.add('r')});
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
  $('win').textContent=S.names[w]+' remporte le duel !';S.band=null;
  let res=S.names[0]+' : '+S.sc[0]+' trouvé'+(S.sc[0]>1?'s':'')+'. '+S.names[1]+' : '+S.sc[1]+' trouvé'+(S.sc[1]>1?'s':'')+'.';
  if(S.pid&&G){
    S.winP=S.pid[w];S.loseP=S.pid[w^1];
    const nc=G.cells.filter(c=>c.owner===S.loseP).length;
    res+=' '+S.names[w]+' prend '+(nc>1?'les '+nc+' cases':'la case')+' de '+S.names[w^1]+'.';
    if(goldEarns(S.winP))res+=' '+S.names[w]+' gagne la case d’or : +'+GOLD_SEC+' s à utiliser au début d’un prochain duel.';
    $('again').textContent='Retour à la grille';
  }else $('again').textContent='Nouvelle partie';
  $('res').textContent=res;
  show('end');render();push();
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
  const step=()=>{
    snd('beep');$('card').className='';$('card').textContent='';$('who').textContent='Départ dans '+S.count+'…';
    $('dcdw').textContent=S.names[S.turn]+' commence';
    const n=$('dcdn');n.textContent=S.count;n.classList.remove('pop');void n.offsetWidth;n.classList.add('pop'); // le chiffre arrive en grossissant
    render();push();
  };
  step();
  S.cd=setInterval(()=>{S.count--;if(S.count>0)return step();clearInterval(S.cd);S.counting=false;S.count=0;begin()},1000);
}
function begin(){snd('go');S.started=true;dphase();showCard();S.last=performance.now();S.h=setInterval(tick,100);$('wait').hidden=true;push();$('ans').focus()}
function good(){const r=repTxt(S.cur);snd('good');S.sc[S.turn]++;S.joues++;S.turn^=1;card();flash('ok','Bonne réponse');bandSet('good','Bonne réponse',r,1400);render();push()}
function skip(){
  if(!S.started||S.lock||S.over)return;
  S.lock=true;S.joues++;S.t[S.turn]-=3000;
  if(S.t[S.turn]<=0){S.t[S.turn]=0;render();return finish()}
  snd('pass');clearTimeout(flashT);$('msg').className='';$('msg').textContent='C\'était : '+S.cur[1].split('|')[0]+' (−3 s)';
  bandSet('pass','Passé · '+S.names[S.turn]+' −3 s',repTxt(S.cur),1300);revele();
  render();push();
  setTimeout(()=>{if(S.over)return;S.lock=false;card();$('msg').textContent='';render();push();$('ans').focus()},1300);
}
