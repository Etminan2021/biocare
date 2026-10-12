-- Biocare Super Admin v2
-- Run AFTER the previous Admin/CMS SQL.

alter table public.care_service_settings add column if not exists price_text text;
alter table public.care_service_settings add column if not exists hours_text text;
alter table public.care_service_settings add column if not exists sort_order integer not null default 0;

insert into public.care_service_settings(service_key,title,enabled,sort_order) values
('tests','التحاليل',true,10),('packages','الباقات',true,20),('booking','الحجز',true,30),
('results','النتائج',true,40),('profile','حساب العميل',true,50),('instant_chat','المحادثة الفورية',true,60)
on conflict(service_key) do nothing;

insert into public.care_app_settings(setting_key,setting_value,is_public) values
('app_name_ar','مختبرات بيوكير الطبية',true),('logo_url','',true),('whatsapp_number','966567669779',true),
('consultation_url','',true),('instagram_url','',true),('tiktok_url','',true),('snapchat_url','',true),
('facebook_url','',true),('maintenance_enabled','false',true)
on conflict(setting_key) do nothing;

alter table public.care_catalog_overrides add column if not exists english_name_override text;
alter table public.care_catalog_overrides add column if not exists category_override text;
alter table public.care_catalog_overrides add column if not exists fasting_override text;
alter table public.care_catalog_overrides add column if not exists description_override text;
alter table public.care_catalog_overrides add column if not exists components_override jsonb;
alter table public.care_catalog_overrides add column if not exists note_override text;

create table if not exists public.care_branches(
 branch_key text primary key,
 name text not null,
 address text,
 maps_url text,
 phone text,
 hours_regular text,
 hours_friday text,
 active boolean not null default true,
 sort_order integer not null default 0,
 updated_at timestamptz not null default now()
);

insert into public.care_branches(branch_key,name,address,hours_regular,hours_friday,active,sort_order) values
('jazan-airport','جازان – طريق الأمير سلطان (المطار)','طريق الأمير سلطان – المطار','السبت–الخميس 8 ص–12 منتصف الليل','الجمعة 4 م–12 منتصف الليل',true,10),
('abu-arish','أبو عريش','أبو عريش','السبت–الخميس 8 ص–12 منتصف الليل','الجمعة 4 م–12 منتصف الليل',true,20),
('sabya-king-fahd','صبيا – طريق الملك فهد','طريق الملك فهد','السبت–الخميس 8 ص–12 منتصف الليل','الجمعة 4 م–12 منتصف الليل',true,30),
('sabya-king-abdullah','صبيا – طريق الملك عبدالله (بجوار الطيري)','طريق الملك عبدالله – بجوار الطيري','السبت–الخميس 8 ص–12 منتصف الليل','الجمعة 4 م–12 منتصف الليل',true,40),
('addayer','الداير','الداير','السبت–الخميس 8 ص–11 م','الجمعة 4 م–11 م',true,50)
on conflict(branch_key) do nothing;

create table if not exists public.care_virtual_specialties(
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 active boolean not null default true,
 sort_order integer not null default 0,
 updated_at timestamptz not null default now()
);

insert into public.care_virtual_specialties(name,sort_order)
select x.name,x.ord from (values
('طب الأسرة',10),('الطب الباطني',20),('طب الأطفال',30),('النساء والولادة',40),('القلب',50),
('الجلدية',60),('العظام',70),('الأنف والأذن والحنجرة',80),('العيون',90),('المخ والأعصاب',100),
('الطب النفسي',110),('المسالك البولية',120),('الجهاز الهضمي',130),('الغدد الصماء',140),
('الصدرية',150),('الروماتيزم',160),('الكلى',170),('الأمراض المعدية',180),('التغذية العلاجية',190),
('العلاج الطبيعي',200),('طب الأسنان',210),('الجراحة العامة',220),('جراحة التجميل',230),
('الطب الرياضي',240),('الأورام',250),('أمراض الدم',260),('الحساسية والمناعة',270),
('طب الشيخوخة',280),('طب الألم',290),('طب النوم',300)
) as x(name,ord)
on conflict(name) do nothing;

create table if not exists public.care_virtual_providers(
 id uuid primary key default gen_random_uuid(),
 specialty_id uuid not null references public.care_virtual_specialties(id) on delete cascade,
 name text not null,
 title text,
 bio text,
 booking_url text,
 image_url text,
 active boolean not null default true,
 sort_order integer not null default 0,
 updated_at timestamptz not null default now()
);

