-- Add outcome column
alter table calls add column outcome text;

-- Update existing dummy data with some outcomes
update calls set outcome = 'no_reconoce_deuda' where id in (select id from calls limit 1);
update calls set outcome = 'no_localizado' where id in (select id from calls offset 1 limit 1);
update calls set outcome = 'acepta_pagar' where id in (select id from calls offset 2 limit 1);

-- Insert new dummy data for each case
insert into calls (t_duration, t_status, n_cost, outcome, created_at) values
('3m 10s', 'completed', 0.40, 'acepta_pagar_parte', now() - interval '30 minutes'),
('1m 05s', 'completed', 0.15, 'no_reconoce_deuda', now() - interval '4 hours'),
('0m 20s', 'missed', 0.05, 'no_localizado', now() - interval '1 day'),
('5m 00s', 'completed', 0.80, 'acepta_pagar', now() - interval '2 days'),
('0m 10s', 'completed', 0.10, 'cuelga_antes', now() - interval '3 hours'),
('2m 45s', 'completed', 0.35, 'enfadado', now() - interval '5 hours');
