# Guion del recorrido por SIGAE

Guion para presentar SIGAE de punta a punta, en el papel del **Super Administrador**. Está escrito para leerlo en voz alta y seguirlo con el mouse: cada paso dice **qué decir**, **qué hacer** y **qué se debería ver**.

El recorrido tiene dos partes, en este orden:

| Parte | Dónde | Por qué ahí |
| --- | --- | --- |
| **I. Sistema de desarrollo** | `http://localhost:5173` (o la URL del codespace), con la base de prueba | Todo lo que cambia la configuración del colegio o borra datos: parámetros institucionales, bloques, planes, horarios, roles, promoción y cierre de período. Hacerlo en el servidor real desordenaría los horarios ya armados y los datos de estudiantes de verdad. |
| **II. Servidor real** | `https://<dominio de producción>` | Lo que solo existe allá: HTTPS obligatorio y el **correo real** desde `noreply@colegiojc.cl` (contraseña inicial, código de activación, recuperación de contraseña, cambio de correo y copias de respaldo a `respaldosigae@colegiojc.cl`). En desarrollo esos correos no salen: el código aparece en un recuadro amarillo o en la consola del servidor. |

> 🎯 **Regla de oro:** en la Parte II solo se usan **cuentas de prueba** creadas en el momento, y no se toca nada académico (parámetros, bloques, planes, cursos, horarios, estudiantes, situación final ni cierre).

Duración aproximada: Parte I, 70 a 90 minutos (o 45 si se saltan los pasos marcados como *opcionales*); Parte II, 20 a 30 minutos.

---

## Antes de empezar

### Lo que el equipo deja listo (fuera del recorrido)

- **Desarrollo:** el sistema corriendo con la base de prueba **recién cargada** (los ejemplos de este guion usan esos datos). El envío de correos de desarrollo **sin** SMTP, para que se vean los códigos en pantalla.
- **Servidor real:** en marcha con el correo funcionando y la cuenta real del super administrador ya creada (se crea por script en el servidor; no es parte del recorrido).
- **Navegador:** dos ventanas, una normal y otra de incógnito, para tener dos sesiones a la vez (por ejemplo, docente y apoderado).
- **Bandejas de correo abiertas** en otra pestaña (para la Parte II):
  - una casilla institucional de prueba (`@colegiojc.cl` o `@colegiojacquescousteau.cl`) para el **docente de prueba**;
  - una casilla personal de prueba (por ejemplo, Gmail) para el **apoderado de prueba**;
  - *opcional:* una segunda casilla personal (para el cambio de correo) y otra institucional (para un administrador de prueba);
  - *opcional:* la cuenta `respaldosigae@colegiojc.cl`, si alguien del equipo tiene acceso.
- **RUT de prueba válidos** (con dígito verificador correcto) que **no existan** en el servidor real, uno por cada cuenta de prueba.
- Un archivo de imagen de menos de 5 MB para la foto de perfil.

### Cuentas del sistema de desarrollo

El ingreso es con **RUT** (sin puntos, con guion) y contraseña.

| Persona | RUT | Contraseña | Rol | Para qué la usamos |
| --- | --- | --- | --- | --- |
| Esperanza Gonzales | `5682711-0` | `1234` | **Super Admin** | Narradora del recorrido |
| Carlos Gonzales | `9343727-6` | `ilovemilf` | Administrador | Etiqueta UTP |
| María Morales | `3483606-k` | `Gato123` | Docente (Matemáticas), jefa de 1ero Básico A | Vista docente |
| Ana Torres | `3890710-7` | `Hamster#23` | Docente (Lenguaje), con disponibilidad lun–jue 09:00–12:00 | Validaciones del horario |
| Pedro Fernández | `5738925-7` | `4532` | Apoderado de Diego y Valentina (1ero Básico A) | Vista apoderado |
| Jorge Campos | `5158743-k` | `Pinguino@5` | Docente **y** Apoderado | Selector de perfil |

---

# PARTE I · SISTEMA DE DESARROLLO

> 🗣️ "Partimos en el sistema de desarrollo, una copia del sistema con datos ficticios. Aquí vamos a hacer todo lo que en el colegio real sería delicado: cambiar la jornada, mover bloques, armar horarios, promover cursos y cerrar el año. Si algo de esto se hiciera en el servidor real, afectaría los horarios que el colegio ya está usando."

Abre `http://localhost:5173`.

## Acto 1 · Entrar y conocer el panel

### 1.1 Iniciar sesión (CU11)

> 🗣️ "Se entra con RUT y contraseña. El RUT se valida mientras se escribe."

1. En **RUT**, escribe `5682711-1` (dígito equivocado): aparece *"RUT inválido"*.
2. Corrige a `5682711-0`, contraseña `1234` → **Iniciar Sesión**.

✅ Entra directo al **Dashboard**: la base de prueba trae los correos ya verificados, por eso no pide código. *(En el servidor real, el primer ingreso de toda cuenta pide un código por correo; lo veremos en la Parte II.)*

### 1.2 Dashboard y menú

> 🗣️ "El dashboard resume el colegio: usuarios, docentes, apoderados, estudiantes, cursos y citaciones, y tiene accesos rápidos."

1. Muestra las tarjetas de conteo y los **Accesos Rápidos**.
2. Abre el menú lateral: **Gestión Usuarios**, **Registrar Usuario** y **Gestión Académica**. Señala que **Gestión de Administradores**, **Gestión de Roles** y **Registrar Admin** solo los ve el Super Administrador.

### 1.3 Mi perfil (CU17, CU19, CU20)

