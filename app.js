
const TESTS=[
['CBC','صورة الدم الكاملة',49,'فحص الدم'],
['TSH','الهرمون المحفز للغدة الدرقية',70,'متابعة الهرمون'],
['HbA1c','السكر التراكمي',65,'تحاليل السكر'],
['Vitamin D','فيتامين د',70,'الفيتامينات'],
['Ferritin','مخزون الحديد',70,'الفيتامينات'],
['B12','فيتامين ب12',70,'الفيتامينات'],
['Urinalysis','تحليل البول',55,'البول والبراز'],
['CRP','بروتين سي التفاعلي',65,'فحص الدم']
];
const PACKAGES=[['الأساسية',209,'20 فحصًا'],['الفضية',349,'27 فحصًا'],['الذهبية',440,'32 فحصًا'],['البلاتينية',649,'41 فحصًا'],['الماسية',949,'47 فحصًا']];
const BRANCHES=['جازان – طريق الأمير سلطان','أبو عريش','صبيا – طريق الملك فهد','صبيا – طريق الملك عبدالله','الداير'];
const CATEGORIES=[
['🧬','تحاليل متابعة الهرمون'],['🩸','تحاليل فحص الدم'],['💉','تحاليل الفيتامينات'],['🩺','تحاليل السكر'],
['🦠','تحاليل الفيروسات'],['🧪','تحاليل البول والبراز'],['🦠','تحاليل جرثومة المعدة'],['🦋','تحاليل الغدة الدرقية']
];
let view='home', selected=[], session=JSON.parse(localStorage.getItem('biocare_session')||'null');
let family=JSON.parse(localStorage.getItem('biocare_family')||'[]');
let bookings=JSON.parse(localStorage.getItem('biocare_bookings')||'[]');
let consults=JSON.parse(localStorage.getItem('biocare_consults')||'[]');
let refills=JSON.parse(localStorage.getItem('biocare_refills')||'[]');
if(!bookings.length)bookings=[{id:'B-2041',name:'عميل تجريبي',branch:BRANCHES[0],date:'2026-10-15',time:'18:00',status:'قادم'}];
if(!consults.length)consults=[{id:'C-109',doctor:'د. سليم الاستشاري',date:'2026-10-16',time:'20:00',status:'مؤكد'}];
const RESULTS=[{id:'R-1001',title:'نتيجة تجريبية معتمدة',date:'2026-10-01',status:'معتمدة'},{id:'R-1002',title:'نتيجة قيد الاعتماد',date:'2026-10-09',status:'قيد الاعتماد'}];
const PRESCRIPTIONS=[{id:'RX-9001',doctor:'د. سليم الاستشاري',date:'2026-10-01',status:'سارية',items:[['دواء تجريبي A','قرص مرة يوميًا','5 أيام'],['دواء تجريبي B','عند الحاجة','3 أيام']]}];

