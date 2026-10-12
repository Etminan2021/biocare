# Biocare Medical Laboratories — V4 Catalog Build

هذه النسخة تجمع واجهة بيوكير المعتمدة مع كتالوج التحاليل والباقات.

## المحتوى
- شعار بيوكير الصحيح كما زوده المستخدم.
- 100 باقة مع السعر، عدد التحاليل، الصيام، التصنيف، والوصف.
- مكونات 83 باقة مستخرجة من ملف العروض؛ الباقات التي لا توجد مكوناتها في المرجع تظهر بوضوح كمحتوى يحتاج اعتمادًا بدل اختلاق مكونات.
- 745 اسم تحليل/خدمة للبحث، منها 105 بأسعار بيوكير المؤكدة في قاعدة التطبيق؛ بقية الأسماء المرجعية لا تعرض سعر منافس على أنه سعر بيوكير.
- تصميم بطاقة/صورة مستقلة مولدة داخل التطبيق لكل باقة، تحمل اسمها وسعرها وعدد التحاليل وحالة الصيام.
- السلة والحجز والنتائج التجريبية والحساب وأفراد العائلة.
- الاستشارات والمحادثة والوصفات وطلب إعادة الصرف (تجريبي فقط).
- PWA قابل للتثبيت على iPhone/Android.

## مهم
هذه واجهة تجريبية وليست نظامًا طبيًا إنتاجيًا. لا تستخدم بيانات مرضى حقيقية، ولا تعتمد الاستشارات أو الوصفات الفعلية قبل ربط Backend آمن والتحقق من التراخيص والتكاملات التنظيمية المطلوبة.


## V5
- Compact package cards with category-specific medical icons.
- Search and quick filters for fasting / no fasting / best-selling.
- Cleaner package details and fixed navigation icons.


V6: تحديث أسعار التحاليل من الملف المرفق (509 صف إنجليزي + 148 صف عربي)، الباقات 100 مطابقة. الأسعار القديمة للتحاليل غير المذكورة في الملف بقيت كما كانت ويجب مراجعتها قبل اعتمادها تجارياً. لا توجد وظائف مرضى حقيقية أو LIS.


## V7 Production-safe
- Removed demo patient login, demo results, demo bookings, demo chat and demo prescriptions from the public flow.
- Cleans previously saved local demo patient data once.
- Keeps test/package catalog and prices.
- Adds WhatsApp handoff for selected tests/packages and consultations.
- Normalizes Profile/Profiles labels to Arabic in the UI.
- Public admin demo data view disabled until secure backend/authentication is connected.


## V8
- App icon changed to the official Biocare B/drop logo.
- Added floating instant-chat button linked to WhatsApp +966 56 766 9779.