1. Menú › **Mi Perfil**: datos personales, RUT, teléfono y correo.
2. **Fotografía de Perfil**: elige la imagen → **Guardar fotografía**. *(Intenta con un archivo que no sea imagen: se rechaza.)*
3. **Editar Perfil**: cambia el teléfono (por ejemplo, `9 8765 4321`; los espacios no cuentan) y la dirección (es **opcional**: si se llena, van calle, número y comuna completos) → **Guardar cambios**.
4. *Opcional:* como Super Admin puedes corregir tu **nombre** y tu **RUT**. Al cambiar el RUT el sistema avisa *"Tu RUT pasará a ser… Desde ahora iniciarás sesión con ese RUT"*. Si lo pruebas, vuelve a dejar `5682711-0`.

> ⚠️ El **cambio de correo** se deja para la Parte II: es el que envía un código real al correo nuevo.

---

## Acto 2 · Parámetros institucionales, bloques y eventos

> 🗣️ "Esta es la base de todo el horario. Por eso la mostramos aquí y no en el servidor real: cambiar la jornada cuando los horarios ya están armados deja clases fuera de lugar."

Menú › Gestión Académica › **Parámetros Institución**. Hay tres pestañas: **⚙ Parámetros institucionales**, **🕐 Bloques horarios** y **📅 Eventos institucionales**.

### 2.1 Configurar los parámetros (CU52)

> 🗣️ "Aquí se define la jornada, la duración estándar del bloque y del recreo, y el máximo de bloques por día. Cada bloque nuevo se valida contra estos valores."

1. Muestra el **Resumen configurado** (jornada 08:30 → 16:30, bloque de 45 min, recreo de 15 min, 8 bloques por día).
2. Cambia **Fin de jornada** a `14:30` → **Guardar parámetros**.

✅ El sistema **no guarda a ciegas**: avisa *"La nueva jornada deja 1 bloque(s) fuera de horario"* (el de 14:00–14:45, que tiene 1 clase) y ofrece **Guardar de todos modos** o **Revisar cambios**.

3. Elige **Guardar de todos modos**.

✅ Mensaje: *"… 1 clase(s) quedaron pendientes de reubicar en el panel de avisos"*.

> 💡 Si la base estuviera vacía (como el servidor real el primer día), aquí aparecería el aviso amarillo *"Aún no hay parámetros institucionales configurados"* y el botón diría **Crear parámetros**. Al crearlos queda fijado el período vigente (el año actual).

### 2.2 Reubicar las clases afectadas (CU81)

> 🗣️ "Ninguna clase se pierde: queda en un panel de pendientes para decidir qué hacer con ella."

1. Abre la pestaña amarilla del borde derecho: **Clases pendientes de reubicar**.
2. En la clase pendiente, muestra las tres opciones: **⇄ Migrar**, **🗑 Eliminar** y **⏰ Decidir más tarde**.
3. Elige **⇄ Migrar**, deja el **Bloque de destino** sugerido → **Confirmar migración**.
4. Vuelve a **Parámetros institucionales**, deja **Fin de jornada** en `16:30` y guarda.

### 2.3 Crear, editar y eliminar bloques (CU48, CU49, CU50, CU51)

Pestaña **🕐 Bloques horarios**. Alterna entre **📅 Semana** y **☰ Lista**.

1. **+ Nuevo bloque**: Tipo **Clase**, Hora inicio `11:45`. El panel sugiere la duración estándar (*"Duración estándar Clase: 45 min → termina 12:30"*); acéptala. Jornada **Mañana** → **Crear bloque**.
2. Repite con un **Recreo** de `10:45` a `11:00`.
3. Repite con una **Clase** de `12:30` a `13:15` y otra de `14:45` a `15:30` (**Tarde**). *(Estos bloques extra sirven después para completar horarios.)*
4. Prueba un choque: **+ Nuevo bloque** de `09:30` a `10:15`. Aparece *"⚠ Este bloque se superpone con…"* y el botón **Reemplazar y crear bloque**. Explica que reemplazar enviaría las clases al panel de pendientes, y **cierra el panel sin crearlo**.
5. Edita un bloque (ícono de editar) y guarda.
6. **☑ Seleccionar varios**: marca el bloque `12:30–13:15` y el de `09:15–10:00` (que tiene clases) → **🗑 Eliminar seleccionados**.

✅ No se elimina ninguno: *"Si alguno tiene asignaciones activas… no se eliminará ninguno"*. Deselecciona el de 09:15 y elimina solo el otro si quieres mostrar el borrado.

### 2.4 Eventos institucionales (CU70, CU71, CU72)

Pestaña **📅 Eventos institucionales**: muestra los eventos de prueba (Licenciatura, Consejo de Profesores, Acto Patrio) y los contadores Próximos/Pasados.

1. **+ Nuevo evento**: nombre *"Jornada de reflexión"*, una **fecha de la próxima semana**, Impacto **Suspensión jornada mañana**, descripción breve.

✅ Antes de guardar, el panel muestra qué bloques quedarían suspendidos.

2. **Crear evento**. Haz clic en el evento para ver su **detalle** (bloques afectados y clases suspendidas).
3. Edítalo (cambia el impacto a **Salida anticipada**) y guárdalo.
4. Elimínalo.

### 2.5 Suspender una jornada completa (CU66)

1. **⏸ Suspender jornada completa**: fecha (un día hábil de la próxima semana), Jornada **Día completo**, nombre y descripción → **Confirmar suspensión**.

✅ Se registra el evento y las clases de ese día quedan suspendidas solo para esa fecha.

> 🗣️ "Esto, en el servidor real, suspendería clases de verdad y les avisaría a todos. Por eso lo mostramos aquí."

---

## Acto 3 · Estructura curricular

### 3.1 Asignaturas (CU47, CU80)

Menú › Gestión Académica › **Asignaturas**.

> 🗣️ "Cada asignatura pertenece a un tramo: Kinder, Básica o Media. 'Matemática' de Básica y de Media son asignaturas distintas, cada una con su plan, su color y sus horas."

