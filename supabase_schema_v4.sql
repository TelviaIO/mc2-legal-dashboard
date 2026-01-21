-- Add new columns for enhanced call tracking
alter table calls add column phone_number text;
alter table calls add column agent_id text;
alter table calls add column t_summary text;

-- Optional: Update some dummy data (if you want to see values in future)
update calls set phone_number = '+34 600 000 000', agent_id = 'Agente 1', t_summary = 'Resumen de prueba' where id in (select id from calls limit 3);
