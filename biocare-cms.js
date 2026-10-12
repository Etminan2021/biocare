/* Biocare public CMS runtime */
(()=>{'use strict';
const URL='https://jlibhpavbqfeegsehekm.supabase.co',KEY='sb_publishable_XVOmCPOiqdUlG-pOPhrQ0g_rIV0R6tK';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function rpc(name,args={}){const r=await fetch(`${URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:JSON.stringify(args)});if(!r.ok)throw Error(await r.text());return r.json()}
let content=[],services={},settings={},observer=null,carouselTimer=null;
function safeUrl(u){try{const x=new URL(String(u||''),location.href);return ['https:','http:'].includes(x.protocol)?x.href:''}catch{return''}}
function media(i){
 const u=safeUrl(i.media_url);if(!u)return'';
 if(i.kind==='video'){
   const yt=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
   if(yt)return `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(yt[1])}" title="${esc(i.title||'فيديو')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
   return `<video controls playsinline preload="metadata" src="${u}"></video>`;
 }
 return `<img src="${u}" alt="${esc(i.title||'إعلان')}">`;
}
function injectTicker(){
 let el=document.getElementById('bcCmsTicker');const items=content.filter(x=>x.kind==='ticker');
 if(!items.length){el?.remove();return}
 if(!el){el=document.createElement('div');el.id='bcCmsTicker';document.querySelector('.app-header')?.after(el)}
 el.innerHTML=`<div class="bc-cms-ticker-track">${items.map(i=>`<span>${esc(i.title||i.subtitle||'')}</span>`).join('<span class="sep">•</span>')}</div>`;
}
function injectHome(){
 const app=document.getElementById('app'),hero=app?.querySelector('.hero');if(!hero)return;
 const banners=content.filter(x=>x.kind==='banner'),videos=content.filter(x=>x.kind==='video');
 document.getElementById('bcCmsBanners')?.remove();document.getElementById('bcCmsVideos')?.remove();
 if(banners.length){
  const wrap=document.createElement('section');wrap.id='bcCmsBanners';wrap.className='bc-cms-banners';
  wrap.innerHTML=banners.map((i,n)=>{const link=safeUrl(i.link_url);return `<article class="bc-cms-banner" data-n="${n}">${link?`<a href="${link}" target="_blank" rel="noopener">`:''}${media(i)}<div class="bc-cms-copy"><h3>${esc(i.title||'')}</h3>${i.subtitle?`<p>${esc(i.subtitle)}</p>`:''}${i.button_label?`<span class="bc-cms-btn">${esc(i.button_label)}</span>`:''}</div>${link?'</a>':''}</article>`}).join('');
  hero.before(wrap);
  clearInterval(carouselTimer);if(banners.length>1)carouselTimer=setInterval(()=>{wrap.scrollBy({left:-wrap.clientWidth,behavior:'smooth'});if(wrap.scrollLeft+wrap.clientWidth>=wrap.scrollWidth-10)setTimeout(()=>wrap.scrollTo({left:0,behavior:'smooth'}),500)},6000)
 }
 if(videos.length){
  const sec=document.createElement('section');sec.id='bcCmsVideos';sec.className='section bc-cms-videos';sec.innerHTML=`<div class="section-head"><h2>فيديوهات بيوكير</h2></div><div class="bc-cms-video-grid">${videos.map(i=>`<article class="card">${media(i)}<h3>${esc(i.title||'')}</h3>${i.subtitle?`<p class="muted">${esc(i.subtitle)}</p>`:''}</article>`).join('')}</div>`;app.appendChild(sec)
 }
 const h=hero.querySelector('.hero-copy h1'),p=hero.querySelector('.hero-copy p');
 if(h&&settings.hero_title)h.textContent=settings.hero_title;
 if(p&&settings.hero_text)p.textContent=settings.hero_text;
}
function applyServiceRules(){
 const isOn=k=>services[k]!==false;
 const oldOpen=window.biocareOpen;if(oldOpen&&!oldOpen.__cms){const f=function(type){const map={home:'home_care',virtual:'virtual_clinic',radiology:'radiology'};if(map[type]&&!isOn(map[type]))return alert('هذه الخدمة غير متاحة حاليًا.');return oldOpen.apply(this,arguments)};f.__cms=true;window.biocareOpen=f}
 const oldReq=window.biocareRequest;if(oldReq&&!oldReq.__cms){const f=function(type){const map={doctor:'home_doctor',nursing:'home_nursing',physio:'home_physio',labs:'home_labs'};if(map[type]&&!isOn(map[type]))return alert('هذه الخدمة غير متاحة حاليًا.');return oldReq.apply(this,arguments)};f.__cms=true;window.biocareRequest=f}
 if(!isOn('saleem'))document.querySelectorAll('button').forEach(b=>{if(/سليم/.test(b.textContent||''))b.closest('section,.card,.bio-care-tile')?.classList.add('hidden')});
}
function applyCatalog(overrides){
 const cat=window.BIOCARE_CATALOG;if(!cat)return;
 for(const o of overrides||[]){const arr=o.item_type==='test'?cat.tests:cat.packages,idKey=o.item_type==='test'?'code':'id',idx=arr.findIndex(x=>String(x[idKey])===String(o.item_id));if(idx<0)continue;if(o.active===false){arr.splice(idx,1);continue}const x=arr[idx];if(o.display_name)x.name=o.display_name;if(o.price_override!==null&&o.price_override!==undefined)x.price=Number(o.price_override)}
 if(typeof window.render==='function')window.render()
}
async function load(){
 try{
  const [c,s,st,o]=await Promise.all([rpc('care_public_content'),rpc('care_public_services'),rpc('care_public_settings'),rpc('care_public_catalog_overrides')]);
  content=c||[];for(const x of s||[])services[x.service_key]=x.enabled;for(const x of st||[])settings[x.setting_key]=x.setting_value||'';
  applyCatalog(o);injectTicker();injectHome();applyServiceRules();
  const app=document.getElementById('app');if(app){observer=new MutationObserver(()=>{injectHome();applyServiceRules()});observer.observe(app,{childList:true,subtree:false})}
 }catch(e){console.warn('CMS unavailable',e)}
}
const style=document.createElement('style');style.textContent=`
#bcCmsTicker{background:#155b3f;color:#fff;overflow:hidden;white-space:nowrap;padding:8px 0;font-weight:800}
.bc-cms-ticker-track{display:inline-flex;gap:18px;align-items:center;padding-inline:20px;animation:bcTicker 20s linear infinite}.bc-cms-ticker-track .sep{opacity:.55}@keyframes bcTicker{from{transform:translateX(-10%)}to{transform:translateX(100%)}}
.bc-cms-banners{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;margin:14px;scrollbar-width:none}.bc-cms-banners::-webkit-scrollbar{display:none}.bc-cms-banner{position:relative;flex:0 0 100%;min-height:180px;border-radius:22px;overflow:hidden;background:#eef5f1;scroll-snap-align:start}.bc-cms-banner img,.bc-cms-banner video{width:100%;height:220px;object-fit:cover;display:block}.bc-cms-banner a{color:inherit;text-decoration:none}.bc-cms-copy{position:absolute;inset:auto 0 0;padding:34px 18px 16px;background:linear-gradient(transparent,rgba(0,0,0,.72));color:#fff}.bc-cms-copy h3{margin:0 0 5px;font-size:24px}.bc-cms-copy p{margin:0 0 8px}.bc-cms-btn{display:inline-block;background:#fff;color:#155b3f;padding:8px 12px;border-radius:10px;font-weight:800}.bc-cms-video-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.bc-cms-video-grid video,.bc-cms-video-grid iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:12px}
`;document.head.appendChild(style);load();
})();