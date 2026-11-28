// Sur le carreau : aide à la prise en main : textes (AIDE_TXT, une seule source) et cartes « Comment jouer » de la préparation.
/* Chargé juste avant main.js : les textes reprennent les constantes du jeu (DUEL_SEC, GOLD_STREAK, GOLD_SEC). */
const AIDE_TXT={
  // Cartes « Comment jouer » (spec UX §3.1). grille : seulement en mode grille de territoires.
  cartes:[
    {pic:'duel',titre:'Le duel',texte:'Deux joueurs, une catégorie. On répond à voix haute.'},
    {pic:'chronos',titre:'Les chronos',texte:'Chacun a '+DUEL_SEC+' s. Seul le chrono de celui qui a la main tourne. Bonne réponse : la main passe.'},
    {pic:'passe',titre:'Passé',texte:'Bloqué ? Dites « Passé » : la réponse s’affiche, et vous perdez 3 s.'},
    {pic:'territoire',titre:'Le territoire',texte:'Le gagnant prend toutes les cases du perdant, puis attaque un voisin ou retourne sur le sol.',grille:true},
    {pic:'or',titre:'La case d’or',texte:GOLD_STREAK+' duels gagnés d’affilée : +'+GOLD_SEC+' s à utiliser plus tard.',grille:true}
  ],
  // Guide de l'arbitre, sur le téléphone (spec UX §3.7). mini : boutons réels en miniature.
  // « Mauvaise réponse (QCM seulement) » s'ajoutera à la page « Jugez » avec le QCM (story 3.2).
  guide:[
    {titre:'Vous êtes l’arbitre',texte:'Les joueurs répondent à voix haute ; c’est vous qui décidez.'},
    {titre:'Configurez',texte:'Choisissez le mode, les joueurs et les catégories, puis lancez la partie. En grille, vous choisissez aussi les duels.'},
    {titre:'Jugez',texte:'Pendant un duel, touchez le bouton qui correspond à la réponse du joueur :',mini:true}
  ],
  // Bandeau du plateau (spec UX §3.2). {n} : nom(s) du joueur, affiché en gras.
  bandeau:{
    choix:'{n} choisit qui attaquer (case surlignée).',
    defie:'{n} défie {d} en « {c} ».',
    or:'{n} peut utiliser sa case d’or : +'+GOLD_SEC+' s.',
    or2:'{n} peuvent utiliser leur case d’or : +'+GOLD_SEC+' s.',
    victoire:'{n} gagne le duel : défier un voisin ou retourner sur le sol ?',
    tirage:'Retour sur le sol : un nouvel attaquant est tiré au sort…',
    fin:'{n} a conquis tout le sol !'
  }
};

/* Pictogrammes des cartes : SVG simples (viewBox 0 0 160 100), couleurs de la charte : violet du joueur en cours,
   bleus du plateau, jaune de la case d'or. Décoratifs : le titre et la phrase portent l'information. */
const AIDE_PIC={
  duel:'<circle cx="45" cy="34" r="14" fill="#7A3FD8"/><path d="M21 82a24 24 0 0 1 48 0z" fill="#7A3FD8"/>'+
    '<circle cx="115" cy="34" r="14" fill="#3D78EA"/><path d="M91 82a24 24 0 0 1 48 0z" fill="#3D78EA"/>'+
    '<path d="M64 8h32a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H84l-8 8v-8H64a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z" fill="#F4F6FF"/>'+
    '<circle cx="70" cy="21" r="3" fill="#03040E"/><circle cx="80" cy="21" r="3" fill="#03040E"/><circle cx="90" cy="21" r="3" fill="#03040E"/>',
  chronos:'<circle cx="45" cy="54" r="34" fill="none" stroke="#FFC53D" stroke-width="7"/><path d="M45 54V30M45 54l14 10" stroke="#FFC53D" stroke-width="6" stroke-linecap="round"/>'+
    '<circle cx="115" cy="54" r="34" fill="none" stroke="#F4F6FF" stroke-opacity=".35" stroke-width="7"/><path d="M115 54V30" stroke="#F4F6FF" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>'+
    '<rect x="37" y="8" width="16" height="8" rx="2" fill="#FFC53D"/><rect x="107" y="8" width="16" height="8" rx="2" fill="#F4F6FF" fill-opacity=".35"/>',
  passe:'<path d="M18 22l34 28-34 28zM56 22l34 28-34 28z" fill="#F4F6FF"/><rect x="94" y="22" width="9" height="56" rx="2" fill="#F4F6FF"/>'+
    '<text x="134" y="60" text-anchor="middle" font-size="26" font-weight="700" fill="#FF6B6B" font-family="Poppins,DM Sans,sans-serif">−3 s</text>',
  territoire:(()=>{let s='';const own=[1,1,0,1,1,0,2,2,0];for(let i=0;i<9;i++){const x=24+(i%3)*32,y=4+Math.floor(i/3)*32;
    s+='<rect x="'+x+'" y="'+y+'" width="30" height="30" rx="3" fill="'+['#1B3DB0','#7A3FD8','#6A9CFF'][own[i]]+'"/>'}
    return s+'<path d="M137 52h18m0 0l-8-8m8 8l-8 8" stroke="#F4F6FF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'})(),
  or:'<rect x="44" y="14" width="72" height="72" rx="6" fill="#D9A21B"/>'+
    '<path d="M80 26l9.4 19 21 3-15.2 14.8 3.6 20.9L80 74l-18.8 9.9 3.6-20.9L49.6 48l21-3z" fill="#F2C44E" stroke="#FFF2C4" stroke-width="3" stroke-linejoin="round"/>'
};

