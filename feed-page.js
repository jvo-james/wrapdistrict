(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const hero=$('#feedHero');
  const storyImage=$('#feedStoryImage');
  const bandImage=$('#feedBandImage');

  if(hero&&window.WD_IMAGES) hero.style.backgroundImage=`url("${WD_IMAGES.feedHero}")`;
  if(storyImage&&window.WD_IMAGES) storyImage.src=WD_IMAGES.feedStory;
  if(bandImage&&window.WD_IMAGES) bandImage.src=WD_IMAGES.feedVisualBand;

  let imgs=[];
  let lastDonation=null;

  const getGallery=()=>{
    try{return (window.WD?.gallery?.()||[]).map(x=>typeof x==='string'?x:x?.url).filter(Boolean)}
    catch{return []}
  };

  const lightbox=$('#lightbox');
  const lightboxImage=$('#lightboxImage');
  const lightboxThumbs=$('#lightboxThumbs');

  function closePhoto(){
    lightbox?.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  function openPhoto(index){
    if(!imgs.length||!lightbox||!lightboxImage||!lightboxThumbs)return;
    const safeIndex=Math.max(0,Math.min(index,imgs.length-1));
    lightboxImage.src=imgs[safeIndex];
    lightboxThumbs.innerHTML=imgs.map((src,i)=>`<button type="button" class="${i===safeIndex?'active':''}" data-thumb="${i}" aria-label="Open photo ${i+1}"><img src="${src}" alt="" loading="lazy"></button>`).join('');
    lightbox.classList.add('open');
    document.body.classList.add('no-scroll');
    lightboxThumbs.querySelectorAll('[data-thumb]').forEach(btn=>btn.addEventListener('click',()=>openPhoto(Number(btn.dataset.thumb))));
  }

  function renderGallery(){
    const gallery=$('#feedGallery');
    if(!gallery)return;
    imgs=getGallery();
    if(!imgs.length){
      gallery.innerHTML='<div class="feed-v2-gallery-empty">New outreach photos will appear here soon.</div>';
      return;
    }
    const visible=imgs.slice(0,8);
    gallery.innerHTML=visible.map((src,i)=>`<button type="button" class="feed-v2-gallery-item item-${i+1}" data-photo="${i}" aria-label="Open Feed the Street photo ${i+1}"><img src="${src}" alt="Feed the Street moment ${i+1}" loading="lazy"><span>${i+1}</span></button>`).join('');
    gallery.querySelectorAll('[data-photo]').forEach(btn=>btn.addEventListener('click',()=>openPhoto(Number(btn.dataset.photo))));
  }

  $('#lightboxClose')?.addEventListener('click',closePhoto);
  lightbox?.addEventListener('click',event=>{if(event.target===lightbox)closePhoto()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closePhoto()});
  renderGallery();
  document.addEventListener('wd:data-ready',renderGallery);

  document.body.insertAdjacentHTML('beforeend','<div class="payment-busy" id="donationBusy"><div class="payment-busy-card"><i class="fa-solid fa-heart fa-beat"></i><b id="donationBusyTitle">Preparing Paystack</b><span id="donationBusyText">Please keep this page open.</span></div></div>');

  const busy=(on,title='Preparing Paystack',text='Please keep this page open.')=>{
    const box=$('#donationBusy');
    if(!box)return;
    box.classList.toggle('open',on);
    $('#donationBusyTitle').textContent=title;
    $('#donationBusyText').textContent=text;
  };

  const form=$('#donationForm');
  const success=$('#donationSuccess');
  const amountInput=form?.querySelector('input[name="amount"]');

  $$('[data-donation-amount]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!amountInput)return;
    amountInput.value=btn.dataset.donationAmount;
    $$('[data-donation-amount]').forEach(x=>x.classList.toggle('selected',x===btn));
    amountInput.focus();
  }));

  function card(d){
    if(!window.jspdf)return;
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'mm',format:'a5'}),w=148,h=210;
    doc.setFillColor(12,11,10);doc.rect(0,0,w,h,'F');
    doc.setFillColor(222,58,39);doc.circle(126,22,34,'F');
    doc.setFillColor(216,164,74);doc.circle(16,197,38,'F');
    doc.setDrawColor(216,164,74);doc.setLineWidth(.7);doc.roundedRect(9,9,130,192,7,7,'S');
    doc.setTextColor(216,164,74);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('WRAP DISTRICT · FEED THE STREET',17,25);
    doc.setTextColor(255,255,255);doc.setFontSize(31);doc.text('YOU PUT',17,51);doc.text('CARE ON',17,64);doc.text('THE TABLE.',17,77);
    doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(218,208,198);
    const msg=`${d.name}, thank you for choosing to help. Your ${WD.money(d.amount)} contribution is part of the next meal we prepare and share through Feed the Street.`;
    doc.text(doc.splitTextToSize(msg,108),17,94);
    doc.setFillColor(244,235,222);doc.roundedRect(17,126,114,36,5,5,'F');
    doc.setTextColor(20,17,14);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('YOUR CONTRIBUTION',24,138);
    doc.setFontSize(20);doc.text(WD.money(d.amount),24,151);
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(`Reference: ${d.reference}`,24,157);
    doc.setTextColor(255,255,255);doc.setFontSize(9);doc.text('Good food can travel further.',17,181);
    doc.setFontSize(7);doc.setTextColor(172,160,150);doc.text('Thank you for standing with the District.',17,188);
    doc.save(`Wrap-District-Thank-You-${d.id}.pdf`);
  }

  function show(d){
    lastDonation=d;
    $('#donationSuccessText').innerHTML=`Thank you, <strong>${d.name}</strong>. Your <strong>${WD.money(d.amount)}</strong> support is now part of the next outreach.`;
    $('#donationReference').textContent=`Payment reference: ${d.reference}`;
    success.classList.add('open');
    document.body.classList.add('no-scroll');
    setTimeout(()=>card(d),250);
  }

  $$('[data-donation-close]').forEach(btn=>btn.addEventListener('click',()=>{
    success?.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }));
  $('#downloadThankYou')?.addEventListener('click',()=>lastDonation&&card(lastDonation));

  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const fd=new FormData(form);
      const amount=Number(fd.get('amount'));
      const email=String(fd.get('email')||'').trim();
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
        metadata:{custom_fields:[
          {display_name:'Campaign',variable_name:'campaign',value:'Feed the Street'},
          {display_name:'Donation ID',variable_name:'donation_id',value:id},
          {display_name:'Donor name',variable_name:'donor_name',value:name},
          {display_name:'Donor email',variable_name:'donor_email',value:email}
        ]},
        onSuccess:async t=>{
          try{
            busy(true,'Confirming your support','Payment received. We are preparing your thank-you card…');
            const vr=await fetch('/.netlify/functions/verify-donation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference:t.reference})});
            const vj=await vr.json().catch(()=>({}));
            if(!vr.ok||!vj.ok){busy(false);return WD.toast(vj.error||'We could not verify the donation yet.')}
            const d={id:vj.donationId||id,name:vj.name||name,email:vj.email||email,amount:Number(vj.amount),reference:t.reference,date:new Date().toISOString(),status:'Paid',serverVerified:true};
            try{await WD.sendEmail('donation',{donation_id:d.id,donor_name:d.name,customer_name:d.name,donor_email:d.email,customer_email:d.email,amount:WD.money(d.amount),payment_reference:t.reference})}catch(err){console.warn(err)}
            form.reset();
            $$('[data-donation-amount]').forEach(x=>x.classList.remove('selected'));
            busy(false);
            show(d);
          }catch(err){
            console.error(err);busy(false);WD.toast('Something went wrong while confirming the payment.');
          }
        },
        onCancel:()=>{busy(false);WD.toast('Donation payment was not completed.')},
        onError:err=>{busy(false);WD.toast(err?.message||'Payment could not start.')}
      });
    });
  }
})();
