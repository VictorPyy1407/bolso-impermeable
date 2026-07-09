create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  producto text,
  precio integer,
  nombre text,
  telefono text,
  departamento text,
  ciudad text,
  barrio text,
  direccion text,
  referencia text,
  maps text,
  color text,
  cantidad integer,
  observaciones text,
  estado text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  referer text,
  page_url text,
  user_agent text,
  device text,
  browser text,
  language text
);

alter table public.orders enable row level security;

drop policy if exists "Allow public order inserts" on public.orders;
create policy "Allow public order inserts"
on public.orders
for insert
to anon
with check (true);