/* Carrousel des cartes, dans le panneau « Partie en préparation » de l'accueil (#hprep).
   aideCartes(mode) le démarre ou le laisse tourner (appelé à chaque rafraîchissement de l'accueil, donc sans
   effet s'il tourne déjà dans ce mode) ; aideCartesStop() l'arrête et ne laisse aucune minuterie. */
const AIDE={mode:null,i:0,t:0,f:0,gagne:null};
let AIDE_MODE='grid'; // mode choisi sur la régie pendant la configuration (message hi), grille à défaut
const aideReduit=()=>!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const aideListe=mode=>AIDE_TXT.cartes.filter(c=>mode==='grid'||!c.grille);
function aideCartePeindre(){
  const L=aideListe(AIDE.mode),c=L[AIDE.i];
  $('hcpic').innerHTML='<svg viewBox="0 0 160 100" aria-hidden="true" focusable="false">'+AIDE_PIC[c.pic]+'</svg>';
  $('hct').textContent=c.titre;$('hcp').textContent=c.texte;
  $('hcards').setAttribute('aria-label','Comment jouer : carte '+(AIDE.i+1)+' sur '+L.length);
  const dots=$('hcdots');
  if(dots.children.length!==L.length)dots.innerHTML=L.map(()=>'<li></li>').join('');
  [...dots.children].forEach((d,k)=>d.className=k===AIDE.i?'on':'');
}
function aidePlanifier(){
  clearTimeout(AIDE.t);
  AIDE.t=setTimeout(()=>{
    const n=aideListe(AIDE.mode).length;
    if(aideReduit()){AIDE.i=(AIDE.i+1)%n;aideCartePeindre();return aidePlanifier()}
    // Fondu enchaîné : la carte s'efface, change, puis réapparaît.
    $('hcard').classList.add('out');
    AIDE.f=setTimeout(()=>{AIDE.i=(AIDE.i+1)%n;aideCartePeindre();$('hcard').classList.remove('out');aidePlanifier()},450);
  },aideReduit()?9000:6000);
}
function aideCartes(mode){
  if(mode!=='duel')mode='grid';
  if(AIDE.mode===mode)return;
  aideCartesStop();
  AIDE.mode=mode;AIDE.i=0;
  $('hprep').classList.add('cartes');$('hcards').hidden=false;$('hcard').classList.remove('out');
  aideCartePeindre();aidePlanifier();
}
function aideCartesStop(){
  clearTimeout(AIDE.t);clearTimeout(AIDE.f);AIDE.t=AIDE.f=0;AIDE.mode=null;
  $('hprep').classList.remove('cartes');$('hcards').hidden=true;
}
// Mode choisi sur la régie (reçu avec son message de présence) : les cartes s'adaptent tout de suite.
function aideModeRegie(m){
  if(m!=='grid'&&m!=='duel'||m===AIDE_MODE)return;
  AIDE_MODE=m;if(AIDE.mode)aideCartes(m);
}

/* Bandeau d'aide du plateau (#gaide, un seul nœud aria-live) : une phrase par étape de la grille.
   aideBandeau(t) n'agit que si la phrase change (gridRender est appelé souvent) ; fondu court, aucun en mouvement réduit. */
