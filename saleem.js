// Saleem — Biocare smart symptom-to-test assistant (local safety-first v1)
// This first version runs entirely in the browser and does not store symptom text.
(() => {
  const STYLE_ID='saleemStylesV1';
  if(!document.getElementById(STYLE_ID)){
    const st=document.createElement('style');
    st.id=STYLE_ID;
    st.textContent=`
      .saleem-card{background:linear-gradient(135deg,#f6fffb,#eef9f3);border:1px solid #d9eee3;overflow:hidden;position:relative}
      .saleem-card:before{content:'سليم';position:absolute;left:-10px;top:-18px;font-size:76px;font-weight:900;color:#1767440d;transform:rotate(-8deg)}
      .saleem-badge{display:inline-flex;align-items:center;gap:7px;background:#e7f6ee;color:#176744;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:800}
      .saleem-dot{width:8px;height:8px;border-radius:50%;background:#2cab6f;box-shadow:0 0 0 4px #2cab6f22}
      .saleem-title{margin:10px 0 6px;font-size:22px}
      .saleem-sheet{direction:rtl}
      .saleem-head{display:flex;gap:12px;align-items:center;margin-bottom:12px}
      .saleem-avatar{width:48px;height:48px;border-radius:16px;background:#176744;color:#fff;display:grid;place-items:center;font-size:21px;font-weight:900;box-shadow:0 8px 22px #17674425}
      .saleem-chat{background:#f6f8f7;border-radius:18px;padding:12px;max-height:58vh;overflow:auto;border:1px solid #e8ecea}
      .saleem-bubble{max-width:92%;padding:11px 13px;border-radius:16px;margin:8px 0;line-height:1.65;font-size:14px}
      .saleem-bubble.bot{background:#fff;border:1px solid #e4ebe7;margin-left:auto}
      .saleem-bubble.user{background:#176744;color:#fff;margin-right:auto}
      .saleem-form{margin-top:12px}
      .saleem-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .saleem-input,.saleem-select,.saleem-textarea{width:100%;box-sizing:border-box;border:1px solid #d8dedb;border-radius:12px;padding:11px 12px;background:#fff;font:inherit;outline:none}
      .saleem-textarea{min-height:100px;resize:vertical;margin-top:8px;line-height:1.6}
      .saleem-input:focus,.saleem-select:focus,.saleem-textarea:focus{border-color:#176744;box-shadow:0 0 0 3px #17674414}
      .saleem-check{display:flex;align-items:flex-start;gap:8px;margin:10px 0;font-size:13px;color:#4b5651}
      .saleem-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .saleem-note{font-size:12px;color:#66716c;line-height:1.55;margin-top:10px}
      .saleem-alert{background:#fff4f2;border:1px solid #ffd5cf;color:#9d2a1f;border-radius:14px;padding:12px;margin:10px 0;line-height:1.65}
      .saleem-result{background:#fff;border:1px solid #e4ebe7;border-radius:14px;padding:11px;margin:9px 0}
      .saleem-result h4{margin:0 0 6px;font-size:15px}
      .saleem-result p{margin:4px 0;color:#56615c;font-size:13px;line-height:1.55}
      .saleem-result-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px}
      .saleem-price{font-weight:800;color:#176744;white-space:nowrap}
      .saleem-small-btn{border:0;border-radius:10px;padding:8px 10px;background:#edf6f1;color:#176744;font-weight:800;font:inherit;cursor:pointer}
      .saleem-package{border-color:#cfe7db;background:#fbfffd}
      .saleem-disclaimer{background:#fffbea;border:1px solid #f4e5a6;color:#665515;border-radius:12px;padding:10px;font-size:12px;line-height:1.6;margin-top:10px}
      @media(max-width:520px){.saleem-grid{grid-template-columns:1fr}.saleem-chat{max-height:54vh}}
    `;
    document.head.appendChild(st);
  }

  const norm=s=>String(s||'')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g,'')
    .replace(/[إأآٱ]/g,'ا')
    .replace(/ة/g,'ه')
    .replace(/ى/g,'ي')
    .replace(/[^\p{L}\p{N}\s]/gu,' ')
    .replace(/\s+/g,' ')
    .trim();

  const testAliases={
    CBC:['cbc','complete blood count','صوره الدم','صورة الدم','تعداد الدم'],
    FERRITIN:['ferritin','مخزون الحديد','الفيريتين'],
    VITD:['vitamin d','vit d','فيتامين د','25 oh vitamin d'],
    B12:['vitamin b12','b12','فيتامين ب12','فيتامين ب 12'],
    TSH:['tsh','thyroid stimulating hormone','هرمون الغده الدرقيه','الهرمون المحفز للغده'],
    FT4:['free t4','ft4','free thyroxine','الثيروكسين الحر'],
    HBA1C:['hba1c','a1c','glycated hemoglobin','السكر التراكمي','الهيموغلوبين السكري'],
    FBS:['fbs','fasting blood sugar','fasting glucose','سكر صائم','الجلوكوز الصائم'],
    UA:['urinalysis','urine analysis','تحليل البول','فحص البول'],
    ZINC:['zinc','الزنك'],
    FOLATE:['folate','folic acid','حمض الفوليك','فولات'],
    HPUrea:['urea breath test','ubt','h pylori breath','جرثومه المعده بالنفخ','اختبار التنفس'],
    HPStool:['h pylori stool antigen','stool antigen','جرثومه المعده بالبراز','مستضد جرثومه المعده']
  };

  function findTest(key){
    const aliases=(testAliases[key]||[]).map(norm);
    return TESTS.find(t=>{
      const hay=norm(`${t.name||''} ${t.en||''} ${t.code||''}`);
      return aliases.some(a=>a && hay.includes(a));
    })||null;
  }

  function findPackage(words){
    const ns=(words||[]).map(norm);
    return PACKAGES.find(p=>{
      const hay=norm(`${p.name||''} ${p.category||''}`);
      return ns.some(w=>w && hay.includes(w));
    })||null;
  }

  const groups=[
    {
      id:'fatigue',
      words:['تعب','ارهاق','خمول','دوخه','دوار','شحوب','ضعف عام','نعاس','قلة طاقه','fatigue','tired','dizziness'],
      tests:['CBC','FERRITIN','VITD','B12','TSH'],
      packageWords:['الضعف والتعب','التعب','weakness','tiredness'],
      intro:'هذه الأعراض شائعة ولها أسباب متعددة؛ الفحوصات التالية قد تساعد في تقييم فقر الدم، مخزون الحديد، بعض الفيتامينات ووظيفة الغدة الدرقية.'
    },
    {
      id:'hair',
      words:['تساقط شعر','تساقط الشعر','شعري يتساقط','ضعف الشعر','تقصف الشعر','hair loss','hair fall'],
      tests:['CBC','FERRITIN','VITD','TSH','ZINC','B12'],
      packageWords:['العنايه بالبشره وتساقط الشعر','البشره وتساقط الشعر','البشره والشعر','skin hair'],
      intro:'تساقط الشعر قد يرتبط بعوامل كثيرة. هذه الفحوصات قد تساعد في تقييم بعض الأسباب الغذائية والهرمونية الشائعة، لكنها لا تغطي كل الأسباب الجلدية.'
    },
    {
      id:'diabetes',
      words:['عطش','تبول كثير','كثرة التبول','جوع كثير','سكر','ارتفاع السكر','تشوش الرؤيه','blurred vision','thirst','frequent urination'],
      tests:['FBS','HBA1C','UA'],
      packageWords:['التشخيص المبكر للسكري','السكري','diabetes'],
      intro:'العطش وكثرة التبول قد يكون لهما أكثر من سبب. فحوصات السكر وتحليل البول من الفحوصات الشائعة التي قد تساعد في التقييم الأولي.'
    },
    {
      id:'thyroid',
      words:['زياده وزن','زيادة وزن','نقصان وزن','خفقان','برد شديد','احساس بالبرد','رجفه','تعرق','الغده الدرقيه','thyroid','weight gain','palpitation'],
      tests:['TSH','FT4'],
      packageWords:['الغده الدرقيه','الدرقيه','thyroid'],
      intro:'تغير الوزن أو الخفقان أو عدم تحمل البرد/الحرارة قد تكون له أسباب متعددة. فحوصات الغدة الدرقية قد تكون جزءًا من التقييم.'
    },
    {
      id:'anemia',
      words:['شحوب','صداع متكرر','ضيق نفس مع المجهود','تعب مع المجهود','انيميا','فقر دم','anemia','pale'],
      tests:['CBC','FERRITIN','B12','FOLATE'],
      packageWords:['الضعف والتعب','فقر الدم','anemia'],
      intro:'الأعراض قد تتوافق مع عدة حالات، ومنها فقر الدم. هذه الفحوصات تساعد في التقييم المبدئي لأنواع شائعة من النقص.'
    },
    {
      id:'stomach',
      words:['حموضه','حرقة معده','حرقان المعده','الم اعلى البطن','ألم أعلى البطن','تجشؤ','جرثومه المعده','غثيان بعد الاكل','heartburn','h pylori','stomach burning'],
      tests:['HPUrea','HPStool'],
      packageWords:['جرثومه المعده','المعده','h pylori'],
      intro:'أعراض المعدة قد تنتج عن أسباب متعددة. عند الاشتباه بجرثومة المعدة توجد عدة طرق للفحص، ويُختار الأنسب حسب الحالة والأدوية المستخدمة.'
    }
  ];

  const redFlags=[
    /الم صدر شديد|الم شديد بالصدر|chest pain.*severe|severe chest pain/,
    /ضيق نفس شديد|اختناق|لا استطيع التنفس|cannot breathe|severe shortness of breath/,
    /فقدان الوعي|اغماء متكرر|unconscious|loss of consciousness/,
    /ضعف مفاجئ.*(جهه|جهة|نصف)|اعوجاج الفم|صعوبه الكلام المفاجئ|stroke/,
    /نزيف شديد|قيء دم|استفراغ دم|براز اسود.*دوخه|severe bleeding/,
    /حساسيه شديده.*تنفس|تورم اللسان|تورم الحلق|anaphylaxis/,
    /افكار انتحار|اريد الانتحار|ايذاء نفسي|self harm|suicid/
  ];

  function containsRedFlag(text){
    const n=norm(text);
    return redFlags.some(r=>r.test(n));
  }

  function specialCase(text,age,pregnant){
    const n=norm(text);
    if(pregnant || /حامل|حمل/.test(n)) return 'pregnancy';
    if(age && age<14) return 'child';
    if(/دوره غير منتظمه|تاخر الدوره|نزيف مهبلي|افرازات مهبليه|الم حوض|خصوبه|تاخر حمل/.test(n)) return 'women';
    if(/حراره عاليه|حمى شديده|fever/.test(n)) return 'fever';
    return null;
  }

  function scoreGroups(text){
    const n=norm(text);
    return groups.map(g=>({g,score:g.words.reduce((s,w)=>s+(n.includes(norm(w))?1:0),0)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score);
  }

  function testReason(key){
    const map={
      CBC:'يساعد في تقييم فقر الدم وبعض مؤشرات خلايا الدم.',
      FERRITIN:'يعكس مخزون الحديد وقد يكون مهمًا عند التعب أو تساقط الشعر.',
      VITD:'يقيس مستوى فيتامين د، ونقصه شائع وقد يترافق مع أعراض عامة غير نوعية.',
      B12:'يساعد في تقييم نقص فيتامين ب12 الذي قد يرتبط بالتعب أو أعراض عصبية.',
      TSH:'فحص أساسي لتقييم وظيفة الغدة الدرقية.',
      FT4:'يكمل تقييم الغدة الدرقية في بعض الحالات مع TSH.',
      HBA1C:'يعطي متوسطًا تقريبيًا لسكر الدم خلال الأشهر الأخيرة.',
      FBS:'يقيس سكر الدم أثناء الصيام.',
      UA:'قد يساعد في تقييم البول وبعض الأسباب المصاحبة لكثرة التبول.',
      ZINC:'قد يُطلب في بعض حالات تساقط الشعر أو الاشتباه بالنقص الغذائي.',
      FOLATE:'يساعد في تقييم نقص الفولات كأحد أسباب بعض أنواع فقر الدم.',
      HPUrea:'طريقة شائعة غير جراحية للكشف عن جرثومة المعدة.',
      HPStool:'فحص غير جراحي للكشف عن مستضد جرثومة المعدة في البراز.'
    };
    return map[key]||'قد يكون مناسبًا كجزء من التقييم المبدئي.';
  }

  function fastingText(t){
    const s=norm(`${t?.note||''} ${t?.fasting||''}`);
    if(!s) return '';
    if(s.includes('لا يتطلب صيام')) return 'لا يتطلب صيام';
    if(s.includes('صيام')) return 'قد يتطلب صيامًا';
    return '';
  }

  function recommendationFor(text,age,pregnant){
    if(containsRedFlag(text)) return {urgent:true};
    const special=specialCase(text,age,pregnant);
    if(special) return {special};
    const scored=scoreGroups(text);
    if(!scored.length) return {unknown:true};

    const top=scored.slice(0,2);
    const keys=[];
    top.forEach(x=>x.g.tests.forEach(k=>{if(!keys.includes(k))keys.push(k)}));
    const tests=keys.map(k=>({key:k,test:findTest(k)})).filter(x=>x.test).slice(0,6);
    const pkg=top.map(x=>findPackage(x.g.packageWords)).find(Boolean)||null;
    const intro=top.map(x=>x.g.intro).join(' ');
    return {tests,pkg,intro};
  }

  function renderInitial(){
    return `<div class="saleem-sheet">
      <div class="saleem-head"><div class="saleem-avatar">س</div><div><h2 style="margin:0">سليم</h2><div class="muted">المساعد الصحي الذكي لمختبرات بيوكير</div></div></div>
      <div class="saleem-chat" id="saleemChat">
        <div class="saleem-bubble bot">مرحبًا 👋 أنا <b>سليم</b>. اكتب الأعراض التي تشعر بها، وسأقترح فحوصات أو باقات قد تكون مناسبة للمناقشة مع الطبيب أو المختبر. أنا لا أشخّص الأمراض.</div>
      </div>
      <form class="saleem-form" onsubmit="saleemSubmit(event)">
        <div class="saleem-grid">
          <input class="saleem-input" id="saleemAge" type="number" inputmode="numeric" min="1" max="120" placeholder="العمر (اختياري)">
          <select class="saleem-select" id="saleemSex"><option value="">الجنس (اختياري)</option><option value="male">ذكر</option><option value="female">أنثى</option></select>
        </div>
        <textarea class="saleem-textarea" id="saleemSymptoms" required maxlength="1200" placeholder="مثال: أشعر بتعب ودوخة وتساقط شعر منذ شهرين..."></textarea>
        <label class="saleem-check"><input type="checkbox" id="saleemPregnant"> <span>أنا حامل أو أكتب عن حالة حمل</span></label>
        <div class="saleem-actions"><button class="primary" type="submit">حلّل الأعراض</button><button class="ghost" type="button" onclick="saleemClear()">مسح</button></div>
        <div class="saleem-note">🔒 في النسخة الحالية، ما تكتبه يُحلل داخل جهازك فقط ولا يتم حفظ نص الأعراض في قاعدة البيانات.</div>
      </form>
      <div class="saleem-disclaimer">سليم أداة مساعدة لا تقدّم تشخيصًا طبيًا ولا تستبدل الطبيب. عند وجود أعراض شديدة أو مفاجئة اطلب الرعاية الطبية المناسبة فورًا.</div>
    </div>`;
  }

  function resultHtml(rec){
    if(rec.urgent){
      return `<div class="saleem-alert"><b>هذه الأعراض قد تحتاج تقييمًا عاجلًا.</b><br>لا أنصح بالاعتماد على اختيار تحاليل عبر التطبيق الآن. اطلب الرعاية الطبية العاجلة أو تواصل مع خدمات الطوارئ المناسبة لموقعك.</div>`;
    }
    if(rec.special==='pregnancy'){
      return `<div class="saleem-alert"><b>في الحمل نحتاج تقييمًا أكثر تخصيصًا.</b><br>نوع وتوقيت الفحوصات يعتمد على مرحلة الحمل والأعراض والتاريخ الطبي. الأفضل التواصل مع الطبيب/الطبيبة أو المختبر قبل اختيار باقة تلقائيًا.</div>`;
    }
    if(rec.special==='child'){
      return `<div class="saleem-alert"><b>لأن الحالة لطفل، لن أقترح باقة تلقائيًا.</b><br>الفحوصات عند الأطفال تعتمد بشدة على العمر والوزن والأعراض والفحص السريري، لذلك يفضّل تقييم طبي مباشر.</div>`;
    }
    if(rec.special==='women'){
      return `<div class="saleem-alert"><b>أعراض الدورة/الخصوبة تحتاج تحديد التوقيت والسياق.</b><br>اختيار فحوصات الهرمونات يعتمد على السبب والتاريخ الطبي، لذلك يفضّل عدم طلب باقة هرمونات تلقائيًا قبل تقييم مختص.</div>`;
    }
    if(rec.special==='fever'){
      return `<div class="saleem-alert"><b>الحمّى تحتاج تقييم السبب أولًا.</b><br>لا توجد مجموعة تحاليل واحدة مناسبة لكل حالات الحرارة؛ إذا كانت مرتفعة أو مستمرة أو مصحوبة بأعراض شديدة فالتقييم الطبي أهم من اختيار باقة تلقائيًا.</div>`;
    }
    if(rec.unknown){
      return `<div class="saleem-bubble bot">لم أتمكن من تحديد مجموعة فحوصات مناسبة بأمان من الوصف الحالي. جرّب كتابة <b>العرض الرئيسي + مدته + أي أعراض مصاحبة</b>، مثل: «تعب ودوخة وتساقط شعر منذ شهرين».</div>`;
    }

    const tests=(rec.tests||[]).map(({key,test})=>{
      const price=Number.isFinite(Number(test.price))?fmtPrice(test.price):'السعر عند الطلب';
      const fast=fastingText(test);
      return `<div class="saleem-result"><h4>${esc(test.name)}</h4><p>${esc(testReason(key))}</p>${fast?`<p><b>${esc(fast)}</b></p>`:''}<div class="saleem-result-row"><span class="saleem-price">${esc(price)}</span><button class="saleem-small-btn" onclick="saleemAddTest('${encodeURIComponent(test.code)}')">إضافة للسلة</button></div></div>`;
    }).join('');

    const pkg=rec.pkg?`<div class="saleem-result saleem-package"><span class="saleem-badge"><span class="saleem-dot"></span>باقة مقترحة</span><h4 style="margin-top:8px">${esc(rec.pkg.name)}</h4><p>${esc(rec.pkg.description||'قد تجمع عددًا من الفحوصات ذات الصلة في خيار واحد.')}</p><div class="saleem-result-row"><span class="saleem-price">${esc(fmtPrice(rec.pkg.price))}</span><button class="saleem-small-btn" onclick="saleemAddPackage('${esc(rec.pkg.id)}')">إضافة للسلة</button></div></div>`:'';

    return `<div class="saleem-bubble bot"><b>اقتراح مبدئي:</b> ${esc(rec.intro||'')}</div>${tests||'<div class="saleem-bubble bot">لم أجد فحوصات مطابقة في كتالوج التطبيق الحالي.</div>'}${pkg}<div class="saleem-disclaimer">الاقتراح مبني على الأعراض المكتوبة فقط، ولا يعني أنك مصاب بحالة معينة. الطبيب قد يطلب فحوصات مختلفة أو يقرر أن التحاليل غير مطلوبة.</div>`;
  }

  window.openSaleem=()=>{
    openModal(renderInitial());
    setTimeout(()=>document.getElementById('saleemSymptoms')?.focus(),100);
  };

  window.saleemSubmit=(event)=>{
    event?.preventDefault();
    const text=document.getElementById('saleemSymptoms')?.value.trim()||'';
    const age=Number(document.getElementById('saleemAge')?.value)||null;
    const pregnant=!!document.getElementById('saleemPregnant')?.checked;
    if(!text) return;
    const chat=document.getElementById('saleemChat');
    if(!chat) return;
    chat.insertAdjacentHTML('beforeend',`<div class="saleem-bubble user">${esc(text)}</div>`);
    const rec=recommendationFor(text,age,pregnant);
    chat.insertAdjacentHTML('beforeend',resultHtml(rec));
    chat.scrollTop=chat.scrollHeight;
  };

  window.saleemClear=()=>{
    const t=document.getElementById('saleemSymptoms'); if(t)t.value='';
    const c=document.getElementById('saleemChat'); if(c)c.innerHTML='<div class="saleem-bubble bot">اكتب الأعراض من جديد وسأحاول ترتيب الخيارات المناسبة لك.</div>';
  };

  window.saleemAddTest=encoded=>{
    window.addTestByCode(encoded);
  };
  window.saleemAddPackage=id=>{
    window.addPackageById(id);
  };

  const originalHome=home;
  home=function(){
    return originalHome()+`<section class="section"><div class="section-head"><h2>سليم</h2></div><div class="card saleem-card"><span class="saleem-badge"><span class="saleem-dot"></span>مساعد صحي ذكي</span><h3 class="saleem-title">محتار أي تحليل يناسب أعراضك؟</h3><p class="muted">اكتب الأعراض لسليم، وسيشرح لك الفحوصات أو الباقات التي قد تكون مناسبة بشكل مبدئي وآمن.</p><button class="primary" onclick="openSaleem()">تحدث مع سليم</button></div></section>`;
  };

  const drawer=document.getElementById('drawerMenu');
  if(drawer){
    const group=document.createElement('div');
    group.className='drawer-group';
    group.innerHTML=`<div class="drawer-title">المساعد الذكي</div><button class="drawer-item" onclick="closeDrawer();openSaleem()"><span class="drawer-icon">✦</span><span>سليم - اختيار التحاليل</span><span class="drawer-arrow">‹</span></button>`;
    drawer.prepend(group);
  }

  if(view==='home') render();
})();
