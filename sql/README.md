# SQL Migrations para NormaCheck

## Descripción

Scripts SQL para ejecutar una sola vez en Supabase para configurar triggers y funciones.

## 001_create_user_profile_trigger.sql

**Propósito:** Crear automáticamente un perfil de usuario cuando alguien se registra.

**Por qué es necesario:**
- El error 406 ocurría porque `obtenerPerfil()` no encontraba el registro
- Supabase crea el usuario en `auth.users` pero no en `perfiles_usuario`
- Este trigger lo hace automáticamente

**Cómo usar:**

1. Abre Supabase Console: https://app.supabase.com/project/srukzfoerdgcaymnriax/sql/
2. Crea una nueva query en el editor SQL
3. Copia TODO el contenido de `001_create_user_profile_trigger.sql`
4. Pega en el editor
5. Haz clic en "Run" (▶)
6. Listo ✅

**Resultado esperado:**
```
Query returned 0 rows
```

**Verificación:**
Después de ejecutar:
- Registra un nuevo usuario desde la app
- Inicia sesión
- Si no ves error 406, ¡funcionó! ✅

**Si algo sale mal:**
```sql
-- Ver si el trigger existe:
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Eliminar y recrear:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Luego vuelve a ejecutar el SQL completo
```

---

**Nota:** Estos scripts solo se ejecutan una sola vez. Son idempotentes (safe to run multiple times).