const BANDEAU={t:null,f:0};
// Vainqueur du dernier duel, pour la phrase « gagne le duel » (gardée tant qu'il n'a pas choisi la suite).
function aideVictoire(w){AIDE.gagne={g:G,w}}
function aideTexteGrille(){
  const B=AIDE_TXT.bandeau,nom=i=>G.players[i].name;
  if(G.over)return[B.fin,nom(G.ch)];
  if(G.draw)return[B.tirage,''];
  if(G.sel!=null){
    if(AIDE.gagne)AIDE.gagne=null;
    const or=[G.ch,G.sel].filter(q=>G.players[q].gold).map(nom);
    if(or.length)return[or.length>1?B.or2:B.or,or.join(' et ')];
    return[B.defie.replace('{d}',nom(G.sel)).replace('{c}',DATA[G.cells[G.sel].cat].label),nom(G.ch)];
  }
  if(AIDE.gagne&&AIDE.gagne.g===G&&AIDE.gagne.w===G.ch)return[B.victoire,nom(G.ch)];
  return[B.choix,nom(G.ch)];
}
function aideBandeau([modele,n]){
  const k=modele+'|'+n;if(k===BANDEAU.t)return;BANDEAU.t=k;
  const el=$('gaide'),peindre=()=>{
    el.textContent='';
    modele.split('{n}').forEach((part,i)=>{if(i){const b=document.createElement('strong');b.textContent=n;el.append(b)}if(part)el.append(part)});
    el.classList.remove('out');
  };
  clearTimeout(BANDEAU.f);
  if(aideReduit()||!el.textContent)return peindre();
  el.classList.add('out');BANDEAU.f=setTimeout(peindre,180);
}

/* Guide de l'arbitre (#rguide, téléphone) : 3 pages par-dessus la régie, qui continue de tourner dessous
   (arbRender ne touche pas au guide). guideArbitre(false) : seulement si ce téléphone ne l'a jamais vu ou passé
   (localStorage slc-guide-vu) ; guideArbitre(true) : bouton « ? ». */
const GUIDE={i:0,ouvert:false,retour:null};
function guideVu(){try{return localStorage.getItem('slc-guide-vu')==='1'}catch(e){return false}}
function guidePage(i){
  const P=AIDE_TXT.guide,n=P.length;GUIDE.i=Math.max(0,Math.min(n-1,i));
  const p=P[GUIDE.i];
  $('rgt').textContent=p.titre;$('rgp').textContent=p.texte;$('rgmini').hidden=!p.mini;
  $('rguide').setAttribute('aria-label','Guide de l’arbitre, page '+(GUIDE.i+1)+' sur '+n);
  [...$('rgdots').children].forEach((d,k)=>d.className=k===GUIDE.i?'on':'');
  $('rgprev').hidden=GUIDE.i===0;
  $('rgnext').textContent=GUIDE.i===n-1?'C’est parti':'Suivant';
  $('rgt').focus();
}
function guideArbitre(force){
  if(GUIDE.ouvert||(!force&&guideVu()))return;
  GUIDE.ouvert=true;GUIDE.retour=force?$('rhelp'):null;$('rgst').textContent='';
  $('rguide').hidden=false;document.documentElement.classList.add('slc-guide');
  guidePage(0);
}
function guideFermer(msg){
  if(!GUIDE.ouvert)return;
  GUIDE.ouvert=false;try{localStorage.setItem('slc-guide-vu','1')}catch(e){}
  $('rguide').hidden=true;document.documentElement.classList.remove('slc-guide');
  $('rgst').textContent=msg;
  const r=GUIDE.retour&&!GUIDE.retour.hidden?GUIDE.retour:$('rhelp');r.focus();
}
$('rhelp').onclick=()=>guideArbitre(true);
$('rgskip').onclick=()=>guideFermer('Guide fermé.');
$('rgprev').onclick=()=>guidePage(GUIDE.i-1);
$('rgnext').onclick=()=>GUIDE.i===AIDE_TXT.guide.length-1?guideFermer('Guide terminé.'):guidePage(GUIDE.i+1);
// Glisser à gauche ou à droite pour changer de page ; flèches et Échap au clavier.
(()=>{let x0=null,y0=0;const g=$('rguide');
  g.addEventListener('touchstart',e=>{const t=e.changedTouches[0];x0=t.clientX;y0=t.clientY},{passive:true});
  g.addEventListener('touchend',e=>{if(x0==null)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))guidePage(GUIDE.i+(dx<0?1:-1))});
  g.addEventListener('keydown',e=>{if(e.key==='Escape')guideFermer('Guide fermé.');else if(e.key==='ArrowRight')guidePage(GUIDE.i+1);else if(e.key==='ArrowLeft')guidePage(GUIDE.i-1)});
})();
