-- ==========================================
-- Fix Storage Policies for Document Uploads
-- ==========================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para permitir que los usuarios suban archivos

-- 1. Habilitar RLS en storage.objects (si no está habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR todas las políticas existentes del bucket 'documents'
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload for all users" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete for all users" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- 3. CREAR políticas permisivas para permitir todas las operaciones
--    en el bucket 'documents'

-- Política: Permitir LECTURA pública (SELECT)
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Política: Permitir SUBIDA para todos (INSERT)
CREATE POLICY "Allow upload for all users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Política: Permitir ACTUALIZACIÓN para todos (UPDATE)
CREATE POLICY "Allow update for all users"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Política: Permitir ELIMINACIÓN para todos (DELETE)
CREATE POLICY "Allow delete for all users"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');

-- ==========================================
-- VERIFICACIÓN
-- ==========================================
-- Después de ejecutar, verifica que las políticas se crearon:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
