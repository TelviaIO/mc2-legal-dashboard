-- Create tasks table for Pending Items
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  text text not null,
  category text not null check (category in ('mc2', 'telvia')), -- Category to split columns
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table tasks enable row level security;

-- Create policies (Allow public access for now as per previous pattern)
create policy "Allow all access to tasks"
  on tasks for all
  using (true)
  with check (true);

-- Dummy Data (Optional, only if empty)
insert into tasks (text, category)
select 'Revisar contratos pendientes', 'mc2'
where not exists (select 1 from tasks);

insert into tasks (text, category)
select 'Configurar nuevos números', 'telvia'
where not exists (select 1 from tasks);
