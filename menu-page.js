(()=>{
  const grid=document.querySelector('#menuGrid');
  if(!grid)return;
  const filters=[...document.querySelectorAll('[data-menu-filter]')];
  const result=document.querySelector('#menuResultCount');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let activeFilter='all';
  const groupFor=p=>{
    if(['shawarma','burger'].includes(p.id))return'wraps';
    if(['loaded-fries','loaded-angwamo','loaded-jollof'].includes(p.id))return'loaded';
    if(['fried-rice','noodles'].includes(p.id))return'plates';
    if(p.id==='salad')return'fresh';
    return'plates';
  };
  function ordered(){
    const by=new Map(WD.products().map(p=>[p.id,p]));
    return (window.WD_MENU_ORDER||[]).map(id=>by.get(id)).filter(Boolean);
  }
  function render(){
    const products=ordered().filter(p=>!p.isDrink&&!p.hiddenFromMenu);
    const shown=products.filter(p=>activeFilter==='all'||groupFor(p)===activeFilter);
    result.textContent=`${shown.length} ${shown.length===1?'dish':'dishes'} to choose from`;
    grid.innerHTML=shown.map(p=>{
      const unavailable=p.available===false;
      const promo=WD.activeProductPromo?.(p.id);
      const href=`order.html?product=${encodeURIComponent(p.id)}&from=menu`;
      const promoMarkup=promo?`<span class="menu-card-v4-promo"><i class="fa-solid fa-bolt"></i> ${esc(promo.badge||WD.promoOfferLabel(promo))}</span>`:'';
      return `<article class="menu-card-v4 ${unavailable?'is-unavailable':''} ${promo?'has-live-promo':''}" ${unavailable?'':`data-href="${href}" tabindex="0" role="link" aria-label="Build ${esc(p.name)}"`}>
        <div class="menu-card-v4-image">
          <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async" onerror="this.src='images/placeholder-food.svg'">
          ${promoMarkup}
          ${unavailable?'<span class="menu-card-v4-unavailable">Unavailable today</span>':'<span class="menu-card-v4-open"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>'}
        </div>
        <div class="menu-card-v4-copy">
          <div><span class="menu-card-v4-category">${esc(p.category||'From the kitchen')}</span><h3>${esc(p.name)}</h3><p>${esc(p.tagline||p.description||'Made fresh when you order.')}</p></div>
          <div class="menu-card-v4-bottom"><strong>${WD.productPriceLabel?.(p)||`From ${WD.money(p.from)}`}</strong>${unavailable?'':`<span>Build yours <i class="fa-solid fa-arrow-right"></i></span>`}</div>
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