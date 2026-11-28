// Sur le carreau : plateau SVG, vague de capture, « Retourner sur le sol » (gdraw), rendu de la grille et enchaînement des duels.
/* ---------- Plateau SVG ----------
   Le plateau est un quadrillage droit : une case carrée par joueur au départ. Les formes irrégulières
   (façon pièces de Tetris) naissent des captures : les cases d'un même joueur sont fusionnées
   visuellement (même couleur, frontière blanche seulement entre joueurs différents). */
const GNS='http://www.w3.org/2000/svg';
const sv=(tag,at,par)=>{const e=document.createElementNS(GNS,tag);for(const k in at)e.setAttribute(k,at[k]);if(par)par.appendChild(e);return e};
function grng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function gshape(){
  if(G.shape)return G.shape;
  const n=G.size,P=[],H=[],V=[];
  for(let y=0;y<=n;y++){P[y]=[];H[y]=[];V[y]=[];for(let x=0;x<=n;x++){P[y][x]=[x,y];H[y][x]=V[y][x]=[0,0]}}
  return G.shape={P,H,V};
}
/* Couleurs du plateau : un bleu unique pour toutes les cases, violet pour le joueur en cours,
   bleu clair pour les adversaires qu'il peut défier, plus clair encore pour l'adversaire choisi. */
const GC={gold:'#D9A21B',goldSel:'#F2C44E',base:'#1B3DB0',me:'#7A3FD8',foe:'#3D78EA',sel:'#6A9CFF',pick:'#BFD3FF',flash:['#4F86F7','#6E9BFF','#3F74E8','#8DB0FF','#5A8FFF']};
// Le détenteur de la case d'or garde son territoire en jaune (plus clair s'il est l'adversaire choisi).
function gfill(o,foes){
  if(G.players[o].gold&&!G.over)return G.sel===o?GC.goldSel:GC.gold;
  if(G.draw)return GC.base;
  if(o===G.ch)return GC.me;
  if(G.sel===o)return GC.sel;
  return foes.includes(o)?GC.foe:GC.base;
}
let GV=null,gAnimT=null;
const gctx=document.createElement('canvas').getContext('2d');
const gmeasure=(t,px,w)=>{gctx.font=w+' '+px+'px Poppins,"DM Sans",system-ui,sans-serif';return gctx.measureText(t).width};
function gfit(t,px,w,max){
  if(gmeasure(t,px,w)<=max)return t;
  let a=0,b=t.length;while(a<b){const m=(a+b+1)>>1;gmeasure(t.slice(0,m).trimEnd()+'…',px,w)<=max?a=m:b=m-1}
  return t.slice(0,Math.max(1,a)).trimEnd()+'…';
}
function gwrap(t,px,w,max,lines){
  const words=t.split(' '),out=[];let cur='';
  for(let k=0;k<words.length;k++){
    const tryL=cur?cur+' '+words[k]:words[k];
    if(gmeasure(tryL,px,w)<=max||!cur){cur=tryL;continue}
    if(out.length===lines-1){cur+=' '+words.slice(k).join(' ');break}
    out.push(cur);cur=words[k];
  }
  out.push(cur);
  return out.map(l=>gfit(l,px,w,max));
}
/* Dessin complet du plateau. own(i) donne le propriétaire affiché de la case i (pendant une capture,
   les cases prises gardent l'ancien propriétaire jusqu'au passage de la vague). */