1. Filtra por tramo y busca por nombre.
2. **+ Registrar Asignatura**: nombre *"Música"*, Tramo **Básica**, elige un color (paleta, selector libre o **Al azar**) → **Registrar asignatura**.
3. Intenta registrar otra *"Música"* en **Básica**: se rechaza por nombre repetido en el tramo. Con tramo **Media** sí se puede.
4. Marca una nueva como **"Asignatura electiva de 3° y 4° medio"**: el tramo pasa solo a **Media**.
5. Cambia el color de una asignatura directo en la tabla (columna **Color**). Se guarda al cerrar el selector.

### 3.2 Plan educativo (CU45, CU46, CU83)

Menú › Gestión Académica › **Plan Educativo**.

1. Haz clic en el plan de **1ero Básico – 2026** para ver sus asignaturas, tipos y horas semanales.
2. **✏ Editar**: agrega **Música** (Obligatorio, 2 horas) → **Guardar cambios**.

✅ El selector solo ofrece asignaturas del tramo del nivel y nunca las electivas.

3. **+ Nuevo Plan**: Periodo `2026`, Nivel **3ero Básico**, agrega 2 o 3 asignaturas con sus horas → **Crear Plan**.
4. **Clonar Plan Existente**: Plan origen **1ero Básico – 2026**, nuevo período `2027`, nivel destino **1ero Básico** → **Crear Plan Clonado**.

### 3.3 Electivos de 3° y 4° medio (CU108, CU106)

Menú › Gestión Académica › **Electivos 3° y 4° medio**.

> 🗣️ "Los electivos se planifican una vez por período, por ruta (Científica o Humanística), y se programan en bloques compartidos por todos los 3° y 4° medios."

1. Pestaña **Plan del período**: muestra el plan 2026 con sus rutas, horas y docentes habilitados. **Editar plan**, agrega un docente habilitado (**+ Docente**) → **Guardar cambios**.
2. Pestaña **Programación**: en un bloque libre, **+ Electivo** → Ruta, **Asignatura del plan** (muestra horas programadas/del plan), **Docente habilitado** → **Programar**.
3. Los bloques de electivos son exclusivos: en el **Creador Horario** de 3ero Medio A (Acto 6), el bloque del miércoles 11:00 aparece en morado y no admite clases regulares. Y al revés: un bloque con clases regulares de 3° o 4° medio no acepta electivos.
4. Quita un electivo con **×** y confirma.

---

## Acto 4 · Personas: usuarios, roles, docentes, apoderados y estudiantes

### 4.1 Gestión y búsqueda de usuarios (CU28, CU29, CU25)

1. Gestión Usuarios › **Gestión de Usuarios**: escribe en el buscador (se filtra al escribir); combina **Todos los roles** y **Todos los estados**. **Limpiar**.
2. Gestión Usuarios › **Buscar Usuarios**: busca por nombre, por RUT y por correo.
3. **Ver Perfil** de María Morales (CU18): datos, cursos y asignaturas.

### 4.2 Desactivar y reactivar cuentas (CU21, CU23)

1. En **Gestión de Usuarios**, **Desactivar** a Luis Ramos (apoderado) y confirma.
2. En la ventana de incógnito intenta entrar con `8636451-4` / `Conejo#42`: *"Tu cuenta está deshabilitada. Contacta al administrador."*
3. De vuelta, **Reactivar** su cuenta.

### 4.3 Administradores (CU2, CU3, CU22, CU24)

Gestión Usuarios › **Gestión de Administradores** (solo Super Admin).

1. **Editar** a Carlos Gonzales: cambia el teléfono → **Guardar cambios**.
2. Muestra el botón **Desactivar** del estado de cuenta (puedes desactivar y reactivar). Señala que no puedes desactivar tu propia cuenta.

> 💡 Si aquí se cambiara el **correo** de un administrador, en su próximo ingreso se le pediría un código. Eso lo vemos de verdad en la Parte II.

### 4.4 Roles y etiqueta UTP (CU26, CU27)

Gestión Usuarios › **Gestión de Roles**.

> 🗣️ "Un usuario puede tener varios roles. La UTP no es un rol: es una etiqueta que recorta los permisos de un administrador a lo curricular, o se los suma a un docente."

1. Busca a **Ana Torres** → **Rol a asignar: Apoderado** → completa el correo personal (la dirección es opcional) → **Asignar rol Apoderado**.
2. En **Gestión de roles y cuenta**, muestra el botón **Desactivar** del rol (no lo uses todavía).
3. Busca a **Carlos Gonzales** → sección **Etiqueta UTP** → **Asignar etiqueta**.
4. En **Rol a asignar** de Carlos no aparecen **Docente** ni **Apoderado**: un administrador no puede tener esos roles.

**Comprobar la etiqueta UTP:** en la ventana de incógnito entra como Carlos (`9343727-6` / `ilovemilf`).

✅ Su insignia dice **"Administrador · UTP"** y el menú solo tiene el bloque **UTP** (Plan Educativo, Electivos, Asignaturas, Cursos, Estudiantes, Creador Horario, Horario Maestro, Horario de Docente, Consulta de Horarios y Eventos Institucionales). No ve usuarios, roles ni parámetros. En **Eventos Institucionales** solo aparece esa pestaña.

5. Cierra la sesión de Carlos y, como Super Admin, **Retirar etiqueta**.
6. Vuelve a Ana Torres y **Desactivar** el rol Apoderado que le diste.

### 4.5 Docentes: especialidades, color, disponibilidad y P.I.E. (CU30, CU31, CU107)

Gestión Usuarios › **Gestión de Docentes**.

1. Filtra por **especialidad** (las etiquetas con su número de docentes) y por estado; ordena por nombre o RUT.
2. Cambia el **color** de un docente en la columna Color.
3. En **Especialidades**, **✎ Editar** a María: agrega *"Estadística"* escribiendo y presionando Enter → **Guardar**. Las etiquetas se reutilizan sin distinguir mayúsculas ni tildes.

Abre el perfil de **Ana Torres** (Ver Perfil) → **Editar datos**:

