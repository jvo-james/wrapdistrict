(()=>{const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];const cache=WD_DB.cache,money=n=>`GHS ${Number(n||0).toFixed(2).replace('.00','')}`;const map={products:['menuItems','wdProducts'],inventory:['inventory','wdInventory'],promos:['promotions','wdPromos'],slides:['heroSlides','wdSlides'],reviews:['reviews','wdReviews'],gallery:['feedGallery','wdGallery'],team:['teamMembers','wdTeam'],orders:['orders','wdOrders'],donations:['donations','wdDonations'],contacts:['contacts','wdContacts'],subscribers:['subscribers','wdSubscribers'],abandoned:['abandonedCarts','wdAbandoned'],notifications:['notifications','wdNotifications'],activity:['activity','wdActivity'],customers:['customers','wdCustomers'],payments:['paymentReferences','wdPayments']};const esc=v=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));const uid=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;const rows=(k,d=[])=>cache.get(k,d);function toast(m){const t=$('#adminToast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600)}function busy(btn,on,label='Saving'){if(!btn)return;if(on){if(!btn.dataset.old)btn.dataset.old=btn.innerHTML;btn.disabled=true;btn.setAttribute('aria-busy','true');btn.innerHTML=`<i class="fa-solid fa-spinner fa-spin"></i> ${label}`}else{btn.disabled=false;btn.removeAttribute('aria-busy');if(btn.dataset.old){btn.innerHTML=btn.dataset.old;delete btn.dataset.old}}}async function save(kind,row){const [c,k]=map[kind];await WD_DB.save(c,row.id,row,k)}async function del(kind,id){const [c,k]=map[kind];await WD_DB.remove(c,id,k)}
async function load(){sync('Syncing',true);const jobs=[['orders','wdOrders',[]],['abandonedCarts','wdAbandoned',[]],['notifications','wdNotifications',[]],['activity','wdActivity',[]],['customers','wdCustomers',[]],['paymentReferences','wdPayments',[]],['donations','wdDonations',[]],['contacts','wdContacts',[]],['subscribers','wdSubscribers',[]],['inventory','wdInventory',WD_DEFAULT_INVENTORY||[]],['menuItems','wdProducts',WD_PRODUCTS],['promotions','wdPromos',WD_DEFAULT_PROMOS],['heroSlides','wdSlides',WD_DEFAULT_SLIDES],['reviews','wdReviews',WD_DEFAULT_REVIEWS],['feedGallery','wdGallery',WD_IMAGE_LIST],['teamMembers','wdTeam',WD_DEFAULT_TEAM]];await Promise.all(jobs.map(async([c,k,d])=>cache.set(k,await WD_DB.list(c,k,d))));const liveProducts=cache.get('wdProducts',[]),seen=new Set(liveProducts.map(x=>String(x.id)));WD_PRODUCTS.forEach(x=>{if(!seen.has(String(x.id)))liveProducts.push(x)});cache.set('wdProducts',liveProducts);const savedTeam=cache.get('wdTeam',[]),teamById=new Map(savedTeam.map(x=>[String(x.id),x]));cache.set('wdTeam',(WD_DEFAULT_TEAM||[]).map(base=>({...base,...(teamById.get(String(base.id))||{}),id:base.id})));const settings=await WD_DB.getSettings();if(settings)cache.set('wdSettings',settings);const user=await WD_DB.currentUser();if(user){$('#profileEmail').textContent=user.email||'Admin';$('#adminName').textContent=user.email||'Wrap District Admin'}sync('Synced');renderAll();setTimeout(()=>{if(rows('wdNotifications').length)openNotificationPopover(true)},450)}function sync(text,spin=false){$('#syncState').innerHTML=`<i class="fa-solid fa-${spin?'arrows-rotate fa-spin':'cloud-check'}"></i> ${text}`}
async function auth(){const s=await WD_DB.adminStatus();if(s.user&&s.admin){$('#adminAuth').classList.add('hidden');await load()}else if(s.user&&!s.admin)$('#authNote').textContent='This account signed in successfully but does not have District Control access.'}$('#adminLogin').onsubmit=async e=>{e.preventDefault();const b=e.submitter,f=new FormData(e.target);busy(b,true,'Signing in');try{const r=await WD_DB.signIn(f.get('email'),f.get('password'));if(await WD_DB.isAdmin(r.user))location.reload();else $('#authNote').textContent='This account is not approved for District Control.'}catch(err){$('#authNote').textContent='We could not sign you in. Check the email and password, then try again.'}finally{busy(b,false)}};$('#adminLogout').onclick=async()=>{await WD_DB.signOut();location.reload()};
const titles={overview:'Overview',orders:'Orders',sales:'Sales',store:'Store',content:'Content',community:'Community',inbox:'Inbox',settings:'Settings'};function go(view){$$('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===view));$$('.admin-view').forEach(x=>x.classList.toggle('active',x.id===view));$('#viewTitle').textContent=titles[view]||view;$('#adminSidebar').classList.remove('open');scrollTo(0,0)}$$('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));$$('[data-jump]').forEach(b=>b.onclick=()=>go(b.dataset.jump));$('#adminMenu').onclick=()=>$('#adminSidebar').classList.toggle('open');$('#adminSideClose').onclick=()=>$('#adminSidebar').classList.remove('open');$$('.admin-tabs').forEach(tabbar=>{const host=tabbar.parentElement;tabbar.querySelectorAll('[data-subtab]').forEach(btn=>btn.onclick=()=>{tabbar.querySelectorAll('[data-subtab]').forEach(x=>x.classList.toggle('active',x===btn));host.querySelectorAll(':scope > .admin-subview').forEach(x=>x.classList.toggle('active',x.id===btn.dataset.subtab))})});let open=cache.get('wdOpen',true);function showStore(){const b=$('#storeToggle');b.classList.toggle('closed',!open);b.innerHTML=open?'<i class="fa-solid fa-circle-check"></i> Orders open':'<i class="fa-solid fa-circle-pause"></i> Orders paused'}$('#storeToggle').onclick=async()=>{const b=$('#storeToggle');busy(b,true,'Updating');try{open=!open;cache.set('wdOpen',open);const s={...cache.get('wdSettings',{}),ordersOpen:open};await WD_DB.saveSettings(s);showStore();toast(open?'Customers can place orders now.':'New orders are paused.')}catch{toast('We could not update the order switch. Try again.')}finally{busy(b,false)}};showStore();
function openDrawer(title,kicker,content){$('#drawerTitle').textContent=title;$('#drawerKicker').textContent=kicker;$('#drawerBody').innerHTML=content;$('#adminDrawerBackdrop').classList.add('open');$('#adminDrawer').classList.add('open');document.body.style.overflow='hidden'}function closeDrawer(){$('#adminDrawerBackdrop').classList.remove('open');$('#adminDrawer').classList.remove('open');document.body.style.overflow=''}$('#drawerClose').onclick=closeDrawer;$('#adminDrawerBackdrop').onclick=closeDrawer;
function statusBadge(s){const c=s==='Completed'?'on':s==='New'?'warn':'';return `<span class="badge ${c}">${esc(s||'New')}</span>`}function overview(){const all=rows('wdOrders'),os=all.filter(o=>(o.payment||o.paymentStatus)==='Paid'),pending=all.filter(o=>(o.payment||o.paymentStatus)!=='Paid'),rs=rows('wdReviews'),notifs=rows('wdNotifications');os.sort((a,b)=>new Date(b.createdAt||b.date||0)-new Date(a.createdAt||a.date||0));$('#mOrders').textContent=os.length;$('#mSales').textContent=money(os.reduce((a,x)=>a+Number(x.subtotal??x.total??0),0));$('#mPending').textContent=pending.length;$('#mReviews').textContent=rs.filter(x=>!x.approved).length;$('#todayLabel').textContent=new Date().toLocaleDateString('en-GH',{weekday:'long',day:'numeric',month:'long'});$('#latestOrders').innerHTML=os.length?os.slice(0,5).map(o=>`<div class="list-row" data-order="${esc(o.id)}"><div><h4>${esc(o.customer||o.name||'Customer')}</h4><small>${esc(o.id)}</small></div><div>${statusBadge(o.status)}</div><div><b>${money(o.subtotal??o.total)}</b></div><i class="fa-solid fa-chevron-right"></i></div>`).join(''):'<p class="empty-admin">No paid orders yet.</p>';const attention=[[pending.length,'Pending payments','Review checkout records waiting for confirmation','orders'],[rs.filter(x=>!x.approved).length,'Reviews waiting','Open the review queue','community'],[rows('wdInventory',WD_DEFAULT_INVENTORY||[]).filter(x=>Number(x.quantity)<=Number(x.lowAt)).length,'Stock items low','Check inventory levels','store'],[notifs.filter(x=>!x.read).length,'Unread notifications','See recent store updates','inbox']];$('#attentionList').innerHTML=attention.map(x=>`<button class="attention-item text-btn" data-attention="${x[3]}"><i class="fa-solid fa-circle-exclamation"></i><span><b>${x[0]} ${x[1]}</b><span>${x[2]}</span></span></button>`).join('');$$('[data-order]').forEach(b=>b.onclick=()=>orderDrawer(b.dataset.order));$$('[data-attention]').forEach(b=>b.onclick=()=>go(b.dataset.attention));const openOrders=os.filter(x=>(x.status||'New')!=='Completed').length;$('#ordersNavCount').textContent=openOrders;$('#ordersNavCount').hidden=!openOrders;const waitingReviews=rs.filter(x=>!x.approved).length;$('#reviewsNavCount').textContent=waitingReviews;$('#reviewsNavCount').hidden=!waitingReviews;const inboxCount=rows('wdContacts').length+notifs.filter(x=>!x.read).length;$('#messagesNavCount').textContent=inboxCount;$('#messagesNavCount').hidden=!inboxCount;const unavailable=rows('wdProducts',WD_PRODUCTS).filter(x=>x.available===false).length;$('#productsNavCount').textContent=unavailable;$('#productsNavCount').hidden=!unavailable;renderNotificationPopover()}function orderDrawer(id){const o=rows('wdOrders').find(x=>String(x.id)===String(id));if(!o)return;const flow=['New','Preparing','Ready','Out for delivery','Completed'];const paid=(o.payment||o.paymentStatus)==='Paid';openDrawer(`Order ${o.id}`,'ORDER DETAILS',`<div class="drawer-section"><div class="drawer-grid"><div><small>CUSTOMER</small><h3>${esc(o.customer||o.name||'Customer')}</h3><p>${esc(o.phone||'No phone')}</p><p>${esc(o.email||'No email')}</p></div><div><small>PAYMENT</small><h3>${money(o.total)}</h3><p><span class="badge ${paid?'on':'warn'}">${paid?'PAID':'PENDING'}</span></p><p>${esc(o.reference||o.paystackReference||'No payment reference yet')}</p></div></div></div><div class="drawer-section"><h3>Fulfilment</h3><p><b>${esc(o.type||o.fulfilment||'Not set')}</b></p><p>${esc(o.address||'No delivery address saved')}</p><p>${esc(o.note||o.notes||'')}</p></div><div class="drawer-section"><h3>What they ordered</h3>${(o.items||[]).map(x=>`<p><b>${esc(x.qty||1)} × ${esc(x.name)}</b><br><small>${esc(x.detail||'')}</small></p>`).join('')||'<p>No item details saved.</p>'}</div>${paid?`<div class="drawer-section"><div class="field"><label>Status</label><select id="orderStatus">${flow.map(x=>`<option ${x===(o.status||'New')?'selected':''}>${x}</option>`).join('')}</select></div><div class="field" style="margin-top:12px"><label>Admin note</label><textarea id="orderAdminNote" placeholder="Private note for the team">${esc(o.adminNote||'')}</textarea></div></div><div class="drawer-actions"><button class="primary" id="saveOrder">Save order update</button></div>`:''}`);if(paid&&$('#saveOrder'))$('#saveOrder').onclick=async e=>{const b=e.currentTarget;busy(b,true);try{o.status=$('#orderStatus').value;o.adminNote=$('#orderAdminNote').value.trim();await save('orders',o);renderAll();toast('Order updated.');closeDrawer()}catch(err){console.error(err);toast('We could not save this order. Try again.')}finally{busy(b,false)}}}function orders(){const draw=()=>{const q=$('#orderSearch').value.toLowerCase(),f=$('#orderFilter').value;const a=rows('wdOrders').filter(o=>(o.payment||o.paymentStatus)==='Paid').filter(o=>(f==='all'||(o.status||'New')===f)&&[o.id,o.customer,o.name,o.phone,o.email].join(' ').toLowerCase().includes(q)).sort((a,b)=>new Date(b.createdAt||b.date||0)-new Date(a.createdAt||a.date||0));$('#ordersList').innerHTML=a.length?a.map(o=>`<div class="list-row" data-order="${esc(o.id)}"><div><h4>${esc(o.customer||o.name||'Customer')}</h4><small>${esc(o.id)} · ${new Date(o.createdAt||o.date||Date.now()).toLocaleString()}</small></div><div>${statusBadge(o.status)}</div><div><b>${money(o.total)}</b><small>${esc(o.type||o.fulfilment||'')}</small></div><i class="fa-solid fa-chevron-right"></i></div>`).join(''):'<p class="empty-admin">No paid orders match this view.</p>';$$('[data-order]').forEach(b=>b.onclick=()=>orderDrawer(b.dataset.order))};$('#orderSearch').oninput=draw;$('#orderFilter').onchange=draw;draw()}function uploadBox(id,url=''){return `<div class="image-drop" id="${id}" tabindex="0">${url?`<img src="${esc(url)}" alt="Current image">`:''}<div class="upload-copy"><i class="fa-solid fa-cloud-arrow-up"></i><br><b>${url?'Change image':'Choose an image'}</b><br><small>The preview appears here before saving.</small></div></div>`}async function chooseImage(box,folder){return new Promise(resolve=>{const input=$('#hiddenImageInput');input.value='';input.onchange=async()=>{const file=input.files[0];if(!file)return resolve(null);const old=box.innerHTML;box.classList.add('loading');box.innerHTML=`<div class="upload-copy"><i class="fa-solid fa-spinner fa-spin"></i><br><b>Uploading image</b><br><small>Please wait a moment.</small></div>`;try{const up=await WD_CLOUDINARY.upload(file,folder);box.innerHTML=`<img src="${up.url}" alt="Uploaded preview"><div class="upload-copy"><i class="fa-solid fa-check"></i><br><b>Image ready</b></div>`;box.dataset.url=up.url;resolve(up)}catch(err){box.innerHTML=old;toast('The image could not be uploaded. Check the file and try again.');resolve(null)}finally{box.classList.remove('loading')}};input.click()})}
function products(){const a=rows('wdProducts',WD_PRODUCTS);$('#productList').innerHTML=a.map(p=>`<article class="admin-card" data-product="${esc(p.id)}"><div class="admin-card-media"><img src="${esc(p.image)}" alt=""><span class="badge ${p.available!==false?'on':'off'}">${p.available!==false?'AVAILABLE':'UNAVAILABLE'}</span></div><div class="admin-card-copy"><small>${esc(p.category)}</small><h3>${esc(p.name)}</h3><p>${esc(p.tagline||p.description||'')}</p><div class="admin-card-foot"><b>From ${money(p.from)}</b><span class="small-btn">Edit <i class="fa-solid fa-arrow-right"></i></span></div></div></article>`).join('');$$('[data-product]').forEach(b=>b.onclick=()=>productDrawer(b.dataset.product))}

      function productDrawer(id,newItem=false){

  const a = rows('wdProducts', WD_PRODUCTS);

  const p = newItem
    ? {
        id: uid('product'),
        name: '',
        category: '',
        from: 0,
        tagline: '',
        description: '',
        image: '',
        sizes: [
          {
            name: 'Regular',
            price: 0
          }
        ],
        sizeImages: [''],
        extras: [],
        available: true
      }
    : JSON.parse(
        JSON.stringify(
          a.find(x => x.id === id)
        )
      );


  const original = WD_PRODUCTS.find(
    x => String(x.id) === String(p.id)
  );


  // --------------------------------------------------
  // NORMALISE OLD + NEW DATA FORMATS
  // --------------------------------------------------

  // Supports old:
  // ['Regular', 40]
  //
  // And new:
  // { name:'Regular', price:40 }

  p.sizes = (p.sizes || []).map(x => ({
    name:
      x?.name ??
      x?.[0] ??
      'Portion',

    price:
      Number(
        x?.price ??
        x?.[1] ??
        0
      )
  }));


  // Supports old:
  // ['Cheese', 5, 'image.jpg']
  //
  // And new:
  // { name:'Cheese', price:5, image:'image.jpg' }

  p.extras = (p.extras || []).map(x => ({
    name:
      x?.name ??
      x?.[0] ??
      '',

    price:
      Number(
        x?.price ??
        x?.[1] ??
        0
      ),

    image:
      x?.image ??
      x?.[2] ??
      p.image ??
      ''
  }));


  if(!p.sizes.length){
    p.sizes = [
      {
        name: 'Regular',
        price: 0
      }
    ];
  }


  // --------------------------------------------------
  // IMAGE PICKER
  // --------------------------------------------------

  const picker = (
    type,
    i,
    url,
    label
  ) => `
    <div
      class="image-picker-row"
      data-picker="${type}"
      data-index="${i}"
      data-url="${esc(url || '')}"
    >

      <div class="image-picker-thumb">
        ${
          url
            ? `<img
                 src="${esc(url)}"
                 alt="${esc(label)}"
               >`
            : '<i class="fa-regular fa-image"></i>'
        }
      </div>


      <div class="picker-copy">

        <b>
          ${esc(label)}
        </b>

        <small>
          ${
            url
              ? 'Image selected'
              : 'Uses the main product image until you add one.'
          }
        </small>

      </div>


      <div class="picker-actions">

        <button
          type="button"
          class="upload-image-btn"
          data-pick-image
        >
          <i class="fa-solid fa-camera"></i>
          Replace
        </button>


        <button
          type="button"
          class="reset-image-btn"
          data-reset-row-image
        >
          Original
        </button>

      </div>

    </div>
  `;


  // --------------------------------------------------
  // PORTION ROWS
  // --------------------------------------------------

  const sizeRows = () =>
    p.sizes.map((x,i) => {

      const sizeName =
        x?.name ??
        x?.[0] ??
        '';

      const sizePrice =
        x?.price ??
        x?.[1] ??
        0;


      const sizeImage =
        (p.sizeImages || [])[i] ||
        p.image ||
        '';


      return `
        <div
          class="portion-edit"
          data-size-row
        >

          <div class="repeat-row">

            <input
              data-sn
              value="${esc(sizeName)}"
              placeholder="Portion name"
            >

            <input
              data-sp
              type="number"
              min="0"
              step="0.01"
              value="${Number(sizePrice || 0)}"
            >

            <button
              type="button"
              data-remove-size
            >
              <i class="fa-solid fa-xmark"></i>
            </button>

          </div>


          ${picker(
            'size',
            i,
            sizeImage,
            `${sizeName || 'Portion'} image`
          )}

        </div>
      `;
    }).join('');


  // --------------------------------------------------
  // EXTRA ROWS
  // --------------------------------------------------

  const extraRows = () =>
    p.extras.map((x,i) => {

      const extraName =
        x?.name ??
        x?.[0] ??
        '';

      const extraPrice =
        x?.price ??
        x?.[1] ??
        0;

      const extraImage =
        x?.image ??
        x?.[2] ??
        p.image ??
        '';


      return `
        <div
          class="portion-edit"
          data-extra-row
        >

          <div class="repeat-row extra">

            <input
              data-en
              value="${esc(extraName)}"
              placeholder="Extra name"
            >

            <input
              data-ep
              type="number"
              min="0"
              step="0.01"
              value="${Number(extraPrice || 0)}"
            >

            <button
              type="button"
              data-remove-extra
            >
              <i class="fa-solid fa-xmark"></i>
            </button>

          </div>


          ${picker(
            'extra',
            i,
            extraImage,
            `${extraName || 'Extra'} image`
          )}

        </div>
      `;
    }).join('');


  // --------------------------------------------------
  // OPEN DRAWER
  // --------------------------------------------------

  openDrawer(
    newItem
      ? 'Add menu item'
      : p.name,

    'MENU ITEM',

    `

    <div class="drawer-section">

      ${uploadBox(
        'productImage',
        p.image
      )}


      ${
        original
          ? `
            <button
              type="button"
              class="reset-image-btn"
              id="resetProductImage"
              style="margin-top:9px"
            >
              <i class="fa-solid fa-rotate-left"></i>
              Use original product image
            </button>
          `
          : ''
      }


      <div
        class="drawer-grid"
        style="margin-top:14px"
      >

        <div class="field">

          <label>
            Product name
          </label>

          <input
            id="pName"
            value="${esc(p.name)}"
          >

        </div>


        <div class="field">

          <label>
            Category
          </label>

          <input
            id="pCategory"
            value="${esc(p.category)}"
          >

        </div>


        <div class="field">

          <label>
            Short line
          </label>

          <input
            id="pTagline"
            value="${esc(p.tagline || '')}"
          >

        </div>


        <div class="field">

          <label>
            Available to order
          </label>

          <select id="pAvailable">

            <option
              value="yes"
              ${
                p.available !== false
                  ? 'selected'
                  : ''
              }
            >
              Yes, customers can order it
            </option>

            <option
              value="no"
              ${
                p.available === false
                  ? 'selected'
                  : ''
              }
            >
              No, mark it unavailable
            </option>

          </select>

        </div>

      </div>


      <div
        class="field"
        style="margin-top:12px"
      >

        <label>
          Description
        </label>

        <textarea id="pDescription">${esc(
          p.description || ''
        )}</textarea>

      </div>

    </div>


    <div class="drawer-section">

      <h3>
        Portions and prices
      </h3>

      <p>
        <small>
          Each portion can have its own photo.
          Use Replace to choose it from your device.
        </small>
      </p>


      <div id="sizeRows">
        ${sizeRows()}
      </div>


      <button
        class="add-row"
        id="addSize"
        type="button"
      >
        <i class="fa-solid fa-plus"></i>
        Add another portion
      </button>

    </div>


    <div class="drawer-section">

      <h3>
        Extras
      </h3>

      <p>
        <small>
          Add an image for each extra so customers
          can recognise it while building an order.
        </small>
      </p>


      <div id="extraRows">
        ${extraRows()}
      </div>


      <button
        class="add-row"
        id="addExtra"
        type="button"
      >
        <i class="fa-solid fa-plus"></i>
        Add another extra
      </button>

    </div>


    <div class="drawer-actions">

      <button
        class="primary"
        id="saveProduct"
      >
        ${
          newItem
            ? 'Create menu item'
            : 'Save menu item'
        }
      </button>

    </div>

    `
  );


  // --------------------------------------------------
  // MAIN PRODUCT IMAGE
  // --------------------------------------------------

  const img =
    $('#productImage');


  img.onclick = () =>
    chooseImage(
      img,
      'products'
    );


  if($('#resetProductImage')){

    $('#resetProductImage').onclick = () => {

      const originalImage =
        original?.image ||
        p.image ||
        '';


      img.dataset.url =
        originalImage;


      img.innerHTML =
        originalImage
          ? `
            <img
              src="${esc(originalImage)}"
              alt="Original product image"
            >

            <div class="upload-copy">
              <i class="fa-solid fa-rotate-left"></i>
              <br>
              <b>
                Original image restored
              </b>
            </div>
          `
          : `
            <div class="upload-copy">
              <i class="fa-regular fa-image"></i>
              <br>
              <b>
                No original image
              </b>
            </div>
          `;
    };
  }


  // --------------------------------------------------
  // BIND PORTION + EXTRA CONTROLS
  // --------------------------------------------------

  function bindRows(){

    const sizeEls =
      $$('[data-size-row]');


    sizeEls.forEach(
      (row,i) => {

        const card =
          row.querySelector(
            '[data-picker]'
          );

        if(card){
          card.dataset.index = i;
        }
      }
    );


    const extraEls =
      $$('[data-extra-row]');


    extraEls.forEach(
      (row,i) => {

        const card =
          row.querySelector(
            '[data-picker]'
          );

        if(card){
          card.dataset.index = i;
        }
      }
    );


    $$('[data-remove-size]')
      .forEach(b => {

        b.onclick = () => {

          if(
            $$('[data-size-row]')
              .length === 1
          ){
            return toast(
              'Keep at least one portion.'
            );
          }


          b.closest(
            '[data-size-row]'
          )?.remove();


          bindRows();
        };
      });


    $$('[data-remove-extra]')
      .forEach(b => {

        b.onclick = () => {

          b.closest(
            '[data-extra-row]'
          )?.remove();


          bindRows();
        };
      });


    $$('[data-pick-image]')
      .forEach(b => {

        b.onclick = async () => {

          const card =
            b.closest(
              '[data-picker]'
            );


          const thumb =
            card.querySelector(
              '.image-picker-thumb'
            );


          const old =
            b.innerHTML;


          b.disabled =
            true;


          b.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Uploading';


          const pseudo =
            document.createElement(
              'div'
            );


          try{

            const up =
              await chooseImage(
                pseudo,
                card.dataset.picker === 'size'
                  ? 'product-portions'
                  : 'product-extras'
              );


            if(up){

              card.dataset.url =
                up.url;


              thumb.innerHTML =
                `
                  <img
                    src="${esc(up.url)}"
                    alt="Uploaded image"
                  >
                `;


              const note =
                card.querySelector(
                  'small'
                );


              if(note){
                note.textContent =
                  'New image ready to save.';
              }
            }


          }finally{

            b.disabled =
              false;


            b.innerHTML =
              old;
          }
        };
      });


    $$('[data-reset-row-image]')
      .forEach(b => {

        b.onclick = () => {

          const card =
            b.closest(
              '[data-picker]'
            );


          const i =
            Number(
              card.dataset.index || 0
            );


          const type =
            card.dataset.picker;


          let url = '';


          if(original){

            if(type === 'size'){

              url =
                (original.sizeImages || [])[i] ||
                original.image ||
                '';

            }else{

              const oldExtra =
                (original.extras || [])[i];


              url =
                oldExtra?.image ??
                oldExtra?.[2] ??
                original.image ??
                '';
            }

          }else{

            url =
              img.dataset.url ||
              p.image ||
              '';
          }


          card.dataset.url =
            url;


          card.querySelector(
            '.image-picker-thumb'
          ).innerHTML =
            url
              ? `
                <img
                  src="${esc(url)}"
                  alt="Original image"
                >
              `
              : '<i class="fa-regular fa-image"></i>';


          const note =
            card.querySelector(
              'small'
            );


          if(note){

            note.textContent =
              'Original image restored.';
          }
        };
      });
  }


  bindRows();


  // --------------------------------------------------
  // ADD PORTION
  // --------------------------------------------------

  $('#addSize').onclick = () => {

    const index =
      $$('[data-size-row]').length;


    $('#sizeRows')
      .insertAdjacentHTML(
        'beforeend',
        `

        <div
          class="portion-edit"
          data-size-row
        >

          <div class="repeat-row">

            <input
              data-sn
              placeholder="Portion name"
            >

            <input
              data-sp
              type="number"
              min="0"
              step="0.01"
              value="0"
            >

            <button
              type="button"
              data-remove-size
            >
              <i class="fa-solid fa-xmark"></i>
            </button>

          </div>


          ${picker(
            'size',
            index,
            img.dataset.url ||
              p.image,
            'New portion image'
          )}

        </div>

        `
      );


    bindRows();
  };


  // --------------------------------------------------
  // ADD EXTRA
  // --------------------------------------------------

  $('#addExtra').onclick = () => {

    const index =
      $$('[data-extra-row]').length;


    $('#extraRows')
      .insertAdjacentHTML(
        'beforeend',
        `

        <div
          class="portion-edit"
          data-extra-row
        >

          <div class="repeat-row extra">

            <input
              data-en
              placeholder="Extra name"
            >

            <input
              data-ep
              type="number"
              min="0"
              step="0.01"
              value="0"
            >

            <button
              type="button"
              data-remove-extra
            >
              <i class="fa-solid fa-xmark"></i>
            </button>

          </div>


          ${picker(
            'extra',
            index,
            img.dataset.url ||
              p.image,
            'New extra image'
          )}

        </div>

        `
      );


    bindRows();
  };


  // --------------------------------------------------
  // SAVE PRODUCT
  // --------------------------------------------------

  $('#saveProduct').onclick =
    async e => {

      const b =
        e.currentTarget;


      busy(
        b,
        true,
        newItem
          ? 'Creating'
          : 'Saving'
      );


      try{

        p.name =
          $('#pName')
            .value
            .trim();


        p.category =
          $('#pCategory')
            .value
            .trim();


        p.tagline =
          $('#pTagline')
            .value
            .trim();


        p.description =
          $('#pDescription')
            .value
            .trim();


        p.available =
          $('#pAvailable')
            .value === 'yes';


        p.image =
          img.dataset.url ||
          p.image ||
          WD_IMAGES.productFallback;


        // ------------------------------------------
        // VALIDATE BASIC FIELDS
        // ------------------------------------------

        if(!p.name){

          throw new Error(
            'Add the product name.'
          );
        }


        if(!p.category){

          throw new Error(
            'Add the product category.'
          );
        }


        // ------------------------------------------
        // FIRESTORE-SAFE PORTIONS
        // ------------------------------------------

        const sizeRowsNow =
          $$('[data-size-row]');


        p.sizes =
          sizeRowsNow.map(r => ({

            name:
              $('[data-sn]',r)
                .value
                .trim() ||
              'Portion',

            price:
              Number(
                $('[data-sp]',r)
                  .value ||
                0
              )

          }));


        if(
          !p.sizes.length ||
          p.sizes.some(
            x =>
              !Number.isFinite(
                x.price
              ) ||
              x.price <= 0
          )
        ){

          throw new Error(
            'Every portion needs a price greater than zero.'
          );
        }


        p.sizeImages =
          sizeRowsNow.map(
            r =>
              $('[data-picker]',r)
                ?.dataset
                .url ||
              p.image
          );


        // ------------------------------------------
        // FIRESTORE-SAFE EXTRAS
        // ------------------------------------------

        p.extras =
          $$('[data-extra-row]')

            .map(r => ({

              name:
                $('[data-en]',r)
                  .value
                  .trim(),

              price:
                Number(
                  $('[data-ep]',r)
                    .value ||
                  0
                ),

              image:
                $('[data-picker]',r)
                  ?.dataset
                  .url ||
                p.image

            }))

            .filter(
              x => x.name
            );


        // ------------------------------------------
        // LOWEST DISPLAY PRICE
        // ------------------------------------------

        p.from =
          Math.min(
            ...p.sizes.map(
              x => x.price
            )
          );


        // ------------------------------------------
        // SAVE
        // ------------------------------------------

        await save(
          'products',
          p
        );


        renderAll();


        toast(
          newItem
            ? 'Menu item created.'
            : 'Menu item saved.'
        );


        closeDrawer();


      }catch(err){

        console.error(
          '[Wrap District] menu item save failed',
          err
        );


        toast(
          err.message ||
          'The menu item could not be saved. Please try again.'
        );


      }finally{

        busy(
          b,
          false
        );
      }
    };
}
      
      $('#addProduct').onclick=()=>productDrawer(null,true);
function promotions(){const a=rows('wdPromos');$('#promoList').innerHTML=a.length?a.map(p=>`<div class="list-row" data-promo="${p.id}"><div><h4>${esc(p.title)}</h4><small>${esc(p.subtitle||'')}</small></div><div><span class="badge ${p.active?'on':'off'}">${p.active?'LIVE':'OFF'}</span></div><div><small>${p.start||p.end?`${esc(p.start||'Any time')} to ${esc(p.end||'No end')}`:'No schedule set'}</small></div><i class="fa-solid fa-chevron-right"></i></div>`).join(''):'<p class="empty-admin">No promos yet.</p>';$$('[data-promo]').forEach(b=>b.onclick=()=>promoDrawer(b.dataset.promo))}function promoDrawer(id,newItem=false){const p=newItem?{id:uid('promo'),title:'',subtitle:'',cta:'Order now',image:'',active:false,start:'',end:''}:JSON.parse(JSON.stringify(rows('wdPromos').find(x=>x.id===id)));openDrawer(newItem?'New promo':p.title,'PROMO',`<div class="drawer-section">${uploadBox('promoImage',p.image)}${!newItem?'<button type="button" class="reset-image-btn" id="resetPromoImage" style="margin-top:9px">Use original image</button>':''}<div class="field" style="margin-top:12px"><label>Promo title</label><input id="prTitle" value="${esc(p.title)}"></div><div class="field"><label>Message customers will see</label><textarea id="prSubtitle">${esc(p.subtitle||'')}</textarea></div><div class="drawer-grid"><div class="field"><label>Button text</label><input id="prCta" value="${esc(p.cta||'Order now')}"></div><div class="field"><label>Status</label><select id="prActive"><option value="yes" ${p.active?'selected':''}>Live</option><option value="no" ${!p.active?'selected':''}>Not live</option></select></div><div class="field"><label>Start date</label><input type="date" id="prStart" value="${esc(p.start||'')}"></div><div class="field"><label>End date</label><input type="date" id="prEnd" value="${esc(p.end||'')}"></div></div></div><div class="drawer-actions"><button class="primary" id="savePromo">${newItem?'Create promo':'Save promo'}</button>${newItem?'':`<button class="small-btn danger" id="deletePromo">Remove promo</button>`}</div>`);const im=$('#promoImage');im.onclick=()=>chooseImage(im,'promos');if($('#resetPromoImage'))$('#resetPromoImage').onclick=()=>{const o=WD_DEFAULT_PROMOS.find(x=>String(x.id)===String(p.id));if(!o)return toast('This promo was created in the admin, so it has no original image.');im.dataset.url=o.image;im.innerHTML=`<img src="${esc(o.image)}" alt="Original promo image"><div class="upload-copy"><b>Original image restored</b></div>`};$('#savePromo').onclick=async e=>{busy(e.currentTarget,true);try{p.title=$('#prTitle').value.trim();p.subtitle=$('#prSubtitle').value.trim();p.cta=$('#prCta').value.trim()||'Order now';p.active=$('#prActive').value==='yes';p.start=$('#prStart').value;p.end=$('#prEnd').value;p.image=im.dataset.url||p.image||WD_IMAGES.promoFallback;if(!p.title||!p.subtitle)throw Error();await save('promos',p);renderAll();toast('Promo saved.');closeDrawer()}catch{toast('Add a promo title and message before saving.')}finally{busy(e.currentTarget,false)}};if($('#deletePromo'))$('#deletePromo').onclick=async e=>{if(!confirm('Remove this promo?'))return;busy(e.currentTarget,true,'Removing');await del('promos',p.id);renderAll();closeDrawer();toast('Promo removed.')}}$('#addPromo').onclick=()=>promoDrawer(null,true);
function slides(){const a=rows('wdSlides');$('#slideList').innerHTML=a.map(s=>`<article class="admin-card" data-slide="${s.id}"><div class="admin-card-media"><img src="${esc(s.image)}"><span class="badge ${s.active!==false?'on':'off'}">${s.active!==false?'ACTIVE':'PAUSED'}</span></div><div class="admin-card-copy"><small>${esc(s.kicker)}</small><h3>${esc(s.title)}</h3><p>${esc(s.copy||'')}</p><div class="admin-card-foot"><span>${esc(s.cta||'')}</span><span class="small-btn">Edit slide</span></div></div></article>`).join('');$$('[data-slide]').forEach(b=>b.onclick=()=>slideDrawer(b.dataset.slide))}function slideDrawer(id,newItem=false){const s=newItem?{id:uid('slide'),admin:true,kicker:'',title:'',copy:'',image:'',cta:'Order now',href:'menu.html',active:true}:JSON.parse(JSON.stringify(rows('wdSlides').find(x=>x.id===id)));openDrawer(newItem?'Add homepage slide':s.title,'HOMEPAGE SLIDE',`<div class="drawer-section">${uploadBox('slideImage',s.image)}${!newItem?'<button type="button" class="reset-image-btn" id="resetSlideImage" style="margin-top:9px">Use original image</button>':''}<div class="drawer-grid" style="margin-top:12px"><div class="field"><label>Small label</label><input id="slKicker" value="${esc(s.kicker||'')}"></div><div class="field"><label>Button text</label><input id="slCta" value="${esc(s.cta||'')}"></div></div><div class="field"><label>Main headline</label><input id="slTitle" value="${esc(s.title||'')}"></div><div class="field"><label>Supporting text</label><textarea id="slCopy">${esc(s.copy||'')}</textarea></div><div class="drawer-grid"><div class="field"><label>Button link</label><input id="slHref" value="${esc(s.href||'menu.html')}"></div><div class="field"><label>Show on homepage</label><select id="slActive"><option value="yes" ${s.active!==false?'selected':''}>Yes</option><option value="no" ${s.active===false?'selected':''}>No, pause it</option></select></div></div></div><div class="drawer-actions"><button class="primary" id="saveSlide">${newItem?'Add slide':'Save slide'}</button>${newItem?'':`<button class="small-btn danger" id="deleteSlide">Remove slide</button>`}</div>`);const im=$('#slideImage');im.onclick=()=>chooseImage(im,'hero');if($('#resetSlideImage'))$('#resetSlideImage').onclick=()=>{const o=WD_DEFAULT_SLIDES.find(x=>String(x.id)===String(s.id));if(!o)return toast('This slide was created in the admin, so it has no original image.');im.dataset.url=o.image;im.innerHTML=`<img src="${esc(o.image)}" alt="Original slide image"><div class="upload-copy"><b>Original image restored</b></div>`};$('#saveSlide').onclick=async e=>{busy(e.currentTarget,true);try{s.kicker=$('#slKicker').value.trim();s.title=$('#slTitle').value.trim();s.copy=$('#slCopy').value.trim();s.cta=$('#slCta').value.trim();s.href=$('#slHref').value.trim()||'menu.html';s.active=$('#slActive').value==='yes';s.image=im.dataset.url||s.image;if(!s.title||!s.image)throw Error();await save('slides',s);renderAll();closeDrawer();toast('Homepage slide saved.')}catch{toast('Add a headline and image before saving.')}finally{busy(e.currentTarget,false)}};if($('#deleteSlide'))$('#deleteSlide').onclick=async e=>{if(!confirm('Remove this homepage slide?'))return;busy(e.currentTarget,true,'Removing');await del('slides',s.id);renderAll();closeDrawer();toast('Slide removed.')}}$('#addSlide').onclick=()=>slideDrawer(null,true);
function reviews(){const a=rows('wdReviews');$('#reviewList').innerHTML=a.length?a.map(r=>`<div class="list-row" data-review="${r.id}"><div><h4>${esc(r.name)} · ${'★'.repeat(Number(r.stars||0))}</h4><small>${esc(r.location||'Location not added')}</small></div><div><span class="badge ${r.approved?'on':'warn'}">${r.approved?'PUBLIC':'WAITING'}</span></div><div><small>${esc(String(r.text||'').slice(0,80))}${String(r.text||'').length>80?'…':''}</small></div><i class="fa-solid fa-chevron-right"></i></div>`).join(''):'<p class="empty-admin">No reviews yet.</p>';$$('[data-review]').forEach(b=>b.onclick=()=>reviewDrawer(b.dataset.review))}function reviewDrawer(id){const r=rows('wdReviews').find(x=>x.id===id);openDrawer(`${r.name}'s review`,'CUSTOMER REVIEW',`<div class="drawer-section"><p style="color:#c28c00;font-size:20px">${'★'.repeat(Number(r.stars||0))}</p><h3>${esc(r.text)}</h3><p>${esc(r.name)} · ${esc(r.location||'')}</p><small>${esc(r.email||'Email not provided')}</small></div><div class="drawer-actions"><button class="primary" id="toggleReview">${r.approved?'Hide from website':'Approve and publish'}</button><button class="small-btn danger" id="deleteReview">Delete review</button></div>`);$('#toggleReview').onclick=async e=>{busy(e.currentTarget,true);r.approved=!r.approved;await save('reviews',r);renderAll();closeDrawer();toast(r.approved?'Review published.':'Review hidden.')} ;$('#deleteReview').onclick=async e=>{if(!confirm('Delete this review?'))return;busy(e.currentTarget,true,'Deleting');await del('reviews',r.id);renderAll();closeDrawer();toast('Review deleted.')}}
function gallery(){const a=rows('wdGallery');$('#adminGallery').innerHTML=a.length?a.map((x,i)=>{const url=typeof x==='string'?x:x.url,id=typeof x==='string'?`local-${i}`:x.id;return `<div class="admin-photo"><img src="${esc(url)}"><span>${i+1}</span><div class="photo-tools"><button data-up="${i}" title="Move earlier"><i class="fa-solid fa-arrow-left"></i></button><button data-down="${i}" title="Move later"><i class="fa-solid fa-arrow-right"></i></button>${typeof x==='string'?'':`<button data-photo-remove="${esc(id)}" title="Remove"><i class="fa-solid fa-trash"></i></button>`}</div></div>`}).join(''):'<p class="empty-admin">No gallery photos yet.</p>';$$('[data-up]').forEach(b=>b.onclick=()=>movePhoto(+b.dataset.up,-1));$$('[data-down]').forEach(b=>b.onclick=()=>movePhoto(+b.dataset.down,1));$$('[data-photo-remove]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this gallery photo?'))return;await del('gallery',b.dataset.photoRemove);renderAll();toast('Photo removed.')})}async function movePhoto(i,dir){const a=rows('wdGallery'),j=i+dir;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];cache.set('wdGallery',a);for(let n=0;n<a.length;n++)if(typeof a[n]!=='string'){a[n].position=n;await save('gallery',a[n])}gallery();toast('Gallery order updated.')}$('#addGallery').onclick=()=>{openDrawer('Add gallery photos','FEED THE STREET',`<div class="drawer-section">${uploadBox('galleryUpload')}<p>Choose one image at a time. You can add more after each upload.</p></div><div class="drawer-actions"><button class="primary" id="saveGalleryPhoto" disabled>Upload a photo first</button></div>`);const box=$('#galleryUpload');box.onclick=async()=>{const up=await chooseImage(box,'feed-gallery');if(up){$('#saveGalleryPhoto').disabled=false;$('#saveGalleryPhoto').textContent='Add this photo';$('#saveGalleryPhoto').dataset.url=up.url;$('#saveGalleryPhoto').dataset.pid=up.publicId}};$('#saveGalleryPhoto').onclick=async e=>{busy(e.currentTarget,true);const a=rows('wdGallery');await save('gallery',{id:uid('gallery'),url:e.currentTarget.dataset.url,cloudinaryPublicId:e.currentTarget.dataset.pid,position:a.length,createdAt:new Date().toISOString()});renderAll();closeDrawer();toast('Gallery photo added.')}};
function donations(){const a=rows('wdDonations');const total=a.reduce((s,x)=>s+Number(x.amount||0),0);$('#donationTotal').textContent=money(total);$('#donationList').innerHTML=a.length?a.map(d=>`<div class="list-row" data-donation="${d.id}"><div><h4>${esc(d.name||'Anonymous supporter')}</h4><small>${esc(d.email||'No email')}</small></div><div><span class="badge on">${esc(d.status||'PAID')}</span></div><div><b>${money(d.amount)}</b><small>${new Date(d.date||Date.now()).toLocaleString()}</small></div><i class="fa-solid fa-chevron-right"></i></div>`).join(''):'<p class="empty-admin">No donations yet.</p>';$$('[data-donation]').forEach(b=>b.onclick=()=>{const d=a.find(x=>x.id===b.dataset.donation);openDrawer(`${d.name||'Donation'}`,'DONATION',`<div class="drawer-section"><h3>${money(d.amount)}</h3><p>${esc(d.email||'No email')}</p><p>Payment reference: <b>${esc(d.reference||'Not saved')}</b></p><p>${new Date(d.date||Date.now()).toLocaleString()}</p></div>`)})}
function team(){const a=rows('wdTeam',WD_DEFAULT_TEAM);$('#teamList').innerHTML=a.map(p=>`<article class="admin-card" data-team="${p.id}"><div class="admin-card-media"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div><div class="admin-card-copy"><small>${/kenneth/i.test(p.name)?'FOUNDER':'TEAM PROFILE'}</small><h3>${esc(p.name)}</h3><p>${esc(p.bio||'')}</p><div class="admin-card-foot"><span>${esc(p.role||'Team')}</span><span class="small-btn">Edit profile</span></div></div></article>`).join('');$$('[data-team]').forEach(b=>b.onclick=()=>teamDrawer(b.dataset.team))}function teamDrawer(id){const p=JSON.parse(JSON.stringify(rows('wdTeam',WD_DEFAULT_TEAM).find(x=>String(x.id)===String(id))));openDrawer(p.name,'TEAM PROFILE',`<div class="drawer-section">${uploadBox('teamImage',p.image)}<button type="button" class="reset-image-btn" id="resetTeamImage" style="margin-top:9px">Use original image</button><div class="drawer-grid" style="margin-top:12px"><div class="field"><label>Name</label><input id="tmName" value="${esc(p.name)}"></div><div class="field"><label>Profile label</label><input id="tmRole" value="${esc(p.role||'Team')}"></div></div><div class="field"><label>Profile introduction</label><textarea id="tmBio">${esc(p.bio||'')}</textarea></div></div><div class="drawer-section"><h3>Public social links</h3><div class="drawer-grid"><div class="field"><label>Instagram</label><input id="tmInstagram" value="${esc(p.instagram||'')}"></div><div class="field"><label>TikTok</label><input id="tmTiktok" value="${esc(p.tiktok||'')}"></div><div class="field"><label>Snapchat</label><input id="tmSnapchat" value="${esc(p.snapchat||'')}"></div><div class="field"><label>X</label><input id="tmX" value="${esc(p.x||'')}"></div><div class="field"><label>Facebook</label><input id="tmFacebook" value="${esc(p.facebook||'')}"></div></div></div><div class="drawer-actions"><button class="primary" id="saveTeam">Save profile</button></div>`);const im=$('#teamImage');im.onclick=()=>chooseImage(im,'team');$('#resetTeamImage').onclick=()=>{const o=WD_DEFAULT_TEAM.find(x=>String(x.id)===String(p.id));im.dataset.url=o.image;im.innerHTML=`<img src="${esc(o.image)}" alt="Original team image"><div class="upload-copy"><b>Original image restored</b></div>`};$('#saveTeam').onclick=async e=>{const b=e.currentTarget;busy(b,true);try{p.name=$('#tmName').value.trim();p.role=$('#tmRole').value.trim()||'Team';p.bio=$('#tmBio').value.trim();p.image=im.dataset.url||p.image;p.instagram=$('#tmInstagram').value.trim();p.tiktok=$('#tmTiktok').value.trim();p.snapchat=$('#tmSnapchat').value.trim();p.x=$('#tmX').value.trim();p.facebook=$('#tmFacebook').value.trim();if(!p.name||!p.bio)throw new Error('Name and introduction are required.');await save('team',p);renderAll();closeDrawer();toast('Team profile saved.')}catch(err){console.error(err);toast(err.message||'The profile could not be saved.')}finally{busy(b,false)}}} function messages(){const cs=rows('wdContacts'),ss=rows('wdSubscribers');$('#contactList').innerHTML=cs.length?cs.map(c=>`<div class="list-row" data-message="${c.id}"><div><h4>${esc(c.name||'Website visitor')}</h4><small>${esc(c.topic||'Message')}</small></div><div><small>${esc(c.email||'')}</small></div><div><small>${new Date(c.date||Date.now()).toLocaleDateString()}</small></div><i class="fa-solid fa-chevron-right"></i></div>`).join(''):'<p class="empty-admin">No contact messages yet.</p>';$('#subscriberList').innerHTML=ss.length?ss.map(s=>`<div class="list-row"><div><h4>${esc(s.email)}</h4><small>Newsletter subscriber</small></div><div></div><div><small>${s.date?new Date(s.date).toLocaleDateString():''}</small></div><span></span></div>`).join(''):'<p class="empty-admin">No newsletter subscribers yet.</p>';$$('[data-message]').forEach(b=>b.onclick=()=>{const c=cs.find(x=>x.id===b.dataset.message);openDrawer(c.name||'Message','CONTACT MESSAGE',`<div class="drawer-section"><h3>${esc(c.topic||'Message')}</h3><p>${esc(c.message||'')}</p></div><div class="drawer-section"><p><b>Email:</b> ${esc(c.email||'Not provided')}</p><p><b>Phone:</b> ${esc(c.phone||'Not provided')}</p><p><b>Received:</b> ${new Date(c.date||Date.now()).toLocaleString()}</p></div><div class="drawer-actions"><a class="primary" href="mailto:${esc(c.email||'')}"><i class="fa-solid fa-reply"></i> Reply by email</a></div>`)})}
function analytics(){const all=rows('wdOrders');const range=$('#analyticsRange')?.value||'30',days=range==='all'?99999:Number(range),cut=Date.now()-days*86400000,os=all.filter(o=>{const d=new Date(o.date||o.createdAt||o.timestamp||0).getTime();return range==='all'||(!Number.isNaN(d)&&d>=cut)});const revenue=os.reduce((a,o)=>a+Number(o.total||0),0);$('#aRevenue').textContent=money(revenue);$('#aOrders').textContent=os.length;$('#aAverage').textContent=money(os.length?revenue/os.length:0);const counts={};os.forEach(o=>(o.items||o.cart||[]).forEach(i=>{const n=i.name||i.productName||i.id||'Menu item';counts[n]=(counts[n]||0)+Number(i.qty||i.quantity||1)}));const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);$('#aTop').textContent=ranked[0]?.[0]||'No data';const by={};os.forEach(o=>{const d=new Date(o.date||o.createdAt||o.timestamp||Date.now());const k=d.toISOString().slice(0,10);by[k]=(by[k]||0)+Number(o.total||0)});const keys=Object.keys(by).sort().slice(-10),max=Math.max(1,...keys.map(k=>by[k]));$('#salesBars').innerHTML=keys.length?keys.map(k=>`<div class="sales-bar" title="${k}: ${money(by[k])}"><b>${money(by[k])}</b><i style="--h:${Math.max(4,Math.round(by[k]/max*170))}px"></i><small>${k.slice(5)}</small></div>`).join(''):'<p class="empty-admin">Sales will appear here after orders are saved.</p>';const top=ranked.slice(0,6),mx=Math.max(1,...top.map(x=>x[1]));$('#topProducts').innerHTML=top.length?top.map((x,i)=>`<div class="rank-row-admin"><span>${i+1}</span><div><b>${esc(x[0])}</b><i style="--w:${Math.round(x[1]/mx*100)}%"></i></div><strong>${x[1]}</strong></div>`).join(''):'<p class="empty-admin">No product sales to rank yet.</p>'}$('#analyticsRange').onchange=analytics;
function inventory(){const a=rows('wdInventory',WD_DEFAULT_INVENTORY||[]),low=a.filter(x=>Number(x.quantity)<=Number(x.lowAt));$('#inventorySummary').innerHTML=`<div class="inventory-chip"><span>Stock items</span><b>${a.length}</b></div><div class="inventory-chip"><span>Needs restocking</span><b class="inventory-low">${low.length}</b></div><div class="inventory-chip"><span>Healthy stock</span><b>${a.length-low.length}</b></div>`;$('#inventoryList').innerHTML=a.length?a.map(x=>`<div class="list-row" data-inventory="${esc(x.id)}"><div><h4>${esc(x.name)}</h4><small>${esc(x.unit||'units')}</small></div><div><span class="badge ${Number(x.quantity)<=Number(x.lowAt)?'off':'on'}">${Number(x.quantity)<=Number(x.lowAt)?'RESTOCK SOON':'IN STOCK'}</span></div><div><b>${Number(x.quantity||0)}</b><small>Alert at ${Number(x.lowAt||0)}</small></div><i class="fa-solid fa-chevron-right"></i></div>`).join(''):'<p class="empty-admin">No stock items yet.</p>';$$('[data-inventory]').forEach(b=>b.onclick=()=>inventoryDrawer(b.dataset.inventory))}function inventoryDrawer(id,newItem=false){const x=newItem?{id:uid('inventory'),name:'',unit:'pieces',quantity:0,lowAt:5}:JSON.parse(JSON.stringify(rows('wdInventory',WD_DEFAULT_INVENTORY||[]).find(v=>v.id===id)));openDrawer(newItem?'Add stock item':x.name,'INVENTORY',`<div class="drawer-section"><div class="drawer-grid"><div class="field"><label>Item name</label><input id="invName" value="${esc(x.name)}"></div><div class="field"><label>Unit</label><input id="invUnit" value="${esc(x.unit||'pieces')}"></div><div class="field"><label>Current quantity</label><input id="invQty" type="number" min="0" step="1" value="${Number(x.quantity||0)}"></div><div class="field"><label>Restock warning at</label><input id="invLow" type="number" min="0" step="1" value="${Number(x.lowAt||0)}"></div></div></div><div class="drawer-actions"><button class="primary" id="saveInventory">${newItem?'Add stock item':'Save stock level'}</button>${newItem?'':`<button class="small-btn danger" id="deleteInventory">Remove stock item</button>`}</div>`);$('#saveInventory').onclick=async e=>{const b=e.currentTarget;busy(b,true);try{x.name=$('#invName').value.trim();x.unit=$('#invUnit').value.trim()||'pieces';x.quantity=Number($('#invQty').value)||0;x.lowAt=Number($('#invLow').value)||0;if(!x.name)throw Error();await save('inventory',x);inventory();closeDrawer();toast('Inventory updated.')}catch{toast('Add an item name before saving.')}finally{busy(b,false)}};if($('#deleteInventory'))$('#deleteInventory').onclick=async e=>{const b=e.currentTarget;if(!confirm('Remove this stock item?'))return;busy(b,true,'Removing');try{await del('inventory',x.id);inventory();closeDrawer();toast('Stock item removed.')}finally{busy(b,false)}}}$('#addInventory').onclick=()=>inventoryDrawer(null,true);
function subscribersPage(){const a=rows('wdSubscribers'),q=($('#subscriberSearch')?.value||'').toLowerCase(),filtered=a.filter(x=>String(x.email||'').toLowerCase().includes(q));$('#subTotal').textContent=a.length;const month=new Date().toISOString().slice(0,7);$('#subMonth').textContent=a.filter(x=>String(x.date||'').slice(0,7)===month).length;$('#subscribersFullList').innerHTML=filtered.length?filtered.map(s=>`<div class="list-row"><div><h4>${esc(s.email||'Subscriber')}</h4><small>Newsletter subscriber</small></div><div><small>${s.date?new Date(s.date).toLocaleDateString():'Date not saved'}</small></div><div></div><span class="badge on">SUBSCRIBED</span></div>`).join(''):'<p class="empty-admin">No subscribers match this search.</p>'}$('#subscriberSearch').oninput=subscribersPage;$('#exportSubscribers').onclick=e=>{const b=e.currentTarget;busy(b,true,'Preparing');try{const a=rows('wdSubscribers');const csv=['Email,Joined',...a.map(x=>`"${String(x.email||'').replace(/"/g,'""')}","${x.date||''}"`)].join('\n'),blob=new Blob([csv],{type:'text/csv'}),u=URL.createObjectURL(blob),link=document.createElement('a');link.href=u;link.download='wrap-district-subscribers.csv';link.click();URL.revokeObjectURL(u);toast('Subscriber list downloaded.')}finally{busy(b,false)}};
function pendingPayments(){const a=rows('wdOrders').filter(o=>(o.payment||o.paymentStatus)==='Paid').filter(o=>(o.payment||o.paymentStatus)!=='Paid').sort((a,b)=>new Date(b.createdAt||b.date||0)-new Date(a.createdAt||a.date||0));$('#pendingPaymentsList').innerHTML=a.length?a.map(o=>`<div class="list-row" data-pending="${esc(o.id)}"><div><h4>${esc(o.customer||o.name||'Customer')}</h4><small>${esc(o.id)} · ${new Date(o.createdAt||o.date||Date.now()).toLocaleString()}</small></div><div><span class="badge warn">${esc(o.payment||o.paymentStatus||'Pending')}</span></div><div><b>${money(o.total)}</b><small>${esc(o.phone||o.email||'')}</small></div><i class="fa-solid fa-chevron-right"></i></div>`).join(''):'<p class="empty-admin">No pending payments.</p>';$$('[data-pending]').forEach(b=>b.onclick=()=>orderDrawer(b.dataset.pending))}
function abandoned(){const a=rows('wdAbandoned').sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));$('#abandonedList').innerHTML=a.length?a.map(x=>`<div class="list-row"><div><h4>${esc(x.name||'Checkout visitor')}</h4><small>${esc(x.id)} · ${esc(x.phone||x.email||'')}</small></div><div><span class="badge ${x.status==='recovered'?'on':'warn'}">${esc(x.status||'active').toUpperCase()}</span></div><div><b>${money(x.total)}</b><small>${esc(x.fulfilment||x.type||'')}</small></div><span></span></div>`).join(''):'<p class="empty-admin">No abandoned carts yet.</p>'}
function transactions(){const a=rows('wdOrders').filter(o=>(o.payment||o.paymentStatus)==='Paid').sort((a,b)=>new Date(b.verifiedAt?.toDate?.()||b.createdAt||b.date||0)-new Date(a.verifiedAt?.toDate?.()||a.createdAt||a.date||0));$('#transactionList').innerHTML=a.length?a.map(o=>`<div class="list-row" data-order="${esc(o.id)}"><div><h4>${esc(o.id)}</h4><small>${esc(o.reference||o.paystackReference||'Reference unavailable')}</small></div><div><span class="badge on">PAID</span></div><div><b>${money(o.total)}</b><small>${esc(o.verification?.channel||'Paystack')}</small></div><i class="fa-solid fa-chevron-right"></i></div>`).join(''):'<p class="empty-admin">No paid transactions yet.</p>';$$('#transactionList [data-order]').forEach(b=>b.onclick=()=>orderDrawer(b.dataset.order))}
function customers(){const q=($('#customerSearch')?.value||'').toLowerCase(),a=rows('wdCustomers').filter(x=>[x.name,x.email,x.phone,x.normalizedPhone].join(' ').toLowerCase().includes(q)).sort((a,b)=>Number(b.orderCount||0)-Number(a.orderCount||0));$('#customerList').innerHTML=a.length?a.map(x=>`<div class="list-row"><div><h4>${esc(x.name||'Customer')}</h4><small>${esc(x.email||x.phone||'')}</small></div><div><span class="badge">${Number(x.orderCount||0)} ORDER${Number(x.orderCount||0)===1?'':'S'}</span></div><div><b>${money(x.totalSpent)}</b><small>Total spent</small></div><span></span></div>`).join(''):'<p class="empty-admin">No customers match this search.</p>'}if($('#customerSearch'))$('#customerSearch').oninput=customers;
function notifIcon(type){return type==='purchase'?'fa-bag-shopping':type==='review'?'fa-star':type==='message'?'fa-comment-dots':type==='subscriber'?'fa-user-plus':type==='donation'?'fa-hand-holding-heart':'fa-bell'}
function notificationTime(v){if(!v)return'Recently';const d=typeof v?.toDate==='function'?v.toDate():new Date(v);if(Number.isNaN(d.getTime()))return'Recently';const m=Math.floor((Date.now()-d)/60000);if(m<1)return'Just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`}
function notificationRoute(n){if(n.type==='purchase')return{view:'orders',sub:'paidOrders',orderId:n.orderId};if(n.type==='review')return{view:'community',sub:'reviewsPane',reviewId:n.reviewId};if(n.type==='message')return{view:'inbox',sub:'messagesPane'};if(n.type==='subscriber')return{view:'community',sub:'subscribersPane'};if(n.type==='donation')return{view:'sales',sub:'donationsPane'};return{view:'inbox',sub:'notificationsPane'}}
function activateSub(view,sub){go(view);const host=$(`#${view}`);if(!host||!sub)return;host.querySelectorAll('.admin-tabs [data-subtab]').forEach(x=>x.classList.toggle('active',x.dataset.subtab===sub));host.querySelectorAll(':scope > .admin-subview').forEach(x=>x.classList.toggle('active',x.id===sub))}
async function openAdminNotification(id){const n=rows('wdNotifications').find(x=>String(x.id)===String(id));if(!n)return;closeNotificationPopover();if(!n.read){n.read=true;try{await save('notifications',n)}catch{}renderAll()}const r=notificationRoute(n);activateSub(r.view,r.sub);if(r.orderId)setTimeout(()=>orderDrawer(r.orderId),60);if(r.reviewId)setTimeout(()=>reviewDrawer(r.reviewId),60)}window.openAdminNotification=openAdminNotification;
async function deleteAdminNotification(id,event){event?.stopPropagation();try{await del('notifications',id);renderAll();renderNotificationPopover();toast('Notification deleted.')}catch(err){console.error(err);toast('Notification could not be deleted.')}}window.deleteAdminNotification=deleteAdminNotification;
function notifications(){const a=[...rows('wdNotifications')].sort((a,b)=>new Date(b.createdAt?.toDate?.()||b.createdAt||0)-new Date(a.createdAt?.toDate?.()||a.createdAt||0));$('#notificationsList').innerHTML=a.length?a.map(n=>`<div class="list-row" data-notification-open="${esc(n.id)}"><div><h4>${esc(n.title||'Notification')}</h4><small>${esc(n.message||'')}</small></div><div><span class="badge ${n.read?'':'warn'}">${n.read?'READ':'NEW'}</span></div><div><small>${notificationTime(n.createdAt)}</small></div><button class="small-btn danger" data-delete-notification="${esc(n.id)}"><i class="fa-solid fa-xmark"></i></button></div>`).join(''):'<p class="empty-admin">No notifications yet.</p>';$$('[data-notification-open]').forEach(x=>x.onclick=e=>{if(e.target.closest('[data-delete-notification]'))return;openAdminNotification(x.dataset.notificationOpen)});$$('[data-delete-notification]').forEach(x=>x.onclick=e=>deleteAdminNotification(x.dataset.deleteNotification,e))}
function activity(){const a=[...rows('wdActivity')].sort((a,b)=>new Date(b.createdAt?.toDate?.()||b.createdAt||0)-new Date(a.createdAt?.toDate?.()||a.createdAt||0));$('#activityList').innerHTML=a.length?a.map(x=>`<div class="list-row"><div><h4>${esc(x.action||'Activity')}</h4><small>${esc(x.orderId||'Wrap District')}</small></div><div></div><div><small>${notificationTime(x.createdAt)}</small></div><span></span></div>`).join(''):'<p class="empty-admin">No activity recorded yet.</p>'}
let notificationTimer=null;function renderNotificationPopover(){const a=[...rows('wdNotifications')].sort((a,b)=>new Date(b.createdAt?.toDate?.()||b.createdAt||0)-new Date(a.createdAt?.toDate?.()||a.createdAt||0)),unread=a.filter(n=>!n.read).length;$('#notificationCount').textContent=unread>99?'99+':unread;$('#notificationCount').hidden=!unread;$('#notificationPopoverCount').textContent=unread;const list=$('#notificationPopoverList');list.innerHTML=a.length?a.slice(0,8).map(n=>`<article class="notification-popover-item ${n.read?'':'unread'}"><button class="notification-popover-open" onclick="openAdminNotification('${esc(n.id)}')"><span class="notification-popover-icon ${esc(n.type||'')}"><i class="fa-solid ${notifIcon(n.type)}"></i></span><span class="notification-popover-copy"><strong>${esc(n.title||'Notification')}</strong><span>${esc(n.message||'Tap to view')}</span><small>${notificationTime(n.createdAt)}</small></span></button><button class="notification-popover-delete" onclick="deleteAdminNotification('${esc(n.id)}',event)" aria-label="Delete notification"><i class="fa-solid fa-xmark"></i></button></article>`).join(''):'<div class="notification-popover-empty"><i class="fa-regular fa-bell"></i><strong>You’re all caught up</strong><p>New paid orders, reviews, messages and store updates will appear here.</p></div>'}
function closeNotificationPopover(){clearTimeout(notificationTimer);notificationTimer=null;$('#notificationPopover').classList.remove('show');$('#notificationPopover').setAttribute('aria-hidden','true');$('#notificationButton').setAttribute('aria-expanded','false')}
function openNotificationPopover(auto=false){renderNotificationPopover();$('#notificationPopover').classList.add('show');$('#notificationPopover').setAttribute('aria-hidden','false');$('#notificationButton').setAttribute('aria-expanded','true');clearTimeout(notificationTimer);if(auto)notificationTimer=setTimeout(closeNotificationPopover,5000)}
function setupNotifications(){const menu=$('#notificationMenu');$('#notificationButton').onclick=e=>{e.stopPropagation();$('#notificationPopover').classList.contains('show')?closeNotificationPopover():openNotificationPopover(false)};menu.onclick=e=>e.stopPropagation();document.addEventListener('click',e=>{if(!menu.contains(e.target))closeNotificationPopover()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNotificationPopover()});$('#viewAllNotifications').onclick=()=>{closeNotificationPopover();activateSub('inbox','notificationsPane')}}
function settings(){const s={businessEmail:WD_CONFIG.businessEmail,whatsapp:WD_CONFIG.whatsapp,social:WD_CONFIG.social,...cache.get('wdSettings',{})};const f=$('#settingsForm');f.businessEmail.value=s.businessEmail||'';f.whatsapp.value=s.whatsapp||'';for(const k of ['instagram','tiktok','snapchat','x','facebook'])f[k].value=s.social?.[k]||'';const checks=[['Firebase project',!!WD_CONFIG.firebase?.projectId],['Cloudinary uploads',!!WD_CONFIG.cloudinary?.cloudName&&!String(WD_CONFIG.cloudinary.cloudName).startsWith('YOUR_')],['Paystack payments',!!WD_CONFIG.paystackPublicKey&&!String(WD_CONFIG.paystackPublicKey).startsWith('YOUR_')],['Email notifications',!!WD_CONFIG.emailjs?.publicKey&&!String(WD_CONFIG.emailjs.publicKey).startsWith('YOUR_')],['Production domain',location.hostname==='wrapdistrict.food'||location.hostname==='www.wrapdistrict.food']];$('#setupChecks').innerHTML=checks.map(x=>`<div class="check-row-admin"><span>${x[0]}</span><i class="fa-solid fa-${x[1]?'circle-check ok':'circle-exclamation no'}"></i></div>`).join('')}$('#settingsForm').onsubmit=async e=>{e.preventDefault();const b=e.submitter,f=new FormData(e.target);busy(b,true);try{const old=cache.get('wdSettings',{}),v={...old,businessEmail:f.get('businessEmail'),whatsapp:f.get('whatsapp'),social:{instagram:f.get('instagram'),tiktok:f.get('tiktok'),snapchat:f.get('snapchat'),x:f.get('x'),facebook:f.get('facebook')}};await WD_DB.saveSettings(v);cache.set('wdSettings',v);toast('Website settings saved.')}catch{toast('We could not save the website settings. Try again.')}finally{busy(b,false)}};$('#seedFirebase').onclick=async e=>{if(!confirm('Copy the current default content into Firebase? Existing items with the same IDs will be updated.'))return;busy(e.currentTarget,true,'Copying');try{for(const p of WD_PRODUCTS)await WD_DB.save('menuItems',p.id,p,'wdProducts');for(const p of WD_DEFAULT_PROMOS)await WD_DB.save('promotions',p.id,p,'wdPromos');for(const p of WD_DEFAULT_SLIDES)await WD_DB.save('heroSlides',p.id,p,'wdSlides');for(const p of WD_DEFAULT_REVIEWS)await WD_DB.save('reviews',p.id,p,'wdReviews');toast('Default content copied to Firebase.');await load()}catch{toast('The content could not be copied. Check Firebase access and try again.')}finally{busy(e.currentTarget,false)}}
function setupAccountSecurity(){const ef=$('#changeEmailForm'),pf=$('#changePasswordForm');if(ef&&!ef.dataset.bound){ef.dataset.bound='1';ef.onsubmit=async e=>{e.preventDefault();const b=e.submitter,f=new FormData(e.target);busy(b,true,'Updating');try{await WD_DB.changeEmail(f.get('currentPassword'),String(f.get('newEmail')||'').trim());toast('Verification sent to the new email. Open that inbox to finish the change.');e.target.reset()}catch(err){console.error(err);toast(err.message||'Email could not be changed.')}finally{busy(b,false)}}}if(pf&&!pf.dataset.bound){pf.dataset.bound='1';pf.onsubmit=async e=>{e.preventDefault();const b=e.submitter,f=new FormData(e.target),np=String(f.get('newPassword')||''),cp=String(f.get('confirmPassword')||'');if(np!==cp)return toast('The new passwords do not match.');busy(b,true,'Updating');try{await WD_DB.changePassword(f.get('currentPassword'),np);toast('Password changed successfully.');e.target.reset()}catch(err){console.error(err);toast(err.message||'Password could not be changed.')}finally{busy(b,false)}}}}
function renderAll(){overview();orders();pendingPayments();abandoned();transactions();analytics();inventory();subscribersPage();products();promotions();slides();reviews();gallery();donations();team();messages();customers();notifications();activity();settings();renderNotificationPopover()}setupNotifications();setupAccountSecurity();auth()})();