function gboardBuild(tg){
  const box=$('gboard'),n=G.size,{P,H,V}=gshape();
  const Wd=Math.max(260,Math.round(box.clientWidth||700)),narrow=Wd<560,Ht=Math.round(Wd*(narrow?1.05:.7));
  const sx=Wd/n,sy=Ht/n,pt=q=>[q[0]*sx,q[1]*sy],f=v=>Math.round(v*10)/10;
  // Un bord : de A à B, deux points de contrôle décalés perpendiculairement (forme en S).
  const edge=(A,B,o)=>{const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,px=-dy/L,py=dx/L;
    return[A,[A[0]+dx/3+px*o[0],A[1]+dy/3+py*o[0]],[A[0]+2*dx/3+px*o[1],A[1]+2*dy/3+py*o[1]],B].map(pt)};
  const E=[],cellE=[...Array(n*n)].map(()=>[]);
  const addE=(c,a,b)=>{const e={c,a,b,d:'M'+c[0].map(f)+'C'+c[1].map(f)+' '+c[2].map(f)+' '+c[3].map(f)};E.push(e);if(a>=0)cellE[a].push(e);if(b>=0)cellE[b].push(e);return e};
  const hE=[],vE=[];
  for(let y=0;y<=n;y++){hE[y]=[];for(let x=0;x<n;x++)hE[y][x]=addE(edge(P[y][x],P[y][x+1],H[y][x]),y>0?(y-1)*n+x:-1,y<n?y*n+x:-1)}
  for(let y=0;y<n;y++){vE[y]=[];for(let x=0;x<=n;x++)vE[y][x]=addE(edge(P[y][x],P[y+1][x],V[y][x]),x>0?y*n+x-1:-1,x<n?y*n+x:-1)}
  const seg=(e,rev)=>{const c=rev?[...e.c].reverse():e.c;return'C'+c[1].map(f)+' '+c[2].map(f)+' '+c[3].map(f)};
  const cells=G.cells.map((_,i)=>{
    const y=Math.floor(i/n),x=i%n,co=[P[y][x],P[y][x+1],P[y+1][x+1],P[y+1][x]].map(pt);
    return{d:'M'+co[0].map(f)+seg(hE[y][x])+seg(vE[y][x+1])+seg(hE[y+1][x],1)+seg(vE[y][x],1)+'Z',
      cx:co.reduce((a,q)=>a+q[0],0)/4,cy:co.reduce((a,q)=>a+q[1],0)/4};
  });
  box.textContent='';
  const svg=sv('svg',{viewBox:'-6 -6 '+(Wd+12)+' '+(Ht+12),role:'group','aria-label':'Plateau de jeu'},box);
  const defs=sv('defs',{},svg);
  const glow=sv('filter',{id:'gglow',x:'-20%',y:'-20%',width:'140%',height:'140%'},defs);
  sv('feGaussianBlur',{stdDeviation:'4',result:'b'},glow);
  const fm=sv('feMerge',{},glow);sv('feMergeNode',{in:'b'},fm);sv('feMergeNode',{in:'SourceGraphic'},fm);
  const lg=sv('linearGradient',{id:'gsheen',x1:0,y1:0,x2:0,y2:1},defs);
  sv('stop',{offset:0,'stop-color':'#AFC4FF','stop-opacity':.22},lg);sv('stop',{offset:.45,'stop-color':'#AFC4FF','stop-opacity':0},lg);
  sv('stop',{offset:1,'stop-color':'#03040E','stop-opacity':.25},lg);
  sv('rect',{x:-4,y:-4,width:Wd+8,height:Ht+8,rx:6,fill:'#03040E',stroke:'#9DB8FF','stroke-opacity':.5,'stroke-width':2,filter:'url(#gglow)'},svg);
  const gz=sv('g',{},svg),gsh=sv('rect',{x:0,y:0,width:Wd,height:Ht,fill:'url(#gsheen)','pointer-events':'none'},svg);
  const gan=sv('g',{'pointer-events':'none'},svg),ge=sv('g',{},svg),go=sv('g',{filter:'url(#gglow)'},svg),gt=sv('g',{},svg),gl=sv('g',{},svg);
  const zones=cells.map((c,i)=>{
    const isT=tg.includes(i),z=sv('path',{d:c.d,class:'gz'+(isT?' t':''),'data-i':i},gz);
    if(isT){
      z.setAttribute('tabindex','0');z.setAttribute('role','button');
      const pick=()=>{const o=G.cells[i].owner;G.sel=G.sel===o?null:o;gridRender();const again=GV&&GV.zones[i];if(again)again.focus()};
      z.addEventListener('click',pick);
      z.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}});
      const o=sv('path',{d:c.d,class:'gt'},gt);
      z.addEventListener('focus',()=>o.classList.add('foc'));z.addEventListener('blur',()=>o.classList.remove('foc'));
    }
    return z;
  });
  E.forEach(e=>{e.el=sv('path',{d:e.d,class:'ge'},ge);e.ol=sv('path',{d:e.d,class:'go'},go)});
  GV={svg,zones,cells,E,cellE,gan,gl,gt,Wd,Ht,sx,sy,narrow};
}
// Couleurs, frontières, contours et étiquettes, d'après own(i).
function gpaint(own){
  const V0=GV,foes=G.over||G.draw?[]:gfoes();
  V0.zones.forEach((z,i)=>z.setAttribute('fill',gfill(own(i),foes)));
  V0.E.forEach(e=>{
    const oa=e.a<0?-1:own(e.a),ob=e.b<0?-1:own(e.b);
    e.el.setAttribute('class','ge '+(e.a<0||e.b<0?'bd':oa===ob?'in':'fr'));
    e.ol.classList.toggle('on',!G.over&&!G.draw&&((oa===G.ch)!==(ob===G.ch)||(G.sel!=null&&(oa===G.sel)!==(ob===G.sel))));
  });
  /* Étiquettes : seulement sur la case d'origine de chaque joueur en lice (nom + catégorie d'origine).
     Les catégories des cases conquises disparaissent : un joueur ne peut être attaqué que sur la sienne. */
  V0.gl.textContent='';
  const size={};G.cells.forEach((_,i)=>{size[own(i)]=(size[own(i)]||0)+1});
  const ch=V0.sy,cw=V0.sx,max=cw*.82;
  G.cells.forEach((c,i)=>{
    const o=own(i);
    V0.zones[i].setAttribute('aria-label',G.players[o].name+', '+DATA[G.cells[o].cat].label+(G.players[o].gold?', case d’or':'')+(V0.zones[i].classList.contains('t')?', adversaire possible':''));
    if(o!==i)return;
    const cp=Math.max(11,Math.min(15,ch*.1)),cat=gwrap(DATA[c.cat].label,cp,500,max,2);
    let np=Math.max(13,Math.min(22,ch*.15))*Math.min(1.35,1+.08*(size[o]-1));
    const full=G.players[o].name;while(np>11&&gmeasure(full,np,700)>max)np-=.5;const nm=gfit(full,np,700,max);
    const tot=np*1.15+4+cat.length*cp*1.2;let y=V0.cells[i].cy-tot/2;
    const t=sv('text',{class:'gl','stroke-width':4},V0.gl);
    sv('tspan',{x:f1(V0.cells[i].cx),y:f1(y+np*.9),class:'gn','font-size':f1(np)},t).textContent=nm;y+=np*1.15+4;
    cat.forEach(l=>{sv('tspan',{x:f1(V0.cells[i].cx),y:f1(y+cp*.95),class:'gc','font-size':f1(cp)},t).textContent=l;y+=cp*1.2});
  });
}
const f1=v=>Math.round(v*10)/10;
/* Capture : une vague de la couleur du gagnant part du bord où s'est joué le duel et recouvre les cases
   prises. Son front est organique (rayon modulé par plusieurs sinusoïdes qui ondulent pendant
   l'avancée), découpé aux cases capturées ; puis les frontières intérieures s'effacent.
   Sans animation si « animations réduites ». */
