// Sur le carreau : grille de territoires (état G, case d'or, voisinage, noms des joueurs).
/* ---------- Grille de territoires ----------
   Une case par joueur, chacune avec une catégorie tirée au sort. Le joueur « qui a la main » défie
   le propriétaire d'une case voisine ; le duel se joue dans la catégorie de cette case. Le perdant
   est éliminé, le gagnant prend toutes ses cases et a la main pour le duel suivant. */
let G=null;
/* Case d'or : un joueur qui gagne GOLD_STREAK duels d'affilée (en attaque comme en défense) reçoit la case d'or,
   un bonus de GOLD_SEC secondes qu'il peut ajouter à son chrono au début d'un duel ultérieur (décidé avant le duel).
   Retourner sur le sol remet la série à zéro. Un seul bonus à la fois : une 3e victoire en le détenant déjà est
   sans effet (sauf s'il vient de servir dans ce duel). Le bonus est consommé à la fin du duel où il a servi ; il disparaît avec son détenteur s'il est éliminé. */
const GOLD_STREAK=3,GOLD_SEC=5;
// Le gagnant de ce duel obtiendrait-il la case d'or ? (Pas lors du dernier duel : la partie est finie.)
function goldEarns(w){if(!G||w==null)return false;const p=G.players[w],spent=S&&S.goldUse&&S.goldUse.includes(w);return(!p.gold||spent)&&(p.streak||0)+1>=GOLD_STREAK&&G.players.filter(q=>q.alive).length>2}
const gadj=(size,a,b)=>Math.abs(Math.floor(a/size)-Math.floor(b/size))+Math.abs(a%size-b%size)===1;
// Adversaires possibles : joueurs dont le territoire touche celui du joueur en cours.
function gfoes(){const f=new Set();G.cells.forEach((c,i)=>{if(c.owner!==G.ch&&G.cells.some((d,j)=>d.owner===G.ch&&gadj(G.size,i,j)))f.add(c.owner)});return[...f]}
// Cases cliquables : toutes les cases de ces adversaires (on attaque un joueur, pas une case).
function gtargets(){const f=gfoes();return G.cells.map((_,i)=>i).filter(i=>f.includes(G.cells[i].owner))}
function gnamesRender(){
  const n=(+$('gsize').value)**2,box=$('gnames');
  const old=[...box.querySelectorAll('input')].map(x=>x.value);
  box.textContent='';
  for(let i=0;i<n;i++){
    const l=document.createElement('label'),inp=document.createElement('input');
    l.append('Joueur '+(i+1),inp);inp.maxLength=14;inp.placeholder='Joueur '+(i+1);inp.autocomplete='off';inp.value=old[i]||'';
    box.appendChild(l);
  }
}
