(() => {
  const PRICES = { tshirt:25, sweat:40, cap:20, casquette:20, tote:15, mug:15, umbrella:25, parapluie:25 };
  const money = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n||0);
  const readCart = () => { try{return JSON.parse(localStorage.getItem('dtf-v47-cart')||'[]')}catch(e){return []} };
  const writeCart = c => localStorage.setItem('dtf-v47-cart',JSON.stringify(c));
  const unitPrice = i => PRICES[String(i.product||'').toLowerCase()] ?? 0;
  const orderNumber = () => {
    const d=new Date(), p=n=>String(n).padStart(2,'0');
    return `DTF-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${String(Date.now()).slice(-6)}`;
  };

  const style=document.createElement('style'); style.textContent=`
  .v49-checkout{position:fixed;inset:0;z-index:12000;background:#fff9e8;display:none;flex-direction:column;color:#07182a}.v49-checkout.open{display:flex}
  .v49-head{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#0877d5;color:#fff;border-bottom:4px solid #061b30}.v49-head h2{margin:0;flex:1}.v49-close{border:0;border-radius:999px;background:#ff1880;color:#fff;padding:10px 14px;font-weight:900}
  .v49-body{flex:1;overflow:auto;padding:14px}.v49-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:1050px;margin:auto}.v49-card{background:#fff;border:2px solid #cae5f5;border-radius:18px;padding:16px;box-shadow:0 8px 24px rgba(6,27,48,.08)}
  .v49-field{display:grid;gap:6px;margin-bottom:12px}.v49-field label{font-weight:900;color:#08265b}.v49-field input{padding:12px;border:2px solid #bddcef;border-radius:12px;font:inherit}.v49-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .v49-line{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #e2edf4}.v49-total{display:flex;justify-content:space-between;font-size:22px;font-weight:1000;padding:14px 0}.v49-primary{width:100%;border:0;border-radius:999px;background:#ffd322;padding:14px 18px;font-weight:1000;font-size:17px}.v49-secondary{width:100%;border:0;border-radius:999px;background:#e8f2f8;padding:12px 16px;font-weight:900;color:#08265b}.v49-note{font-size:13px;color:#61798f;line-height:1.4}.v49-error{padding:10px 12px;border-radius:12px;background:#ffe0e0;color:#8f1111;font-weight:900;margin-top:10px}.v49-success{text-align:center;padding:28px 12px}.v49-order{font-size:28px;font-weight:1000;color:#08265b}
  @media(max-width:760px){.v49-grid{grid-template-columns:1fr}.v49-row{grid-template-columns:1fr}.v49-body{padding:10px}}
  `; document.head.appendChild(style);

  const overlay=document.createElement('div'); overlay.className='v49-checkout'; overlay.innerHTML=`<div class="v49-head"><h2>FINALISER LA COMMANDE</h2><button class="v49-close" type="button">✕</button></div><div class="v49-body"></div>`; document.body.appendChild(overlay);
  const body=overlay.querySelector('.v49-body'); overlay.querySelector('.v49-close').onclick=()=>overlay.classList.remove('open');

  const cartTotal = cart => cart.reduce((s,i)=>s+unitPrice(i)*Math.max(1,Number(i.qty)||1),0);

  function renderCheckout(){
    const cart=readCart(); if(!cart.length){ alert('Votre panier est vide.'); return; }
    const total=cartTotal(cart);
    body.innerHTML=`<div class="v49-grid"><div class="v49-card"><h3>Coordonnées client</h3>
      <div class="v49-row"><div class="v49-field"><label>Prénom</label><input id="v49-first" autocomplete="given-name"></div><div class="v49-field"><label>Nom</label><input id="v49-last" autocomplete="family-name"></div></div>
      <div class="v49-field"><label>Email</label><input id="v49-email" type="email" autocomplete="email"></div>
      <div class="v49-field"><label>Téléphone</label><input id="v49-phone" type="tel" autocomplete="tel"></div>
      <div class="v49-field"><label>Adresse</label><input id="v49-address" autocomplete="street-address"></div>
      <div class="v49-row"><div class="v49-field"><label>Code postal</label><input id="v49-zip" inputmode="numeric"></div><div class="v49-field"><label>Ville</label><input id="v49-city"></div></div>
      <p class="v49-note">Prénom, nom et email sont obligatoires.</p></div>
      <div class="v49-card"><h3>Récapitulatif</h3>${cart.map(i=>`<div class="v49-line"><span><b>${i.label||i.product}</b><br><small>${i.zoneLabel||''}${i.size?' · '+i.size:''} · Qté ${i.qty||1}</small></span><strong>${money(unitPrice(i)*(i.qty||1))}</strong></div>`).join('')}<div class="v49-total"><span>Total</span><span>${money(total)}</span></div><button id="v49-pay" class="v49-primary" type="button">PAYER ${money(total)}</button><div id="v49-msg"></div><p class="v49-note">Paiement sécurisé par Stripe. Le PDF de production est généré après confirmation du paiement.</p></div></div>`;
    body.querySelector('#v49-pay').onclick=()=>startPayment(cart,total);
    overlay.classList.add('open');
  }

  async function startPayment(cart,total){
    const customer={first:body.querySelector('#v49-first').value.trim(),last:body.querySelector('#v49-last').value.trim(),email:body.querySelector('#v49-email').value.trim(),phone:body.querySelector('#v49-phone').value.trim(),address:body.querySelector('#v49-address').value.trim(),zip:body.querySelector('#v49-zip').value.trim(),city:body.querySelector('#v49-city').value.trim()};
    const msg=body.querySelector('#v49-msg');
    if(!customer.first||!customer.last||!customer.email){ msg.innerHTML='<div class="v49-error">Prénom, nom et email sont obligatoires.</div>'; return; }
    const order={orderNumber:orderNumber(),createdAt:new Date().toISOString(),customer,items:cart.map(i=>({...i,unitPrice:unitPrice(i),lineTotal:unitPrice(i)*(i.qty||1)})),total,currency:'EUR'};
    localStorage.setItem('dtf-last-order',JSON.stringify(order));
    try{
      msg.textContent='Connexion au paiement sécurisé…';
      const r=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});
      const data=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||'Paiement indisponible');
      if(data.url){ location.href=data.url; return; }
      throw new Error('Lien de paiement absent');
    }catch(e){ msg.innerHTML=`<div class="v49-error">${e.message}. Ajoutez STRIPE_SECRET_KEY dans Vercel pour activer le paiement.</div>`; }
  }

  async function downloadProductionPdf(order){
    const r=await fetch('/api/production-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});
    if(!r.ok){ const d=await r.json().catch(()=>({})); throw new Error(d.error||'PDF indisponible'); }
    const blob=await r.blob(); const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=`${order.orderNumber}-production.pdf`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000);
  }

  function showPaid(order){
    writeCart([]);
    body.innerHTML=`<div class="v49-card v49-success" style="max-width:760px;margin:auto"><h3>PAIEMENT CONFIRMÉ</h3><div class="v49-order">${order.orderNumber}</div><p><b>Total : ${money(order.total)}</b></p><button class="v49-primary" id="v49-pdf" type="button">TÉLÉCHARGER LE PDF DE PRODUCTION</button><div style="height:10px"></div><button class="v49-secondary" id="v49-finish" type="button">TERMINER</button><div id="v49-pdfmsg"></div></div>`;
    overlay.classList.add('open');
    body.querySelector('#v49-pdf').onclick=async()=>{const m=body.querySelector('#v49-pdfmsg');try{m.textContent='Génération du PDF…';await downloadProductionPdf(order);m.textContent='PDF généré.';}catch(e){m.innerHTML=`<div class="v49-error">${e.message}</div>`;}};
    body.querySelector('#v49-finish').onclick=()=>{overlay.classList.remove('open');history.replaceState({},'',location.pathname);};
  }

  async function handlePaymentReturn(){
    const params=new URLSearchParams(location.search); if(params.get('payment')!=='success') return;
    const sessionId=params.get('session_id'); let order=null; try{order=JSON.parse(localStorage.getItem('dtf-last-order')||'null')}catch(e){}
    if(!sessionId||!order) return;
    overlay.classList.add('open'); body.innerHTML='<div class="v49-card" style="max-width:700px;margin:auto"><h3>Vérification du paiement…</h3></div>';
    try{
      const r=await fetch('/api/verify-checkout-session?session_id='+encodeURIComponent(sessionId)); const data=await r.json();
      if(!r.ok||!data.paid) throw new Error('Le paiement n’est pas confirmé.');
      if(data.orderNumber && data.orderNumber!==order.orderNumber) throw new Error('Numéro de commande incohérent.');
      showPaid(order);
    }catch(e){ body.innerHTML=`<div class="v49-card" style="max-width:700px;margin:auto"><div class="v49-error">${e.message}</div></div>`; }
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#v47-order'); if(!b) return;
    e.preventDefault(); e.stopImmediatePropagation(); renderCheckout();
  },true);

  handlePaymentReturn();
})();
