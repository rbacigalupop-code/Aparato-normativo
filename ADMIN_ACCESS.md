# 👨‍💼 Configurar Acceso de Administrador

**Email:** r.bacigalupo.p@gmail.com  
**Status:** Pendiente de ejecución  
**Tiempo estimado:** 2 minutos

---

## 📋 Instrucciones (Paso a Paso)

### 1️⃣ Abre Supabase Console
```
https://app.supabase.com/project/srukzfoerdgcaymnriax/sql/
```

### 2️⃣ Copia este SQL:
```sql
UPDATE public.perfiles_usuario
SET rol = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'r.bacigalupo.p@gmail.com'
);

SELECT user_id, nombre_completo, rol, organizacion_id
FROM public.perfiles_usuario
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'r.bacigalupo.p@gmail.com'
);
```

### 3️⃣ Pega en el editor SQL de Supabase

### 4️⃣ Haz clic en **Run (▶)**

### 5️⃣ Verifica el resultado

La respuesta debe mostrar:
```
user_id | nombre_completo | rol   | organizacion_id
--------|-----------------|-------|------------------
xxxxx   | Tu Nombre       | admin | xxxxx
```

---

## ✅ Qué verás después

Una vez ejecutado el script, **cierra la sesión y vuelve a loguearte**:

1. Logout de NormaCheck
2. Vuelve a hacer login con r.bacigalupo.p@gmail.com
3. Verás el **Tab "⚙ Admin"** (antes no estaba visible)
4. Acceso a:
   - 📊 **Estadísticas** - Datos de usuarios, proyectos, actividad
   - 🔑 **Tokens** - Gestionar tokens legacy
   - 👥 **Usuarios** - Invitar usuarios, cambiar roles
   - 📍 **Zonas** - Configuración de zonas/normativa

---

## 🔍 Verificación

Después de hacer login nuevamente:
- [ ] Aparece Tab "⚙ Admin"
- [ ] Pestaña "📊 Estadísticas" carga datos
- [ ] Puedes ver usuarios e invitar nuevos
- [ ] Puedes gestionar tokens

---

## 📂 Archivo SQL

El script está en: `/sql/002_make_admin.sql`

---

**Nota:** Este cambio es inmediato. Una vez que hagas logout y vuelvas a hacer login, tendrás acceso de administrador.
