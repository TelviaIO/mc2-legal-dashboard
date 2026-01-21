-- Create messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sender text check (sender in ('user', 'agency')),
  text text not null
);

-- Create documents table
create table documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  url text
);

-- Enable RLS
alter table messages enable row level security;
alter table documents enable row level security;

-- Create policies (open access for demo)
create policy "Enable read access for all users" on messages for select using (true);
create policy "Enable insert access for all users" on messages for insert with check (true);

create policy "Enable read access for all users" on documents for select using (true);
create policy "Enable insert access for all users" on documents for insert with check (true);

-- Insert dummy data
insert into messages (created_at, sender, text) values
(now() - interval '1 day', 'agency', 'Bienvenido a MC2 Legal. ¿En qué podemos ayudarte hoy?'),
(now() - interval '2 hours', 'user', 'Hola, necesito revisar la campaña de ayer.');

insert into documents (name, url) values
('Guía de Estilo.pdf', '#'),
('Contrato Servicio.pdf', '#');
