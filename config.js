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
    publicKey: 'aKsJoQpe0QRPqR_tM',
    serviceId: 'service_n2gaahd',
    templates: {
      customer: 'template_z5l8xns',
      admin: 'template_or8qh4d'
    }
  },

  paystackPublicKey: 'pk_live_ad7d0e0b164d83ec61bf2bf4fdb2af366c41c0ed',
  secureOrderEndpoint: '/.netlify/functions/verify-payment',
  businessEmail: 'kennethkankam22@gmail.com',
  whatsapp: '233000000000',
  social: {
    instagram: '#',
    tiktok: '#',
    snapchat: '#',
    x: '#',
    facebook: '#'
  }
};