4. **Disponibilidad laboral semanal** (CU107): muestra sus tramos lun–jue 09:00–12:00 y la vista por bloques de 45 minutos. Agrega un tramo el **viernes 09:00–12:00** (o haz clic en un bloque libre para sumarlo) y guarda.

> 🗣️ "La disponibilidad es el patrón semanal en que el docente está en el colegio. Asignarle una clase fuera de ella se bloquea."

5. **Horas P.I.E. y regla 65/35**: dale `2` horas P.I.E., marca 2 bloques en la grilla como **P.I.E.** → **Guardar horas P.I.E.**

> 🗣️ "Las horas P.I.E. se restan de la carga semanal y del resto solo el 65 % pueden ser clases. Con 32 horas y 2 de P.I.E., Ana puede tener como máximo 19 clases. Un bloque P.I.E. no admite clases."

### 4.6 Registrar ficha de estudiante (CU6)

Gestión Académica › **Registrar Estudiante**: nombre, RUT, curso **1ero Básico A**, estado **Regular** y dirección (obligatoria para estudiantes) → **Registrar Estudiante**.

Intenta registrar otra ficha con el **mismo RUT**: se rechaza porque ya existe.

### 4.7 Registrar docente, apoderado y administrador: solo validaciones (CU1, CU4, CU5)

> 🗣️ "Los formularios de registro no piden contraseña: SIGAE genera una aleatoria y se la envía al correo de la persona. Como aquí en desarrollo no hay correo, el registro completo lo hacemos en el servidor real."

Abre **Registrar Docente** y muestra solo las validaciones, sin registrar:

1. RUT inválido → *"RUT inválido"*.
2. Correo con dominio no institucional (por ejemplo `@gmail.com`) → se exige `@colegiojc.cl` o `@colegiojacquescousteau.cl`.
3. Muestra los bloques **Especialidades**, **Carga horaria semanal**, **Horas P.I.E.**, **Disponibilidad laboral semanal** y **Horario de atención de apoderados**.

Mira también **Registrar Apoderado** (correo personal) y **Registrar Admin** (solo Super Admin).

### 4.8 Apoderados y asociaciones (CU32, CU33, CU7, CU8, CU9, CU10)

Gestión Usuarios › **Gestión de Apoderados**.

1. Filtro por cantidad de estudiantes: operador **"≥ igual o más de"** y cantidad `2`.
2. **Asignar Estudiantes** a Sandra Vera: muestra **Estudiantes ya asociados** y **Estudiantes sin apoderado**. Asígnale el estudiante que registraste en 4.6 → **Asignar**.
3. En un asociado, **Cambiar apoderado** (y **Cancelar**) y **Quitar apoderado** (confirma).
4. Muestra **Eliminar todas las asociaciones** sin confirmarlo (o hazlo con un apoderado de prueba).

### 4.9 Estudiantes: ficha, titular y suplentes, ruta (CU34–CU39, CU90, CU91, CU105)

Gestión Académica › **Estudiantes**.

1. Busca por nombre o RUT; filtra por curso y por estado (Regular, Irregular, En práctica, Egresado, Retirado); ordena por columnas.
2. **Editar ficha** de Catalina Morales: cambia el estado a **Regular** → **Guardar cambios**.
3. **Apoderados** de Diego Pérez: muestra el **Apoderado titular** (Pedro) y los **suplentes** (hasta 4). Agrega a Sandra Vera como suplente → **Agregar suplente** → **Guardar cambios**. Prueba **Hacer titular** y vuelve a dejar a Pedro.
4. **Editar ficha** de Tomás Rojas (3ero Medio): muestra la **Ruta de formación** (Científica, Humanística o Técnica).

---

## Acto 5 · Cursos

Menú › Gestión Académica › **Cursos** (vista **⊞ Tarjetas** o **☰ Lista**).

### 5.1 Registrar curso y asignar asignaturas (CU44, CU53)

1. **+ Registrar Curso**: nivel **3ero Básico**, período **2026 (vigente)**, sección `A` → **Registrar**. Intenta repetirlo: el nombre es único por período.
2. Abre el curso → **+ Asignar asignatura**: marca las asignaturas del plan creado en 3.2, estado **Activa** → **Confirmar asignación**.

### 5.2 Profesor jefe y estudiantes del curso (CU95, CU96, CU97, CU105)

1. Abre **1ero Básico B** → **Profesor jefe**: muestra a Ana Torres. **Reemplazar** por Roberto Silva.
2. María Morales ya es jefa de 1ero Básico A. Asígnala también a **3ero Básico A** (segundo curso) y luego intenta asignarla a **2do Básico A**: se rechaza, porque un docente puede ser jefe de **2 cursos como máximo** por período.
3. **Retirar jefatura** de un curso y confirma.
4. **Estudiantes del curso**: lista con estado académico. En **3ero Medio A**, selecciona estudiantes y asígnales una **Ruta de formación** → **Asignar ruta**.

---

## Acto 6 · Horarios

### 6.1 Crear clases y ver las validaciones (CU54, CU55, CU56)

Menú › Gestión Académica › **Creador Horario** → curso **1ero Básico A**.

> 🗣️ "A la izquierda, cada asignatura con sus horas programadas versus las que exige el plan. A la derecha, la grilla: se hace clic en una celda libre para programar."

1. Haz clic en **Lenguaje y Comunicación** en el listado y luego en una celda libre del **martes 09:15**.
2. En **Docente**, muestra los tres grupos: **⭐ Sugeridos** (su especialidad coincide), **✓ Disponibles** (con *clases actuales/máximo*) y **✗ No disponibles**, con el motivo.

Prueba estas tres validaciones:

| Intento | Resultado esperado |
| --- | --- |
| **Miércoles 09:15** con **María Morales** | No disponible: *conflicto de horario* (ya tiene 1ero Básico B a esa hora). |
| Bloque de la **tarde (14:00)** con **Ana Torres** | No disponible: *fuera de su disponibilidad laboral*. |
| Un bloque que marcaste como **P.I.E.** de Ana | No disponible: *horas P.I.E. en ese bloque*. |

