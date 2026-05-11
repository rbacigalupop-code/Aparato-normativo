# 🔧 Setup Supabase para NormaCheck

## ⚠️ Paso Requerido: Crear Trigger para Auto-Perfiles

Después de deployar, ejecuta **UNA SOLA VEZ** este SQL en Supabase:

### Opción 1: Copiar-Pegar (2 minutos)

1. **Abre Supabase Console:**
   ```
   https://app.supabase.com/project/srukzfoerdgcaymnriax/sql/
   ```

2. **Copia este SQL completo:**
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.perfiles_usuario (
       user_id,
       nombre_completo,
       rol,
       activo,
       organizacion_id,
       created_at,
       ultimo_acceso
     )
     VALUES (
       NEW.id,
       COALESCE(NEW.user_metadata->>'nombre_completo', NEW.email),
       'viewer',
       true,
       NULL,
       NOW(),
       NOW()
     )
     ON CONFLICT (user_id) DO NOTHING;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
   
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION public.handle_new_user();
   ```

3. **Pega en el editor SQL de Supabase**

4. **Haz clic en Run (▶)**

5. **Verifica:**
   - Registra un usuario nuevo
   - Si no ves error 406 al iniciar sesión → ✅ Funcionó

### Opción 2: Archivo SQL
Ver `/sql/001_create_user_profile_trigger.sql` para el SQL completo con comentarios.

---

## ✅ Checklist Post-Deploy

- [ ] Ejecutar SQL trigger (ver arriba)
- [ ] Registrar usuario de prueba
- [ ] Iniciar sesión sin error 406
- [ ] Ir a pestaña "Soluciones" → debe mostrar lista de soluciones
- [ ] Verificar que módulo de fuego carga sin crashes

---

## 🔍 Troubleshooting

**Error: "406 Not Acceptable"**
- El trigger no se ha ejecutado
- Solución: Ejecuta el SQL del paso 1

**Error: "getLetraOGUC_loaded is not defined"**
- Deploy antiguo sin los fixes
- Solución: Reload la página después de 2-3 minutos (Vercel deploy)

**El perfil se crea pero vacío**
- Normal, se crea con valores por defecto
- El usuario puede completarlo en la app

---

## 📋 Qué hace el Trigger

Cuando alguien se registra:
1. `auth.users` → Nuevo usuario creado ✅
2. **TRIGGER** → `perfiles_usuario` → Nuevo perfil auto-creado ✅
3. `obtenerPerfil()` → Encuentra el perfil ✅
4. App funciona sin error 406 ✅

---

**Última actualización:** 2026-05-11  
**Deploy automático:** Vercel  
**Estado:** Triggers pendientes de ejecutar
