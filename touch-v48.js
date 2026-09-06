(() => {
  const pointers = new Map();
  let preview = null;
  let dragStart = null;
  let gestureStart = null;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const input = id => document.getElementById(id);
  const emit = el => el && el.dispatchEvent(new Event('input', { bubbles:true }));

  function activePreview(target){
    const p = target.closest?.('.v47-product-preview');
    return p && input('v47-x') && input('v47-y') && input('v47-scale') && input('v47-rotate') ? p : null;
  }

  function point(e){ return {x:e.clientX,y:e.clientY}; }
  function dist(a,b){ return Math.hypot(b.x-a.x,b.y-a.y); }
  function angle(a,b){ return Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI; }

  function setXY(x,y){
    const rx=input('v47-x'), ry=input('v47-y');
    if(!preview || !rx || !ry) return;
    const r=preview.getBoundingClientRect();
    const px=clamp(((x-r.left)/r.width)*100, Number(rx.min||0), Number(rx.max||100));
    const py=clamp(((y-r.top)/r.height)*100, Number(ry.min||0), Number(ry.max||100));
    rx.value=px; ry.value=py; emit(rx); emit(ry);
  }

  document.addEventListener('pointerdown', e => {
    const p=activePreview(e.target); if(!p) return;
    preview=p; preview.classList.add('v48-touch-active');
    try{ preview.setPointerCapture(e.pointerId); }catch(_){}
    pointers.set(e.pointerId, point(e));
    e.preventDefault();

    if(pointers.size===1){
      dragStart={id:e.pointerId};
      setXY(e.clientX,e.clientY);
      gestureStart=null;
    } else if(pointers.size===2){
      const [a,b]=[...pointers.values()];
      gestureStart={
        distance:Math.max(1,dist(a,b)),
        angle:angle(a,b),
        scale:Number(input('v47-scale').value),
        rotate:Number(input('v47-rotate').value)
      };
      dragStart=null;
    }
  }, {passive:false});

  document.addEventListener('pointermove', e => {
    if(!preview || !pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, point(e));
    e.preventDefault();

    if(pointers.size===1 && dragStart){
      setXY(e.clientX,e.clientY);
      return;
    }
    if(pointers.size>=2 && gestureStart){
      const [a,b]=[...pointers.values()].slice(0,2);
      const scaleEl=input('v47-scale'), rotEl=input('v47-rotate');
      const ratio=dist(a,b)/gestureStart.distance;
      let s=gestureStart.scale*ratio;
      let rot=gestureStart.rotate+(angle(a,b)-gestureStart.angle);
      s=clamp(s, Number(scaleEl.min), Number(scaleEl.max));
      rot=clamp(rot, Number(rotEl.min), Number(rotEl.max));
      scaleEl.value=s; rotEl.value=rot; emit(scaleEl); emit(rotEl);
    }
  }, {passive:false});

  function end(e){
    if(!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if(pointers.size===0){
      preview?.classList.remove('v48-touch-active');
      preview=null; dragStart=null; gestureStart=null;
    } else if(pointers.size===1){
      const [id]=pointers.keys(); dragStart={id}; gestureStart=null;
    }
  }
  document.addEventListener('pointerup', end, {passive:false});
  document.addEventListener('pointercancel', end, {passive:false});

  const mark = () => {
    document.querySelectorAll('.v47-product-preview').forEach(p => {
      if(input('v47-x')) p.classList.add('v48-touch');
    });
  };
  new MutationObserver(mark).observe(document.body,{childList:true,subtree:true});
  mark();
})();
