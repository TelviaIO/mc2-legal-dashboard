# 🔴 ARREGLO DEFINITIVO - Error de Políticas de Storage

Si sigues viendo este error:
```
StorageApiError: new row violates row-level security policy
```

Sigue EXACTAMENTE estos pasos:

---

## ✅ PASOS EXACTOS (NO SALTAR NINGUNO)

### Paso 1: Verificar el Bucket

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en **"Storage"** (menú lateral izquierdo)
4. Deberías ver un bucket llamado **"documents"**
5. **IMPORTANTE**: Verifica que diga **"Public"** junto al nombre
   - Si dice "Private", elimínalo y créalo de nuevo marcando "Public bucket"

### Paso 2: Configurar Políticas (MUY IMPORTANTE)

1. Click en el bucket **"documents"**
2. Click en la pestaña **"Policies"** (arriba)
3. Verás "No policies yet" o políticas existentes

#### ELIMINAR todas las políticas existentes primero
- Si hay políticas, elimínalas todas (click en los 3 puntos → Delete)

#### Crear Política #1: INSERTAR (SUBIR ARCHIVOS)
1. Click **"New policy"**
2. Click **"For full customization"** → Click botón **"Create policy"**
3. Completa el formulario:
   ```
   Policy name: Allow all inserts
   ```
4. **MUY IMPORTANTE**: En "Allowed operation" marca SOLO:
   - ✅ INSERT
   - ❌ SELECT (desmarcado)
   - ❌ UPDATE (desmarcado)
   - ❌ DELETE (desmarcado)

5. En la sección **"WITH CHECK expression"** (abajo), BORRA todo y escribe:
   ```
   true
   ```
   (Solo la palabra `true`, nada más)

6. Click **"Save policy"**

#### Crear Política #2: LEER (VER ARCHIVOS)
1. Click **"New policy"** de nuevo
2. Click **"For full customization"** → **"Create policy"**
3. Completa:
   ```
   Policy name: Allow all selects
   ```
4. Marca SOLO:
   - ❌ INSERT (desmarcado)
   - ✅ SELECT (marcado)
   - ❌ UPDATE (desmarcado)
   - ❌ DELETE (desmarcado)

5. En **"USING expression"**, escribe:
   ```
   true
   ```

6. Click **"Save policy"**

#### Crear Política #3: ELIMINAR
1. Click **"New policy"**
2. Click **"For full customization"** → **"Create policy"**
3. Completa:
   ```
   Policy name: Allow all deletes
   ```
4. Marca SOLO:
   - ❌ INSERT
   - ❌ SELECT
   - ❌ UPDATE
   - ✅ DELETE (marcado)

5. En **"USING expression"**, escribe:
   ```
   true
   ```

6. Click **"Save policy"**

### Paso 3: Verificar que las políticas se crearon

Deberías ver exactamente 3 políticas en la lista:
- ✅ Allow all inserts (INSERT)
- ✅ Allow all selects (SELECT)
- ✅ Allow all deletes (DELETE)

### Paso 4: Migración de Base de Datos

1. Ve a **SQL Editor** (menú lateral)
2. Click **"New query"**
3. Copia y pega EXACTAMENTE esto:

```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS type text
  CHECK (type IN ('url', 'file'))
  DEFAULT 'url';

UPDATE documents SET type = 'url' WHERE type IS NULL;
```

4. Click **"Run"** (F5)
5. Deberías ver: "Success. No rows returned"

### Paso 5: Limpiar Cache y Probar

1. En tu aplicación, abre la **Consola del navegador** (F12)
2. Click derecho en el botón de recargar → **"Empty Cache and Hard Reload"**
3. Cierra y abre de nuevo la aplicación
4. Ve a "Documentos Importantes"
5. Click en "Añadir documento"
6. Selecciona "Subir Archivo"
7. Elige un archivo PDF o imagen
8. Escribe un nombre
9. Click "Guardar"

---

## 🔍 Si TODAVÍA no funciona

Abre la consola del navegador (F12) y busca el error exacto. Envíame:
1. El mensaje de error completo
2. Una captura de la página de "Policies" en Supabase mostrando las políticas que creaste

---

## 📸 Cómo debería verse

En la pestaña **Policies** del bucket "documents", deberías ver algo como:

```
📋 Policies

✓ Allow all inserts        INSERT      WITH CHECK: true
✓ Allow all selects        SELECT      USING: true
✓ Allow all deletes        DELETE      USING: true
```

Si no se ve así, algo está mal configurado.
