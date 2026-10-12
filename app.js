
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

// إزالة بيانات الاختبار المحلية القديمة مرة واحدة عند الانتقال للنسخة الإنتاجية الآمنة.
if(localStorage.getItem('biocare_prod_cleanup_v7')!=='1'){
  ['biocare_session','biocare_family','biocare_bookings','biocare_consults','biocare_refills'].forEach(k=>localStorage.removeItem(k));
  localStorage.setItem('biocare_prod_cleanup_v7','1');
}
let session=null;
let family=[];
let bookings=[];
let consults=[];
let refills=[];

const app=document.getElementById('app');
const modal=document.getElementById('modal');
const modalBody=document.getElementById('modalBody');

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fmtPrice=v=>Number.isFinite(Number(v))?`${Number(v).toLocaleString('ar-SA')} ر.س`:'السعر عند الطلب';
const displayPackageCategory=c=>/^(profile|profiles)$/i.test(String(c||'').trim())?'باقات الفحوصات':String(c||'');
const WHATSAPP_NUMBER='966567669779';
const openWhatsApp=message=>window.open('https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(message),'_blank','noopener');
window.openInstantChat=()=>openWhatsApp('السلام عليكم، أرغب في التحدث مع خدمة عملاء مختبرات بيوكير الطبية.');


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
  kidney:`<svg ${common}><path d="M25 12c-10 2-14 11-13 21 1 10 7 17 14 17 7 0 7-7 7-14V20c0-5-3-9-8-8ZM39 12c10 2 14 11 13 21-1 10-7 17-14 17-7 0-7-7-7-14V20c0-5 3-9 8-8Z" fill="none" stroke="currentColor" stroke-width="4"/></svg>`,
  stomach:`<svg ${common}><path d="M26 9v18c0 4-2 7-6 10-5 4-6 12-2 17 4 6 14 5 20 1 9-6 12-18 5-26-4-5-9-7-17-7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  heart:`<svg ${common}><path d="M32 54 12 35C2 24 9 10 21 10c5 0 9 2 11 7 2-5 6-7 11-7 12 0 19 14 9 25L32 54Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>`,
  brain:`<svg ${common}><path d="M24 13c-8 0-12 6-10 12-6 3-7 12-1 16-1 7 6 12 12 9 3 5 11 5 14 0 7 3 14-3 12-10 6-4 5-13-1-16 2-7-3-13-10-12-3-5-12-5-16 1Z" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M32 15v34M22 24c5 0 7 3 7 7M42 25c-5 0-7 3-7 7M23 40c5 0 7-3 7-7M41 41c-5 0-7-3-7-7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  thyroid:`<svg ${common}><path d="M19 18c8 0 11 6 13 12 2-6 5-12 13-12 5 0 8 5 7 10-2 8-9 11-14 11H26c-5 0-12-3-14-11-1-5 2-10 7-10Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 30v21" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  child:`<svg ${common}><circle cx="32" cy="22" r="10" fill="none" stroke="currentColor" stroke-width="4"/><path d="M16 54c2-12 9-18 16-18s14 6 16 18M22 16c2-6 6-9 10-9 5 0 8 3 10 8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  hair:`<svg ${common}><path d="M13 49c2-18 8-34 19-39 11 5 17 21 19 39M20 50c2-14 6-26 12-32M32 18c6 6 10 18 12 32M26 50c1-10 3-20 6-27M38 50c-1-10-3-20-6-27" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  fertility:`<svg ${common}><circle cx="24" cy="25" r="10" fill="none" stroke="currentColor" stroke-width="4"/><path d="M31 32 48 49M40 49h8v-8M40 16h12M46 10v12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  muscle:`<svg ${common}><path d="M18 46c8 8 25 7 32-3 5-8 1-18-8-19-3 8-8 11-14 9l-4-8-8 8c-4 4-4 9 2 13Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>`,
  bone:`<svg ${common}><path d="M18 20a7 7 0 1 1 10-10l18 18a7 7 0 1 1 8 8 7 7 0 1 1-10 10L26 28a7 7 0 1 1-8-8Z" fill="none" stroke="currentColor" stroke-width="4"/></svg>`
 };
 return m[kind]||m.blood;
}


