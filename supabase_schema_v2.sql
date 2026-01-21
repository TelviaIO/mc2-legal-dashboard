-- Add author_name column
alter table messages add column author_name text;

-- Allow update and delete (Simulating RLS for demo - in prod specific user checks would apply)
create policy "Enable update for all users" on messages for update using (true) with check (true);
create policy "Enable delete for all users" on messages for delete using (true);
