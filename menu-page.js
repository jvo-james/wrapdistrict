(()=>{
  const grid=document.querySelector('#menuGrid');
  if(!grid)return;
  const filters=[...document.querySelectorAll('[data-menu-filter]')];
  const result=document.querySelector('#menuResultCount');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let activeFilter='all';
  const products=()=>{
    const list=window.WD?.products?.()||window.WD_PRODUCTS||[];
    return Array.isArray(list)?list:[];
  };
  const groupFor=p=>{
    if(['shawarma','burger'].includes(p.id))return'wraps';
    if(['loaded-fries','loaded-angwamo','loaded-jollof'].includes(p.id))return'loaded';
    if(['fried-rice','noodles'].includes(p.id))return'plates';
    if(p.id==='salad')return'fresh';
    return'plates';
  };
  function ordered(){
    const by=new Map(products().map(p=>[p.id,p]));
    const ids=window.WD_MENU_ORDER||[];
    const listed=ids.map(id=>by.get(id)).filter(Boolean);
    return listed.length?listed:products().filter(p=>!p.isDrink);
  }
  function render(){
    const all=products();
    const menuItems=activeFilter==='drinks'
      ? all.filter(p=>p.isDrink)
      : ordered().filter(p=>!p.isDrink&&!p.hiddenFromMenu);
    const shown=menuItems.filter(p=>activeFilter==='all'||activeFilter==='drinks'||groupFor(p)===activeFilter);
    if(result)result.textContent=`${shown.length} ${shown.length===1?(activeFilter==='drinks'?'drink':'dish'):(activeFilter==='drinks'?'drinks':'dishes')} to choose from`;
    grid.innerHTML=shown.map(p=>{
      const unavailable=p.available===false;
      const promo=window.WD?.activeProductPromo?.(p.id);
      const href=`order.html?product=${encodeURIComponent(p.id)}&from=menu`;
      const promoMarkup=promo?`<span class="menu-card-v4-promo"><i class="fa-solid fa-bolt"></i> ${esc(promo.badge||window.WD.promoOfferLabel(promo))}</span>`:'';
      const price=window.WD?.productPriceLabel?.(p)||`From ${window.WD?.money?.(p.from)||`GHS ${Number(p.from||0).toFixed(2)}`}`;
      return `<article class="menu-card-v4 ${unavailable?'is-unavailable':''} ${promo?'has-live-promo':''}" ${unavailable?'':`data-href="${href}" tabindex="0" role="link" aria-label="Build ${esc(p.name)}"`}>
        <div class="menu-card-v4-image">
          <img src="${esc(p.image||'images/placeholder-food.svg')}" alt="${esc(p.name)}" loading="lazy" decoding="async" onerror="this.src='images/placeholder-food.svg'">
          ${promoMarkup}
          ${unavailable?'<span class="menu-card-v4-unavailable">Unavailable today</span>':'<span class="menu-card-v4-open"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>'}
        </div>
        <div class="menu-card-v4-copy">
          <div><span class="menu-card-v4-category">${esc(p.category||(p.isDrink?'Drinks':'From the kitchen'))}</span><h3>${esc(p.name)}</h3><p>${esc(p.tagline||p.description||'Made fresh when you order.')}</p></div>
          <div class="menu-card-v4-bottom"><strong>${esc(price)}</strong>${unavailable?'':`<span>${p.isDrink?'Add to order':'Build yours'} <i class="fa-solid fa-arrow-right"></i></span>`}</div>
        </div>
      </article>`;
    }).join('')||'<div class="menu-v4-empty"><h3>Nothing in this section just yet.</h3><p>Choose another category to see what is cooking.</p></div>';
    grid.querySelectorAll('[data-href]').forEach(card=>{
      const go=event=>{if(event.target.closest('a,button'))return;location.href=card.dataset.href};
      card.addEventListener('click',go);
      card.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();location.href=card.dataset.href}
      });
    });
  }
  filters.forEach(button=>button.addEventListener('click',()=>{
    activeFilter=button.dataset.menuFilter;
    filters.forEach(item=>{
      const selected=item===button;
      item.classList.toggle('active',selected);
      item.setAttribute('aria-pressed',selected?'true':'false');
    });
    render();
  }));
  render();
  document.addEventListener('wd:data-ready',render);
})();
