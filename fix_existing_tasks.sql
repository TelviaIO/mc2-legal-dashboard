-- Este script asegura que todas las tareas existentes sin completed_at lo tengan como NULL
-- para que se muestren en la vista de tareas pendientes

-- Primero, agregar la columna si no existe (ya deberíamos tenerla)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Asegurar que todas las tareas existentes que no tienen completed_at lo tengan como NULL
-- (esto es redundante pero garantiza que se muestren)
UPDATE tasks
SET completed_at = NULL
WHERE completed_at IS NULL;

-- Verificar cuántas tareas tenemos
SELECT
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN completed_at IS NULL THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_tasks
FROM tasks;
