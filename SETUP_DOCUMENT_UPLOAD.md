# Configuración de Subida de Documentos

## Error Actual
```
StorageApiError: Bucket not found
```

Este error ocurre porque el bucket de almacenamiento "documents" no existe en Supabase.

## Solución: Configurar Supabase Storage

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. **Ir a Storage**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto
   - En el menú lateral, haz clic en "Storage"

2. **Crear el Bucket**
   - Haz clic en "New bucket"
   - Nombre: `documents`
   - Public bucket: ✅ **SÍ** (marca esta opción)
   - Haz clic en "Create bucket"

3. **Configurar Políticas de Acceso** (Si es necesario)
   - Selecciona el bucket "documents"
   - Ve a "Policies"
   - Asegúrate de que las políticas permitan:
     - ✅ INSERT (para subir archivos)
     - ✅ SELECT (para leer/descargar archivos)
     - ✅ DELETE (para eliminar archivos)

### Opción 2: Usando SQL (Desde el SQL Editor)

Ve al SQL Editor de Supabase y ejecuta:

```sql
-- Crear el bucket de documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura pública
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Política: Permitir subida para todos (o autenticados si prefieres)
DROP POLICY IF EXISTS "Allow upload for all users" ON storage.objects;
CREATE POLICY "Allow upload for all users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Política: Permitir eliminación para todos (o autenticados si prefieres)
DROP POLICY IF EXISTS "Allow delete for all users" ON storage.objects;
CREATE POLICY "Allow delete for all users"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');
```

### Opción 3: Usando Supabase CLI

```bash
# Crear el bucket desde la línea de comandos
supabase storage create documents --public
```

## Ejecutar la Migración de Base de Datos

También necesitas ejecutar el script de migración para agregar el campo `type` a la tabla `documents`:

```sql
-- Desde el SQL Editor de Supabase, ejecuta:
ALTER TABLE documents ADD COLUMN IF NOT EXISTS type text
  CHECK (type IN ('url', 'file'))
  DEFAULT 'url';

-- Actualizar documentos existentes
UPDATE documents SET type = 'url' WHERE type IS NULL;
```

O simplemente ejecuta todo el archivo `supabase_add_document_type.sql` que está en la raíz del proyecto.

## Verificación

Una vez configurado:

1. Recarga la aplicación
2. Ve a "Documentos Importantes"
3. Haz clic en "Añadir documento"
4. Selecciona "Subir Archivo"
5. Elige un archivo y dale un nombre
6. Haz clic en "Guardar"

¡Debería funcionar sin errores!

## Tipos de Archivo Soportados

- **Documentos**: PDF, DOC, DOCX, TXT
- **Imágenes**: JPG, JPEG, PNG, GIF

## Notas de Seguridad

Si quieres restringir las subidas solo a usuarios autenticados, cambia las políticas SQL:

```sql
-- Solo usuarios autenticados pueden subir
DROP POLICY IF EXISTS "Allow upload for all users" ON storage.objects;
CREATE POLICY "Allow upload for authenticated users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
```
