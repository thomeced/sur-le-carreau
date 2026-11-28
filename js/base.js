// Sur le carreau : données (DATA, types, normItem, validation), utilitaires ($, norm, shuffle, show), constantes du duel, état de la régie.
const DATA={};
const $=id=>document.getElementById(id);
/* Mode allégé (TV Samsung : Chromium 94 de Tizen) : navigateur sans color-mix() (arrivé en Chromium 111), ou ?lite=1
   dans l'adresse (tests, dépannage). Il signale un navigateur ancien ou lent : flou des panneaux coupé (classe lite),
   et vague de capture simplifiée (story 2.2). */
/* Mode allégé : navigateur sans color-mix(), ou TV connectée (story 2.6 : la TV Samsung de Ced, Tizen 8.0 et Chromium 120,
   gère color-mix() mais ignore toujours le clip-path qui découpe la vague : elle débordait).
   Story 2.7 : la même TV peut aussi s'annoncer comme un ordinateur (« X11; Linux i686 … SamsungBrowser/7.0 ») : on
   reconnaît donc SamsungBrowser hors téléphone (sans « Mobile »). Et ?lite=1 est mémorisé sur l'appareil (localStorage
   slc-lite) : l'ouvrir une fois suffit, quel que soit le user agent ; ?lite=0 l'empêche et efface ce choix. */
const SLC_TV=/SMART-TV|SmartTV|Tizen|Web0S|webOS|HbbTV|NetCast|BRAVIA/i.test(navigator.userAgent)||
  (/SamsungBrowser/.test(navigator.userAgent)&&!/Mobile/.test(navigator.userAgent));
const LITE_PARAM=/[?&]lite=([01])(&|$)/.exec(location.search),LITE_PARAM_V=LITE_PARAM?LITE_PARAM[1]:null;
const LITE_MEMO=(()=>{try{
  if(LITE_PARAM_V==='1')localStorage.setItem('slc-lite','1');
  if(LITE_PARAM_V==='0')localStorage.removeItem('slc-lite');
  return localStorage.getItem('slc-lite')==='1';
}catch(e){return false}})();
const LITE=LITE_PARAM_V==='0'?false:
  !(window.CSS&&CSS.supports&&CSS.supports('color','color-mix(in srgb, red, blue)'))||SLC_TV||LITE_MEMO;
if(LITE)document.documentElement.classList.add('lite');
/* Types de catégories : « emoji » (par défaut), « trous » (mot à trous), « photo » et « indices ». Chaque élément est
   ramené à [clé unique, "réponse|variante", niveau, {img, thumb} pour une photo, {clues} pour des indices]. Pour un mot à trous,
   ce que voient les joueurs est calculé à chaque tirage (lettres cachées au hasard). */
const TYPES=(window.SLC_PERSO&&SLC_PERSO.TYPES)||{emoji:{nom:'Images',consigne:'Nommez ce que montre l’image.'}};
const typeName=t=>t&&t!=='emoji'&&TYPES[t]?TYPES[t].nom:'';
/* Niveaux de difficulté de 1 à 5, selon le nombre d'éléments déjà joués dans le duel (bonnes réponses et « Passé »,
   des deux joueurs) : les « Passé » font aussi monter, pour qu'un duel atteigne vraiment les niveaux 4 et 5.
   LVL_CURVE = seuils : éléments 1 à 3 → niveau 1 ; 4 à 6 → 2 ; 7 à 10 → 3 ; 11 à 14 → 4 ; 15 et plus → 5.
   Une catégorie qui ne va que jusqu'au niveau 3 reste au niveau 3 (on prend le niveau le plus proche qui a encore des éléments). */