function packageIconKind(p){
 const n=`${p?.name||''} ${p?.category||''}`;
 if(/معدة|هضم|جرثومة/.test(n)) return 'stomach';
 if(/سكري|سكر|تنحيف|سمنة|وزن/.test(n)) return 'sugar';
 if(/قلب|دهون|كوليسترول|ضغط/.test(n)) return 'heart';
 if(/ذاكرة|تركيز|أرق|اكتئاب|أعصاب/.test(n)) return 'brain';
 if(/درقية|غدة/.test(n)) return 'thyroid';
 if(/أطفال|طفل|بلوغ/.test(n)) return 'child';
 if(/شعر|بشرة|روكتان/.test(n)) return 'hair';
 if(/خصوبة|حمل|مبايض|رجال|رجل|بروستاتا/.test(n)) return 'fertility';
 if(/كبد/.test(n)) return 'liver';
 if(/كلى|كلية/.test(n)) return 'kidney';
 if(/عضلات|لياقة/.test(n)) return 'muscle';
 if(/عظام|مفاصل/.test(n)) return 'bone';
 if(/فيتامين|معادن|حديد|أنيميا|فقر الدم/.test(n)) return 'vit';
 if(/فيروس|عدوى|معدية/.test(n)) return 'virus';
 return 'blood';
}
function packageIcon(p){return iconSvg(packageIconKind(p))}
let packageQuickFilter='all';
window.setPackageFilter=f=>{packageQuickFilter=f;document.querySelectorAll('.quick-filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===f));renderPackageList()}

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
     <p>استعرض التحاليل والباقات والأسعار، وتعرّف على فروع مختبرات بيوكير الطبية وخدماتها.</p>
     <div class="hero-actions"><button class="primary" onclick="go('tests')">استعرض التحاليل</button><button class="ghost" onclick="go('packages')">استعرض الباقات</button></div>
   </div>
 </section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="go('tests')">عرض الكل ‹</button><h2 class="under">التحاليل</h2></div>${categoryGrid()}</section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="go('packages')">عرض الكل ‹</button><h2>الباقات</h2></div>${featuredPackages()}</section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="showBranches()">عرض الكل ‹</button><h2>فروعنا</h2></div>${branches()}</section>
 <section class="section"><div class="section-head"><button class="viewall" onclick="showConsultations()">تواصل ‹</button><h2>الاستشارات الطبية</h2></div><div class="cards">
 <div class="card"><span class="chip">واتساب</span><h3>استشارة طبية</h3><p class="muted">يمكن التواصل لطلب الاستشارة، ويتم الرد عادة خلال 24–72 ساعة.</p><button class="secondary" onclick="showConsultations()">تواصل للاستشارة</button></div>
 </div></section>`;
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
 const [bg,accent]=themeForCategory(p.category);
 const fast=String(p.fasting||'').includes('لا يتطلب');
 return `<article class="package-card compact-package" style="--pack-bg:${bg};--pack-accent:${accent}">
   <button class="package-icon-wrap" onclick="showPackage('${p.id}')" aria-label="${esc(p.name)}">${packageIcon(p)}</button>
   <div class="package-card-body">
     <span class="chip">${esc(displayPackageCategory(p.category))}</span>
     <h3>${esc(p.name)}</h3>
     <div class="package-meta"><span>${typeof p.count==='number'?`${p.count} تحليل`:esc(p.count)}</span><span>${fast?'لا يتطلب صيام':'يتطلب صيام'}</span></div>
     <div class="package-footer"><span class="package-price">${fmtPrice(p.price)}</span><button class="package-details-btn" onclick="showPackage('${p.id}')">عرض التفاصيل <span>‹</span></button></div>
   </div>
 </article>`;
}
function packagesView(){
 return `<section class="section packages-section">
 <div class="section-head"><h2 class="under">الباقات</h2><span class="count-badge">${PACKAGES.length} باقة</span></div>
 <div class="catalog-tools package-search-tools">
   <input id="packageSearch" placeholder="ابحث عن الباقات أو التحاليل..." oninput="renderPackageList()">
   <select id="packageCategory" onchange="renderPackageList()"><option value="">كل الفئات</option>${(CATALOG.packageCategories||[]).map(c=>`<option value="${esc(c)}">${esc(displayPackageCategory(c))}</option>`).join('')}</select>
 </div>
 <div class="quick-filters" role="group" aria-label="تصفية سريعة">
   <button class="quick-filter active" data-filter="all" onclick="setPackageFilter('all')">الكل</button>
   <button class="quick-filter" data-filter="popular" onclick="setPackageFilter('popular')">الأكثر مبيعًا</button>
   <button class="quick-filter" data-filter="nofast" onclick="setPackageFilter('nofast')">لا يتطلب صيام</button>
   <button class="quick-filter" data-filter="fast" onclick="setPackageFilter('fast')">يتطلب صيام</button>
 </div>
 <div id="packagesList" class="package-grid compact-package-grid"></div>
 </section>`;
}
function renderPackageList(){
 const box=document.getElementById('packagesList'); if(!box) return;
 const q=(document.getElementById('packageSearch')?.value||'').trim().toLowerCase();
 const cat=document.getElementById('packageCategory')?.value||'';
 const filtered=PACKAGES.filter(p=>{
   const fast=String(p.fasting||'').includes('لا يتطلب');
   const quick=packageQuickFilter==='all'||(packageQuickFilter==='nofast'&&fast)||(packageQuickFilter==='fast'&&!fast)||(packageQuickFilter==='popular'&&/الأكثر مبيع|الاكثر مبيع/.test(p.name));
   const query=(`${p.name} ${p.category} ${p.description||''} ${(p.components||[]).join(' ')}`).toLowerCase();
   return quick&&(!cat||p.category===cat)&&(!q||query.includes(q));
 });
 box.innerHTML=filtered.map(packageCard).join('') || `<div class="empty">لا توجد باقات مطابقة.</div>`;
}
window.showPackage=id=>{
 const p=PACKAGES.find(x=>x.id===id); if(!p) return;
 const comps=p.components||[];
 openModal(`<div class="package-detail">
   <div class="package-detail-visual" style="--pack-bg:${themeForCategory(p.category)[0]};--pack-accent:${themeForCategory(p.category)[1]}"><span class="detail-package-icon">${packageIcon(p)}</span><div><span class="chip">${esc(displayPackageCategory(p.category))}</span><h2>${esc(p.name)}</h2></div></div>
   <div class="detail-head"><span class="detail-price">${fmtPrice(p.price)}</span></div>
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
 const total=priced.reduce((sum,x)=>sum+Number(x.price),0);
 const pending=selected.length-priced.length;
 return `<section class="section"><div class="section-head"><h2 class="under">السلة</h2><span class="count-badge">${selected.length} عنصر</span></div>
 <div class="card"><h3>اختياراتك</h3>
 ${selected.length?`<div class="cart-list">${selected.map((x,i)=>`<div class="cart-row"><div><strong>${esc(x.name)}</strong><div class="muted">${x.type==='package'?'باقة':'تحليل'} — ${Number.isFinite(Number(x.price))?fmtPrice(x.price):'السعر عند الطلب'}</div></div><button onclick="removeCart(${i})" class="remove-btn">حذف</button></div>`).join('')}</div>`:'<p class="muted">لم تتم إضافة تحاليل أو باقات بعد.</p>'}
 <div class="cart-total"><span>الإجمالي المعروف</span><strong>${fmtPrice(total)}</strong></div>
 ${pending?`<p class="micro-note">يوجد ${pending} تحليل/عنصر يحتاج تأكيد السعر من المختبر.</p>`:''}
 <p class="micro-note">تضاف ضريبة القيمة المضافة للمقيمين.</p>
 ${selected.length?'<button class="primary" onclick="sendCartWhatsApp()">إرسال الاختيارات عبر واتساب</button>':''}
 </div></section>`;
}
function results(){
 return `<section class="section"><div class="section-head"><h2 class="under">النتائج</h2></div>
 <div class="card"><h3>النتائج الإلكترونية</h3><p class="muted">سيتم تفعيل الدخول الآمن للنتائج بعد اكتمال الربط مع نظام المختبر. لا يتم عرض أي نتائج تجريبية في النسخة الحالية.</p></div></section>`;
}
function profile(){
  if(!authUser) return `<section class="section"><div class="section-head"><h2 class="under">حسابي</h2></div><div class="card"><h3>حساب العميل</h3><p class="muted">سجّل الدخول بالبريد الإلكتروني للوصول إلى حسابك.</p><button class="primary" onclick="openLogin()">تسجيل الدخول / إنشاء حساب</button></div></section>`;
  return `<section class="section"><div class="section-head"><h2 class="under">حسابي</h2></div><div class="card"><h3>مرحبًا بك</h3><p class="muted">البريد الإلكتروني: ${esc(authUser.email||'')}</p><p class="micro-note">النتائج والمواعيد وأفراد العائلة غير متاحة حتى اكتمال الربط الآمن مع أنظمة المختبر.</p><button class="secondary" onclick="logout()">تسجيل الخروج</button></div></section>`;
}

function render(){
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 if(view==='home') app.innerHTML=home();
 if(view==='tests'){app.innerHTML=tests();renderTestsList()}
 if(view==='packages'){app.innerHTML=packagesView();renderPackageList()}
 if(view==='booking') app.innerHTML=booking();
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
window.sendCartWhatsApp=()=>{
 const lines=selected.map((x,i)=>`${i+1}. ${x.name}${Number.isFinite(Number(x.price))?' - '+fmtPrice(x.price):' - السعر عند الطلب'}`);
 const msg=['السلام عليكم، أرغب بالاستفسار عن التحاليل/الباقات التالية:',...lines,'','يرجى تأكيد السعر والمتطلبات قبل الزيارة.'].join('\n');
 openWhatsApp(msg);
};
// تسجيل الدخول فقط عبر Supabase Auth؛ لا تُخزّن كلمات المرور في localStorage.
const SUPABASE_URL='https://jlibhpavbqfeegsehekm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_XVOmCPOiqdUlG-pOPhrQ0g_rIV0R6tK';
let supabaseClient=null;
let authUser=null;
let authInitPromise=null;
function authMessage(message,isError=false){
  const el=document.getElementById('authMessage');
  if(el){el.textContent=message;el.style.color=isError?'#b42318':'#176744'}
}
function authErrorMessage(error){
  const m=String(error?.message||'تعذر إكمال العملية. حاول مجددًا.');
  if(/invalid login credentials/i.test(m)) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if(/email not confirmed/i.test(m)) return 'يرجى تأكيد البريد الإلكتروني من الرسالة المرسلة إليك.';
  if(/user already registered/i.test(m)) return 'هذا البريد مسجّل مسبقًا. اختر تسجيل الدخول.';
  if(/password should be at least/i.test(m)) return 'كلمة المرور قصيرة جدًا. استخدم 8 أحرف على الأقل.';
  if(/rate limit|too many requests/i.test(m)) return 'طلبات كثيرة خلال وقت قصير. حاول لاحقًا.';
  return m;
}
async function initAuth(){
  if(authInitPromise) return authInitPromise;
  authInitPromise=(async()=>{
    const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');
    supabaseClient=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data,error}=await supabaseClient.auth.getUser();
    if(!error) authUser=data.user||null;
    supabaseClient.auth.onAuthStateChange((_event,currentSession)=>{
      authUser=currentSession?.user||null;
      if(view==='profile')render();
    });
    if(view==='profile')render();
    return supabaseClient;
  })().catch(error=>{authInitPromise=null;throw error});
  return authInitPromise;
}
window.openLogin=()=>{
  closeDrawer();
  openModal(`<h2>حساب العميل</h2><p class="muted">تسجيل الدخول أو إنشاء حساب مجاني بالبريد الإلكتروني.</p>
    <form id="authForm" onsubmit="submitLogin(event)">
      <label for="authEmail">البريد الإلكتروني</label><input id="authEmail" type="email" autocomplete="email" required placeholder="name@example.com" style="width:100%;padding:12px;margin:8px 0 14px">
      <label for="authPassword">كلمة المرور</label><input id="authPassword" type="password" autocomplete="current-password" minlength="8" required placeholder="8 أحرف على الأقل" style="width:100%;padding:12px;margin:8px 0 14px">
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" type="submit" id="authSignIn">تسجيل الدخول</button><button class="secondary" type="button" onclick="registerAccount()" id="authSignUp">إنشاء حساب</button></div>
    </form><p id="authMessage" role="status" style="margin-top:14px"></p><p class="micro-note">قد يلزم تأكيد البريد الإلكتروني قبل أول تسجيل دخول. لا تدخل بيانات طبية في هذه الصفحة.</p>`);
};
window.submitLogin=async(event)=>{
  event?.preventDefault();
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value;
  if(!email||!password)return authMessage('أدخل البريد الإلكتروني وكلمة المرور.',true);
  authMessage('جارٍ تسجيل الدخول...');
  try{
    const client=await initAuth();
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;
    authUser=data.user;
    closeModal();go('profile');toast('تم تسجيل الدخول بنجاح');
  }catch(error){authMessage(authErrorMessage(error),true)}
};
window.registerAccount=async()=>{
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value;
  if(!email||!password)return authMessage('أدخل البريد الإلكتروني وكلمة المرور.',true);
  if(password.length<8)return authMessage('استخدم كلمة مرور من 8 أحرف على الأقل.',true);
  authMessage('جارٍ إنشاء الحساب...');
  try{
    const client=await initAuth();
    const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:'https://etminan2021.github.io/biocare/'}});
    if(error)throw error;
    if(data.session){authUser=data.user;closeModal();go('profile');toast('تم إنشاء الحساب بنجاح')}
    else authMessage('تم إرسال رسالة تأكيد إن كان البريد مؤهلًا للتسجيل. افتح بريدك واضغط رابط التأكيد، ثم سجّل الدخول.');
  }catch(error){authMessage(authErrorMessage(error),true)}
};