function gblob(ox,oy,r,t,ph){
  // Contour fermé lissé (milieux reliés par des courbes quadratiques) autour de (ox,oy).
  const N=72,pts=[];
  for(let k=0;k<N;k++){
    const a=k/N*Math.PI*2;
    const m=1+.16*Math.sin(3*a+ph[0]+t*2.2)+.09*Math.sin(5*a+ph[1]-t*3.1)+.05*Math.sin(9*a+ph[2]+t*4.7)+.03*Math.sin(14*a+ph[3]-t*6);
    pts.push([ox+Math.cos(a)*r*m,oy+Math.sin(a)*r*m]);
  }
  const mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2],f=v=>Math.round(v*10)/10;
  let d='M'+mid(pts[N-1],pts[0]).map(f);
  for(let k=0;k<N;k++)d+='Q'+pts[k].map(f)+' '+mid(pts[k],pts[(k+1)%N]).map(f);
  return d+'Z';
}
function gcapture(A){
  const V0=GV,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fin=()=>{gAnimT=null;if(GV!==V0)return;V0.gan.textContent='';V0.gt.classList.remove('wait');gpaint(i=>G.cells[i].owner)};
  if(reduce||!A.cells.length)return fin();
  const sh=V0.E.find(e=>(e.a===A.from[0]&&e.b===A.from[1])||(e.a===A.from[1]&&e.b===A.from[0]));
  const ox=sh?(sh.c[0][0]+sh.c[3][0])/2:V0.cells[A.cells[0]].cx,oy=sh?(sh.c[0][1]+sh.c[3][1])/2:V0.cells[A.cells[0]].cy;
  // Mode allégé (TV) : vague case par case, sans clip-path ni flou (js/plateau-lite.js).
  if(LITE)return gcaptureLite(A,V0,ox,oy,G.players[A.to].gold?GC.gold:GC.me,fin);
  // Rayon final : assez grand pour que même le creux le plus profond du front couvre toutes les cases.
  let R=0;A.cells.forEach(i=>{const c=V0.cells[i];for(const dx of[-.5,.5])for(const dy of[-.5,.5])R=Math.max(R,Math.hypot(c.cx+dx*V0.sx-ox,c.cy+dy*V0.sy-oy))});R=R/.67+4;
  const rr=grng(G.seed^(A.cells.length*7919+A.to)),ph=[0,0,0,0].map(()=>rr()*Math.PI*2);
  const cp=sv('clipPath',{id:'gcap'},V0.svg.querySelector('defs'));
  A.cells.forEach(i=>sv('path',{d:V0.cells[i].d},cp));
  const g=sv('g',{'clip-path':'url(#gcap)'},V0.gan),col=G.players[A.to].gold?GC.gold:GC.me;
  const glowB=sv('path',{d:'',fill:'#BFD0FF','fill-opacity':.55,filter:'url(#gglow)'},g);
  const body=sv('path',{d:'',fill:col},g);
  const ring=sv('path',{d:'',fill:'none',stroke:'#EAF0FF','stroke-width':6,filter:'url(#gglow)'},g);
  V0.gt.classList.add('wait');
  const dur=Math.min(1900,950+160*A.cells.length),t0=performance.now();
  snd('capture');
  const step=now=>{
    if(GV!==V0)return;
    const p=Math.max(0,Math.min(1,(now-t0)/dur)),e=(1-Math.cos(Math.PI*p))/2,t=(now-t0)/1000,r=R*e;
    body.setAttribute('d',gblob(ox,oy,r,t,ph));
    glowB.setAttribute('d',gblob(ox,oy,r+Math.min(22,V0.sx*.12),t,ph));
    ring.setAttribute('d',gblob(ox,oy,r,t,ph));const fade=p<.8?1:(1-p)/.2;ring.setAttribute('stroke-opacity',Math.round(fade*100)/100);
    glowB.setAttribute('fill-opacity',Math.round(.6*fade*100)/100);
    if(p<1){gAnimT=requestAnimationFrame(step);return}
    // Les cases prennent leur nouvelle couleur sous la vague, puis la vague disparaît.
    V0.zones.forEach((z,i)=>{if(A.cells.includes(i)){z.style.transition='none';z.setAttribute('fill',col);z.getBoundingClientRect();z.style.transition=''}});
    fin();
  };
  gAnimT=requestAnimationFrame(step);
}
/* ---------- Retourner sur le sol ----------
   Le joueur en cours rend la main : un autre candidat est tiré au sort, en priorité parmi ceux qui
   n'ont pas encore joué. 6 s de clignotement aléatoire (sons tic/tac), puis 2 s de mise en avant
   du candidat tiré (son d'impact), qui devient le joueur en cours. */
