# ⚠️ ERROR: "must be owner of table objects"

Si recibes este error al ejecutar `fix_storage_policies.sql`, es porque no tienes permisos para modificar directamente las políticas de Storage con SQL.

## ✅ SOLUCIÓN: Configurar desde la Interfaz

### Paso 1: Ir a Storage Policies
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, click en **Storage**
4. Click en el bucket **"documents"**
5. Click en la pestaña **"Policies"** (arriba)

### Paso 2: Crear Políticas Manualmente

Verás una lista de políticas. Vamos a crear 4 políticas:

#### Política 1: Permitir LECTURA (SELECT)
1. Click en **"New policy"**
2. Selecciona **"For full customization"** → click **"Create policy"**
3. Rellena:
   - **Policy name**: `Public read access`
   - **Allowed operation**: Marca solo **SELECT**
   - **Policy definition**: Cambia a `true` (literalmente escribe `true`)
4. Click **"Save policy"**

#### Política 2: Permitir SUBIDA (INSERT)
1. Click en **"New policy"**
2. Selecciona **"For full customization"** → click **"Create policy"**
3. Rellena:
   - **Policy name**: `Allow upload for all users`
   - **Allowed operation**: Marca solo **INSERT**
   - **WITH CHECK expression**: Escribe `true`
4. Click **"Save policy"**

#### Política 3: Permitir ACTUALIZACIÓN (UPDATE)
1. Click en **"New policy"**
2. Selecciona **"For full customization"** → click **"Create policy"**
3. Rellena:
   - **Policy name**: `Allow update for all users`
   - **Allowed operation**: Marca solo **UPDATE**
   - **USING expression**: Escribe `true`
   - **WITH CHECK expression**: Escribe `true`
4. Click **"Save policy"**

#### Política 4: Permitir ELIMINACIÓN (DELETE)
1. Click en **"New policy"**
2. Selecciona **"For full customization"** → click **"Create policy"**
3. Rellena:
   - **Policy name**: `Allow delete for all users`
   - **Allowed operation**: Marca solo **DELETE**
   - **USING expression**: Escribe `true`
4. Click **"Save policy"**

### Paso 3: Verificar
Deberías ver 4 políticas en la lista:
- ✅ Public read access (SELECT)
- ✅ Allow upload for all users (INSERT)
- ✅ Allow update for all users (UPDATE)
- ✅ Allow delete for all users (DELETE)

### Paso 4: Ejecutar Migración de Tabla
Ahora SÍ puedes ejecutar este SQL en el **SQL Editor**:

```sql
-- Agregar columna type a la tabla documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS type text
  CHECK (type IN ('url', 'file'))
  DEFAULT 'url';

-- Actualizar documentos existentes
UPDATE documents SET type = 'url' WHERE type IS NULL;
```

### ✅ Probar
Recarga tu aplicación e intenta subir un documento. ¡Debería funcionar!

---

## 🔒 Nota de Seguridad (Opcional)

Las políticas que creamos permiten que **cualquiera** suba archivos. Si quieres restringir esto solo a usuarios autenticados:

1. En cada política, en lugar de `true`, usa:
   ```
   auth.role() = 'authenticated'
   ```

2. Esto requerirá que los usuarios estén autenticados para subir/modificar/eliminar archivos.