window.showFamily=()=>openModal(`<h2>أفراد العائلة</h2><div class="notice">هذه الخدمة ستتوفر بعد تفعيل حساب العميل الآمن.</div>`);
window.addFamily=()=>{};
window.removeFamily=()=>{};
window.showAppointments=()=>openModal(`<h2>مواعيدي</h2><div class="notice">إدارة المواعيد الإلكترونية ستتوفر بعد ربط نظام الحجز.</div>`);
window.reschedule=()=>{};
window.saveReschedule=()=>{};
window.cancelBooking=()=>{};
window.openResult=()=>openModal(`<h2>النتائج</h2><div class="notice">سيتم تفعيل عرض النتائج بعد الربط الآمن مع نظام المختبر.</div>`);
window.showConsultations=()=>openModal(`<h2>الاستشارات الطبية</h2><div class="card"><p class="muted">لطلب استشارة، تواصل عبر واتساب. يتم الرد عادة خلال 24–72 ساعة.</p><button class="primary" onclick="openWhatsApp('السلام عليكم، أرغب بطلب استشارة طبية من مختبرات بيوكير الطبية.')">تواصل عبر واتساب</button></div>`);
window.bookConsultation=()=>showConsultations();
window.saveConsultation=()=>{};
window.openChat=()=>showConsultations();
window.showPrescriptions=()=>openModal(`<h2>الوصفات الطبية</h2><div class="notice">لا يعرض التطبيق وصفات تجريبية. سيتم تفعيل الوصفات عند توفر نظام طبي معتمد ومربوط بشكل آمن.</div>`);
window.requestRefill=()=>{};
window.showRefills=()=>openModal(`<h2>طلبات إعادة صرف الوصفة</h2><div class="notice">الخدمة غير مفعلة حاليًا.</div>`);
window.showOffers=()=>{view='packages';render();setTimeout(()=>{const s=document.getElementById('packageSearch');if(s)s.focus()},0);closeDrawer()}
window.showNotifications=()=>openModal(`<h2>الإشعارات</h2><div class="card"><p class="muted">لا توجد إشعارات جديدة.</p></div>`)
window.showSupport=()=>openModal(`<h2>المساعدة والخصوصية</h2><div class="card"><h3>الدعم والتواصل</h3><p class="muted">للدعم والاستشارات يمكن التواصل عبر واتساب. يتم الرد عادة خلال 24–72 ساعة.</p><button class="secondary" onclick="openWhatsApp('السلام عليكم، أرغب بالتواصل مع مختبرات بيوكير الطبية.')">تواصل عبر واتساب</button></div>`)
window.showAbout=()=>openModal(`<h2>حول التطبيق</h2><p class="muted">Biocare Medical Laboratories — تطبيق مختبرات بيوكير الطبية لاستعراض التحاليل والباقات والخدمات.</p>`)
window.showTestimonials=()=>openModal(`<h2>شهادات العملاء</h2><div class="card"><p class="muted">سيتم عرض تقييمات العملاء المعتمدة هنا.</p></div>`)
window.showJobs=()=>openModal(`<h2>وظائف</h2><p class="muted">سيتم عرض الوظائف المتاحة هنا عند ربط لوحة الإدارة.</p>`)
window.showBlogs=()=>openModal(`<h2>المدونات</h2><div class="card"><p class="muted">سيتم نشر المحتوى التوعوي المعتمد هنا.</p></div>`)
window.logout=async()=>{try{const client=await initAuth();const {error}=await client.auth.signOut();if(error)throw error;authUser=null;closeDrawer();go('home');toast('تم تسجيل الخروج')}catch(error){toast('تعذر تسجيل الخروج. حاول مجددًا.')}}
window.setLanguage=()=>openModal(`<h2>اللغة</h2><div class="card"><strong>العربية</strong><p class="muted">اللغة الافتراضية الحالية.</p></div><div class="card"><strong>English</strong><p class="muted">قيد التجهيز.</p></div>`)
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
initAuth().catch(()=>{ /* يبقى عرض الأسعار متاحًا حتى عند تعذر الاتصال بالمصادقة */ });
setTimeout(()=>document.getElementById('splash')?.classList.add('hide'),650);
setTimeout(()=>document.getElementById('splash')?.remove(),1050);
