-- Biocare: app-native home visit requests + secure customer location

create table if not exists public.care_home_request_details (
  order_id uuid primary key references public.care_orders(id) on delete cascade,
  area text not null,
  requested_date date not null,
  preferred_period text not null
    check (preferred_period in ('صباحًا','مساءً','أي وقت متاح')),
  phone text not null,
  lat double precision null check (lat is null or lat between -90 and 90),
  lon double precision null check (lon is null or lon between -180 and 180),
  created_at timestamptz not null default now(),
  check ((lat is null and lon is null) or (lat is not null and lon is not null))
);

alter table public.care_home_request_details enable row level security;
revoke all on public.care_home_request_details from anon, authenticated;

create or replace function public.care_create_home_request(
  p_service_type text,
  p_service_name text,
  p_area text,
  p_requested_date date,
  p_preferred_period text,
  p_phone text,
  p_lat double precision default null,
  p_lon double precision default null
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_number text;
  v_type text := trim(p_service_type);
  v_name text := trim(p_service_name);
  v_area text := trim(p_area);
  v_phone text := trim(p_phone);
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  if not (
    (v_type='home_lab' and v_name='تحاليل منزلية')
    or (v_type='doctor' and v_name='طبيب عام منزلي')
    or (v_type='nursing' and v_name='تمريض منزلي')
    or (v_type='physio' and v_name='علاج طبيعي منزلي')
  ) then raise exception 'Invalid service request'; end if;

  if v_area is null or length(v_area) < 2 or length(v_area) > 120
    then raise exception 'Invalid area'; end if;

  if p_requested_date < current_date or p_requested_date > current_date + 90
    then raise exception 'Invalid requested date'; end if;

  if p_preferred_period not in ('صباحًا','مساءً','أي وقت متاح')
    then raise exception 'Invalid preferred period'; end if;

  if v_phone !~ '^\+?[0-9 -]{8,20}$'
    then raise exception 'Invalid phone'; end if;

  if (p_lat is null) <> (p_lon is null)
    then raise exception 'Incomplete coordinates'; end if;

  if p_lat is not null and (p_lat not between -90 and 90 or p_lon not between -180 and 180)
    then raise exception 'Invalid coordinates'; end if;

  if (select count(*) from public.care_orders
      where patient_id=v_uid and created_at>now()-interval '24 hours') >= 10
    then raise exception 'Daily request limit reached'; end if;

  v_number := 'BIO-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));

  insert into public.care_orders(
    patient_id, order_number, service_type, service_name, status
  ) values (
    v_uid, v_number, v_type, v_name, 'received'
  ) returning id into v_order_id;

  insert into public.care_home_request_details(
    order_id, area, requested_date, preferred_period, phone, lat, lon
  ) values (
    v_order_id, v_area, p_requested_date, p_preferred_period, v_phone, p_lat, p_lon
  );

  insert into public.care_notifications(patient_id,title,body)
  values(
    v_uid,
    'تم استلام طلب الزيارة المنزلية',
    'تم إنشاء طلبك برقم '||v_number||'. سيتم إشعارك بعد تأكيد الموعد وإسناد الفريق.'
  );

  return v_number;
end;
$$;

revoke all on function public.care_create_home_request(
  text,text,text,date,text,text,double precision,double precision
) from public, anon;

grant execute on function public.care_create_home_request(
  text,text,text,date,text,text,double precision,double precision
) to authenticated;

create or replace function public.care_staff_home_details(p_order_number text)
returns table(
  area text,
  requested_date date,
  preferred_period text,
  phone text,
  lat double precision,
  lon double precision
)
language sql
security definer
set search_path = ''
as $$
  select
    d.area,
    d.requested_date,
    d.preferred_period,
    d.phone,
    d.lat,
    d.lon
  from public.care_orders o
  join public.care_visit_assignments a on a.order_id=o.id
  join public.care_field_staff s on s.user_id=a.staff_id
  join public.care_home_request_details d on d.order_id=o.id
  where o.order_number=p_order_number
    and a.staff_id=(select auth.uid())
    and a.active=true
    and s.active=true
    and o.service_type in ('home_lab','doctor','nursing','physio')
    and o.status not in ('completed','cancelled','ready')
$$;

revoke all on function public.care_staff_home_details(text) from public, anon;
grant execute on function public.care_staff_home_details(text) to authenticated;
