/* Biocare cloud adapter: read-only patient orders and notifications.
   Never use service_role keys or persist clinical records in the browser. */
(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusNames={received:'تم استلام الطلب',confirmed:'تم تأكيد الطلب',assigned:'تم تعيين المختص',en_route:'المختص في الطريق',arrived:'وصل المختص إلى الموقع',sample_collected:'تم جمع العينة',processing:'جاري تنفيذ الخدمة',review:'قيد المراجعة والاعتماد',completed:'اكتملت الخدمة',ready:'النتيجة جاهزة',cancelled:'تم إلغاء الطلب'};
const homeTypes=new Set(['home_lab','doctor','nursing','physio']);
const statusLabel=o=>o.status==='processing'&&homeTypes.has(o.service_type)?'بدأت الزيارة / الخدمة':o.status==='completed'&&homeTypes.has(o.service_type)?'اكتملت الزيارة':(statusNames[o.status]||o.status);
const getClient=async()=>{if(typeof initAuth!=='function')throw Error('تعذر تهيئة الحساب');await initAuth();if(!authUser)throw Error('يرجى تسجيل الدخول أولاً');return supabaseClient};
const statusCard=o=>`<div class="bio-care-notice" data-order="${E(o.order_number)}"><strong>${E(o.order_number)}</strong><p>${E(o.service_name||o.service_type)} — <span class="bc-order-status">${E(statusLabel(o))}</span></p><small class="bc-order-updated">آخر تحديث: ${E(new Date(o.updated_at).toLocaleString('ar-SA'))}</small></div>`;
let bcOrdersRefreshTimer=null;
async function refreshVisibleOrders(){
 const el=document.getElementById('bcCloudOrders');if(!el){clearInterval(bcOrdersRefreshTimer);bcOrdersRefreshTimer=null;return}
 try{const db=await getClient();const{data,error}=await db.from('care_orders').select('order_number,service_type,service_name,status,updated_at').order('created_at',{ascending:false}).limit(30);if(error)throw error;for(const o of data||[]){const card=[...el.querySelectorAll('[data-order]')].find(x=>x.dataset.order===o.order_number);if(!card)continue;const s=card.querySelector('.bc-order-status'),u=card.querySelector('.bc-order-updated');if(s)s.textContent=statusLabel(o);if(u)u.textContent='آخر تحديث: '+new Date(o.updated_at).toLocaleString('ar-SA');if(['completed','cancelled','ready'].includes(o.status)){const b=card.querySelector('.bc-map-btn');if(b)b.remove()}}}catch(_){}}

window.BIOCARE_ORDER_PROVIDER={async getOrder(number){const db=await getClient();const {data,error}=await db.from('care_orders').select('order_number,service_type,service_name,status,updated_at').eq('order_number',number).maybeSingle();if(error)throw error;if(!data)return null;return {number:data.order_number,type:data.service_type,status:data.status,updated_at:data.updated_at,service_name:data.service_name,cloud:true}}};
window.biocareLookup=async e=>{e.preventDefault();const el=document.getElementById('bcTrackingResult');const number=document.getElementById('bcOrder')?.value.trim();if(!el||!number)return;el.textContent='جارٍ الاستعلام...';try{const o=await window.BIOCARE_ORDER_PROVIDER.getOrder(number);el.innerHTML=o?statusCard({order_number:o.number,service_type:o.type,service_name:o.service_name,status:o.status,updated_at:o.updated_at}):'<div class="bio-care-notice">لا يوجد طلب مرتبط بحسابك بهذا الرقم.</div>'}catch(e){el.textContent=e.message==='يرجى تسجيل الدخول أولاً'?e.message:'تعذر الاستعلام. تأكد من تفعيل قاعدة البيانات ثم حاول مجددًا.'}};
window.biocareMyOrders=async()=>{if(bcOrdersRefreshTimer){clearInterval(bcOrdersRefreshTimer);bcOrdersRefreshTimer=null}openModal('<div class="bio-care-shell"><h2>طلباتي</h2><div id="bcCloudOrders">جارٍ التحميل...</div><p class="muted" style="font-size:12px">يتم تحديث حالة الزيارة تلقائيًا أثناء فتح هذه الصفحة.</p></div>');const el=document.getElementById('bcCloudOrders');try{const db=await getClient();const {data,error}=await db.from('care_orders').select('order_number,service_type,service_name,status,updated_at').order('created_at',{ascending:false}).limit(30);if(error)throw error;el.innerHTML=data?.length?data.map(statusCard).join(''):'<p class="muted">لا توجد طلبات مرتبطة بحسابك بعد. الطلبات المرسلة عبر واتساب لا تظهر إلا بعد تسجيلها في النظام.</p>';bcOrdersRefreshTimer=setInterval(refreshVisibleOrders,10000)}catch(e){el.textContent=e.message==='يرجى تسجيل الدخول أولاً'?e.message:'تعذر تحميل الطلبات. تحقق من تفعيل قاعدة البيانات.'}};
window.showNotifications=async()=>{openModal('<div class="bio-care-shell"><h2>الإشعارات</h2><div id="bcCloudNotifications">جارٍ التحميل...</div><div class="bio-care-actions"><button class="secondary" onclick="biocareEnablePush()">تفعيل إشعارات الجوال</button><button class="ghost" onclick="biocareMyOrders()">طلباتي</button></div><p class="muted" style="font-size:12px">الإشعارات الفورية تحتاج إعداد مفتاح Web Push وخادم إرسال. على آيفون أضف التطبيق إلى الشاشة الرئيسية أولًا.</p></div>');const el=document.getElementById('bcCloudNotifications');try{const db=await getClient();const {data,error}=await db.from('care_notifications').select('id,title,body,created_at').order('created_at',{ascending:false}).limit(30);if(error)throw error;el.innerHTML=data?.length?data.map(n=>`<div class="bio-care-notice"><strong>${E(n.title)}</strong><p>${E(n.body)}</p><small>${E(new Date(n.created_at).toLocaleString('ar-SA'))}</small></div>`).join(''):'<p class="muted">لا توجد إشعارات حتى الآن.</p>'}catch(e){el.textContent=e.message==='يرجى تسجيل الدخول أولاً'?e.message:'تعذر تحميل الإشعارات. تحقق من إعداد قاعدة البيانات.'}};
const b64ToBytes=s=>{const b=atob((s+'='.repeat((4-s.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))};
window.biocareEnablePush=async()=>{try{await getClient();if(!('serviceWorker'in navigator)||!('PushManager'in window))throw Error('المتصفح لا يدعم الإشعارات الفورية.');const vapid=window.BIOCARE_VAPID_PUBLIC_KEY;if(!vapid)throw Error('لم يُضبط مفتاح إشعارات Web Push على الخادم بعد.');const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('لم يتم منح إذن الإشعارات.');const registration=await navigator.serviceWorker.ready;const sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToBytes(vapid)});const json=sub.toJSON();const {error}=await supabaseClient.from('care_push_subscriptions').upsert({user_id:authUser.id,endpoint:json.endpoint,p256dh:json.keys.p256dh,auth_key:json.keys.auth},{onConflict:'endpoint'});if(error)throw error;alert('تم تسجيل جهازك لاستقبال الإشعارات. يبدأ وصولها بعد تفعيل خادم الإرسال.')}catch(e){alert(e.message||'تعذر تفعيل الإشعارات')}};

// Authenticated patient request creation. RPC assigns identity and tracking number server-side.
window.biocareCreateOrder=async function(type,name){
  const db=await getClient();
  const {data,error}=await db.rpc('care_create_request',{p_service_type:type,p_service_name:name});
  if(error)throw Error('تعذر تسجيل الطلب. تأكد من تشغيل ملف SQL الجديد وتسجيل الدخول.');
  if(!data||typeof data!=='string')throw Error('لم يتم إرجاع رقم الطلب.');
  return data;
};
window.biocareCreateCartOrder=async function(){
  const btn=document.getElementById('bcSaveCartOrder');if(btn){btn.disabled=true;btn.textContent='جارٍ تسجيل الطلب...'}
  try{
    if(!selected.length)throw Error('السلة فارغة. أضف تحاليل أو باقات أولًا.');
    // No clinical details or cart contents are transmitted or saved by this first-phase request.
    const number=await window.biocareCreateOrder('lab','طلب تحاليل مخبرية — تأكيد التفاصيل مع المختبر');
    openModal(`<div class="bio-care-shell"><h2>تم تسجيل طلب مبدئي</h2><p>رقم طلبك: <strong>${E(number)}</strong></p><div class="bio-care-notice">الحالة: تم استلام الطلب. لم يتم تأكيد التحاليل أو الموعد أو السعر بعد. لإرسال محتويات السلة إلى المختبر استخدم زر واتساب الموجود في السلة.</div><button class="primary" onclick="biocareMyOrders()">عرض طلباتي</button></div>`);
  }catch(e){alert(e.message||'تعذر تسجيل الطلب')}finally{if(btn){btn.disabled=false;btn.textContent='إنشاء طلب برقم تتبع'}}
};
const oldBooking=booking;
booking=function(){const html=oldBooking();return html.replace('</section>',`<div class="card"><h3>تتبع طلب التحاليل</h3><p class="muted">يمكنك إنشاء طلب مبدئي مرتبط بحسابك، ثم إرسال تفاصيل التحاليل إلى المختبر عبر واتساب لتأكيدها.</p><button id="bcSaveCartOrder" class="primary" onclick="biocareCreateCartOrder()">إنشاء طلب برقم تتبع</button></div></section>`)};
const oldSend=window.biocareSendRequest;
window.biocareSendRequest=async function(e,type){
 e.preventDefault();
 const names={doctor:'طبيب عام منزلي',nursing:'تمريض منزلي',physio:'علاج طبيعي منزلي',labs:'تحاليل منزلية'};
 if(!names[type])return;
 const area=document.getElementById('bcArea')?.value.trim(),date=document.getElementById('bcDate')?.value,period=document.getElementById('bcPeriod')?.value,phone=document.getElementById('bcPhone')?.value.trim();
 if(!area||!date||!/^[+0-9\s-]{8,20}$/.test(phone)){alert('يرجى تعبئة المنطقة والتاريخ ورقم التواصل بشكل صحيح');return}
 const btn=document.querySelector('#biocareServiceForm button.primary');if(btn)btn.disabled=true;
 try{
  const number=await window.biocareCreateOrder(type==='labs'?'home_lab':type,names[type]);
  const message=`السلام عليكم، تم إنشاء طلب مبدئي في بيوكير رقم ${number} لخدمة ${names[type]}.\nالمنطقة: ${area}\nالتاريخ المفضل: ${date}\nالوقت: ${period}\nرقم التواصل: ${phone}\nأرجو تأكيد التوفر والسعر والموعد.`;
  openModal(`<div class="bio-care-shell"><h2>تم تسجيل الطلب المبدئي</h2><p>رقم التتبع: <strong>${E(number)}</strong></p><div class="bio-care-notice">لم يتم تأكيد الحجز بعد. أرسل التفاصيل إلى خدمة العملاء لتأكيد التوفر.</div><button class="primary" onclick="biocareSendWhatsAppDraft()">إرسال التفاصيل عبر واتساب</button><button class="secondary" onclick="biocareMyOrders()">تتبع الطلب</button></div>`);
  window.biocareSendWhatsAppDraft=()=>window.open('https://wa.me/966567669779?text='+encodeURIComponent(message),'_blank','noopener');
 }catch(err){alert(err.message||'تعذر تسجيل الطلب')}finally{if(btn)btn.disabled=false}
};

const oldTrack=window.biocareTrack;window.biocareTrack=()=>{oldTrack();const form=document.querySelector('#bcOrder')?.closest('form');if(form){const b=document.createElement('button');b.className='secondary';b.type='button';b.textContent='عرض جميع طلباتي';b.onclick=window.biocareMyOrders;form.after(b)}};
const oldHome=home;home=function(){return oldHome()+`<section class="section"><div class="section-head"><h2>حسابي وخدماتي</h2></div><div class="bio-care-entry"><button class="bio-care-tile" onclick="biocareMyOrders()"><span class="emoji">📋</span><strong>طلباتي</strong><small>متابعة الطلبات المرتبطة بحسابك</small></button><button class="bio-care-tile" onclick="showNotifications()"><span class="emoji">🔔</span><strong>الإشعارات</strong><small>تنبيهات النتائج والمواعيد</small></button></div></section>`};
const m=document.getElementById('drawerMenu');if(m){const d=document.createElement('div');d.className='drawer-group';d.innerHTML='<div class="drawer-title">حسابي</div><button class="drawer-item" onclick="closeDrawer();biocareMyOrders()">📋 طلباتي</button><button class="drawer-item" onclick="closeDrawer();showNotifications()">🔔 الإشعارات</button>';m.appendChild(d)}
if(typeof render==='function')render();
})();