const app=document.getElementById('app'), modal=document.getElementById('modal'), modalBody=document.getElementById('modalBody');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){localStorage.setItem('biocare_session',JSON.stringify(session));localStorage.setItem('biocare_family',JSON.stringify(family));localStorage.setItem('biocare_bookings',JSON.stringify(bookings));localStorage.setItem('biocare_consults',JSON.stringify(consults));localStorage.setItem('biocare_refills',JSON.stringify(refills))}
function openModal(html){modalBody.innerHTML=html;modal.classList.remove('hidden')}
function closeModal(){modal.classList.add('hidden')}
function categoryGrid(){return `<div class="category-grid">${CATEGORIES.map(c=>`<button class="category-card" onclick="showCategory('${esc(c[1])}')"><span class="emoji">${c[0]}</span><strong>${c[1]}</strong></button>`).join('')}</div>`}
function branches(){return `<div class="branch-row">${BRANCHES.map(b=>`<div class="branch-card"><div class="branch-photo"></div><div class="branch-name">${esc(b)}</div></div>`).join('')}</div>`}
function home(){
 return `<section class="hero"><div class="hero-art"></div><div class="hero-copy"><h1>صحتك تستحق الاطمئنان</h1><p>مجموعة شاملة من التحاليل الطبية بدقة عالية، مع تجربة سهلة للحجز والنتائج والاستشارات.</p><button class="primary" onclick="go('tests')">استعرض التحاليل</button></div></section>
 <section class="section"><div class="tabs"><button class="tab">الباقات</button><button class="tab active">التحاليل</button></div>${categoryGrid()}</section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="showBranches()">عرض الكل ‹</button><h2>فروعنا</h2></div>${branches()}</section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="showConsultations()">عرض الكل ‹</button><h2>الاستشارات الطبية</h2></div><div class="cards">
 <div class="card"><span class="chip">جديد</span><h3>استشارة طبية</h3><p class="muted">احجز موعدًا تجريبيًا مع الطبيب، واطلع على المحادثة والوصفة بعد الاستشارة.</p><button class="secondary" onclick="bookConsultation()">احجز استشارة</button></div>
 <div class="card"><span class="chip">وصفة</span><h3>الوصفات الطبية</h3><p class="muted">عرض وصفات تجريبية وطلب إعادة صرف وصفة.</p><button class="secondary" onclick="showPrescriptions()">عرض الوصفات</button></div></div></section>`;
}
function tests(){
 return `<section class="section"><div class="section-head"><h2 class="under">التحاليل</h2></div><input id="testSearch" placeholder="ابحث عن تحليل..." oninput="filterTests(this.value)">
 <div id="testsList" class="cards" style="margin-top:12px">${TESTS.map(t=>testCard(t)).join('')}</div></section>`;
}
function testCard(t){return `<div class="card"><span class="chip">${esc(t[0])}</span><h3>${esc(t[1])}</h3><p class="muted">${esc(t[3])}</p><div class="row"><span class="price">${t[2]} ر.س</span><button class="secondary" onclick="addTest('${esc(t[0])}')">إضافة للحجز</button></div></div>`}
function packages(){
 return `<section class="section"><div class="section-head"><h2 class="under">الباقات والعروض</h2></div><div class="cards">${PACKAGES.map((p,i)=>`<div class="card"><span class="chip">${p[2]}</span><h3>الباقة ${p[0]}</h3><p class="muted">باقة صحية تجريبية، تفاصيلها قابلة للتحديث من لوحة الإدارة.</p><div class="row"><span class="price">${p[1]} ر.س</span><button class="secondary" onclick="addPackage(${i})">اختيار</button></div></div>`).join('')}</div></section>`;
}
function booking(){
 const total=selected.reduce((s,x)=>s+x.price,0);
 return `<section class="section"><div class="section-head"><h2 class="under">الحجز</h2></div><div class="notice">نسخة تجريبية فقط. لا تدخل بيانات مرضى حقيقية.</div><div class="card">
 <h3>الاختيارات</h3><p class="muted">${selected.length?selected.map(x=>esc(x.name)).join('، '):'لم تتم إضافة تحاليل أو باقات بعد'}</p><div class="row"><strong>الإجمالي التجريبي</strong><span class="price">${total} ر.س</span></div>
 <form id="bookingForm"><label>لمن الحجز؟</label><select name="name"><option>${session?esc(session.name):'عميل تجريبي'}</option>${family.map(f=>`<option>${esc(f.name)}</option>`).join('')}</select>
 <label>الفرع</label><select name="branch">${BRANCHES.map(b=>`<option>${esc(b)}</option>`).join('')}</select><label>التاريخ</label><input type="date" name="date" required><label>الوقت</label><select name="time"><option>09:00</option><option>12:00</option><option>16:00</option><option>19:00</option><option>21:00</option></select><br><button class="primary">تسجيل حجز تجريبي</button></form><div id="bookDone"></div></div>
 <div style="margin-top:13px"><button class="ghost" onclick="showAppointments()">مواعيدي وإعادة الجدولة</button></div></section>`;
}
function results(){return `<section class="section"><div class="section-head"><h2 class="under">النتائج</h2></div><div class="notice">لا توجد نتائج مرضى حقيقية في هذه النسخة.</div><div class="list">${RESULTS.map(r=>`<div class="card"><div class="row"><div><h3>${r.title}</h3><div class="muted">${r.date}</div></div><span class="chip">${r.status}</span></div><button class="secondary" onclick="openResult('${r.id}')">عرض التقرير</button></div>`).join('')}</div></section>`}
function profile(){return `<section class="section"><div class="section-head"><h2 class="under">حسابي</h2></div>${session?`<div class="card"><h3>${esc(session.name)}</h3><p class="muted">${esc(session.phone||'')}</p><button class="ghost" onclick="showFamily()">أفراد العائلة</button> <button class="ghost" onclick="showAppointments()">مواعيدي</button> <button class="ghost" onclick="showConsultations()">استشاراتي</button></div>`:`<div class="card"><h3>تسجيل الدخول التجريبي</h3><p class="muted">رمز التحقق التجريبي: 1234</p><button class="primary" onclick="openLogin()">تسجيل الدخول</button></div>`}</section>`}
function render(){
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 if(view==='home')app.innerHTML=home();
 if(view==='tests')app.innerHTML=tests();
 if(view==='packages')app.innerHTML=packages();
 if(view==='booking'){app.innerHTML=booking();document.getElementById('bookingForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));bookings.unshift({id:'B-'+Date.now().toString().slice(-5),...f,status:'قادم'});save();selected=[];document.getElementById('bookDone').innerHTML='<div class="success" style="margin-top:12px">تم حفظ الحجز على هذا الجهاز فقط — ليس حجزًا مؤكدًا.</div>';e.target.reset()}}
 if(view==='results')app.innerHTML=results();
 if(view==='profile')app.innerHTML=profile();
}
window.go=v=>{view=v;render();window.scrollTo({top:0,behavior:'smooth'})}
window.filterTests=q=>{const term=q.toLowerCase().trim();document.getElementById('testsList').innerHTML=TESTS.filter(t=>t.join(' ').toLowerCase().includes(term)).map(testCard).join('')}
window.addTest=code=>{const t=TESTS.find(x=>x[0]===code);selected.push({name:t[1],price:t[2]});go('booking')}
window.addPackage=i=>{const p=PACKAGES[i];selected.push({name:'الباقة '+p[0],price:p[1]});go('booking')}
window.showCategory=name=>{openModal(`<h2>${esc(name)}</h2><p class="muted">قسم تجريبي يعرض التحاليل التابعة لهذه الفئة.</p><div class="cards">${TESTS.filter(t=>t[3]===name||name.includes('تحاليل')).slice(0,5).map(testCard).join('')}</div>`)}
window.showBranches=()=>openModal(`<h2>فروعنا</h2>${branches()}`)
window.openLogin=()=>openModal(`<h2>تسجيل الدخول التجريبي</h2><div class="notice">استخدم الرمز 1234. لا تدخل بيانات حقيقية.</div><form id="loginForm"><label>الاسم</label><input name="name" required><label>الجوال</label><input name="phone" inputmode="numeric"><label>رمز التحقق</label><input name="otp" inputmode="numeric" required></form><br><button class="primary" onclick="submitLogin()">دخول</button>`)
window.submitLogin=()=>{const f=Object.fromEntries(new FormData(document.getElementById('loginForm')));if(f.otp!=='1234'){alert('الرمز التجريبي 1234');return}session={name:f.name,phone:f.phone};save();closeModal();go('profile')}
window.showFamily=()=>openModal(`<h2>أفراد العائلة</h2><div class="list">${family.map((f,i)=>`<div class="card row"><div><strong>${esc(f.name)}</strong><div class="muted">${esc(f.relation)}</div></div><button class="ghost" onclick="removeFamily(${i})">حذف</button></div>`).join('')||'<p class="muted">لا يوجد أفراد مضافون</p>'}</div><label>الاسم التجريبي</label><input id="famName"><label>صلة القرابة</label><input id="famRel"><br><button class="secondary" onclick="addFamily()">إضافة فرد</button>`)
window.addFamily=()=>{const n=document.getElementById('famName').value.trim(),r=document.getElementById('famRel').value.trim();if(!n)return;family.push({name:n,relation:r});save();showFamily()}
window.removeFamily=i=>{family.splice(i,1);save();showFamily()}
window.showAppointments=()=>openModal(`<h2>مواعيدي</h2><div class="list">${bookings.map((b,i)=>`<div class="card"><div class="row"><div><strong>${esc(b.branch)}</strong><div class="muted">${esc(b.date)} — ${esc(b.time)}</div></div><span class="chip">${esc(b.status)}</span></div>${b.status==='قادم'?`<div style="margin-top:12px"><button class="ghost" onclick="reschedule(${i})">إعادة الجدولة</button> <button class="ghost" onclick="cancelBooking(${i})">إلغاء</button></div>`:''}</div>`).join('')}</div>`)
window.reschedule=i=>openModal(`<h2>إعادة الجدولة</h2><label>التاريخ الجديد</label><input type="date" id="newDate"><label>الوقت</label><select id="newTime"><option>09:00</option><option>12:00</option><option>16:00</option><option>19:00</option></select><br><button class="secondary" onclick="saveReschedule(${i})">حفظ</button>`)
window.saveReschedule=i=>{const d=document.getElementById('newDate').value;if(!d)return;bookings[i].date=d;bookings[i].time=document.getElementById('newTime').value;save();showAppointments()}
window.cancelBooking=i=>{bookings[i].status='ملغي';save();showAppointments()}
window.openResult=id=>openModal(`<h2>تقرير نتيجة تجريبي</h2><div class="rx"><div class="rx-head"><div><div class="rx-title">${esc(id)}</div><div class="muted">تقرير عرض فقط وغير صالح للاستخدام الطبي.</div></div><span class="chip">تجريبي</span></div><table style="width:100%;margin-top:15px"><tr><td>CBC</td><td>ضمن المجال المرجعي</td></tr><tr><td>TSH</td><td>2.4</td></tr></table><br><button class="secondary" onclick="window.print()">طباعة / حفظ PDF</button></div>`)
window.showConsultations=()=>openModal(`<h2>الاستشارات الطبية</h2><div class="notice">وظائف تجريبية فقط وليست خدمة طبية فعلية.</div><div class="list">${consults.map(c=>`<div class="card"><div class="row"><div><strong>${esc(c.doctor)}</strong><div class="muted">${esc(c.date)} — ${esc(c.time)}</div></div><span class="chip">${esc(c.status)}</span></div><div style="margin-top:11px"><button class="ghost" onclick="openChat()">فتح المحادثة</button> <button class="ghost" onclick="showPrescriptions()">الوصفات</button></div></div>`).join('')}</div><br><button class="primary" onclick="bookConsultation()">حجز استشارة جديدة</button>`)
window.bookConsultation=()=>openModal(`<h2>حجز استشارة طبية</h2><div class="notice">الحجز تجريبي، ولا يتم إرساله إلى طبيب حقيقي.</div><label>الطبيب</label><select id="consultDoctor"><option>د. سليم الاستشاري</option><option>طبيب عام تجريبي</option></select><label>التاريخ</label><input id="consultDate" type="date"><label>الوقت</label><select id="consultTime"><option>18:00</option><option>20:00</option><option>22:00</option></select><br><button class="primary" onclick="saveConsultation()">حفظ الموعد التجريبي</button>`)
window.saveConsultation=()=>{const d=document.getElementById('consultDate').value;if(!d)return;consults.unshift({id:'C-'+Date.now().toString().slice(-5),doctor:document.getElementById('consultDoctor').value,date:d,time:document.getElementById('consultTime').value,status:'مؤكد'});save();showConsultations()}
window.openChat=()=>openModal(`<h2>محادثتي</h2><div class="notice">محادثة تجريبية غير مرتبطة بطبيب حقيقي.</div><div class="chat-bubble doctor"><strong>الطبيب:</strong><br>أهلًا، كيف يمكنني مساعدتك اليوم؟</div><div class="chat-bubble">هذه رسالة تجريبية من العميل.</div><label>رسالة جديدة</label><textarea rows="3" placeholder="اكتب رسالة تجريبية..."></textarea><br><button class="secondary" onclick="alert('تم الإرسال محليًا للتجربة فقط')">إرسال</button>`)
window.showPrescriptions=()=>openModal(`<h2>الوصفات الطبية</h2><div class="notice">الوصفات المعروضة تجريبية وغير صالحة للصرف.</div><div class="list">${PRESCRIPTIONS.map(rx=>`<div class="rx"><div class="rx-head"><div><div class="rx-title">وصفة ${rx.id}</div><div class="muted">${rx.doctor} — ${rx.date}</div></div><span class="chip">${rx.status}</span></div>${rx.items.map(x=>`<p><strong>${esc(x[0])}</strong><br><span class="muted">${esc(x[1])} — ${esc(x[2])}</span></p>`).join('')}<div class="row"><button class="ghost" onclick="window.print()">حفظ PDF</button><button class="secondary" onclick="requestRefill('${rx.id}')">طلب إعادة صرف</button></div></div>`).join('')}</div>`)
window.requestRefill=id=>{refills.unshift({id:'RF-'+Date.now().toString().slice(-5),rx:id,date:new Date().toISOString().slice(0,10),status:'قيد المراجعة'});save();openModal(`<h2>إعادة صرف وصفة</h2><div class="success">تم إنشاء طلب تجريبي للوصفة ${esc(id)}. الحالة: قيد المراجعة.</div>`)}
window.showRefills=()=>openModal(`<h2>طلبات إعادة صرف الوصفة</h2><div class="list">${refills.map(r=>`<div class="card"><strong>${esc(r.rx)}</strong><div class="muted">${esc(r.date)}</div><span class="chip">${esc(r.status)}</span></div>`).join('')||'<p class="muted">لا توجد طلبات</p>'}</div>`)
window.showOffers=()=>openModal(`<h2>العروض</h2><div class="cards">${PACKAGES.slice(0,3).map((p,i)=>`<div class="card"><span class="chip">عرض</span><h3>الباقة ${p[0]}</h3><div class="price">${p[1]} ر.س</div></div>`).join('')}</div>`)
window.showNotifications=()=>openModal(`<h2>الإشعارات</h2><div class="card"><strong>مرحبًا بك في بيوكير</strong><p class="muted">هذه إشعارات تجريبية داخل التطبيق.</p></div>`)
window.showSupport=()=>openModal(`<h2>المساعدة والخصوصية</h2><div class="card"><h3>الدعم والتواصل</h3><p class="muted">تواصل مع الدعم أو افتح سياسة الخصوصية. الروابط الفعلية تضاف عند الإطلاق.</p></div>`)
window.showAbout=()=>openModal(`<h2>حول التطبيق</h2><p class="muted">Biocare Medical Laboratories — نسخة تجريبية قابلة للتثبيت على الجوال.</p>`)
window.showTestimonials=()=>openModal(`<h2>شهادات العملاء</h2><div class="card">⭐️⭐️⭐️⭐️⭐️<p class="muted">شهادة تجريبية لأغراض تصميم الواجهة فقط.</p></div>`)
window.showJobs=()=>openModal(`<h2>وظائف</h2><p class="muted">سيتم عرض الوظائف المتاحة هنا عند ربط لوحة الإدارة.</p>`)
window.showBlogs=()=>openModal(`<h2>المدونات</h2><div class="card"><h3>كيف تستعد للتحليل؟</h3><p class="muted">مقال تجريبي قصير.</p></div>`)
window.logout=()=>{session=null;save();closeDrawer();go('home')}
window.setLanguage=()=>openModal(`<h2>اللغة</h2><div class="card"><strong>العربية</strong><p class="muted">اللغة الافتراضية الحالية.</p></div><div class="card"><strong>English</strong><p class="muted">تجهيز الترجمة الكاملة قبل الإطلاق.</p></div>`)
window.appPreferences=()=>openModal(`<h2>تفضيل التطبيق</h2><p class="muted">إعدادات الإشعارات والمظهر وحجم الخط ستظهر هنا.</p>`)

const menuGroups=[
['الاستشارات',[
['💬','الاستشارات الطبية','showConsultations()'],['💬','محادثاتي','openChat()'],['📅','مواعيد الاستشارات','showConsultations()'],['📄','الوصفات الطبية','showPrescriptions()'],['↻','إعادة صرف وصفة','showRefills()']]],
['الخدمات',[
['📁','الباقات',"closeDrawer();go('packages')"],['🎁','عروض','showOffers()'],['📂','أقسام التحاليل',"closeDrawer();go('tests')"],['📅','الحجز',"closeDrawer();go('booking')"],['📄','النتائج',"closeDrawer();go('results')"],['👤','حسابي',"closeDrawer();go('profile')"],['🔔','الإشعارات','showNotifications()'],['⚙','تفضيل التطبيق','appPreferences()'],['文','اللغة','setLanguage()']]],
['المساعدة والخصوصية',[
['🛡','المساعدة والخصوصية','showSupport()'],['ⓘ','حول التطبيق','showAbout()'],['👍','شهادات العملاء','showTestimonials()'],['💼','وظائف','showJobs()'],['📁','المدونات','showBlogs()']]],
['', [['↪','تسجيل خروج','logout()','danger']]]
];
function buildMenu(){document.getElementById('drawerMenu').innerHTML=menuGroups.map(g=>`<div class="drawer-group">${g[0]?`<div class="drawer-title">${g[0]}</div>`:''}${g[1].map(x=>`<button class="drawer-item ${x[3]||''}" onclick="${x[2]}"><span class="drawer-icon">${x[0]}</span><span>${x[1]}</span><span class="drawer-arrow">‹</span></button>`).join('')}</div>`).join('')}
function openDrawer(){document.getElementById('drawer').classList.add('open');document.getElementById('drawerBackdrop').classList.remove('hidden');document.getElementById('drawer').setAttribute('aria-hidden','false')}
window.closeDrawer=()=>{document.getElementById('drawer').classList.remove('open');document.getElementById('drawerBackdrop').classList.add('hidden');document.getElementById('drawer').setAttribute('aria-hidden','true')}
document.getElementById('menuBtn').onclick=openDrawer;document.getElementById('drawerClose').onclick=closeDrawer;document.getElementById('drawerBackdrop').onclick=closeDrawer;
document.getElementById('modalClose').onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal()}
document.getElementById('notifyBtn').onclick=showNotifications;document.getElementById('cartBtn').onclick=()=>go('booking');
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>go(b.dataset.view));
buildMenu();render();setTimeout(()=>document.getElementById('splash').classList.add('hide'),750);setTimeout(()=>document.getElementById('splash').remove(),1200);
