const crypto=require('crypto');
const admin=require('firebase-admin');

function initAdmin(){
  if(admin.apps.length)return;
  const projectId=process.env.FIREBASE_PROJECT_ID;
  const clientEmail=process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey=String(process.env.FIREBASE_PRIVATE_KEY||'').replace(/\\n/g,'\n');
  if(!projectId||!clientEmail||!privateKey)throw new Error('Firebase Admin environment variables are missing.');
  admin.initializeApp({credential:admin.credential.cert({projectId,clientEmail,privateKey})});
}
const num=v=>Number(v||0);
const normalisePhone=value=>{let d=String(value||'').replace(/\D/g,'');if(d.startsWith('0')&&d.length>=10)d='233'+d.slice(1);return d};
function orderIdFrom(metadata={}){
  if(metadata.order_id)return String(metadata.order_id);
  const fields=Array.isArray(metadata.custom_fields)?metadata.custom_fields:[];
  return String(fields.find(x=>x?.variable_name==='order_id')?.value||'');
}
function metadataValue(metadata={},key){const fields=Array.isArray(metadata.custom_fields)?metadata.custom_fields:[];return String(metadata[key]||fields.find(x=>x?.variable_name===key)?.value||'').trim();}
exports.handler=async event=>{
  if(event.httpMethod!=='POST')return{statusCode:405,body:'Method Not Allowed'};
  try{
    const secret=process.env.PAYSTACK_SECRET_KEY;
    if(!secret)throw new Error('PAYSTACK_SECRET_KEY is missing.');
    const signature=event.headers['x-paystack-signature']||event.headers['X-Paystack-Signature']||'';
    const hash=crypto.createHmac('sha512',secret).update(event.body||'').digest('hex');
    if(!signature||hash!==signature)return{statusCode:401,body:'Invalid signature'};
    const payload=JSON.parse(event.body||'{}');
    if(payload.event!=='charge.success'||payload.data?.status!=='success')return{statusCode:200,body:'Event ignored'};
    initAdmin();
    const db=admin.firestore(),payment=payload.data||{},reference=String(payment.reference||''),orderId=orderIdFrom(payment.metadata),donationId=metadataValue(payment.metadata,'donation_id');
    if(!reference)return{statusCode:400,body:'Missing payment reference'};
    const serverTime=admin.firestore.FieldValue.serverTimestamp();
    if(!orderId&&donationId){
      const paymentRef=db.collection('paymentReferences').doc(reference);
      await db.runTransaction(async tx=>{
        const seen=await tx.get(paymentRef);if(seen.exists)return;
        const amount=num(payment.amount)/100,currency=String(payment.currency||'').toUpperCase();if(currency!=='GHS')throw new Error('Donation currency mismatch.');
        const name=metadataValue(payment.metadata,'donor_name')||'Friend of the District',email=metadataValue(payment.metadata,'donor_email');
        tx.set(db.collection('donations').doc(donationId),{id:donationId,name,email,amount,reference,status:'Paid',date:payment.paid_at||new Date().toISOString(),serverVerified:true,verifiedAt:serverTime},{merge:true});
        tx.set(paymentRef,{kind:'donation',donationId,amount:num(payment.amount),currency,createdAt:serverTime},{merge:false});
        tx.set(db.collection('notifications').doc(),{type:'donation',title:'New Feed the Street donation',message:`${name} donated GHS ${amount.toFixed(2)}.`,donationId,read:false,createdAt:serverTime});
        tx.set(db.collection('activity').doc(),{action:'Donation received',donationId,total:amount,paystackReference:reference,createdAt:serverTime});
      });
      return{statusCode:200,body:'Donation webhook received'};
    }
    if(!orderId)return{statusCode:400,body:'Missing order reference'};
    const orderRef=db.collection('orders').doc(orderId),paymentRef=db.collection('paymentReferences').doc(reference);
    await db.runTransaction(async tx=>{
      const seen=await tx.get(paymentRef);if(seen.exists)return;
      const snap=await tx.get(orderRef);if(!snap.exists)throw new Error(`Order ${orderId} not found.`);
      const order=snap.data()||{},expected=Math.round(num(order.total)*100),paid=num(payment.amount),currency=String(payment.currency||'').toUpperCase();
      if(expected!==paid||currency!=='GHS')throw new Error('Payment amount or currency mismatch.');
      tx.set(orderRef,{payment:'Paid',paymentStatus:'Paid',status:order.status&&order.status!=='Awaiting Payment'?order.status:'New',reference,paystackReference:reference,serverVerified:true,verifiedAt:serverTime,updatedAt:serverTime,verification:{reference,amount:paid,currency,paidAt:payment.paid_at||null,channel:payment.channel||''}},{merge:true});
      tx.set(paymentRef,{orderId,amount:paid,currency,createdAt:serverTime},{merge:false});
      const customerId=normalisePhone(order.phone)||String(order.email||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,40)||orderId;
      tx.set(db.collection('customers').doc(customerId),{name:order.customer||order.name||'',email:order.email||'',phone:order.phone||'',normalizedPhone:normalisePhone(order.phone),lastOrderId:orderId,lastOrderAt:serverTime,totalSpent:admin.firestore.FieldValue.increment(num(order.total)),orderCount:admin.firestore.FieldValue.increment(1)},{merge:true});
      tx.set(db.collection('notifications').doc(),{type:'purchase',title:'New paid order',message:`${order.customer||order.name||'Customer'} placed ${orderId} for GHS ${num(order.total).toFixed(2)}.`,orderId,read:false,createdAt:serverTime});
      tx.set(db.collection('activity').doc(),{action:'Paid order created',orderId,total:num(order.total),paystackReference:reference,createdAt:serverTime});
      if(order.abandonedCartId)tx.set(db.collection('abandonedCarts').doc(String(order.abandonedCartId)),{status:'recovered',orderId,recoveredAt:serverTime,updatedAt:serverTime},{merge:true});
    });
    console.log(`[Wrap District webhook] ${orderId} marked paid.`);
    return{statusCode:200,body:'Webhook received'};
  }catch(error){console.error('[Wrap District webhook]',error);return{statusCode:500,body:'Webhook processing failed'}};
};
