(() => {
  const PRICES = { tshirt:25, sweat:40, cap:20, tote:15, mug:15, umbrella:25, casquette:20, parapluie:25 };
  const money = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n||0);
  const readCart = () => { try{return JSON.parse(localStorage.getItem('dtf-v47-cart')||'[]')}catch(e){return []} };
  const writeCart = c => localStorage.setItem('dtf-v47-cart',JSON.stringify(c));
  const productKey = i => String(i.product||'').toLowerCase();
  const unitPrice = i => PRICES[productKey(i)] ?? 0;
  const orderNumber = () => {
    const d=new Date(); const pad=n=>String(n).padStart(2,'0');
    return `DTF-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${String(Date.now()).slice(-6)}`;
  };

  const style=document.createElement('style'); style.textContent=`
  .v49-checkout{position:fixed;inset:0;z-index:12000;background:#fff9e8;display:none;flex-direction:column;color:#07182a}.v49-checkout.open{display:flex}
  .v49-head{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#0877d5;color:#fff;border-bottom:4px solid #061b30}.v49-head h2{margin:0;flex:1}.v49-close{border:0;border-radius:999px;background:#ff1880;color:#fff;padding:10px 14px;font-weight:900}
  .v49-body{flex:1;overflow:auto;padding:14px}.v49-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:1050px;margin:auto}.v49-card{background:#fff;border:2px solid #cae5f5;border-radius:18px;padding:16px;box-shadow:0 8px 24px rgba(6,27,48,.08)}
  .v49-field{display:grid;gap:6px;margin-bottom:12px}.v49-field label{font-weight:900;color:#08265b}.v49-field input{padding:12px;border:2px solid #bddcef;border-radius:12px;font:inherit}.v49-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .v49-line{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #e2edf4}.v49-total{display:flex;justify-content:space-between;font-size:22px;font-weight:1000;padding:14px 0}.v49-primary{width:100%;border:0;border-radius:999px;background:#ffd322;padding:14px 18px;font-weight:1000;font-size:17px}.v49-secondary{width:100%;border:0;border-radius:999px;background:#e8f2f8;padding:12px 16px;font-weight:900;color:#08265b}.v49-note{font-size:13px;color:#61798f;line-height:1.4}.v49-success{text-align:center;padding:28px 12px}.v49-order{font-size:28px;font-weight:1000;color:#08265b}
  @media(max-width:760px){.v49-grid{grid-template-columns:1fr}.v49-row{grid-template-columns:1fr}.v49-body{padding:10px}}
  `; document.head.appendChild(style);

  const overlay=document.createElement('div'); overlay.className='v49-checkout'; overlay.innerHTML=`<div class="v49-head"><h2>FINALISER LA COMMANDE</h2><button class="v49-close" type="button">✕</button></div><div class="v49-body"></div>`; document.body.appendChild(overlay);
  const body=overlay.querySelector('.v49-body'); overlay.querySelector('.v49-close').onclick=()=>overlay.classList.remove('open');

  function cartTotal(cart){ return cart.reduce((s,i)=>s+unitPrice(i)*Math.max(1,Number(i.qty)||1),0); }
  function renderCheckout(){
    const cart=readCart(); if(!cart.length){ alert('Votre panier est vide.'); return; }
    const total=cartTotal(cart);
    body.innerHTML=`<div class="v49-grid"><div class="v49-card"><h3>Coordonnées client</h3>
      <div class="v49-row"><div class="v49-field"><label>Prénom</label><input id="v49-first" autocomplete="given-name"></div><div class="v49-field"><label>Nom</label><input id="v49-last" autocomplete="family-name"></div></div>
      <div class="v49-field"><label>Email</label><input id="v49-email" type="email" autocomplete="email"></div>
      <div class="v49-field"><label>Téléphone</label><input id="v49-phone" type="tel" autocomplete="tel"></div>
      <div class="v49-field"><label>Adresse</label><input id="v49-address" autocomplete="street-address"></div>
      <div class="v49-row"><div class="v49-field"><label>Code postal</label><input id="v49-zip" inputmode="numeric"></div><div class="v49-field"><label>Ville</label><input id="v49-city"></div></div>
      <p class="v49-note">Ces informations servent à identifier la commande et à préparer le suivi client.</p></div>
      <div class="v49-card"><h3>Récapitulatif</h3>${cart.map(i=>`<div class="v49-line"><span><b>${i.label||i.product}</b><br><small>${i.zoneLabel||''}${i.size?' · '+i.size:''} · Qté ${i.qty||1}</small></span><strong>${money(unitPrice(i)*(i.qty||1))}</strong></div>`).join('')}<div class="v49-total"><span>Total</span><span>${money(total)}</span></div><button id="v49-pay" class="v49-primary" type="button">PAYER ${money(total)}</button><p class="v49-note">Le paiement Stripe sera réellement actif dès que les clés Stripe seront ajoutées dans Vercel. En attendant, le bouton prépare la commande et le PDF en mode test.</p></div></div>`;
    body.querySelector('#v49-pay').onclick=()=>startPayment(cart,total);
    overlay.classList.add('open');
  }

  async function startPayment(cart,total){
    const customer={first:body.querySelector('#v49-first').value.trim(),last:body.querySelector('#v49-last').value.trim(),email:body.querySelector('#v49-email').value.trim(),phone:body.querySelector('#v49-phone').value.trim(),address:body.querySelector('#v49-address').value.trim(),zip:body.querySelector('#v49-zip').value.trim(),city:body.querySelector('#v49-city').value.trim()};
    if(!customer.first||!customer.last||!customer.email){ alert('Prénom, nom et email sont obligatoires.'); return; }
    const order={orderNumber:orderNumber(),createdAt:new Date().toISOString(),customer,items:cart.map(i=>({...i,unitPrice:unitPrice(i),lineTotal:unitPrice(i)*(i.qty||1)})),total,currency:'EUR'};
    localStorage.setItem('dtf-last-order',JSON.stringify(order));

    try{
      const r=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});
      if(r.ok){ const data=await r.json(); if(data.url){ location.href=data.url; return; } }
    }catch(e){}
    completeOrder(order,true);
  }

  function completeOrder(order,testMode){
    writeCart([]);
    const pdfUrl=buildProductionPdf(order);
    body.innerHTML=`<div class="v49-card v49-success" style="max-width:760px;margin:auto"><h3>COMMANDE ENREGISTRÉE</h3><div class="v49-order">${order.orderNumber}</div><p>${testMode?'Mode test : aucun paiement réel n’a été encaissé.':'Paiement confirmé.'}</p><p><b>Total : ${money(order.total)}</b></p><a class="v49-primary" style="display:inline-block;text-decoration:none;width:auto" href="${pdfUrl}" download="${order.orderNumber}-production.html">TÉLÉCHARGER LE PDF DE PRODUCTION</a><div style="height:10px"></div><button class="v49-secondary" id="v49-finish" type="button">TERMINER</button></div>`;
    body.querySelector('#v49-finish').onclick=()=>overlay.classList.remove('open');
  }

  function buildProductionPdf(order){
    const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const items=order.items.map((i,n)=>`<section style="page-break-inside:avoid;border:1px solid #ccc;padding:12px;margin:0 0 16px"><h2>${n+1}. ${esc(i.label||i.product)}</h2><p><b>Zone:</b> ${esc(i.zoneLabel||i.zone)} — ${esc(i.limit||'')}</p><p><b>Taille vêtement:</b> ${esc(i.size||'-')} &nbsp; <b>Qté:</b> ${i.qty||1}</p><p><b>Placement:</b> X ${i.x}% · Y ${i.y}% · Échelle ${i.scale}% · Rotation ${i.rotate}°</p>${i.art?`<img src="${i.art}" style="max-width:280px;max-height:280px;object-fit:contain;border:1px solid #ddd">`:''}<p><b>Prix:</b> ${money(i.lineTotal)}</p></section>`).join('');
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>${order.orderNumber}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin-bottom:4px}.muted{color:#666}table{border-collapse:collapse;width:100%}td{padding:4px 0}</style></head><body><h1>DTF CUSTOM SHOP — FICHE DE PRODUCTION</h1><div class="muted">Commande ${order.orderNumber} · ${new Date(order.createdAt).toLocaleString('fr-FR')}</div><hr><table><tr><td><b>Client</b></td><td>${esc(order.customer.first)} ${esc(order.customer.last)}</td></tr><tr><td><b>Email</b></td><td>${esc(order.customer.email)}</td></tr><tr><td><b>Téléphone</b></td><td>${esc(order.customer.phone)}</td></tr><tr><td><b>Adresse</b></td><td>${esc(order.customer.address)} ${esc(order.customer.zip)} ${esc(order.customer.city)}</td></tr><tr><td><b>Total</b></td><td>${money(order.total)}</td></tr></table><hr>${items}<script>window.onload=()=>window.print()<\/script></body></html>`;
    return URL.createObjectURL(new Blob([html],{type:'text/html'}));
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#v47-order'); if(!b) return;
    e.preventDefault(); e.stopImmediatePropagation(); renderCheckout();
  },true);

  const params=new URLSearchParams(location.search);
  if(params.get('payment')==='success'){
    try{const order=JSON.parse(localStorage.getItem('dtf-last-order')||'null'); if(order) completeOrder(order,false);}catch(e){}
  }
})();
