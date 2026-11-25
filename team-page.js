(()=>{
  const root=document.querySelector('#teamRoot');
  if(!root)return;
  const socialData=[['instagram','instagram','Instagram'],['tiktok','tiktok','TikTok'],['snapchat','snapchat','Snapchat'],['x','x-twitter','X'],['facebook','facebook-f','Facebook']];
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function allowedImage(value,fallback){
    const image=String(value||'').trim();
    if(!image)return fallback;
    const lower=image.toLowerCase();
    if(lower.includes('unsplash.com')||lower.includes('images.unsplash.com'))return fallback;
    return image;
  }
  function people(){
    const defaults=Array.isArray(window.WD_DEFAULT_TEAM)?window.WD_DEFAULT_TEAM:[];
    const saved=window.WD?.team?WD.team():[];
    const by=new Map(saved.map(person=>[String(person.id),person]));
    const merged=defaults
      .filter(person=>person.lockedFounder||!by.get(String(person.id))?.deleted)
      .map(person=>({...person,...(by.get(String(person.id))||{}),deleted:false}));
    saved.forEach(person=>{
      if(!defaults.some(item=>String(item.id)===String(person.id))&&!person.deleted)merged.push(person);
    });
    return merged.map((person,index)=>{
      const base=defaults.find(item=>String(item.id)===String(person.id));
      const james=String(person.id)==='t4';
      return {
        ...person,
        role:james?'Web Designer · Professional Golfer':person.role,
        bio:james?base.bio:person.bio,
        image:allowedImage(person.image,base?.image||'images/placeholder-food.svg'),
        position:Number(person.position)||index+1
      };
    }).filter(person=>person.name)
      .sort((a,b)=>(a.lockedFounder||String(a.id)==='t1'?0:1)-(b.lockedFounder||String(b.id)==='t1'?0:1)||a.position-b.position||String(a.name).localeCompare(String(b.name)));
  }
  function socialLinks(person){
    const links=socialData.filter(([key])=>person[key]&&person[key]!=='#');
    if(!links.length)return'<p class="team-profile-empty">Social links will appear here when they are added.</p>';
    return`<div class="team-profile-socials">${links.map(([key,icon,label])=>`<a href="${esc(person[key])}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-${icon}"></i><span>${label}</span><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`).join('')}</div>`;
  }
  function profileModal(){
    return`<div class="team-profile-backdrop" id="teamBackdrop" aria-hidden="true"></div>
      <section class="team-profile-modal" id="teamModal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="teamModalName">
        <button class="team-profile-close" type="button" data-team-close aria-label="Close profile"><i class="fa-solid fa-xmark"></i></button>
        <div id="teamModalContent"></div>
      </section>`;
  }
  function card(person,index){
    return`<button class="team-card-v4 team-card-tone-${(index%4)+1}" type="button" data-person-id="${esc(person.id)}" aria-label="View ${esc(person.name)}'s profile">
      <span class="team-card-v4-image"><img src="${esc(person.image)}" alt="${esc(person.name)}" loading="lazy" decoding="async" onerror="this.src='images/placeholder-food.svg'"></span>
      <span class="team-card-v4-copy"><span class="team-card-v4-role">${esc(person.role||'Team')}</span><strong>${esc(person.name)}</strong><span class="team-card-v4-open">Meet ${esc(person.name.split(' ')[0])} <i class="fa-solid fa-arrow-up-right-from-square"></i></span></span>
    </button>`;
  }
  function render(){
    const list=people();
    if(!list.length){
      root.innerHTML='<p class="lede">Team profiles are being prepared. Please check back soon.</p>';
      return;
    }
    root.innerHTML=`${list.map(card).join('')}${profileModal()}`;
    root.querySelectorAll('[data-person-id]').forEach(button=>{
      button.addEventListener('click',()=>{
        const person=list.find(item=>String(item.id)===String(button.dataset.personId));
        if(person)openProfile(person);
      });
    });
    root.querySelector('[data-team-close]')?.addEventListener('click',closeProfile);
    root.querySelector('#teamBackdrop')?.addEventListener('click',closeProfile);
  }
  function openProfile(person){
    const modal=document.querySelector('#teamModal');
    const backdrop=document.querySelector('#teamBackdrop');
    const content=document.querySelector('#teamModalContent');
    if(!modal||!backdrop||!content)return;
    content.innerHTML=`<div class="team-profile-layout">
      <div class="team-profile-photo"><img src="${esc(person.image)}" alt="${esc(person.name)}"></div>
      <div class="team-profile-copy"><span class="eyebrow">${esc(person.role||'Wrap District team')}</span><h2 id="teamModalName">${esc(person.name)}</h2><div class="team-profile-about"><span>About</span><p>${esc(person.bio||'A little more about this team member will be added soon.')}</p></div><div class="team-profile-connect"><span>Find them online</span>${socialLinks(person)}</div>${String(person.id)==='t4'?'<a class="team-james-cta" href="#jvo-contact" data-open-jvo-modal>Talk to James about a website <i class="fa-solid fa-arrow-up-right-from-square"></i></a>':''}</div>
    </div>`;
    modal.classList.add('open');
    backdrop.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    backdrop.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
  }
  function closeProfile(){
    document.querySelector('#teamModal')?.classList.remove('open');
    document.querySelector('#teamBackdrop')?.classList.remove('open');
    document.querySelector('#teamModal')?.setAttribute('aria-hidden','true');
    document.querySelector('#teamBackdrop')?.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
  }
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeProfile()});
  render();
  document.addEventListener('wd:data-ready',render);
})();