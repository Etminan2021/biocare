/* Biocare Super Admin public runtime v2 */
(()=>{'use strict';
const URL='https://jlibhpavbqfeegsehekm.supabase.co',KEY='sb_publishable_XVOmCPOiqdUlG-pOPhrQ0g_rIV0R6tK';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function rpc(name,args={}){const r=await fetch(`${URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:JSON.stringify(args)});if(!r.ok)throw Error(await r.text());return r.json()}
let content=[],services={},settings={},branches=[],specialties=[],providers=[],observer=null,carouselTimer=null,rendering=false;
function safeUrl(u){try{const x=new URL(String(u||''),location.href);return ['https:','http:'].includes(x.protocol)?x.href:''}catch{return''}}
function assetUrl(u){
 const s=safeUrl(u); if(!s)return '';
 try{
   const x=new URL(s);
   if(x.hostname==='etminan2021.github.io' && x.pathname.startsWith('/biocare/')){
     const file=x.pathname.slice('/biocare/'.length);
     if(file) return 'https://raw.githubusercontent.com/Etminan2021/biocare/main/'+file;
   }
 }catch{}
 return s;
}
function waNumber(){return String(settings.whatsapp_number||'966567669779').replace(/[^\d]/g,'')}
function media(i){const u=assetUrl(i.media_url);if(!u)return'';if(i.kind==='video'){const yt=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);if(yt)return `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(yt[1])}" title="${esc(i.title||'فيديو')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;return `<video controls playsinline preload="metadata" src="${u}"></video>`}return `<img src="${u}" alt="${esc(i.title||'إعلان')}">`}
function applyCatalog(overrides,custom){
 const cat=window.BIOCARE_CATALOG;if(!cat)return;
 for(const x of custom||[]){if(!x.active)continue;const arr=x.item_type==='test'?cat.tests:cat.packages,idKey=x.item_type==='test'?'code':'id';if(arr.some(y=>String(y[idKey])===String(x.item_id)))continue;const obj=x.item_type==='test'?{code:x.item_id,name:x.name,en:x.en_name||x.name,category:x.category||'أخرى',price:x.price,note:x.note||'',official:false}:{id:x.item_id,name:x.name,category:x.category||'أخرى',price:x.price,count:Array.isArray(x.components)?x.components.length:0,fasting:x.fasting||'',description:x.description||'',components:x.components||[]};arr.push(obj)}
 for(const o of overrides||[]){const arr=o.item_type==='test'?cat.tests:cat.packages,idKey=o.item_type==='test'?'code':'id',idx=arr.findIndex(x=>String(x[idKey])===String(o.item_id));if(idx<0)continue;if(o.active===false){arr.splice(idx,1);continue}const x=arr[idx];if(o.display_name)x.name=o.display_name;if(o.english_name_override)x.en=o.english_name_override;if(o.category_override)x.category=o.category_override;if(o.price_override!==null&&o.price_override!==undefined)x.price=Number(o.price_override);if(o.fasting_override)x.fasting=o.fasting_override;if(o.description_override)x.description=o.description_override;if(Array.isArray(o.components_override)){x.components=o.components_override;x.count=o.components_override.length}if(o.note_override)x.note=o.note_override}
 if(typeof window.render==='function')window.render()
}
function applyBrand(){
 const logo=assetUrl(settings.logo_url);if(logo)document.querySelectorAll('.header-logo,.drawer-head img').forEach(img=>img.src=logo);
 if(settings.app_name_ar)document.title=settings.app_name_ar+' | Biocare';
}
function injectTicker(){
 let el=document.getElementById('bcCmsTicker'),items=content.filter(x=>x.kind==='ticker');
 if(!items.length){el?.remove();return}if(!el){el=document.createElement('div');el.id='bcCmsTicker';document.querySelector('.app-header')?.after(el)}
 el.innerHTML=`<div class="bc-cms-ticker-track">${items.map(i=>`<span>${esc(i.title||i.subtitle||'')}</span>`).join('<span class="sep">•</span>')}</div>`
}
function injectMaintenance(){
 let el=document.getElementById('bcMaintenance');const on=settings.maintenance_enabled==='true',txt=settings.maintenance_message||'';
 if(!on||!txt){el?.remove();return}if(!el){el=document.createElement('div');el.id='bcMaintenance';document.querySelector('.app-header')?.after(el)}el.textContent=txt
}
function branchesHtml(){
 if(!branches.length)return '';
 return `<div class="branch-row">${branches.filter(b=>b.active).map((b,i)=>`<div class="branch-card"><div class="branch-photo"><span>${String(i+1).padStart(2,'0')}</span></div><div class="branch-name">${esc(b.name)}</div></div>`).join('')}</div>`
}
function overrideBranches(){
 if(!branches.length)return;
 window.branches=branchesHtml;
 window.showBranches=()=>openModal(`<h2>فروعنا</h2>${branches.filter(b=>b.active).map(b=>`<div class="card"><h3>${esc(b.name)}</h3>${b.address?`<p>${esc(b.address)}</p>`:''}${b.hours_regular?`<p class="muted">${esc(b.hours_regular)}</p>`:''}${b.hours_friday?`<p class="muted">الجمعة: ${esc(b.hours_friday)}</p>`:''}${b.phone?`<p>${esc(b.phone)}</p>`:''}${safeUrl(b.maps_url)?`<a class="secondary" target="_blank" rel="noopener" href="${safeUrl(b.maps_url)}">فتح الموقع على الخريطة</a>`:''}</div>`).join('')}`);
}
function overrideConsultations(){
 window.openInstantChat=()=>window.open('https://wa.me/'+waNumber()+'?text='+encodeURIComponent('السلام عليكم، أرغب في التحدث مع خدمة عملاء مختبرات بيوكير الطبية.'),'_blank','noopener');
 window.showConsultations=()=>{if(services.consultations?.enabled===false)return alert('الاستشارات غير متاحة حاليًا.');const u=safeUrl(settings.consultation_url);if(u)return window.open(u,'_blank','noopener');window.open('https://wa.me/'+waNumber()+'?text='+encodeURIComponent('السلام عليكم، أرغب في طلب استشارة طبية.'),'_blank','noopener')}
}
function overrideVirtual(){
 if(!specialties.length)return;
 window.biocareVirtual=()=>{if(services.virtual_clinic?.enabled===false)return alert('العيادة الافتراضية غير متاحة حاليًا.');openModal(`<div class="bio-care-shell"><h2>العيادة الافتراضية</h2><p class="muted">اختر التخصص.</p><div class="bio-care-specialties">${specialties.filter(s=>s.active).map(s=>`<button onclick="bcCmsSpecialty('${s.id}')">${esc(s.name)}</button>`).join('')}</div></div>`)};
 window.bcCmsSpecialty=id=>{const s=specialties.find(x=>x.id===id),list=providers.filter(p=>p.active&&p.specialty_id===id);if(!s)return;openModal(`<div class="bio-care-shell"><h2>${esc(s.name)}</h2>${list.length?list.map(p=>`<div class="card">${assetUrl(p.image_url)?`<img src="${assetUrl(p.image_url)}" alt="${esc(p.name)}" style="width:76px;height:76px;border-radius:50%;object-fit:cover">`:''}<h3>${esc(p.name)}</h3>${p.title?`<p>${esc(p.title)}</p>`:''}${p.bio?`<p class="muted">${esc(p.bio)}</p>`:''}${safeUrl(p.booking_url)?`<a class="primary" target="_blank" rel="noopener" href="${safeUrl(p.booking_url)}">حجز / تواصل</a>`:''}</div>`).join(''):`<div class="bio-care-notice">لا يوجد مقدم خدمة منشور حاليًا لهذا التخصص.</div>`}</div>`)}
}
function applyServiceRules(){
 const on=k=>services[k]?.enabled!==false;
 const oldOpen=window.biocareOpen;if(oldOpen&&!oldOpen.__cms2){const f=function(type){const map={home:'home_care',virtual:'virtual_clinic',radiology:'radiology'};if(map[type]&&!on(map[type]))return alert('هذه الخدمة غير متاحة حاليًا.');return oldOpen.apply(this,arguments)};f.__cms2=true;window.biocareOpen=f}
 const oldReq=window.biocareRequest;if(oldReq&&!oldReq.__cms2){const f=function(type){const map={doctor:'home_doctor',nursing:'home_nursing',physio:'home_physio',labs:'home_labs'},k=map[type];if(k&&!on(k))return alert('هذه الخدمة غير متاحة حاليًا.');const r=oldReq.apply(this,arguments);setTimeout(()=>{const cfg=services[k],form=document.getElementById('biocareServiceForm');if(cfg&&form&&(cfg.price_text||cfg.hours_text||cfg.note)){let d=document.getElementById('bcCmsServiceInfo');if(!d){d=document.createElement('div');d.id='bcCmsServiceInfo';d.className='bio-care-notice';form.prepend(d)}d.innerHTML=[cfg.price_text,cfg.hours_text,cfg.note].filter(Boolean).map(esc).join('<br>')}},0);return r};f.__cms2=true;window.biocareRequest=f}
 const oldGo=window.go;if(oldGo&&!oldGo.__cms2){const f=function(v){const map={tests:'tests',packages:'packages',booking:'booking',results:'results',profile:'profile'};if(map[v]&&!on(map[v]))return alert('هذا القسم غير متاح حاليًا.');return oldGo.apply(this,arguments)};f.__cms2=true;window.go=f}
 document.querySelectorAll('.nav-item[data-view]').forEach(b=>{const k=b.dataset.view;b.classList.toggle('hidden',services[k]&&services[k].enabled===false)});
 if(!on('saleem'))document.querySelectorAll('button').forEach(b=>{if(/سليم/.test(b.textContent||''))b.closest('section,.card,.bio-care-tile')?.classList.add('hidden')});
 if(!on('instant_chat'))document.querySelector('.instant-chat-btn')?.classList.add('hidden')
}
function injectHome(){
 const app=document.getElementById('app'),hero=app?.querySelector('.hero');if(!hero)return;
 document.getElementById('bcCmsBanners')?.remove();document.getElementById('bcCmsVideos')?.remove();document.getElementById('bcCmsSocial')?.remove();
 const banners=content.filter(x=>x.kind==='banner'),videos=content.filter(x=>x.kind==='video');
 if(banners.length){const wrap=document.createElement('section');wrap.id='bcCmsBanners';wrap.className='bc-cms-banners';wrap.innerHTML=banners.map(i=>{const link=safeUrl(i.link_url);return `<article class="bc-cms-banner">${link?`<a href="${link}" target="_blank" rel="noopener">`:''}${media(i)}<div class="bc-cms-copy"><h3>${esc(i.title||'')}</h3>${i.subtitle?`<p>${esc(i.subtitle)}</p>`:''}${i.button_label?`<span class="bc-cms-btn">${esc(i.button_label)}</span>`:''}</div>${link?'</a>':''}</article>`}).join('');hero.before(wrap);clearInterval(carouselTimer);if(banners.length>1)carouselTimer=setInterval(()=>{const max=wrap.scrollWidth-wrap.clientWidth;if(wrap.scrollLeft>=max-10)wrap.scrollTo({left:0,behavior:'smooth'});else wrap.scrollBy({left:wrap.clientWidth,behavior:'smooth'})},6000)}
 const h=hero.querySelector('.hero-copy h1'),p=hero.querySelector('.hero-copy p');if(h&&settings.hero_title)h.textContent=settings.hero_title;if(p&&settings.hero_text)p.textContent=settings.hero_text;
 if(videos.length){const sec=document.createElement('section');sec.id='bcCmsVideos';sec.className='section bc-cms-videos';sec.innerHTML=`<div class="section-head"><h2>فيديوهات بيوكير</h2></div><div class="bc-cms-video-grid">${videos.map(i=>`<article class="card">${media(i)}<h3>${esc(i.title||'')}</h3>${i.subtitle?`<p class="muted">${esc(i.subtitle)}</p>`:''}</article>`).join('')}</div>`;app.appendChild(sec)}
 const social=[['Instagram',settings.instagram_url],['TikTok',settings.tiktok_url],['Snapchat',settings.snapchat_url],['Facebook',settings.facebook_url]].filter(x=>safeUrl(x[1]));if(social.length){const sec=document.createElement('section');sec.id='bcCmsSocial';sec.className='section';sec.innerHTML=`<div class="section-head"><h2>تابعنا</h2></div><div class="bc-cms-social">${social.map(x=>`<a target="_blank" rel="noopener" href="${safeUrl(x[1])}">${esc(x[0])}</a>`).join('')}</div>`;app.appendChild(sec)}
}
function refreshHome(){if(rendering)return;rendering=true;observer?.disconnect();try{injectHome();applyBrand();injectTicker();injectMaintenance();applyServiceRules()}finally{const app=document.getElementById('app');if(app&&observer)observer.observe(app,{childList:true,subtree:false});rendering=false}}
async function load(){
 try{
  const [c,s,st,o,custom,b,sp,pr]=await Promise.all([rpc('care_public_content'),rpc('care_public_services_v2'),rpc('care_public_settings'),rpc('care_public_catalog_overrides'),rpc('care_public_catalog_custom'),rpc('care_public_branches'),rpc('care_public_virtual_specialties'),rpc('care_public_virtual_providers')]);
  content=c||[];(s||[]).forEach(x=>services[x.service_key]=x);(st||[]).forEach(x=>settings[x.setting_key]=x.setting_value||'');branches=b||[];specialties=sp||[];providers=pr||[];
  applyCatalog(o,custom);overrideBranches();overrideConsultations();overrideVirtual();applyBrand();injectTicker();injectMaintenance();applyServiceRules();injectHome();
  const app=document.getElementById('app');if(app){observer=new MutationObserver(()=>setTimeout(refreshHome,0));observer.observe(app,{childList:true,subtree:false})}
 }catch(e){console.warn('Super Admin CMS unavailable',e)}
}
const style=document.createElement('style');style.textContent=`
#bcCmsTicker{background:#155b3f;color:#fff;overflow:hidden;white-space:nowrap;padding:8px 0;font-weight:800}#bcMaintenance{background:#fff1c9;color:#6e5200;padding:9px 14px;text-align:center;font-weight:800}
.bc-cms-ticker-track{display:inline-flex;gap:18px;align-items:center;padding-inline:20px;animation:bcTicker 20s linear infinite}.bc-cms-ticker-track .sep{opacity:.55}@keyframes bcTicker{from{transform:translateX(-10%)}to{transform:translateX(100%)}}
.bc-cms-banners{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;margin:14px;scrollbar-width:none}.bc-cms-banners::-webkit-scrollbar{display:none}.bc-cms-banner{position:relative;flex:0 0 100%;min-height:180px;border-radius:22px;overflow:hidden;background:#eef5f1;scroll-snap-align:start}.bc-cms-banner img,.bc-cms-banner video{width:100%;height:220px;object-fit:cover;display:block}.bc-cms-banner a{color:inherit;text-decoration:none}.bc-cms-copy{position:absolute;inset:auto 0 0;padding:34px 18px 16px;background:linear-gradient(transparent,rgba(0,0,0,.72));color:#fff}.bc-cms-copy h3{margin:0 0 5px;font-size:24px}.bc-cms-copy p{margin:0 0 8px}.bc-cms-btn{display:inline-block;background:#fff;color:#155b3f;padding:8px 12px;border-radius:10px;font-weight:800}.bc-cms-video-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.bc-cms-video-grid video,.bc-cms-video-grid iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:12px}.bc-cms-social{display:flex;gap:8px;flex-wrap:wrap}.bc-cms-social a{background:#eef6f2;color:#155b3f;text-decoration:none;padding:10px 14px;border-radius:12px;font-weight:800}
`;document.head.appendChild(style);load();
})();