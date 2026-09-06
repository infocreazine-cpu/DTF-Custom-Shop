(() => {
  'use strict';

  const PRICES = { tshirt:25, sweat:40, cap:20, casquette:20, tote:15, mug:15, umbrella:25, parapluie:25 };
  const ZONES = {
    heart:{w:15,h:15,label:'COEUR'}, back:{w:30,h:40,label:'DOS'}, sleeve:{w:10,h:10,label:'MANCHE'}, center:{w:30,h:40,label:'CENTRE'},
    cap:{w:10,h:6,label:'CASQUETTE'}, tote:{w:28,h:30,label:'TOTE'}, mug:{w:20,h:9,label:'MUG'}, umbrella:{w:25,h:20,label:'PARAPLUIE'}
  };
  const DPI = 300;
  const cmToPx = cm => Math.max(1, Math.round(cm / 2.54 * DPI));
  const euro = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n)||0);
  const readCart = () => { try { return JSON.parse(localStorage.getItem('dtf-v47-cart') || '[]'); } catch (_) { return []; } };
  const clearCart = () => { localStorage.setItem('dtf-v47-cart','[]'); window.dispatchEvent(new Event('dtf-cart-cleared')); };
  const price = item => PRICES[String(item.product||'').toLowerCase()] || 0;
  const total = cart => cart.reduce((s,i)=>s+price(i)*Math.max(1,Number(i.qty)||1),0);
  const orderNumber = () => {
    const d=new Date(), p=n=>String(n).padStart(2,'0');
    return `DTF-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${String(Date.now()).slice(-6)}`;
  };

  const style=document.createElement('style');
  style.textContent=`
  .v55-checkout{position:fixed;inset:0;z-index:50000;background:#fff9e8;color:#07182a;display:none;flex-direction:column}
  .v55-checkout.open{display:flex}.v55-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#0877d5;color:#fff;border-bottom:4px solid #061b30}
  .v55-head h2{margin:0;flex:1;font-size:24px}.v55-close{border:0;border-radius:999px;background:#ff1880;color:#fff;width:46px;height:46px;font-size:23px;font-weight:900}
  .v55-body{flex:1;overflow:auto;padding:14px;-webkit-overflow-scrolling:touch}.v55-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:1050px;margin:auto}
  .v55-card{background:#fff;border:2px solid #cae5f5;border-radius:18px;padding:16px;box-shadow:0 8px 24px rgba(6,27,48,.08)}
  .v55-field{display:grid;gap:5px;margin:0 0 11px}.v55-field label{font-weight:900;color:#08265b}.v55-field input{width:100%;padding:12px;border:2px solid #bddcef;border-radius:12px;font:inherit;background:#fff}
  .v55-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v55-line{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #e2edf4}
  .v55-total{display:flex;justify-content:space-between;font-size:22px;font-weight:1000;padding:16px 0}.v55-btn{width:100%;border:0;border-radius:999px;padding:14px 18px;font-weight:1000;font-size:17px;margin-top:10px}
  .v55-pay{background:#ffd322;color:#111}.v55-test{background:#fff;color:#0877d5;border:2px solid #0877d5}.v55-dark{background:#08265b;color:#fff}.v55-light{background:#e8f2f8;color:#08265b}
  .v55-note{font-size:13px;line-height:1.4;color:#61798f}.v55-error{margin-top:10px;padding:10px 12px;border-radius:12px;background:#ffe0e0;color:#8f1111;font-weight:900}.v55-success{text-align:center;max-width:760px;margin:auto}
  @media(max-width:760px){.v55-grid,.v55-row{grid-template-columns:1fr}.v55-body{padding:10px}.v55-head h2{font-size:20px}}
  `;
  document.head.appendChild(style);

  const overlay=document.createElement('div');
  overlay.className='v55-checkout';
  overlay.innerHTML='<div class="v55-head"><h2>FINALISER LA COMMANDE</h2><button type="button" class="v55-close">✕</button></div><div class="v55-body"></div>';
  document.body.appendChild(overlay);
  const body=overlay.querySelector('.v55-body');
  overlay.querySelector('.v55-close').addEventListener('click',()=>overlay.classList.remove('open'));

  function customer(){
    const v=id=>{ const el=document.getElementById(id); return el ? el.value.trim() : ''; };
    return {first:v('v55-first'),last:v('v55-last'),email:v('v55-email'),phone:v('v55-phone'),address:v('v55-address'),zip:v('v55-zip'),city:v('v55-city')};
  }

  function buildOrder(cart, simulated){
    return {
      orderNumber:orderNumber(), createdAt:new Date().toISOString(), customer:customer(), currency:'EUR', simulated:!!simulated,
      items:cart.map(i=>Object.assign({},i,{unitPrice:price(i),lineTotal:price(i)*Math.max(1,Number(i.qty)||1)})), total:total(cart)
    };
  }

  function openCheckout(){
    const cart=readCart();
    if(!cart.length){ alert('Votre panier est vide.'); return false; }
    const old=document.querySelector('.v47-overlay'); if(old) old.classList.remove('open');
    const t=total(cart);
    body.innerHTML=`<div class="v55-grid"><section class="v55-card"><h3>Coordonnées client</h3>
      <div class="v55-row"><div class="v55-field"><label>Prénom (facultatif)</label><input id="v55-first"></div><div class="v55-field"><label>Nom (facultatif)</label><input id="v55-last"></div></div>
      <div class="v55-field"><label>Email (facultatif)</label><input id="v55-email" type="email"></div>
      <div class="v55-field"><label>Téléphone (facultatif)</label><input id="v55-phone" type="tel"></div>
      <div class="v55-field"><label>Adresse (facultatif)</label><input id="v55-address"></div>
      <div class="v55-row"><div class="v55-field"><label>Code postal (facultatif)</label><input id="v55-zip"></div><div class="v55-field"><label>Ville (facultatif)</label><input id="v55-city"></div></div>
      <p class="v55-note">Toutes les coordonnées restent facultatives.</p></section>
      <section class="v55-card"><h3>Récapitulatif</h3>${cart.map(i=>`<div class="v55-line"><span><b>${i.label||i.product}</b><br><small>${i.zoneLabel||''}${i.size?' · '+i.size:''} · Qté ${i.qty||1}</small></span><strong>${euro(price(i)*(i.qty||1))}</strong></div>`).join('')}
      <div class="v55-total"><span>Total</span><span>${euro(t)}</span></div>
      <button class="v55-btn v55-pay" id="v55-pay" type="button">PAYER ${euro(t)}</button>
      <button class="v55-btn v55-test" id="v55-sim" type="button">SIMULER L’ENCAISSEMENT</button><div id="v55-msg"></div>
      <p class="v55-note">La simulation ne débite rien et permet de vérifier le PDF et les fichiers DTF.</p></section></div>`;
    overlay.classList.add('open');
    body.scrollTop=0;
    document.getElementById('v55-pay').onclick=()=>startPayment(cart);
    document.getElementById('v55-sim').onclick=()=>showPaid(buildOrder(cart,true),true);
    return true;
  }

  async function startPayment(cart){
    const msg=document.getElementById('v55-msg');
    const order=buildOrder(cart,false);
    localStorage.setItem('dtf-last-order',JSON.stringify(order));
    try{
      msg.textContent='Connexion au paiement sécurisé…';
      const r=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});
      const data=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||'Paiement indisponible');
      if(!data.url) throw new Error('Lien de paiement absent');
      location.href=data.url;
    }catch(e){ msg.innerHTML=`<div class="v55-error">${e.message}. Utilisez la simulation pour continuer sans Stripe.</div>`; }
  }

  async function downloadPdf(order){
    const r=await fetch('/api/production-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});
    if(!r.ok) throw new Error('PDF indisponible');
    const blob=await r.blob(), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=`${order.orderNumber}-production.pdf`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000);
  }

  const safe=s=>String(s||'VISUEL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').toUpperCase();
  const zoneFor=item=>{
    const p=String(item.product||'').toLowerCase();
    if(p==='cap'||p==='casquette') return ZONES.cap; if(p==='tote') return ZONES.tote; if(p==='mug') return ZONES.mug; if(p==='umbrella'||p==='parapluie') return ZONES.umbrella;
    return ZONES[item.zone]||ZONES.center;
  };
  const loadImage=src=>new Promise((ok,ko)=>{const img=new Image();img.onload=()=>ok(img);img.onerror=()=>ko(new Error('Visuel illisible'));img.src=src;});
  function hasTransparency(img){
    const c=document.createElement('canvas'), ratio=Math.min(256/img.naturalWidth,256/img.naturalHeight,1); c.width=Math.max(1,Math.round(img.naturalWidth*ratio)); c.height=Math.max(1,Math.round(img.naturalHeight*ratio));
    const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(img,0,0,c.width,c.height); const d=x.getImageData(0,0,c.width,c.height).data; for(let i=3;i<d.length;i+=4) if(d[i]<255) return true; return false;
  }
  async function makePrint(item,index,number){
    if(!item.art) throw new Error(`Article ${index+1} : visuel absent`);
    const img=await loadImage(item.art), z=zoneFor(item), scale=Math.max(.05,Math.min(1,(Number(item.scale)||100)/100)), angle=(Number(item.rotate)||0)*Math.PI/180;
    const limW=z.w*scale, limH=z.h*scale, ratio=img.naturalWidth/img.naturalHeight; let w=limW,h=w/ratio; if(h>limH){h=limH;w=h*ratio;}
    const co=Math.abs(Math.cos(angle)),si=Math.abs(Math.sin(angle)), rw=w*co+h*si,rh=w*si+h*co,fit=Math.min(1,limW/rw,limH/rh); w*=fit;h*=fit;
    const ow=w*co+h*si,oh=w*si+h*co,c=document.createElement('canvas'); c.width=cmToPx(ow); c.height=cmToPx(oh); const x=c.getContext('2d'); x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
    const transparent=hasTransparency(img); if(!transparent){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);} x.save();x.translate(c.width/2,c.height/2);x.rotate(angle);x.drawImage(img,-cmToPx(w)/2,-cmToPx(h)/2,cmToPx(w),cmToPx(h));x.restore();
    const mime=transparent?'image/png':'image/jpeg',ext=transparent?'png':'jpg',blob=await new Promise(ok=>c.toBlob(ok,mime,transparent?undefined:.96));
    return {blob,filename:`${safe(number)}_${String(index+1).padStart(2,'0')}_${safe(item.label||item.product)}_${safe(item.zoneLabel||z.label)}_${ow.toFixed(1)}x${oh.toFixed(1)}cm_${DPI}dpi.${ext}`};
  }
  async function downloadPrints(order){
    let n=0; for(let i=0;i<order.items.length;i++){ if(!order.items[i].art) continue; const f=await makePrint(order.items[i],i,order.orderNumber); const u=URL.createObjectURL(f.blob),a=document.createElement('a');a.href=u;a.download=f.filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);n++;await new Promise(r=>setTimeout(r,250)); }
    if(!n) throw new Error('Aucun visuel à générer'); return n;
  }

  function showPaid(order,simulated){
    localStorage.setItem('dtf-last-order',JSON.stringify(order));
    body.innerHTML=`<div class="v55-card v55-success"><h3>${simulated?'ENCAISSEMENT SIMULÉ':'PAIEMENT CONFIRMÉ'}</h3><div style="font-size:26px;font-weight:1000">${order.orderNumber}</div><p><b>Total : ${euro(order.total)}</b></p>
      <button id="v55-pdf" class="v55-btn v55-pay" type="button">TÉLÉCHARGER LE PDF DE PRODUCTION</button>
      <button id="v55-print" class="v55-btn v55-dark" type="button">TÉLÉCHARGER LES FICHIERS D’IMPRESSION</button>
      <button id="v55-finish" class="v55-btn v55-light" type="button">TERMINER</button><div id="v55-out"></div></div>`;
    overlay.classList.add('open');
    document.getElementById('v55-pdf').onclick=async()=>{const m=document.getElementById('v55-out');try{m.textContent='Génération du PDF…';await downloadPdf(order);m.textContent='PDF généré.';}catch(e){m.innerHTML=`<div class="v55-error">${e.message}</div>`;}};
    document.getElementById('v55-print').onclick=async()=>{const m=document.getElementById('v55-out');try{m.textContent='Préparation des fichiers DTF…';const n=await downloadPrints(order);m.textContent=`${n} fichier(s) généré(s).`;}catch(e){m.innerHTML=`<div class="v55-error">${e.message}</div>`;}};
    document.getElementById('v55-finish').onclick=()=>{clearCart();localStorage.removeItem('dtf-last-order');overlay.classList.remove('open');};
  }

  function intercept(e){
    const b=e.target && e.target.closest ? e.target.closest('#v47-order') : null;
    if(!b) return;
    e.preventDefault(); e.stopPropagation();
    openCheckout();
  }
  document.addEventListener('click',intercept,true);
  document.addEventListener('pointerup',intercept,true);
  window.DTF_OPEN_CHECKOUT=openCheckout;
  window.addEventListener('dtf-open-checkout',openCheckout);

  const qs=new URLSearchParams(location.search);
  if(qs.get('payment')==='success'){
    let order=null; try{order=JSON.parse(localStorage.getItem('dtf-last-order')||'null');}catch(_){}
    if(order) showPaid(order,false);
  }
})();
