-- Add completed_at column to tasks table
alter table tasks
add column if not exists completed_at timestamp with time zone;

-- Add index for faster queries on completed tasks
create index if not exists idx_tasks_completed_at on tasks(completed_at);
