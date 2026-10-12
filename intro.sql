create table if not exists public.app_intro_settings (
 id integer primary key default 1 check (id = 1),
 enabled boolean not null default false,
 video_path text,
 show_skip boolean not null default true,
 frequency text not null default 'session' check (frequency in ('always','session','daily')),
 max_seconds integer check (max_seconds between 1 and 60),
 updated_at timestamptz not null default now()
);
insert into public.app_intro_settings(id) values (1) on conflict do nothing;
alter table public.app_intro_settings enable row level security;
create policy "Public read intro settings" on public.app_intro_settings for select using (true);
-- Writes must occur only through a server endpoint validating administrator identity.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('intro-videos','intro-videos',true,52428800,array['video/mp4','video/webm']) on conflict (id) do nothing;
create policy "Public view intro videos" on storage.objects for select using (bucket_id='intro-videos');
-- Upload/delete requires an authenticated admin server endpoint (service role), never a public client.
