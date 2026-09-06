(() => {
  const TEXTILES = new Set(['tshirt','sweat','apron']);
  const ZONES = {
    textile:[['heart','Côté cœur','15 × 15 cm max'],['back','Dos','30 × 40 cm max'],['sleeve','Manche','10 × 10 cm max']],
    other:[['center','Zone principale','Format adapté au produit']]
  };
  const state = {card:null,product:'',label:'',step:0,size:'M',color:'',zone:'center',qty:1,art:'',scale:100,rotate:0,x:50,y:45};
  let cart = [];
  try{ cart = JSON.parse(localStorage.getItem('dtf-v47-cart')||'[]'); }catch(e){ cart=[]; }

  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const saveCart = () => { localStorage.setItem('dtf-v47-cart', JSON.stringify(cart)); updateCartButton(); };
  const textile = () => TEXTILES.has(state.product);
  const currentZone = () => (textile()?ZONES.textile:ZONES.other).find(z=>z[0]===state.zone) || (textile()?ZONES.textile[0]:ZONES.other[0]);

  const cartBtn = document.createElement('button');
  cartBtn.className='v47-cart'; cartBtn.type='button'; cartBtn.addEventListener('click',()=>openCart()); document.body.appendChild(cartBtn);
  const updateCartButton=()=>{ const n=cart.reduce((a,i)=>a+(i.qty||1),0); cartBtn.innerHTML=`PANIER <b>${n}</b>`; };

  const overlay=document.createElement('div'); overlay.className='v47-overlay'; overlay.innerHTML=`
    <div class="v47-head"><button class="v47-back" type="button">← Retour</button><h2>PERSONNALISEZ VOTRE PRODUIT</h2><button class="v47-close" type="button">✕</button></div>
    <div class="v47-steps"><div class="v47-step">1 · PRODUIT</div><div class="v47-step">2 · VISUEL</div><div class="v47-step">3 · PLACEMENT</div><div class="v47-step">4 · VALIDATION</div></div>
    <div class="v47-body"></div>`;
  document.body.appendChild(overlay);
  const body=overlay.querySelector('.v47-body');
  overlay.querySelector('.v47-close').onclick=()=>close();
  overlay.querySelector('.v47-back').onclick=()=>{ if(state.step>0){state.step--;render();} else close(); };

  function close(){ overlay.classList.remove('open'); }
  function open(card){
    state.card=card; state.product=card.dataset.product||'product'; state.label=card.querySelector('h2')?.textContent?.trim()||state.product;
    state.step=0; state.size='M'; state.zone=textile()?'heart':'center'; state.qty=1; state.art=''; state.scale=100; state.rotate=0; state.x=50; state.y=45;
    const firstSw=card.querySelector('.sw'); state.color=firstSw ? getComputedStyle(firstSw).backgroundColor : '';
    overlay.classList.add('open'); render();
  }
  function render(){
    overlay.querySelectorAll('.v47-step').forEach((el,i)=>el.classList.toggle('active',i===state.step));
    if(state.step===0) renderProduct(); else if(state.step===1) renderVisual(); else if(state.step===2) renderPlacement(); else renderValidation();
  }
  function previewHtml(){
    const src=state.card?.querySelector('.product-image img')?.src||'';
    const art=state.art?`<img class="v47-art" src="${state.art}" alt="Visuel importé" style="left:${state.x}%;top:${state.y}%;width:${Math.max(10,24*state.scale/100)}%;transform:translate(-50%,-50%) rotate(${state.rotate}deg)">`:'';
    return `<div class="v47-product-preview"><img src="${src}" alt="${esc(state.label)}">${art}<div class="v47-zone-label">${esc(currentZone()[1])} · ${esc(currentZone()[2])}</div></div>`;
  }
  function colorsHtml(){
    const sw=[...state.card.querySelectorAll('.sw')];
    if(!sw.length) return '<span class="v47-note">Couleur selon le produit.</span>';
    return sw.map((e,i)=>{const c=getComputedStyle(e).backgroundColor;return `<button type="button" class="v47-swatch ${c===state.color?'active':''}" data-color="${c}" aria-label="Couleur ${i+1}" style="background:${c}"></button>`}).join('');
  }
  function renderProduct(){
    body.innerHTML=`<div class="v47-grid"><div class="v47-card">${previewHtml()}</div><div class="v47-card"><h3>${esc(state.label)}</h3>
      ${textile()?`<span class="v47-label">Taille</span><div class="v47-row">${['XS','S','M','L','XL','XXL'].map(s=>`<button class="v47-option ${state.size===s?'active':''}" data-size="${s}" type="button">${s}</button>`).join('')}</div>`:''}
      <span class="v47-label">Couleur</span><div class="v47-row">${colorsHtml()}</div>
      <span class="v47-label">Quantité</span><div class="v47-qty"><button data-q="-1" type="button">−</button><strong>${state.qty}</strong><button data-q="1" type="button">+</button></div>
      <div class="v47-actions"><button class="v47-primary" id="v47-next" type="button">CHOISIR LE VISUEL →</button></div></div></div>`;
    body.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{state.size=b.dataset.size;renderProduct();});
    body.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{state.color=b.dataset.color;renderProduct();});
    body.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{state.qty=Math.max(1,Math.min(99,state.qty+Number(b.dataset.q)));renderProduct();});
    body.querySelector('#v47-next').onclick=()=>{state.step=1;render();};
  }
  function renderVisual(){
    body.innerHTML=`<div class="v47-grid"><div class="v47-card">${previewHtml()}</div><div class="v47-card"><h3>Votre visuel</h3>
      <div class="v47-info">Importez votre image ou utilisez la génération IA déjà intégrée à la borne.</div>
      <span class="v47-label">Importer PNG / JPG / WEBP</span><input id="v47-file" class="v47-file" type="file" accept="image/png,image/jpeg,image/webp">
      <div class="v47-actions"><button class="v47-ai" id="v47-ai" type="button">✨ CRÉER AVEC L’IA</button><button class="v47-primary" id="v47-next" type="button" ${state.art?'':'disabled'}>PLACER LE VISUEL →</button></div>
      <p class="v47-note">Pour l’impression DTF, privilégiez un visuel net, idéalement avec fond transparent.</p></div></div>`;
    body.querySelector('#v47-file').onchange=e=>{ const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{state.art=r.result;renderVisual();}; r.readAsDataURL(f); };
    body.querySelector('#v47-ai').onclick=()=>{ const btn=state.card?.querySelector('.personalize'); close(); if(btn) setTimeout(()=>btn.click(),50); };
    body.querySelector('#v47-next').onclick=()=>{state.step=2;render();};
  }
  function renderPlacement(){
    const zones=textile()?ZONES.textile:ZONES.other;
    body.innerHTML=`<div class="v47-grid"><div class="v47-card">${previewHtml()}</div><div class="v47-card"><h3>Placement du visuel</h3>
      <span class="v47-label">Zone d’impression</span><div class="v47-row">${zones.map(z=>`<button type="button" class="v47-option ${state.zone===z[0]?'active':''}" data-zone="${z[0]}">${z[1]}</button>`).join('')}</div>
      <div class="v47-info" style="margin-top:12px">${esc(currentZone()[2])}</div>
      <span class="v47-label">Taille du visuel</span><input id="v47-scale" class="v47-range" type="range" min="45" max="180" value="${state.scale}">
      <span class="v47-label">Rotation</span><input id="v47-rotate" class="v47-range" type="range" min="-30" max="30" value="${state.rotate}">
      <span class="v47-label">Horizontal</span><input id="v47-x" class="v47-range" type="range" min="25" max="75" value="${state.x}">
      <span class="v47-label">Vertical</span><input id="v47-y" class="v47-range" type="range" min="20" max="75" value="${state.y}">
      <div class="v47-actions"><button class="v47-secondary" id="v47-center" type="button">RECENTRER</button><button class="v47-primary" id="v47-next" type="button">VALIDER →</button></div></div></div>`;
    body.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{state.zone=b.dataset.zone;if(state.zone==='heart'){state.x=42;state.y=36;state.scale=65}else if(state.zone==='back'){state.x=50;state.y=45;state.scale=130}else if(state.zone==='sleeve'){state.x=68;state.y=37;state.scale=48}renderPlacement();});
    ['scale','rotate','x','y'].forEach(k=>body.querySelector('#v47-'+k).oninput=e=>{state[k]=Number(e.target.value); body.querySelector('.v47-art')?.setAttribute('style',`left:${state.x}%;top:${state.y}%;width:${Math.max(10,24*state.scale/100)}%;transform:translate(-50%,-50%) rotate(${state.rotate}deg)`);});
    body.querySelector('#v47-center').onclick=()=>{state.x=50;state.y=45;state.rotate=0;renderPlacement();};
    body.querySelector('#v47-next').onclick=()=>{state.step=3;render();};
  }
  function renderValidation(){
    body.innerHTML=`<div class="v47-grid"><div class="v47-card">${previewHtml()}</div><div class="v47-card"><h3>Récapitulatif</h3><div class="v47-summary">
      <div class="v47-summary-item"><b>Produit :</b> ${esc(state.label)}</div>
      ${textile()?`<div class="v47-summary-item"><b>Taille :</b> ${esc(state.size)}</div>`:''}
      <div class="v47-summary-item"><b>Zone :</b> ${esc(currentZone()[1])} — ${esc(currentZone()[2])}</div>
      <div class="v47-summary-item"><b>Quantité :</b> ${state.qty}</div></div>
      <p class="v47-note">Le fichier d’impression sera généré séparément à la fin de la commande, aux dimensions de la zone choisie.</p>
      <div class="v47-actions"><button class="v47-secondary" id="v47-edit" type="button">MODIFIER</button><button class="v47-primary" id="v47-add" type="button">AJOUTER AU PANIER</button></div></div></div>`;
    body.querySelector('#v47-edit').onclick=()=>{state.step=0;render();};
    const addToCart=()=>{ if(textile() && state.zone==='center') state.zone='heart'; const z=currentZone(); cart.push({id:Date.now(),product:state.product,label:state.label,size:state.size,color:state.color,zone:state.zone,zoneLabel:z[1],limit:z[2],qty:state.qty,art:state.art,scale:state.scale,rotate:state.rotate,x:state.x,y:state.y});saveCart();openCart(); };
    body.querySelector('#v47-add').onclick=addToCart;
  }
  function openCart(){
    state.step=3; overlay.classList.add('open'); overlay.querySelectorAll('.v47-step').forEach((el,i)=>el.classList.toggle('active',i===3));
    body.innerHTML=`<div class="v47-card" style="max-width:900px;margin:auto"><h3>Votre panier</h3>${cart.length?`<div class="v47-summary">${cart.map((i,n)=>`<div class="v47-summary-item"><b>${esc(i.label)}</b> · ${esc(i.zoneLabel)}${TEXTILES.has(i.product)?` · ${esc(i.size)}`:''} · Qté ${i.qty} <button type="button" class="v47-secondary" data-del="${n}" style="float:right;padding:6px 10px">SUPPRIMER</button></div>`).join('')}</div><div class="v47-actions"><button class="v47-secondary" id="v47-empty" type="button">VIDER LE PANIER</button><button class="v47-secondary" id="v47-continue" type="button">CONTINUER MES ACHATS</button><button class="v47-primary" id="v47-order" type="button">VALIDER LA COMMANDE</button></div><p class="v47-note">Étape suivante : coordonnées client, paiement et génération des fichiers de production.</p>`:`<div class="v47-empty">Votre panier est vide.</div><div class="v47-actions"><button class="v47-primary" id="v47-continue" type="button">CHOISIR UN PRODUIT</button></div>`}</div>`;
    body.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.del),1);saveCart();openCart();});
    body.querySelector('#v47-empty')?.addEventListener('click',()=>{ if(confirm('Vider complètement le panier ?')){ cart=[]; saveCart(); openCart(); } });
    body.querySelector('#v47-continue')?.addEventListener('click',close);
    body.querySelector('#v47-order')?.addEventListener('click',e=>{
      e.preventDefault();
      if(typeof window.DTF_OPEN_CHECKOUT==='function'){
        window.DTF_OPEN_CHECKOUT();
      } else {
        window.dispatchEvent(new Event('dtf-open-checkout'));
      }
    });
  }

  document.addEventListener('click',e=>{ const card=e.target.closest?.('.product-card'); if(!card || e.target.closest('.v47-overlay,.v47-cart,.personalize')) return; e.preventDefault(); e.stopImmediatePropagation(); open(card); },true);
  document.addEventListener('keydown',e=>{ const card=e.target.closest?.('.product-card'); if(!card || !['Enter',' '].includes(e.key)) return; e.preventDefault(); e.stopImmediatePropagation(); open(card); },true);
  window.addEventListener('storage',e=>{ if(e.key==='dtf-v47-cart'){ try{cart=JSON.parse(e.newValue||'[]')}catch(_){cart=[]} updateCartButton(); } });
  window.addEventListener('dtf-cart-cleared',()=>{cart=[];updateCartButton();});
  updateCartButton();
})();
