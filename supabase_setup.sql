-- Run once in Supabase SQL Editor. Orders and notifications are inserted by a trusted server/admin only.
create table if not exists public.care_orders (
 id uuid primary key default gen_random_uuid(),
 patient_id uuid not null references auth.users(id) on delete cascade,
 order_number text not null unique,
 service_type text not null check(service_type in ('lab','home_lab','doctor','nursing','physio','virtual','radiology','referral')),
 service_name text not null,
 status text not null default 'received' check(status in ('received','confirmed','assigned','en_route','sample_collected','processing','review','completed','ready','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists care_orders_patient_created_idx on public.care_orders(patient_id,created_at desc);
alter table public.care_orders enable row level security;
drop policy if exists "Patients view own orders" on public.care_orders;
create policy "Patients view own orders" on public.care_orders for select to authenticated using (patient_id=(select auth.uid()));
revoke all on public.care_orders from anon,authenticated;
grant select on public.care_orders to authenticated;

create table if not exists public.care_notifications (
 id uuid primary key default gen_random_uuid(),
 patient_id uuid not null references auth.users(id) on delete cascade,
 title text not null,
 body text not null,
 created_at timestamptz not null default now()
);
create index if not exists care_notifications_patient_created_idx on public.care_notifications(patient_id,created_at desc);
alter table public.care_notifications enable row level security;
drop policy if exists "Patients view own notifications" on public.care_notifications;
create policy "Patients view own notifications" on public.care_notifications for select to authenticated using(patient_id=(select auth.uid()));
revoke all on public.care_notifications from anon,authenticated;
grant select on public.care_notifications to authenticated;

create table if not exists public.care_push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique,
 p256dh text not null,
 auth_key text not null,
 created_at timestamptz not null default now()
);
create index if not exists care_push_user_idx on public.care_push_subscriptions(user_id);
alter table public.care_push_subscriptions enable row level security;
drop policy if exists "Patients add own devices" on public.care_push_subscriptions;
create policy "Patients add own devices" on public.care_push_subscriptions for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists "Patients refresh own devices" on public.care_push_subscriptions;
create policy "Patients refresh own devices" on public.care_push_subscriptions for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists "Patients remove own devices" on public.care_push_subscriptions;
create policy "Patients remove own devices" on public.care_push_subscriptions for delete to authenticated using(user_id=(select auth.uid()));
revoke all on public.care_push_subscriptions from anon,authenticated;
grant insert,update,delete on public.care_push_subscriptions to authenticated;
-- Expose care_orders, care_notifications, care_push_subscriptions in Supabase Data API.
-- Backend uses service_role server-side to create/update orders and notifications and send Web Push.
-- Never embed service_role or VAPID private key in frontend files.
