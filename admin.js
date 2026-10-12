import{createClient}from'https://esm.sh/@supabase/supabase-js@2';
const URL='https://jlibhpavbqfeegsehekm.supabase.co';
const KEY='sb_publishable_XVOmCPOiqdUlG-pOPhrQ0g_rIV0R6tK';
const db=createClient(URL,KEY,{auth:{storageKey:'biocare-admin-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id),panel=$('panel');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let me=null,staffCache=[],contentCache=[],overrides=[];
const statusNames={received:'تم الاستلام',confirmed:'تم التأكيد',assigned:'تم تعيين المختص',en_route:'في الطريق',arrived:'وصل للموقع',processing:'قيد التنفيذ',completed:'مكتمل',ready:'جاهز',cancelled:'ملغي',review:'قيد المراجعة',sample_collected:'تم جمع العينة'};
async function rpc(name,args={}){const{data,error}=await db.rpc(name,args);if(error)throw error;return data}
function msg(t,error=false){$('loginMsg').textContent=t;$('loginMsg').style.color=error?'#a6282d':''}
async function isAdmin(){try{return await rpc('care_is_admin')}catch{return false}}
async function boot(){
 const{data:{user}}=await db.auth.getUser();me=user;
 if(!user||!(await isAdmin())){$('loginCard').classList.remove('hidden');$('adminApp').classList.add('hidden');if(user)msg('هذا الحساب ليس مديرًا معتمدًا.',true);return}
 $('loginCard').classList.add('hidden');$('adminApp').classList.remove('hidden');$('adminWho').textContent=user.email||'';showTab('dashboard')
}
$('loginBtn').onclick=async()=>{msg('جارٍ تسجيل الدخول...');const{error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error){msg('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.',true);return}await boot()};
$('logoutBtn').onclick=async()=>{await db.auth.signOut();location.reload()};
$('tabs').onclick=e=>{const b=e.target.closest('button[data-tab]');if(!b)return;showTab(b.dataset.tab)};
function activeTab(t){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===t))}
async function showTab(t){activeTab(t);panel.innerHTML='<div class="card">جارٍ التحميل...</div>';try{
 if(t==='dashboard')await dashboard();
 if(t==='orders')await orders();
 if(t==='staff')await staff();
 if(t==='content')await content();
 if(t==='catalog')await catalog();
 if(t==='services')await services();
}catch(e){panel.innerHTML=`<div class="card notice">تعذر التحميل: ${esc(e.message||e)}</div>`}}
async function dashboard(){
 const d=await rpc('care_admin_dashboard');
 panel.innerHTML=`<h2>نظرة عامة</h2><div class="grid">
 <div class="card"><div class="stat">${d.total_orders||0}</div><div>إجمالي الطلبات</div></div>
 <div class="card"><div class="stat">${d.open_home_orders||0}</div><div>زيارات منزلية مفتوحة</div></div>
 <div class="card"><div class="stat">${d.active_staff||0}</div><div>موظفون نشطون</div></div>
 <div class="card"><div class="stat">${d.active_content||0}</div><div>محتوى وإعلانات نشطة</div></div>
 </div><div class="card"><h3>مركز التحكم</h3><p class="muted">من هذه اللوحة يمكنك إدارة الطلبات، إسناد فرق الزيارات، إدارة الموظفين، البانرات والإعلان المتحرك والفيديوهات، تفعيل أو إيقاف الخدمات، والتحكم في ظهور وأسعار التحاليل والباقات.</p></div>`
}
async function orders(){
 const [rows,staff]=await Promise.all([rpc('care_admin_orders'),rpc('care_admin_staff_list')]);staffCache=staff||[];
 panel.innerHTML=`<h2>الطلبات</h2><div class="card"><button onclick="window.adminRefreshOrders()">تحديث</button></div><div id="orderList"></div>`;
 const box=$('orderList');box.innerHTML=(rows||[]).map(o=>`<div class="item">
 <div class="row"><strong>${esc(o.order_number)}</strong><span class="badge">${esc(statusNames[o.status]||o.status)}</span></div>
 <p>${esc(o.service_name)} <span class="small">(${esc(o.service_type)})</span></p>
 ${o.area?`<p class="small">📍 ${esc(o.area)} — ${esc(o.requested_date||'')} — ${esc(o.preferred_period||'')} — ${esc(o.phone||'')}</p>`:''}
 <div class="two"><div><label>الموظف</label><select id="staff-${o.order_number}"><option value="">بدون إسناد</option>${staffCache.filter(s=>s.active).map(s=>`<option value="${s.user_id}" ${s.user_id===o.staff_id?'selected':''}>${esc(s.email)} — ${esc(s.role)}</option>`).join('')}</select></div>
 <div><label>الحالة</label><select id="status-${o.order_number}">${Object.entries(statusNames).map(([k,v])=>`<option value="${k}" ${k===o.status?'selected':''}>${v}</option>`).join('')}</select></div></div>
 <div class="actions"><button onclick="window.adminAssign('${o.order_number}')">حفظ الإسناد</button><button class="secondary" onclick="window.adminStatus('${o.order_number}')">تحديث الحالة</button></div>
 </div>`).join('')||'<div class="card">لا توجد طلبات.</div>'
}
window.adminRefreshOrders=orders;
window.adminAssign=async n=>{const v=$('staff-'+n).value;if(!v)return alert('اختر موظفًا');try{await rpc('care_admin_assign_order',{p_order_number:n,p_staff_id:v});alert('تم الإسناد');orders()}catch(e){alert(e.message)}};
window.adminStatus=async n=>{const v=$('status-'+n).value;if(!confirm('تحديث حالة الطلب إلى '+(statusNames[v]||v)+'؟'))return;try{await rpc('care_admin_set_order_status',{p_order_number:n,p_status:v});alert('تم تحديث الحالة');orders()}catch(e){alert(e.message)}};
async function staff(){
 staffCache=await rpc('care_admin_staff_list')||[];
 panel.innerHTML=`<h2>الموظفون والصلاحيات</h2><div class="card"><h3>إضافة/تحديث موظف</h3>
 <input id="staffEmail" type="email" placeholder="البريد الإلكتروني">
 <select id="staffRole"><option value="staff">موظف زيارات</option><option value="admin">مدير</option></select>
 <select id="staffActive"><option value="true">نشط</option><option value="false">موقوف</option></select>
 <button onclick="window.saveStaff()">حفظ</button></div>
 <div>${staffCache.map(s=>`<div class="item"><strong>${esc(s.email)}</strong><p class="small">${esc(s.role)} — ${s.active?'نشط':'موقوف'}</p>
 <div class="actions"><button class="secondary" onclick="window.fillStaff('${esc(s.email)}','${s.role}',${s.active})">تعديل</button></div></div>`).join('')}</div>`
}
window.fillStaff=(e,r,a)=>{$('staffEmail').value=e;$('staffRole').value=r;$('staffActive').value=String(a);scrollTo({top:0,behavior:'smooth'})};
window.saveStaff=async()=>{try{await rpc('care_admin_upsert_staff',{p_email:$('staffEmail').value.trim(),p_role:$('staffRole').value,p_active:$('staffActive').value==='true'});alert('تم الحفظ');staff()}catch(e){alert(e.message)}};
async function uploadMedia(file){
 if(!file)return null;
 const allowed=['image/jpeg','image/png','image/webp','video/mp4','video/webm'];if(!allowed.includes(file.type))throw Error('نوع الملف غير مدعوم');
 if(file.size>50*1024*1024)throw Error('حجم الملف أكبر من 50MB');
 const ext=(file.name.split('.').pop()||'bin').toLowerCase(),path=`${me.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
 const{error}=await db.storage.from('care-media').upload(path,file,{cacheControl:'3600',upsert:false});if(error)throw error;
 return db.storage.from('care-media').getPublicUrl(path).data.publicUrl;
}
async function content(){
 contentCache=await rpc('care_admin_content_list')||[];
 panel.innerHTML=`<h2>الإعلانات والمحتوى</h2><div class="card"><h3>إضافة / تعديل</h3>
 <input id="contentId" type="hidden">
 <label>النوع</label><select id="contentKind"><option value="banner">بانر إعلاني</option><option value="ticker">إعلان متحرك</option><option value="video">فيديو</option></select>
 <input id="contentTitle" placeholder="العنوان">
 <textarea id="contentSubtitle" placeholder="الوصف"></textarea>
 <label>صورة أو فيديو من الجهاز (اختياري)</label><input id="contentFile" type="file" accept="image/*,video/mp4,video/webm">
 <input id="contentMedia" placeholder="أو رابط الصورة/الفيديو">
 <input id="contentLink" placeholder="رابط عند الضغط (اختياري)">
 <input id="contentButton" placeholder="نص الزر (اختياري)">
 <div class="two"><div><label>الترتيب</label><input id="contentSort" type="number" value="0"></div><div><label>الحالة</label><select id="contentActive"><option value="true">نشط</option><option value="false">مخفي</option></select></div></div>
 <div class="two"><div><label>يبدأ</label><input id="contentStart" type="datetime-local"></div><div><label>ينتهي</label><input id="contentEnd" type="datetime-local"></div></div>
 <div class="actions"><button onclick="window.saveContent()">حفظ</button><button class="ghost" onclick="window.clearContent()">جديد</button></div></div>
 <div>${contentCache.map(c=>`<div class="item"><span class="badge">${esc(c.kind)}</span><h3>${esc(c.title||'بدون عنوان')}</h3>${c.media_url&&c.kind==='banner'?`<img class="media-preview" src="${esc(c.media_url)}">`:''}<p class="small">${c.active?'نشط':'مخفي'} — ترتيب ${c.sort_order}</p><div class="actions"><button class="secondary" onclick="window.editContent('${c.id}')">تعديل</button><button class="danger" onclick="window.deleteContent('${c.id}')">حذف</button></div></div>`).join('')}</div>`
}
window.clearContent=()=>{['contentId','contentTitle','contentSubtitle','contentMedia','contentLink','contentButton','contentStart','contentEnd'].forEach(id=>$(id).value='');$('contentSort').value=0;$('contentActive').value='true'};
window.editContent=id=>{const c=contentCache.find(x=>x.id===id);if(!c)return;$('contentId').value=c.id;$('contentKind').value=c.kind;$('contentTitle').value=c.title||'';$('contentSubtitle').value=c.subtitle||'';$('contentMedia').value=c.media_url||'';$('contentLink').value=c.link_url||'';$('contentButton').value=c.button_label||'';$('contentSort').value=c.sort_order||0;$('contentActive').value=String(c.active);$('contentStart').value=c.starts_at?c.starts_at.slice(0,16):'';$('contentEnd').value=c.ends_at?c.ends_at.slice(0,16):'';scrollTo({top:0,behavior:'smooth'})};
window.saveContent=async()=>{try{let media=$('contentMedia').value.trim()||null;const file=$('contentFile').files?.[0];if(file){media=await uploadMedia(file)}await rpc('care_admin_upsert_content',{p_id:$('contentId').value||null,p_kind:$('contentKind').value,p_title:$('contentTitle').value.trim()||null,p_subtitle:$('contentSubtitle').value.trim()||null,p_media_url:media,p_link_url:$('contentLink').value.trim()||null,p_button_label:$('contentButton').value.trim()||null,p_sort_order:Number($('contentSort').value||0),p_active:$('contentActive').value==='true',p_starts_at:$('contentStart').value?new Date($('contentStart').value).toISOString():null,p_ends_at:$('contentEnd').value?new Date($('contentEnd').value).toISOString():null});alert('تم حفظ المحتوى');content()}catch(e){alert(e.message)}};
window.deleteContent=async id=>{if(!confirm('حذف هذا المحتوى؟'))return;try{await rpc('care_admin_delete_content',{p_id:id});content()}catch(e){alert(e.message)}};
async function catalog(){
 await window.BIOCARE_CATALOG_READY;
 overrides=await rpc('care_admin_catalog_overrides')||[];
 const tests=window.BIOCARE_CATALOG.tests||[],packs=window.BIOCARE_CATALOG.packages||[];
 panel.innerHTML=`<h2>التحاليل والباقات</h2><div class="card"><div class="two"><select id="catType"><option value="test">التحاليل</option><option value="package">الباقات</option></select><input id="catSearch" placeholder="ابحث بالاسم..."></div><button onclick="window.renderCatalogAdmin()">بحث</button></div><div id="catalogList"></div>`;
 window.renderCatalogAdmin=()=>{const type=$('catType').value,q=$('catSearch').value.trim().toLowerCase(),arr=(type==='test'?tests:packs).filter(x=>(x.name||'').toLowerCase().includes(q)).slice(0,40);$('catalogList').innerHTML=arr.map(x=>{const id=type==='test'?x.code:x.id,ov=overrides.find(o=>o.item_type===type&&o.item_id===id)||{};return `<div class="item"><strong>${esc(x.name)}</strong><p class="small">${esc(id)} — السعر الحالي: ${esc(x.price??'عند الطلب')}</p><div class="two"><input id="name-${CSS.escape(id)}" value="${esc(ov.display_name||'')}" placeholder="اسم بديل (اختياري)"><input id="price-${CSS.escape(id)}" type="number" step="0.01" value="${ov.price_override??''}" placeholder="سعر بديل"></div><select id="active-${CSS.escape(id)}"><option value="true" ${ov.active!==false?'selected':''}>ظاهر</option><option value="false" ${ov.active===false?'selected':''}>مخفي</option></select><button onclick="window.saveCatalog('${type}','${encodeURIComponent(id)}')">حفظ</button></div>`}).join('')||'<div class="card">لا توجد نتائج.</div>'};window.renderCatalogAdmin()
}
window.saveCatalog=async(type,enc)=>{const id=decodeURIComponent(enc),sid=CSS.escape(id);try{await rpc('care_admin_upsert_catalog_override',{p_item_type:type,p_item_id:id,p_active:$('active-'+sid).value==='true',p_display_name:$('name-'+sid).value.trim()||null,p_price_override:$('price-'+sid).value===''?null:Number($('price-'+sid).value)});alert('تم الحفظ');catalog()}catch(e){alert(e.message)}};
async function services(){
 const [sv,settings]=await Promise.all([rpc('care_admin_service_list'),rpc('care_admin_settings_list')]);
 panel.innerHTML=`<h2>الخدمات والإعدادات</h2><div class="card"><h3>الخدمات</h3>${(sv||[]).map(s=>`<div class="item"><strong>${esc(s.title)}</strong><select id="svc-${s.service_key}"><option value="true" ${s.enabled?'selected':''}>مفعلة</option><option value="false" ${!s.enabled?'selected':''}>موقوفة</option></select><input id="svcn-${s.service_key}" value="${esc(s.note||'')}" placeholder="ملاحظة"><button onclick="window.saveService('${s.service_key}')">حفظ</button></div>`).join('')}</div>
 <div class="card"><h3>إعدادات واجهة التطبيق</h3>${(settings||[]).map(s=>`<div class="item"><strong>${esc(s.setting_key)}</strong><textarea id="set-${s.setting_key}">${esc(s.setting_value||'')}</textarea><button onclick="window.saveSetting('${s.setting_key}')">حفظ</button></div>`).join('')}</div>`
}
window.saveService=async k=>{try{await rpc('care_admin_set_service',{p_service_key:k,p_enabled:$('svc-'+k).value==='true',p_note:$('svcn-'+k).value.trim()||null});alert('تم الحفظ')}catch(e){alert(e.message)}};
window.saveSetting=async k=>{try{await rpc('care_admin_set_setting',{p_setting_key:k,p_setting_value:$('set-'+k).value});alert('تم الحفظ')}catch(e){alert(e.message)}};
boot();