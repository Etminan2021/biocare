-- Biocare v2: authenticated request creation. Run AFTER the previous supabase_setup.sql.
-- The function creates a PENDING REQUEST, not a confirmed booking.
create or replace function public.care_create_request(p_service_type text,p_service_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_number text;
  v_type text := trim(p_service_type);
  v_name text := trim(p_service_name);
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if v_type not in ('lab','home_lab','doctor','nursing','physio','virtual','radiology','referral') then
    raise exception 'Unsupported service type';
  end if;
  if v_name is null or length(v_name) < 3 or length(v_name) > 120 then
    raise exception 'Invalid service name';
  end if;
  -- Only fixed, nonclinical service labels accepted. No patient-controlled free text in records.
  if not (
    (v_type='lab' and v_name='طلب تحاليل مخبرية — تأكيد التفاصيل مع المختبر') or
    (v_type='home_lab' and v_name='تحاليل منزلية') or
    (v_type='doctor' and v_name='طبيب عام منزلي') or
    (v_type='nursing' and v_name='تمريض منزلي') or
    (v_type='physio' and v_name='علاج طبيعي منزلي')
  ) then raise exception 'Invalid service request'; end if;
  -- Basic server-side spam prevention: max 10 requests in 24 hours per user.
  if (select count(*) from public.care_orders where patient_id=v_uid and created_at>now()-interval '24 hours')>=10 then
    raise exception 'Daily request limit reached';
  end if;
  v_number := 'BIO-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  insert into public.care_orders(patient_id,order_number,service_type,service_name,status)
  values(v_uid,v_number,v_type,v_name,'received');
  insert into public.care_notifications(patient_id,title,body)
  values(v_uid,'تم استلام طلبك','تم إنشاء طلب مبدئي برقم '||v_number||'. سيحتاج إلى تأكيد الخدمة والموعد.');
  return v_number;
end;
$$;
revoke all on function public.care_create_request(text,text) from public,anon;
grant execute on function public.care_create_request(text,text) to authenticated;
