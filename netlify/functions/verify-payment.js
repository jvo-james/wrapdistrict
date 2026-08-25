const admin = require('firebase-admin');

function initAdmin(){
  if(admin.apps.length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g,'\n');
  if(!projectId || !clientEmail || !privateKey) throw new Error('Firebase Admin environment variables are missing.');
  admin.initializeApp({credential:admin.credential.cert({projectId,clientEmail,privateKey})});
}

const num=v=>Number(v||0);
const normalisePhone=value=>{
  let digits=String(value||'').replace(/\D/g,'');
  if(digits.startsWith('0')&&digits.length>=10)digits='233'+digits.slice(1);
  return digits;
};

async function verifyPaystack(reference){
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret) throw new Error('PAYSTACK_SECRET_KEY is missing.');
  const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`}});
  const body=await response.json().catch(()=>({}));
  if(!response.ok||!body.status||!body.data)throw new Error(body.message||'Paystack verification failed.');
  return body.data;
}

async function finalise({db,order,reference,payment}){
  const orderId=String(order.id||'').trim();
  if(!orderId)throw new Error('Order ID is missing.');
  const orderRef=db.collection('orders').doc(orderId);
  const paymentRef=db.collection('paymentReferences').doc(reference);
  const serverTime=admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async tx=>{
    const seen=await tx.get(paymentRef);
    if(seen.exists)return;
    const currentSnap=await tx.get(orderRef);
    const current=currentSnap.exists?currentSnap.data():order;

    tx.set(orderRef,{...order,payment:'Paid',paymentStatus:'Paid',status:current?.status&&current.status!=='Awaiting Payment'?current.status:'New',reference,paystackReference:reference,serverVerified:true,verifiedAt:serverTime,updatedAt:serverTime,verification:{reference,amount:num(payment.amount),currency:String(payment.currency||'GHS').toUpperCase(),paidAt:payment.paid_at||null,channel:payment.channel||''}},{merge:true});
    tx.set(paymentRef,{orderId,amount:num(payment.amount),currency:String(payment.currency||'GHS').toUpperCase(),createdAt:serverTime},{merge:false});

    const customerId=normalisePhone(order.phone)||String(order.email||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,40)||orderId;
    tx.set(db.collection('customers').doc(customerId),{name:order.customer||order.name||'',email:order.email||'',phone:order.phone||'',normalizedPhone:normalisePhone(order.phone),lastOrderId:orderId,lastOrderAt:serverTime,totalSpent:admin.firestore.FieldValue.increment(num(order.total)),orderCount:admin.firestore.FieldValue.increment(1)},{merge:true});

    const notificationRef=db.collection('notifications').doc();
    tx.set(notificationRef,{type:'purchase',title:'New paid order',message:`${order.customer||order.name||'Customer'} placed ${orderId} for GHS ${num(order.total).toFixed(2)}.`,orderId,read:false,createdAt:serverTime});
    const activityRef=db.collection('activity').doc();
    tx.set(activityRef,{action:'Paid order created',orderId,total:num(order.total),paystackReference:reference,createdAt:serverTime});

    if(order.abandonedCartId){
      tx.set(db.collection('abandonedCarts').doc(String(order.abandonedCartId)),{status:'recovered',orderId,recoveredAt:serverTime,updatedAt:serverTime},{merge:true});
    }
  });
}

exports.handler=async event=>{
  if(event.httpMethod!=='POST')return{statusCode:405,body:JSON.stringify({ok:false,error:'Method Not Allowed'})};
  try{
    initAdmin();
    const db=admin.firestore();
    const body=JSON.parse(event.body||'{}');
    const supplied=body.order||{};
    const orderId=String(body.orderId||supplied.id||'').trim();
    if(!orderId)return{statusCode:400,body:JSON.stringify({ok:false,error:'Missing order ID.'})};
    const snap=await db.collection('orders').doc(orderId).get();
    if(!snap.exists)return{statusCode:404,body:JSON.stringify({ok:false,error:'Order not found.'})};
    const order={id:orderId,...snap.data()};
    const reference=String(body.reference||'').trim();
    if(!reference)return{statusCode:400,body:JSON.stringify({ok:false,error:'Missing payment reference.'})};
    const payment=await verifyPaystack(reference);
    if(payment.status!=='success')return{statusCode:400,body:JSON.stringify({ok:false,error:'Payment is not successful.'})};
    const expected=Math.round(num(order.total)*100);
    if(num(payment.amount)!==expected||String(payment.currency||'').toUpperCase()!=='GHS')return{statusCode:400,body:JSON.stringify({ok:false,error:'Payment amount or currency does not match this order.'})};
    await finalise({db,order,reference,payment});
    return{statusCode:200,body:JSON.stringify({ok:true,orderId:order.id,reference})};
  }catch(error){
    console.error('[Wrap District verify-payment]',error);
    return{statusCode:500,body:JSON.stringify({ok:false,error:error.message||'Verification failed.'})};
  }
};
