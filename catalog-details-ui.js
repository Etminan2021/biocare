// Biocare catalog details UI v3
(function(){
  const M=window.BIOCARE_MEDICAL_DETAILS;
  if(!M) return;

  const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const detailBlock=(title,text,icon)=>text?`<section class="bc-med-block"><div class="bc-med-title"><span>${icon}</span><h3>${e(title)}</h3></div><p>${e(text)}</p></section>`:'';

  if(typeof testCard==='function'){
    testCard=function(t){
      const priced=Number.isFinite(Number(t.price));
      return `<div class="card test-card">
        <div class="row"><span class="chip">${e(t.category)}</span>${t.official?'<span class="official-badge">سعر معتمد</span>':''}</div>
        <h3>${e(t.name)}</h3>${t.en && t.en!==t.name?`<p class="en-name">${e(t.en)}</p>`:''}
        ${t.note?`<p class="micro-note">${e(t.note)}</p>`:''}
        <div class="bc-test-actions">
          <button class="ghost bc-details-btn" onclick="showTestDetails('${encodeURIComponent(t.code)}')">التفاصيل</button>
          <span class="price ${priced?'':'on-request'}">${priced?fmtPrice(t.price):'السعر عند الطلب'}</span>
          <button class="secondary" onclick="addTestByCode('${encodeURIComponent(t.code)}')">إضافة</button>
        </div>
      </div>`;
    };
  }

  window.showTestDetails=encoded=>{
    const code=decodeURIComponent(encoded);
    const t=TESTS.find(x=>x.code===code);
    if(!t) return;
    const d=M.test(t);
    const priced=Number.isFinite(Number(t.price));
    openModal(`<div class="package-detail bc-med-detail">
      <div class="bc-med-heading">
        <span class="chip">${e(t.category||'تحليل مخبري')}</span>
        <h2>${e(t.name)}</h2>
        ${t.en && t.en!==t.name?`<p class="en-name">${e(t.en)}</p>`:''}
        <div class="detail-price">${priced?fmtPrice(t.price):'السعر عند الطلب'}</div>
      </div>
      ${detailBlock('وصف الفحص',d.description,'◉')}
      ${detailBlock('فائدة الفحص',d.benefits,'✓')}
      ${detailBlock('متطلبات الفحص',d.requirements,'◷')}
      <div class="bc-med-facts">
        <div><b>نوع العينة</b><span>${e(d.sampleType)}</span></div>
        <div><b>وقت النتيجة</b><span>${e(d.resultTime)}</span></div>
      </div>
      ${t.note?`<div class="notice compact">${e(t.note)}</div>`:''}
      <div class="bc-med-disclaimer">المعلومات للتثقيف الصحي ولا تغني عن تقييم الطبيب. لا توقف أي دواء قبل الفحص إلا بتوجيه الطبيب.</div>
      <div class="detail-actions"><button class="primary" onclick="addTestByCode('${encodeURIComponent(t.code)}');closeModal()">أضف للحجز</button><button class="ghost" onclick="closeModal()">إغلاق</button></div>
    </div>`);
  };

  window.showPackage=id=>{
    const p=PACKAGES.find(x=>x.id===id); if(!p) return;
    const comps=p.components||[];
    const d=M.package(p);
    openModal(`<div class="package-detail bc-med-detail">
      <div class="package-detail-visual" style="--pack-bg:${themeForCategory(p.category)[0]};--pack-accent:${themeForCategory(p.category)[1]}"><span class="detail-package-icon">${packageIcon(p)}</span><div><span class="chip">${e(displayPackageCategory(p.category))}</span><h2>${e(p.name)}</h2></div></div>
      <div class="detail-head"><span class="detail-price">${fmtPrice(p.price)}</span></div>
      ${detailBlock('وصف الباقة',d.description,'◉')}
      ${detailBlock('فوائد الباقة',d.benefits,'✓')}
      ${detailBlock('متطلبات الباقة',d.requirements,'◷')}
      <div class="bc-med-facts">
        <div><b>عدد التحاليل/الأنواع</b><span>${typeof p.count==='number'?p.count:e(p.count)}</span></div>
        <div><b>نوع العينة</b><span>${e(d.sampleType)}</span></div>
        <div><b>وقت النتائج</b><span>${e(d.resultTime)}</span></div>
      </div>
      <div class="vat-line">تضاف ضريبة القيمة المضافة للمقيمين.</div>
      <h3>مكونات الباقة</h3>
      ${comps.length?`<div class="component-list">${comps.map((c,i)=>`<div><span>${i+1}</span><bdi>${e(c)}</bdi></div>`).join('')}</div>`:`<div class="notice compact">${e(p.componentNote||'مكونات الباقة التفصيلية غير متاحة في المرجع الحالي.')}</div>`}
      ${p.note?`<div class="notice compact">${e(p.note)}</div>`:''}
      <div class="bc-med-disclaimer">المعلومات للتثقيف الصحي ولا تغني عن تقييم الطبيب. قد تختلف متطلبات بعض مكونات الباقة وفق حالة العميل وتعليمات المختبر.</div>
      <div class="detail-actions"><button class="primary" onclick="addPackageById('${p.id}')">أضف للحجز</button><button class="ghost" onclick="closeModal()">إغلاق</button></div>
    </div>`);
  };

  const style=document.createElement('style');
  style.textContent=`
  .bc-test-actions{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-top:12px}
  .bc-test-actions .price{text-align:center}
  .bc-details-btn{padding:9px 12px}
  .bc-med-heading{padding:4px 2px 10px}.bc-med-heading h2{margin:8px 0 2px}.bc-med-heading .detail-price{margin-top:10px}
  .bc-med-block{background:#f7faf8;border:1px solid #e5eee9;border-radius:16px;padding:13px 14px;margin:10px 0}
  .bc-med-block p{margin:7px 0 0;line-height:1.8;color:#43534d;font-size:14px}
  .bc-med-title{display:flex;align-items:center;gap:8px}.bc-med-title span{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:#e5f1eb;color:#155b3f;font-weight:900}
  .bc-med-title h3{margin:0;font-size:15px}
  .bc-med-facts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:12px 0}
  .bc-med-facts>div{background:#fff;border:1px solid #e6ece9;border-radius:14px;padding:11px}
  .bc-med-facts b{display:block;color:#155b3f;margin-bottom:5px;font-size:12px}.bc-med-facts span{font-size:13px;line-height:1.6;color:#4c5954}
  .bc-med-disclaimer{font-size:11px;line-height:1.7;color:#6c6251;background:#fff8e9;border:1px solid #f0dfbd;border-radius:12px;padding:10px;margin-top:12px}
  @media(max-width:430px){.bc-med-facts{grid-template-columns:1fr}.bc-test-actions{grid-template-columns:auto 1fr auto;gap:6px}.bc-test-actions button{padding-inline:9px}}
  `;
  document.head.appendChild(style);
  if(typeof render==='function') render();
})();