const admin=require('firebase-admin');
function init(){
  if(admin.apps.length)return;
  const projectId=process.env.FIREBASE_PROJECT_ID;
  const clientEmail=process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey=String(process.env.FIREBASE_PRIVATE_KEY||'').replace(/\\n/g,'\n');
  if(!projectId||!clientEmail||!privateKey)throw Error('Firebase Admin environment variables are missing.');
  admin.initializeApp({credential:admin.credential.cert({projectId,clientEmail,privateKey})});
}
const metadataValue=(metadata={},key)=>{
  const fields=Array.isArray(metadata.custom_fields)?metadata.custom_fields:[];
  return String(metadata[key]||fields.find(x=>x?.variable_name===key)?.value||'').trim();
};
exports.handler=async event=>{
  if(event.httpMethod!=='POST')return{statusCode:405,body:JSON.stringify({ok:false,error:'Method Not Allowed'})};
  try{
    init();
    const body=JSON.parse(event.body||'{}');
    const reference=String(body.reference||'').trim();
    const secret=process.env.PAYSTACK_SECRET_KEY;
    if(!reference||!secret)throw Error('Payment verification is not configured.');
    const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`}});
    const json=await response.json().catch(()=>({}));
    const payment=json.data||{};
    if(!response.ok||payment.status!=='success'||String(payment.currency||'').toUpperCase()!=='GHS')throw Error('Donation payment could not be verified.');

    const metadata=payment.metadata||{};
    const donationId=metadataValue(metadata,'donation_id');
    if(!donationId)throw Error('Donation reference is missing from the verified payment.');
    const name=metadataValue(metadata,'donor_name')||'Friend of the District';
    const email=metadataValue(metadata,'donor_email');
    const amount=Number(payment.amount||0)/100;
    const db=admin.firestore();
    const serverTime=admin.firestore.FieldValue.serverTimestamp();
    const paymentRef=db.collection('paymentReferences').doc(reference);

    await db.runTransaction(async tx=>{
      const seen=await tx.get(paymentRef);
      if(seen.exists)return;
      tx.set(db.collection('donations').doc(donationId),{
        id:donationId,name,email,amount,reference,status:'Paid',
        date:payment.paid_at||new Date().toISOString(),serverVerified:true,verifiedAt:serverTime
      },{merge:true});
      tx.set(paymentRef,{kind:'donation',donationId,amount:Number(payment.amount||0),currency:'GHS',createdAt:serverTime},{merge:false});
      tx.set(db.collection('notifications').doc(),{type:'donation',title:'New Feed the Street donation',message:`${name} donated GHS ${amount.toFixed(2)}.`,donationId,read:false,createdAt:serverTime});
      tx.set(db.collection('activity').doc(),{action:'Donation received',donationId,total:amount,paystackReference:reference,createdAt:serverTime});
    });
    return{statusCode:200,body:JSON.stringify({ok:true,amount,reference,donationId,name,email})};
  }catch(error){
    console.error('[verify-donation]',error);
    return{statusCode:400,body:JSON.stringify({ok:false,error:error.message||'Donation verification failed.'})};
  }
};
