// Sur le carreau : liaison entre l'écran du jeu et la régie (claude.ai room, PeerJS, BroadcastChannel), link() et LTOPICS.
let peerLib;
function loadPeer(){
  if(window.Peer)return Promise.resolve();
  return peerLib||(peerLib=new Promise((ok,ko)=>{const el=document.createElement('script');el.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';el.onload=ok;el.onerror=()=>ko(new Error('peerjs'));document.head.appendChild(el)}));
}
const rnd=()=>Math.random().toString(36).slice(2);
/* Liaison jeu <-> arbitre. Trois chemins, essayés dans l'ordre :
   1. claude.ai : capacité "room" (aucun service externe) ;
   2. ailleurs (GitHub Pages…) : PeerJS, connexion directe entre appareils ;
   3. à défaut : BroadcastChannel (onglets du même navigateur seulement).
   onstat(mode,état) sert à afficher l'état de la liaison. */
/* Serveurs STUN/TURN : le TURN relaie la connexion quand deux appareils sont sur des réseaux
   différents (wifi + 4G/5G). Services publics gratuits, sans garantie : à remplacer par un TURN à soi si besoin. */
const ICE=[
  {urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:global.stun.twilio.com:3478']},
  {urls:'turn:eu-0.turn.peerjs.com:3478',username:'peerjs',credential:'peerjsp'},
  {urls:'turn:us-0.turn.peerjs.com:3478',username:'peerjs',credential:'peerjsp'},
  {urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp','turns:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}
];
/* Messages : st (état du duel, écran → régie), act (verdict, régie → écran), hi (présence de la régie),
   gs (état de l'écran : étape, catégories perso…, écran → régie), cfg (configuration, régie → écran),
   cfgr (réponse à cfg, écran → régie), cmd (commande : go, new, quit, prep ; régie → écran). */
const LTOPICS=['st','act','hi','gs','cfg','cfgr','cmd'];
async function link(code,role,onmsg,onstat){
  let bc=null;try{if(typeof BroadcastChannel==='function')bc=new BroadcastChannel('slc-'+code)}catch(e){bc=null}
  const seen=new Set();
  const hear=(topic,d)=>{if(!d||d.role===role||seen.has(d.id))return;seen.add(d.id);onmsg(topic,d)};
  if(bc)bc.onmessage=e=>hear(e.data.topic,e.data.d);
  let room=null,peer=null,conns=[],mode='local',missing=false;
  const stat=st=>{try{if(onstat)onstat(mode,st)}catch(e){}};
  try{const r=window.claude&&await claude.use('room');if(r){room=await r.join('slc-'+code.toLowerCase());LTOPICS.forEach(t=>room.on(t,m=>hear(t,m.data),()=>{}));mode='claude'}}catch(e){room=null}
  if(room)stat('ok');
  else{
    try{
      await loadPeer();
      const id='slc-'+code.toLowerCase();
      peer=await new Promise((ok,ko)=>{
        const p=new Peer(role==='game'?id:undefined,window.SLC_PEER_OPTS||{debug:0,config:{iceServers:ICE,iceCandidatePoolSize:4}});
        const to=setTimeout(()=>ko({type:'timeout'}),10000);
        p.on('open',()=>{clearTimeout(to);ok(p)});
        p.on('error',e=>{clearTimeout(to);ko(e)});
      });
      mode='peer';
      peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
      peer.on('error',e=>{if(e&&e.type==='peer-unavailable'){missing=true;stat('search')}else stat('down')});
      const wire=c=>{
        c.on('data',m=>{if(m)hear(m.topic,m.d)});
        c.on('error',()=>{});
      };
      if(role==='game'){
        stat('wait');
        peer.on('connection',c=>{
          wire(c);
          c.on('open',()=>{conns.push(c);stat('ok')});
          c.on('close',()=>{conns=conns.filter(x=>x!==c);stat(conns.length?'ok':'wait')});
        });
      }else{
        stat('search');
        let conn=null,t0=0,tries=0;
        const attempt=()=>{
          if(conn&&conn.open)return;
          if(conn&&Date.now()-t0<8000)return;
          if(conn){try{conn.close()}catch(e){}}
          const c=conn=peer.connect(id,{reliable:true,serialization:'json'});t0=Date.now();missing=false;if(++tries>=4&&!missing)setTimeout(()=>{if(!missing&&!(conn&&conn.open))stat('blocked')},4000);
          wire(c);
          c.on('open',()=>{conns=[c];tries=0;stat('ok');c.send({topic:'hi',d:{role,id:rnd()}})});
          c.on('close',()=>{if(conn===c){conns=[];stat('search')}});
        };
        attempt();setInterval(attempt,2000);
      }
    }catch(e){
      if(peer){try{peer.destroy()}catch(_){}}
      if(role==='game'&&e&&e.type==='unavailable-id'){if(bc)bc.close();return{taken:true,send(){}}}
      peer=null;mode='local';stat('local');
    }
  }
  return{send(topic,d){
    d={...d,role,id:rnd()};
    if(bc)bc.postMessage({topic,d});
    if(room)room.emit(topic,d).catch(()=>{});
    for(const c of conns)if(c.open)try{c.send({topic,d})}catch(e){}
  },close(){try{if(bc)bc.close()}catch(e){}try{if(room)room.leave()}catch(e){}try{if(peer)peer.destroy()}catch(e){}conns=[]}}
}
const linkMsg=(mode,st)=>{
  if(mode==='claude')return'Liaison entre appareils : active';
  if(mode==='peer')return{ok:'Liaison entre appareils : active',wait:'Liaison entre appareils : prête, en attente de l’arbitre',search:'Liaison entre appareils : recherche du duel… vérifiez le code',down:'Liaison entre appareils : interrompue, nouvelle tentative…',blocked:'Jeu trouvé, mais la connexion directe n’aboutit pas (réseau bloquant) : essayez le même wifi pour les deux appareils'}[st]||'Liaison entre appareils : connexion…';
  return'Liaison entre appareils : indisponible (seuls les onglets du même navigateur se voient)';
};
