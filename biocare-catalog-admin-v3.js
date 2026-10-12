import{createClient}from'https://esm.sh/@supabase/supabase-js@2';
const URL='https://jlibhpavbqfeegsehekm.supabase.co';
const KEY='sb_publishable_XVOmCPOiqdUlG-pOPhrQ0g_rIV0R6tK';
const db=createClient(URL,KEY,{auth:{storageKey:'biocare-admin-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const val=(root,s)=>q(s,root)?.value?.trim()||null;
const num=(root,s)=>{const v=q(s,root)?.value;return v===''||v==null?null:Number(v)};
async function rpc(name,args={}){const{data,error}=await db.rpc(name,args);if(error)throw error;return data}
let ovMap=new Map(),customMap=new Map(),busy=false,hooked=false;
const key=(t,id)=>`${t}\u0000${id}`;
async function refreshMaps(){
 try{
  const [ovs,custom]=await Promise.all([rpc('care_admin_catalog_overrides'),rpc('care_admin_custom_catalog_list')]);
  ovMap=new Map((ovs||[]).map(x=>[key(x.item_type,x.item_id),x]));
  customMap=new Map((custom||[]).map(x=>[key(x.item_type,x.item_id),x]));
 }catch(e){console.warn('Catalog v3 admin fields unavailable until SQL migration is run',e)}
}
function customFields(){return `
 <textarea id="ccBenefits" placeholder="فوائد الفحص/الباقة: لماذا يطلب وما الذي يساعد في تقييمه"></textarea>
 <textarea id="ccRequirements" placeholder="متطلبات الفحص/الباقة: الصيام ومدته وأي تحضير أو توقيت خاص"></textarea>
 <div class="two"><input id="ccSampleType" placeholder="نوع العينة: دم / بول / براز / مسحة..."><input id="ccResultTime" placeholder="وقت ظهور النتيجة"></div>`}
function overrideFields(){return `
 <textarea class="ov-benefits" placeholder="فوائد الفحص/الباقة"></textarea>
 <textarea class="ov-requirements" placeholder="المتطلبات والتحضير والصيام"></textarea>
 <div class="two"><input class="ov-sample" placeholder="نوع العينة"><input class="ov-result" placeholder="وقت ظهور النتيجة"></div>`}
function getOverrideIdentity(box){
 const b=q('button[onclick*="saveOverride"]',box);if(!b)return null;
 const s=b.getAttribute('onclick')||'';const m=s.match(/saveOverride\('([^']+)'\s*,\s*'([^']+)'/);if(!m)return null;
 try{return{type:m[1],id:decodeURIComponent(m[2])}}catch{return{type:m[1],id:m[2]}}
}
function fillOverride(box){
 const id=getOverrideIdentity(box);if(!id)return;const o=ovMap.get(key(id.type,id.id))||{};
 const set=(s,v)=>{const el=q(s,box);if(el&&!el.dataset.bcFilled){el.value=v||'';el.dataset.bcFilled='1'}};
 set('.ov-benefits',o.benefits_override);set('.ov-requirements',o.requirements_override);set('.ov-sample',o.sample_type_override);set('.ov-result',o.turnaround_time_override);
}
async function enhance(){
 if(busy)return;const panel=document.getElementById('panel');if(!panel||!q('#catalogList',panel))return;busy=true;
 try{
  await refreshMaps();
  const form=q('#customCatalogForm',panel);
  if(form&&!form.dataset.bcV3){const d=q('#ccDescription',form);d?.insertAdjacentHTML('afterend',customFields());form.dataset.bcV3='1'}
  qa('#catalogList details > div',panel).forEach(box=>{if(!box.dataset.bcV3){const d=q('.ov-description',box);d?.insertAdjacentHTML('afterend',overrideFields());box.dataset.bcV3='1'}fillOverride(box)});
 }finally{busy=false}
}
function hook(){
 if(hooked||typeof window.saveOverride!=='function'||typeof window.saveCustomCatalog!=='function')return;
 hooked=true;
 const oldNew=window.newCatalogItem,oldEdit=window.editCustomCatalog;
 window.newCatalogItem=function(){oldNew?.apply(this,arguments);setTimeout(()=>{['ccBenefits','ccRequirements','ccSampleType','ccResultTime'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})},0)};
 window.editCustomCatalog=function(type,idEnc){oldEdit?.apply(this,arguments);setTimeout(async()=>{await refreshMaps();let id;try{id=decodeURIComponent(idEnc)}catch{id=idEnc}const x=customMap.get(key(type,id))||{};const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||''};set('ccBenefits',x.benefits);set('ccRequirements',x.requirements);set('ccSampleType',x.sample_type);set('ccResultTime',x.turnaround_time)},20)};
 window.saveOverride=async function(type,idEnc,sid){
  const box=document.getElementById(sid);if(!box)return;let id;try{id=decodeURIComponent(idEnc)}catch{id=idEnc}
  const lines=(q('.ov-components',box)?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  try{
   await rpc('care_admin_upsert_catalog_override_v3',{
    p_item_type:type,p_item_id:id,p_active:q('.ov-active',box)?.value==='true',p_display_name:val(box,'.ov-name'),p_english_name:val(box,'.ov-en'),p_category:val(box,'.ov-category'),p_price_override:num(box,'.ov-price'),p_fasting:val(box,'.ov-fasting'),p_description:val(box,'.ov-description'),p_benefits:val(box,'.ov-benefits'),p_requirements:val(box,'.ov-requirements'),p_sample_type:val(box,'.ov-sample'),p_turnaround_time:val(box,'.ov-result'),p_components:lines,p_note:val(box,'.ov-note')
   });
   alert('تم حفظ وصف الفحص/الباقة والفوائد والمتطلبات وبقية التفاصيل');document.querySelector('[data-tab="catalog"]')?.click();
  }catch(e){alert('تعذر الحفظ: '+(e.message||e)+'\n\nتأكد من تشغيل ملف supabase_catalog_details_v3.sql مرة واحدة.')}
 };
 window.saveCustomCatalog=async function(){
  const comps=(document.getElementById('ccComponents')?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  try{
   await rpc('care_admin_upsert_custom_catalog_v3',{
    p_item_type:document.getElementById('ccType').value,p_item_id:document.getElementById('ccId').value.trim(),p_name:document.getElementById('ccName').value.trim(),p_en_name:document.getElementById('ccEn').value.trim()||null,p_category:document.getElementById('ccCategory').value.trim()||null,p_price:document.getElementById('ccPrice').value===''?null:Number(document.getElementById('ccPrice').value),p_fasting:document.getElementById('ccFasting').value.trim()||null,p_description:document.getElementById('ccDescription').value.trim()||null,p_benefits:document.getElementById('ccBenefits')?.value.trim()||null,p_requirements:document.getElementById('ccRequirements')?.value.trim()||null,p_sample_type:document.getElementById('ccSampleType')?.value.trim()||null,p_turnaround_time:document.getElementById('ccResultTime')?.value.trim()||null,p_components:comps,p_note:document.getElementById('ccNote').value.trim()||null,p_active:document.getElementById('ccActive').value==='true',p_sort_order:Number(document.getElementById('ccSort').value||0)
   });
   alert('تم الحفظ');document.querySelector('[data-tab="catalog"]')?.click();
  }catch(e){alert('تعذر الحفظ: '+(e.message||e)+'\n\nتأكد من تشغيل ملف supabase_catalog_details_v3.sql مرة واحدة.')}
 };
}
const obs=new MutationObserver(()=>{hook();setTimeout(enhance,30)});obs.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{hook();enhance()},1200);
