-- Migration: add checkout/coverage fields to public.pedidos_web
-- Run this in the Supabase SQL Editor BEFORE deploying the new checkout flow.
-- Safe to re-run (all statements are IF NOT EXISTS / idempotent).

alter table public.pedidos_web
  add column if not exists delivery_type text default 'contra_entrega';

alter table public.pedidos_web
  add column if not exists payment_type text default 'contra_entrega';

alter table public.pedidos_web
  add column if not exists selected_city text;

alter table public.pedidos_web
  add column if not exists selected_department text;

alter table public.pedidos_web
  add column if not exists delivery_cost integer default 0;

alter table public.pedidos_web
  add column if not exists delivery_estimate text default '24 a 72 horas';

alter table public.pedidos_web
  add column if not exists order_total integer default 0;

alter table public.pedidos_web
  add column if not exists utm_source text;

alter table public.pedidos_web
  add column if not exists utm_medium text;

alter table public.pedidos_web
  add column if not exists utm_campaign text;

alter table public.pedidos_web
  add column if not exists utm_content text;

alter table public.pedidos_web
  add column if not exists utm_term text;

alter table public.pedidos_web
  add column if not exists traffic_source text;

alter table public.pedidos_web
  add column if not exists device_type text;
