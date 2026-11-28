/* Utilitaire commun des tests (pas un test à lui seul).
   Sert le dépôt avec `python3 -m http.server` sur un port libre, ouvre Chromium avec Playwright,
   collecte les erreurs JavaScript et les console.error de chaque page, et arrête tout à la fin.
   Playwright n'est pas installé dans le dépôt : il est pris dans l'environnement (NODE_PATH global). */
const {spawn}=require('child_process');
const net=require('net');
const http=require('http');
const path=require('path');
const {chromium}=require('playwright');

const RACINE=path.resolve(__dirname,'..');

// Port libre : on ouvre un serveur sur le port 0, on lit le port attribué, on le referme.
function portLibre(){
  return new Promise((ok,ko)=>{
    const s=net.createServer();s.unref();s.on('error',ko);
    s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>ok(p))});
  });
}

// Attend que le serveur réponde (python met un court instant à démarrer).
function attendreServeur(url,ms=10000){
  const t0=Date.now();
  return new Promise((ok,ko)=>{
    const essai=()=>http.get(url,r=>{r.resume();ok()}).on('error',()=>{
      if(Date.now()-t0>ms)return ko(new Error('Le serveur local ne répond pas : '+url));
      setTimeout(essai,100);
    });
    essai();
  });
}

/* Démarre le serveur et le navigateur. Renvoie {url, navigateur, page(), erreurs, verifier(), fermer()}.
   - page(nom, options) : nouvel onglet dans le même contexte (les onglets se parlent par BroadcastChannel) ;
     ses erreurs sont collectées, préfixées par `nom`.
   - verifier() : lève une erreur qui liste toutes les erreurs collectées, s'il y en a. */
async function demarrer({largeur=1440,hauteur=900}={}){
  const port=await portLibre();
  const serveur=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:RACINE,stdio:'ignore'});
  const url='http://127.0.0.1:'+port+'/';
  const erreurs=[];
  const requetes=[]; // adresses demandées au serveur local (pour vérifier la version des fichiers)
  let navigateur=null;
  const fermer=async()=>{
    try{if(navigateur)await navigateur.close()}catch(e){}
    serveur.kill();
  };
  try{
    await attendreServeur(url);
    navigateur=await chromium.launch();
  }catch(e){await fermer();throw e}
  const contexte=await navigateur.newContext({viewport:{width:largeur,height:hauteur}});
  /* Tests hors ligne : toute requête hors du serveur local (PeerJS sur jsDelivr, Google Fonts) reçoit une réponse
     vide. PeerJS n'étant pas chargé, la liaison passe par BroadcastChannel entre onglets, comme prévu pour les tests ;
     et un réseau absent ou filtré ne produit pas d'erreur de console. */
  await contexte.route(u=>!u.href.startsWith(url),r=>r.fulfill({status:200,body:''}));
  contexte.on('request',r=>{if(r.url().startsWith(url))requetes.push(r.url().slice(url.length))});
  const page=async(nom)=>{
    const p=await contexte.newPage();
    p.on('pageerror',e=>erreurs.push('['+nom+'] erreur JavaScript : '+(e.stack||e.message)));
    p.on('console',m=>{if(m.type()==='error')erreurs.push('['+nom+'] console.error : '+m.text())});
    return p;
  };
  const verifier=()=>{
    if(erreurs.length)throw new Error(erreurs.length+' erreur(s) dans les pages :\n'+erreurs.join('\n'));
  };
  return {url,navigateur,contexte,page,erreurs,requetes,verifier,fermer};
}

/* Lance un test : affiche « OK » ou l'erreur, ferme tout et règle le code de sortie.
   Le délai global évite qu'un test bloqué tourne sans fin. largeur et hauteur : taille des onglets (1440×900 par défaut). */
function lancer(nom,fn,{delai=180000,largeur,hauteur}={}){
  let env=null;
  const minuterie=setTimeout(()=>{console.error('ÉCHEC '+nom+' : délai dépassé ('+delai/1000+' s)');if(env)env.fermer();process.exit(1)},delai);
  (async()=>{
    const t0=Date.now();
    try{
      env=await demarrer({largeur,hauteur});
      await fn(env);
      env.verifier();
      console.log('OK '+nom+' ('+((Date.now()-t0)/1000).toFixed(1)+' s)');
      process.exitCode=0;
    }catch(e){
      console.error('ÉCHEC '+nom+' :\n'+(e&&e.message||e));
      if(env&&env.erreurs.length&&!/erreur\(s\) dans les pages/.test(e&&e.message))console.error('Erreurs des pages :\n'+env.erreurs.join('\n'));
      process.exitCode=1;
    }finally{
      clearTimeout(minuterie);
      if(env)await env.fermer();
    }
  })();
}

// Petite pause réelle (pour laisser passer les messages BroadcastChannel entre onglets).
const pause=ms=>new Promise(r=>setTimeout(r,ms));

/* Ouvre l'écran du jeu puis la régie reliée (onglet `#arbitre=CODE`, code lu dans #hcode).
   Attend que la régie affiche « Écran CODE ✓ ». guide: true laisse le guide de l'arbitre s'ouvrir (1re connexion). params : paramètres en plus dans l'adresse de l'écran (ex. '&lite=1'). L'horloge est simulée (clock de Playwright, commune à tous les onglets
   du contexte) : le temps s'écoule normalement, mais le test peut l'avancer d'un coup (vider les chronos) ou l'arrêter. */
// lancement: true ouvre l'écran sans ?mode=serieux : mode retenu (funky par défaut), l'intro démarre à la connexion du téléphone.
async function ouvrirEcranEtRegie(env,{horloge=true,guide=false,params='',lancement=false}={}){
  const jeu=await env.page('jeu');
  if(horloge)await jeu.clock.install();
  await jeu.goto(env.url+'index.html?mode='+(lancement?'choix':'serieux')+params);
  await jeu.waitForFunction(()=>/^[A-Z0-9]{4}$/.test(document.getElementById('hcode').textContent));
  const code=await jeu.textContent('#hcode');
  const regie=await env.page('régie');
  // Le guide de l'arbitre s'ouvre à la première connexion d'un téléphone : on le marque comme déjà vu,
  // sauf pour le test qui le vérifie (guide: true).
  if(!guide)await regie.addInitScript(()=>{try{localStorage.setItem('slc-guide-vu','1')}catch(e){}});
  await regie.goto(env.url+'index.html#arbitre='+code);
  await regie.waitForFunction(()=>document.getElementById('rscreen').classList.contains('on'),null,{timeout:20000}); // « Écran CODE ✓ » (story 5.4)
  return {jeu,regie,code};
}

// Étapes affichées seulement avec VERBEUX=1 (pour trouver où un test bloque).
const etape=txt=>{if(process.env.VERBEUX)console.log('· '+txt)};

// Plateau (story 5.3) : les boutons « Lancer le duel », « Retourner sur le sol »… sont dans le panneau « Détails », fermé par défaut.
async function ouvrirDetails(jeu){if(await jeu.isHidden('#gdetails'))await jeu.click('#gdet')}
module.exports={demarrer,lancer,pause,etape,ouvrirEcranEtRegie,ouvrirDetails,RACINE};
