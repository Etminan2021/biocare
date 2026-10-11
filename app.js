
const CATALOG = window.BIOCARE_CATALOG || {tests:[],packages:[],testCategories:[],packageCategories:[]};
const TESTS = CATALOG.tests || [];
const PACKAGES = CATALOG.packages || [];
const BRANCHES = [
  'جازان – طريق الأمير سلطان (المطار)',
  'أبو عريش',
  'صبيا – طريق الملك فهد',
  'صبيا – طريق الملك عبدالله (بجوار الطيري)',
  'الداير'
];

const HOME_CATEGORIES = [
  {label:'تحاليل الدم',cat:'تحاليل الدم',icon:'blood'},
  {label:'الهرمونات والغدد',cat:'الهرمونات والغدد',icon:'dna'},
  {label:'السكري',cat:'السكري',icon:'sugar'},
  {label:'الفيتامينات والمعادن',cat:'الفيتامينات والمعادن',icon:'vit'},
  {label:'الأمراض المعدية',cat:'الأمراض المعدية',icon:'virus'},
  {label:'البول والبراز',cat:'البول والبراز',icon:'urine'},
  {label:'وظائف الكبد',cat:'وظائف الكبد',icon:'liver'},
  {label:'وظائف الكلى',cat:'وظائف الكلى',icon:'kidney'}
];

let view='home';
let selected=JSON.parse(localStorage.getItem('biocare_cart')||'[]');
let session=JSON.parse(localStorage.getItem('biocare_session')||'null');
let family=JSON.parse(localStorage.getItem('biocare_family')||'[]');
let bookings=JSON.parse(localStorage.getItem('biocare_bookings')||'[]');
let consults=JSON.parse(localStorage.getItem('biocare_consults')||'[]');
let refills=JSON.parse(localStorage.getItem('biocare_refills')||'[]');

if(!bookings.length) bookings=[{id:'B-2041',name:'عميل تجريبي',branch:BRANCHES[0],date:'2026-10-15',time:'18:00',status:'قادم'}];
if(!consults.length) consults=[{id:'C-109',doctor:'د. سليم الاستشاري',date:'2026-10-16',time:'20:00',status:'مؤكد'}];

const RESULTS=[
  {id:'R-1001',title:'نتيجة تجريبية معتمدة',date:'2026-10-01',status:'معتمدة'},
  {id:'R-1002',title:'نتيجة قيد الاعتماد',date:'2026-10-09',status:'قيد الاعتماد'}
];
const PRESCRIPTIONS=[
  {id:'RX-9001',doctor:'د. سليم الاستشاري',date:'2026-10-01',status:'سارية',items:[
    ['دواء تجريبي A','قرص مرة يوميًا','5 أيام'],
    ['دواء تجريبي B','عند الحاجة','3 أيام']
  ]}
];

const app=document.getElementById('app');
const modal=document.getElementById('modal');
const modalBody=document.getElementById('modalBody');

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fmtPrice=v=>Number.isFinite(Number(v))?`${Number(v).toLocaleString('ar-SA')} ر.س`:'السعر عند الطلب';

function save(){
  localStorage.setItem('biocare_session',JSON.stringify(session));
  localStorage.setItem('biocare_family',JSON.stringify(family));
  localStorage.setItem('biocare_bookings',JSON.stringify(bookings));
  localStorage.setItem('biocare_consults',JSON.stringify(consults));
  localStorage.setItem('biocare_refills',JSON.stringify(refills));
  localStorage.setItem('biocare_cart',JSON.stringify(selected));
  updateCartCount();
}
function updateCartCount(){
  const el=document.getElementById('cartCount');
  if(!el) return;
  el.textContent=selected.length;
  el.classList.toggle('hidden',selected.length===0);
}
function openModal(html){modalBody.innerHTML=html;modal.classList.remove('hidden')}
function closeModal(){modal.classList.add('hidden')}

