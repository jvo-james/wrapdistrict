(()=>{
  const grid=document.querySelector('#fullFeedGallery');
  const box=document.querySelector('#galleryLightbox');
  const main=document.querySelector('#galleryImage');
  const thumbs=document.querySelector('#galleryThumbs');
  if(!grid||!box||!main||!thumbs)return;
  let items=[];
  const rows=()=>WD.gallery().map((item,index)=>{
    if(typeof item==='string')return{url:item,eventId:'may-2026',id:`legacy-${index}`};
    return{...item,eventId:item.eventId||'may-2026'};
  }).filter(item=>item.url);
  function render(){
    items=rows();
    const labels={'may-2026':'May 2026 outreach','october-2026':'October 2026 outreach','december-2026':'Boxing Day 2026'};
    grid.innerHTML=items.length?items.map((item,index)=>`<button type="button" data-gallery-photo="${index}" class="full-feed-item"><img src="${item.url}" alt="Feed the Street community outreach" loading="lazy" decoding="async"><span>${labels[item.eventId]||'Feed the Street'}</span></button>`).join(''):'<p class="empty-state">Outreach photographs will appear here as they are added by the team.</p>';
    grid.querySelectorAll('[data-gallery-photo]').forEach(button=>button.addEventListener('click',()=>open(Number(button.dataset.galleryPhoto))));
  }
  function open(index){
    const current=Math.max(0,Math.min(index,items.length-1));
    main.src=items[current].url;
    thumbs.innerHTML=items.map((item,i)=>`<button type="button" class="${i===current?'active':''}" data-thumb="${i}" aria-label="Open photo ${i+1}"><img src="${item.url}" alt="" loading="lazy"></button>`).join('');
    box.classList.add('open');
    document.body.classList.add('no-scroll');
    thumbs.querySelectorAll('[data-thumb]').forEach(button=>button.addEventListener('click',()=>open(Number(button.dataset.thumb))));
  }
  function close(){box.classList.remove('open');document.body.classList.remove('no-scroll')}
  document.querySelector('#galleryClose')?.addEventListener('click',close);
  box.addEventListener('click',event=>{if(event.target===box)close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  render();
  document.addEventListener('wd:data-ready',render);
})();