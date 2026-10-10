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
['الباقة الماسية','Diamond Package',949,'47 فحصًا','47 tests'],
['باقة الغدة الدرقية','Thyroid Package',145,'3 فحوصات','3 tests']
];
const BRANCHES=[
['جازان – طريق الأمير سلطان','Jazan – Prince Sultan Rd'],
['أبو عريش','Abu Arish'],
['صبيا – طريق الملك فهد','Sabya – King Fahd Rd'],
['صبيا – طريق الملك عبدالله','Sabya – King Abdullah Rd'],
['الداير','Addayer']
];
const T={
ar:{brand:'مختبرات بيوكير الطبية',homeTitle:'صحتك تستحق الاطمئنان',homeSub:'استعرض التحاليل والباقات واختر الفرع المناسب، في تجربة جوال عربية سريعة وسهلة.',browse:'استعرض التحاليل',services:'خدماتنا',branches:'فروعنا',tests:'التحاليل الطبية',packages:'الباقات الصحية',booking:'حجز موعد تجريبي',results:'نتائج التحاليل',search:'ابحث باسم التحليل أو الرمز...',add:'إضافة للحجز',selected:'اختياراتك',none:'لا توجد اختيارات',total:'الإجمالي التجريبي',demoName:'اسم تجريبي',branch:'الفرع',date:'التاريخ',time:'الوقت',save:'حفظ حجز تجريبي',demoWarn:'هذه نسخة عرض فقط. لا تدخل بيانات مرضى حقيقية ولا تعتمد عليها لحجز فعلي.',resultsText:'لا توجد نتائج مرضى حقيقية. الربط الآمن مع نظام المختبر واعتماد النتائج مرحلة لاحقة.',saved:'تم حفظ الحجز على هذا الجهاز فقط — ليس حجزًا مؤكدًا.',riyals:'ر.س'},
en:{brand:'Biocare Medical Laboratories',homeTitle:'Health deserves reassurance',homeSub:'Browse tests and packages and choose the right branch in a fast mobile experience.',browse:'Browse tests',services:'Services',branches:'Branches',tests:'Medical Tests',packages:'Health Packages',booking:'Demo Booking',results:'Lab Results',search:'Search by test name or code...',add:'Add to booking',selected:'Your selections',none:'No selections',total:'Demo total',demoName:'Demo name',branch:'Branch',date:'Date',time:'Time',save:'Save demo booking',demoWarn:'Demo only. Do not enter real patient data and do not rely on this as a confirmed booking.',resultsText:'No real patient results are available. Secure LIS integration and specialist approval are a later phase.',saved:'Saved on this device only — this is not a confirmed booking.',riyals:'SAR'}
};
let lang=localStorage.getItem('biocare_lang')||'ar';
let view='home', selected=[], bookings=[];
try{bookings=JSON.parse(localStorage.getItem('biocare_demo_bookings')||'[]')}catch(e){bookings=[]}
const app=document.getElementById('app'), q=x=>document.querySelector(x);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tx=k=>T[lang][k]||k;
function name(test){return lang==='ar'?test[1]:test[2]}
function packageName(p){return lang==='ar'?p[0]:p[1]}
function packageCount(p){return lang==='ar'?p[3]:p[4]}
function branchName(b){return lang==='ar'?b[0]:b[1]}
function setLangUI(){
 document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 q('#brandName').textContent=tx('brand');q('#langBtn').textContent=lang==='ar'?'EN':'ع';
 const nav={navHome:['الرئيسية','Home'],navTests:['التحاليل','Tests'],navPackages:['الباقات','Packages'],navBooking:['الحجز','Booking'],navResults:['النتائج','Results']};
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=nav[el.dataset.i18n][lang==='ar'?0:1]);
}
function testCards(items){
 return `<div class="grid">${items.map(t=>`<article class="card"><span class="chip">${esc(t[0])}</span><h3>${esc(name(t))}</h3><div class="row"><span class="price">${t[3]} ${tx('riyals')}</span><button class="primary" onclick="addTest('${esc(t[0])}')">${tx('add')}</button></div></article>`).join('')}</div>`;
}
function packageCards(){
 return `<div class="grid">${PACKAGES.map((p,i)=>`<article class="card"><span class="chip">${esc(packageCount(p))}</span><h3>${esc(packageName(p))}</h3><div class="row"><span class="price">${p[2]} ${tx('riyals')}</span><button class="primary" onclick="addPackage(${i})">${tx('add')}</button></div></article>`).join('')}</div>`;
}
function render(){
 setLangUI();
 document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 let h='';
 if(view==='home')h=`<section class="hero"><h1>${tx('homeTitle')}</h1><p>${tx('homeSub')}</p><button class="primary" onclick="go('tests')">${tx('browse')}</button></section>
 <h2 class="section-title">${tx('services')}</h2><div class="grid">
 <div class="card service"><div class="icon">🧪</div><h3>${tx('tests')}</h3><p class="muted">${lang==='ar'?'تصفح أشهر التحاليل وأسعارها التجريبية.':'Browse common tests and sample prices.'}</p></div>
 <div class="card service"><div class="icon">💚</div><h3>${tx('packages')}</h3><p class="muted">${lang==='ar'?'باقات صحية مرتبة لتسهيل الاختيار.':'Organized health packages for easy selection.'}</p></div>
 <div class="card service"><div class="icon">📅</div><h3>${tx('booking')}</h3><p class="muted">${lang==='ar'?'اختيار الفرع والتاريخ والوقت في نموذج تجريبي.':'Choose branch, date and time in a demo flow.'}</p></div></div>
 <h2 class="section-title">${tx('branches')}</h2><div class="grid">${BRANCHES.map(b=>`<div class="card branch"><span>📍</span><strong>${esc(branchName(b))}</strong></div>`).join('')}</div>`;
 if(view==='tests')h=`<h1>${tx('tests')}</h1><input id="search" class="search" placeholder="${tx('search')}" oninput="searchTests(this.value)"><div id="testsList">${testCards(TESTS)}</div>`;
 if(view==='packages')h=`<h1>${tx('packages')}</h1><div class="notice">${lang==='ar'?'الأسعار هنا للعرض الأولي وتحتاج اعتمادًا قبل الاستخدام التجاري.':'Prices are sample values and require approval before commercial use.'}</div>${packageCards()}`;
 if(view==='booking'){
   const total=selected.reduce((s,x)=>s+x.price,0);
   h=`<h1>${tx('booking')}</h1><div class="notice">${tx('demoWarn')}</div><div class="card">
   <h3>${tx('selected')}</h3><p class="muted">${selected.length?selected.map(x=>esc(x.label)).join('، '):tx('none')}</p>
   <div class="row"><strong>${tx('total')}</strong><span class="price">${total} ${tx('riyals')}</span></div>
   <form id="bookingForm"><label>${tx('demoName')}</label><input name="name" required placeholder="${lang==='ar'?'عميل تجريبي':'Demo customer'}">
   <label>${tx('branch')}</label><select name="branch">${BRANCHES.map(b=>`<option>${esc(branchName(b))}</option>`).join('')}</select>
   <label>${tx('date')}</label><input name="date" type="date" required>
   <label>${tx('time')}</label><select name="time"><option>09:00</option><option>12:00</option><option>16:00</option><option>19:00</option><option>21:00</option></select>
   <br><button class="primary" type="submit">${tx('save')}</button></form><div id="done"></div></div>`;
 }
 if(view==='results')h=`<h1>${tx('results')}</h1><div class="notice">${tx('resultsText')}</div><div class="card"><div class="icon">📄</div><h3>${lang==='ar'?'لا توجد تقارير مرتبطة بهذه النسخة':'No reports are linked to this demo'}</h3><p class="muted">${lang==='ar'?'قبل الإطلاق الفعلي يلزم تسجيل دخول آمن، صلاحيات، تشفير، وتدفق اعتماد للنتائج.':'Production requires secure identity, permissions, encryption and an approval workflow.'}</p></div>`;
 app.innerHTML=h;
 if(view==='booking'){
   q('#bookingForm').onsubmit=e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.target));bookings.push(b);localStorage.setItem('biocare_demo_bookings',JSON.stringify(bookings));selected=[];q('#done').innerHTML=`<div class="success">${tx('saved')}</div>`;e.target.reset()}
 }
}
window.go=v=>{view=v;render();window.scrollTo({top:0,behavior:'smooth'})};
window.addTest=code=>{const t=TESTS.find(x=>x[0]===code);selected.push({label:name(t),price:t[3]});go('booking')};
window.addPackage=i=>{const p=PACKAGES[i];selected.push({label:packageName(p),price:p[2]});go('booking')};
window.searchTests=s=>{const term=s.trim().toLowerCase();q('#testsList').innerHTML=testCards(TESTS.filter(t=>t.join(' ').toLowerCase().includes(term)))};
document.querySelectorAll('.navbtn').forEach(b=>b.onclick=()=>go(b.dataset.view));
q('#langBtn').onclick=()=>{lang=lang==='ar'?'en':'ar';localStorage.setItem('biocare_lang',lang);render()};
q('#closeInstall').onclick=()=>{q('#installTip').style.display='none';localStorage.setItem('biocare_install_tip','1')};
const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);const standalone=window.navigator.standalone===true;
if(isiOS&&!standalone&&!localStorage.getItem('biocare_install_tip'))setTimeout(()=>q('#installTip').style.display='block',1300);
render();
