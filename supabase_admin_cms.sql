-- Biocare Full Admin / CMS v1
-- Run once in Supabase SQL Editor.

alter table public.care_field_staff
  add column if not exists role text not null default 'staff';

alter table public.care_field_staff
  drop constraint if exists care_field_staff_role_check;

alter table public.care_field_staff
  add constraint care_field_staff_role_check
  check (role in ('staff','admin'));

-- Make the current approved account an administrator.
update public.care_field_staff s
set role='admin', active=true
from auth.users u
where u.id=s.user_id
  and lower(u.email)='ahmedalameer001@gmail.com';

create or replace function public.care_is_admin()
returns boolean
language sql
security definer
stable
set search_path=''
as $$
  select exists(
    select 1
    from public.care_field_staff s
    where s.user_id=(select auth.uid())
      and s.active=true
      and s.role='admin'
  )
$$;

revoke all on function public.care_is_admin() from public,anon;
grant execute on function public.care_is_admin() to authenticated;

create table if not exists public.care_app_content(
  id uuid primary key default gen_random_uuid(),
  kind text not null check(kind in ('banner','ticker','video')),
  title text,
  subtitle text,
  media_url text,
  link_url text,
  button_label text,
  sort_order integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_service_settings(
  service_key text primary key,
  title text not null,
  enabled boolean not null default true,
  note text,
  updated_at timestamptz not null default now()
);

insert into public.care_service_settings(service_key,title,enabled) values
('home_care','الرعاية المنزلية',true),
('home_doctor','طبيب عام منزلي',true),
('home_nursing','تمريض منزلي',true),
('home_physio','علاج طبيعي منزلي',true),
('home_labs','تحاليل منزلية',true),
('virtual_clinic','العيادة الافتراضية',true),
('radiology','الأشعة والإحالات',true),
('saleem','سليم المساعد الصحي',true),
('consultations','الاستشارات الطبية',true)
on conflict(service_key) do nothing;

create table if not exists public.care_app_settings(
  setting_key text primary key,
  setting_value text,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.care_app_settings(setting_key,setting_value,is_public) values
('hero_title','صحتك تستحق الاطمئنان',true),
('hero_text','استعرض التحاليل والباقات والأسعار، وتعرّف على فروع مختبرات بيوكير الطبية وخدماتها.',true),
('maintenance_message','',true)
on conflict(setting_key) do nothing;

create table if not exists public.care_catalog_overrides(
  item_type text not null check(item_type in ('test','package')),
  item_id text not null,
  active boolean not null default true,
  display_name text,
  price_override numeric,
  updated_at timestamptz not null default now(),
  primary key(item_type,item_id)
);

alter table public.care_app_content enable row level security;
alter table public.care_service_settings enable row level security;
alter table public.care_app_settings enable row level security;
alter table public.care_catalog_overrides enable row level security;
revoke all on public.care_app_content,public.care_service_settings,public.care_app_settings,public.care_catalog_overrides from anon,authenticated;

-- Public read RPCs
create or replace function public.care_public_content()
returns setof public.care_app_content
language sql security definer stable set search_path=''
as $$
 select *
 from public.care_app_content
 where active=true
   and (starts_at is null or starts_at<=now())
   and (ends_at is null or ends_at>=now())
 order by sort_order,created_at
$$;

create or replace function public.care_public_services()
returns table(service_key text,enabled boolean)
language sql security definer stable set search_path=''
as $$ select service_key,enabled from public.care_service_settings $$;

create or replace function public.care_public_settings()
returns table(setting_key text,setting_value text)
language sql security definer stable set search_path=''
as $$ select setting_key,setting_value from public.care_app_settings where is_public=true $$;

create or replace function public.care_public_catalog_overrides()
returns setof public.care_catalog_overrides
language sql security definer stable set search_path=''
as $$ select * from public.care_catalog_overrides $$;

grant execute on function public.care_public_content() to anon,authenticated;
grant execute on function public.care_public_services() to anon,authenticated;
grant execute on function public.care_public_settings() to anon,authenticated;
grant execute on function public.care_public_catalog_overrides() to anon,authenticated;

-- Admin dashboard
create or replace function public.care_admin_dashboard()
returns jsonb
language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 return jsonb_build_object(
  'total_orders',(select count(*) from public.care_orders),
  'open_home_orders',(select count(*) from public.care_orders where service_type in ('home_lab','doctor','nursing','physio') and status not in ('completed','cancelled','ready')),
  'active_staff',(select count(*) from public.care_field_staff where active=true),
  'active_content',(select count(*) from public.care_app_content where active=true)
 );
end$$;

create or replace function public.care_admin_orders()
returns table(
 order_number text,service_type text,service_name text,status text,created_at timestamptz,updated_at timestamptz,
 area text,requested_date date,preferred_period text,phone text,staff_id uuid,staff_email text
)
language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 return query
 select o.order_number,o.service_type,o.service_name,o.status,o.created_at,o.updated_at,
 d.area,d.requested_date,d.preferred_period,d.phone,a.staff_id,u.email::text
 from public.care_orders o
 left join public.care_home_request_details d on d.order_id=o.id
 left join public.care_visit_assignments a on a.order_id=o.id and a.active=true
 left join auth.users u on u.id=a.staff_id
 order by o.created_at desc limit 200;
end$$;

create or replace function public.care_admin_staff_list()
returns table(user_id uuid,email text,role text,active boolean)
language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 return query select s.user_id,u.email::text,s.role,s.active
 from public.care_field_staff s join auth.users u on u.id=s.user_id order by u.email;
end$$;

create or replace function public.care_admin_upsert_staff(p_email text,p_role text,p_active boolean)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if p_role not in ('staff','admin') then raise exception 'Invalid role'; end if;
 select id into v_id from auth.users where lower(email)=lower(trim(p_email));
 if v_id is null then raise exception 'User account not found'; end if;
 if v_id=auth.uid() and (p_active=false or p_role<>'admin') then raise exception 'You cannot remove your own admin access'; end if;
 insert into public.care_field_staff(user_id,active,role) values(v_id,p_active,p_role)
 on conflict(user_id) do update set active=excluded.active,role=excluded.role;
 return v_id;
end$$;

create or replace function public.care_admin_assign_order(p_order_number text,p_staff_id uuid)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_order uuid;v_patient uuid;
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if not exists(select 1 from public.care_field_staff where user_id=p_staff_id and active=true) then raise exception 'Staff not active'; end if;
 select id,patient_id into v_order,v_patient from public.care_orders where order_number=p_order_number;
 if v_order is null then raise exception 'Order not found'; end if;
 insert into public.care_visit_assignments(order_id,staff_id,active) values(v_order,p_staff_id,true)
 on conflict(order_id) do update set staff_id=excluded.staff_id,active=true,created_at=now();
 update public.care_orders set status='assigned',updated_at=now() where id=v_order and status in ('received','confirmed','assigned');
 insert into public.care_notifications(patient_id,title,body) values(v_patient,'تم إسناد فريق الزيارة','تم إسناد فريق الزيارة لطلبك رقم '||p_order_number||'.');
 return true;
end$$;

create or replace function public.care_admin_set_order_status(p_order_number text,p_status text)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_id uuid;v_patient uuid;
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if p_status not in ('received','confirmed','assigned','en_route','arrived','sample_collected','processing','review','completed','ready','cancelled') then raise exception 'Invalid status'; end if;
 select id,patient_id into v_id,v_patient from public.care_orders where order_number=p_order_number;
 if v_id is null then raise exception 'Order not found'; end if;
 update public.care_orders set status=p_status,updated_at=now() where id=v_id;
 insert into public.care_order_events(order_id,status,actor_id) values(v_id,p_status,auth.uid());
 insert into public.care_notifications(patient_id,title,body) values(v_patient,'تحديث حالة الطلب','تم تحديث حالة طلبك رقم '||p_order_number||' إلى '||p_status||'.');
 if p_status in ('completed','cancelled','ready') then
   update public.care_visit_assignments set active=false where order_id=v_id;
   update public.care_team_locations set active=false,updated_at=now() where order_id=v_id;
 end if;
 return true;
end$$;

-- Content management
create or replace function public.care_admin_content_list()
returns setof public.care_app_content
language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; return query select * from public.care_app_content order by sort_order,created_at desc; end $$;

create or replace function public.care_admin_upsert_content(
 p_id uuid,p_kind text,p_title text,p_subtitle text,p_media_url text,p_link_url text,p_button_label text,
 p_sort_order integer,p_active boolean,p_starts_at timestamptz,p_ends_at timestamptz
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_id uuid:=coalesce(p_id,gen_random_uuid());
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if p_kind not in ('banner','ticker','video') then raise exception 'Invalid kind'; end if;
 insert into public.care_app_content(id,kind,title,subtitle,media_url,link_url,button_label,sort_order,active,starts_at,ends_at,updated_at)
 values(v_id,p_kind,p_title,p_subtitle,p_media_url,p_link_url,p_button_label,coalesce(p_sort_order,0),coalesce(p_active,true),p_starts_at,p_ends_at,now())
 on conflict(id) do update set kind=excluded.kind,title=excluded.title,subtitle=excluded.subtitle,media_url=excluded.media_url,link_url=excluded.link_url,button_label=excluded.button_label,sort_order=excluded.sort_order,active=excluded.active,starts_at=excluded.starts_at,ends_at=excluded.ends_at,updated_at=now();
 return v_id;
end$$;

create or replace function public.care_admin_delete_content(p_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; delete from public.care_app_content where id=p_id; return true; end $$;

create or replace function public.care_admin_service_list()
returns setof public.care_service_settings
language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; return query select * from public.care_service_settings order by title; end $$;

create or replace function public.care_admin_set_service(p_service_key text,p_enabled boolean,p_note text)
returns boolean language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; update public.care_service_settings set enabled=p_enabled,note=p_note,updated_at=now() where service_key=p_service_key; if not found then raise exception 'Unknown service'; end if; return true; end $$;

create or replace function public.care_admin_settings_list()
returns setof public.care_app_settings
language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; return query select * from public.care_app_settings order by setting_key; end $$;

create or replace function public.care_admin_set_setting(p_setting_key text,p_setting_value text)
returns boolean language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; update public.care_app_settings set setting_value=p_setting_value,updated_at=now() where setting_key=p_setting_key; if not found then insert into public.care_app_settings(setting_key,setting_value,is_public) values(p_setting_key,p_setting_value,true); end if; return true; end $$;

create or replace function public.care_admin_catalog_overrides()
returns setof public.care_catalog_overrides
language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; return query select * from public.care_catalog_overrides; end $$;

create or replace function public.care_admin_upsert_catalog_override(p_item_type text,p_item_id text,p_active boolean,p_display_name text,p_price_override numeric)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if p_item_type not in ('test','package') then raise exception 'Invalid item type'; end if;
 insert into public.care_catalog_overrides(item_type,item_id,active,display_name,price_override,updated_at)
 values(p_item_type,p_item_id,p_active,p_display_name,p_price_override,now())
 on conflict(item_type,item_id) do update set active=excluded.active,display_name=excluded.display_name,price_override=excluded.price_override,updated_at=now();
 return true;
end$$;

-- Grants
grant execute on function public.care_admin_dashboard() to authenticated;
grant execute on function public.care_admin_orders() to authenticated;
grant execute on function public.care_admin_staff_list() to authenticated;
grant execute on function public.care_admin_upsert_staff(text,text,boolean) to authenticated;
grant execute on function public.care_admin_assign_order(text,uuid) to authenticated;
grant execute on function public.care_admin_set_order_status(text,text) to authenticated;
grant execute on function public.care_admin_content_list() to authenticated;
grant execute on function public.care_admin_upsert_content(uuid,text,text,text,text,text,text,integer,boolean,timestamptz,timestamptz) to authenticated;
grant execute on function public.care_admin_delete_content(uuid) to authenticated;
grant execute on function public.care_admin_service_list() to authenticated;
grant execute on function public.care_admin_set_service(text,boolean,text) to authenticated;
grant execute on function public.care_admin_settings_list() to authenticated;
grant execute on function public.care_admin_set_setting(text,text) to authenticated;
grant execute on function public.care_admin_catalog_overrides() to authenticated;
grant execute on function public.care_admin_upsert_catalog_override(text,text,boolean,text,numeric) to authenticated;

-- Media storage: public read, admin upload/update/delete only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('care-media','care-media',true,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict(id) do update set public=true,file_size_limit=52428800,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "care media admin insert" on storage.objects;
drop policy if exists "care media admin update" on storage.objects;
drop policy if exists "care media admin delete" on storage.objects;

create policy "care media admin insert" on storage.objects for insert to authenticated
with check(bucket_id='care-media' and public.care_is_admin());

create policy "care media admin update" on storage.objects for update to authenticated
using(bucket_id='care-media' and public.care_is_admin())
with check(bucket_id='care-media' and public.care_is_admin());

create policy "care media admin delete" on storage.objects for delete to authenticated
using(bucket_id='care-media' and public.care_is_admin());
