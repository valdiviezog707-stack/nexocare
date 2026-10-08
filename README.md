# NexoCare

Agenda y gestión de consulta para profesionales de salud: pacientes, citas, recetarios PNG de dos páginas e ingresos/egresos.

## Estado de esta revisión

Esta rama está conectada al proyecto Supabase independiente NexoCare (`bzjbpoucyvipmgexvkfc`). El esquema, RLS y endurecimiento de seguridad ya fueron aplicados. No utiliza datos de ejemplo ni autenticación simulada.

- Cada profesional crea una cuenta real y sus datos comienzan en cero.
- Pacientes, citas, movimientos y recetas quedan aislados por usuario mediante RLS.
- El correo de confirmación vuelve al dominio activo de la aplicación.
- Producción no se actualiza hasta que el preview sea revisado y aprobado.

Antes de publicar, configura en **Supabase → Authentication → URL Configuration**:

1. **Site URL:** `https://nexocare-psi.vercel.app`
2. **Redirect URLs:** la URL de producción y los previews autorizados de NexoCare.

El frontend usa scripts estáticos y supabase-js desde jsDelivr. No hay compilación ni variables VITE procesadas. Vercel sirve la raíz del repositorio.

## Verificación

```sh
node --test tests/domain.test.cjs
```

Consultar `AUDIT-2026-10-07.md` para el alcance, los resultados y las limitaciones.
Los recordatorios al doctor funcionan dentro de la app; los mensajes de WhatsApp se revisan y envían manualmente.
El código conserva los datos antiguos del prototipo local, salvo su contraseña en texto, y no los importa a ninguna cuenta automáticamente.
