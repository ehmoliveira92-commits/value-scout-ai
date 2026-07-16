
create extension if not exists "pgcrypto";

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  fixture_id bigint not null,
  match text not null,
  market text not null,
  selection text not null,
  line numeric not null,
  odd numeric not null,
  score integer not null check (score between 0 and 100),
  status text not null default 'Pendente' check (status in ('Pendente','Green','Red','Void')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists signals_created_at_idx on public.signals(created_at desc);
create index if not exists signals_market_idx on public.signals(market);
create index if not exists signals_status_idx on public.signals(status);

alter table public.signals enable row level security;
-- Uso pessoal: o backend usa a service role. Não crie políticas públicas.
