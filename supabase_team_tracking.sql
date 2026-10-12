
-- Biocare live visit tracking: execute as project database owner.
create table if not exists public.care_field_staff(
 user_id uuid primary key references auth.users(id) on delete cascade,
 active boolean not null default true
);
create table if not exists public.care_visit_assignments(
 order_id uuid primary key references public.care_orders(id) on delete cascade,
 staff_id uuid not null references public.care_field_staff(user_id),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.care_team_locations(
 order_id uuid primary key references public.care_orders(id) on delete cascade,
 lat double precision not null check(lat between -90 and 90),
 lon double precision not null check(lon between -180 and 180),
 updated_at timestamptz not null default now(),
 active boolean not null default true
);
create index if not exists care_assignments_staff_idx on public.care_visit_assignments(staff_id);
alter table public.care_field_staff enable row level security;
alter table public.care_visit_assignments enable row level security;
alter table public.care_team_locations enable row level security;
revoke all on public.care_field_staff,public.care_visit_assignments,public.care_team_locations from anon,authenticated;
-- No direct client access; all authorization is checked by the functions below.

create or replace function public.care_staff_orders()
returns table(order_number text,service_name text,active boolean)
language sql security definer set search_path=''
as $$
 select o.order_number,o.service_name,a.active
 from public.care_visit_assignments a
 join public.care_orders o on o.id=a.order_id
 join public.care_field_staff s on s.user_id=a.staff_id
 where a.staff_id=(select auth.uid()) and s.active=true
 and o.service_type in ('home_lab','doctor','nursing','physio')
 and o.status not in ('completed','cancelled','ready')
 order by a.created_at desc
$$;
create or replace function public.care_staff_location(
 p_order_number text,p_lat double precision,p_lon double precision,p_active boolean
) returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_order_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if p_active and (p_lat is null or p_lon is null or p_lat not between -90 and 90 or p_lon not between -180 and 180)
 then raise exception 'Invalid coordinates';end if;
 select o.id into v_order_id
 from public.care_orders o
 join public.care_visit_assignments a on a.order_id=o.id
 join public.care_field_staff s on s.user_id=a.staff_id
 where o.order_number=p_order_number and a.staff_id=auth.uid()
 and a.active=true and s.active=true
 and o.service_type in ('home_lab','doctor','nursing','physio')
 and o.status not in ('completed','cancelled','ready');
 if v_order_id is null then raise exception 'Visit not assigned';end if;
 insert into public.care_team_locations(order_id,lat,lon,updated_at,active)
 values(v_order_id,coalesce(p_lat,0),coalesce(p_lon,0),now(),p_active)
 on conflict(order_id) do update set
 lat=excluded.lat,lon=excluded.lon,updated_at=now(),active=excluded.active;
 return true;
end;
$$;
create or replace function public.care_patient_team_location(p_order_number text)
returns table(lat double precision,lon double precision,updated_at timestamptz,active boolean)
language sql security definer set search_path=''
as $$
 select l.lat,l.lon,l.updated_at,l.active
 from public.care_orders o
 join public.care_visit_assignments a on a.order_id=o.id
 join public.care_field_staff s on s.user_id=a.staff_id
 join public.care_team_locations l on l.order_id=o.id
 where o.order_number=p_order_number and o.patient_id=(select auth.uid())
 and o.service_type in ('home_lab','doctor','nursing','physio')
 and o.status not in ('completed','cancelled','ready')
 and a.active=true and s.active=true and l.active=true
 and l.updated_at>now()-interval '2 minutes'
$$;
revoke all on function public.care_staff_orders() from public,anon;
revoke all on function public.care_staff_location(text,double precision,double precision,boolean) from public,anon;
revoke all on function public.care_patient_team_location(text) from public,anon;
grant execute on function public.care_staff_orders() to authenticated;
grant execute on function public.care_staff_location(text,double precision,double precision,boolean) to authenticated;
grant execute on function public.care_patient_team_location(text) to authenticated;
-- To activate: insert staff user UUID in care_field_staff and assign an order UUID
-- in care_visit_assignments using Supabase SQL Editor (database administrator only).