const LVL_MAX=5,LVL_CURVE=[3,6,10,14],LVLS=[1,2,3,4,5];
const niveauPour=n=>Math.min(LVL_MAX,1+LVL_CURVE.filter(s=>n>=s).length); // n = éléments déjà joués
function normItem(type,it){
  if(type==='trous'){
    const w=typeof it==='string'?it:Array.isArray(it)?it[0]:null;
    if(typeof w!=='string'||!w.trim())return null;
    const l=Array.isArray(it)&&LVLS.includes(it[1])?it[1]:window.SLC_PERSO?SLC_PERSO.autoLevel(w):2;
    return['mot:'+w.split('|')[0].trim().toLowerCase(),w,l];
  }
  if(type==='melange'){
    const w=typeof it==='string'?it:Array.isArray(it)?it[0]:null;
    if(typeof w!=='string'||!w.trim())return null;
    const l=Array.isArray(it)&&LVLS.includes(it[1])?it[1]:window.SLC_PERSO?SLC_PERSO.autoLevelMel(w):2;
    return['mel:'+w.split('|')[0].trim().toLowerCase(),w,l];
  }
  if(type==='indices'){
    if(!Array.isArray(it)||typeof it[1]!=='string'||!it[1].trim())return null;
    const P=window.SLC_PERSO,mx=P?P.IND_MAX:5,mn=P?P.IND_MIN:2;
    const clues=(Array.isArray(it[0])?it[0]:typeof it[0]==='string'?it[0].split('|'):[]).filter(c=>typeof c==='string').map(c=>c.replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,mx);
    if(clues.length<mn)return null;
    const l=LVLS.includes(it[2])?it[2]:P?P.autoLevelInd(clues.length):2;
    return['ind:'+it[1].split('|')[0].trim().toLowerCase(),it[1],l,{clues}];
  }
  if(!Array.isArray(it)||typeof it[0]!=='string'||!it[0]||typeof it[1]!=='string'||!it[1].trim())return null;
  if(type==='envers')return['env:'+it[0].trim(),it[1],LVLS.includes(it[2])?it[2]:3,{env:it[0].trim()}];
  if(type==='photo')return['photo:'+it[0],it[1],LVLS.includes(it[2])?it[2]:1,{img:it[0],thumb:typeof it[3]==='string'?it[3]:it[0]}];
  return LVLS.includes(it[2])?[it[0],it[1],it[2]]:null;
}
function addCats(src){
  if(src&&typeof src==='object')for(const [k,v] of Object.entries(src)){
    const type=(v&&v.type)||'emoji';
    if(!v||typeof v.label!=='string'||!Array.isArray(v.items)||!TYPES[type]){console.warn('Catégorie ignorée :',k);continue}
    const items=[],seen=new Set();
    v.items.forEach((raw,n)=>{
      const it=normItem(type,raw);
      if(!it){console.warn('Élément ignoré dans « '+k+' » (n° '+(n+1)+') :',raw);return}
      if(seen.has(it[0])){console.warn('Doublon ignoré dans « '+k+' » :',it[0]);return}
      seen.add(it[0]);items.push(it);
    });
    if(items.length)DATA[k]={label:v.label,type,items,perso:!!v.perso};else console.warn('Catégorie vide ignorée :',k);
  }
}
addCats(typeof CATEGORIES==='undefined'?null:CATEGORIES);
addCats(typeof CATEGORIES_PHOTOS==='undefined'?null:CATEGORIES_PHOTOS); // photos Wikimedia Commons (photos.js)

const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\b(le|la|les|l|un|une|des|du|de|d)\b/g,' ').replace(/\s+/g,' ').trim();
function lev(a,b){const m=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=m[0];m[0]=i;for(let j=1;j<=b.length;j++){const t=m[j];m[j]=Math.min(m[j]+1,m[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return m[b.length]}
function isOk(v,list){v=norm(v);if(!v)return false;return list.some(r=>{r=norm(r);if(v===r)return true;const t=r.length>=9?2:r.length>=5?1:0;return t>0&&lev(v,r)<=t})}
// Domaine d'une catégorie (story 4.1) : DOM_CAT de categories.js, sinon « autre » (catégories perso comprises).
const domaineDe=k=>{const d=typeof DOM_CAT!=='undefined'&&Object.prototype.hasOwnProperty.call(DOM_CAT,k)?DOM_CAT[k]:null;return d&&typeof DOMAINES!=='undefined'&&DOMAINES[d]?d:'autre'};
const hasCat=k=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(DATA,k);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// La fin de duel (#end) s'affiche dans le grand écran du duel (story 5.2) : #game reste visible.
function show(id){['home','setup','game','grid','end','arb'].forEach(x=>$(x).hidden=x!==id&&!(id==='end'&&x==='game'))}

// Temps de chaque joueur pour un duel (secondes). Le détenteur de la case d'or peut y ajouter GOLD_SEC.
const DUEL_SEC=40;
let S,flashT;
const CH='ABCDEFGHJKMNPQRSTUVWXYZ23456789',isArb=location.hash.startsWith('#arbitre');
// Lien du QR code : #arbitre=CODE ouvre la page arbitre et rejoint le duel directement.
let GS=null; // régie : dernier état reçu de l'écran du jeu
const ARB_CODE=isArb?(location.hash.split('=')[1]||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4):'';
