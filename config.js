/**
 * WRAP DISTRICT - SERVICE CONFIG
 * Public browser keys belong here. NEVER put API secrets / secret keys here.
 */
window.WD_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyCdkugavKV7PjBgZlpFleZiPJFyBLqHeaY',
    authDomain: 'wrap-district-90bcf.firebaseapp.com',
    projectId: 'wrap-district-90bcf',
    storageBucket: 'wrap-district-90bcf.firebasestorage.app',
    messagingSenderId: '68780365223',
    appId: '1:68780365223:web:b693d5bd945772ec449282'
  },

  adminEmails: ['kennethkankam22@gmail.com'],

  cloudinary: {
    cloudName: 'dkd162oa',
    uploadPreset: 'wrapdistrict_uploads',
    folder: 'wrapdistrict'
  },

  emailjs: {
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
    serviceId: 'service_n2gaahd',
    templates: {
      customer: 'template_z5l8xns',
      admin: 'template_or8qh4d'
    }
  },

  paystackPublicKey: 'YOUR_PAYSTACK_PUBLIC_KEY',
  secureOrderEndpoint: '/.netlify/functions/verify-payment',
  businessEmail: 'orders@wrapdistrict.com',
  whatsapp: '233000000000',
  social: {
    instagram: '#',
    tiktok: '#',
    snapchat: '#',
    x: '#',
    facebook: '#'
  }
};
