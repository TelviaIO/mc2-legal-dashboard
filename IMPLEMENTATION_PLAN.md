# Plan de Implementación: Alertas de Tareas y Feedback con Resend

Este plan describe los pasos para habilitar notificaciones por correo electrónico utilizando Resend cuando se crean nuevas "Tareas" o se recibe "Feedback" en el sistema.

## Estado Actual
- El repositorio local está desactualizado (47 commits por detrás).
- Falta la carpeta `supabase/functions` en la vista actual.
- Se ha determinado que el SMTP de Supabase no es viable para correos transaccionales personalizados, por lo que usaremos Resend.

## Pasos de Implementación

### 1. Sincronización del Código (Completado)
- [x] Ejecutar `git pull` (Realizado - Repo actualizado pero sin rastros de alertas previas).

### 2. Configuración de API Vercel (`api/send-admin-notification.ts`) (Completado)
- [x] Crear nueva función serverless en `api/send-admin-notification.ts`.
- [x] Implementar el envío de correos usando `fetch` a la API de Resend (`https://api.resend.com/emails`).
- [x] Configurar para aceptar parámetros: `type` (feedback/task), `text`, `author`.
- [x] Asegurar el uso de `process.env.RESEND_API_KEY`.

### 3. Integración en Frontend (`src/pages/Dashboard.tsx`) (Completado)
- [x] Modificar `PendingTasksSection` -> `handleAdd`: Llamar a la API tras crear la tarea.
- [x] Modificar `ChatSection` -> `handleSend`: Llamar a la API tras enviar mensaje (si es de usuario).

### 4. Configuración de Variables de Entorno
- [ ] Asegurar que el usuario configure `RESEND_API_KEY` en su entorno local (`.env`) y en Vercel.
- [ ] Definir el correo de origen y destino (ej. `onboarding@resend.dev` para pruebas o dominio verificado).

### 5. Verificación
- [ ] Simular la creación de una tarea.
- [ ] Simular el envío de feedback.
- [ ] Confirmar recepción del correo.
