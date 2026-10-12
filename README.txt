Biocare Cloud Orders + Notifications - المرحلة الأولى

1. افتح Supabase > SQL Editor وشغّل محتوى supabase_setup.sql.
2. من Supabase > Project Settings > Data API، تأكد أن الجداول الجديدة ضمن الـ exposed schema (public).
3. ارفع الملفات الثلاثة إلى جذر مستودع GitHub: index.html و sw.js و biocare-cloud.js.
4. احتفظ بملفي services.js و saleem.js الموجودين مسبقًا ولا تحذفهما.
5. افتح التطبيق وسجل الدخول. سترى "طلباتي" و "الإشعارات". لن تظهر بيانات حتى ينشئ الخادم طلبات وإشعارات حقيقية.

مهم: الإشعارات على شاشة القفل تحتاج أيضًا VAPID public key في window.BIOCARE_VAPID_PUBLIC_KEY، وخادم إرسال Web Push آمن. لم يتم نشر خادم إرسال بعد. زر تفعيل الإشعارات يشرح عدم اكتمال الإعداد ولا يدعي تفعيله.

لا تضف service_role أو VAPID private key في ملفات GitHub العامة. لا تضع نتائج التحاليل أو تشخيصات حساسة في نص إشعار شاشة القفل.
