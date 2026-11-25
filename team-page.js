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
    const saved=window.WD?.team?window.WD.team():[];
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
        role:james?'Web Designer · Professional Golfer':(String(person.id)==='t1'?'Founder':person.role),
        bio:james?(base?.bio||person.bio):person.bio,
        image:allowedImage(person.image,base?.image||'images/placeholder-food.svg'),
        position:Number(person.position)||index+1
      };
    }).filter(person=>person.name)
      .sort((a,b)=>(a.lockedFounder||String(a.id)==='t1'?0:1)-(b.lockedFounder||String(b.id)==='t1'?0:1)||a.position-b.position||String(a.name).localeCompare(String(b.name)));
  }
  function socialLinks(person){
    const links=socialData.filter(([key])=>person[key]&&person[key]!=='#');
    if(!links.length)return'<p class="team-profile-empty-v5">Social links will appear here when they are added.</p>';
    return`<div class="team-profile-socials-v5">${links.map(([key,icon,label])=>`<a href="${esc(person[key])}" target="_blank" rel="noopener noreferrer"><span><i class="fa-brands fa-${icon}"></i>${label}</span><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`).join('')}</div>`;
  }
  function founderCard(person){
    return`<button class="team-founder-feature-v5" type="button" data-person-id="${esc(person.id)}" aria-label="View ${esc(person.name)}'s profile">
      <span class="team-founder-image-v5"><img src="${esc(person.image)}" alt="${esc(person.name)}" loading="lazy" decoding="async" onerror="this.src='images/placeholder-food.svg'"></span>
      <span class="team-founder-copy-v5">
        <span class="team-founder-kicker-v5"><i class="fa-solid fa-crown"></i> Founder</span>
        <strong>${esc(person.name)}</strong>
        <span class="team-founder-description-v5">The person who started Wrap District and keeps the vision moving.</span>
        <span class="team-founder-open-v5">Meet ${esc(person.name.split(' ')[0])} <i class="fa-solid fa-arrow-right"></i></span>
      </span>
    </button>`;
  }
  function memberCard(person,index){
    return`<button class="team-card-v4 team-card-tone-${(index%4)+1}" type="button" data-person-id="${esc(person.id)}" aria-label="View ${esc(person.name)}'s profile">
      <span class="team-card-v4-image"><img src="${esc(person.image)}" alt="${esc(person.name)}" loading="lazy" decoding="async" onerror="this.src='images/placeholder-food.svg'"></span>
      <span class="team-card-v4-copy"><span class="team-card-v4-role">${esc(person.role||'Team')}</span><strong>${esc(person.name)}</strong><span class="team-card-v4-open">Meet ${esc(person.name.split(' ')[0])} <i class="fa-solid fa-arrow-up-right-from-square"></i></span></span>
    </button>`;
  }
  function profileDrawer(){
    return`<div class="team-profile-backdrop-v5" id="teamBackdrop" aria-hidden="true"></div>
      <aside class="team-profile-drawer-v5" id="teamDrawer" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="teamDrawerName" tabindex="-1">
        <button class="team-profile-close-v5" type="button" data-team-close aria-label="Close profile"><i class="fa-solid fa-xmark"></i></button>
        <div id="teamDrawerContent"></div>
      </aside>`;
  }
  function render(){
    const list=people();
    if(!list.length){
      root.innerHTML='<p class="lede">Team profiles are being prepared. Please check back soon.</p>';
      return;
    }
    const founder=list.find(person=>person.lockedFounder||String(person.id)==='t1');
    const members=list.filter(person=>person!==founder);
    root.innerHTML=`${founder?`<section class="team-founder-section-v5"><div class="team-founder-section-head-v5"><span class="eyebrow">The founder</span><p>It started with one idea and a lot of work.</p></div>${founderCard(founder)}</section>`:''}
      ${members.length?`<section class="team-members-section-v5"><div class="team-members-head-v5"><div><span class="eyebrow">The people behind the work</span><h3>Meet the crew.</h3></div><p>Get to know the people who make the District what it is.</p></div><div class="team-members-grid-v5">${members.map(memberCard).join('')}</div></section>`:''}
      ${profileDrawer()}`;
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
    const drawer=document.querySelector('#teamDrawer');
    const backdrop=document.querySelector('#teamBackdrop');
    const content=document.querySelector('#teamDrawerContent');
    if(!drawer||!backdrop||!content)return;
    const isFounder=person.lockedFounder||String(person.id)==='t1';
    content.innerHTML=`<div class="team-profile-layout-v5">
      <div class="team-profile-photo-v5"><img src="${esc(person.image)}" alt="${esc(person.name)}" decoding="async"><span>${isFounder?'Founder':'Wrap District team'}</span></div>
      <div class="team-profile-copy-v5"><span class="eyebrow">${esc(person.role||'Wrap District team')}</span><h2 id="teamDrawerName">${esc(person.name)}</h2><div class="team-profile-about-v5"><span>About</span><p>${esc(person.bio||'A little more about this team member will be added soon.')}</p></div><div class="team-profile-connect-v5"><span>Find them online</span>${socialLinks(person)}</div>${String(person.id)==='t4'?'<a class="team-james-cta" href="#jvo-contact" data-open-jvo-modal>Talk to James about a website <i class="fa-solid fa-arrow-up-right-from-square"></i></a>':''}</div>
    </div>`;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden','false');
    backdrop.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
    drawer.focus({preventScroll:true});
  }
  function closeProfile(){
    document.querySelector('#teamDrawer')?.classList.remove('open');
    document.querySelector('#teamBackdrop')?.classList.remove('open');
    document.querySelector('#teamDrawer')?.setAttribute('aria-hidden','true');
    document.querySelector('#teamBackdrop')?.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
  }
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeProfile()});
  render();
  document.addEventListener('wd:data-ready',render);
})();
