// Sur le carreau : vague de capture du mode allégé (TV Samsung) : case par case, sans clip-path, flou ni contours animés.
/* Appelée par gcapture quand LITE est vrai (js/base.js). Le navigateur des TV Samsung ignore le clip-path qui découpe
   la vague normale (elle débordait sur les cases voisines, le cadre et le titre) et peine avec ses contours recalculés
   et ses flous. Ici, seules les cases capturées changent de couleur : chacune passe à la couleur du gagnant par une
   transition CSS sur fill, avec un délai qui grandit avec sa distance (en cases) au bord du duel (ox, oy).
   Rien n'est dessiné hors des cases. fin() est celle de gcapture (repeint le plateau et libère gAnimT). */
const LITE_PAS=260,LITE_FONDU=700; // ms de délai par case de distance ; durée de la transition de chaque case (vague ralentie en story 5.3)
function gcaptureLite(A,V0,ox,oy,col,fin){
  V0.gt.classList.add('wait');
  snd('capture');
  let fin_ms=0;
  const zs=A.cells.map(i=>{
    const c=V0.cells[i],d=Math.max(0,Math.hypot((c.cx-ox)/c.w,(c.cy-oy)/c.h)-.5),delai=Math.round(d*LITE_PAS);
    fin_ms=Math.max(fin_ms,delai+LITE_FONDU);
    const z=V0.zones[i];z.style.transition='fill '+LITE_FONDU+'ms ease '+delai+'ms';z.setAttribute('fill',col);
    return z;
  });
  // Attente par requestAnimationFrame (comme la vague normale) : gridRender l'annule avec cancelAnimationFrame(gAnimT).
  const t0=performance.now();
  const step=now=>{
    if(GV!==V0)return;
    if(now-t0<fin_ms+40){gAnimT=requestAnimationFrame(step);return}
    zs.forEach(z=>z.style.transition='');
    fin();
  };
  gAnimT=requestAnimationFrame(step);
}