create table if not exists public.care_catalog_custom(
 item_type text not null check(item_type in ('test','package')),
 item_id text not null,
 name text not null,
 en_name text,
 category text,
 price numeric,
 fasting text,
 description text,
 components jsonb not null default '[]'::jsonb,
 note text,
 active boolean not null default true,
 sort_order integer not null default 0,
 updated_at timestamptz not null default now(),
 primary key(item_type,item_id)
);

create table if not exists public.care_broadcasts(
 id uuid primary key default gen_random_uuid(),
 sender_id uuid references auth.users(id) on delete set null,
 target text not null,
 target_email text,
 title text not null,
 body text not null,
 sent_count integer not null default 0,
 created_at timestamptz not null default now()
);

create table if not exists public.care_admin_audit(
 id bigint generated by default as identity primary key,
 admin_id uuid references auth.users(id) on delete set null,
 action text not null,
 entity_type text not null,
 entity_id text,
 details jsonb,
 created_at timestamptz not null default now()
);

alter table public.care_branches enable row level security;
alter table public.care_virtual_specialties enable row level security;
alter table public.care_virtual_providers enable row level security;
alter table public.care_catalog_custom enable row level security;
alter table public.care_broadcasts enable row level security;
alter table public.care_admin_audit enable row level security;

revoke all on public.care_branches,public.care_virtual_specialties,public.care_virtual_providers,
 public.care_catalog_custom,public.care_broadcasts,public.care_admin_audit from anon,authenticated;

create or replace function public.care_public_services_v2()
returns table(service_key text,title text,enabled boolean,note text,price_text text,hours_text text,sort_order integer)
language sql security definer stable set search_path=''
as $$ select service_key,title,enabled,note,price_text,hours_text,sort_order from public.care_service_settings order by sort_order,title $$;

create or replace function public.care_public_branches()
returns setof public.care_branches
language sql security definer stable set search_path=''
as $$ select * from public.care_branches where active=true order by sort_order,name $$;

create or replace function public.care_public_virtual_specialties()
returns setof public.care_virtual_specialties
language sql security definer stable set search_path=''
as $$ select * from public.care_virtual_specialties where active=true order by sort_order,name $$;

create or replace function public.care_public_virtual_providers()
returns table(id uuid,specialty_id uuid,name text,title text,bio text,booking_url text,image_url text,active boolean,sort_order integer)
language sql security definer stable set search_path=''
as $$ select id,specialty_id,name,title,bio,booking_url,image_url,active,sort_order from public.care_virtual_providers where active=true order by sort_order,name $$;

create or replace function public.care_public_catalog_custom()
returns table(item_type text,item_id text,name text,en_name text,category text,price numeric,fasting text,description text,components jsonb,note text,active boolean,sort_order integer)
language sql security definer stable set search_path=''
as $$ select item_type,item_id,name,en_name,category,price,fasting,description,components,note,active,sort_order from public.care_catalog_custom where active=true order by sort_order,name $$;

grant execute on function public.care_public_services_v2() to anon,authenticated;
grant execute on function public.care_public_branches() to anon,authenticated;
grant execute on function public.care_public_virtual_specialties() to anon,authenticated;
grant execute on function public.care_public_virtual_providers() to anon,authenticated;
grant execute on function public.care_public_catalog_custom() to anon,authenticated;

create or replace function public.care_admin_dashboard_v2()
returns jsonb
language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 return jsonb_build_object(
 'total_orders',(select count(*) from public.care_orders),
 'open_home_orders',(select count(*) from public.care_orders where service_type in ('home_lab','doctor','nursing','physio') and status not in ('completed','cancelled','ready')),
 'customers',(select count(*) from auth.users u where not exists(select 1 from public.care_field_staff s where s.user_id=u.id)),
 'active_staff',(select count(*) from public.care_field_staff where active=true),
 'active_content',(select count(*) from public.care_app_content where active=true),
 'active_branches',(select count(*) from public.care_branches where active=true),
 'active_specialties',(select count(*) from public.care_virtual_specialties where active=true),
 'custom_catalog',(select count(*) from public.care_catalog_custom where active=true)
 );
end $$;

