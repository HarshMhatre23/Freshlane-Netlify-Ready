import {categories,products,productById} from './catalog.js';
import {createAnalytics,totals,itemsFor,csv,money} from './analytics.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rupees=n=>'₹'+Number(n).toLocaleString('en-IN',{maximumFractionDigits:2});
const shapes={pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',chevron:'<path d="m8 10 4 4 4-4"/>',bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/>',chart:'<path d="M4 3v18h17M8 15v-4m5 4V6m5 9v-6"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',leaf:'<path d="M20 3C5 1 1 10 7 16c6 6 15 1 13-13Z"/><path d="M4 21 15 9"/>',check:'<path d="m5 12 4 4L20 5"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',ticket:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Z"/><path d="M15 6v2m0 3v2m0 3v2"/>',plus:'<path d="M12 5v14M5 12h14"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/>'};
const icon=name=>`<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${shapes[name]||shapes.leaf}</svg>`;
function icons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.outerHTML=icon(el.dataset.icon));}
icons();
const analytics=createAnalytics();
let cart={},coupon='',area='New Panvel, Mumbai',category='all',filter='all',searchTerm='',sort='featured',currentProducts=[],detailId=null,checkout=null,lastOrder=null,labTab='overview',eventFilter='all',selectedEvent=null;
try{
 const saved=JSON.parse(localStorage.getItem('freshlane_cart_v1')||'{}');
 for(const [id,q] of Object.entries(saved.cart||{}))if(productById[id]&&Number.isInteger(q)&&q>0)cart[id]=Math.min(q,20);
 coupon=saved.coupon==='FRESH10'?'FRESH10':'';
}catch{}
const areas=['New Panvel, Mumbai','Kharghar, Navi Mumbai','Vashi, Navi Mumbai'];
try{const saved=localStorage.getItem('freshlane_area');if(areas.includes(saved))area=saved;}catch{}
$('#location-label').textContent=area;
function persist(){try{localStorage.setItem('freshlane_cart_v1',JSON.stringify({cart,coupon}));}catch{}}
let toastTimer;
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
function count(){return Object.values(cart).reduce((s,n)=>s+n,0);}
function ecommerce(cartValue=cart,couponValue=coupon,extra={}){return {currency:'INR',value:totals(cartValue,couponValue).value,...(couponValue?{coupon:couponValue}:{}),items:itemsFor(cartValue,couponValue),...extra};}
function listContext(){const name=searchTerm?'Search results':category==='all'?'Everyday favourites':category;return {item_list_id:searchTerm?'search_results':category==='all'?'everyday_favourites':category.toLowerCase().replace(/[^a-z]+/g,'_'),item_list_name:name};}
const unitCart=id=>({[id]:1});
function addControl(p){const q=cart[p.id]||0;return q?`<div class="quantity" aria-label="Quantity for ${escape(p.name)}"><button data-quantity="${p.id}" data-change="-1" aria-label="Remove one ${escape(p.name)}">−</button><span>${q}</span><button data-quantity="${p.id}" data-change="1" aria-label="Add one ${escape(p.name)}" ${q>=20?'disabled':''}>+</button></div>`:`<button class="add-button" data-add="${p.id}" data-track="add_to_cart" aria-label="Add ${escape(p.name)} to cart">ADD ${icon('plus')}</button>`;}
function refreshControls(){
 $('#cart-count').textContent=count();
 $('#cart-button').setAttribute('aria-label',`Open cart, ${count()} items`);
 $$('[data-control]').forEach(el=>el.innerHTML=addControl(productById[el.dataset.control]));
}
function changeCart(id,delta){
 const old=cart[id]||0, next=Math.max(0,Math.min(20,old+delta));if(next===old){toast('Maximum 20 of each item per demo order.');return;}
 if(next)cart[id]=next;else delete cart[id];
 analytics.track(delta>0?'add_to_cart':'remove_from_cart',{ecommerce:ecommerce({[id]:Math.abs(next-old)},'',{...listContext()}),interaction_source:$('#drawer').open?'cart':$('#product-dialog').open?'product_detail':'product_list'});
 persist();refreshControls();if($('#drawer').open){checkout=null;renderCart();}
 if(delta>0)toast(`${productById[id].name} added to your basket`);
}
function renderCategories(){
 $('#categories').innerHTML=categories.map(c=>`<button class="category" data-category="${escape(c.name)}" data-track="select_category" aria-pressed="${category===c.name}" style="--cat-color:${c.color}"><span class="category-art"><img src="/assets/${c.art}.svg" alt="" width="110" height="110"></span><span class="category-label">${escape(c.short)}</span></button>`).join('');
}
const filters=[['all','All favourites'],['fresh','Fresh picks'],['deals','Best deals'],['under50','Under ₹50'],['protein','Protein picks']];
function renderFilters(){$('#filters').innerHTML=filters.map(([id,label])=>`<button class="filter ${filter===id?'active':''}" data-filter="${id}" aria-pressed="${filter===id}">${id==='fresh'?icon('leaf'):''}${label}</button>`).join('');}
function getProducts(){
 let result=products.filter(p=>(category==='all'||p.category===category)&&(!searchTerm||`${p.name} ${p.category} ${p.unit} ${p.badge}`.toLowerCase().includes(searchTerm.toLowerCase())));
 if(filter==='fresh')result=result.filter(p=>p.category==='Fruits & vegetables');
 if(filter==='deals')result=result.filter(p=>(p.mrp-p.price)/p.mrp>=.2);
 if(filter==='under50')result=result.filter(p=>p.price<50);
 if(filter==='protein')result=result.filter(p=>p.badge==='Protein Pick');
 if(sort==='price-low')result.sort((a,b)=>a.price-b.price);
 if(sort==='price-high')result.sort((a,b)=>b.price-a.price);
 if(sort==='discount')result.sort((a,b)=>(b.mrp-b.price)/b.mrp-(a.mrp-a.price)/a.mrp);
 return result;
}
let impressionObserver;let visibleBatch=[];let impressionTimer;
function watchImpressions(){
 impressionObserver?.disconnect();clearTimeout(impressionTimer);visibleBatch=[];
 const context=listContext();
 impressionObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){const p=productById[entry.target.dataset.product];visibleBatch.push({...itemsFor(unitCart(p.id),'')[0],index:currentProducts.findIndex(x=>x.id===p.id),...context});impressionObserver.unobserve(entry.target);}});
  if(visibleBatch.length){clearTimeout(impressionTimer);impressionTimer=setTimeout(()=>{if(visibleBatch.length)analytics.track('view_item_list',{ecommerce:{currency:'INR',...context,items:visibleBatch.splice(0)}});},180);}
 },{threshold:.5});
 $$('.product').forEach(el=>impressionObserver.observe(el));
}
function renderProducts(){
 currentProducts=getProducts();
 $('#catalog-title').textContent=searchTerm?`Results for “${searchTerm}”`:category==='all'?'Everyday favourites':category;
 $('#result-description').textContent=category==='all'&&!searchTerm&&filter==='all'?'The essentials you’ll keep coming back for.':`${currentProducts.length} fresh finds for your basket.`;
 $('#products').innerHTML=currentProducts.length?currentProducts.map(p=>`<article class="product" data-product="${p.id}"><span class="discount-badge">${Math.round((1-p.price/p.mrp)*100)}% OFF</span><button class="product-image" data-detail="${p.id}" data-track="select_item" aria-label="View ${escape(p.name)}"><img src="/assets/${p.art}.svg" alt="${escape(p.name)}" width="150" height="130" loading="lazy"></button><div class="product-content"><span class="product-meta">${icon(p.badge==='Fresh Pick'?'leaf':'clock')}${escape(p.badge)}</span><button class="product-title" data-detail="${p.id}">${escape(p.name)}</button><p class="product-unit">${escape(p.unit)}</p><div class="price-row"><span class="price">${rupees(p.price)}<s>${rupees(p.mrp)}</s></span><div data-control="${p.id}">${addControl(p)}</div></div></div></article>`).join(''):`<div class="empty-results"><h3>No fresh finds just yet.</h3><p>Try “milk”, “bread” or “fruit”, or explore all our favourites.</p><button class="primary" id="reset-products">Explore all products ${icon('arrow')}</button></div>`;
 renderFilters();renderCategories();watchImpressions();
}
function scrollToCatalog(){$('#catalog').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
function selectCategory(next){lastSearch=null;category=next;searchTerm='';$('#search').value='';$('#clear-search').hidden=true;filter='all';analytics.track('select_category',{category:next});renderProducts();scrollToCatalog();}
function resetProducts(){lastSearch=null;category='all';filter='all';searchTerm='';$('#search').value='';$('#clear-search').hidden=true;renderProducts();}
let searchTimer,lastSearch=null;
function runSearch(){
 clearTimeout(searchTimer);const term=$('#search').value.trim();if(term===lastSearch)return;lastSearch=term;searchTerm=term;category='all';filter='all';$('#clear-search').hidden=!term;renderProducts();
 if(term){const words=new Set(products.flatMap(p=>`${p.name} ${p.category}`.toLowerCase().split(/[^a-z]+/)));const safe=term.toLowerCase().split(/\s+/).every(w=>words.has(w));analytics.track('search',{search_term:safe?term.toLowerCase():'[unmatched query]',result_count:currentProducts.length});}
 scrollToCatalog();
}
$('#search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,450);});
$('#search-form').addEventListener('submit',e=>{e.preventDefault();runSearch();});
$('#clear-search').addEventListener('click',()=>{$('#search').value='';lastSearch=null;runSearch();$('#search').focus();});
$('#sort').addEventListener('change',e=>{sort=e.target.value;analytics.track('sort_products',{sort_order:sort});renderProducts();});
$('#all-categories').addEventListener('click',()=>{resetProducts();scrollToCatalog();});
function openDialog(dialog){if(!dialog.open)dialog.showModal();}
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
function openDetail(id){
 detailId=id;const p=productById[id];const ctx=listContext();
 analytics.track('select_item',{ecommerce:ecommerce(unitCart(id),'',ctx)});analytics.track('view_item',{ecommerce:ecommerce(unitCart(id),'',ctx)});
 $('#product-dialog').innerHTML=`<button class="icon-button close-dialog dialog-close" aria-label="Close product details">${icon('close')}</button><div class="detail-layout"><div class="detail-art"><img src="/assets/${p.art}.svg" alt="${escape(p.name)}"></div><div class="detail-copy"><span class="eyebrow">${escape(p.category.toUpperCase())}</span><h2 id="detail-title">${escape(p.name)}</h2><p>${escape(p.unit)}</p><div class="price-row"><span class="price">${rupees(p.price)}<s>${rupees(p.mrp)}</s></span><div data-control="${p.id}">${addControl(p)}</div></div><p>${escape(p.description)}</p><p class="detail-note" style="margin-top:20px">Original demo product · Prices and availability are illustrative.</p></div></div>`;
 openDialog($('#product-dialog'));
}
function billHTML(t){return `<div class="bill"><h3>Bill details</h3><div class="bill-row"><span>Items subtotal</span><span>${rupees(t.subtotal)}</span></div>${t.discount?`<div class="bill-row savings"><span>FRESH10 savings</span><span>−${rupees(t.discount)}</span></div>`:''}<div class="bill-row"><span>Demo delivery</span><span>${t.shipping?rupees(t.shipping):'FREE'}</span></div><div class="bill-row total"><span>Total</span><span data-total>${rupees(t.total)}</span></div></div>`;}
function cartRows(editable=true){return Object.entries(cart).map(([id,q])=>{const p=productById[id];return `<div class="cart-row"><img src="/assets/${p.art}.svg" alt=""><div class="cart-row-info"><h3>${escape(p.name)}</h3><p>${escape(p.unit)}${!editable?` × ${q}`:''}</p><strong>${rupees(p.price*q)}</strong></div>${editable?`<div class="cart-row-right"><div data-control="${id}">${addControl(p)}</div><button data-remove="${id}" aria-label="Remove all ${escape(p.name)}">Remove</button></div>`:''}</div>`;}).join('');}
function renderCart(){
 $('#drawer-title').textContent=`My basket${count()?` (${count()})`:''}`;
 if(!count()){$('#drawer-body').innerHTML=`<div class="empty-cart"><div class="modal-symbol">${icon('bag')}</div><h2>A little empty.<br>A lot of possibilities.</h2><p>Your everyday favourites are waiting.<br>Let’s find something fresh.</p><button class="primary" id="empty-shop">Start shopping ${icon('arrow')}</button></div>`;return;}
 const t=totals(cart,coupon);
 $('#drawer-body').innerHTML=`<div class="drawer-content"><div class="drawer-message">${icon('leaf')} ${t.subtotal<199?`Add ${rupees(199-t.subtotal)} for free standard demo delivery`:'Your basket qualifies for free standard demo delivery'}</div>${cartRows()}<form id="coupon-form" class="coupon"><input id="coupon-input" aria-label="Promo code" placeholder="Try FRESH10" value="${coupon}" maxlength="20"><button class="secondary" type="submit">${coupon?'Remove':'Apply'}</button></form>${coupon?'<p class="coupon-message">FRESH10 applied. A little treat, on us.</p>':''}${billHTML(t)}<button id="begin-checkout" class="primary full-width" data-track="begin_checkout">Continue to checkout ${icon('arrow')}</button><p class="demo-info">Demo checkout · No real payment or delivery</p></div>`;
}
function openCart(){checkout=null;renderCart();analytics.track('view_cart',{ecommerce:ecommerce()});openDialog($('#drawer'));}
$('#cart-button').addEventListener('click',openCart);
function applyCoupon(){
 if(coupon){coupon='';persist();analytics.track('remove_coupon',{coupon:'FRESH10'});renderCart();return;}
 const input=$('#coupon-input').value.trim().toUpperCase();if(input!=='FRESH10'){analytics.track('coupon_error',{error_type:'invalid_code'});toast('Use FRESH10 for 10% off, up to ₹75.');return;}
 coupon=input;persist();analytics.track('apply_coupon',{coupon,discount_value:totals(cart,coupon).discount});renderCart();toast('FRESH10 applied — enjoy your little treat.');
}
function checkoutSteps(){return `<div class="checkout-steps">${['Delivery','Demo payment','Review'].map((s,i)=>`<span class="${checkout.step===i?'current':''}"><b>${i+1}</b>${s}</span>`).join('')}</div>`;}
function beginCheckout(){if(!count())return;checkout={step:0,shipping:'standard',address:'demo_home',payment:'demo_cod'};analytics.track('begin_checkout',{ecommerce:ecommerce()});renderCheckout();}
function renderCheckout(){
 $('#drawer-title').textContent='A few little details';let content='';
 if(checkout.step===0)content=`<h3 class="checkout-title">Where should it go?</h3><p class="checkout-subtitle">Use a sample address. This order is a simulation.</p><label class="option-card"><input type="radio" name="address" value="demo_home" ${checkout.address==='demo_home'?'checked':''}><span><strong>Demo home</strong><small>Sample Apartment, ${escape(area)}<br>Illustrative address · No personal details collected</small></span></label><label class="option-card"><input type="radio" name="address" value="demo_campus" ${checkout.address==='demo_campus'?'checked':''}><span><strong>Demo campus</strong><small>Sample College, ${escape(area)}<br>Illustrative address</small></span></label><h3 class="checkout-title">Delivery preference</h3><label class="option-card"><input type="radio" name="shipping" value="standard" ${checkout.shipping==='standard'?'checked':''}><span><strong>Standard · ${totals(cart,coupon,'standard').shipping?rupees(25):'Free'}</strong><small>30–45 minutes · Illustrative estimate</small></span></label><label class="option-card"><input type="radio" name="shipping" value="priority" ${checkout.shipping==='priority'?'checked':''}><span><strong>Priority · ₹35</strong><small>15–20 minutes · Illustrative estimate</small></span></label><div class="checkout-actions"><button class="primary" id="checkout-next">Continue to demo payment ${icon('arrow')}</button><button class="text-button" id="back-cart">Back to basket</button></div>`;
 if(checkout.step===1)content=`<h3 class="checkout-title">Choose a demo payment</h3><p class="checkout-subtitle">No money moves. Choose an option to explore the checkout flow.</p><label class="option-card"><input type="radio" name="payment" value="demo_cod" ${checkout.payment==='demo_cod'?'checked':''}><span><strong>Pay on delivery — simulation</strong><small>A demo selection only. No delivery will be made.</small></span></label><label class="option-card"><input type="radio" name="payment" value="demo_wallet" ${checkout.payment==='demo_wallet'?'checked':''}><span><strong>Demo wallet</strong><small>Simulated balance. No account or card required.</small></span></label>${billHTML(totals(cart,coupon,checkout.shipping))}<div class="checkout-actions"><button class="primary" id="checkout-next">Review your demo order ${icon('arrow')}</button><button class="text-button" id="checkout-back">Back to delivery</button></div>`;
 if(checkout.step===2)content=`<h3 class="checkout-title">One last look.</h3><p class="checkout-subtitle">${checkout.address==='demo_home'?'Demo home':'Demo campus'} · ${escape(area)}<br>${checkout.shipping==='priority'?'Priority':'Standard'} delivery · ${checkout.payment==='demo_wallet'?'Demo wallet':'Simulated pay on delivery'}</p>${cartRows(false)}${billHTML(totals(cart,coupon,checkout.shipping))}<div class="checkout-actions"><button class="primary" id="place-order" data-track="purchase">Place demo order ${icon('check')}</button><button class="text-button" id="checkout-back">Back to demo payment</button></div><p class="demo-info">This creates a simulated order. No charge. No delivery.</p>`;
 $('#drawer-body').innerHTML=`<div class="drawer-content">${checkoutSteps()}${content}</div>`;$('#drawer').scrollTop=0;
}
function checkoutNext(){
 if(checkout.step===0){checkout.address=$('input[name=address]:checked').value;checkout.shipping=$('input[name=shipping]:checked').value;analytics.track('add_shipping_info',{ecommerce:ecommerce(cart,coupon,{shipping_tier:checkout.shipping}),address_type:checkout.address});}
 else if(checkout.step===1){checkout.payment=$('input[name=payment]:checked').value;analytics.track('add_payment_info',{ecommerce:ecommerce(cart,coupon,{payment_type:checkout.payment})});}
 checkout.step++;renderCheckout();
}
function placeOrder(){
 if(!checkout||checkout.step!==2||!count())return;const snapshot={...checkout};checkout.step=3;const button=$('#place-order');if(button)button.disabled=true;
 const t=totals(cart,coupon,snapshot.shipping),id='DEMO-'+crypto.randomUUID();
 const event=analytics.track('purchase',{ecommerce:ecommerce(cart,coupon,{transaction_id:id,shipping:t.shipping,tax:0,shipping_tier:snapshot.shipping,payment_type:snapshot.payment}),order_total:t.total});
 lastOrder={id,time:event.timestamp,...t,items:itemsFor(cart,coupon),shipping:snapshot.shipping,area};
 cart={};coupon='';persist();refreshControls();renderSuccess();
}
function renderSuccess(){
 $('#drawer-title').textContent='A basket of everyday joy';
 $('#drawer-body').innerHTML=`<div class="drawer-content"><div class="success"><div class="success-symbol">${icon('check')}</div><h2>Your demo order is in!</h2><p>You’ve completed the shopping journey.<br>No payment was taken and no delivery will be made.</p><span class="order-ref">${escape(lastOrder.id.slice(0,18))}</span><p>Demo total <strong>${rupees(lastOrder.total)}</strong> · ${lastOrder.items.reduce((s,i)=>s+i.quantity,0)} items</p><button class="primary full-width" id="order-analytics">See your journey in Analytics Lab ${icon('chart')}</button><button class="secondary full-width" id="receipt-download" style="margin-top:10px">${icon('download')} Download demo receipt</button><button class="text-button" id="keep-shopping" style="margin-top:18px">Keep exploring ${icon('arrow')}</button></div></div>`;$('#drawer').scrollTop=0;
}
$('#location-button').addEventListener('click',()=>{renderAreas();openDialog($('#location-dialog'));});
function renderAreas(){$('#area-options').innerHTML=areas.map(a=>`<button class="area-option" data-area="${escape(a)}" aria-pressed="${a===area}">${escape(a)}${a===area?icon('check'):icon('arrow')}</button>`).join('');}
function promotion(id){analytics.track('select_promotion',{ecommerce:{promotion_id:id,promotion_name:id==='fresh10'?'Fresh start 10% off':'Everyday fresh',creative_slot:id==='fresh10'?'offer_strip':'hero'}});}
$('#offer-button').addEventListener('click',()=>{promotion('fresh10');if(!count()){toast('Add your favourites, then use FRESH10 in your basket.');scrollToCatalog();}else{openCart();$('#coupon-input').value='FRESH10';$('#coupon-input').focus();}});
function download(name,contents,type='text/csv;charset=utf-8'){const blob=new Blob([contents],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function datasetDownload(which){
 const data=analytics.exports();
 const configs={events:[data.eventRows,['event_id','timestamp','event_date','session_id','event_name','demo_mode','page_path','currency','value','shipping','transaction_id','coupon','search_term','result_count','category','shipping_tier','payment_type']],items:[data.itemRows,['event_id','event_name','session_id','timestamp','transaction_id','line_index','item_id','item_name','item_brand','item_category','item_variant','price','discount','quantity','line_value']],products:[data.products,['item_id','item_name','item_category','item_brand','item_variant','list_price','mrp']]};
 if(which==='json'){download('freshlane_raw_events.json',JSON.stringify(analytics.events,null,2),'application/json');return;}
 const [rows,columns]=configs[which];download(`freshlane_${which}.csv`,csv(rows,columns));toast(`${which[0].toUpperCase()+which.slice(1)} export ready.`);
}
function openLab(){renderLab();openDialog($('#analytics-dialog'));}
$('#lab-button').addEventListener('click',openLab);$('#footer-lab').addEventListener('click',openLab);
function orderedFunnel(events){
 const names=['view_item_list','view_item','add_to_cart','begin_checkout','purchase'];let sessions=new Map();
 for(const e of events){let state=sessions.get(e.session_id)||0;if(e.event===names[state])sessions.set(e.session_id,state+1);}
 return names.map((name,i)=>({name,count:[...sessions.values()].filter(s=>s>i).length}));
}
function renderLab(){
 const events=analytics.events;$('#event-count').textContent=events.length;$$('[data-tab]').forEach(b=>{b.setAttribute('aria-selected',b.dataset.tab===labTab);b.tabIndex=b.dataset.tab===labTab?0:-1;});
 const purchases=events.filter(e=>e.event==='purchase');
 if(labTab==='overview'){
  const sessionCount=new Set(events.map(e=>e.session_id)).size;
  const funnel=orderedFunnel(events);const top={};for(const e of events.filter(e=>e.event==='add_to_cart'))for(const i of e.ecommerce.items)top[i.item_id]=(top[i.item_id]||0)+i.quantity;
  const topRows=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,5);
  $('#lab-content').innerHTML=`<div class="kpi-grid"><div class="kpi"><small>Demo sessions</small><strong>${sessionCount}</strong><p>Distinct local session IDs</p></div><div class="kpi"><small>Add-to-cart actions</small><strong>${events.filter(e=>e.event==='add_to_cart').length}</strong><p>Individual add interactions</p></div><div class="kpi"><small>Demo orders</small><strong>${purchases.length}</strong><p>Unique simulated purchases</p></div><div class="kpi"><small>Demo item revenue</small><strong>${rupees(purchases.reduce((s,e)=>s+e.ecommerce.value,0))}</strong><p>After discounts · Excludes shipping</p></div></div><div class="lab-split"><div class="lab-box"><h3>The shopping journey</h3><p>Sessions completing each step in this order.</p>${funnel.map((f,i)=>`<div class="funnel-row"><span>${['Saw products','Viewed details','Added to basket','Started checkout','Placed demo order'][i]}</span><div class="funnel-track"><div style="width:${funnel[0].count?f.count/funnel[0].count*100:0}%"></div></div><b>${f.count}</b></div>`).join('')}<p class="small" style="margin:17px 0 0">Direct card adds can skip product details; those sessions are excluded from later steps in this strict funnel.</p></div><div class="lab-box"><h3>Basket favourites</h3><p>Products ranked by total units added.</p>${topRows.length?topRows.map(([id,q])=>`<div class="top-product">${escape(productById[id]?.name||id)}<span>${q} ${q===1?'unit':'units'}</span></div>`).join(''):'<p style="margin-top:32px">Add something to your basket to see the first insight.</p>'}</div></div><div class="lab-note">${analytics.storageAvailable?'These are real interactions with simulated products, stored only in this browser.':'Browser storage is unavailable. Events are retained in memory only; export before leaving.'} No external analytics account is connected. Up to 3,000 recent events are retained; export before clearing browser data.</div>`;
 }else if(labTab==='events'){
  const visible=events.filter(e=>eventFilter==='all'||e.event===eventFilter).slice(-100).reverse();const names=[...new Set(events.map(e=>e.event))].sort();
  $('#lab-content').innerHTML=`<div class="events-toolbar"><label>Event <select id="event-filter"><option value="all">All events</option>${names.map(n=>`<option ${n===eventFilter?'selected':''}>${escape(n)}</option>`).join('')}</select></label><span>Latest 100 matching events · UTC</span></div><div class="table-wrap"><table><thead><tr><th>Time</th><th>Event</th><th>Items</th><th>Item value</th><th>Payload</th></tr></thead><tbody>${visible.length?visible.map(e=>`<tr><td>${e.timestamp.slice(11,19)}</td><td><code>${escape(e.event)}</code></td><td>${(e.ecommerce?.items||[]).reduce((s,i)=>s+i.quantity,0)||'—'}</td><td>${e.ecommerce?.value!=null?rupees(e.ecommerce.value):'—'}</td><td><button class="inspect-event" data-inspect="${e.event_id}">Inspect</button></td></tr>`).join(''):'<tr><td colspan="5">No matching events yet. Try a shopping interaction.</td></tr>'}</tbody></table></div>${selectedEvent?`<pre tabindex="0" aria-label="Event payload">${escape(JSON.stringify(events.find(e=>e.event_id===selectedEvent)||{},null,2))}</pre>`:''}`;
 }else if(labTab==='guide'){
  $('#lab-content').innerHTML=`<div class="guide"><div class="lab-note" style="margin-top:0">The store sends GA4-shaped events to <code>window.dataLayer</code>. GTM and GA4 scripts are not installed, so nothing is sent to Google. Connect a dedicated test property only after your approval.</div><h3>A clear event for every interaction</h3><div class="table-wrap"><table><thead><tr><th>Interaction</th><th>Event</th><th>Useful analysis</th></tr></thead><tbody>${[['Products enter the viewport','view_item_list','Product exposure'],['Open a product','select_item → view_item','Product engagement'],['Search groceries','search','Search demand and zero-result searches'],['Choose category / sort / filter','select_category / sort_products / filter_products','Discovery behaviour'],['Add / decrease / remove','add_to_cart / remove_from_cart','Basket demand and removals'],['Open basket','view_cart','Cart engagement'],['Start / delivery / demo payment','begin_checkout / add_shipping_info / add_payment_info','Checkout drop-off'],['Place a demo order','purchase','Demo conversions, revenue and AOV'],['View / click an offer','view_promotion / select_promotion','Promotion engagement']].map(r=>`<tr>${r.map(c=>`<td>${escape(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><h3>From this shop to your dashboard</h3><p>Export all three CSVs. In Power BI or Tableau, relate <code>events.event_id → items.event_id</code> (one-to-many) and <code>products.item_id → items.item_id</code> (one-to-many). Import IDs as text and timestamps as UTC. Only <code>purchase</code> rows count as sales.</p><p>Build cards for sessions, orders, demo revenue and average order value; then add the shopping funnel, top products, category revenue and zero-result search rate. Event value excludes shipping. Never sum revenue over all event types or multiply event revenue after joining to item rows.</p><p>For GA4/GTM setup, stable <code>data-track</code> attributes are present, but use data-layer Custom Event triggers to avoid duplicate click tracking. The complete setup and metric definitions are in the project guide.</p><a class="secondary" href="/ANALYTICS_GUIDE.md" download>${icon('download')} Download project guide</a><a class="secondary" href="https://developers.google.com/analytics/devguides/collection/ga4/ecommerce" target="_blank" rel="noopener noreferrer">Official GA4 event reference ${icon('arrow')}</a><h3>Privacy by design</h3><p>Sample addresses and payment options only. Searches outside the grocery vocabulary are logged as “[unmatched query]”. No names, phone numbers, card details, location access or raw search text are collected. All events include <code>demo_mode: true</code>.</p><button class="text-button" id="show-reset">Reset local demo data</button></div>`;
 }else if(labTab==='export'){
  $('#lab-content').innerHTML=`<div class="guide"><h3 style="margin-top:0">Your data, ready for the dashboard.</h3><p>Download these three related tables, then import them into Power BI or Tableau. All records are demo activity from this browser.</p><div class="download-grid"><button class="download-card" data-download="events">${icon('download')}<strong>events.csv</strong><span>One row per event. Sessions, search, transaction IDs, revenue and shipping.</span></button><button class="download-card" data-download="items">${icon('download')}<strong>items.csv</strong><span>Product lines per event. Prices, quantities, discounts and categories.</span></button><button class="download-card" data-download="products">${icon('download')}<strong>products.csv</strong><span>The product dimension. Stable IDs, categories, units and list prices.</span></button></div><button class="secondary" data-download="json" style="margin-top:18px">${icon('download')} Raw event JSON</button><a class="secondary" href="/ANALYTICS_GUIDE.md" download>${icon('download')} Project guide</a><div class="lab-note">Select each file to download. Export before clearing data. UTC timestamps and INR prices keep your reports consistent.</div></div>`;
 }else if(labTab==='reset'){
  $('#lab-content').innerHTML=`<div class="guide"><h3>Start with a clean slate?</h3><p>This deletes this browser’s Freshlane event history, basket and coupon. Download your data first if you want to keep it.</p><button class="secondary" id="cancel-reset">Keep my data</button><button class="primary" id="confirm-reset">Clear local demo data</button></div>`;
 }
}
window.addEventListener('freshlane:event',()=>{if($('#analytics-dialog').open&&labTab==='overview')renderLab();if($('#analytics-dialog').open)$('#event-count').textContent=analytics.events.length;});
let refreshAfterLab=false;
$('#new-session').addEventListener('click',()=>{analytics.newSession();refreshAfterLab=true;renderLab();toast('New demo session started. Basket preserved.');});
$('#analytics-dialog').addEventListener('close',()=>{if(refreshAfterLab){refreshAfterLab=false;renderProducts();}});
$('#export-data').addEventListener('click',()=>{labTab='export';renderLab();});
$('.lab-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=$$('[data-tab]');let index=tabs.indexOf(document.activeElement);index=e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowRight'?1:-1)+3)%3;labTab=tabs[index].dataset.tab;renderLab();tabs[index].focus();});
document.addEventListener('change',e=>{if(e.target.id==='event-filter'){eventFilter=e.target.value;selectedEvent=null;renderLab();}});
document.addEventListener('submit',e=>{if(e.target.id==='coupon-form'){e.preventDefault();applyCoupon();}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.classList.contains('close-dialog'))b.closest('dialog').close();
 if(b.dataset.add)changeCart(b.dataset.add,1);
 if(b.dataset.quantity)changeCart(b.dataset.quantity,Number(b.dataset.change));
 if(b.dataset.remove)changeCart(b.dataset.remove,-cart[b.dataset.remove]);
 if(b.dataset.detail)openDetail(b.dataset.detail);
 if(b.dataset.category)selectCategory(b.dataset.category);
 if(b.dataset.filter){filter=b.dataset.filter;analytics.track('filter_products',{filter_type:filter});renderProducts();}
 if(b.dataset.nav){$$('[data-nav]').forEach(x=>x.classList.toggle('nav-active',x===b));if(b.dataset.nav==='deals'){resetProducts();filter='deals';analytics.track('filter_products',{filter_type:'deals'});renderProducts();scrollToCatalog();}else selectCategory(b.dataset.nav);}
 if(b.dataset.shop){promotion(b.dataset.promo);resetProducts();scrollToCatalog();}
 if(b.dataset.area){area=b.dataset.area;try{localStorage.setItem('freshlane_area',area);}catch{}$('#location-label').textContent=area;analytics.track('select_delivery_area',{delivery_area:area});$('#location-dialog').close();toast(`Demo delivery area set to ${area}`);}
 if(b.dataset.tab){labTab=b.dataset.tab;selectedEvent=null;renderLab();}
 if(b.dataset.inspect){selectedEvent=b.dataset.inspect;renderLab();}
 if(b.dataset.download)datasetDownload(b.dataset.download);
 switch(b.id){
  case 'reset-products':resetProducts();break;
  case 'empty-shop':case 'keep-shopping':$('#drawer').close();scrollToCatalog();break;
  case 'begin-checkout':beginCheckout();break;
  case 'checkout-next':checkoutNext();break;
  case 'back-cart':checkout=null;renderCart();break;
  case 'checkout-back':checkout.step--;renderCheckout();break;
  case 'place-order':placeOrder();break;
  case 'order-analytics':$('#drawer').close();labTab='overview';openLab();break;
  case 'receipt-download':download('freshlane_demo_receipt.json',JSON.stringify({notice:'SIMULATED ORDER — NO PAYMENT OR DELIVERY',...lastOrder},null,2),'application/json');break;
  case 'show-reset':labTab='reset';renderLab();break;
  case 'cancel-reset':labTab='guide';renderLab();break;
  case 'confirm-reset':cart={};coupon='';checkout=null;persist();analytics.clear();refreshAfterLab=true;refreshControls();labTab='overview';renderLab();toast('Local demo data cleared. A new session is ready.');break;
 }
});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('dialog[open]')){e.preventDefault();$('#search').focus();}});
// Keep persisted baskets coherent if the shop is open in another tab.
window.addEventListener('storage',e=>{if(e.key==='freshlane_cart_v1'){try{const saved=JSON.parse(e.newValue||'{}');cart={};for(const [id,q] of Object.entries(saved.cart||{}))if(productById[id]&&Number.isInteger(q)&&q>0&&q<=20)cart[id]=q;coupon=saved.coupon==='FRESH10'?'FRESH10':'';checkout=null;refreshControls();if($('#drawer').open)renderCart();}catch{}}});
renderProducts();refreshControls();
const promoObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){const id=e.target.classList.contains('hero')?'everyday_fresh':'fresh10';analytics.track('view_promotion',{ecommerce:{promotion_id:id,promotion_name:id==='fresh10'?'Fresh start 10% off':'Everyday fresh',creative_slot:id==='fresh10'?'offer_strip':'hero'}});promoObserver.unobserve(e.target);}},{threshold:.5});
promoObserver.observe($('.hero'));promoObserver.observe($('.offer-strip'));
