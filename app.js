
const TESTS=[
['CBC','صورة الدم الكاملة','Complete Blood Count',49],
['TSH','هرمون الغدة الدرقية','Thyroid Stimulating Hormone',70],
['HbA1c','السكر التراكمي','HbA1c',65],
['Vitamin D','فيتامين د','Vitamin D',70],
['Ferritin','مخزون الحديد','Ferritin',70],
['Vitamin B12','فيتامين ب12','Vitamin B12',70],
['FBS','السكر الصائم','Fasting Blood Sugar',49],
['CRP','بروتين سي التفاعلي','C-Reactive Protein',65],
['Urinalysis','تحليل البول','Urinalysis',55],
['Calcium','الكالسيوم','Calcium',58],
['Prolactin','هرمون الحليب','Prolactin',70],
['AMH','مخزون المبيض','AMH',220]
];
const PACKAGES=[
['الباقة الأساسية','Basic Package',209,'20 فحصًا','20 tests'],
['الباقة الفضية','Silver Package',349,'27 فحصًا','27 tests'],
['الباقة الذهبية','Gold Package',440,'32 فحصًا','32 tests'],
['الباقة البلاتينية','Platinum Package',649,'41 فحصًا','41 tests'],
['الباقة الماسية','Diamond Package',949,'47 فحصًا','47 tests']
];
const BRANCHES=[['جازان – طريق الأمير سلطان','Jazan – Prince Sultan Rd'],['أبو عريش','Abu Arish'],['صبيا – طريق الملك فهد','Sabya – King Fahd Rd'],['صبيا – طريق الملك عبدالله','Sabya – King Abdullah Rd'],['الداير','Addayer']];
const app=document.getElementById('app'),modal=document.getElementById('modal'),modalContent=document.getElementById('modalContent');
let lang=localStorage.getItem('biocare_lang')||'ar',view='home',selected=[];
let session=JSON.parse(localStorage.getItem('biocare_session')||'null');
let family=JSON.parse(localStorage.getItem('biocare_family')||'[]');
let bookings=JSON.parse(localStorage.getItem('biocare_bookings')||'[]');
let notifications=JSON.parse(localStorage.getItem('biocare_notifications')||'[]');
if(!bookings.length) bookings=[
{id:'B202601',name:'عميل تجريبي',branch:'جازان – طريق الأمير سلطان',date:'2026-10-14',time:'18:00',status:'upcoming',items:['صورة الدم الكاملة','فيتامين د']},
{id:'B202530',name:'عميل تجريبي',branch:'أبو عريش',date:'2026-09-20',time:'11:00',status:'past',items:['السكر التراكمي']}
];
if(!notifications.length) notifications=[
{id:1,title:'مرحبًا بك في بيوكير',body:'هذه إشعارات تجريبية داخل التطبيق فقط.',read:false},
{id:2,title:'موعد تجريبي قادم',body:'لديك موعد تجريبي محفوظ على هذا الجهاز.',read:false}
];
const RESULTS=[
{id:'R1001',date:'2026-09-20',titleAr:'نتيجة تحليل تجريبية',titleEn:'Demo Lab Result',status:'approved',tests:[['HbA1c','5.4 %','4.0–5.6']]},
{id:'R1002',date:'2026-10-08',titleAr:'نتيجة قيد الاعتماد',titleEn:'Result Pending Approval',status:'pending',tests:[['TSH','—','—']]}
];
const T={
ar:{home:'الرئيسية',tests:'التحاليل',booking:'الحجز',results:'النتائج',more:'المزيد',hello:'مرحبًا',guest:'زائر',login:'تسجيل الدخول',logout:'تسجيل الخروج',family:'أفراد العائلة',appointments:'مواعيدي',profile:'الملف الشخصي',notifications:'الإشعارات',support:'الدعم والتواصل',packages:'الباقات',branches:'فروعنا',search:'ابحث باسم التحليل أو الرمز...',add:'إضافة للحجز',bookNow:'احجز الآن',demo:'هذه نسخة تجريبية فقط. لا تدخل بيانات مرضى حقيقية.',riyals:'ر.س'},
en:{home:'Home',tests:'Tests',booking:'Booking',results:'Results',more:'More',hello:'Hello',guest:'Guest',login:'Sign in',logout:'Sign out',family:'Family',appointments:'Appointments',profile:'Profile',notifications:'Notifications',support:'Support',packages:'Packages',branches:'Branches',search:'Search by test name or code...',add:'Add to booking',bookNow:'Book now',demo:'Demo only. Do not enter real patient data.',riyals:'SAR'}
};
const tx=k=>T[lang][k]||k, esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const testName=t=>lang==='ar'?t[1]:t[2], packageName=p=>lang==='ar'?p[0]:p[1], branchName=b=>lang==='ar'?b[0]:b[1];
function save(){localStorage.setItem('biocare_family',JSON.stringify(family));localStorage.setItem('biocare_bookings',JSON.stringify(bookings));localStorage.setItem('biocare_notifications',JSON.stringify(notifications));localStorage.setItem('biocare_session',JSON.stringify(session))}
function updateShell(){
 document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 document.getElementById('brandName').textContent=lang==='ar'?'مختبرات بيوكير الطبية':'Biocare Medical Laboratories';
 document.getElementById('langBtn').textContent=lang==='ar'?'EN':'ع';
 const labels=[tx('home'),tx('tests'),tx('booking'),tx('results'),tx('more')];document.querySelectorAll('.navbtn span').forEach((x,i)=>x.textContent=labels[i]);
 document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
}
function accountCard(){
 return `<div class="card account-banner"><div class="row"><div class="avatar">${session?esc((session.name||'B')[0]):'👤'}</div><div><strong>${tx('hello')}، ${session?esc(session.name):tx('guest')}</strong><div class="muted">${session?(lang==='ar'?'حساب تجريبي محلي':'Local demo account'):(lang==='ar'?'سجّل الدخول للوصول للملف والعائلة':'Sign in to access profile and family')}</div></div></div><button class="${session?'secondary':'primary'}" onclick="${session?"go('more')":"openLogin()"}">${session?tx('profile'):tx('login')}</button></div>`;
}
function renderHome(){
 const upcoming=bookings.filter(b=>b.status==='upcoming').length, unread=notifications.filter(n=>!n.read).length;
 return `${accountCard()}<section class="hero" style="margin-top:14px"><h1>${lang==='ar'?'صحتك تستحق الاطمئنان':'Health deserves reassurance'}</h1><p>${lang==='ar'?'واجهة عميل تجريبية لحجز التحاليل ومتابعة المواعيد والنتائج.':'A demo client experience for tests, appointments and results.'}</p><button class="primary" onclick="go('tests')">${lang==='ar'?'استعرض التحاليل':'Browse tests'}</button></section>
 <div class="kpi" style="margin-top:13px"><div class="card"><strong>${upcoming}</strong><span class="muted">${tx('appointments')}</span></div><div class="card"><strong>${RESULTS.length}</strong><span class="muted">${tx('results')}</span></div><div class="card"><strong>${unread}</strong><span class="muted">${tx('notifications')}</span></div></div>
 <h2 class="section-title">${lang==='ar'?'خدمات سريعة':'Quick actions'}</h2><div class="menu-grid">
 <button class="menu-item" onclick="go('booking')"><span>📅</span><strong>${tx('booking')}</strong></button>
 <button class="menu-item" onclick="showAppointments()"><span>🗓️</span><strong>${tx('appointments')}</strong></button>
 <button class="menu-item" onclick="go('results')"><span>📄</span><strong>${tx('results')}</strong></button>
 <button class="menu-item" onclick="showFamily()"><span>👨‍👩‍👧</span><strong>${tx('family')}</strong></button></div>
 <h2 class="section-title">${tx('branches')}</h2><div class="grid">${BRANCHES.map(b=>`<div class="card branch"><span class="icon">📍</span><strong>${esc(branchName(b))}</strong></div>`).join('')}</div>`;
}
function testCards(items){return `<div class="grid">${items.map(t=>`<article class="card"><span class="chip">${esc(t[0])}</span><h3>${esc(testName(t))}</h3><div class="row"><span class="price">${t[3]} ${tx('riyals')}</span><button class="primary" onclick="addTest('${esc(t[0])}')">${tx('add')}</button></div></article>`).join('')}</div>`}
function renderTests(){return `<h1>${tx('tests')}</h1><input class="search" id="search" placeholder="${tx('search')}" oninput="searchTests(this.value)"><div id="testsList">${testCards(TESTS)}</div><h2 class="section-title">${tx('packages')}</h2><div class="grid">${PACKAGES.map((p,i)=>`<article class="card"><span class="chip">${lang==='ar'?p[3]:p[4]}</span><h3>${esc(packageName(p))}</h3><div class="row"><span class="price">${p[2]} ${tx('riyals')}</span><button class="primary" onclick="addPackage(${i})">${tx('add')}</button></div></article>`).join('')}</div>`}
function renderBooking(){
 const total=selected.reduce((s,x)=>s+x.price,0);
 return `<h1>${tx('booking')}</h1><div class="notice">${tx('demo')}</div><div class="card"><h3>${lang==='ar'?'اختياراتك':'Selections'}</h3><p class="muted">${selected.length?selected.map(x=>esc(x.label)).join('، '):(lang==='ar'?'لا توجد اختيارات':'No selections')}</p><div class="row"><strong>${lang==='ar'?'الإجمالي التجريبي':'Demo total'}</strong><span class="price">${total} ${tx('riyals')}</span></div>
 <form id="bookingForm"><label>${lang==='ar'?'لمن الحجز؟':'Booking for'}</label><select name="name"><option>${session?esc(session.name):lang==='ar'?'عميل تجريبي':'Demo customer'}</option>${family.map(f=>`<option>${esc(f.name)}</option>`).join('')}</select>
 <label>${lang==='ar'?'الفرع':'Branch'}</label><select name="branch">${BRANCHES.map(b=>`<option>${esc(branchName(b))}</option>`).join('')}</select><label>${lang==='ar'?'التاريخ':'Date'}</label><input name="date" type="date" required><label>${lang==='ar'?'الوقت':'Time'}</label><select name="time"><option>09:00</option><option>12:00</option><option>16:00</option><option>19:00</option><option>21:00</option></select><br><button class="primary">${tx('bookNow')}</button></form><div id="bookingDone"></div></div>
 <button class="secondary" style="margin-top:12px" onclick="showAppointments()">${tx('appointments')}</button>`;
}
function renderResults(){return `<h1>${tx('results')}</h1><div class="notice">${tx('demo')}</div><div class="list">${RESULTS.map(r=>`<div class="card result-card ${r.status==='pending'?'pending':''}"><div class="row"><div><strong>${lang==='ar'?r.titleAr:r.titleEn}</strong><div class="muted">${r.date}</div></div><span class="status ${r.status==='pending'?'gray':''}">${r.status==='approved'?(lang==='ar'?'معتمدة':'Approved'):(lang==='ar'?'قيد الاعتماد':'Pending')}</span></div><div style="margin-top:13px"><button class="secondary" onclick="openResult('${r.id}')">${lang==='ar'?'عرض التقرير':'View report'}</button></div></div>`).join('')}</div>`}
function renderMore(){return `${accountCard()}<h2 class="section-title">${tx('more')}</h2><div class="menu-grid"><button class="menu-item" onclick="showAppointments()"><span>🗓️</span><strong>${tx('appointments')}</strong></button><button class="menu-item" onclick="showFamily()"><span>👨‍👩‍👧</span><strong>${tx('family')}</strong></button><button class="menu-item" onclick="showNotifications()"><span>🔔</span><strong>${tx('notifications')}</strong></button><button class="menu-item" onclick="showProfile()"><span>👤</span><strong>${tx('profile')}</strong></button><button class="menu-item" onclick="showSupport()"><span>💬</span><strong>${tx('support')}</strong></button></div><div class="admin-link">${lang==='ar'?'لوحة الإدارة منفصلة عن تطبيق العميل':'Admin panel is separate from the client app'} — <a href="admin.html">Admin Demo</a></div>`}
function render(){
 updateShell();
 if(view==='home')app.innerHTML=renderHome();
 if(view==='tests')app.innerHTML=renderTests();
 if(view==='booking'){app.innerHTML=renderBooking();document.getElementById('bookingForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const b={id:'B'+Date.now().toString().slice(-6),...f,status:'upcoming',items:selected.map(x=>x.label)};bookings.unshift(b);notifications.unshift({id:Date.now(),title:lang==='ar'?'تم حفظ حجز تجريبي':'Demo booking saved',body:`${b.date} — ${b.branch}`,read:false});save();selected=[];document.getElementById('bookingDone').innerHTML=`<div class="success">${lang==='ar'?'تم حفظ الحجز على هذا الجهاز فقط، وليس حجزًا مؤكدًا.':'Saved on this device only; this is not a confirmed booking.'}</div>`;e.target.reset()}}
 if(view==='results')app.innerHTML=renderResults();
 if(view==='more')app.innerHTML=renderMore();
}
window.go=v=>{view=v;render();window.scrollTo({top:0,behavior:'smooth'})}
window.addTest=code=>{const t=TESTS.find(x=>x[0]===code);selected.push({label:testName(t),price:t[3]});go('booking')}
window.addPackage=i=>{const p=PACKAGES[i];selected.push({label:packageName(p),price:p[2]});go('booking')}
window.searchTests=s=>{const term=s.toLowerCase().trim();document.getElementById('testsList').innerHTML=testCards(TESTS.filter(t=>t.join(' ').toLowerCase().includes(term)))}
function openModal(html){modalContent.innerHTML=html;modal.classList.remove('hidden')} function closeModal(){modal.classList.add('hidden')}
window.openLogin=()=>openModal(`<h2>${tx('login')}</h2><div class="notice">${tx('demo')} ${lang==='ar'?'رمز التحقق التجريبي: 1234':'Demo OTP: 1234'}</div><form id="loginForm"><label>${lang==='ar'?'الاسم التجريبي':'Demo name'}</label><input name="name" required placeholder="${lang==='ar'?'مثال: أحمد':'Example: Ahmed'}"><label>${lang==='ar'?'رقم الجوال':'Mobile number'}</label><input name="phone" inputmode="numeric" placeholder="05xxxxxxxx"><label>${lang==='ar'?'رمز التحقق':'OTP'}</label><input name="otp" inputmode="numeric" required></form><br><button class="primary" onclick="submitLogin()">${tx('login')}</button>`)
window.submitLogin=()=>{const form=document.getElementById('loginForm'),f=Object.fromEntries(new FormData(form));if(f.otp!=='1234'){alert(lang==='ar'?'استخدم الرمز التجريبي 1234':'Use demo OTP 1234');return}session={name:f.name,phone:f.phone};save();closeModal();render()}
window.showFamily=()=>{openModal(`<h2>${tx('family')}</h2><div class="notice">${tx('demo')}</div><div id="familyList" class="list">${family.map((f,i)=>`<div class="card family-card"><div><strong>${esc(f.name)}</strong><div class="muted">${esc(f.relation||'')}</div></div><button class="danger" onclick="removeFamily(${i})">${lang==='ar'?'حذف':'Delete'}</button></div>`).join('')||`<p class="muted">${lang==='ar'?'لا يوجد أفراد مضافون':'No family members added'}</p>`}</div><h3>${lang==='ar'?'إضافة فرد':'Add family member'}</h3><input id="familyName" placeholder="${lang==='ar'?'الاسم التجريبي':'Demo name'}"><input id="familyRelation" placeholder="${lang==='ar'?'صلة القرابة':'Relationship'}"><button class="primary" onclick="addFamily()">${lang==='ar'?'إضافة':'Add'}</button>`)}
window.addFamily=()=>{const n=document.getElementById('familyName').value.trim(),r=document.getElementById('familyRelation').value.trim();if(!n)return;family.push({name:n,relation:r});save();showFamily()}
window.removeFamily=i=>{family.splice(i,1);save();showFamily()}
window.showAppointments=()=>{openModal(`<h2>${tx('appointments')}</h2><div class="notice">${tx('demo')}</div><div class="list">${bookings.map((b,i)=>`<div class="card appt ${b.status}"><div class="row"><div><strong>${esc(b.name)}</strong><div class="muted">${esc(b.branch)}<br>${esc(b.date)} — ${esc(b.time)}</div></div><span class="status ${b.status==='past'?'gray':b.status==='cancelled'?'red':''}">${b.status==='upcoming'?(lang==='ar'?'قادم':'Upcoming'):b.status==='past'?(lang==='ar'?'سابق':'Past'):(lang==='ar'?'ملغي':'Cancelled')}</span></div>${b.status==='upcoming'?`<div class="row" style="margin-top:12px"><button class="secondary" onclick="reschedule(${i})">${lang==='ar'?'إعادة الجدولة':'Reschedule'}</button><button class="danger" onclick="cancelAppt(${i})">${lang==='ar'?'إلغاء':'Cancel'}</button></div>`:''}</div>`).join('')}</div>`)}
window.reschedule=i=>{openModal(`<h2>${lang==='ar'?'إعادة جدولة الموعد':'Reschedule appointment'}</h2><input id="newDate" type="date"><select id="newTime"><option>09:00</option><option>12:00</option><option>16:00</option><option>19:00</option></select><br><button class="primary" onclick="saveReschedule(${i})">${lang==='ar'?'حفظ':'Save'}</button>`)}
window.saveReschedule=i=>{const d=document.getElementById('newDate').value,t=document.getElementById('newTime').value;if(!d)return;bookings[i].date=d;bookings[i].time=t;save();showAppointments()}
window.cancelAppt=i=>{bookings[i].status='cancelled';save();showAppointments()}
window.openResult=id=>{const r=RESULTS.find(x=>x.id===id);openModal(`<h2>${lang==='ar'?r.titleAr:r.titleEn}</h2><p class="muted">${r.date} — ${r.id}</p>${r.status==='pending'?`<div class="notice">${lang==='ar'?'النتيجة ما زالت قيد الاعتماد في هذا النموذج التجريبي.':'This demo result is pending approval.'}</div>`:`<table><tr><th>${lang==='ar'?'الفحص':'Test'}</th><th>${lang==='ar'?'النتيجة':'Result'}</th><th>${lang==='ar'?'المرجع':'Reference'}</th></tr>${r.tests.map(t=>`<tr><td>${esc(t[0])}</td><td>${esc(t[1])}</td><td>${esc(t[2])}</td></tr>`).join('')}</table><p class="notice">${lang==='ar'?'تقرير تجريبي فقط وغير صالح للاستخدام الطبي.':'Demo report only; not for clinical use.'}</p><button class="secondary" onclick="window.print()">${lang==='ar'?'طباعة / حفظ PDF':'Print / Save PDF'}</button>`}`)}
window.showNotifications=()=>{notifications.forEach(n=>n.read=true);save();openModal(`<h2>${tx('notifications')}</h2><div class="list">${notifications.map(n=>`<div class="card"><strong>${esc(n.title)}</strong><p class="muted">${esc(n.body)}</p></div>`).join('')}</div>`);render()}
window.showProfile=()=>{openModal(`<h2>${tx('profile')}</h2>${session?`<div class="card"><strong>${esc(session.name)}</strong><div class="muted">${esc(session.phone||'')}</div></div><br><button class="danger" onclick="logout()">${tx('logout')}</button>`:`<div class="notice">${lang==='ar'?'لم يتم تسجيل الدخول.':'Not signed in.'}</div><button class="primary" onclick="openLogin()">${tx('login')}</button>`}`)}
window.logout=()=>{session=null;save();closeModal();render()}
window.showSupport=()=>openModal(`<h2>${tx('support')}</h2><div class="card"><div class="icon">💬</div><h3>${lang==='ar'?'مركز المساعدة':'Help center'}</h3><p class="muted">${lang==='ar'?'واجهة تجريبية. يمكن لاحقًا ربط الواتساب والدردشة والدعم الفني.':'Demo interface. WhatsApp, chat and support can be integrated later.'}</p></div>`)
document.querySelectorAll('.navbtn').forEach(b=>b.onclick=()=>go(b.dataset.view));
document.getElementById('langBtn').onclick=()=>{lang=lang==='ar'?'en':'ar';localStorage.setItem('biocare_lang',lang);render()}
document.getElementById('notifyBtn').onclick=()=>showNotifications();document.getElementById('closeModal').onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal()}
document.getElementById('closeInstall').onclick=()=>{document.getElementById('installTip').style.display='none';localStorage.setItem('biocare_install_tip','1')}
const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent),standalone=window.navigator.standalone===true;if(isiOS&&!standalone&&!localStorage.getItem('biocare_install_tip'))setTimeout(()=>document.getElementById('installTip').style.display='block',1300)
render();
