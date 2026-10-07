# NexoCare

Agenda y gestión de consulta para profesionales de salud: pacientes, citas, recetarios PNG de dos páginas e ingresos/egresos.

## Estado de esta revisión
La rama incorpora Supabase Auth y persistencia por usuario. Requiere un proyecto propio antes de publicar. No utiliza datos de ejemplo ni autenticación simulada.

1. Crear un proyecto Supabase independiente llamado NexoCare.
2. Ejecutar supabase/migrations/002_real_accounts.sql en ese proyecto.
3. Completar config.js con la URL y clave publishable/anon pública. Nunca usar service_role.
4. Configurar la URL pública y las URLs autorizadas de confirmación en Supabase Auth.
5. Comprobar registro y confirmación por correo, dos cuentas aisladas y recarga de datos.
6. Revisar el despliegue previo y aprobar antes de actualizar producción.

El frontend usa scripts estáticos y supabase-js desde jsDelivr. No hay compilación ni variables VITE procesadas.
Vercel sirve la raíz del repositorio.

## Verificación
node --test tests/domain.test.cjs

Consultar AUDIT-2026-10-07.md para el alcance, los resultados y las limitaciones.
Los recordatorios al doctor funcionan dentro de la app; los mensajes de WhatsApp se revisan y envían manualmente.
El código conserva los datos antiguos del prototipo local, salvo su contraseña en texto, y no los importa a ninguna cuenta automáticamente.
