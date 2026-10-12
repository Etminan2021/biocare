/* Biocare home location + privacy-aware live visit tracking */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const homeTypes=new Set(['doctor','nursing','physio','labs']);
let customerPosition=null;
let trackingTimer=null;
const css=document.createElement('style');
css.textContent=`
.bc-location-panel{border:1px solid #d9e8df;border-radius:15px;padding:13px;margin:14px 0;background:#f7fbf9;max-width:100%;overflow-wrap:anywhere}
.bc-location-panel button,.bc-map-btn{border:0;background:#24583f;color:#fff;border-radius:11px;padding:11px 14px;font-weight:700;margin:7px 0}
.bc-location-panel a{color:#176744;overflow-wrap:anywhere}
.bc-map-frame{width:100%;height:260px;border:0;border-radius:14px;background:#eef4f0}
.bc-location-help{font-size:12px;color:#65766e;line-height:1.8}
`;
document.head.appendChild(css);
function insertLocation(){
 const form=document.getElementById('biocareServiceForm');
 if(!form||document.getElementById('bcLocationPanel'))return;
 customerPosition=null;
 const el=document.createElement('div');
 el.className='bc-location-panel';el.id='bcLocationPanel';
 el.innerHTML=`<strong>📍 مشاركة موقع المنزل (اختياري)</strong>
 <p class="bc-location-help">اضغط لتحديد موقعك بعد موافقتك. يمكنك مراجعة الموقع قبل مشاركته مع خدمة العملاء. لا يتم تتبع موقعك باستمرار.</p>
 <button type="button" onclick="biocarePickLocation()">تحديد موقعي الحالي</button>
 <div id="bcLocationResult" aria-live="polite"></div>`;
 const area=form.querySelector('#bcArea');
 if(area)area.insertAdjacentElement('afterend',el);
}
window.biocarePickLocation=()=>{
 const out=document.getElementById('bcLocationResult');
 if(!out)return;
 if(!navigator.geolocation){out.textContent='هذا الجهاز لا يدعم تحديد الموقع.';return}
 out.textContent='جارٍ طلب إذن تحديد الموقع...';
 navigator.geolocation.getCurrentPosition(p=>{
  const lat=p.coords.latitude,lon=p.coords.longitude;
  if(!Number.isFinite(lat)||!Number.isFinite(lon)){out.textContent='تعذر قراءة الموقع.';return}
  customerPosition={lat,lon};
  const url=`https://www.google.com/maps?q=${encodeURIComponent(lat+','+lon)}`;
  out.innerHTML=`<p class="bc-location-help">تم تحديد الموقع بدقة تقريبية ${Math.round(p.coords.accuracy)} متر. راجع الدبوس قبل إرسال الطلب.</p><a href="${url}" target="_blank" rel="noopener">عرض موقعي على الخريطة ↗</a> <button type="button" onclick="biocareClearLocation()">إزالة الموقع</button>`;
 },e=>{customerPosition=null;out.textContent=e.code===1?'لم يتم السماح بالوصول للموقع. يمكنك إدخال العنوان يدويًا.':'تعذر تحديد الموقع. حاول مرة أخرى أو أدخل العنوان يدويًا.'},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
};
window.biocareClearLocation=()=>{customerPosition=null;const el=document.getElementById('bcLocationResult');if(el)el.textContent='لم يتم إرفاق موقع.'};
const oldRequest=window.biocareRequest;
if(typeof oldRequest==='function')window.biocareRequest=function(type){const r=oldRequest.apply(this,arguments);if(homeTypes.has(type))insertLocation();return r};
const oldSend=window.biocareSendRequest;
if(typeof oldSend==='function')window.biocareSendRequest=function(e,type){
 if(!customerPosition||!homeTypes.has(type))return oldSend.apply(this,arguments);
 e.preventDefault();
 const area=document.getElementById('bcArea')?.value.trim();
 const date=document.getElementById('bcDate')?.value;
 const period=document.getElementById('bcPeriod')?.value;
 const phone=document.getElementById('bcPhone')?.value.trim();
 if(!area||!date||!(/^\+?[0-9\s-]{8,20}$/.test(phone||''))){alert('يرجى إدخال المنطقة والتاريخ ورقم جوال صحيح');return}
 const names={doctor:'طبيب عام منزلي',nursing:'تمريض منزلي',physio:'علاج طبيعي منزلي',labs:'تحاليل منزلية'};
 const url=`https://www.google.com/maps?q=${customerPosition.lat},${customerPosition.lon}`;
 const msg=`السلام عليكم، أرغب في الاستفسار عن توفر خدمة ${names[type]} من بيوكير.\nالمنطقة: ${area}\nالتاريخ المفضل: ${date}\nالوقت: ${period}\nجوال التواصل: ${phone}\nموقع المنزل (بموافقتي): ${url}\nأرجو تأكيد التوفر والسعر والموعد.`;
 window.open('https://wa.me/966567669779?text='+encodeURIComponent(msg),'_blank','noopener');
};
// Read-only live location adapter. Must be served from secure authenticated backend;
// no public tracking links and no simulated provider coordinates.
window.biocareTrackTeam=async function(orderNumber){
 if(trackingTimer){clearInterval(trackingTimer);trackingTimer=null}
 const safe=esc(orderNumber);
 if(typeof window.BIOCARE_TEAM_LOCATION_PROVIDER?.getLocation!=='function'){
  openModal(`<div class="bio-care-shell"><h2>تتبع فريق الزيارة المنزلية</h2><p>الطلب: ${safe}</p><div class="bc-location-panel">التتبع المباشر غير متاح لهذا الطلب حاليًا. يظهر الموقع بعد إسناد الفريق وتفعيل مشاركة موقعه بصورة آمنة.</div><button class="ghost" onclick="biocareMyOrders()">رجوع إلى طلباتي</button></div>`);
  return;
 }
 openModal(`<div class="bio-care-shell"><h2>موقع فريق الزيارة</h2><p>الطلب: ${safe}</p><div id="bcLiveTeamMap">جارٍ التحقق من توفر موقع الفريق...</div></div>`);
 async function refresh(){
  const out=document.getElementById('bcLiveTeamMap');if(!out){clearInterval(trackingTimer);trackingTimer=null;return}
  try{
   const p=await window.BIOCARE_TEAM_LOCATION_PROVIDER.getLocation(orderNumber);
   if(!p||p.active!==true||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)){
    out.textContent='لم يبدأ الفريق مشاركة موقعه بعد، أو انتهت الزيارة.';return;
   }
   const url=`https://www.openstreetmap.org/export/embed.html?bbox=${p.lon-.008}%2C${p.lat-.008}%2C${p.lon+.008}%2C${p.lat+.008}&layer=mapnik&marker=${p.lat}%2C${p.lon}`;
   out.innerHTML=`<iframe class="bc-map-frame" title="موقع فريق الزيارة" loading="lazy" referrerpolicy="no-referrer" src="${url}"></iframe><p class="bc-location-help">آخر تحديث: ${esc(p.updated_at||'غير متوفر')} — الموقع تقريبي وقد يتأخر.</p>`;
  }catch(_){out.textContent='تعذر جلب موقع الفريق. حاول مجددًا.'}
 }
 await refresh();
 trackingTimer=setInterval(refresh,30000);
};
const oldMyOrders=window.biocareMyOrders;
if(typeof oldMyOrders==='function')window.biocareMyOrders=async function(){
 const result=await oldMyOrders.apply(this,arguments);
 const el=document.getElementById('bcCloudOrders');
 if(!el||!el.children.length)return result;
 try{
  if(typeof initAuth!=='function')return result;
  await initAuth();if(!authUser||!supabaseClient)return result;
  const {data,error}=await supabaseClient.from('care_orders').select('order_number,service_type').order('created_at',{ascending:false}).limit(30);
  if(error||!data)return result;
  const cards=el.querySelectorAll('.bio-care-notice');
  data.forEach((o,i)=>{
   if(!['home_lab','doctor','nursing','physio'].includes(o.service_type)||!cards[i])return;
   const btn=document.createElement('button');btn.type='button';btn.className='bc-map-btn';btn.textContent='📍 تتبع فريق الزيارة على الخريطة';
   btn.addEventListener('click',()=>window.biocareTrackTeam(o.order_number));cards[i].appendChild(btn);
  });
 }catch(_){}
 return result;
};
})();
