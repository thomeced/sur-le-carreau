/* Sons du jeu « Sur le carreau » : tous synthétisés avec la Web Audio API (aucun fichier audio, aucun droit à gérer).
 *
 * API : SLC_SND.play('beep' | 'go' | 'good' | 'pass' | 'end' | 'capture'), SLC_SND.enabled(), SLC_SND.toggle().
 *  - beep : bip du compte à rebours 3-2-1 ; go : départ ; good : bonne réponse ; pass : « passé » ; end : fin de temps ; capture : prise de territoire sur le plateau.
 * Réglage retenu dans localStorage (clé « slc-sons », « 1 » ou « 0 »). Sans réglage : actif, sauf en mode sérieux.
 * Le navigateur n'autorise le son qu'après un geste : le contexte audio est réveillé au premier clic ou à la première touche.
 * Un petit bouton 🔊/🔇 (en haut à droite) permet de couper les sons ; il n'apparaît pas sur la vue arbitre.
 */
(function(){
  const KEY='slc-sons';
  const root=document.documentElement;
  const get=()=>{try{return localStorage.getItem(KEY)}catch(e){return null}};
  const set=v=>{try{localStorage.setItem(KEY,v)}catch(e){}};
  const enabled=()=>{const v=get();return v===null?!root.classList.contains('slc-serieux'):v==='1'};
  let ctx=null,btn=null;
  function ac(){
    if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{ctx=new C()}catch(e){return null}}
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    return ctx;
  }
  // Une note : forme d'onde, fréquence (ou glissando f0→f1), début (s), durée (s), volume.
  function note(c,type,f0,f1,at,dur,vol){
    const t=c.currentTime+at,o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+0.05);
  }
  const SOUNDS={
    beep:c=>note(c,'sine',660,0,0,0.18,0.25),
    go:c=>{note(c,'sine',988,0,0,0.12,0.28);note(c,'sine',1319,0,0.12,0.4,0.28)},
    good:c=>{note(c,'triangle',784,0,0,0.12,0.3);note(c,'triangle',1175,0,0.1,0.28,0.3)},
    pass:c=>{note(c,'sawtooth',260,150,0,0.3,0.18)},
    capture:c=>{note(c,'sawtooth',220,880,0,0.45,0.07);note(c,'triangle',523,0,0.3,0.45,0.22);note(c,'triangle',659,0,0.38,0.45,0.2);note(c,'triangle',784,0,0.46,0.7,0.22)},
    end:c=>{note(c,'square',150,70,0,0.9,0.2);note(c,'sawtooth',100,50,0,0.9,0.15)}
  };
  function play(name){
    if(!enabled()||!SOUNDS[name])return;
    const c=ac();if(!c)return;
    try{SOUNDS[name](c)}catch(e){}
  }
  function show(){if(!btn)return;const on=enabled();btn.textContent=on?'🔊':'🔇';btn.setAttribute('aria-pressed',on?'true':'false');btn.setAttribute('aria-label',on?'Couper les sons du jeu':'Activer les sons du jeu');btn.title=on?'Sons du jeu : activés':'Sons du jeu : coupés'}
  function toggle(){set(enabled()?'0':'1');show();if(enabled())play('beep')}
  function mount(){
    if(location.hash==='#arbitre'||btn)return;
    btn=document.createElement('button');btn.type='button';btn.className='slc-snd-btn';
    btn.onclick=toggle;document.body.appendChild(btn);show();
  }
  const wake=()=>{if(enabled())ac()};
  addEventListener('pointerdown',wake,{capture:true});addEventListener('keydown',wake,{capture:true});
  addEventListener('hashchange',()=>{if(location.hash==='#arbitre'&&btn){btn.remove();btn=null}else mount()});
  // Le mode (funky / sérieux) est choisi après le chargement : on réaffiche l'état du bouton à ce moment.
  document.addEventListener('slc:intro-end',show);
  if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
  window.SLC_SND={play,enabled,toggle};
})();
