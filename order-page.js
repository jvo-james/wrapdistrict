(()=>{
  const main=document.querySelector('#orderMain');
  const params=new URLSearchParams(location.search);
  const id=params.get('product')||'shawarma';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalise=x=>({...x,sizes:(x.sizes||[]).map(v=>Array.isArray(v)?v:[v.name,v.price]),extras:(x.extras||[]).map(v=>Array.isArray(v)?v:[v.name,v.price,v.image])});
  const raw=WD.products().find(x=>x.id===id)||WD.products().find(x=>!x.isDrink);
  if(!raw)return;
  const p=normalise(raw);
  if(p.available===false){
    main.innerHTML='<section class="section" style="padding-top:150px"><div class="wrap"><h1 class="section-title">Unavailable today.</h1><p class="lede">This item is taking a break right now. It stays on our menu so you know what to look forward to.</p><a class="btn btn-gold" href="menu.html">Back to menu</a></div></section>';
    return;
  }

  let size=p.sizes?.[0]||['Standard',p.from],sizeIndex=0,extras=[];
  const selectedDrinks=new Map();
  const promo=WD.activeProductPromo?.(p.id);
  const imgFor=i=>(p.sizeImages&&p.sizeImages[i])||p.image||'images/placeholder-food.svg';
  const basePrice=()=>Number(size[1]||p.from||0);
  const calc=()=>{
    const base=WD.applyUnitPromoPrice?WD.applyUnitPromoPrice(p.id,basePrice()):basePrice();
    return base+extras.reduce((s,x)=>s+Number(x[1]||0),0);
  };
  const drinks=()=>WD.products().filter(x=>x.isDrink&&x.available!==false).map(normalise);
  const drinkPrice=d=>Number(d.sizes?.[0]?.[1]??d.from??0);
  const drinkQty=id=>selectedDrinks.get(id)||0;
  const selectedDrinkCount=()=>[...selectedDrinks.values()].reduce((sum,qty)=>sum+qty,0);
  const selectedDrinkTotal=available=>available.reduce((sum,d)=>sum+(drinkQty(d.id)*drinkPrice(d)),0);

  function setDrinkQty(drinkId,qty,availableDrinks){
    const safe=Math.max(0,Math.min(20,Number(qty)||0));
    if(safe)selectedDrinks.set(drinkId,safe);else selectedDrinks.delete(drinkId);
    syncDrinkUI(availableDrinks);
  }

  function syncDrinkUI(availableDrinks){
    document.querySelectorAll('.drink-choice[data-drink]').forEach(card=>{
      const qty=drinkQty(card.dataset.drink);
      card.classList.toggle('active',qty>0);
      card.setAttribute('aria-pressed',qty>0?'true':'false');
      const qtyNode=card.querySelector('[data-drink-qty]');
      if(qtyNode)qtyNode.textContent=qty||1;
      const controls=card.querySelector('.drink-quantity');
      if(controls)controls.hidden=qty===0;
      const add=card.querySelector('.drink-select-button');
      if(add)add.textContent=qty>0?'Selected':'Add';
    });
    const clear=document.querySelector('#clearDrink');
    if(clear)clear.hidden=selectedDrinks.size===0;
    price(availableDrinks);
  }

  function render(){
    const showBack=params.get('from')==='menu'||document.referrer.includes('menu.html');
    const availableDrinks=drinks();
    [...selectedDrinks.keys()].forEach(k=>{if(!availableDrinks.some(d=>d.id===k))selectedDrinks.delete(k)});
    const stepDrink=(p.extras?.length?3:2),stepNote=stepDrink+(availableDrinks.length?1:0);

    main.innerHTML=`<section class="product-page"><div class="wrap">${showBack?'<a class="back-to-menu" href="menu.html"><i class="fa-solid fa-arrow-left"></i> Back to menu</a>':''}<div class="product-layout"><div class="product-visual"><div class="product-image"><img id="productMainImage" src="${esc(imgFor(0))}" alt="${esc(p.name)}"></div><div class="size-photo-note"><i class="fa-solid fa-camera"></i><span>Images show the selected item. Where a portion-specific photo is not available, the product photo is used.</span></div></div><div class="product-builder"><span class="eyebrow">${esc(p.category||'Build your order')}</span><h1>${esc(p.name)}</h1><p class="lede">${esc(p.description||'')}</p>${promo?`<div class="builder-promo"><b>${esc(promo.badge||promo.title||'PROMO')}</b><span>${esc(promo.message||promo.title||'Offer applied automatically')}</span></div>`:''}<div class="builder-step"><h3>01 · Choose your portion</h3><div class="choice-grid">${(p.sizes?.length?p.sizes:[[p.name,p.from]]).map((s,i)=>`<button class="choice-card ${i?'':'active'}" data-size="${i}"><img src="${esc(imgFor(i))}" onerror="this.src='images/placeholder-food.svg'" alt="${esc(p.name)} ${esc(s[0])}"><b>${esc(s[0])}</b><br><small>${WD.money(WD.applyUnitPromoPrice?WD.applyUnitPromoPrice(p.id,s[1]):s[1])}</small></button>`).join('')}</div></div>${p.extras?.length?`<div class="builder-step"><h3>02 · Make it yours</h3><div class="choice-grid">${p.extras.map((x,i)=>`<button class="choice-card" data-extra="${i}"><img src="${esc(x[2]||'images/placeholder-food.svg')}" onerror="this.src='images/placeholder-food.svg'" alt="${esc(x[0])}"><b>${esc(x[0])}</b><br><small>+ ${WD.money(x[1])}</small></button>`).join('')}</div></div>`:''}${availableDrinks.length?`<div class="builder-step drink-builder-step"><div class="builder-step-heading"><div><h3>${String(stepDrink).padStart(2,'0')} · Add drinks <span class="optional-chip">Optional</span></h3><p>Choose as many drinks as you want. Each drink is added to your cart as a separate product.</p></div><button type="button" class="drink-clear" id="clearDrink" hidden>Clear all</button></div><div class="drink-choice-grid">${availableDrinks.map(d=>`<article class="drink-choice" data-drink="${esc(d.id)}" aria-pressed="false"><button type="button" class="drink-select-area" data-drink-toggle="${esc(d.id)}" aria-label="Add ${esc(d.name)}"><span class="drink-choice-image"><img src="${esc(d.image||'images/placeholder-food.svg')}" onerror="this.src='images/placeholder-food.svg'" alt="${esc(d.name)}"></span><span class="drink-choice-copy"><b>${esc(d.name)}</b><small>${WD.money(drinkPrice(d))}</small></span><span class="drink-select-button">Add</span></button><div class="drink-quantity" hidden><span class="drink-quantity-label">Quantity</span><div class="drink-stepper"><button type="button" data-drink-minus="${esc(d.id)}" aria-label="Reduce ${esc(d.name)} quantity"><i class="fa-solid fa-minus"></i></button><strong data-drink-qty>${drinkQty(d.id)||1}</strong><button type="button" data-drink-plus="${esc(d.id)}" aria-label="Increase ${esc(d.name)} quantity"><i class="fa-solid fa-plus"></i></button></div></div><span class="drink-check"><i class="fa-solid fa-check"></i></span></article>`).join('')}</div></div>`:''}<div class="builder-step"><h3>${String(stepNote).padStart(2,'0')} · Anything we should know?</h3><div class="field"><textarea id="orderNote" placeholder="For example, no onions or extra spicy"></textarea></div></div><div class="builder-total"><div><small>Your food</small><br><b id="buildPrice">${WD.money(calc())}</b><span class="selected-drink-summary" id="selectedDrinkSummary"></span></div><button id="addBuild" class="btn btn-red">Add to cart <i class="fa-solid fa-bag-shopping"></i></button></div></div></div></div></section>`;

    document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('[data-size]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      sizeIndex=+b.dataset.size;
      size=p.sizes[sizeIndex];
      document.querySelector('#productMainImage').src=imgFor(sizeIndex);
      price(availableDrinks);
    });

    document.querySelectorAll('[data-extra]').forEach(b=>b.onclick=()=>{
      b.classList.toggle('active');
      extras=[...document.querySelectorAll('[data-extra].active')].map(x=>p.extras[+x.dataset.extra]);
      price(availableDrinks);
    });

    document.querySelectorAll('[data-drink-toggle]').forEach(b=>b.onclick=()=>{
      const drinkId=b.dataset.drinkToggle;
      setDrinkQty(drinkId,drinkQty(drinkId)>0?0:1,availableDrinks);
    });
    document.querySelectorAll('[data-drink-minus]').forEach(b=>b.onclick=()=>setDrinkQty(b.dataset.drinkMinus,drinkQty(b.dataset.drinkMinus)-1,availableDrinks));
    document.querySelectorAll('[data-drink-plus]').forEach(b=>b.onclick=()=>setDrinkQty(b.dataset.drinkPlus,drinkQty(b.dataset.drinkPlus)+1,availableDrinks));

    const clear=document.querySelector('#clearDrink');
    if(clear)clear.onclick=()=>{selectedDrinks.clear();syncDrinkUI(availableDrinks)};

    document.querySelector('#addBuild').onclick=()=>{
      const note=document.querySelector('#orderNote').value.trim();
      const detail=[size[0],...extras.map(x=>x[0]),note].filter(Boolean).join(' · ');
      WD.addCart({id:p.id,name:p.name,price:calc(),basePrice:basePrice(),detail,sizeName:size[0],extraNames:extras.map(x=>x[0]),itemNote:note,image:imgFor(sizeIndex),promoType:promo?.type||'',promoTitle:promo?.title||'',freebie:promo?.type==='free_item'?promo.freeItem||'Free Coke':''});

      availableDrinks.forEach(drink=>{
        const qty=drinkQty(drink.id);
        if(!qty)return;
        const ds=drink.sizes?.[0]||['Bottle',drink.from];
        for(let i=0;i<qty;i++){
          WD.addCart({id:drink.id,name:drink.name,price:drinkPrice(drink),basePrice:drinkPrice(drink),detail:ds[0]||'Drink',sizeName:ds[0]||'Bottle',extraNames:[],itemNote:'',image:drink.image||'images/placeholder-food.svg',isDrink:true});
        }
      });
      WD.openDrawer('#cartDrawer');
    };
    syncDrinkUI(availableDrinks);
  }

  function price(availableDrinks=drinks()){
    const node=document.querySelector('#buildPrice');
    if(node)node.textContent=WD.money(calc());
    const summary=document.querySelector('#selectedDrinkSummary');
    if(summary){
      const count=selectedDrinkCount();
      const total=selectedDrinkTotal(availableDrinks);
      summary.innerHTML=count?`<small>+ ${count} drink${count===1?'':'s'} · ${WD.money(total)} added separately</small>`:'';
    }
  }

  render();
  document.addEventListener('wd:data-ready',()=>{
    const current=WD.products().find(x=>x.id===p.id);
    if(current&&current.available!==false)render();
  });
})();
