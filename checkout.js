(() => {
  const cart=WD.cart();
  const subtotal=cart.reduce((s,x)=>s+Number(x.price||0)*Number(x.qty||0),0);
  const fee=Math.round(subtotal*.0295*100)/100;
  const total=Math.round((subtotal+fee)*100)/100;
  const $=s=>document.querySelector(s);
  const ABANDONED_KEY='wd_abandoned_cart_id';
  let mode='delivery',saveTimer=null,paymentInProgress=false;

  $('#checkoutItems').innerHTML=cart.length?cart.map(x=>`<div class="checkout-item"><img src="${x.image}" alt=""><div><b>${x.name}</b><br><small>${x.detail||''}</small></div><b>${WD.money(Number(x.price||0)*Number(x.qty||0))}</b></div>`).join(''):'<p>Your cart is empty. <a href="menu.html">Choose something first.</a></p>';
  $('#subtotal').textContent=WD.money(subtotal);$('#fee').textContent=WD.money(fee);$('#total').textContent=WD.money(total);

  const form=$('#checkoutForm'),button=$('#payButton');
  function abandonedId(){let id=localStorage.getItem(ABANDONED_KEY);if(!id){id='CART-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();localStorage.setItem(ABANDONED_KEY,id)}return id}
  function normalisePhone(value=''){let d=String(value||'').replace(/\D/g,'');if(d.startsWith('0')&&d.length>=10)d='233'+d.slice(1);return d}
  function orderItemsSummary(){return cart.map(x=>`${Number(x.qty||1)} × ${x.name}${x.detail?` · ${x.detail}`:''}`).join(' | ')}
  function formPayload(){const fd=new FormData(form);return {name:String(fd.get('name')||'').trim(),email:String(fd.get('email')||'').trim(),phone:String(fd.get('phone')||'').trim(),normalizedPhone:normalisePhone(fd.get('phone')),address:mode==='delivery'?String(fd.get('address')||'').trim():'',note:String(fd.get('note')||'').trim(),fulfilment:mode,type:mode,items:cart,itemsSummary:orderItemsSummary(),subtotal,processingFee:fee,total}}
  async function saveAbandoned(){if(paymentInProgress||!cart.length||!form)return;const p=formPayload();if(p.normalizedPhone.length<10&&!p.email)return;const id=abandonedId();try{await WD_DB.save('abandonedCarts',id,{id,status:'active',...p,updatedAt:new Date().toISOString()},'wdAbandoned')}catch(err){console.warn('[Wrap District] abandoned cart save failed',err)}}
  function queueAbandoned(){clearTimeout(saveTimer);saveTimer=setTimeout(saveAbandoned,700)}
  function refresh(){const valid=form.checkValidity()&&(mode==='pickup'||form.address.value.trim());button.classList.toggle('ready',!!valid);button.disabled=paymentInProgress;button.querySelector('span:last-child').textContent=paymentInProgress?'Waiting for payment confirmation…':valid?'Pay securely with Paystack':'Complete your details to pay'}

  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-mode]').forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;$('#addressField').classList.toggle('hidden',mode==='pickup');queueAbandoned();refresh()});
  form.addEventListener('input',()=>{queueAbandoned();refresh()});
  form.addEventListener('change',()=>{queueAbandoned();refresh()});
  refresh();

  async function secureFinalise(order,reference){
    const endpoint=String(WD_CONFIG.secureOrderEndpoint||'/.netlify/functions/verify-payment').trim();
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order,reference})});
    const body=await res.json().catch(()=>({}));
    if(!res.ok||!body.ok)throw new Error(body.error||`Verification failed (${res.status})`);
    return body;
  }

  form.onsubmit=async e=>{
    e.preventDefault();
    if(paymentInProgress)return;
    if(!cart.length)return WD.toast('Your cart is empty.');
    if(WD.store.get('wdOpen',true)===false)return WD.toast('Orders are temporarily paused.');
    if(mode==='delivery'&&!form.address.value.trim())return WD.toast('Add your delivery address.');
    const key=WD_CONFIG.paystackPublicKey;
    if(!window.PaystackPop||String(key).startsWith('YOUR_'))return WD.toast('Paystack is not configured yet. Add your public key in config.js.');

    const p=formPayload(),orderId='WD-'+Date.now().toString().slice(-8)+'-'+Math.random().toString(36).slice(2,5).toUpperCase(),abandonedCartId=abandonedId();
    const record={id:orderId,customer:p.name,...p,payment:'Pending',paymentStatus:'Pending',status:'Awaiting Payment',date:new Date().toISOString(),createdAt:new Date().toISOString(),abandonedCartId};

    paymentInProgress=true;refresh();button.querySelector('span:last-child').textContent='Saving your order…';
    try{
      await WD_DB.save('orders',orderId,record,'wdOrders');
    }catch(err){paymentInProgress=false;refresh();console.error(err);return WD.toast('We could not prepare your order. Please check your connection and try again.')}

    button.querySelector('span:last-child').textContent='Opening secure payment…';
    const pop=new PaystackPop();
    pop.newTransaction({
      key,email:record.email,amount:Math.round(total*100),currency:'GHS',channels:['card','mobile_money'],
      metadata:{order_id:orderId,custom_fields:[{display_name:'Order',variable_name:'order_id',value:orderId},{display_name:'Fulfilment',variable_name:'fulfilment',value:mode}]},
      onSuccess:async t=>{
        const reference=t.reference||t.trxref||'';
        const paidOrder={...record,payment:'Paid',paymentStatus:'Paid',status:'New',reference,paystackReference:reference};
        try{
          sessionStorage.setItem('wd_payment_success',JSON.stringify({order:paidOrder,createdAt:Date.now()}));
          await secureFinalise(paidOrder,reference);
          await WD.sendEmail('purchase',{order_id:orderId,customer_name:record.customer,customer_phone:record.phone,customer_email:record.email,fulfilment:mode,delivery_address:record.address,order_items:orderItemsSummary(),order_subtotal:WD.money(subtotal),processing_fee:WD.money(fee),order_total:WD.money(total),payment_reference:reference});
          localStorage.removeItem(ABANDONED_KEY);WD.saveCart([]);location.href=`index.html?order=${encodeURIComponent(orderId)}`;
        }catch(err){
          console.error('[Wrap District] post-payment processing issue',err);
          // The pending order remains in Firestore and the Paystack webhook can still complete it.
          WD.saveCart([]);location.href=`index.html?order=${encodeURIComponent(orderId)}&payment=received`;
        }
      },
      onCancel:()=>{paymentInProgress=false;refresh();WD.toast('Payment was not completed. Your order details are saved.')},
      onError:err=>{paymentInProgress=false;refresh();WD.toast(err?.message||'Payment could not start.')}
    });
  };
})();
