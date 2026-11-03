-- =====================================================================
-- Couple Zone: jedwali la "Bedroom Time" (picha + majina)
-- Endesha kwenye Supabase -> SQL Editor. Salama kuendesha mara nyingi.
-- Picha ziko: bucket 'couple-zone-images', folda 'bedroom'.
-- =====================================================================

create table if not exists public.bedroom_time (
  id          bigint generated always as identity primary key,
  name_en     text not null,
  name_sw     text,
  image_path  text not null unique,      -- mfano: bedroom/picha1.png
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.bedroom_time enable row level security;

-- Wote walioingia wanasoma
drop policy if exists "bedroom_time read" on public.bedroom_time;
create policy "bedroom_time read" on public.bedroom_time
  for select to authenticated using (true);

-- Wewe tu (admin) unaweza kubadilisha majina.
-- BADILISHA email hapa chini (mara 2) iwe email unayotumia kuingia kwenye app.
drop policy if exists "bedroom_time admin update" on public.bedroom_time;
create policy "bedroom_time admin update" on public.bedroom_time
  for update to authenticated
  using      (lower(auth.jwt()->>'email') = lower('saididd2607@gmail.com'))
  with check (lower(auth.jwt()->>'email') = lower('saididd2607@gmail.com'));

-- Futa rows za zamani za folda 'romance' (kama ulishaendesha toleo la kwanza)
delete from public.bedroom_time where image_path like 'romance/%';

-- Ingiza picha zote za folda 'bedroom' kiotomatiki
insert into public.bedroom_time (name_en, name_sw, image_path, sort_order)
select
  regexp_replace(split_part(o.name, '/', 2), '\.(png|jpe?g|webp)$', '', 'i'),
  regexp_replace(split_part(o.name, '/', 2), '\.(png|jpe?g|webp)$', '', 'i'),
  o.name,
  row_number() over (order by o.name)
from storage.objects o
where o.bucket_id = 'couple-zone-images'
  and o.name like 'bedroom/%'
  and o.name ~* '\.(png|jpe?g|webp)$'
on conflict (image_path) do nothing;

-- Angalia: inapaswa kuonyesha 63
select count(*) as picha from public.bedroom_time;
