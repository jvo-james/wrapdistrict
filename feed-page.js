(()=>{
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  let galleryItems=[];
  let lastDonation=null;

  const imageRows=()=>{
    try{
      return (window.WD?.gallery?.()||[]).map((item,index)=>{
        if(typeof item==='string')return{id:`legacy-${index}`,url:item,eventId:'may-2026'};
        return{...item,url:item?.url||'',eventId:item?.eventId||'may-2026'};
      }).filter(item=>item.url);
    }catch{return[]}
  };

  const lightbox=$('#lightbox');
  const lightboxImage=$('#lightboxImage');
  const lightboxThumbs=$('#lightboxThumbs');

  function closePhoto(){
    lightbox?.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }
  function openPhoto(index){
    if(!galleryItems.length||!lightbox||!lightboxImage||!lightboxThumbs)return;
    const current=Math.max(0,Math.min(index,galleryItems.length-1));
    lightboxImage.src=galleryItems[current].url;
    lightboxThumbs.innerHTML=galleryItems.map((item,i)=>`<button type="button" class="${i===current?'active':''}" data-thumb="${i}" aria-label="Open photo ${i+1}"><img src="${item.url}" alt="" loading="lazy" decoding="async"></button>`).join('');
    lightbox.classList.add('open');
    document.body.classList.add('no-scroll');
    lightboxThumbs.querySelectorAll('[data-thumb]').forEach(button=>button.addEventListener('click',()=>openPhoto(Number(button.dataset.thumb))));
  }
  function renderEventGallery(targetId,eventId,emptyText){
    const root=$(targetId);
    if(!root)return;
    const matches=galleryItems.map((item,index)=>({...item,index})).filter(item=>item.eventId===eventId);
    const visible=matches.slice(0,8);
    if(!visible.length){
      root.innerHTML=`<div class="fts-gallery-empty"><i class="fa-regular fa-images"></i><p>${emptyText}</p><a href="feed-gallery.html">Visit the full gallery <i class="fa-solid fa-arrow-right"></i></a></div>`;
      return;
    }
    root.innerHTML=visible.map((item,index)=>`<button type="button" class="fts-photo fts-photo-${(index%4)+1}" data-photo="${item.index}" aria-label="Open outreach photo ${index+1}"><img src="${item.url}" alt="Feed the Street outreach moment" loading="lazy" decoding="async"><span class="fts-photo-open"><i class="fa-solid fa-expand"></i></span></button>`).join('');
    root.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>openPhoto(Number(button.dataset.photo))));
  }
  function renderGalleries(){
    galleryItems=imageRows();
    renderEventGallery('#mayGallery','may-2026','Photos from the first outreach will appear here.');
    renderEventGallery('#octoberGallery','october-2026','The October photo collection will appear here as the team adds it in District Control.');
  }
  $('#lightboxClose')?.addEventListener('click',closePhoto);
  lightbox?.addEventListener('click',event=>{if(event.target===lightbox)closePhoto()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closePhoto()});
  renderGalleries();
  document.addEventListener('wd:data-ready',renderGalleries);

  document.body.insertAdjacentHTML('beforeend','<div class="payment-busy" id="donationBusy"><div class="payment-busy-card"><i class="fa-solid fa-heart"></i><b id="donationBusyTitle">Preparing Paystack</b><span id="donationBusyText">Please keep this page open.</span></div></div>');
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

  $$('[data-donation-amount]').forEach(button=>button.addEventListener('click',()=>{
    if(!amountInput)return;
    amountInput.value=button.dataset.donationAmount;
    $$('[data-donation-amount]').forEach(item=>item.classList.toggle('selected',item===button));
    amountInput.focus();
  }));

  function thankYouCard(donation){
    if(!window.jspdf)return;
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'mm',format:'a5'}),width=148,height=210;
    doc.setFillColor(12,11,10);doc.rect(0,0,width,height,'F');
    doc.setFillColor(227,60,42);doc.circle(126,22,34,'F');
    doc.setFillColor(216,164,74);doc.circle(16,197,38,'F');
    doc.setDrawColor(216,164,74);doc.setLineWidth(.7);doc.roundedRect(9,9,130,192,7,7,'S');
    doc.setTextColor(216,164,74);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('WRAP DISTRICT · FEED THE STREET',17,25);
    doc.setTextColor(255,255,255);doc.setFontSize(29);doc.text('YOU HELPED',17,51);doc.text('US SHOW UP.',17,64);
    doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(218,208,198);
    const message=`${donation.name}, thank you for standing with Feed the Street. Your ${WD.money(donation.amount)} contribution will help us prepare useful support for the next outreach.`;
    doc.text(doc.splitTextToSize(message,108),17,83);
    doc.setFillColor(244,235,222);doc.roundedRect(17,124,114,36,5,5,'F');
    doc.setTextColor(20,17,14);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('YOUR CONTRIBUTION',24,137);
    doc.setFontSize(20);doc.text(WD.money(donation.amount),24,151);
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(`Reference: ${donation.reference}`,24,157);
    doc.setTextColor(255,255,255);doc.setFontSize(9);doc.text('Care grows when it is shared.',17,181);
    doc.setFontSize(7);doc.setTextColor(172,160,150);doc.text('Thank you for standing with the District.',17,188);
    doc.save(`Wrap-District-Thank-You-${donation.id}.pdf`);
  }
  function showSuccess(donation){
    lastDonation=donation;
    $('#donationSuccessText').innerHTML=`Thank you, <strong>${donation.name}</strong>. Your <strong>${WD.money(donation.amount)}</strong> contribution will help us prepare for the next outreach.`;
    $('#donationReference').textContent=`Payment reference: ${donation.reference}`;
    success.classList.add('open');
    document.body.classList.add('no-scroll');
    setTimeout(()=>thankYouCard(donation),250);
  }
  $$('[data-donation-close]').forEach(button=>button.addEventListener('click',()=>{
    success?.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }));
  $('#downloadThankYou')?.addEventListener('click',()=>lastDonation&&thankYouCard(lastDonation));

  if(form){
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const fields=new FormData(form);
      const amount=Number(fields.get('amount'));
      const email=String(fields.get('email')||'').trim();
      const name=String(fields.get('name')||'Friend of the District').trim();
      const key=WD_CONFIG.paystackPublicKey;
      const id='FTS-'+Date.now().toString().slice(-8);
      if(!amount||amount<1)return WD.toast('Enter a valid contribution amount.');
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
        onSuccess:async transaction=>{
          try{
            busy(true,'Confirming your support','Payment received. We are preparing your thank-you card…');
            const response=await fetch('/.netlify/functions/verify-donation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference:transaction.reference})});
            const result=await response.json().catch(()=>({}));
            if(!response.ok||!result.ok){busy(false);return WD.toast(result.error||'We could not verify the contribution yet.')}
            const donation={id:result.donationId||id,name:result.name||name,email:result.email||email,amount:Number(result.amount),reference:transaction.reference,date:new Date().toISOString(),status:'Paid',serverVerified:true};
            try{await WD.sendEmail('donation',{donation_id:donation.id,donor_name:donation.name,customer_name:donation.name,donor_email:donation.email,customer_email:donation.email,amount:WD.money(donation.amount),payment_reference:transaction.reference})}catch(error){console.warn(error)}
            form.reset();
            $$('[data-donation-amount]').forEach(button=>button.classList.remove('selected'));
            busy(false);
            showSuccess(donation);
          }catch(error){
            console.error(error);busy(false);WD.toast('Something went wrong while confirming the contribution.');
          }
        },
        onCancel:()=>{busy(false);WD.toast('The contribution payment was not completed.')},
        onError:error=>{busy(false);WD.toast(error?.message||'Payment could not start.')}
      });
    });
  }
})();