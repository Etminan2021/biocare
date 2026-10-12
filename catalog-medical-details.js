// Biocare medical catalog details v1
// Patient-friendly educational descriptions. Existing catalog/CMS values take precedence.
(function(){
  const clean=v=>String(v||'').trim();
  const noFasting='لا يتطلب الصيام عادةً، ما لم يطلب الطبيب أو المختبر خلاف ذلك.';
  const blood='عينة دم.';
  const urine='عينة بول.';
  const stool='عينة براز.';
  const semen='عينة سائل منوي.';

  const catMap={
    'السكري':{
      description:'فحص يساعد على تقييم مستوى سكر الدم أو التحكم فيه مع مرور الوقت.',
      benefits:'يساعد في الكشف عن اضطرابات سكر الدم ومتابعة مرضى السكري وتقييم الاستجابة للعلاج.',
      requirements:'قد تختلف متطلبات الصيام حسب نوع الفحص؛ راجع تعليمات الفحص المحددة.',
      sampleType:blood
    },
    'الهرمونات والغدد':{
      description:'فحص هرموني يساعد على تقييم وظيفة الغدد وتنظيم الهرمونات في الجسم.',
      benefits:'يساعد الطبيب في تقييم اضطرابات الغدد والهرمونات ومتابعة الحالات المرتبطة بها.',
      requirements:noFasting,
      sampleType:blood
    },
    'الفيتامينات والمعادن':{
      description:'فحص يقيس مستوى أحد الفيتامينات أو المعادن المهمة لصحة الجسم.',
      benefits:'يساعد في اكتشاف النقص أو الزيادة وتقييم الحاجة إلى المتابعة أو العلاج المناسب.',
      requirements:noFasting,
      sampleType:blood
    },
    'الأمراض المعدية':{
      description:'فحص مخبري يساعد على الكشف عن دلائل عدوى أو التعرض لمسبب مرضي محدد.',
      benefits:'يساعد في التشخيص أو الاستبعاد أو المتابعة بحسب نوع العدوى والفحص المطلوب.',
      requirements:noFasting,
      sampleType:blood
    },
    'البول والبراز':{
      description:'فحص مخبري للعينة يساعد على تقييم مؤشرات صحية أو التهابات أو عدوى بحسب نوع الاختبار.',
      benefits:'يساعد الطبيب في تقييم الجهاز البولي أو الهضمي واكتشاف بعض الالتهابات أو الاضطرابات.',
      requirements:'يجب جمع العينة في العبوة المناسبة واتباع تعليمات النظافة والتسليم للمختبر.',
      sampleType:'بول أو براز حسب الفحص.'
    },
    'وظائف الكبد':{
      description:'فحص يساعد على تقييم مؤشرات مرتبطة بوظائف الكبد وسلامة خلاياه.',
      benefits:'يساعد في تقييم صحة الكبد ومتابعة بعض الأمراض أو الأدوية التي قد تؤثر عليه.',
      requirements:noFasting,
      sampleType:blood
    },
    'وظائف الكلى':{
      description:'فحص يساعد على تقييم كفاءة الكلى وتوازن بعض المواد في الجسم.',
      benefits:'يساعد في الكشف عن تغيرات وظائف الكلى ومتابعة المرضى المعرضين لاضطراباتها.',
      requirements:noFasting,
      sampleType:blood
    },
    'الدهون والكوليسترول':{
      description:'فحص يقيس دهون الدم ومؤشرات مرتبطة بخطر أمراض القلب والأوعية الدموية.',
      benefits:'يساعد في تقييم مخاطر القلب ومتابعة الاستجابة لتغيير نمط الحياة أو العلاج.',
      requirements:'قد يطلب صيام 8–12 ساعة لبعض أنواع فحوص الدهون؛ يسمح بالماء فقط أثناء الصيام.',
      sampleType:blood
    },
    'المناعة والحساسية':{
      description:'فحص يساعد على تقييم نشاط الجهاز المناعي أو التحسس تجاه مواد محددة.',
      benefits:'يساعد في دعم تقييم أمراض المناعة أو الحساسية بحسب الفحص المطلوب والأعراض.',
      requirements:noFasting,
      sampleType:blood
    },
    'تحاليل الدم':{description:'فحص دم مخبري لتقييم مكوّن أو مؤشر محدد في الدم.',benefits:'يساعد في دعم تقييم الحالة الصحية والكشف أو المتابعة بحسب نوع المؤشر المطلوب.',requirements:'تختلف متطلبات التحضير بحسب نوع الفحص؛ اتبع التعليمات الظاهرة لكل تحليل.',sampleType:blood},
    'المناعة والروماتيزم':{description:'فحص مناعي يساعد على تقييم أجسام مضادة أو مؤشرات مرتبطة بالمناعة والالتهاب.',benefits:'يساعد الطبيب في دعم تقييم بعض أمراض المناعة والروماتيزم عند تفسيره مع الأعراض والفحوص الأخرى.',requirements:noFasting,sampleType:blood},
    'مؤشرات الأورام':{description:'يقيس مؤشرًا حيويًا قد يرتبط بحالات ورمية أو غير ورمية بحسب نوع الفحص.',benefits:'يستخدم للمساعدة في التقييم أو المتابعة ضمن سياق طبي محدد، ولا يعتمد عليه منفردًا لتشخيص السرطان.',requirements:noFasting,sampleType:blood},
    'الجينات والفحوصات الجزيئية':{description:'فحص جزيئي أو جيني للكشف عن مادة وراثية أو تغيرات محددة بحسب نوع الاختبار.',benefits:'يساعد في دعم التشخيص أو تحديد خصائص وراثية/جزيئية وفق سبب طلب الفحص.',requirements:'تختلف نوعية العينة والتحضير حسب الفحص الجزيئي أو الجيني؛ اتبع تعليمات المختبر قبل جمع العينة.',sampleType:'تختلف حسب الفحص.'},
    'تحاليل أخرى':{description:'فحص مخبري لقياس أو الكشف عن مؤشر صحي محدد بحسب اسم التحليل.',benefits:'يساعد الطبيب في التقييم أو التشخيص أو المتابعة عند تفسير النتيجة مع الأعراض والتاريخ الطبي.',requirements:'تختلف متطلبات التحضير حسب طبيعة الفحص؛ راجع تعليمات المختبر قبل أخذ العينة عند عدم وجود تعليمات محددة.',sampleType:'تختلف حسب الفحص.'},
    'غير مصنف':{description:'فحص مخبري لقياس أو الكشف عن مؤشر صحي محدد بحسب اسم التحليل.',benefits:'يساعد الطبيب في التقييم أو التشخيص أو المتابعة عند تفسير النتيجة مع الأعراض والتاريخ الطبي.',requirements:'تختلف متطلبات التحضير حسب طبيعة الفحص؛ راجع تعليمات المختبر قبل أخذ العينة عند عدم وجود تعليمات محددة.',sampleType:'تختلف حسب الفحص.'}
  };

  const specific=[
    {re:/\bCBC\b|صورة الدم|تعداد الدم/i,description:'يقيس أعداد ومؤشرات خلايا الدم الحمراء والبيضاء والصفائح الدموية.',benefits:'يساعد في تقييم فقر الدم والالتهابات وبعض اضطرابات الدم ومتابعة الحالة الصحية العامة.',requirements:noFasting,sampleType:blood},
    {re:/HbA1c|السكر التراكمي/i,description:'يقيس متوسط مستوى سكر الدم خلال نحو آخر شهرين إلى ثلاثة أشهر.',benefits:'يساعد في تشخيص ومتابعة السكري وتقييم التحكم بمستوى السكر على المدى المتوسط.',requirements:'لا يتطلب الصيام.',sampleType:blood},
    {re:/FBS|Glucose|سكر صائم|جلوكوز/i,description:'يقيس مستوى الجلوكوز في الدم وقت سحب العينة.',benefits:'يساعد في الكشف عن ارتفاع أو انخفاض سكر الدم وتقييم خطر السكري.',requirements:'إذا كان الفحص سكرًا صائمًا فيتطلب عادة صيام 8–10 ساعات، ويسمح بشرب الماء فقط.',sampleType:blood},
    {re:/HOMA|Insulin|إنسولين|مقاومة الإنسولين/i,description:'يساعد على تقييم مستوى الإنسولين أو تقدير مقاومة الإنسولين بحسب نوع الفحص.',benefits:'يفيد في تقييم اضطرابات استجابة الجسم للإنسولين ضمن السياق السريري.',requirements:'قد يتطلب صيام 8–10 ساعات عند حساب مقاومة الإنسولين أو عند طلب الطبيب.',sampleType:blood},
    {re:/TSH/i,description:'يقيس الهرمون المنبه للغدة الدرقية الذي ينظم نشاط الغدة الدرقية.',benefits:'يعد من الفحوص الأساسية لتقييم اضطراب نشاط الغدة الدرقية ومتابعة العلاج.',requirements:noFasting,sampleType:blood},
    {re:/Free T4|FT4|\bT4\b/i,description:'يقيس هرمون الثيروكسين للمساعدة في تقييم وظيفة الغدة الدرقية.',benefits:'يساعد مع TSH في تقييم قصور أو فرط نشاط الغدة الدرقية.',requirements:noFasting,sampleType:blood},
    {re:/Free T3|FT3|\bT3\b/i,description:'يقيس هرمون ثلاثي يودوثيرونين للمساعدة في تقييم نشاط الغدة الدرقية.',benefits:'قد يساعد في تقييم بعض حالات فرط نشاط الغدة الدرقية ومتابعتها.',requirements:noFasting,sampleType:blood},
    {re:/Vitamin D|Vit D|فيتامين د/i,description:'يقيس مستوى فيتامين D في الدم.',benefits:'يساعد في تقييم نقص فيتامين D المرتبط بصحة العظام والعضلات واستقلاب الكالسيوم.',requirements:noFasting,sampleType:blood},
    {re:/B12|فيتامين ب.?12/i,description:'يقيس مستوى فيتامين B12 في الدم.',benefits:'يساعد في تقييم أسباب بعض أنواع فقر الدم أو أعراض نقص الفيتامين المرتبطة بالأعصاب والتغذية.',requirements:noFasting,sampleType:blood},
    {re:/Ferritin|الفيريتين|مخزون الحديد/i,description:'يقيس بروتين الفيريتين الذي يعكس مخزون الحديد في الجسم.',benefits:'يساعد في تقييم نقص الحديد أو زيادته ودعم تشخيص بعض أنواع فقر الدم.',requirements:noFasting,sampleType:blood},
    {re:/\bIron\b|الحديد/i,description:'يقيس كمية الحديد المتداول في الدم.',benefits:'يساعد مع مؤشرات أخرى مثل الفيريتين في تقييم حالة الحديد وفقر الدم.',requirements:'قد يفضل سحب العينة صباحًا أو حسب تعليمات المختبر إذا طلب الطبيب ذلك.',sampleType:blood},
    {re:/CRP/i,description:'يقيس بروتينًا يرتفع في الدم عند وجود التهاب.',benefits:'يساعد في تقييم وجود التهاب ومتابعة شدته أو الاستجابة للعلاج مع بقية الفحوص.',requirements:noFasting,sampleType:blood},
    {re:/\bESR\b|سرعة الترسيب/i,description:'يقيس سرعة ترسب كريات الدم الحمراء كمؤشر غير نوعي للالتهاب.',benefits:'يساعد الطبيب في تقييم ومتابعة بعض الحالات الالتهابية مع الأعراض والفحوص الأخرى.',requirements:noFasting,sampleType:blood},
    {re:/Prolactin|البرولاكتين|هرمون الحليب/i,description:'يقيس مستوى هرمون البرولاكتين في الدم.',benefits:'يساعد في تقييم بعض اضطرابات الدورة أو الخصوبة أو إفراز الحليب غير المتوقع.',requirements:'لا يتطلب الصيام عادةً. يفضل تجنب الإجهاد الشديد قبل السحب واتباع تعليمات الطبيب عند وجود طلب خاص.',sampleType:blood},
    {re:/Progesterone|البروجستيرون/i,description:'يقيس مستوى هرمون البروجستيرون في الدم.',benefits:'يساعد في تقييم الإباضة وبعض جوانب وظيفة المبيض والحمل وفق توقيت الطبيب.',requirements:'لا يتطلب الصيام عادةً. اتبع تعليمات الطبيب إذا طلب توقيتًا محددًا للفحص.',sampleType:blood},
    {re:/\bLH\b|Luteinizing/i,description:'يقيس الهرمون اللوتيني المنظم للإباضة ووظيفة الغدد التناسلية.',benefits:'يساعد في تقييم الخصوبة واضطرابات الدورة وبعض اضطرابات الغدد التناسلية.',requirements:noFasting,sampleType:blood},
    {re:/\bFSH\b|Follicle/i,description:'يقيس الهرمون المنبه للحويصلات المرتبط بوظائف المبيض أو الخصية.',benefits:'يساعد في تقييم الخصوبة ووظائف الغدد التناسلية وبعض اضطرابات الدورة.',requirements:noFasting,sampleType:blood},
    {re:/Estradiol|\bE2\b|الإستراديول/i,description:'يقيس مستوى الإستراديول، أحد أهم هرمونات الإستروجين.',benefits:'يساعد في تقييم وظيفة المبيض والخصوبة وبعض الاضطرابات الهرمونية.',requirements:noFasting,sampleType:blood},
    {re:/AMH|Anti.?Mullerian/i,description:'يقيس الهرمون المضاد لمولر المرتبط بمخزون المبيض.',benefits:'يساعد في تقدير مخزون المبيض ودعم تقييم الخصوبة ضمن التقييم الطبي الشامل.',requirements:noFasting,sampleType:blood},
    {re:/Testosterone|التستوستيرون/i,description:'يقيس مستوى هرمون التستوستيرون في الدم.',benefits:'يساعد في تقييم بعض اضطرابات الهرمونات والخصوبة والأعراض المرتبطة بمستوى الأندروجينات.',requirements:noFasting,sampleType:blood},
    {re:/DHEA/i,description:'يقيس أحد الهرمونات الأندروجينية التي تنتج أساسًا من الغدة الكظرية.',benefits:'يساعد في تقييم بعض اضطرابات الغدة الكظرية أو زيادة الأندروجينات.',requirements:noFasting,sampleType:blood},
    {re:/Lipid|Cholesterol|Triglycer|الكوليسترول|الدهون الثلاثية/i,description:'يقيس واحدًا أو أكثر من دهون الدم مثل الكوليسترول والدهون الثلاثية.',benefits:'يساعد في تقييم مخاطر أمراض القلب والأوعية الدموية ومتابعة العلاج.',requirements:'قد يطلب صيام 8–12 ساعة لبعض فحوص الدهون؛ يسمح بشرب الماء فقط.',sampleType:blood},
    {re:/ALT|AST|ALP|GGT|Bilirubin|Albumin|الكبد|البيليروبين|الألبومين/i,description:'يقيس مؤشرًا مرتبطًا بوظائف الكبد أو سلامة خلاياه.',benefits:'يساعد في تقييم صحة الكبد والقنوات الصفراوية ومتابعة بعض الأمراض أو الأدوية.',requirements:noFasting,sampleType:blood},
    {re:/Creatinine|Urea|BUN|eGFR|الكرياتينين|اليوريا/i,description:'يقيس مؤشرًا يستخدم لتقييم وظائف الكلى.',benefits:'يساعد في تقييم قدرة الكلى على تنقية الدم ومتابعة تغير وظائفها.',requirements:noFasting,sampleType:blood},
    {re:/Urinalysis|Urine Analysis|تحليل البول/i,description:'يفحص الخصائص الكيميائية والمجهرية للبول.',benefits:'يساعد في تقييم التهابات المسالك البولية وبعض اضطرابات الكلى والسكري والجفاف.',requirements:'تجمع عينة بول نظيفة في العبوة المخصصة ويفضل تسليمها للمختبر دون تأخير.',sampleType:urine},
    {re:/Urine Culture|مزرعة البول/i,description:'يبحث عن نمو بكتيري أو ميكروبي في البول ويتيح تحديد الحساسية عند الحاجة.',benefits:'يساعد في تشخيص عدوى المسالك البولية واختيار العلاج المناسب عند وجود نمو ميكروبي.',requirements:'تجمع عينة منتصف البول بطريقة نظيفة في العبوة المعقمة ويفضل قبل بدء المضاد الحيوي إن أمكن وبتوجيه الطبيب.',sampleType:urine},
    {re:/Stool Culture|مزرعة البراز/i,description:'يبحث عن بعض الميكروبات المسببة لعدوى الجهاز الهضمي.',benefits:'يساعد في تشخيص بعض أسباب الإسهال أو العدوى المعوية وفق الحالة السريرية.',requirements:'تجمع عينة براز حديثة في العبوة المخصصة مع تجنب تلوثها بالبول أو الماء.',sampleType:stool},
    {re:/H\.?\s*pylori|Helicobacter|جرثومة المعدة/i,description:'يساعد على الكشف عن عدوى جرثومة المعدة H. pylori بحسب نوع الاختبار.',benefits:'يساعد في تشخيص العدوى المرتبطة بالتهاب المعدة والقرحة ومتابعتها وفق الطريقة المستخدمة.',requirements:'المتطلبات تختلف حسب الطريقة: فحص النفس أو البراز قد يتأثر ببعض الأدوية؛ اتبع تعليمات المختبر والطبيب قبل الفحص.',sampleType:'دم أو براز أو اختبار تنفس حسب الطريقة.'},
    {re:/HIV/i,description:'فحص يساعد على الكشف عن عدوى فيروس نقص المناعة البشرية بحسب نوع الاختبار.',benefits:'يساعد في التحري والتشخيص المبكر ضمن التوقيت المناسب بعد التعرض المحتمل.',requirements:noFasting,sampleType:blood},
    {re:/HBsAg|Hepatitis B|التهاب الكبد ب/i,description:'يساعد على الكشف عن مستضد سطح فيروس التهاب الكبد B.',benefits:'يساعد في تقييم وجود عدوى حالية بفيروس التهاب الكبد B ضمن الفحوص المناسبة.',requirements:noFasting,sampleType:blood},
    {re:/HCV|Hepatitis C|التهاب الكبد ج/i,description:'يساعد على الكشف عن الأجسام المضادة لفيروس التهاب الكبد C أو مؤشرات العدوى بحسب نوع الفحص.',benefits:'يساعد في التحري عن التعرض للفيروس وتحديد الحاجة لفحوص تأكيدية عند اللزوم.',requirements:noFasting,sampleType:blood},
    {re:/VDRL|Syphilis|الزهري/i,description:'فحص تحرٍ يساعد على الكشف عن دلائل قد ترتبط بعدوى الزهري.',benefits:'يساعد في التحري والتشخيص ضمن التقييم السريري وقد يحتاج الفحص الإيجابي إلى اختبارات تأكيدية.',requirements:noFasting,sampleType:blood},
    {re:/ANA|dsDNA|Anti.?CCP|ANCA|Anti.?Ro|Anti.?La/i,description:'فحص مناعي يبحث عن أجسام مضادة مرتبطة ببعض أمراض المناعة الذاتية.',benefits:'يساعد الطبيب في دعم تقييم أمراض المناعة الذاتية عند وجود أعراض مناسبة، ولا يعتمد التشخيص عليه منفردًا.',requirements:noFasting,sampleType:blood},
    {re:/PSA|CA.?125|CA.?19|CEA|AFP|Tumou?r|مؤشرات الأورام/i,description:'يقيس مؤشرًا حيويًا قد يرتبط ببعض الحالات الورمية أو غير الورمية.',benefits:'يستخدم غالبًا للمساعدة في المتابعة أو ضمن تقييم طبي محدد، وليس كتشخيص منفرد للسرطان.',requirements:noFasting,sampleType:blood},
    {re:/IgE|Allergy|حساسية/i,description:'فحص يساعد على تقييم التحسس المناعي الكلي أو تجاه مسببات محددة.',benefits:'يساعد في دعم تقييم الحساسية مع التاريخ المرضي والأعراض والفحوص السريرية.',requirements:noFasting,sampleType:blood},
    {re:/Semen|السائل المنوي/i,description:'يقيم خصائص السائل المنوي مثل الحجم والتركيز والحركة والشكل وفق معايير المختبر.',benefits:'يساعد في تقييم خصوبة الرجل كجزء من تقييم الخصوبة الشامل.',requirements:'يتطلب الامتناع عن القذف 2–5 أيام قبل جمع العينة. الخدمة متاحة في فرع أبو عريش فقط.',sampleType:semen,resultTime:'حوالي 24 ساعة.'}
  ];

  function categoryBase(t){
    const c=clean(t.category);
    return catMap[c]||{
      description:'فحص مخبري يساعد على تقييم مؤشر صحي محدد حسب نوع التحليل.',
      benefits:'يساعد الطبيب في الكشف أو التقييم أو المتابعة عند تفسير النتيجة مع الأعراض والتاريخ الطبي.',
      requirements:'تختلف متطلبات التحضير حسب طبيعة الفحص؛ إذا لم تظهر تعليمات محددة، تواصل مع المختبر قبل أخذ العينة.',
      sampleType:'تختلف حسب الفحص.'
    };
  }

  function test(t){
    const text=[t.name,t.en,t.code].filter(Boolean).join(' ');
    const s=specific.find(x=>x.re.test(text))||categoryBase(t);
    return {
      description:clean(t.description)||s.description,
      benefits:clean(t.benefits)||s.benefits,
      requirements:clean(t.requirements)||clean(t.fasting)||s.requirements,
      sampleType:clean(t.sampleType)||s.sampleType||blood,
      resultTime:clean(t.resultTime)||s.resultTime||'تُحدد حسب نوع الفحص وإجراءات المختبر.'
    };
  }

  function pack(p){
    const fasting=clean(p.fasting);
    const focus=clean(p.name).replace(/^باقة\s*/,'');
    return {
      description:clean(p.description)||('باقة فحوصات '+(focus||'مخبرية')+' تجمع مجموعة من التحاليل للمساعدة في تقييم عدد من المؤشرات الصحية ذات الصلة.'),
      benefits:clean(p.benefits)||('تساعد الباقة على إجراء تقييم أشمل ضمن زيارة واحدة، وتسهّل مراجعة المؤشرات المرتبطة بـ '+(focus||'الصحة العامة')+' مع الطبيب.'),
      requirements:clean(p.requirements)||fasting||'تختلف المتطلبات حسب مكونات الباقة، وتظهر التعليمات قبل الحجز.',
      sampleType:clean(p.sampleType)||'غالبًا عينة دم، وقد تتضمن عينات أخرى بحسب مكونات الباقة.',
      resultTime:clean(p.resultTime)||'قد تختلف مدة ظهور النتائج بين مكونات الباقة.'
    };
  }

  window.BIOCARE_MEDICAL_DETAILS={test,package:pack};

  // Load the editable Super Admin fields. If the v3 SQL has not been run yet,
  // the built-in educational defaults above continue to work safely.
  const URL='https://jlibhpavbqfeegsehekm.supabase.co';
  const KEY='sb_publishable_XVOmCPOiqdUlG-pOPhrQ0g_rIV0R6tK';
  async function rpc(name){
    const r=await fetch(`${URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:'{}'});
    if(!r.ok) throw Error(await r.text());
    return r.json();
  }
  function applyAdminFields(cat,overrides,custom){
    for(const z of custom||[]){
      if(!z.active) continue;
      const arr=z.item_type==='test'?cat.tests:cat.packages,idKey=z.item_type==='test'?'code':'id';
      let x=arr.find(y=>String(y[idKey])===String(z.item_id));
      if(!x){
        x=z.item_type==='test'?{code:z.item_id,name:z.name,en:z.en_name||z.name,category:z.category||'تحاليل أخرى',price:z.price,note:z.note||'',official:false}:{id:z.item_id,name:z.name,category:z.category||'باقات طبية',price:z.price,count:Array.isArray(z.components)?z.components.length:0,fasting:z.fasting||'',components:z.components||[],note:z.note||''};
        arr.push(x);
      }
      if(z.description)x.description=z.description;if(z.benefits)x.benefits=z.benefits;if(z.requirements)x.requirements=z.requirements;if(z.sample_type)x.sampleType=z.sample_type;if(z.turnaround_time)x.resultTime=z.turnaround_time;
      if(z.fasting&&!x.requirements)x.requirements=z.fasting;if(Array.isArray(z.components)&&z.item_type==='package'){x.components=z.components;x.count=z.components.length}
    }
    for(const o of overrides||[]){
      const arr=o.item_type==='test'?cat.tests:cat.packages,idKey=o.item_type==='test'?'code':'id';
      const x=arr.find(y=>String(y[idKey])===String(o.item_id));if(!x)continue;
      if(o.description_override)x.description=o.description_override;if(o.benefits_override)x.benefits=o.benefits_override;if(o.requirements_override)x.requirements=o.requirements_override;if(o.sample_type_override)x.sampleType=o.sample_type_override;if(o.turnaround_time_override)x.resultTime=o.turnaround_time_override;
      if(o.fasting_override&&!o.requirements_override)x.requirements=o.fasting_override;
    }
    if(typeof window.render==='function')window.render();
  }
  Promise.resolve(window.BIOCARE_CATALOG_READY).then(async cat=>{
    try{const [o,c]=await Promise.all([rpc('care_public_catalog_overrides'),rpc('care_public_catalog_custom')]);applyAdminFields(cat,o,c)}catch(err){console.info('Biocare catalog detail fields are using built-in defaults until the v3 database migration is enabled.');}
  });
})();