3. Programa una clase válida (por ejemplo, Lenguaje con Ana Torres el **jueves 10:00**) → **Agregar bloque**.
4. Programa **Matemática** con un docente que no sea de Matemáticas: el sistema **informa** que no coincide la especialidad, pero **deja seguir** (es una sugerencia, no un bloqueo).
5. **🎨 Colores: Asignatura | Docente**: cambia el coloreado de los bloques.
6. **📋 Desplegar listado**: vista rápida de todos los cursos y su avance.

### 6.2 Edición masiva y suspensiones (CU63, CU64, CU65)

1. **☑ Selección múltiple** → haz clic en 2 clases.
2. **👤 Reasignar docente**: elige otro docente → valida → **Confirmar cambios** (o **Volver**).
3. **✏ Editar seleccionados**: cambia el estado o el bloque de ambas y valida.
4. **⏸ Suspender por evento**: elige **Evento registrado** o **Registrar evento nuevo** → **Confirmar suspensión**.

### 6.3 Eliminar y restaurar clases (CU84)

1. En una clase, **🗑 Eliminar clase** y confirma: *"Seguirá en el listado de clases eliminadas"*.
2. En el listado inferior, filtra **Eliminadas** → **↺ Restaurar**.

### 6.4 Horario maestro, por docente y consultas (CU57, CU58, CU43, CU67, CU68, CU69)

1. Gestión Académica › **Horario Maestro**: todos los cursos por día (pestañas de días con su número de clases). Filtra por curso y por docente → **✕ Limpiar filtros**. Los cursos llevan su etiqueta *"Vigente 2026"*.
2. **Horario de Docente**: elige a María Morales. Se ven sus clases, su **atención de apoderados** y sus **horas P.I.E.**
3. **Consulta de Horarios** › **Filtrar horarios**: filtra por nivel, asignatura y estado (**Activos/Suspendidos**) → **Buscar** → **Ver detalle** de una clase (CU69).
4. **Bloques libres**: elige el curso o el docente y el día (o una fecha) → **Consultar disponibilidad** (CU67).

### 6.5 Exportar (CU60, CU61, CU62)

En **Horario Maestro** (**Exportar maestro**), **Horario de Docente** (**Exportar horario**) y en el **Creador Horario** con un curso elegido (**Exportar 1ero Básico A**): muestra los formatos **📄 PDF**, **📊 Excel**, **🧾 CSV** y **🖼 Imagen (PNG)**. Descarga uno y ábrelo.

---

## Acto 7 · El sistema visto por docentes y apoderados

> 🗣️ "El Super Administrador no tiene los roles de docente ni de apoderado. Para mostrar esa parte entramos con las cuentas de prueba: María, la profesora, en esta ventana; y Pedro, el apoderado, en la de incógnito."

Cierra la sesión del Super Admin (**Cerrar Sesión** → confirma, CU12) y entra como **María** (`3483606-k` / `Gato123`). En la ventana de incógnito, entra como **Pedro** (`5738925-7` / `4532`).

### 7.1 Docente: mi horario y horario de atención (CU42, CU43, CU87, CU88)

1. María › **Mi Horario**: sus clases (solo lectura) y **Exportar mi horario**.
2. **Horario de atención de apoderados** (en Mi Horario o en Mi Perfil): ya tiene martes 14:00–16:00 y jueves 15:00–17:00. Agrega un tramo el **lunes 15:00–16:00** → **Guardar horario de atención**.
3. Intenta un tramo que choque con una clase suya (lunes 09:15): se rechaza.
4. **Mi Perfil**: **Mis cursos y asignaturas** y **Mi disponibilidad laboral** (solo lectura: la edita la administración).

### 7.2 Citaciones (CU74, CU75, CU76, CU77, CU78, CU89, CU101)

1. María › **Citaciones** › **+ Nueva citación**: estudiante **Diego Martin Pérez Castro**, fecha (un martes próximo), **Tramo horario** de 30 minutos, modalidad y motivo → **Crear citación**. Se ven los **contactos** del titular y los suplentes (CU91).
2. Pedro (incógnito): la campana **🔔 Notificaciones** muestra la citación nueva (CU101). Ábrela → **Confirmar citación**.
3. María: la citación aparece **Confirmada**. Abre el detalle → **Reprogramar** (nueva fecha y tramo) → **Confirmar reprogramación**.
4. Pedro › **+ Solicitar citación** (CU89): estudiante, docente **María Morales**. Se ven su horario de atención semanal y los tramos libres de las próximas semanas. Elige uno → **Enviar solicitud**.
5. María: en **Solicitudes pendientes de tu confirmación** → **Revisar y confirmar**. Luego **Cancelar citación** con un motivo (es obligatorio).

### 7.3 Mensajes y recepción (CU73, CU85, CU86)

1. María › **Mensajes**: abre la conversación con Pedro y escribe un mensaje.
2. Pedro: le llega la notificación; responde.
3. María: **Deshabilitar recepción** → **Confirmar**.
4. Pedro: puede leer, pero en lugar del campo de respuesta ve el aviso de que la docente no está recibiendo mensajes.
5. María: en la conversación, habilita las respuestas **Hasta** mañana → **Guardar**. Pedro ya puede responder.
6. María: **Habilitar recepción** otra vez.

### 7.4 Calendario de evaluaciones (CU92, CU93, CU94)

1. María › **Calendario de Evaluaciones** › **+ Registrar evaluación**: 1ero Básico A — Matemática, fecha, tipo y contenidos → **Registrar evaluación**.
2. Pedro › **Calendario de Evaluaciones**: la ve en el mes, filtrando por estudiante.
3. María: edita la evaluación y luego **Eliminar**.

### 7.5 Apoderado: horario del alumno, estudiantes e historial (CU82, CU40, CU41, CU79)

