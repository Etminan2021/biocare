import{createClient}from'https://esm.sh/@supabase/supabase-js@2';
const URL='https://jlibhpavbqfeegsehekm.supabase.co';
const KEY='sb_publishable_XVOmCPOiqdUlG-pOPhrQ0g_rIV0R6tK';
const db=createClient(URL,KEY,{auth:{storageKey:'biocare-admin-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id),panel=$('panel');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enc=s=>encodeURIComponent(String(s??''));
let me=null,staffCache=[],contentCache=[],overrides=[],customCatalog=[],branchesCache=[],specialtiesCache=[],providersCache=[],settingsCache=[];
const statusNames={received:'تم الاستلام',confirmed:'تم التأكيد',assigned:'تم تعيين المختص',en_route:'في الطريق',arrived:'وصل للموقع',sample_collected:'تم جمع العينة',processing:'قيد التنفيذ',review:'قيد المراجعة',completed:'مكتمل',ready:'جاهز',cancelled:'ملغي'};
const settingLabels={
 hero_title:'عنوان الصفحة الرئيسية',hero_text:'نص الصفحة الرئيسية',app_name_ar:'اسم التطبيق',logo_url:'رابط الشعار',
 whatsapp_number:'رقم واتساب',consultation_url:'رابط الاستشارات',instagram_url:'Instagram',tiktok_url:'TikTok',
 snapchat_url:'Snapchat',facebook_url:'Facebook',maintenance_message:'رسالة الصيانة',maintenance_enabled:'وضع الصيانة'
};
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
$('tabs').onclick=e=>{const b=e.target.closest('button[data-tab]');if(b)showTab(b.dataset.tab)};
$('mobileSection').onchange=e=>showTab(e.target.value);
function activeTab(t){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));$('mobileSection').value=t}
async function showTab(t){
 activeTab(t);panel.innerHTML='<div class="card">جارٍ التحميل...</div>';
 try{
  if(t==='dashboard')await dashboard();
  if(t==='orders')await orders();
  if(t==='users')await users();
  if(t==='staff')await staff();
  if(t==='content')await content();
  if(t==='catalog')await catalog();
  if(t==='branches')await branches();
  if(t==='virtual')await virtualClinic();
  if(t==='notifications')await notifications();
  if(t==='services')await services();
  if(t==='appearance')await appearance();
  if(t==='introVideo')await window.introVideoAdmin();
  if(t==='audit')await audit();
 }catch(e){panel.innerHTML=`<div class="card notice">تعذر التحميل: ${esc(e.message||e)}</div>`}
}
async function dashboard(){
 const d=await rpc('care_admin_dashboard_v2');
 panel.innerHTML=`<div class="section-title"><h2>نظرة عامة</h2><button class="secondary" onclick="window.refreshDashboard()">تحديث</button></div>
 <div class="grid">
 <div class="card"><div class="stat">${d.total_orders||0}</div><div>إجمالي الطلبات</div></div>
 <div class="card"><div class="stat">${d.open_home_orders||0}</div><div>زيارات منزلية مفتوحة</div></div>
 <div class="card"><div class="stat">${d.customers||0}</div><div>حسابات العملاء</div></div>
 <div class="card"><div class="stat">${d.active_staff||0}</div><div>موظفون/مدراء نشطون</div></div>
 <div class="card"><div class="stat">${d.active_content||0}</div><div>إعلانات ومحتوى نشط</div></div>
 <div class="card"><div class="stat">${d.active_branches||0}</div><div>فروع ظاهرة</div></div>
 <div class="card"><div class="stat">${d.active_specialties||0}</div><div>تخصصات افتراضية</div></div>
 <div class="card"><div class="stat">${d.custom_catalog||0}</div><div>عناصر مضافة من اللوحة</div></div>
 </div>
 <div class="card"><h3>Biocare Super Admin</h3><p class="muted">يمكنك من هذه اللوحة إدارة الوظائف الحالية للتطبيق: الطلبات والزيارات، الموظفين والعملاء، البانرات والإعلان المتحرك والفيديو، الفروع، الخدمات، العيادة الافتراضية، الإشعارات، التحاليل والباقات، الهوية والإعدادات وسجل تغييرات الإدارة.</p></div>`
}
window.refreshDashboard=dashboard;

async function orders(){
 const [rows,staffRows]=await Promise.all([rpc('care_admin_orders'),rpc('care_admin_staff_list')]);staffCache=staffRows||[];
 panel.innerHTML=`<div class="section-title"><h2>الطلبات</h2><button class="secondary" onclick="window.adminRefreshOrders()">تحديث</button></div><div id="orderList"></div>`;
 const box=$('orderList');box.innerHTML=(rows||[]).map(o=>`<div class="item">
 <div class="row"><strong>${esc(o.order_number)}</strong><span class="badge ${['completed','cancelled','ready'].includes(o.status)?'off':''}">${esc(statusNames[o.status]||o.status)}</span></div>
 <p>${esc(o.service_name)} <span class="small">(${esc(o.service_type)})</span></p>
 ${o.area?`<p class="small">📍 ${esc(o.area)} — ${esc(o.requested_date||'')} — ${esc(o.preferred_period||'')} — ${esc(o.phone||'')}</p>`:''}
 <div class="two"><div><label>الموظف</label><select id="staff-${o.order_number}"><option value="">بدون إسناد</option>${staffCache.filter(s=>s.active).map(s=>`<option value="${s.user_id}" ${s.user_id===o.staff_id?'selected':''}>${esc(s.email)} — ${esc(s.role)}</option>`).join('')}</select></div>
 <div><label>الحالة</label><select id="status-${o.order_number}">${Object.entries(statusNames).map(([k,v])=>`<option value="${k}" ${k===o.status?'selected':''}>${v}</option>`).join('')}</select></div></div>
 <div class="actions"><button onclick="window.adminAssign('${o.order_number}')">حفظ الإسناد</button><button class="ghost" onclick="window.adminUnassign('${o.order_number}')">إلغاء الإسناد</button><button class="secondary" onclick="window.adminStatus('${o.order_number}')">تحديث الحالة</button></div>
 </div>`).join('')||'<div class="card">لا توجد طلبات.</div>'
}
window.adminRefreshOrders=orders;
window.adminAssign=async n=>{const v=$('staff-'+n).value;if(!v)return alert('اختر موظفًا');try{await rpc('care_admin_assign_order_v2',{p_order_number:n,p_staff_id:v});alert('تم الإسناد');orders()}catch(e){alert(e.message)}};
window.adminUnassign=async n=>{if(!confirm('إلغاء إسناد الموظف من هذا الطلب؟'))return;try{await rpc('care_admin_assign_order_v2',{p_order_number:n,p_staff_id:null});alert('تم إلغاء الإسناد');orders()}catch(e){alert(e.message)}};
window.adminStatus=async n=>{const v=$('status-'+n).value;if(!confirm('تحديث حالة الطلب إلى '+(statusNames[v]||v)+'؟'))return;try{await rpc('care_admin_set_order_status',{p_order_number:n,p_status:v});alert('تم تحديث الحالة');orders()}catch(e){alert(e.message)}};

async function users(){
 const rows=await rpc('care_admin_users_list');
 panel.innerHTML=`<div class="section-title"><h2>العملاء والحسابات</h2><span class="badge">${rows?.length||0} حساب</span></div>
 <div class="card"><input id="userSearch" placeholder="ابحث بالبريد الإلكتروني..." oninput="window.filterUsers()"></div><div id="usersList"></div>`;
 window._adminUsers=rows||[];window.filterUsers()
}
window.filterUsers=()=>{const q=($('userSearch')?.value||'').trim().toLowerCase(),rows=(window._adminUsers||[]).filter(x=>(x.email||'').toLowerCase().includes(q));$('usersList').innerHTML=rows.map(u=>`<div class="item"><strong>${esc(u.email||'بدون بريد')}</strong><div class="small">إنشاء الحساب: ${esc(new Date(u.created_at).toLocaleString('ar-SA'))}</div><div class="small">آخر دخول: ${u.last_sign_in_at?esc(new Date(u.last_sign_in_at).toLocaleString('ar-SA')):'غير متوفر'}</div><span class="badge ${u.is_staff?'':'off'}">${u.is_staff?esc(u.role||'staff'):'عميل'}</span></div>`).join('')||'<div class="card">لا توجد نتائج.</div>'};

async function staff(){
 staffCache=await rpc('care_admin_staff_list')||[];
 panel.innerHTML=`<div class="section-title"><h2>الموظفون والصلاحيات</h2><span class="badge">${staffCache.length}</span></div>
 <div class="card"><h3>إضافة / تحديث صلاحية</h3><p class="small">يجب أن يكون الحساب منشأ مسبقًا في Authentication.</p>
 <input id="staffEmail" type="email" placeholder="البريد الإلكتروني">
 <div class="two"><select id="staffRole"><option value="staff">موظف زيارات</option><option value="admin">مدير</option></select><select id="staffActive"><option value="true">نشط</option><option value="false">موقوف</option></select></div>
 <button onclick="window.saveStaff()">حفظ</button></div>
 <div>${staffCache.map(s=>`<div class="item"><strong>${esc(s.email)}</strong><p class="small">${esc(s.role)} — ${s.active?'نشط':'موقوف'}</p><button class="secondary" onclick="window.fillStaff('${esc(s.email)}','${s.role}',${s.active})">تعديل</button></div>`).join('')}</div>`
}
window.fillStaff=(e,r,a)=>{$('staffEmail').value=e;$('staffRole').value=r;$('staffActive').value=String(a);scrollTo({top:0,behavior:'smooth'})};
window.saveStaff=async()=>{try{await rpc('care_admin_upsert_staff',{p_email:$('staffEmail').value.trim(),p_role:$('staffRole').value,p_active:$('staffActive').value==='true'});alert('تم الحفظ');staff()}catch(e){alert(e.message)}};

async function uploadMedia(file){
 if(!file)return null;
 const allowed=['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'];if(!allowed.includes(file.type))throw Error('نوع الملف غير مدعوم');
 if(file.size>50*1024*1024)throw Error('حجم الملف أكبر من 50MB');
 const ext=(file.name.split('.').pop()||'bin').toLowerCase(),path=`${me.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
 const{error}=await db.storage.from('care-media').upload(path,file,{cacheControl:'3600',upsert:false});if(error)throw error;
 return db.storage.from('care-media').getPublicUrl(path).data.publicUrl;
}
async function content(){
 contentCache=await rpc('care_admin_content_list')||[];
 panel.innerHTML=`<div class="section-title"><h2>الإعلانات والمحتوى</h2><span class="badge">${contentCache.length}</span></div>
 <div class="card"><h3>إضافة / تعديل محتوى</h3><input id="contentId" type="hidden">
 <label>النوع</label><select id="contentKind"><option value="banner">بانر / سلايدر</option><option value="ticker">إعلان متحرك</option><option value="video">فيديو</option></select>
 <input id="contentTitle" placeholder="العنوان"><textarea id="contentSubtitle" placeholder="الوصف"></textarea>
 <label>رفع صورة أو فيديو</label><input id="contentFile" type="file" accept="image/*,video/mp4,video/webm">
 <input id="contentMedia" placeholder="أو رابط الصورة / الفيديو / YouTube">
 <input id="contentLink" placeholder="رابط عند الضغط (اختياري)"><input id="contentButton" placeholder="نص الزر (اختياري)">
 <div class="two"><div><label>الترتيب</label><input id="contentSort" type="number" value="0"></div><div><label>الحالة</label><select id="contentActive"><option value="true">نشط</option><option value="false">مخفي</option></select></div></div>
 <div class="two"><div><label>يبدأ</label><input id="contentStart" type="datetime-local"></div><div><label>ينتهي</label><input id="contentEnd" type="datetime-local"></div></div>
 <div class="actions"><button onclick="window.saveContent()">حفظ</button><button class="ghost" onclick="window.clearContent()">جديد</button></div></div>
 <div>${contentCache.map(c=>`<div class="item"><span class="badge">${c.kind==='banner'?'بانر':c.kind==='ticker'?'متحرك':'فيديو'}</span><h3>${esc(c.title||'بدون عنوان')}</h3>${c.media_url&&c.kind==='banner'?`<img class="media-preview" src="${esc(c.media_url)}">`:''}${c.media_url&&c.kind==='video'?`<p class="small">${esc(c.media_url)}</p>`:''}<p class="small">${c.active?'نشط':'مخفي'} — ترتيب ${c.sort_order}</p><div class="actions"><button class="secondary" onclick="window.editContent('${c.id}')">تعديل</button><button class="danger" onclick="window.deleteContent('${c.id}')">حذف</button></div></div>`).join('')}</div>`
}
window.clearContent=()=>{['contentId','contentTitle','contentSubtitle','contentMedia','contentLink','contentButton','contentStart','contentEnd'].forEach(id=>$(id).value='');$('contentSort').value=0;$('contentActive').value='true';$('contentKind').value='banner'};
window.editContent=id=>{const c=contentCache.find(x=>x.id===id);if(!c)return;$('contentId').value=c.id;$('contentKind').value=c.kind;$('contentTitle').value=c.title||'';$('contentSubtitle').value=c.subtitle||'';$('contentMedia').value=c.media_url||'';$('contentLink').value=c.link_url||'';$('contentButton').value=c.button_label||'';$('contentSort').value=c.sort_order||0;$('contentActive').value=String(c.active);$('contentStart').value=c.starts_at?c.starts_at.slice(0,16):'';$('contentEnd').value=c.ends_at?c.ends_at.slice(0,16):'';scrollTo({top:0,behavior:'smooth'})};
window.saveContent=async()=>{try{let media=$('contentMedia').value.trim()||null;const f=$('contentFile').files?.[0];if(f)media=await uploadMedia(f);await rpc('care_admin_upsert_content',{p_id:$('contentId').value||null,p_kind:$('contentKind').value,p_title:$('contentTitle').value.trim()||null,p_subtitle:$('contentSubtitle').value.trim()||null,p_media_url:media,p_link_url:$('contentLink').value.trim()||null,p_button_label:$('contentButton').value.trim()||null,p_sort_order:Number($('contentSort').value||0),p_active:$('contentActive').value==='true',p_starts_at:$('contentStart').value?new Date($('contentStart').value).toISOString():null,p_ends_at:$('contentEnd').value?new Date($('contentEnd').value).toISOString():null});alert('تم الحفظ');content()}catch(e){alert(e.message)}};
window.deleteContent=async id=>{if(!confirm('حذف هذا المحتوى؟'))return;try{await rpc('care_admin_delete_content',{p_id:id});content()}catch(e){alert(e.message)}};

async function catalog(){
 await window.BIOCARE_CATALOG_READY;
 [overrides,customCatalog]=await Promise.all([rpc('care_admin_catalog_overrides'),rpc('care_admin_custom_catalog_list')]);
 const tests=window.BIOCARE_CATALOG.tests||[],packs=window.BIOCARE_CATALOG.packages||[];
 panel.innerHTML=`<div class="section-title"><h2>التحاليل والباقات</h2><button onclick="window.newCatalogItem()">إضافة عنصر جديد</button></div>
 <div class="card" id="customCatalogForm" hidden><h3>إضافة تحليل / باقة من لوحة التحكم</h3><input id="ccOldId" type="hidden">
 <div class="two"><select id="ccType"><option value="test">تحليل</option><option value="package">باقة</option></select><input id="ccId" placeholder="كود فريد مثل TEST-001 أو pack-new"></div>
 <div class="two"><input id="ccName" placeholder="الاسم العربي"><input id="ccEn" placeholder="الاسم الإنجليزي (اختياري)"></div>
 <div class="two"><input id="ccCategory" placeholder="الفئة"><input id="ccPrice" type="number" step="0.01" placeholder="السعر"></div>
 <input id="ccFasting" placeholder="متطلبات الصيام"><textarea id="ccDescription" placeholder="الوصف"></textarea><textarea id="ccComponents" placeholder="مكونات الباقة/التحاليل - كل عنصر في سطر"></textarea><textarea id="ccNote" placeholder="ملاحظة"></textarea>
 <div class="two"><input id="ccSort" type="number" value="0"><select id="ccActive"><option value="true">ظاهر</option><option value="false">مخفي</option></select></div>
 <div class="actions"><button onclick="window.saveCustomCatalog()">حفظ</button><button class="ghost" onclick="window.closeCatalogForm()">إلغاء</button></div></div>
 <div class="card"><h3>تعديل العناصر الحالية</h3><div class="two"><select id="catType"><option value="test">التحاليل</option><option value="package">الباقات</option></select><input id="catSearch" placeholder="ابحث بالاسم..."></div><button onclick="window.renderCatalogAdmin()">بحث</button></div>
 <div id="catalogList"></div><h3>العناصر المضافة من لوحة التحكم</h3><div id="customList"></div>`;
 window._catalogStatic={tests,packs};window.renderCatalogAdmin();window.renderCustomCatalog()
}
window.newCatalogItem=()=>{$('customCatalogForm').hidden=false;['ccOldId','ccId','ccName','ccEn','ccCategory','ccPrice','ccFasting','ccDescription','ccComponents','ccNote'].forEach(id=>$(id).value='');$('ccType').value='test';$('ccSort').value=0;$('ccActive').value='true';scrollTo({top:0,behavior:'smooth'})};
window.closeCatalogForm=()=>{$('customCatalogForm').hidden=true};
window.renderCatalogAdmin=()=>{const type=$('catType').value,q=$('catSearch').value.trim().toLowerCase(),arr=(type==='test'?window._catalogStatic.tests:window._catalogStatic.packs).filter(x=>(x.name||'').toLowerCase().includes(q)).slice(0,30);$('catalogList').innerHTML=arr.map(x=>{const id=type==='test'?x.code:x.id,ov=overrides.find(o=>o.item_type===type&&o.item_id===id)||{},sid='ov-'+btoa(unescape(encodeURIComponent(id))).replace(/=+/g,'');return `<details><summary>${esc(x.name)} — ${esc(x.price??'عند الطلب')}</summary><div id="${sid}">
 <input class="ov-name" value="${esc(ov.display_name||'')}" placeholder="اسم عربي بديل"><input class="ov-en" value="${esc(ov.english_name_override||'')}" placeholder="اسم إنجليزي بديل"><input class="ov-category" value="${esc(ov.category_override||'')}" placeholder="فئة بديلة"><input class="ov-price" type="number" step="0.01" value="${ov.price_override??''}" placeholder="سعر بديل">
 <input class="ov-fasting" value="${esc(ov.fasting_override||'')}" placeholder="الصيام"><textarea class="ov-description" placeholder="وصف بديل">${esc(ov.description_override||'')}</textarea><textarea class="ov-components" placeholder="المكونات - كل عنصر في سطر">${esc(Array.isArray(ov.components_override)?ov.components_override.join('\n'):'')}</textarea><textarea class="ov-note" placeholder="ملاحظة">${esc(ov.note_override||'')}</textarea>
 <select class="ov-active"><option value="true" ${ov.active!==false?'selected':''}>ظاهر</option><option value="false" ${ov.active===false?'selected':''}>مخفي</option></select><button onclick="window.saveOverride('${type}','${enc(id)}','${sid}')">حفظ التعديلات</button></div></details>`}).join('')||'<div class="card">لا توجد نتائج.</div>'};
window.saveOverride=async(type,idEnc,sid)=>{const box=$(sid),id=decodeURIComponent(idEnc),lines=box.querySelector('.ov-components').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);try{await rpc('care_admin_upsert_catalog_override_v2',{p_item_type:type,p_item_id:id,p_active:box.querySelector('.ov-active').value==='true',p_display_name:box.querySelector('.ov-name').value.trim()||null,p_english_name:box.querySelector('.ov-en').value.trim()||null,p_category:box.querySelector('.ov-category').value.trim()||null,p_price_override:box.querySelector('.ov-price').value===''?null:Number(box.querySelector('.ov-price').value),p_fasting:box.querySelector('.ov-fasting').value.trim()||null,p_description:box.querySelector('.ov-description').value.trim()||null,p_components:lines,p_note:box.querySelector('.ov-note').value.trim()||null});alert('تم الحفظ');catalog()}catch(e){alert(e.message)}};
window.renderCustomCatalog=()=>{$('customList').innerHTML=(customCatalog||[]).map(x=>`<div class="item"><span class="badge">${x.item_type==='test'?'تحليل':'باقة'}</span><strong>${esc(x.name)}</strong><p class="small">${esc(x.item_id)} — ${esc(x.category||'')} — ${x.price??'السعر عند الطلب'} — ${x.active?'ظاهر':'مخفي'}</p><div class="actions"><button class="secondary" onclick="window.editCustomCatalog('${x.item_type}','${enc(x.item_id)}')">تعديل</button><button class="danger" onclick="window.deleteCustomCatalog('${x.item_type}','${enc(x.item_id)}')">حذف</button></div></div>`).join('')||'<div class="card">لا توجد عناصر مضافة من اللوحة.</div>'};
window.editCustomCatalog=(type,idEnc)=>{const id=decodeURIComponent(idEnc),x=customCatalog.find(y=>y.item_type===type&&y.item_id===id);if(!x)return;window.newCatalogItem();$('ccOldId').value=x.item_id;$('ccType').value=x.item_type;$('ccId').value=x.item_id;$('ccName').value=x.name||'';$('ccEn').value=x.en_name||'';$('ccCategory').value=x.category||'';$('ccPrice').value=x.price??'';$('ccFasting').value=x.fasting||'';$('ccDescription').value=x.description||'';$('ccComponents').value=Array.isArray(x.components)?x.components.join('\n'):'';$('ccNote').value=x.note||'';$('ccSort').value=x.sort_order||0;$('ccActive').value=String(x.active)};
window.saveCustomCatalog=async()=>{const comps=$('ccComponents').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);try{await rpc('care_admin_upsert_custom_catalog',{p_item_type:$('ccType').value,p_item_id:$('ccId').value.trim(),p_name:$('ccName').value.trim(),p_en_name:$('ccEn').value.trim()||null,p_category:$('ccCategory').value.trim()||null,p_price:$('ccPrice').value===''?null:Number($('ccPrice').value),p_fasting:$('ccFasting').value.trim()||null,p_description:$('ccDescription').value.trim()||null,p_components:comps,p_note:$('ccNote').value.trim()||null,p_active:$('ccActive').value==='true',p_sort_order:Number($('ccSort').value||0)});alert('تم الحفظ');catalog()}catch(e){alert(e.message)}};
window.deleteCustomCatalog=async(type,idEnc)=>{if(!confirm('حذف العنصر المضاف؟'))return;try{await rpc('care_admin_delete_custom_catalog',{p_item_type:type,p_item_id:decodeURIComponent(idEnc)});catalog()}catch(e){alert(e.message)}};

async function branches(){
 branchesCache=await rpc('care_admin_branches_list')||[];
 panel.innerHTML=`<div class="section-title"><h2>الفروع</h2><button onclick="window.newBranch()">إضافة فرع</button></div>
 <div id="branchForm" class="card" hidden><h3>إضافة / تعديل فرع</h3><input id="branchKey" placeholder="رمز الفرع مثل jazan-airport"><input id="branchName" placeholder="اسم الفرع"><textarea id="branchAddress" placeholder="العنوان"></textarea><input id="branchMap" placeholder="رابط Google Maps"><input id="branchPhone" placeholder="رقم الهاتف"><div class="two"><input id="branchHours" placeholder="ساعات العمل"><input id="branchFriday" placeholder="ساعات الجمعة"></div><div class="two"><input id="branchSort" type="number" value="0"><select id="branchActive"><option value="true">ظاهر</option><option value="false">مخفي</option></select></div><div class="actions"><button onclick="window.saveBranch()">حفظ</button><button class="ghost" onclick="window.closeBranch()">إلغاء</button></div></div>
 <div>${branchesCache.map(b=>`<div class="item"><strong>${esc(b.name)}</strong><p>${esc(b.address||'')}</p><p class="small">${esc(b.hours_regular||'')} ${b.hours_friday?'— الجمعة: '+esc(b.hours_friday):''}</p><div class="actions"><button class="secondary" onclick="window.editBranch('${enc(b.branch_key)}')">تعديل</button><button class="danger" onclick="window.hideBranch('${enc(b.branch_key)}')">${b.active?'إخفاء':'إظهار'}</button></div></div>`).join('')}</div>`
}
window.newBranch=()=>{$('branchForm').hidden=false;['branchKey','branchName','branchAddress','branchMap','branchPhone','branchHours','branchFriday'].forEach(id=>$(id).value='');$('branchSort').value=0;$('branchActive').value='true';scrollTo({top:0,behavior:'smooth'})};
window.closeBranch=()=>{$('branchForm').hidden=true};
window.editBranch=k=>{const b=branchesCache.find(x=>x.branch_key===decodeURIComponent(k));if(!b)return;window.newBranch();$('branchKey').value=b.branch_key;$('branchKey').readOnly=true;$('branchName').value=b.name||'';$('branchAddress').value=b.address||'';$('branchMap').value=b.maps_url||'';$('branchPhone').value=b.phone||'';$('branchHours').value=b.hours_regular||'';$('branchFriday').value=b.hours_friday||'';$('branchSort').value=b.sort_order||0;$('branchActive').value=String(b.active)};
window.saveBranch=async()=>{try{await rpc('care_admin_upsert_branch',{p_branch_key:$('branchKey').value.trim(),p_name:$('branchName').value.trim(),p_address:$('branchAddress').value.trim()||null,p_maps_url:$('branchMap').value.trim()||null,p_phone:$('branchPhone').value.trim()||null,p_hours_regular:$('branchHours').value.trim()||null,p_hours_friday:$('branchFriday').value.trim()||null,p_active:$('branchActive').value==='true',p_sort_order:Number($('branchSort').value||0)});alert('تم الحفظ');branches()}catch(e){alert(e.message)}};
window.hideBranch=async k=>{const b=branchesCache.find(x=>x.branch_key===decodeURIComponent(k));if(!b)return;try{await rpc('care_admin_upsert_branch',{p_branch_key:b.branch_key,p_name:b.name,p_address:b.address,p_maps_url:b.maps_url,p_phone:b.phone,p_hours_regular:b.hours_regular,p_hours_friday:b.hours_friday,p_active:!b.active,p_sort_order:b.sort_order});branches()}catch(e){alert(e.message)}};

async function virtualClinic(){
 [specialtiesCache,providersCache]=await Promise.all([rpc('care_admin_virtual_specialties_list'),rpc('care_admin_virtual_providers_list')]);
 panel.innerHTML=`<div class="section-title"><h2>العيادة الافتراضية</h2></div>
 <div class="two"><div class="card"><h3>التخصصات</h3><input id="specId" type="hidden"><input id="specName" placeholder="اسم التخصص"><div class="two"><input id="specSort" type="number" value="0"><select id="specActive"><option value="true">نشط</option><option value="false">مخفي</option></select></div><div class="actions"><button onclick="window.saveSpecialty()">حفظ</button><button class="ghost" onclick="window.clearSpecialty()">جديد</button></div></div>
 <div class="card"><h3>الأطباء / مقدمو الخدمة</h3><input id="providerId" type="hidden"><select id="providerSpecialty">${specialtiesCache.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><input id="providerName" placeholder="الاسم"><input id="providerTitle" placeholder="المسمى"><textarea id="providerBio" placeholder="نبذة"></textarea><input id="providerBooking" placeholder="رابط الحجز / الاتصال"><input id="providerImage" placeholder="رابط الصورة"><input id="providerFile" type="file" accept="image/*"><div class="two"><input id="providerSort" type="number" value="0"><select id="providerActive"><option value="true">نشط</option><option value="false">مخفي</option></select></div><div class="actions"><button onclick="window.saveProvider()">حفظ</button><button class="ghost" onclick="window.clearProvider()">جديد</button></div></div></div>
 <h3>التخصصات الحالية</h3>${specialtiesCache.map(s=>`<div class="item"><strong>${esc(s.name)}</strong><span class="badge ${s.active?'':'off'}">${s.active?'نشط':'مخفي'}</span><button class="secondary" onclick="window.editSpecialty('${s.id}')">تعديل</button></div>`).join('')}
 <h3>مقدمو الخدمة</h3>${providersCache.map(p=>`<div class="item"><strong>${esc(p.name)}</strong><p class="small">${esc(p.specialty_name||'')} — ${esc(p.title||'')}</p><div class="actions"><button class="secondary" onclick="window.editProvider('${p.id}')">تعديل</button><button class="danger" onclick="window.deleteProvider('${p.id}')">حذف</button></div></div>`).join('')||'<div class="card">لا يوجد مقدمو خدمة منشورون.</div>'}`
}
window.clearSpecialty=()=>{$('specId').value='';$('specName').value='';$('specSort').value=0;$('specActive').value='true'};
window.editSpecialty=id=>{const s=specialtiesCache.find(x=>x.id===id);if(!s)return;$('specId').value=s.id;$('specName').value=s.name;$('specSort').value=s.sort_order||0;$('specActive').value=String(s.active);scrollTo({top:0,behavior:'smooth'})};
window.saveSpecialty=async()=>{try{await rpc('care_admin_upsert_virtual_specialty',{p_id:$('specId').value||null,p_name:$('specName').value.trim(),p_active:$('specActive').value==='true',p_sort_order:Number($('specSort').value||0)});alert('تم الحفظ');virtualClinic()}catch(e){alert(e.message)}};
window.clearProvider=()=>{['providerId','providerName','providerTitle','providerBio','providerBooking','providerImage'].forEach(id=>$(id).value='');$('providerSort').value=0;$('providerActive').value='true'};
window.editProvider=id=>{const p=providersCache.find(x=>x.id===id);if(!p)return;$('providerId').value=p.id;$('providerSpecialty').value=p.specialty_id;$('providerName').value=p.name||'';$('providerTitle').value=p.title||'';$('providerBio').value=p.bio||'';$('providerBooking').value=p.booking_url||'';$('providerImage').value=p.image_url||'';$('providerSort').value=p.sort_order||0;$('providerActive').value=String(p.active);scrollTo({top:0,behavior:'smooth'})};
window.saveProvider=async()=>{try{let image=$('providerImage').value.trim()||null;const f=$('providerFile').files?.[0];if(f)image=await uploadMedia(f);await rpc('care_admin_upsert_virtual_provider',{p_id:$('providerId').value||null,p_specialty_id:$('providerSpecialty').value,p_name:$('providerName').value.trim(),p_title:$('providerTitle').value.trim()||null,p_bio:$('providerBio').value.trim()||null,p_booking_url:$('providerBooking').value.trim()||null,p_image_url:image,p_active:$('providerActive').value==='true',p_sort_order:Number($('providerSort').value||0)});alert('تم الحفظ');virtualClinic()}catch(e){alert(e.message)}};
window.deleteProvider=async id=>{if(!confirm('حذف مقدم الخدمة؟'))return;try{await rpc('care_admin_delete_virtual_provider',{p_id:id});virtualClinic()}catch(e){alert(e.message)}};

async function notifications(){
 const history=await rpc('care_admin_broadcast_list');
 panel.innerHTML=`<div class="section-title"><h2>الإشعارات</h2></div><div class="card"><h3>إرسال إشعار داخل التطبيق</h3><select id="notifyTarget"><option value="customers">جميع العملاء</option><option value="all">جميع الحسابات</option><option value="email">بريد محدد</option></select><input id="notifyEmail" type="email" placeholder="البريد - فقط عند اختيار بريد محدد"><input id="notifyTitle" placeholder="عنوان الإشعار"><textarea id="notifyBody" placeholder="نص الإشعار"></textarea><button onclick="window.sendBroadcast()">إرسال</button><p class="small">هذا ينشئ إشعارًا داخل التطبيق. إشعار Push الخارجي يظل مرتبطًا بتفعيل خادم Web Push.</p></div>
 <h3>سجل الإرسال</h3>${(history||[]).map(h=>`<div class="item"><strong>${esc(h.title)}</strong><p>${esc(h.body)}</p><p class="small">${esc(h.target)} — ${h.sent_count} مستلم — ${esc(new Date(h.created_at).toLocaleString('ar-SA'))}</p></div>`).join('')||'<div class="card">لا يوجد إرسال جماعي سابق.</div>'}`
}
window.sendBroadcast=async()=>{const target=$('notifyTarget').value,title=$('notifyTitle').value.trim(),body=$('notifyBody').value.trim();if(!title||!body)return alert('أدخل العنوان والنص');if(!confirm('تأكيد إرسال الإشعار؟'))return;try{const n=await rpc('care_admin_send_broadcast',{p_target:target,p_email:$('notifyEmail').value.trim()||null,p_title:title,p_body:body});alert(`تم إرسال الإشعار إلى ${n} حساب`);notifications()}catch(e){alert(e.message)}};

async function services(){
 const sv=await rpc('care_admin_service_list_v2');
 panel.innerHTML=`<div class="section-title"><h2>الخدمات</h2><span class="badge">${sv?.length||0}</span></div><p class="muted">يمكن تشغيل أو إيقاف أقسام التطبيق، وإضافة وصف وسعر/ساعات عرض للخدمات.</p>${(sv||[]).map(s=>`<div class="item"><strong>${esc(s.title)}</strong><div class="two"><select id="svc-${s.service_key}"><option value="true" ${s.enabled?'selected':''}>مفعلة</option><option value="false" ${!s.enabled?'selected':''}>موقوفة</option></select><input id="svcsort-${s.service_key}" type="number" value="${s.sort_order||0}" placeholder="الترتيب"></div><input id="svcprice-${s.service_key}" value="${esc(s.price_text||'')}" placeholder="السعر/النص السعري"><input id="svchours-${s.service_key}" value="${esc(s.hours_text||'')}" placeholder="الساعات/التوفر"><textarea id="svcn-${s.service_key}" placeholder="ملاحظة">${esc(s.note||'')}</textarea><button onclick="window.saveService('${s.service_key}')">حفظ</button></div>`).join('')}`
}
window.saveService=async k=>{try{await rpc('care_admin_set_service_v2',{p_service_key:k,p_enabled:$('svc-'+k).value==='true',p_note:$('svcn-'+k).value.trim()||null,p_price_text:$('svcprice-'+k).value.trim()||null,p_hours_text:$('svchours-'+k).value.trim()||null,p_sort_order:Number($('svcsort-'+k).value||0)});alert('تم الحفظ')}catch(e){alert(e.message)}};

async function appearance(){
 settingsCache=await rpc('care_admin_settings_list')||[];
 const get=k=>settingsCache.find(x=>x.setting_key===k)?.setting_value||'';
 const keys=['app_name_ar','hero_title','hero_text','whatsapp_number','consultation_url','instagram_url','tiktok_url','snapchat_url','facebook_url','logo_url','maintenance_enabled','maintenance_message'];
 panel.innerHTML=`<div class="section-title"><h2>الهوية والإعدادات</h2></div><div class="card"><label>رفع شعار جديد (اختياري)</label><input id="logoFile" type="file" accept="image/*"><button class="secondary" onclick="window.uploadLogo()">رفع واستخدام الشعار</button></div>
 ${keys.map(k=>`<div class="item"><strong>${esc(settingLabels[k]||k)}</strong>${k==='hero_text'||k==='maintenance_message'?`<textarea id="set-${k}">${esc(get(k))}</textarea>`:k==='maintenance_enabled'?`<select id="set-${k}"><option value="false" ${get(k)!=='true'?'selected':''}>متوقف</option><option value="true" ${get(k)==='true'?'selected':''}>مفعل</option></select>`:`<input id="set-${k}" value="${esc(get(k))}">`}<button onclick="window.saveSetting('${k}')">حفظ</button></div>`).join('')}`
}
window.saveSetting=async k=>{try{await rpc('care_admin_set_setting',{p_setting_key:k,p_setting_value:$('set-'+k).value});alert('تم الحفظ')}catch(e){alert(e.message)}};
window.uploadLogo=async()=>{try{const f=$('logoFile').files?.[0];if(!f)return alert('اختر صورة');const url=await uploadMedia(f);await rpc('care_admin_set_setting',{p_setting_key:'logo_url',p_setting_value:url});alert('تم رفع الشعار وحفظه');appearance()}catch(e){alert(e.message)}};

async function audit(){
 const rows=await rpc('care_admin_audit_list',{p_limit:200});
 panel.innerHTML=`<div class="section-title"><h2>سجل تغييرات الإدارة</h2><span class="badge">${rows?.length||0}</span></div><div class="list-scroll">${(rows||[]).map(a=>`<div class="item"><strong>${esc(a.action)} — ${esc(a.entity_type)}</strong><p class="small">${esc(a.admin_email||'')} — ${esc(new Date(a.created_at).toLocaleString('ar-SA'))}</p><p class="small">المعرف: ${esc(a.entity_id||'')}</p></div>`).join('')||'<div class="card">لا توجد عمليات مسجلة بعد.</div>'}</div>`
}
boot();