function iconSvg(kind){
 const common='viewBox="0 0 64 64" aria-hidden="true"';
 const m={
  blood:`<svg ${common}><path d="M32 7C25 19 15 30 15 41a17 17 0 0 0 34 0C49 30 39 19 32 7Z" fill="none" stroke="currentColor" stroke-width="4"/></svg>`,
  dna:`<svg ${common}><path d="M18 8c30 16 0 32 28 48M46 8C16 24 46 40 18 56M23 17h18M20 29h24M20 41h24M23 53h18" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  sugar:`<svg ${common}><rect x="15" y="12" width="34" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="28" r="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 28l6-4M23 45h18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  vit:`<svg ${common}><path d="M15 39 39 15a8 8 0 0 1 11 11L26 50a8 8 0 1 1-11-11Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="m25 29 10 10" stroke="currentColor" stroke-width="4"/></svg>`,
  virus:`<svg ${common}><circle cx="32" cy="32" r="13" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 7v9M32 48v9M7 32h9M48 32h9M14 14l7 7M43 43l7 7M50 14l-7 7M21 43l-7 7" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  urine:`<svg ${common}><path d="M18 17h28l-4 38H22l-4-38Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M16 17h32M24 10h16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  liver:`<svg ${common}><path d="M10 30c7-14 27-20 44-9-3 23-13 31-29 31-8 0-13-7-15-22Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M36 20c-2 11 1 21 10 28" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
  kidney:`<svg ${common}><path d="M25 12c-10 2-14 11-13 21 1 10 7 17 14 17 7 0 7-7 7-14V20c0-5-3-9-8-8ZM39 12c10 2 14 11 13 21-1 10-7 17-14 17-7 0-7-7-7-14V20c0-5 3-9 8-8Z" fill="none" stroke="currentColor" stroke-width="4"/></svg>`
 };
 return m[kind]||m.blood;
}

const ART_THEMES=[
 ['#f6eee0','#a36c1c','#fff8ec'],['#eaf3fb','#175e8a','#f4fbff'],['#eef8f1','#176744','#f6fff9'],
 ['#fff0f2','#b62f3a','#fff7f8'],['#f4efff','#6743a7','#fbf9ff'],['#eef8ff','#21749b','#f8fdff']
];
function themeForCategory(cat){
 let h=0; for(const c of String(cat||'')) h=(h*31+c.charCodeAt(0))>>>0;
 return ART_THEMES[h%ART_THEMES.length];
}
function wrapTitle(s,max=20){
 const words=String(s).split(/\s+/); const lines=[]; let cur='';
 for(const w of words){
   if((cur+' '+w).trim().length>max && cur){lines.push(cur);cur=w}else cur=(cur+' '+w).trim();
 }
 if(cur) lines.push(cur);
 return lines.slice(0,3);
}
function packageArtwork(p){
 const [bg,accent,light]=themeForCategory(p.category);
 const lines=wrapTitle(p.name,20);
 const count=typeof p.count==='number'?`${p.count} تحليل`:String(p.count||'');
 const fast=String(p.fasting||'').includes('لا يتطلب')?'لا يتطلب صيام':'يتطلب صيام';
 const tspans=lines.map((t,i)=>`<text x="610" y="${160+i*62}" text-anchor="end" font-size="${i?48:54}" font-weight="800" fill="#132034" direction="rtl">${xml(t)}</text>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
 <defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${light}"/></linearGradient></defs>
 <rect width="1200" height="720" rx="52" fill="url(#g)"/>
 <circle cx="170" cy="360" r="120" fill="${accent}" opacity=".10"/>
 <circle cx="170" cy="360" r="78" fill="none" stroke="${accent}" stroke-width="18"/>
 <path d="M170 245c-27 48-65 90-65 134a65 65 0 0 0 130 0c0-44-38-86-65-134Z" fill="${accent}" opacity=".92"/>
 <rect x="105" y="558" width="258" height="78" rx="24" fill="${accent}"/>
 <text x="234" y="611" text-anchor="middle" font-size="42" font-weight="800" fill="white">${xml(fmtPrice(p.price).replace(' ر.س',''))}</text>
 <text x="370" y="610" font-size="28" fill="${accent}" font-weight="700">ر.س</text>
 ${tspans}
 <text x="610" y="392" text-anchor="end" font-size="35" font-weight="700" fill="${accent}" direction="rtl">${xml(count)}</text>
 <text x="610" y="454" text-anchor="end" font-size="31" fill="#56616f" direction="rtl">${xml(fast)}</text>
 <text x="610" y="520" text-anchor="end" font-size="25" fill="#76808d" direction="rtl">مختبرات بيوكير الطبية</text>
 </svg>`;
 return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}

function categoryGrid(){
 return `<div class="category-grid">${HOME_CATEGORIES.map(c=>`
 <button class="category-card" onclick="goTestsCategory('${esc(c.cat)}')">
   <span class="cat-icon">${iconSvg(c.icon)}</span><strong>${c.label}</strong>
 </button>`).join('')}</div>`;
}
function branches(){
 return `<div class="branch-row">${BRANCHES.map((b,i)=>`<div class="branch-card"><div class="branch-photo"><span>${String(i+1).padStart(2,'0')}</span></div><div class="branch-name">${esc(b)}</div></div>`).join('')}</div>`;
}
function featuredPackages(){
 const names=['الباقة الأساسية','الباقة الذهبية','الباقة الماسية','باقة الأطفال','باقة العناية بالبشرة وتساقط الشعر','باقة صحة الرجل'];
 const list=names.map(n=>PACKAGES.find(p=>p.name===n)).filter(Boolean);
 return `<div class="featured-packages">${list.map(packageCard).join('')}</div>`;
}
function home(){
 return `<section class="hero">
   <div class="hero-visual"><div class="hero-medical-mark">${iconSvg('blood')}</div></div>
   <div class="hero-copy">
     <span class="eyebrow">BIOCARE MEDICAL LABORATORIES</span>
     <h1>صحتك تستحق الاطمئنان</h1>
     <p>استعرض التحاليل والباقات، احجز موعدك، وتابع النتائج والاستشارات من مكان واحد.</p>
     <div class="hero-actions"><button class="primary" onclick="go('tests')">استعرض التحاليل</button><button class="ghost" onclick="go('packages')">استعرض الباقات</button></div>
   </div>
 </section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="go('tests')">عرض الكل ‹</button><h2 class="under">التحاليل</h2></div>${categoryGrid()}</section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="go('packages')">عرض الكل ‹</button><h2>الباقات</h2></div>${featuredPackages()}</section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="showBranches()">عرض الكل ‹</button><h2>فروعنا</h2></div>${branches()}</section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="showConsultations()">عرض الكل ‹</button><h2>الاستشارات الطبية</h2></div><div class="cards">
 <div class="card"><span class="chip">جديد</span><h3>استشارة طبية</h3><p class="muted">احجز موعدًا تجريبيًا مع الطبيب، واطلع على المحادثة والوصفة بعد الاستشارة.</p><button class="secondary" onclick="bookConsultation()">احجز استشارة</button></div>
 <div class="card"><span class="chip">وصفة</span><h3>الوصفات الطبية</h3><p class="muted">عرض وصفات تجريبية وطلب إعادة صرف وصفة.</p><button class="secondary" onclick="showPrescriptions()">عرض الوصفات</button></div></div></section>`;
}

function tests(){
 return `<section class="section">
 <div class="section-head"><h2 class="under">التحاليل</h2><span class="count-badge">${TESTS.length} تحليل</span></div>
 <div class="notice compact">الأسعار الظاهرة هي أسعار بيوكير المعتمدة حيث تتوفر. التحاليل المضافة من قوائم المرجع بدون سعر تظهر «السعر عند الطلب». تضاف ضريبة القيمة المضافة للمقيمين.</div>
 <div class="catalog-tools">
   <input id="testSearch" placeholder="ابحث باسم التحليل بالعربي أو الإنجليزي..." oninput="renderTestsList()">
   <select id="testCategory" onchange="renderTestsList()"><option value="">كل الأقسام</option>${(CATALOG.testCategories||[]).map(c=>`<option>${esc(c)}</option>`).join('')}</select>
 </div>
 <div id="testsList" class="cards catalog-grid"></div>
 </section>`;
}
function testCard(t){
 const priced=Number.isFinite(Number(t.price));
 return `<div class="card test-card">
   <div class="row"><span class="chip">${esc(t.category)}</span>${t.official?'<span class="official-badge">سعر معتمد</span>':''}</div>
   <h3>${esc(t.name)}</h3>${t.en && t.en!==t.name?`<p class="en-name">${esc(t.en)}</p>`:''}
   ${t.note?`<p class="micro-note">${esc(t.note)}</p>`:''}
   <div class="row"><span class="price ${priced?'':'on-request'}">${priced?fmtPrice(t.price):'السعر عند الطلب'}</span><button class="secondary" onclick="addTestByCode('${encodeURIComponent(t.code)}')">إضافة</button></div>
 </div>`;
}
function renderTestsList(){
 const box=document.getElementById('testsList'); if(!box) return;
 const q=(document.getElementById('testSearch')?.value||'').trim().toLowerCase();
 const cat=document.getElementById('testCategory')?.value||'';
 const filtered=TESTS.filter(t=>(!cat||t.category===cat)&&(!q||(`${t.name} ${t.en} ${t.code}`).toLowerCase().includes(q)));
 const max=q||cat?300:100;
 box.innerHTML=filtered.slice(0,max).map(testCard).join('') || `<div class="empty">لا توجد نتائج مطابقة.</div>`;
 if(filtered.length>max) box.insertAdjacentHTML('beforeend',`<div class="card more-card">تم عرض أول ${max} نتيجة من ${filtered.length}. استخدم البحث لتضييق النتائج.</div>`);
}
window.goTestsCategory=cat=>{view='tests';render();setTimeout(()=>{const s=document.getElementById('testCategory');if(s){s.value=cat;renderTestsList()}},0);window.scrollTo({top:0,behavior:'smooth'})}

function packageCard(p){
 return `<article class="package-card">
   <button class="package-image-btn" onclick="showPackage('${p.id}')"><img class="package-art" loading="lazy" src="${packageArtwork(p)}" alt="${esc(p.name)}"></button>
   <div class="package-card-body">
     <span class="chip">${esc(p.category)}</span>
     <h3>${esc(p.name)}</h3>
     <div class="package-meta"><span>${typeof p.count==='number'?`${p.count} تحليل`:esc(p.count)}</span><span>${String(p.fasting).includes('لا يتطلب')?'لا يتطلب صيام':'يتطلب صيام'}</span></div>
     <div class="row"><span class="price">${fmtPrice(p.price)}</span><button class="secondary" onclick="showPackage('${p.id}')">التفاصيل</button></div>
   </div>
 </article>`;
}
function packagesView(){
 return `<section class="section">
 <div class="section-head"><h2 class="under">الباقات والعروض</h2><span class="count-badge">${PACKAGES.length} باقة</span></div>
 <div class="notice compact">كل باقة لها صورة تصميم داخل التطبيق، وتعرض السعر وعدد التحاليل ومتطلبات الصيام. تضاف ضريبة القيمة المضافة للمقيمين.</div>
 <div class="catalog-tools">
   <input id="packageSearch" placeholder="ابحث عن باقة..." oninput="renderPackageList()">
   <select id="packageCategory" onchange="renderPackageList()"><option value="">كل الفئات</option>${(CATALOG.packageCategories||[]).map(c=>`<option>${esc(c)}</option>`).join('')}</select>
 </div>
 <div id="packagesList" class="package-grid"></div>
 </section>`;
}
function renderPackageList(){
 const box=document.getElementById('packagesList'); if(!box) return;
 const q=(document.getElementById('packageSearch')?.value||'').trim().toLowerCase();
 const cat=document.getElementById('packageCategory')?.value||'';
 const filtered=PACKAGES.filter(p=>(!cat||p.category===cat)&&(!q||(`${p.name} ${p.category} ${p.description||''}`).toLowerCase().includes(q)));
 box.innerHTML=filtered.map(packageCard).join('') || `<div class="empty">لا توجد باقات مطابقة.</div>`;
}
window.showPackage=id=>{
 const p=PACKAGES.find(x=>x.id===id); if(!p) return;
 const comps=p.components||[];
 openModal(`<div class="package-detail">
   <img class="package-detail-art" src="${packageArtwork(p)}" alt="${esc(p.name)}">
   <div class="detail-head"><div><span class="chip">${esc(p.category)}</span><h2>${esc(p.name)}</h2></div><span class="detail-price">${fmtPrice(p.price)}</span></div>
   ${p.description?`<p class="muted">${esc(p.description)}</p>`:''}
   <div class="detail-facts"><div><b>${typeof p.count==='number'?p.count:esc(p.count)}</b><span>عدد التحاليل/الأنواع</span></div><div><b>${esc(p.fasting)}</b><span>الصيام</span></div></div>
   <div class="vat-line">تضاف ضريبة القيمة المضافة للمقيمين.</div>
   <h3>مكونات الباقة</h3>
   ${comps.length?`<div class="component-list">${comps.map((c,i)=>`<div><span>${i+1}</span><bdi>${esc(c)}</bdi></div>`).join('')}</div>`:`<div class="notice compact">${esc(p.componentNote||'مكونات الباقة التفصيلية غير متاحة في المرجع الحالي.')}</div>`}
   <div class="detail-actions"><button class="primary" onclick="addPackageById('${p.id}')">أضف للحجز</button><button class="ghost" onclick="closeModal()">إغلاق</button></div>
 </div>`);
}

function booking(){
 const priced=selected.filter(x=>Number.isFinite(Number(x.price)));
 const total=priced.reduce((s,x)=>s+Number(x.price),0);
 const pending=selected.length-priced.length;
 return `<section class="section"><div class="section-head"><h2 class="under">الحجز والسلة</h2><span class="count-badge">${selected.length} عنصر</span></div>
 <div class="notice">هذه النسخة الحالية واجهة تجريبية. لا تدخل بيانات مرضى حقيقية حتى يتم تفعيل الـBackend الآمن وربط أنظمة المختبر.</div>
 <div class="card"><h3>اختياراتك</h3>
 ${selected.length?`<div class="cart-list">${selected.map((x,i)=>`<div class="cart-row"><div><strong>${esc(x.name)}</strong><div class="muted">${x.type==='package'?'باقة':'تحليل'} — ${Number.isFinite(Number(x.price))?fmtPrice(x.price):'السعر عند الطلب'}</div></div><button onclick="removeCart(${i})" class="remove-btn">حذف</button></div>`).join('')}</div>`:'<p class="muted">لم تتم إضافة تحاليل أو باقات بعد.</p>'}
 <div class="cart-total"><span>الإجمالي المعروف</span><strong>${fmtPrice(total)}</strong></div>
 ${pending?`<p class="micro-note">يوجد ${pending} تحليل/عنصر يحتاج تأكيد السعر من المختبر قبل الدفع.</p>`:''}
 <p class="micro-note">تضاف ضريبة القيمة المضافة للمقيمين.</p>
 <form id="bookingForm"><label>لمن الحجز؟</label><select name="name"><option>${session?esc(session.name):'عميل تجريبي'}</option>${family.map(f=>`<option>${esc(f.name)}</option>`).join('')}</select>
 <label>الفرع</label><select name="branch">${BRANCHES.map(b=>`<option>${esc(b)}</option>`).join('')}</select>
 <label>التاريخ</label><input type="date" name="date" required>
 <label>الوقت</label><select name="time"><option>09:00</option><option>12:00</option><option>16:00</option><option>19:00</option><option>21:00</option></select><br>
 <button class="primary">تسجيل حجز تجريبي</button></form><div id="bookDone"></div></div>
 <div style="margin-top:13px"><button class="ghost" onclick="showAppointments()">مواعيدي وإعادة الجدولة</button></div></section>`;
}
function results(){
 return `<section class="section"><div class="section-head"><h2 class="under">النتائج</h2></div><div class="notice">لا توجد نتائج مرضى حقيقية في هذه النسخة.</div><div class="list">${RESULTS.map(r=>`<div class="card"><div class="row"><div><h3>${r.title}</h3><div class="muted">${r.date}</div></div><span class="chip">${r.status}</span></div><button class="secondary" onclick="openResult('${r.id}')">عرض التقرير</button></div>`).join('')}</div></section>`;
}
function profile(){
 return `<section class="section"><div class="section-head"><h2 class="under">حسابي</h2></div>${session?`<div class="card"><h3>${esc(session.name)}</h3><p class="muted">${esc(session.phone||'')}</p><div class="button-wrap"><button class="ghost" onclick="showFamily()">أفراد العائلة</button><button class="ghost" onclick="showAppointments()">مواعيدي</button><button class="ghost" onclick="showConsultations()">استشاراتي</button></div></div>`:`<div class="card"><h3>تسجيل الدخول التجريبي</h3><p class="muted">رمز التحقق التجريبي: 1234</p><button class="primary" onclick="openLogin()">تسجيل الدخول</button></div>`}</section>`;
}
function render(){
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 if(view==='home') app.innerHTML=home();
 if(view==='tests'){app.innerHTML=tests();renderTestsList()}
 if(view==='packages'){app.innerHTML=packagesView();renderPackageList()}
 if(view==='booking'){
   app.innerHTML=booking();
   const form=document.getElementById('bookingForm');
   if(form) form.onsubmit=e=>{
     e.preventDefault(); const f=Object.fromEntries(new FormData(e.target));
     bookings.unshift({id:'B-'+Date.now().toString().slice(-5),...f,status:'قادم',items:selected.map(x=>x.name)});
     selected=[];save();
     document.getElementById('bookDone').innerHTML='<div class="success" style="margin-top:12px">تم حفظ الحجز على هذا الجهاز فقط — ليس حجزًا مؤكدًا.</div>';
     e.target.reset(); setTimeout(render,400);
   };
 }
 if(view==='results') app.innerHTML=results();
 if(view==='profile') app.innerHTML=profile();
 updateCartCount();
}
window.go=v=>{view=v;render();window.scrollTo({top:0,behavior:'smooth'})}
window.addTestByCode=encoded=>{
 const code=decodeURIComponent(encoded); const t=TESTS.find(x=>x.code===code); if(!t)return;
 selected.push({type:'test',id:t.code,name:t.name,price:t.price});save();toast('تمت إضافة التحليل إلى السلة');
}
window.addPackageById=id=>{
 const p=PACKAGES.find(x=>x.id===id); if(!p)return;
 selected.push({type:'package',id:p.id,name:p.name,price:p.price});save();closeModal();toast('تمت إضافة الباقة إلى السلة');
}
window.removeCart=i=>{selected.splice(i,1);save();render()}
function toast(msg){
 let t=document.getElementById('appToast'); if(t)t.remove();
 t=document.createElement('div');t.id='appToast';t.className='app-toast';t.textContent=msg;document.body.appendChild(t);
 requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),250)},1600);
}
window.showBranches=()=>openModal(`<h2>فروعنا</h2>${branches()}<p class="micro-note">ساعات العمل: السبت–الخميس 8 صباحًا–12 منتصف الليل، الجمعة 4 مساءً–12 منتصف الليل. فرع الداير يغلق 11 مساءً.</p>`);
window.openLogin=()=>openModal(`<h2>تسجيل الدخول التجريبي</h2><div class="notice">استخدم الرمز 1234. لا تدخل بيانات حقيقية.</div><form id="loginForm"><label>الاسم</label><input name="name" required><label>الجوال</label><input name="phone" inputmode="numeric"><label>رمز التحقق</label><input name="otp" inputmode="numeric" required></form><br><button class="primary" onclick="submitLogin()">دخول</button>`);
window.submitLogin=()=>{const f=Object.fromEntries(new FormData(document.getElementById('loginForm')));if(f.otp!=='1234'){alert('الرمز التجريبي 1234');return}session={name:f.name,phone:f.phone};save();closeModal();go('profile')}
window.showFamily=()=>openModal(`<h2>أفراد العائلة</h2><div class="list">${family.map((f,i)=>`<div class="card row"><div><strong>${esc(f.name)}</strong><div class="muted">${esc(f.relation)}</div></div><button class="ghost" onclick="removeFamily(${i})">حذف</button></div>`).join('')||'<p class="muted">لا يوجد أفراد مضافون</p>'}</div><label>الاسم التجريبي</label><input id="famName"><label>صلة القرابة</label><input id="famRel"><br><button class="secondary" onclick="addFamily()">إضافة فرد</button>`)
window.addFamily=()=>{const n=document.getElementById('famName').value.trim(),r=document.getElementById('famRel').value.trim();if(!n)return;family.push({name:n,relation:r});save();showFamily()}
window.removeFamily=i=>{family.splice(i,1);save();showFamily()}
window.showAppointments=()=>openModal(`<h2>مواعيدي</h2><div class="list">${bookings.map((b,i)=>`<div class="card"><div class="row"><div><strong>${esc(b.branch)}</strong><div class="muted">${esc(b.date)} — ${esc(b.time)}</div></div><span class="chip">${esc(b.status)}</span></div>${b.status==='قادم'?`<div class="button-wrap"><button class="ghost" onclick="reschedule(${i})">إعادة الجدولة</button><button class="ghost" onclick="cancelBooking(${i})">إلغاء</button></div>`:''}</div>`).join('')}</div>`)
window.reschedule=i=>openModal(`<h2>إعادة الجدولة</h2><label>التاريخ الجديد</label><input type="date" id="newDate"><label>الوقت</label><select id="newTime"><option>09:00</option><option>12:00</option><option>16:00</option><option>19:00</option></select><br><button class="secondary" onclick="saveReschedule(${i})">حفظ</button>`)
window.saveReschedule=i=>{const d=document.getElementById('newDate').value;if(!d)return;bookings[i].date=d;bookings[i].time=document.getElementById('newTime').value;save();showAppointments()}
window.cancelBooking=i=>{bookings[i].status='ملغي';save();showAppointments()}
window.openResult=id=>openModal(`<h2>تقرير نتيجة تجريبي</h2><div class="rx"><div class="rx-head"><div><div class="rx-title">${esc(id)}</div><div class="muted">تقرير عرض فقط وغير صالح للاستخدام الطبي.</div></div><span class="chip">تجريبي</span></div><table class="result-table"><tr><td>CBC</td><td>ضمن المجال المرجعي</td></tr><tr><td>TSH</td><td>2.4</td></tr></table><br><button class="secondary" onclick="window.print()">طباعة / حفظ PDF</button></div>`)
window.showConsultations=()=>openModal(`<h2>الاستشارات الطبية</h2><div class="notice">وظائف تجريبية فقط وليست خدمة طبية فعلية.</div><div class="list">${consults.map(c=>`<div class="card"><div class="row"><div><strong>${esc(c.doctor)}</strong><div class="muted">${esc(c.date)} — ${esc(c.time)}</div></div><span class="chip">${esc(c.status)}</span></div><div class="button-wrap"><button class="ghost" onclick="openChat()">فتح المحادثة</button><button class="ghost" onclick="showPrescriptions()">الوصفات</button></div></div>`).join('')}</div><br><button class="primary" onclick="bookConsultation()">حجز استشارة جديدة</button>`)
window.bookConsultation=()=>openModal(`<h2>حجز استشارة طبية</h2><div class="notice">الحجز تجريبي، ولا يتم إرساله إلى طبيب حقيقي.</div><label>الطبيب</label><select id="consultDoctor"><option>د. سليم الاستشاري</option><option>طبيب عام تجريبي</option></select><label>التاريخ</label><input id="consultDate" type="date"><label>الوقت</label><select id="consultTime"><option>18:00</option><option>20:00</option><option>22:00</option></select><br><button class="primary" onclick="saveConsultation()">حفظ الموعد التجريبي</button>`)
window.saveConsultation=()=>{const d=document.getElementById('consultDate').value;if(!d)return;consults.unshift({id:'C-'+Date.now().toString().slice(-5),doctor:document.getElementById('consultDoctor').value,date:d,time:document.getElementById('consultTime').value,status:'مؤكد'});save();showConsultations()}
window.openChat=()=>openModal(`<h2>محادثتي</h2><div class="notice">محادثة تجريبية غير مرتبطة بطبيب حقيقي.</div><div class="chat-bubble doctor"><strong>الطبيب:</strong><br>أهلًا، كيف يمكنني مساعدتك اليوم؟</div><div class="chat-bubble">هذه رسالة تجريبية من العميل.</div><label>رسالة جديدة</label><textarea rows="3" placeholder="اكتب رسالة تجريبية..."></textarea><br><button class="secondary" onclick="alert('تم الإرسال محليًا للتجربة فقط')">إرسال</button>`)
window.showPrescriptions=()=>openModal(`<h2>الوصفات الطبية</h2><div class="notice">الوصفات المعروضة تجريبية وغير صالحة للصرف.</div><div class="list">${PRESCRIPTIONS.map(rx=>`<div class="rx"><div class="rx-head"><div><div class="rx-title">وصفة ${rx.id}</div><div class="muted">${rx.doctor} — ${rx.date}</div></div><span class="chip">${rx.status}</span></div>${rx.items.map(x=>`<p><strong>${esc(x[0])}</strong><br><span class="muted">${esc(x[1])} — ${esc(x[2])}</span></p>`).join('')}<div class="row"><button class="ghost" onclick="window.print()">حفظ PDF</button><button class="secondary" onclick="requestRefill('${rx.id}')">طلب إعادة صرف</button></div></div>`).join('')}</div>`)
window.requestRefill=id=>{refills.unshift({id:'RF-'+Date.now().toString().slice(-5),rx:id,date:new Date().toISOString().slice(0,10),status:'قيد المراجعة'});save();openModal(`<h2>إعادة صرف وصفة</h2><div class="success">تم إنشاء طلب تجريبي للوصفة ${esc(id)}. الحالة: قيد المراجعة.</div>`)}
window.showRefills=()=>openModal(`<h2>طلبات إعادة صرف الوصفة</h2><div class="list">${refills.map(r=>`<div class="card"><strong>${esc(r.rx)}</strong><div class="muted">${esc(r.date)}</div><span class="chip">${esc(r.status)}</span></div>`).join('')||'<p class="muted">لا توجد طلبات</p>'}</div>`)
window.showOffers=()=>{view='packages';render();setTimeout(()=>{const s=document.getElementById('packageSearch');if(s)s.focus()},0);closeDrawer()}
window.showNotifications=()=>openModal(`<h2>الإشعارات</h2><div class="card"><strong>مرحبًا بك في بيوكير</strong><p class="muted">هذه إشعارات تجريبية داخل التطبيق.</p></div>`)
window.showSupport=()=>openModal(`<h2>المساعدة والخصوصية</h2><div class="card"><h3>الدعم والتواصل</h3><p class="muted">الاستشارات عبر واتساب متاحة للرد خلال 24–72 ساعة. سياسة الخصوصية والتواصل الفعلي تفعّل عند إطلاق النسخة الإنتاجية.</p></div>`)
window.showAbout=()=>openModal(`<h2>حول التطبيق</h2><p class="muted">Biocare Medical Laboratories — واجهة PWA تجريبية لمختبرات بيوكير الطبية.</p>`)
window.showTestimonials=()=>openModal(`<h2>شهادات العملاء</h2><div class="card"><strong>★★★★★</strong><p class="muted">شهادة تجريبية لأغراض تصميم الواجهة فقط.</p></div>`)
window.showJobs=()=>openModal(`<h2>وظائف</h2><p class="muted">سيتم عرض الوظائف المتاحة هنا عند ربط لوحة الإدارة.</p>`)
window.showBlogs=()=>openModal(`<h2>المدونات</h2><div class="card"><h3>كيف تستعد للتحليل؟</h3><p class="muted">مقال تجريبي قصير.</p></div>`)
window.logout=()=>{session=null;save();closeDrawer();go('home')}
window.setLanguage=()=>openModal(`<h2>اللغة</h2><div class="card"><strong>العربية</strong><p class="muted">اللغة الافتراضية الحالية.</p></div><div class="card"><strong>English</strong><p class="muted">قيد التجهيز للنسخة الإنتاجية.</p></div>`)
window.appPreferences=()=>openModal(`<h2>تفضيل التطبيق</h2><p class="muted">إعدادات الإشعارات والمظهر وحجم الخط ستظهر هنا.</p>`)

const menuGroups=[
['الاستشارات',[
['consult','الاستشارات الطبية','showConsultations()'],['chat','محادثاتي','openChat()'],['calendar','مواعيد الاستشارات','showConsultations()'],['file','الوصفات الطبية','showPrescriptions()'],['refresh','إعادة صرف وصفة','showRefills()']]],
['الخدمات',[
['box','الباقات',"closeDrawer();go('packages')"],['gift','العروض','showOffers()'],['folder','أقسام التحاليل',"closeDrawer();go('tests')"],['calendar','الحجز',"closeDrawer();go('booking')"],['file','النتائج',"closeDrawer();go('results')"],['user','حسابي',"closeDrawer();go('profile')"],['bell','الإشعارات','showNotifications()'],['settings','تفضيل التطبيق','appPreferences()'],['lang','اللغة','setLanguage()']]],
['المساعدة والخصوصية',[
['shield','المساعدة والخصوصية','showSupport()'],['info','حول التطبيق','showAbout()'],['like','شهادات العملاء','showTestimonials()'],['briefcase','وظائف','showJobs()'],['folder','المدونات','showBlogs()']]],
['', [['logout','تسجيل خروج','logout()','danger']]]
];
function menuIcon(kind){
 const icons={consult:'◌',chat:'◯',calendar:'□',file:'▤',refresh:'↻',box:'▱',gift:'◇',folder:'▭',user:'○',bell:'♧',settings:'⚙',lang:'Aa',shield:'♢',info:'i',like:'✓',briefcase:'▣',logout:'↪'};
 return icons[kind]||'•';
}
function buildMenu(){document.getElementById('drawerMenu').innerHTML=menuGroups.map(g=>`<div class="drawer-group">${g[0]?`<div class="drawer-title">${g[0]}</div>`:''}${g[1].map(x=>`<button class="drawer-item ${x[3]||''}" onclick="${x[2]}"><span class="drawer-icon">${menuIcon(x[0])}</span><span>${x[1]}</span><span class="drawer-arrow">‹</span></button>`).join('')}</div>`).join('')}
function openDrawer(){document.getElementById('drawer').classList.add('open');document.getElementById('drawerBackdrop').classList.remove('hidden');document.getElementById('drawer').setAttribute('aria-hidden','false')}
window.closeDrawer=()=>{document.getElementById('drawer').classList.remove('open');document.getElementById('drawerBackdrop').classList.add('hidden');document.getElementById('drawer').setAttribute('aria-hidden','true')}

document.getElementById('menuBtn').onclick=openDrawer;
document.getElementById('drawerClose').onclick=closeDrawer;
document.getElementById('drawerBackdrop').onclick=closeDrawer;
document.getElementById('modalClose').onclick=closeModal;
modal.onclick=e=>{if(e.target===modal)closeModal()}
document.getElementById('notifyBtn').onclick=showNotifications;
document.getElementById('cartBtn').onclick=()=>go('booking');
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>go(b.dataset.view));

buildMenu();render();save();
setTimeout(()=>document.getElementById('splash')?.classList.add('hide'),650);
setTimeout(()=>document.getElementById('splash')?.remove(),1050);