1. Pedro › **Horario del Alumno**: horario semanal del curso de Diego y Valentina.
2. Pedro › **Mi Perfil** › **Mis estudiantes asociados** → **Ver detalle**.
3. Pedro › **Historial de Citaciones**: lista por estudiante, filtro por estado → **Ver detalle** con **Historial de cambios**.

### 7.6 Un usuario con dos roles

Cierra la sesión de Pedro y entra como **Jorge Campos** (`5158743-k` / `Pinguino@5`).

✅ Aparece **Seleccionar perfil** con **Docente** y **Apoderado**. Cada perfil tiene su propio menú y sus propias notificaciones.

### 7.7 Situación final como profesora jefa (CU98)

María › **Situación Final**: elige **1ero Básico A**. Ya trae Diego (**Promovido**) y Valentina (**Repitente**) en **Borrador**. Agrega o corrige la situación del estudiante registrado en 4.6 → **Guardar borrador**.

> 🗣️ "La profesora jefa registra; la promoción la aplica la administración, y casi todas las situaciones esperan el cierre del año."

Cierra las sesiones de María y Jorge, y vuelve a entrar como **Super Admin**.

---

## Acto 8 · Cierre del año (solo en desarrollo)

> 🗣️ "Esta es la parte más delicada del sistema: promueve cursos y, al iniciar el nuevo período, **elimina** datos de dos años atrás. Por eso solo se muestra aquí."

### 8.1 Situación final y carga por Excel (CU98, CU99)

Gestión Académica › **Situación Final y Promoción** → curso **1ero Básico A**.

1. Completa la situación de todos → **Confirmar situación final**. Si falta alguno, todo queda en borrador y el sistema lista a los faltantes.
2. **Carga por Excel**: **Descargar plantilla** (RUT, Nombre y Situación con lista desplegable) → llénala en Excel → elige el archivo → **Revisar archivo** → **Registrar N fila(s) válida(s)**.
3. **Promover el curso** **antes** de iniciar el cierre: el sistema lo impide. Solo **Retirado** se aplica en cualquier momento del año.

### 8.2 Iniciar el cierre (Super Admin)

Gestión Académica › **Cierre de Período**.

1. Muestra la tabla **Promoción de los cursos de 2026** (sin situación, borrador, registradas, aplicadas y pendientes por curso).
2. **Iniciar cierre** → confirma *"¿Iniciar el cierre de 2026?"*.

✅ El encabezado dice *"Período vigente: 2026 · en preparación: 2027"*. El trabajo diario sigue en 2026.

### 8.3 Aplicar la promoción (CU100)

1. **Abrir** 1ero Básico A → **Promover el curso**.
2. Como los cursos de destino de 2027 no existen, el sistema ofrece crearlos → acepta.

✅ Diego pasa a **2do Básico A 2027**; Valentina (repitente) a **1ero Básico A 2027**. El curso nuevo hereda a la profesora jefa (si no supera su tope de 2).

3. Muestra **Promover los marcados** (promoción caso por caso).

### 8.4 Horarios del año siguiente y respaldo

1. En **Cursos** y en el **Creador Horario** aparecen los cursos 2027 con la etiqueta **"Futuro 2027"**; los choques de horario se comparan solo dentro del mismo período.
2. En **Cierre de Período**, la sección **Cursos y horarios de 2027** muestra las horas programadas versus las requeridas.
3. Sección **2. Iniciar nuevo período (2027)**: muestra **Todavía no se puede iniciar** y sus motivos (estudiantes sin promoción aplicada, cursos 2027 sin horario completo) y la lista de lo que se **eliminará o modificará**.
4. **Descargar respaldo**: se descarga el Excel.

✅ En desarrollo aparece en rojo *"No se pudo enviar la copia por correo"*. **Es lo esperado:** aquí no hay correo. En la Parte II vemos que en el servidor real la copia llega a `respaldosigae@colegiojc.cl`.

5. *Opcional (demo larga):* aplicar la promoción de todos los cursos, completar los horarios de los cursos 2027, marcar **"El respaldo quedó guardado…"** e **Iniciar nuevo período**. 2027 pasa a vigente y se aplica la limpieza. **No se puede deshacer.**

> 🗣️ "El botón de iniciar el nuevo período queda bloqueado hasta que todo está resuelto y el respaldo guardado."

---

## Acto 9 · Seguridad de la sesión (al final de la Parte I)

> ⚠️ Este acto va al final porque bloquea los ingresos desde este equipo durante 15 minutos. **Nunca** se hace en el servidor real: allí bloquearía a todo el colegio, que sale a internet con la misma IP.

1. **Sesión por inactividad (CU13)**, solo comentarlo: tras 30 minutos sin actividad, la sesión se cierra y se muestra la pantalla de sesión expirada.
2. **Intentos fallidos:** cierra sesión e intenta entrar 6 veces con una contraseña equivocada.

✅ Primero *"RUT o contraseña incorrectos"* y, tras 5 intentos, *"Demasiados intentos fallidos. Intente más tarde."*

3. *Opcional (CU14 en desarrollo):* **¿Olvidó su contraseña?** con el RUT de Pedro: el código aparece en el recuadro amarillo *"Modo desarrollo (sin SMTP): el código es …"*.

> 🗣️ "Ese recuadro amarillo existe solo en desarrollo. En el servidor real el código llega por correo y nadie más lo ve. Eso es justamente lo que vamos a mostrar ahora."

---

# ⇄ CAMBIO AL SERVIDOR REAL

> 🗣️ "Hasta aquí, todo era una copia de prueba. Ahora pasamos al servidor real del colegio, el que está en marcha blanca con datos verdaderos. Aquí solo vamos a probar lo que no se puede probar en desarrollo: el HTTPS y los correos reales que envía SIGAE. Usamos cuentas de prueba creadas en el momento y no tocamos nada académico."

**Checklist antes de seguir:**