create or replace function public.care_admin_users_list()
returns table(user_id uuid,email text,created_at timestamptz,last_sign_in_at timestamptz,is_staff boolean,role text)
language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 return query select u.id,u.email::text,u.created_at,u.last_sign_in_at,(s.user_id is not null),s.role
 from auth.users u left join public.care_field_staff s on s.user_id=u.id order by u.created_at desc;
end $$;

create or replace function public.care_admin_assign_order_v2(p_order_number text,p_staff_id uuid)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_order uuid;v_patient uuid;v_status text;
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 select id,patient_id,status into v_order,v_patient,v_status from public.care_orders where order_number=p_order_number;
 if v_order is null then raise exception 'Order not found'; end if;
 if p_staff_id is null then
   update public.care_visit_assignments set active=false where order_id=v_order;
   update public.care_team_locations set active=false,updated_at=now() where order_id=v_order;
   if v_status='assigned' then update public.care_orders set status='confirmed',updated_at=now() where id=v_order; end if;
   return true;
 end if;
 if not exists(select 1 from public.care_field_staff where user_id=p_staff_id and active=true) then raise exception 'Staff not active'; end if;
 insert into public.care_visit_assignments(order_id,staff_id,active) values(v_order,p_staff_id,true)
 on conflict(order_id) do update set staff_id=excluded.staff_id,active=true,created_at=now();
 update public.care_orders set status='assigned',updated_at=now() where id=v_order and status in ('received','confirmed','assigned');
 insert into public.care_notifications(patient_id,title,body) values(v_patient,'تم إسناد فريق الزيارة','تم إسناد فريق الزيارة لطلبك رقم '||p_order_number||'.');
 return true;
end $$;

create or replace function public.care_admin_branches_list()
returns setof public.care_branches language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; return query select * from public.care_branches order by sort_order,name; end $$;

create or replace function public.care_admin_upsert_branch(
 p_branch_key text,p_name text,p_address text,p_maps_url text,p_phone text,p_hours_regular text,p_hours_friday text,p_active boolean,p_sort_order integer
) returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if length(trim(p_branch_key))<2 or length(trim(p_name))<2 then raise exception 'Invalid branch'; end if;
 insert into public.care_branches(branch_key,name,address,maps_url,phone,hours_regular,hours_friday,active,sort_order,updated_at)
 values(trim(p_branch_key),trim(p_name),p_address,p_maps_url,p_phone,p_hours_regular,p_hours_friday,p_active,coalesce(p_sort_order,0),now())
 on conflict(branch_key) do update set name=excluded.name,address=excluded.address,maps_url=excluded.maps_url,phone=excluded.phone,hours_regular=excluded.hours_regular,hours_friday=excluded.hours_friday,active=excluded.active,sort_order=excluded.sort_order,updated_at=now();
 return true;
end $$;

create or replace function public.care_admin_virtual_specialties_list()
returns setof public.care_virtual_specialties language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; return query select * from public.care_virtual_specialties order by sort_order,name; end $$;

create or replace function public.care_admin_virtual_providers_list()
returns table(id uuid,specialty_id uuid,specialty_name text,name text,title text,bio text,booking_url text,image_url text,active boolean,sort_order integer)
language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 return query select p.id,p.specialty_id,s.name,p.name,p.title,p.bio,p.booking_url,p.image_url,p.active,p.sort_order
 from public.care_virtual_providers p join public.care_virtual_specialties s on s.id=p.specialty_id order by p.sort_order,p.name;
end $$;

create or replace function public.care_admin_upsert_virtual_specialty(p_id uuid,p_name text,p_active boolean,p_sort_order integer)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid:=coalesce(p_id,gen_random_uuid());
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 insert into public.care_virtual_specialties(id,name,active,sort_order,updated_at) values(v_id,trim(p_name),p_active,coalesce(p_sort_order,0),now())
 on conflict(id) do update set name=excluded.name,active=excluded.active,sort_order=excluded.sort_order,updated_at=now();
 return v_id;
end $$;

