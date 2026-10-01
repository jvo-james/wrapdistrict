(()=>{
  const $=s=>document.querySelector(s);
  const hero=$('#feedHero');
  const story=$('#feedStoryImage');
  const band=$('#feedBandImage');

  if(hero) hero.style.backgroundImage=`url("${WD_IMAGES.feedHero}")`;
  if(story) story.src=WD_IMAGES.feedStory;
  if(band) band.src=WD_IMAGES.feedVisualBand;

  const setImage=(selector,src)=>{
    const el=$(selector);
    if(el&&src) el.src=src;
  };

  setImage('#feedHeroPhotoMain',WD_IMAGES.homeFeedStreet||WD_IMAGES.feedHero);
  setImage('#feedHeroPhotoTwo',WD_IMAGES.feedGallery02||WD_IMAGES.feedVisualBand);
  setImage('#feedHeroPhotoThree',WD_IMAGES.feedGallery05||WD_IMAGES.feedStory);
  setImage('#feedSchoolOneImage',WD_IMAGES.feedGallery06||WD_IMAGES.feedGallery03);
  setImage('#feedSchoolTwoImage',WD_IMAGES.feedGallery09||WD_IMAGES.feedGallery04);

  let imgs=[];
  let lastDonation=null;

  function renderGallery(){
    const source=WD.gallery?.()||[];
    imgs=source.map(x=>typeof x==='string'?x:x.url).filter(Boolean);
    const g=$('#feedGallery');
    if(!g) return;

    if(!imgs.length){
      g.innerHTML='<div class="fts-gallery-empty">Photos from the next outreach will show up here.</div>';
      return;
    }

    const doubled=[...imgs,...imgs];
    g.innerHTML=doubled.map((x,i)=>`<button data-photo="${i%imgs.length}" aria-label="Open Feed the Street photo ${((i%imgs.length)+1)}"><img src="${x}" alt="Feed the Street moment" loading="lazy"></button>`).join('');
    g.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>openPhoto(Number(b.dataset.photo)));
  }

  const box=$('#lightbox');
  const main=$('#lightboxImage');
  const thumbs=$('#lightboxThumbs');
  let lightboxIndex=0;

  function syncLightboxScrollLock(on){
    document.body.classList.toggle('no-scroll',on);
  }

  function openPhoto(i){
    if(!imgs.length||!box||!main||!thumbs) return;
    const index=Math.max(0,Math.min(i,imgs.length-1));
    lightboxIndex=index;
    main.src=imgs[index];
    main.alt=`Feed the Street moment ${index+1}`;
    thumbs.innerHTML=imgs.map((x,n)=>`<button class="${n===index?'active':''}" data-thumb="${n}" aria-label="Open photo ${n+1}"><img src="${x}" alt=""></button>`).join('');
    box.classList.add('open');
    syncLightboxScrollLock(true);
    thumbs.querySelectorAll('[data-thumb]').forEach(b=>b.onclick=()=>openPhoto(Number(b.dataset.thumb)));
  }

  function closeLightbox(){
    box?.classList.remove('open');
    syncLightboxScrollLock(false);
  }

  $('#lightboxClose')?.addEventListener('click',closeLightbox);
  box?.addEventListener('click',e=>{
    if(e.target===box) closeLightbox();
  });

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') closeLightbox();
    if(!box?.classList.contains('open')||!imgs.length) return;
    if(e.key==='ArrowRight') openPhoto((lightboxIndex+1)%imgs.length);
    if(e.key==='ArrowLeft') openPhoto((lightboxIndex-1+imgs.length)%imgs.length);
  });

  function initQuickAmounts(){
    const amount=$('#donationForm input[name="amount"]');
    document.querySelectorAll('[data-donation-amount]').forEach(b=>{
      b.onclick=()=>{
        if(!amount) return;
        amount.value=b.dataset.donationAmount;
        amount.dispatchEvent(new Event('input',{bubbles:true}));
        amount.focus();
      };
    });
  }

  function initCounters(){
    const counters=document.querySelectorAll('[data-count]');
    const animate=el=>{
      if(el.dataset.counted==='1') return;
      el.dataset.counted='1';
      const target=Number(el.dataset.count||0);
      const duration=850;
      const start=performance.now();

      const tick=now=>{
        const progress=Math.min(1,(now-start)/duration);
        const eased=1-Math.pow(1-progress,3);
        el.textContent=Math.round(target*eased).toLocaleString();
        if(progress<1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if(!('IntersectionObserver' in window)){
      counters.forEach(animate);
      return;
    }

    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.55});

    counters.forEach(el=>observer.observe(el));
  }

  renderGallery();
  initQuickAmounts();
  initCounters();
  document.addEventListener('wd:data-ready',()=>{
    renderGallery();
  });

  document.body.insertAdjacentHTML('beforeend','<div class="payment-busy" id="donationBusy"><div class="payment-busy-card"><i class="fa-solid fa-heart fa-beat"></i><b id="donationBusyTitle">Preparing Paystack</b><span id="donationBusyText">Please keep this page open.</span></div></div>');

  const busy=(on,title='Preparing Paystack',text='Please keep this page open.')=>{
    $('#donationBusy')?.classList.toggle('open',on);
    if($('#donationBusyTitle')) $('#donationBusyTitle').textContent=title;
    if($('#donationBusyText')) $('#donationBusyText').textContent=text;
  };

  const form=$('#donationForm');
  const success=$('#donationSuccess');

  function card(d){
    if(!window.jspdf)return;
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'mm',format:'a5'});
    const w=148,h=210;
    doc.setFillColor(12,11,10);
    doc.rect(0,0,w,h,'F');
    doc.setFillColor(222,58,39);
    doc.circle(126,22,34,'F');
    doc.setFillColor(216,164,74);
    doc.circle(16,197,38,'F');
    doc.setDrawColor(216,164,74);
    doc.setLineWidth(.7);
    doc.roundedRect(9,9,130,192,7,7,'S');
    doc.setTextColor(216,164,74);
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.text('WRAP DISTRICT · FEED THE STREET',17,25);
    doc.setTextColor(255,255,255);
    doc.setFontSize(31);
    doc.text('YOU PUT',17,51);
    doc.text('CARE ON',17,64);
    doc.text('THE TABLE.',17,77);
    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    doc.setTextColor(218,208,198);
    const msg=`${d.name}, thank you for choosing to help. Your ${WD.money(d.amount)} contribution is part of the next meal we prepare and share through Feed the Street.`;
    doc.text(doc.splitTextToSize(msg,108),17,94);
    doc.setFillColor(244,235,222);
    doc.roundedRect(17,126,114,36,5,5,'F');
    doc.setTextColor(20,17,14);
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.text('YOUR CONTRIBUTION',24,138);
    doc.setFontSize(20);
    doc.text(WD.money(d.amount),24,151);
    doc.setFont('helvetica','normal');
    doc.setFontSize(7);
    doc.text(`Reference: ${d.reference}`,24,157);
    doc.setTextColor(255,255,255);
    doc.setFontSize(9);
    doc.text('Good food can travel further.',17,181);
    doc.setFontSize(7);
    doc.setTextColor(172,160,150);
    doc.text('Thank you for standing with the District.',17,188);
    doc.save(`Wrap-District-Thank-You-${d.id}.pdf`);
  }

  function show(d){
    lastDonation=d;
    $('#donationSuccessText').innerHTML=`Thank you, <strong>${d.name}</strong>. Your <strong>${WD.money(d.amount)}</strong> support is now part of the next outreach.`;
    $('#donationReference').textContent=`Payment reference: ${d.reference}`;
    success?.classList.add('open');
    syncLightboxScrollLock(true);
    setTimeout(()=>card(d),250);
  }

  document.querySelectorAll('[data-donation-close]').forEach(b=>b.onclick=()=>{
    success?.classList.remove('open');
    syncLightboxScrollLock(false);
  });

  $('#downloadThankYou')?.addEventListener('click',()=>lastDonation&&card(lastDonation));

  form.onsubmit=e=>{
    e.preventDefault();
    const fd=new FormData(form);
    const amount=Number(fd.get('amount'));
    const email=String(fd.get('email')).trim();
    const name=String(fd.get('name')||'Friend of the District').trim();
    const key=WD_CONFIG.paystackPublicKey;
    const id='FTS-'+Date.now().toString().slice(-8);

    if(!amount||amount<1)return WD.toast('Enter a valid donation amount.');
    if(!window.PaystackPop||String(key).startsWith('YOUR_'))return WD.toast('Paystack is not configured yet.');

    busy(true,'Preparing Paystack','Opening a secure payment window…');

    new PaystackPop().newTransaction({
      key,
      email,
      amount:Math.round(amount*100),
      currency:'GHS',
      channels:['card','mobile_money'],
      metadata:{
        custom_fields:[
          {display_name:'Campaign',variable_name:'campaign',value:'Feed the Street'},
          {display_name:'Donation ID',variable_name:'donation_id',value:id},
          {display_name:'Donor name',variable_name:'donor_name',value:name},
          {display_name:'Donor email',variable_name:'donor_email',value:email}
        ]
      },
      onSuccess:async t=>{
        busy(true,'Confirming your support','Payment received. We are preparing your thank-you card…');
        const vr=await fetch('/.netlify/functions/verify-donation',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({reference:t.reference})
        });
        const vj=await vr.json().catch(()=>({}));

        if(!vr.ok||!vj.ok){
          busy(false);
          return WD.toast(vj.error||'We could not verify the donation yet.');
        }

        const d={
          id:vj.donationId||id,
          name:vj.name||name,
          email:vj.email||email,
          amount:Number(vj.amount),
          reference:t.reference,
          date:new Date().toISOString(),
          status:'Paid',
          serverVerified:true
        };

        try{
          await WD.sendEmail('donation',{
            donation_id:d.id,
            donor_name:d.name,
            customer_name:d.name,
            donor_email:d.email,
            customer_email:d.email,
            amount:WD.money(d.amount),
            payment_reference:t.reference
          });
        }catch(err){
          console.warn(err);
        }

        form.reset();
        busy(false);
        show(d);
      },
      onCancel:()=>{
        busy(false);
        WD.toast('Donation payment was not completed.');
      },
      onError:err=>{
        busy(false);
        WD.toast(err?.message||'Payment could not start.');
      }
    });
  };
})();