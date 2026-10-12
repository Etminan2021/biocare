-- Biocare Catalog Details v3
-- Adds editable medical descriptions, benefits, requirements, specimen type and result time.
-- Run once in Supabase SQL Editor AFTER Super Admin v2.

alter table public.care_catalog_overrides add column if not exists benefits_override text;
alter table public.care_catalog_overrides add column if not exists requirements_override text;
alter table public.care_catalog_overrides add column if not exists sample_type_override text;
alter table public.care_catalog_overrides add column if not exists turnaround_time_override text;

alter table public.care_catalog_custom add column if not exists benefits text;
alter table public.care_catalog_custom add column if not exists requirements text;
alter table public.care_catalog_custom add column if not exists sample_type text;
alter table public.care_catalog_custom add column if not exists turnaround_time text;

-- The public override RPC returns SETOF the table, so the new columns are exposed automatically.
-- Recreate the custom-catalog RPC because it has an explicit return signature.
drop function if exists public.care_public_catalog_custom();
create function public.care_public_catalog_custom()
returns table(
 item_type text,item_id text,name text,en_name text,category text,price numeric,fasting text,
 description text,benefits text,requirements text,sample_type text,turnaround_time text,
 components jsonb,note text,active boolean,sort_order integer
)
language sql security definer stable set search_path=''
as $$
 select item_type,item_id,name,en_name,category,price,fasting,description,benefits,requirements,
        sample_type,turnaround_time,components,note,active,sort_order
 from public.care_catalog_custom
 where active=true
 order by sort_order,name
$$;
grant execute on function public.care_public_catalog_custom() to anon,authenticated;

create or replace function public.care_admin_upsert_catalog_override_v3(
 p_item_type text,p_item_id text,p_active boolean,p_display_name text,p_english_name text,p_category text,
 p_price_override numeric,p_fasting text,p_description text,p_benefits text,p_requirements text,
 p_sample_type text,p_turnaround_time text,p_components jsonb,p_note text
) returns boolean
language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if p_item_type not in ('test','package') then raise exception 'Invalid item type'; end if;
 insert into public.care_catalog_overrides(
   item_type,item_id,active,display_name,english_name_override,category_override,price_override,
   fasting_override,description_override,benefits_override,requirements_override,sample_type_override,
   turnaround_time_override,components_override,note_override,updated_at)
 values(
   p_item_type,p_item_id,p_active,p_display_name,p_english_name,p_category,p_price_override,
   p_fasting,p_description,p_benefits,p_requirements,p_sample_type,p_turnaround_time,p_components,p_note,now())
 on conflict(item_type,item_id) do update set
   active=excluded.active,display_name=excluded.display_name,english_name_override=excluded.english_name_override,
   category_override=excluded.category_override,price_override=excluded.price_override,
   fasting_override=excluded.fasting_override,description_override=excluded.description_override,
   benefits_override=excluded.benefits_override,requirements_override=excluded.requirements_override,
   sample_type_override=excluded.sample_type_override,turnaround_time_override=excluded.turnaround_time_override,
   components_override=excluded.components_override,note_override=excluded.note_override,updated_at=now();
 return true;
end $$;
grant execute on function public.care_admin_upsert_catalog_override_v3(text,text,boolean,text,text,text,numeric,text,text,text,text,text,text,jsonb,text) to authenticated;

create or replace function public.care_admin_upsert_custom_catalog_v3(
 p_item_type text,p_item_id text,p_name text,p_en_name text,p_category text,p_price numeric,p_fasting text,
 p_description text,p_benefits text,p_requirements text,p_sample_type text,p_turnaround_time text,
 p_components jsonb,p_note text,p_active boolean,p_sort_order integer
) returns boolean
language plpgsql security definer set search_path=''
as $$
begin
 if not public.care_is_admin() then raise exception 'Admin access required'; end if;
 if p_item_type not in ('test','package') or length(trim(p_item_id))<2 or length(trim(p_name))<2 then
   raise exception 'Invalid catalog item';
 end if;
 insert into public.care_catalog_custom(
   item_type,item_id,name,en_name,category,price,fasting,description,benefits,requirements,sample_type,
   turnaround_time,components,note,active,sort_order,updated_at)
 values(
   p_item_type,trim(p_item_id),trim(p_name),p_en_name,p_category,p_price,p_fasting,p_description,p_benefits,
   p_requirements,p_sample_type,p_turnaround_time,coalesce(p_components,'[]'::jsonb),p_note,p_active,
   coalesce(p_sort_order,0),now())
 on conflict(item_type,item_id) do update set
   name=excluded.name,en_name=excluded.en_name,category=excluded.category,price=excluded.price,
   fasting=excluded.fasting,description=excluded.description,benefits=excluded.benefits,
   requirements=excluded.requirements,sample_type=excluded.sample_type,turnaround_time=excluded.turnaround_time,
   components=excluded.components,note=excluded.note,active=excluded.active,sort_order=excluded.sort_order,
   updated_at=now();
 return true;
end $$;
grant execute on function public.care_admin_upsert_custom_catalog_v3(text,text,text,text,text,numeric,text,text,text,text,text,text,jsonb,text,boolean,integer) to authenticated;
