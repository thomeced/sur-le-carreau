/* Catégories personnelles de « Sur le carreau » (créées avec editeur.html).
 *
 * Partagé par le jeu (index.html) et l'éditeur (editeur.html) :
 * - les types de jeu (emoji, mot à trous, photos) et la consigne que l'arbitre annonce ;
 * - le « mot à trous » : lettres cachées au hasard (plus le niveau monte, plus il y en a), affichage en tuiles ;
 * - l'enregistrement dans le navigateur : catégories dans localStorage (clé « slc-perso »),
 *   photos dans IndexedDB (base « slc-perso », magasin « photos »). Tout reste sur cet appareil,
 *   sauf à passer par la sauvegarde en fichier (exportData / importData).
 */
(function(){
  const TYPES={
    emoji:{nom:'Images',icone:'🖼️',consigne:'Nommez ce que montre l’image.'},
    trous:{nom:'Mot à trous',icone:'🔤',consigne:'Retrouvez le mot complet : certaines lettres sont cachées.'},
    photo:{nom:'Photos',icone:'📷',consigne:'Nommez ce que montre la photo.'}
  };
  const MIN=5; // nombre minimal d'éléments pour qu'une catégorie perso apparaisse dans le jeu
  const isL=c=>/\p{L}/u.test(c);
  const first=a=>String(a).split('|')[0].trim();
  const letters=w=>[...first(w)].filter(isL).length;
  // Niveau automatique d'un mot à trous, d'après sa longueur.
  const autoLevel=w=>{const n=letters(w);return n<=5?1:n<=8?2:3};
  /* Cache une partie des lettres : environ 1/3 au niveau 1 (jamais la première lettre), 1/2 au niveau 2,
     près de 2/3 au niveau 3. Au moins une lettre cachée, au moins une visible. « _ » = lettre cachée. */
  function masque(w,lvl){
    const ch=[...first(w).toUpperCase()],idx=ch.map((c,i)=>isL(c)?i:-1).filter(i=>i>=0),n=idx.length;
    if(n<2)return ch.join('');
    const r=[0,.34,.5,.62][lvl]||.5;
    let cand=lvl===1?idx.slice(1):idx.slice();
    let h=Math.max(1,Math.min(n-1,Math.round(n*r),cand.length));
    for(let i=cand.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cand[i],cand[j]]=[cand[j],cand[i]]}
    cand.slice(0,h).forEach(i=>ch[i]='_');
    return ch.join('');
  }
  // Affiche un mot masqué en tuiles, à une taille qui tient dans la largeur de l'élément.
  function renderMot(el,disp){
    el.textContent='';
    const box=document.createElement('div');box.className='slcm';
    const words=String(disp).split(/\s+/).filter(Boolean),L=Math.max(1,...words.map(w=>[...w].length));
    const W=el.clientWidth||320;
    box.style.fontSize=Math.max(14,Math.min(46,Math.floor(W*.88/(L*1.22))))+'px';
    words.forEach(w=>{
      const g=document.createElement('span');g.className='slcm-w';
      [...w].forEach(c=>{
        const s=document.createElement('span');
        if(c==='_'){s.className='slcm-l h'}else if(isL(c)||/\d/.test(c)){s.className='slcm-l';s.textContent=c}else{s.className='slcm-p';s.textContent=c}
        g.appendChild(s);
      });
      box.appendChild(g);
    });
    box.setAttribute('aria-label',disp.replace(/_/g,' trou ').replace(/\s+/g,' '));
    el.appendChild(box);
  }
  (function css(){
    const st=document.createElement('style');
    st.textContent='.slcm{display:flex;flex-wrap:wrap;justify-content:center;gap:.25em .7em;padding:.35em .3em;line-height:1;font-family:Poppins,"DM Sans",system-ui,sans-serif}'+
      '.slcm-w{display:inline-flex;gap:.12em;white-space:nowrap}'+
      '.slcm-l{display:inline-flex;align-items:center;justify-content:center;width:1.05em;height:1.3em;border-radius:.12em;background:rgba(255,255,255,.14);border:.07em solid rgba(157,184,255,.75);color:#F4F6FF;font-weight:700}'+
      '.slcm-l.h{background:rgba(3,4,14,.55);border-style:dashed;border-color:#FFC53D}'+
      '.slcm-p{display:inline-flex;align-items:center;font-weight:700;color:#F4F6FF}';
    (document.head||document.documentElement).appendChild(st);
  })();

  // ---------- Enregistrement ----------
  const KEY='slc-perso';
  const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  function list(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');return d&&Array.isArray(d.cats)?d.cats:[]}catch(e){return[]}}
  function save(cats){localStorage.setItem(KEY,JSON.stringify({v:1,cats}))}
  let dbP=null;
  function db(){
    if(dbP)return dbP;
    return dbP=new Promise((ok,ko)=>{
      if(!window.indexedDB)return ko(new Error('IndexedDB indisponible'));
      const r=indexedDB.open('slc-perso',1);
      r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});
      r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error);
    });
  }
  const tx=(mode,fn)=>db().then(d=>new Promise((ok,ko)=>{const t=d.transaction('photos',mode),s=t.objectStore('photos'),r=fn(s);t.oncomplete=()=>ok(r&&r.result);t.onerror=()=>ko(t.error)}));
  const putPhoto=rec=>tx('readwrite',s=>s.put(rec));
  const getPhoto=id=>tx('readonly',s=>s.get(id));
  const delPhoto=id=>tx('readwrite',s=>s.delete(id));
  const allPhotos=()=>tx('readonly',s=>s.getAll()).then(a=>a||[]);
  function persist(){try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}}

  // Réduit une photo (900 px pour le jeu, 200 px pour la vignette envoyée à l'arbitre).
  async function prepPhoto(file){
    let src,w,h,url=null;
    try{src=await createImageBitmap(file,{imageOrientation:'from-image'});w=src.width;h=src.height}
    catch(e){
      url=URL.createObjectURL(file);
      src=await new Promise((ok,ko)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>ko(new Error('image illisible'));im.src=url});
      w=src.naturalWidth;h=src.naturalHeight;
    }
    const draw=max=>{const k=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);
      const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(src,0,0,c.width,c.height);return c};
    const big=draw(900),blob=await new Promise(ok=>big.toBlob(ok,'image/jpeg',.82)),thumb=draw(200).toDataURL('image/jpeg',.6);
    if(url)URL.revokeObjectURL(url);if(src.close)src.close();
    return{blob,thumb};
  }

  /* Catégories perso au format de categories.js, pour le jeu : { clé: {label, type, items} }.
     Mots à trous : ["mot", niveau] ; photos : [adresse de l'image, "réponse", niveau, vignette].
     Seules les catégories d'au moins MIN éléments sont renvoyées. */
  async function load(){
    const cats=list(),out={};let photos={};
    if(cats.some(c=>c.type==='photo')){try{(await allPhotos()).forEach(p=>photos[p.id]=p)}catch(e){console.warn('Photos indisponibles :',e)}}
    for(const c of cats){
      let items=[];
      if(c.type==='trous')items=(c.items||[]).filter(it=>it&&it.a).map(it=>[it.a,it.l||autoLevel(it.a)]);
      else if(c.type==='photo')items=(c.items||[]).filter(it=>it&&it.a&&photos[it.id]).map(it=>[URL.createObjectURL(photos[it.id].blob),it.a,it.l||1,photos[it.id].thumb]);
      if(items.length>=MIN)out['perso_'+c.id]={label:c.label||'Ma catégorie',type:c.type,items,perso:true};
    }
    return out;
  }

  // Sauvegarde / restauration en fichier (pour changer d'appareil ou garder une copie).
  const toData=b=>new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(b)});
  async function exportData(){
    const cats=list(),ph={},ids=new Set();
    cats.forEach(c=>c.type==='photo'&&(c.items||[]).forEach(it=>ids.add(it.id)));
    if(ids.size)for(const p of await allPhotos())if(ids.has(p.id))ph[p.id]={img:await toData(p.blob),thumb:p.thumb};
    return{app:'sur-le-carreau',v:1,date:new Date().toISOString(),cats,photos:ph};
  }
  async function importData(d){
    if(!d||d.app!=='sur-le-carreau'||!Array.isArray(d.cats))throw new Error('Ce fichier n’est pas une sauvegarde de Sur le carreau.');
    for(const [id,p] of Object.entries(d.photos||{})){
      if(!p||typeof p.img!=='string')continue;
      const blob=await (await fetch(p.img)).blob();await putPhoto({id,blob,thumb:p.thumb||p.img});
    }
    const cur=list(),byId=new Map(cur.map(c=>[c.id,c]));let n=0;
    d.cats.forEach(c=>{if(c&&c.id&&TYPES[c.type]&&Array.isArray(c.items)){byId.set(c.id,c);n++}});
    save([...byId.values()]);
    return n;
  }

  window.SLC_PERSO={TYPES,MIN,autoLevel,masque,renderMot,letters,list,save,newId,putPhoto,getPhoto,delPhoto,allPhotos,prepPhoto,persist,load,exportData,importData};
})();
