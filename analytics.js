import { products, productById } from './catalog.js';
export const EVENTS_KEY='freshlane_events_v1';
export const money=n=>Math.round((n+Number.EPSILON)*100)/100;
export function totals(cart,coupon='',shippingTier='standard') {
  const subtotal=money(Object.entries(cart).reduce((s,[id,q])=>s+(productById[id]?.price||0)*q,0));
  const discount=coupon==='FRESH10'?money(Math.min(subtotal*.1,75)):0;
  const value=money(subtotal-discount);
  const shipping=subtotal===0?0:shippingTier==='priority'?35:subtotal>=199?0:25;
  return {subtotal,discount,value,shipping,total:money(value+shipping)};
}
export function itemsFor(cart,coupon='') {
  const {subtotal,discount}=totals(cart,coupon);
  let remaining=Math.round(discount*100);
  // Allocate the coupon in whole paise; split a quantity into price groups if necessary.
  const units=Object.entries(cart).flatMap(([id,q])=>Array.from({length:q},()=>({p:productById[id]})));
  const result=[];
  units.forEach(({p},i)=>{
    const cents=i===units.length-1?remaining:Math.min(remaining,Math.floor(discount*100*p.price/subtotal)); remaining-=cents;
    const d=cents/100, price=money(p.price-d);
    const existing=result.find(x=>x.item_id===p.id&&x.price===price);
    if(existing)existing.quantity++;
    else result.push({item_id:p.id,item_name:p.name,item_brand:p.brand,item_category:p.category,item_variant:p.unit,price,discount:d,quantity:1,...(coupon?{coupon}:{} )});
  });return result;
}
export function csv(rows,columns){
  const safe=v=>{let s=typeof v==='object'&&v!==null?JSON.stringify(v):String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  return '\uFEFF'+[columns.map(safe).join(','),...rows.map(r=>columns.map(c=>safe(r[c])).join(','))].join('\r\n');
}
export function createAnalytics(){
  let events=[],storageAvailable=true;
  const read=(storage,key,fallback)=>{try{return JSON.parse(storage.getItem(key))??fallback;}catch{return fallback;}};
  try{events=read(localStorage,EVENTS_KEY,[]);if(!Array.isArray(events))events=[];}catch{storageAvailable=false;}
  events=events.filter(e=>e&&typeof e.event==='string'&&e.event_id&&e.session_id&&typeof e.timestamp==='string');
  let session;try{session=sessionStorage.getItem('freshlane_session');}catch{}
  const fresh=!session;
  const saveSession=()=>{try{sessionStorage.setItem('freshlane_session',session);}catch{storageAvailable=false;}};
  if(!session){session=crypto.randomUUID();saveSession();}
  window.dataLayer=window.dataLayer||[];
  function track(event,params={}){
    const record={event,event_id:crypto.randomUUID(),timestamp:new Date().toISOString(),session_id:session,page_path:location.pathname,demo_mode:true,...params};
    // Reset ecommerce for every event so a future GTM tag cannot inherit stale items.
    window.dataLayer.push({ecommerce:null});window.dataLayer.push(record);
    if(window.dataLayer.length>6002)window.dataLayer.splice(0,window.dataLayer.length-6002);
    try { const other=read(localStorage,EVENTS_KEY,[]); if(Array.isArray(other)){ const combined=new Map([...events,...other].filter(e=>e&&e.event_id&&e.session_id).map(e=>[e.event_id,e])); events=[...combined.values()].sort((a,b)=>a.timestamp.localeCompare(b.timestamp)); }}catch{}
    events.push(record);if(events.length>3000)events=events.slice(-3000);
    try{localStorage.setItem(EVENTS_KEY,JSON.stringify(events));}catch{storageAvailable=false;}
    window.dispatchEvent(new CustomEvent('freshlane:event',{detail:record}));return record;
  }
  if(fresh)track('session_start');
  track('page_view',{page_title:document.title});
  return {track,get events(){return [...events]},get storageAvailable(){return storageAvailable},get session(){return session},newSession(){session=crypto.randomUUID();saveSession();track('session_start');track('page_view',{page_title:document.title});},clear(){events=[];window.dataLayer.length=0;try{localStorage.removeItem(EVENTS_KEY);}catch{};this.newSession();},exports(){
    const eventRows=events.map(e=>({event_id:e.event_id,timestamp:e.timestamp,event_date:e.timestamp.slice(0,10),session_id:e.session_id,event_name:e.event,demo_mode:true,page_path:e.page_path,currency:e.ecommerce?.currency??'',value:e.ecommerce?.value??'',shipping:e.ecommerce?.shipping??'',transaction_id:e.ecommerce?.transaction_id??'',coupon:e.ecommerce?.coupon??'',search_term:e.search_term??'',result_count:e.result_count??'',category:e.category??'',shipping_tier:e.ecommerce?.shipping_tier??'',payment_type:e.ecommerce?.payment_type??''}));
    const itemRows=events.flatMap(e=>(e.ecommerce?.items||[]).map((i,n)=>({event_id:e.event_id,event_name:e.event,session_id:e.session_id,timestamp:e.timestamp,transaction_id:e.ecommerce?.transaction_id??'',line_index:n,...i,line_value:money(i.price*i.quantity)})));
    return {eventRows,itemRows,products:products.map(p=>({item_id:p.id,item_name:p.name,item_category:p.category,item_brand:p.brand,item_variant:p.unit,list_price:p.price,mrp:p.mrp}))};
  }};
}
