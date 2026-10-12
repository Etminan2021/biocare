BIOCARE CATALOG DETAILS v3

WHAT THIS UPDATE ADDS
- Every test gets a patient-friendly description, benefit, preparation requirements, specimen type and result-time field.
- Every package gets description, benefits, preparation requirements, specimen type, result-time, number of tests, components, price and Add to booking.
- Common tests have more specific medical wording; the rest receive safe category-based wording so no catalog item is left blank.
- All new fields are editable in Biocare Super Admin.
- Existing prices, package components, banners, bookings, icons and other app features are not replaced.

INSTALL
1) Open Supabase SQL Editor and run: supabase_catalog_details_v3.sql
2) Upload these files to the ROOT of GitHub repo and replace files when asked:
   index.html
   admin.html
   sw.js
   catalog-medical-details.js
   catalog-details-ui.js
   biocare-catalog-admin-v3.js
3) Commit changes.
4) Open the customer app, refresh/reopen it, then open Tests and tap "التفاصيل".
5) Open Super Admin > التحاليل والباقات. Each item now includes:
   الوصف / الفوائد / المتطلبات / نوع العينة / وقت ظهور النتيجة.

Medical note: patient-facing wording is educational. Medication stopping is never instructed automatically; the app tells patients to follow physician/lab instructions.
