-- ==========================================
-- MC2 Legal Dashboard - Complete Schema v1.1 (Idempotent)
-- ==========================================

-- 1. CALLS Table
create table if not exists calls (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  t_duration text,
  t_status text check (t_status in ('completed', 'missed', 'voicemail')),
  n_cost numeric default 0,
  t_recording_url text
);

-- Add columns safely (Postgres 9.6+)
alter table calls add column if not exists outcome text check (outcome in ('no_reconoce_deuda', 'no_localizado', 'acepta_pagar', 'acepta_pagar_parte', 'enfadado', 'cuelga_antes', 'otro'));
alter table calls add column if not exists phone_number text;
alter table calls add column if not exists agent_id text;
alter table calls add column if not exists t_summary text;

-- 2. MESSAGES Table (Chat)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sender text check (sender in ('user', 'agency')),
  text text not null
);

alter table messages add column if not exists author_name text;

-- 3. DOCUMENTS Table
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  url text not null
);

-- ==========================================
-- Row Level Security (RLS) & Policies
-- ==========================================

-- Enable RLS (safe to run multiple times)
alter table calls enable row level security;
alter table messages enable row level security;
alter table documents enable row level security;

-- Policies: Drop first to avoid "already exists" errors, then recreate.

-- Calls
drop policy if exists "Enable read access for all users" on calls;
create policy "Enable read access for all users" on calls for select using (true);

drop policy if exists "Enable insert access for all users" on calls;
create policy "Enable insert access for all users" on calls for insert with check (true);

drop policy if exists "Enable update access for all users" on calls;
create policy "Enable update access for all users" on calls for update using (true);

-- Messages
drop policy if exists "Enable read access for all users" on messages;
create policy "Enable read access for all users" on messages for select using (true);

drop policy if exists "Enable insert access for all users" on messages;
create policy "Enable insert access for all users" on messages for insert with check (true);

drop policy if exists "Enable update access for all users" on messages;
create policy "Enable update access for all users" on messages for update using (true);

drop policy if exists "Enable delete access for all users" on messages;
create policy "Enable delete access for all users" on messages for delete using (true);

-- Documents
drop policy if exists "Enable read access for all users" on documents;
create policy "Enable read access for all users" on documents for select using (true);

drop policy if exists "Enable insert access for all users" on documents;
create policy "Enable insert access for all users" on documents for insert with check (true);

drop policy if exists "Enable delete access for all users" on documents;
create policy "Enable delete access for all users" on documents for delete using (true);

-- ==========================================
-- Dummy Data Seeds (Optional - Run if tables are empty)
-- ==========================================

-- Only insert if table is empty to avoid duplicates
insert into documents (created_at, name, url)
select now(), 'Guía de Estilo Legal.pdf', 'https://example.com/guia.pdf'
where not exists (select 1 from documents limit 1);

insert into documents (created_at, name, url)
select now(), 'Contrato Servicio v2.pdf', 'https://example.com/contrato.pdf'
where not exists (select 1 from documents limit 1);
