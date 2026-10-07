# NexoCare

Agenda clínica responsive para profesionales de salud. El prototipo incluye agenda diaria, pacientes, recetas y resumen financiero, con UX para escritorio y teléfono.

## Integraciones preparadas

- **Supabase**: `supabase/migrations/001_initial_schema.sql` crea perfiles, pacientes, citas, recetas y movimientos, con RLS por médico.
- **Recordatorios**: `supabase/functions/send-reminders` está preparado para ejecutarse cada día con Supabase Cron y encontrar citas a 24 h. Las notificaciones de WhatsApp requieren un proveedor aprobado (por ejemplo Meta WhatsApp Business/Twilio), una plantilla aprobada y consentimiento previo del paciente.
- **Vercel**: `vercel.json` deja el sitio estático preparado para importar el repositorio y desplegarlo.

## Publicación

1. Crea un proyecto de Supabase y ejecuta la migración en SQL Editor o mediante Supabase CLI.
2. Crea las variables de Vercel `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Nunca uses `service_role` en el navegador.
3. Sube este directorio a un repositorio GitHub y en Vercel usa **Add New > Project > Import Git Repository**.

El HTML funciona como demo local sin dependencias. En la siguiente iteración, conecta los formularios de `app.js` a Supabase Auth y a las tablas para persistencia multiusuario.