- [ ] Cerraste todas las sesiones de desarrollo y **cerraste las pestañas de `localhost`** (para no confundir los sistemas).
- [ ] Tienes a mano el RUT y la contraseña del **Super Administrador real**.
- [ ] Están abiertas las bandejas de las casillas de prueba.
- [ ] Todos saben qué **no** se toca en el servidor real:

| 🚫 No hacer en el servidor real | Por qué |
| --- | --- |
| Cambiar **Parámetros institucionales** o **bloques** | Desarma los horarios en uso |
| Crear, editar o eliminar **planes, asignaturas, cursos, horarios o electivos** | Son los datos con que trabaja el colegio |
| Registrar **estudiantes** de prueba o asociar apoderados de prueba a estudiantes reales | Aparecerían en listados, horarios y en el cierre (y lo bloquearían) |
| **Eventos** o **suspensiones** | Suspenden clases reales |
| **Situación final**, **promoción**, **Iniciar cierre** o **Iniciar nuevo período** | Son irreversibles |
| Cambiar roles, etiquetas o estados de **usuarios reales** | Les cambia el acceso a personas reales |
| Fallar el inicio de sesión a propósito | Bloquea por 15 minutos la IP del colegio |

---

# PARTE II · SERVIDOR REAL

Abre `https://<dominio de producción>`.

## Acto 10 · Conexión segura e ingreso del Super Admin

### 10.1 HTTPS obligatorio

1. Escribe en la barra la dirección con `http://` (sin la s).

✅ El navegador termina en `https://` con el candado. El servidor redirige siempre a la conexión cifrada.

### 10.2 Ingreso del Super Administrador real (CU11)

1. Ingresa con el RUT y la contraseña del Super Admin real.
2. Si es su **primer ingreso**, aparece **"Activa tu cuenta"**: el código llega desde `noreply@colegiojc.cl` al correo institucional del Super Admin. Ingrésalo → **Verificar e ingresar**. Si ya había entrado antes, entra directo.

> 🗣️ "Fíjense que aquí no aparece el recuadro amarillo: el código solo llega al correo."

## Acto 11 · Registrar cuentas de prueba: contraseña por correo (CU5, CU4, CU1)

### 11.1 Apoderado de prueba

1. Registrar Usuario › **Registrar Apoderado**: nombre *"Apoderado Prueba SIGAE"*, un RUT de prueba válido, el **correo personal de prueba** y un teléfono → **Registrar Apoderado**.

✅ Alerta: *"Apoderado registrado correctamente. La contraseña se envió a …"* (con el correo enmascarado) y *"La cuenta figura como inactiva hasta el primer inicio de sesión del usuario."*

2. Abre la bandeja del correo personal de prueba: llega **"Tu cuenta en SIGAE fue creada"**, desde `SIGAE <noreply@colegiojc.cl>`, con el RUT y una contraseña aleatoria de 12 caracteres. Muestra el pie: *"Este correo fue enviado automáticamente por SIGAE. No respondas a este mensaje. Nadie revisa esta cuenta."*
3. **Gestión de Usuarios**: busca la cuenta. Aparece **Inactiva**.

> 🗣️ "El administrador nunca conoce la contraseña: la genera el sistema y solo la recibe la persona. Si el correo no se pudiera enviar, la cuenta no se crea."

### 11.2 Docente de prueba

**Registrar Docente** con la **casilla institucional de prueba**, especialidad, carga horaria semanal (por ejemplo `30`) y **sin** disponibilidad ni horario de atención → **Registrar Docente**. Revisa que llegue el correo a la casilla institucional.

> 💡 Si no hay casilla institucional de prueba, sáltate este paso: el sistema solo acepta `@colegiojc.cl` o `@colegiojacquescousteau.cl` para docentes.

### 11.3 *Opcional:* administrador de prueba

**Registrar Admin** (solo Super Admin) con otra casilla institucional de prueba. Mismo correo de bienvenida.

## Acto 12 · Primer ingreso con código de activación

En la ventana de incógnito, con el **apoderado de prueba**:

1. Ingresa con el RUT de prueba y la contraseña del correo.

✅ Pantalla **"Activa tu cuenta"**: *"Te enviamos un código de 6 dígitos a … desde noreply@colegiojc.cl. Vence en 10 minutos…"* (con el correo enmascarado).

2. En la bandeja llega **"Código para activar tu cuenta - SIGAE"**. Muestra que el mensaje dice que nadie del colegio pedirá ese código.
3. Muestra que **Reenviar código** está bloqueado con una cuenta regresiva de **60 s**. Al terminar, púlsalo: llega un código nuevo y la pantalla avisa *"Te enviamos un código nuevo. El anterior ya no sirve."*
4. Ingresa el código **más reciente** → **Verificar e ingresar**.

✅ Entra al panel del apoderado. En la ventana del Super Admin, **Gestión de Usuarios**: la cuenta ahora figura **Activa**.

> ⚠️ Escribe el código con cuidado: 5 códigos incorrectos lo invalidan y hay que pedir otro.

Repite con el **docente de prueba** si lo registraste.

## Acto 13 · Recuperar la contraseña con código (CU14)

En la ventana de incógnito, cierra la sesión del apoderado de prueba.

1. **¿Olvidó su contraseña?** → RUT del apoderado de prueba → **Continuar**.
2. Si la cuenta tiene más de un correo, elige el **Correo destino** (aparece enmascarado) → **Enviar código**.
3. Llega **"Código para recuperar tu contraseña - SIGAE"**.
4. Ingresa el código, la **Nueva contraseña** (mínimo 8 caracteres, con una mayúscula y un número) y su confirmación → **Cambiar contraseña**.

✅ *"¡Contraseña actualizada!"* → **Ir al inicio de sesión** y entra con la contraseña nueva. Las sesiones anteriores de esa cuenta quedan cerradas.

## Acto 14 · Cambiar el propio correo (CU19, CU16)

Requiere una **segunda casilla personal de prueba**. Con el apoderado de prueba conectado:

