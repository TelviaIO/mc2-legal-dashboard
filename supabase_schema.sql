-- Create the calls table
create table calls (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  t_duration text, -- Stored as "2m 30s" or similar for display
  t_status text check (t_status in ('completed', 'missed', 'voicemail')),
  n_cost numeric default 0,
  t_recording_url text
);

-- Enable Row Level Security (RLS)
alter table calls enable row level security;

-- Create a policy that allows anyone to read (for the demo, usually you'd want auth)
create policy "Enable read access for all users" on calls for select using (true);

-- Insert some dummy data to start
insert into calls (created_at, t_duration, t_status, n_cost, t_recording_url) values
(now() - interval '1 hour', '2m 15s', 'completed', 0.25, 'https://www.soundhelix.com/examples/mp3/Soundhelix-Song-1.mp3'),
(now() - interval '2 hours', '0m 45s', 'missed', 0.05, null),
(now() - interval '1 day', '5m 02s', 'completed', 0.60, 'https://www.soundhelix.com/examples/mp3/Soundhelix-Song-1.mp3');
