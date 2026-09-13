# MainLayout — Estructura y navegación

`MainLayout.jsx` es el **único** layout con sidebar que usa la aplicación. Envuelve
todas las rutas protegidas (ver `routes/AppRouter.jsx`) y renderiza el contenido de
cada página a través de `<Outlet />`.

> ⚠️ **Importante para el equipo:** anteriormente existía `components/Sidebar.jsx`,
> un componente que parecía ser "el sidebar" pero que **nunca se importaba en ninguna
> parte de la app** (se verificó con `grep -r "import Sidebar"` sobre todo `src/`).
> El sidebar real siempre fue el JSX inline dentro de `MainLayout.jsx`. Ese archivo
> duplicado causó que enlaces agregados durante el desarrollo de CU38–CU43 (Mi
> Horario, Mis Estudiantes) y de CU2/CU3 (Gestión de Administradores) se editaran en
> el componente equivocado y nunca aparecieran en la app real. `Sidebar.jsx` fue
> eliminado — **a partir de ahora, cualquier cambio de navegación se hace únicamente
> en este archivo (`MainLayout.jsx`).**

## Estructura general del archivo

```
MainLayout
├── Modal de confirmación de cierre de sesión
├── <aside className="sidebar">
│   ├── Logo institucional
│   ├── Info del usuario (nombre + badge de rol activo)
│   └── <nav className="menu">
│       ├── Enlaces comunes a todos los roles
│       ├── Bloque "Administración"   (esAdmin)
│       ├── Bloque "Docente"          (esDocente)
│       └── Bloque "Apoderado"        (esApoderado)
└── <main> <Outlet /> </main>   ← contenido de la página actual
```

### Cómo se determina el rol visible

```js
const rolEfectivo = rolActivo || usuario?.roles?.[0];
const esSuperAdmin = usuario?.administradorTipo === "Super Admin";
const esAdmin      = rolEfectivo === "Administrador" || esSuperAdmin || usuario?.roles?.includes("Administrador");
const esDocente    = rolEfectivo === "Docente";
const esApoderado  = rolEfectivo === "Apoderado";
```

- `esAdmin` es **true** tanto para un Administrador normal como para el Super Admin.
- Dentro del bloque `esAdmin`, algunos enlaces se filtran de nuevo con
  `esSuperAdmin` para restringirlos exclusivamente al Super Admin.

## Enlaces por visibilidad

### Visibles para todos los roles autenticados
- `/dashboard` — Dashboard
- `/perfil` — Mi Perfil

### Visibles solo para Super Admin (`esSuperAdmin`)
Estos enlaces están dentro del bloque `esAdmin`, pero además exigen `esSuperAdmin`:

| Enlace | Ruta | Dropdown contenedor |
|---|---|---|
| Gestión de Administradores | `/administradores` | Gestión Usuarios |
| Gestión de Roles | `/gestion-roles` | Gestión Usuarios |
| Registrar Admin | `/registrar-admin` | Registrar Usuario |

> ⚠️ **Discrepancia detectada, pendiente de confirmar con el equipo:** `Gestión de
> Roles` está restringido aquí a Super Admin, pero la página `GestionRoles.jsx` y su
> ruta en `AppRouter.jsx` (`roles={["Administrador"]}`) permiten que un Administrador
> normal gestione roles de Docente/Apoderado (solo el rol Administrador está
> reservado a Super Admin dentro de esa página). Es decir, un Admin normal hoy no ve
> el enlace a una función a la que sí tiene acceso.

### Visibles para cualquier Administrador (`esAdmin`, incluye Super Admin)
Bloque "Administración" completo:

**Dropdown "Gestión Usuarios"**
- Gestión de Usuarios — `/usuarios`
- Gestión de Docentes — `/docentes` (CU30/CU31, listado y filtros)
- Gestión de Apoderados — `/apoderados`

**Dropdown "Registrar Usuario"**
- Registrar Docente — `/registrar-docente`
- Registrar Apoderado — `/registrar-apoderado`

**Dropdown "Gestión Académica"**
- Plan Educativo — `/plan-educativo`
- Asignaturas — `/asignaturas`
- Cursos — `/cursos`
- Horarios — `/horarios`
- Bloques Horarios — `/bloques-horarios`
- Registrar Estudiante — `/registrar-estudiante`

**Fuera de dropdowns**
- Reportes — `/reportes`

### Visibles solo para Docente (`esDocente`)
- Plan Educativo — `/plan-educativo`
- Mis Cursos — `/cursos`
- Mi Horario — `/horarios`
- Citaciones — `/citaciones`
- Mensajes — `/mensajes`

> ⚠️ **Pendiente (CU43):** "Mi Horario" enlaza hoy a la vista administrativa general
> de horarios (`/horarios`), no a una vista personal del docente. Existe un
> componente `components/HorarioDocente.jsx`, pero es un mock estático (texto
> hardcodeado, sin consulta a la API) y no está montado en ninguna ruta de
> `AppRouter.jsx`. Ver seguimiento de CU39/40/42 (y 43) con el equipo.

### Visibles solo para Apoderado (`esApoderado`)
- Citaciones — `/citaciones`
- Mensajes — `/mensajes`

> ⚠️ **Pendiente (CU40):** No existe un enlace "Mis Estudiantes" para que el
> apoderado vea a los estudiantes a su cargo. Existe un componente
> `components/ListaEstudiantesApoderado.jsx`, también un mock estático sin ruta
> asignada en `AppRouter.jsx`.

## Convenciones al modificar este archivo
1. Cualquier enlace nuevo se agrega **solo aquí**, nunca en un componente `Sidebar`
   separado.
2. Si el enlace debe verse exclusivamente para Super Admin, envolverlo con
   `{esSuperAdmin && ...}` dentro del bloque `esAdmin`.
3. Verificar siempre la restricción real de la ruta en `routes/AppRouter.jsx`
   (`roles={[...]}` o `superAdminOnly`) para que la visibilidad del enlace en el
   sidebar coincida con el acceso real permitido — evita el tipo de discrepancia
   documentada arriba con "Gestión de Roles".