function gdrawPool(){
  const alive=G.players.map((_,i)=>i).filter(i=>G.players[i].alive&&i!==G.ch),fresh=alive.filter(i=>!G.played.has(i));
  return{pool:fresh.length?fresh:alive,fresh:fresh.length>0};
}
function gdraw(){
  if(G.draw||G.over||gAnimT)return;
  const{pool,fresh}=gdrawPool();if(!pool.length)return;
  G.players[G.ch].streak=0;G.note='';
  const g0=G,pick=pool[Math.floor(Math.random()*pool.length)],reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  G.draw=true;G.drawFresh=fresh;G.sel=null;gridRender();
  const V0=GV,T=reduce?600:6000,H=2000,t0=performance.now();
  const cellsOf=o=>G.cells.map((c,i)=>c.owner===o?i:-1).filter(i=>i>=0);
  const paint=(o,col)=>cellsOf(o).forEach(i=>{const z=V0.zones[i];z.style.transition='none';z.setAttribute('fill',col)});
  const clear=()=>V0.zones.forEach((z,i)=>{z.style.transition='none';z.setAttribute('fill',G.players[G.cells[i].owner].gold?GC.gold:GC.base)});
  let last=-1,k=0;
  const alive=()=>G===g0&&GV===V0&&G.draw;
  const land=()=>{
    if(!alive())return;
    clear();paint(pick,GC.pick);cellsOf(pick).forEach(i=>V0.zones[i].classList.add('pick'));
    V0.E.forEach(e=>{const a=e.a>=0&&G.cells[e.a].owner===pick,b=e.b>=0&&G.cells[e.b].owner===pick;e.ol.classList.toggle('on',a!==b)});
    $('gtitle').textContent=G.players[pick].name+' prend la main !';
    snd('impact');
    G.drawT=setTimeout(()=>{if(!alive())return;G.draw=false;G.drawT=null;G.ch=pick;G.sel=null;gridRender()},H);
  };
  const step=()=>{
    if(!alive())return;
    const el=performance.now()-t0;if(el>=T||reduce)return land();
    clear();
    const n=pool.length>3&&Math.random()<.35?2:1,lit=[];
    for(let m=0;m<n;m++){
      let o,guard=0;do{o=pool[Math.floor(Math.random()*pool.length)]}while(pool.length>n&&(o===last||lit.includes(o))&&++guard<20);
      lit.push(o);paint(o,GC.flash[Math.floor(Math.random()*GC.flash.length)]);
    }
    last=lit[0];snd(k++%2?'tock':'tick');
    const p=el/T;G.drawT=setTimeout(step,75+185*p*p);
  };
  step();
}
function gbtn(txt,cls,fn){const b=document.createElement('button');b.type='button';b.textContent=txt;if(cls)b.className=cls;b.onclick=fn;return b}
function gridRender(){
  const alive=G.players.filter(p=>p.alive).length,tg=G.over||G.draw?[]:gtargets();
  $('gtitle').textContent=G.over?G.players[G.ch].name+' remporte la partie !':G.draw?'Retour sur le sol…':G.players[G.ch].name+' choisit son adversaire';
  $('ghint').textContent=G.over?'Toutes les cases lui appartiennent.':G.draw?'Tirage au sort parmi les candidats '+(G.drawFresh?'qui n’ont pas encore joué.':'en lice.'):'Territoire de '+G.players[G.ch].name+' : '+(G.players[G.ch].gold?'jaune (case d’or)':'violet')+'. Adversaires possibles : bleu clair.'+G.players.filter((q,i)=>q.alive&&q.gold&&i!==G.ch).map(q=>' En jaune : '+q.name+' (case d’or).').join('');
  if(G.sel==null)G.use.clear();else for(const q of G.use)if(q!==G.ch&&q!==G.sel)G.use.delete(q);
  $('gnote').textContent=G.over?'':G.note;
  if(gAnimT){cancelAnimationFrame(gAnimT);gAnimT=null}
  const A=G.anim;G.anim=null;
  gboardBuild(tg);
  gpaint(A?i=>A.cells.includes(i)?A.old:G.cells[i].owner:i=>G.cells[i].owner);
  if(A)gcapture(A);
  const p=$('gpanel');p.textContent='';
  const sol=()=>gdrawPool().pool.length?gbtn('Retourner sur le sol','alt',gdraw):null;
  if(G.over){
    p.append(gbtn('Nouvelle partie','',backToStart));
  }else if(G.draw){
    const t=document.createElement('p');t.textContent='Tirage au sort d’un candidat…';p.append(t);
  }else if(G.sel!=null){
    const a=G.players[G.ch],d=G.players[G.sel],t=document.createElement('p');
    const dc=DATA[G.cells[G.sel].cat];
    t.textContent=a.name+' défie '+d.name+' en « '+dc.label+' »'+(typeName(dc.type)?' ('+typeName(dc.type).toLowerCase()+')':'')+'.';
    p.append(t);
    // Case d'or : chaque détenteur concerné décide avant le duel s'il l'utilise.
    [G.ch,G.sel].forEach(q=>{
      if(!G.players[q].gold)return;
      const on=G.use.has(q),b=gbtn((on?'★ ':'☆ ')+G.players[q].name+' utilise sa case d’or (+'+GOLD_SEC+' s)','alt',()=>{G.use.has(q)?G.use.delete(q):G.use.add(q);gridRender();const f=[...$('gpanel').querySelectorAll('button')].find(x=>x.dataset.q==q);if(f)f.focus()});
      b.dataset.q=q;b.setAttribute('aria-pressed',on?'true':'false');p.append(b);
    });
    p.append(gbtn('Lancer le duel','',startGridDuel),gbtn('Changer d’adversaire','alt',()=>{G.sel=null;gridRender()}));
  }else{
    const t=document.createElement('p');t.textContent='Choisissez l’adversaire sur le téléphone de l’arbitre (ou touchez une case bleu clair), ou retournez sur le sol pour laisser la main à un autre candidat.';
    p.append(t);
    const me=G.players[G.ch],k=me.streak||0,s=document.createElement('p');
    s.textContent=(me.gold?'★ '+me.name+' détient la case d’or (+'+GOLD_SEC+' s, à utiliser avant un duel). ':'')+
      (k&&!me.gold?'Série : '+k+' victoire'+(k>1?'s':'')+' d’affilée, encore '+(GOLD_STREAK-k)+' pour la case d’or. Retourner sur le sol remet la série à zéro.':'');
    if(s.textContent)p.append(s);
    const b=sol();if(b)p.append(b);
  }
  $('gstat').textContent=alive+' joueur'+(alive>1?'s':'')+' en lice';
  aideBandeau(aideTexteGrille()); // bandeau d'aide (js/aide.js)
  gsSend(); // la régie suit les choix en grille (story 2.8)
}
function startGridDuel(){
  // On attaque un joueur : le duel se joue dans sa catégorie d'origine (celle de sa case de départ).
  const a=G.ch,d=G.sel,cat=DATA[G.cells[d].cat];
  const use=[a,d].filter(q=>G.use.has(q)&&G.players[q].gold);
  const gold=use.map(q=>G.players[q].name).join(' et ');
  G.note='';
  startDuel({names:[G.players[a].name,G.players[d].name],pid:[a,d],src:cat.items,cat:cat.label,type:cat.type,T:G.T,oral:G.oral,
    bonus:[a,d].map(q=>use.includes(q)?GOLD_SEC*1000:0),goldUse:use,
    gold:gold?'★ Case d’or : '+gold+(use.length>1?' commencent':' commence')+' avec +'+GOLD_SEC+' s':''});
}
function gridAfterDuel(){
  const w=S.winP,l=S.loseP,a=G.ch,d=G.sel,cells=[];
  // Bord du duel : une case du défenseur voisine d'une case de l'attaquant (départ de la vague de capture).
  let from=[-1,-1];G.cells.forEach((c,i)=>{if(from[0]<0&&c.owner===d){const j=G.cells.findIndex((e,k)=>e.owner===a&&gadj(G.size,i,k));if(j>=0)from=[i,j]}});
  G.played.add(a);G.played.add(d);
  G.cells.forEach((c,i)=>{if(c.owner===l){c.owner=w;cells.push(i)}});
  G.anim={cells,old:l,to:w,from};
  const earn=goldEarns(w),W=G.players[w];
  S.goldUse.forEach(q=>{G.players[q].gold=false});
  G.players[l].alive=false;G.players[l].gold=false;G.players[l].streak=0;G.ch=w;G.sel=null;G.use.clear();
  G.over=G.players.filter(p=>p.alive).length===1;
  W.streak=(W.streak||0)+1;G.note='';
  if(W.streak>=GOLD_STREAK){W.streak=0;if(earn){W.gold=true;G.note='★ '+W.name+' gagne la case d’or : '+GOLD_STREAK+' victoires d’affilée, +'+GOLD_SEC+' s à utiliser au début d’un prochain duel.'}}
  aideVictoire(w);
  show('grid');gridRender();
  if(earn){const g0=G;setTimeout(()=>{if(G===g0)snd('gold')},900)}
}
$('wback').onclick=()=>{
  if(!S||!S.pid||S.started||S.counting)return;
  S.over=true;push();G.sel=null;show('grid');gridRender();
};
$('gquit').onclick=backToStart;
// Le plateau est dessiné à la largeur réelle de l'écran : on le redessine si elle change, et une fois la police chargée.
{let rt=0,lw=0;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{const w=$('gboard').clientWidth;if(G&&!$('grid').hidden&&!gAnimT&&!G.draw&&w!==lw){lw=w;gridRender()}},150)})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(G&&!$('grid').hidden&&!gAnimT&&!G.draw)gridRender()});
$('f2').onsubmit=e=>{
  e.preventDefault();
  if(!S.started||S.lock||S.over)return;
  const v=$('ans').value;$('ans').value='';
  if(isOk(v,S.cur[1].split('|')))good();
  else{if(v.trim())flash('ko','Non, réessayez');render()}
};
$('pass').onclick=skip;
$('go').onclick=launch;
$('again').onclick=()=>{if(S&&S.pid&&S.over&&G&&S.winP!=null)gridAfterDuel();else backToStart()};

