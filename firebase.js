(() => {
  const SDK_VERSION = '12.17.1';
  let app, db, auth;
  let initPromise;

  const load = src => new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src === src)) return resolve();
    const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
  });

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const cfg = window.WD_CONFIG?.firebase;
      if (!cfg?.apiKey) return false;
      await load(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app-compat.js`);
      await load(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth-compat.js`);
      await load(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore-compat.js`);
      app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
      auth = firebase.auth();
      db = firebase.firestore();
      try { await db.enablePersistence({ synchronizeTabs: true }); } catch (_) {}
      return true;
    })().catch(err => { console.warn('Firebase unavailable; using local cache.', err); return false; });
    return initPromise;
  }

  const cache = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  };

  const mapDoc = d => ({ id: d.id, ...d.data() });
  const clean = data => JSON.parse(JSON.stringify(data, (_, value) => value === undefined ? null : value));

  async function list(collectionName, localKey, fallback = []) {
    const local = cache.get(localKey, fallback);
    if (!(await init())) return local;
    try {
      let ref = db.collection(collectionName);
      // Reviews can contain private submission details. Public visitors only query approved reviews;
      // signed-in District Control admins can read the full moderation queue.
      if (collectionName === 'reviews' && !(auth?.currentUser && await isAdmin(auth.currentUser))) {
        ref = ref.where('approved', '==', true);
      }
      const snap = await ref.get();
      if (snap.empty) return local;
      const values = snap.docs.map(mapDoc);
      cache.set(localKey, values);
      return values;
    } catch (err) { console.warn(`Firestore read failed: ${collectionName}`, err); return local; }
  }

  async function save(collectionName, id, data, localKey) {
    const payload = clean(data);
    const local = cache.get(localKey, []);
    const index = local.findIndex(x => String(x.id) === String(id));
    const row = { ...payload, id };
    index >= 0 ? local.splice(index, 1, row) : local.unshift(row);
    cache.set(localKey, local);
    if (await init()) await db.collection(collectionName).doc(String(id)).set(payload, { merge: true });
    return row;
  }

  async function remove(collectionName, id, localKey) {
    cache.set(localKey, cache.get(localKey, []).filter(x => String(x.id) !== String(id)));
    if (await init()) await db.collection(collectionName).doc(String(id)).delete();
  }

  async function create(collectionName, data, localKey, preferredId) {
    const id = preferredId || `${collectionName.slice(0, 3).toUpperCase()}-${Date.now()}`;
    return save(collectionName, id, data, localKey);
  }

  async function getSettings() {
    if (!(await init())) return cache.get('wdSettings', {});
    try {
      const snap = await db.collection('siteContent').doc('settings').get();
      if (!snap.exists) return cache.get('wdSettings', {});
      const value = snap.data(); cache.set('wdSettings', value); return value;
    } catch { return cache.get('wdSettings', {}); }
  }

  async function saveSettings(value) {
    cache.set('wdSettings', value);
    if (await init()) await db.collection('siteContent').doc('settings').set(clean(value), { merge: true });
  }

  async function signIn(email, password) { await init(); return auth.signInWithEmailAndPassword(email, password); }
  async function signOut() { if (await init()) return auth.signOut(); }
  async function currentUser() { await init(); return auth.currentUser; }
  async function isAdmin(user = auth?.currentUser) {
    if (!user) return false;
    const emails = (WD_CONFIG.adminEmails || []).map(x => String(x).toLowerCase()).filter(x => !x.startsWith('your_'));
    if (emails.length && !emails.includes(String(user.email).toLowerCase())) return false;
    if (!(await init())) return emails.includes(String(user.email).toLowerCase());
    try { return (await db.collection('admins').doc(user.uid).get()).exists; } catch { return false; }
  }
  async function adminStatus() {
    await init();
    return new Promise(resolve => auth.onAuthStateChanged(async user => resolve({ user, admin: user ? await isAdmin(user) : false })));
  }

  window.WD_DB = { init, list, save, remove, create, getSettings, saveSettings, signIn, signOut, currentUser, isAdmin, adminStatus, cache };
})();