create or replace function public.care_admin_upsert_virtual_provider(
 p_id uuid,p_specialty_id uuid,p_name text,p_title text,p_bio text,p_booking_url text,p_image_url text,p_active boolean,p_sort_order integer
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid:=coalesce(p_id,gen_random_uuid());
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 insert into public.care_virtual_providers(id,specialty_id,name,title,bio,booking_url,image_url,active,sort_order,updated_at)
 values(v_id,p_specialty_id,trim(p_name),p_title,p_bio,p_booking_url,p_image_url,p_active,coalesce(p_sort_order,0),now())
 on conflict(id) do update set specialty_id=excluded.specialty_id,name=excluded.name,title=excluded.title,bio=excluded.bio,booking_url=excluded.booking_url,image_url=excluded.image_url,active=excluded.active,sort_order=excluded.sort_order,updated_at=now();
 return v_id;
end $$;

create or replace function public.care_admin_delete_virtual_provider(p_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; delete from public.care_virtual_providers where id=p_id; return true; end $$;

create or replace function public.care_admin_custom_catalog_list()
returns setof public.care_catalog_custom language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; return query select * from public.care_catalog_custom order by sort_order,name; end $$;

create or replace function public.care_admin_upsert_custom_catalog(
 p_item_type text,p_item_id text,p_name text,p_en_name text,p_category text,p_price numeric,p_fasting text,p_description text,p_components jsonb,p_note text,p_active boolean,p_sort_order integer
) returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if p_item_type not in ('test','package') or length(trim(p_item_id))<2 or length(trim(p_name))<2 then raise exception 'Invalid catalog item'; end if;
 insert into public.care_catalog_custom(item_type,item_id,name,en_name,category,price,fasting,description,components,note,active,sort_order,updated_at)
 values(p_item_type,trim(p_item_id),trim(p_name),p_en_name,p_category,p_price,p_fasting,p_description,coalesce(p_components,'[]'::jsonb),p_note,p_active,coalesce(p_sort_order,0),now())
 on conflict(item_type,item_id) do update set name=excluded.name,en_name=excluded.en_name,category=excluded.category,price=excluded.price,fasting=excluded.fasting,description=excluded.description,components=excluded.components,note=excluded.note,active=excluded.active,sort_order=excluded.sort_order,updated_at=now();
 return true;
end $$;

create or replace function public.care_admin_delete_custom_catalog(p_item_type text,p_item_id text)
returns boolean language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; delete from public.care_catalog_custom where item_type=p_item_type and item_id=p_item_id; return true; end $$;

create or replace function public.care_admin_upsert_catalog_override_v2(
 p_item_type text,p_item_id text,p_active boolean,p_display_name text,p_english_name text,p_category text,p_price_override numeric,p_fasting text,p_description text,p_components jsonb,p_note text
) returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if p_item_type not in ('test','package') then raise exception 'Invalid item type'; end if;
 insert into public.care_catalog_overrides(item_type,item_id,active,display_name,english_name_override,category_override,price_override,fasting_override,description_override,components_override,note_override,updated_at)
 values(p_item_type,p_item_id,p_active,p_display_name,p_english_name,p_category,p_price_override,p_fasting,p_description,p_components,p_note,now())
 on conflict(item_type,item_id) do update set active=excluded.active,display_name=excluded.display_name,english_name_override=excluded.english_name_override,category_override=excluded.category_override,price_override=excluded.price_override,fasting_override=excluded.fasting_override,description_override=excluded.description_override,components_override=excluded.components_override,note_override=excluded.note_override,updated_at=now();
 return true;
end $$;

create or replace function public.care_admin_service_list_v2()
returns setof public.care_service_settings language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; return query select * from public.care_service_settings order by sort_order,title; end $$;

create or replace function public.care_admin_set_service_v2(p_service_key text,p_enabled boolean,p_note text,p_price_text text,p_hours_text text,p_sort_order integer)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 update public.care_service_settings set enabled=p_enabled,note=p_note,price_text=p_price_text,hours_text=p_hours_text,sort_order=coalesce(p_sort_order,0),updated_at=now() where service_key=p_service_key;
 if not found then raise exception 'Unknown service'; end if;
 return true;
end $$;

create or replace function public.care_admin_send_broadcast(p_target text,p_email text,p_title text,p_body text)
returns integer language plpgsql security definer set search_path=''
as $$
declare v_count integer:=0;
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if p_target not in ('customers','all','email') then raise exception 'Invalid target'; end if;
 if length(trim(p_title))<2 or length(trim(p_body))<2 then raise exception 'Invalid message'; end if;
 if p_target='email' then
   insert into public.care_notifications(patient_id,title,body)
   select id,p_title,p_body from auth.users where lower(email)=lower(trim(p_email));
 elsif p_target='customers' then
   insert into public.care_notifications(patient_id,title,body)
   select u.id,p_title,p_body from auth.users u where not exists(select 1 from public.care_field_staff s where s.user_id=u.id);
 else
   insert into public.care_notifications(patient_id,title,body) select id,p_title,p_body from auth.users;
 end if;
 get diagnostics v_count = row_count;
 insert into public.care_broadcasts(sender_id,target,target_email,title,body,sent_count) values(auth.uid(),p_target,p_email,p_title,p_body,v_count);
 return v_count;
end $$;

create or replace function public.care_admin_broadcast_list()
returns table(id uuid,target text,target_email text,title text,body text,sent_count integer,created_at timestamptz)
language plpgsql security definer set search_path=''
as $$ begin if not public.care_is_admin() then raise exception 'Admin access required'; end if; return query select b.id,b.target,b.target_email,b.title,b.body,b.sent_count,b.created_at from public.care_broadcasts b order by b.created_at desc limit 100; end $$;

create or replace function public.care_admin_audit_trigger()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_row jsonb;v_id text;
begin
 if not public.care_is_admin() then return coalesce(new,old); end if;
 v_row:=case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 v_id:=coalesce(v_row->>'id',v_row->>'order_number',v_row->>'user_id',v_row->>'setting_key',v_row->>'service_key',v_row->>'branch_key',v_row->>'item_id','');
 insert into public.care_admin_audit(admin_id,action,entity_type,entity_id,details)
 values(auth.uid(),TG_OP,TG_TABLE_NAME,v_id,jsonb_build_object('row',v_row));
 return coalesce(new,old);
end $$;

do $$
declare t text;
begin
 foreach t in array array['care_orders','care_visit_assignments','care_field_staff','care_app_content','care_service_settings','care_app_settings','care_catalog_overrides','care_branches','care_virtual_specialties','care_virtual_providers','care_catalog_custom']
 loop
   execute format('drop trigger if exists care_admin_audit_%I on public.%I',t,t);
   execute format('create trigger care_admin_audit_%I after insert or update or delete on public.%I for each row execute function public.care_admin_audit_trigger()',t,t);
 end loop;
end $$;

create or replace function public.care_admin_audit_list(p_limit integer default 200)
returns table(id bigint,admin_email text,action text,entity_type text,entity_id text,created_at timestamptz)
language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 return query select a.id,u.email::text,a.action,a.entity_type,a.entity_id,a.created_at
 from public.care_admin_audit a left join auth.users u on u.id=a.admin_id order by a.created_at desc limit least(greatest(p_limit,1),500);
end $$;

grant execute on function public.care_admin_dashboard_v2() to authenticated;
grant execute on function public.care_admin_users_list() to authenticated;
grant execute on function public.care_admin_assign_order_v2(text,uuid) to authenticated;
grant execute on function public.care_admin_branches_list() to authenticated;
grant execute on function public.care_admin_upsert_branch(text,text,text,text,text,text,text,boolean,integer) to authenticated;
grant execute on function public.care_admin_virtual_specialties_list() to authenticated;
grant execute on function public.care_admin_virtual_providers_list() to authenticated;
grant execute on function public.care_admin_upsert_virtual_specialty(uuid,text,boolean,integer) to authenticated;
grant execute on function public.care_admin_upsert_virtual_provider(uuid,uuid,text,text,text,text,text,boolean,integer) to authenticated;
grant execute on function public.care_admin_delete_virtual_provider(uuid) to authenticated;
grant execute on function public.care_admin_custom_catalog_list() to authenticated;
grant execute on function public.care_admin_upsert_custom_catalog(text,text,text,text,text,numeric,text,text,jsonb,text,boolean,integer) to authenticated;
grant execute on function public.care_admin_delete_custom_catalog(text,text) to authenticated;
grant execute on function public.care_admin_upsert_catalog_override_v2(text,text,boolean,text,text,text,numeric,text,text,jsonb,text) to authenticated;
grant execute on function public.care_admin_service_list_v2() to authenticated;
grant execute on function public.care_admin_set_service_v2(text,boolean,text,text,text,integer) to authenticated;
grant execute on function public.care_admin_send_broadcast(text,text,text,text) to authenticated;
grant execute on function public.care_admin_broadcast_list() to authenticated;
grant execute on function public.care_admin_audit_list(integer) to authenticated;

drop policy if exists "care media admin select" on storage.objects;
create policy "care media admin select" on storage.objects for select to authenticated
using(bucket_id='care-media' and public.care_is_admin());
