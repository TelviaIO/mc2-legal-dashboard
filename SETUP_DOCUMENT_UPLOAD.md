# Configuración de Subida de Documentos

## Errores Comunes

### Error 1: Bucket not found
```
StorageApiError: Bucket not found
```
**Solución**: El bucket "documents" no existe. Sigue los pasos de creación del bucket abajo.

### Error 2: Row-level security policy violation
```
StorageApiError: new row violates row-level security policy
```
**Solución**: Las políticas de seguridad están bloqueando la subida. Ejecuta el script `fix_storage_policies.sql` en el SQL Editor de Supabase.

---

## 🚀 Solución Rápida (3 pasos)

### Paso 1: Crear el Bucket
1. Ve a https://supabase.com/dashboard → Tu proyecto → **Storage**
2. Click en **"New bucket"**
3. Nombre: `documents`
4. ✅ **Marca "Public bucket"**
5. Click "Create bucket"

### Paso 2: Configurar Políticas de Seguridad
1. Ve a **SQL Editor** en Supabase
2. Click en **"New query"**
3. Copia y pega TODO el contenido del archivo **`fix_storage_policies.sql`**
4. Click en **"Run"** o presiona F5

### Paso 3: Ejecutar Migración de Base de Datos
1. En el mismo **SQL Editor**
2. Copia y pega el contenido de **`supabase_add_document_type.sql`**
3. Click en **"Run"**

**¡Listo!** Recarga la app y prueba subir un documento.

---

## Solución Detallada: Configurar Supabase Storage

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