1. **Mi Perfil** › **Editar Perfil** → cambia el **Correo** por la segunda casilla → **Guardar cambios**.

✅ Aparece **"Confirmar nuevo correo"**. El teléfono y la dirección se guardan, pero el correo **todavía no**: la cuenta sigue con el anterior hasta confirmar.

2. En la **segunda** casilla llega **"Confirma tu nuevo correo - SIGAE"**. Ingresa el código → **Confirmar correo**.
3. *Opcional:* en **Cambiar Contraseña**, cambia la contraseña con la actual y la nueva → **Actualizar contraseña**.

## Acto 15 · La administración cambia un correo: se vuelve a verificar

En la ventana del Super Admin:

1. **Gestión de Usuarios** → **Ver Perfil** del apoderado de prueba → **Editar datos** → en **Datos de apoderado**, vuelve a poner el **primer** correo personal → guarda.
2. En incógnito, cierra la sesión del apoderado de prueba y vuelve a entrar.

✅ Pide otra vez **"Activa tu cuenta"** y el código llega al correo nuevo.

> 🗣️ "Cada vez que la administración cambia un correo, el sistema exige comprobar que esa casilla existe y es de la persona."

## Acto 16 · Respaldos que llegan por correo

### 16.1 Respaldo diario de la base

Solo si alguien del equipo tiene acceso a `respaldosigae@colegiojc.cl`.

1. Abre esa cuenta y busca la etiqueta **Respaldos SIGAE** (o el asunto *"Respaldo SIGAE"*).
2. Abre el correo más reciente: trae el archivo `sigae_AAAAMMDD_HHMM.sql.gz` y su LEEME, con la fecha y hora de Chile, el tamaño, el número de tablas, el **SHA-256** y las instrucciones para cargarlo en caso de contingencia.

> 🗣️ "Todos los días, de madrugada, SIGAE envía una copia completa de la base a una cuenta del colegio, fuera de Amazon. Es independiente de los snapshots de la base de datos."

### 16.2 Copia del respaldo del cierre de período

Solo si el colegio **ya inició** el cierre de 2026 en el servidor real.

1. Gestión Académica › **Cierre de Período**. Si el encabezado dice *"cierre no iniciado"*, **no presiones "Iniciar cierre"**: sáltate este paso.
2. Si el cierre ya está iniciado: **Descargar respaldo**. Descargar no cambia nada en el sistema.

✅ En verde: *"Se envió una copia del respaldo a respaldosigae@colegiojc.cl."* Es el mismo botón que en desarrollo mostraba el aviso rojo.

3. 🚫 **No marques la casilla ni presiones "Iniciar nuevo período".**
4. El Excel descargado tiene **datos personales de menores**: bórralo del equipo al terminar.

## Acto 17 · Dejar el servidor como estaba

Como Super Admin:

1. **Gestión de Usuarios** → busca cada cuenta de prueba → **Desactivar** (el sistema no borra usuarios desde la interfaz).
2. Si registraste un administrador de prueba: **Gestión de Administradores** → **Editar** → **Desactivar** → **Guardar cambios**.
3. Comprueba en incógnito que la cuenta de prueba ya no puede entrar: *"Tu cuenta está deshabilitada…"*.
4. **Cerrar Sesión** del Super Admin.

> 🗣️ "Con esto vimos SIGAE completo: en desarrollo, todo lo que ordena el año escolar; y en el servidor real, lo que depende del correo y de la conexión segura."

---

## Apéndice A · Si algo sale mal

| Situación | Qué hacer en vivo |
| --- | --- |
| El correo no llega en 1 o 2 minutos | Revisar **spam** y la pestaña **Promociones**. Si sigue sin llegar, pulsar **Reenviar código** una vez (después de los 60 s). Si tampoco llega, pasar al siguiente acto y avisar al equipo después de la presentación: no se arregla en vivo. |
| *"No fue posible enviar…"* al registrar | La cuenta **no** se creó (es lo esperado si falla el correo). Se puede reintentar más tarde. |
| *"Demasiados intentos…"* | Esperar 15 minutos. En el servidor real, evitar errores de contraseña a propósito. |
| El código ya no sirve | Venció (10 minutos) o se pidió otro: usar **Reenviar código** y el más reciente. |
| La sesión se cerró sola | Fueron 30 minutos sin actividad: volver a entrar. |
| En desarrollo faltan los datos de ejemplo | La base de prueba no estaba recién cargada: el equipo la recarga después y se repite el acto. |

## Apéndice B · Casos de uso cubiertos

| Acto | Casos de uso |
| --- | --- |
| 1 · Ingreso y perfil | CU11, CU12, CU17, CU18, CU19 (datos), CU20 |
| 2 · Parámetros, bloques y eventos | CU48, CU49, CU50, CU51, CU52, CU66, CU70, CU71, CU72, CU81 |
| 3 · Estructura curricular | CU45, CU46, CU47, CU80, CU83, CU106, CU108 |
| 4 · Personas | CU2, CU3, CU6, CU7, CU8, CU9, CU10, CU21, CU22, CU23, CU24, CU25, CU26, CU27, CU28, CU29, CU30, CU31, CU32, CU33, CU34–CU39, CU90, CU91, CU105, CU107 (y validaciones de CU1, CU4, CU5) |
| 5 · Cursos | CU44, CU53, CU95, CU96, CU97 |
| 6 · Horarios | CU43, CU54–CU65, CU67, CU68, CU69, CU84 |
| 7 · Docente y apoderado | CU40, CU41, CU42, CU73–CU79, CU82, CU85–CU89, CU92, CU93, CU94, CU98, CU101 |
| 8 · Cierre del año | CU98, CU99, CU100 y cambio de período |
| 9 · Seguridad | CU13, límite de intentos |
| 10–17 · Servidor real | HTTPS, CU1, CU4, CU5 (contraseña por correo), activación en el primer ingreso, CU14, CU16, CU19 (correo), respaldos por correo |
