# REPORTE — Modelos SIGAE por incremento

Fuentes (carpeta `modelos/`, copias exactas de Drive):

| Modelo | Archivo base | Uso |
|---|---|---|
| Modelo físico | `Modelo_Fisico_Incremento_3.drawio` | Base única de las cuatro versiones |
| Modelo físico (borrador del equipo) | `Modelo_fisico_incremento_4.drawio` | Solo se tomaron 12 filas nuevas (ver 4) |
| Componentes | `Diagrama_de_Componentes_Incremento3.drawio` | Base única |
| Despliegue | `Diagrama_de_despliegue_Incremento3.drawio` | Base única |
| Árbol de navegación | `arbol_navegacion_inc4.drawio` | Base de las cuatro versiones; la versión 4 es este archivo sin cambios |
| Árbol de navegación | `arbol_navegacion_inc3 (1).drawio` | Origen de la paleta y de los bordes previos a "ampliado en Inc. 4" |

Verificación hecha sobre los 16 archivos: XML bien formado y sin comprimir, sin identificadores duplicados, ninguna relación anclada a un elemento inexistente, cada versión N contenida en la N+1. **No se pudo abrir los archivos en app.diagrams.net desde el entorno de generación (red bloqueada); falta esa comprobación visual.**

## 1. Paleta

El estándar es el árbol de navegación, cuyos colores **no se modificaron**. El árbol usa dos tonos por incremento:

| Incremento | Uso en el árbol | fillColor | strokeColor | fontColor |
|---|---|---|---|---|
| 1 | Interfaz | `#0000FF` | `#006EAF` | `#ffffff` |
| 1 | Funcionalidad | `#1BA1E2` | `#006EAF` | `#ffffff` |
| 2 | Interfaz | `#2E7D32` | `#1B5E20` | `#FFFFFF` |
| 2 | Funcionalidad | `#60A917` | `#2D7600` | `#FFFFFF` |
| 3 | Interfaz | `#E65100` | `#666666` | `#ffffff` |
| 3 | Funcionalidad | `#FFB300` | `#666666` | `#000000` |
| 4 | Interfaz | `#7B1FA2` | `#4A148C` | `#ffffff` |
| 4 | Funcionalidad | `#F48FB1` | `#4A148C` | `#000000` |
| 4 | Existente ampliado en Inc. 4 | (el del nodo) | `#6A1B9A` punteado | (el del nodo) |

Modelo físico, componentes y despliegue no distinguen interfaz de funcionalidad y usan el tono de funcionalidad del árbol:

| Incremento | fillColor | strokeColor | fontColor |
|---|---|---|---|
| 1 | `#1BA1E2` | `#006EAF` | `#FFFFFF` |
| 2 | `#60A917` | `#2D7600` | `#FFFFFF` |
| 3 | `#FFB300` | `#BF360C` | `#000000` |
| 4 | `#F48FB1` | `#4A148C` | `#000000` |

Notas: el borde del incremento 3 es `#BF360C` en el árbol Inc. 3 y `#666666` en el árbol Inc. 4; en los otros modelos se usó `#BF360C`. En el árbol hay variantes menores de borde que se conservaron tal cual (`#000000`, `#005700`, `default`, `light-dark(...)`). La leyenda del árbol muestra `#0FC0BA` para "Funcionalidades Inc 1" aunque los nodos usan `#1BA1E2`.

## 2. Asignación por modelo

### 2.1 Modelo físico

| Versión | Tablas | Filas | Relaciones |
|---|---|---|---|
| 1 | 6 | 60 | 6 |
| 2 | 16 | 108 | 20 |
| 3 | 19 | 136 | 25 |
| 4 | 19 | 143 | 25 |

**Tablas**

| Tabla | Incremento | Justificación |
|---|---|---|
| Usuario | 1 | RF01, RF04, RF05 |
| Sesion | 1 | RF09, RF10 |
| Solicitud_Recuperacion | 1 | RF11 |
| Historial | 1 | Auditoría de cambios (RF03, RF14, RF23); sin RF propio |
| Estudiante | 1 | RF06 |
| Curso | 1 | RF06, RF23: curso asociado de la ficha (columnas mínimas) |
| Nivel_Educativo | 2 | RF27 |
| Plan_Educativo | 2 | RF27 |
| IncluyeAsig | 2 | RF27, RF28 |
| Asignatura | 2 | RF28 |
| TieneAsig | 2 | RF33 |
| Horario_Asignatura | 2 | RF34, RF35 |
| Bloque_Horario | 2 | RF29 |
| Parametro_Institucional | 2 | RF32 |
| Evento_Institucional | 2 | RF46 |
| Afecta | 2 | RF42 |
| Conversacion | 3 | RF47 |
| Mensaje | 3 | RF47 |
| Citacion | 3 | RF48 |

**Filas cuyo incremento difiere del de su tabla** (el resto de las filas entra con su tabla)

| Tabla | Fila | Incremento | Justificación |
|---|---|---|---|
| Usuario | `Docente_Recepcion_Mensajes_Habilitada (BOOLEAN)` | 3 | RF54 |
| Historial | `FK Citacion_Id (INT)` | 3 | Apunta a tabla del 3 |
| Historial | `FK Horario_Asignatura_Id (INT)` | 2 | Apunta a tabla del 2 |
| Horario_Asignatura | `Horario_Asignatura_Periodo_Lectivo (VARCHAR(20))` | 4 | RF61 (periodo lectivo) |
| Curso | `Curso_Periodo_Lectivo (VARCHAR(20))` | 4 | RF61 (periodo lectivo) |
| Curso | `FK Nivel_Educativo_Id (INT)` | 2 | RF26, RF27 (tabla del 2) |
| Curso | `FK Profesor_Jefe_Usuario_Id (INT)` | 4 | RF60 |
| Nivel_Educativo | `Nivel_Educativo_Orden (INT)` | 4 | RF61 (orden de promoción) |
| Parametro_Institucional | `Parametro_Institucional_Periodo_Vigente (VARCHAR(20))` | 4 | RF61 (periodo lectivo) |
| Parametro_Institucional | `Parametro_Institucional_Periodo_Siguiente (VARCHAR(20))` | 4 | RF61 (periodo lectivo) |
| Parametro_Institucional | `Parametro_Institucional_Cierre_Iniciado (BOOLEAN)` | 4 | RF61 (periodo lectivo) |
| Estudiante | `Estudiante_Ruta_Formacion (VARCHAR(20))` | 1 | CU105 (RF23); fila nueva, mismo incremento que la tabla |

**Relaciones**

| Relación | Incremento | Nota |
|---|---|---|
| Usuario → Sesion | 1 |  |
| Usuario → Solicitud_Recuperacion | 1 |  |
| Usuario → Historial | 1 |  |
| Citacion → Historial | 3 | Sin ancla en el original; extremos deducidos por posición |
| Estudiante → Historial | 1 |  |
| Horario_Asignatura → Historial | 2 | Sin ancla en el original; extremos deducidos por posición |
| Usuario → Horario_Asignatura | 2 |  |
| Usuario → Conversacion | 3 |  |
| Usuario → Citacion | 3 |  |
| Usuario → Estudiante | 1 |  |
| Curso → Estudiante | 1 | Sin ancla en el original; extremos deducidos por posición |
| Nivel_Educativo → Curso | 2 |  |
| TieneAsig → Curso | 2 |  |
| Asignatura → TieneAsig | 2 |  |
| Asignatura → IncluyeAsig | 2 |  |
| IncluyeAsig → Plan_Educativo | 2 |  |
| Nivel_Educativo → Plan_Educativo | 2 |  |
| Bloque_Horario → Horario_Asignatura | 2 |  |
| Bloque_Horario → Afecta | 2 |  |
| Afecta → Evento_Institucional | 2 |  |
| Parametro_Institucional → Bloque_Horario | 2 |  |
| Curso → Horario_Asignatura | 2 |  |
| Asignatura → Horario_Asignatura | 2 |  |
| Estudiante → Citacion | 3 |  |
| Conversacion → Mensaje | 3 |  |

Cambios respecto del original: Curso pasa de color 2 a color 1; las cuatro columnas de dirección de Usuario y de Estudiante pasan del 3 al 1 (RF05, RF06, RF14, RF23) y ambas tablas pierden el borde punteado de "modificada en Inc. 3"; se reemplazó la leyenda y se quitó la nota explicativa. La versión 3 tiene las mismas tablas y relaciones que el original más cinco filas (ver 4).

### 2.2 Diagrama de componentes

| Versión | Elementos | Archivos listados |
|---|---|---|
| 1 | 34 | 75 |
| 2 | 45 | 112 |
| 3 | 58 | 143 |
| 4 | 58 | 143 |

La caja toma el color de su archivo más antiguo; los archivos de incrementos posteriores se quitan en las versiones anteriores y aparecen resaltados con el color de su incremento.

| Elemento | Contenido | Incremento | Justificación |
|---|---|---|---|
| `c_nucleo` | Núcleo de la aplicación / AppRouter.jsx / ProtectedRoute.jsx / AuthContext.jsx / MainLayout.jsx / api.js · val | 1 | Transversal (router, autenticación, API base) |
| `c_auth` | Páginas de autenticación / Login.jsx / SelectRole.jsx / ForgotPassword.jsx / ResetPassword.jsx / SessionExpire | 1 | RF09–RF12 |
| `c_dash` | Dashboard.jsx / Reportes.jsx | 1 | Sin RF; conserva su incremento original |
| `c_users1` | Páginas de usuarios / Usuarios.jsx · Apoderados.jsx / Perfil.jsx · GestionRoles.jsx / FormEditarUsuario.jsx /  | 1 | RF01, RF04–RF06, RF13–RF17 |
| `c_users2` | Páginas de usuarios / Administradores.jsx / BuscarUsuarios.jsx / Docentes.jsx | 1 | RF02, RF18, RF19 (antes color 2) |
| `c_acad2` | Páginas académicas / Estudiantes.jsx / HorarioMaestro.jsx / MiHorario.jsx | 1 | RF21, RF22 (Estudiantes.jsx) |
| `c_comp2` | Componentes / ExportMenu.jsx / ListaEstudiantesApoderado.jsx | 1 | RF24 (ListaEstudiantesApoderado.jsx) |
| `c_mw1` | authMiddleware.js / rateLimiter.js / validation.js | 1 | Transversal |
| `c_mw2` | uploadFotoPerfil.js / multer | 1 | RF14, foto de perfil (antes color 2) |
| `c_rutas1` | authRoutes.js · usuarioRoutes.js / estudianteRoutes.js · cursoRoutes.js / horarioRoutes.js · bloquesRoutes.js  | 1 | Transversal / RF01–RF24 |
| `c_ctrl1` | authController.js / usuarioController.js / roleController.js / passwordController.js / estudianteController.js | 1 | RF01–RF24 |
| `c_server` | Servidor HTTP / server.js | 1 | Transversal |
| `c_logs` | Registros de / auditoría | 1 | Transversal; sin RF |
| `c_conexion` | Conexión Base de Datos / config/db.js · mysql2 | 1 | Transversal |
| `c_mysql` | MySQL / SIGAE.sql | 1 | Transversal |
| `c_backup` | Almacenamiento de respaldos / Copias diarias | 1 | Transversal |
| `c_acad1` | Páginas académicas / Cursos.jsx / Asignaturas.jsx / PlanEducativo.jsx / Horarios.jsx / BloquesHorarios.jsx | 2 | RF26–RF34 (antes color 1) |
| `c_pag3` | Páginas / ConsultaHorarios.jsx / HistorialCitaciones.jsx | 2 | RF43, RF44 (ConsultaHorarios.jsx; antes color 3) |
| `c_hor3` | Componentes de horarios / DetalleBloqueModal.jsx | 2 | RF45 (antes color 3) |
| `c_export` | exportController.js / CU60 a CU62 | 2 | RF39 |
| `c_libs` | Librerías de exportación / pdfkit · exceljs · puppeteer | 2 | RF39 |
| `c_tests2` | Pruebas automatizadas Jest / 17 archivos .test.js | 2 | Sin RF; conserva su incremento original |
| `n_docs` | Documentación técnica del Incremento 2: / Database/HISTORIAL.md / MainLayout.md · BackEnd/.gitignore | 2 | Sin RF; conserva su incremento original |
| `c_com1` | Páginas de comunicación / Citaciones.jsx / Mensajes.jsx | 3 | RF47, RF48 (antes color 1) |
| `c_cit3` | Componentes de citaciones / FormCitacionModal.jsx / DetalleCitacionModal.jsx / EstadoCitacionBadge.jsx | 3 | RF48–RF53 |
| `c_util3` | Utilidades / citaciones.js | 3 | RF48 |
| `c_rutas3` | citacionRoutes.js / mensajeRoutes.js | 3 | RF47, RF48 |
| `c_cit` | citacionController.js / CU74 a CU79 | 3 | RF48–RF53 |
| `c_msg` | mensajeController.js / CU73 | 3 | RF47 |
| `c_tablas3` | Tablas citacion, conversacion y mensaje / Dirección estructurada en estudiante | 3 | RF47, RF48 |
| `c_tests3` | Pruebas automatizadas Jest / 6 archivos .test.js: / citaciones · mensajes / edicionMasivaHorarios / consultasH | 3 | Sin RF; conserva su incremento original |
| `pkg_clientes`, `pkg_servidor`, `pkg_rutas`, `pkg_middleware`, `pkg_controladores`, `pkg_bd`, `pkg_backup` | Los 7 paquetes contenedores | 1 | Contenedores transversales (sin color) |
| `actor_usuario` | Actor Usuario | 1 | Transversal |
| `n_sidebar` | Nota: Sidebar.jsx se integró en MainLayout.jsx durante el Incremento 2 | 2 | Nota; conserva su incremento original |
| `t_amp`, `t_hor` | Notas "Ampliados en el Incremento 3…" y "horarioController.js se amplía en el Incremento 3…" | 3 | Notas del Incremento 3, sin editar |

**Archivos que entran después que su caja**

| Caja | Archivo | Incremento | Justificación |
|---|---|---|---|
| `c_acad2` | HorarioMaestro.jsx | 2 | RF36 |
| `c_acad2` | MiHorario.jsx | 2 | RF37 / CU43: depende de horarios (dependencia cruzada) |
| `c_comp2` | ExportMenu.jsx | 2 | RF39 |
| `c_rutas1` | cursoRoutes.js | 2 | RF26 |
| `c_rutas1` | horarioRoutes.js | 2 | RF34 |
| `c_rutas1` | bloquesRoutes.js | 2 | RF29 |
| `c_rutas1` | planRoutes.js | 2 | RF27 |
| `c_ctrl1` | cursoController.js | 2 | RF26 |
| `c_ctrl1` | planController.js | 2 | RF27 |
| `c_ctrl1` | bloquesController.js | 2 | RF29 |
| `c_ctrl1` | horarioController.js | 2 | RF34 |
| `c_pag3` | HistorialCitaciones.jsx | 3 | RF53 |

**Relaciones** (entran con el mayor incremento de sus extremos)

| Relación | Extremos | Incremento |
|---|---|---|
| `e_usuario` | actor_usuario -> pkg_clientes | 1 |
| `e_cli_srv` | pkg_clientes -> pkg_servidor | 1 |
| `e_mw_rutas` | pkg_middleware -> pkg_rutas | 1 |
| `e_rutas_ctrl` | pkg_rutas -> pkg_controladores | 1 |
| `e_ctrl_con` | pkg_controladores -> c_conexion | 1 |
| `e_con_bd` | c_conexion -> c_mysql | 1 |
| `e_backup` | c_mysql -> c_backup | 1 |
| `e_mw_upload` | c_mw1 -> c_mw2 | 1 |
| `e_exportmenu` | c_comp2 -> c_export | 2 |
| `e_export_libs` | c_export -> c_libs | 2 |
| `e_tests2` | c_tests2 -> pkg_rutas | 2 |
| `e_tests3` | c_tests3 -> pkg_middleware | 3 |
| `e_cit_front` | c_cit3 -> c_cit | 3 |
| `e_msg_front` | c_com1 -> c_msg | 3 |

La versión 3 contiene exactamente los elementos y archivos del original. La versión 4 es igual a la 3: el modelo no tiene nada para RF60–RF62 y no se inventó.

### 2.3 Diagrama de despliegue

| Elemento | Incremento | Justificación |
|---|---|---|
| Nodo Usuario interno | 1 | Infraestructura base |
| Nodo Usuario externo | 1 | Infraestructura base |
| Nodo AppServer01 | 1 | Infraestructura base |
| Nodo DBServer01 | 1 | Infraestructura base |
| Nodo GCP-CloudBackup | 1 | Infraestructura base |
| 4 conexiones (HTTP/HTTPS, HTTPS, TCP/IP 3306, HTTPS) | 1 | Infraestructura base |
| 5 textos de requisitos | 1 | Infraestructura base |
| Usuario interno: Aplicación Web Base: React, Vite y Tailwind CSS | 1 | Ya separado por incremento en el original |
| Usuario interno: Vistas Avanzadas: Horarios y Exportación | 2 | Ya separado por incremento en el original |
| Usuario interno: Módulo de Mensajería y Citaciones | 3 | Ya separado por incremento en el original |
| Usuario externo: Aplicación Web Base: React, Vite y Tailwind CSS | 1 | Ya separado por incremento en el original |
| Usuario externo: Vistas Avanzadas: Horarios y Exportación | 2 | Ya separado por incremento en el original |
| Usuario externo: Módulo de Mensajería y Citaciones | 3 | Ya separado por incremento en el original |
| AppServer01: Node.js runtime / Backend API REST Base | 1 | Ya separado por incremento en el original |
| AppServer01: Librerías de Exportación: pdfkit, exceljs y puppeteer | 2 | Ya separado por incremento en el original |
| AppServer01: Controladores de Citaciones y Mensajería | 3 | Ya separado por incremento en el original |
| DBServer01: Motor MySQL / Tablas Base de Usuarios y Cursos | 1 | Ya separado por incremento en el original |
| DBServer01: Tablas de Horarios y Eventos Institucionales | 2 | Ya separado por incremento en el original |
| DBServer01: Tablas: Citación, Conversación y Mensaje | 3 | Ya separado por incremento en el original |
| GCP-CloudBackup: Google Cloud Storage: almacenamiento de respaldos | 1 | Ya separado por incremento en el original |

Versión 1: 21 elementos; versión 2: 25; versiones 3 y 4: 29 (los del original). **La versión 4 es idéntica a la 3**: ningún nodo ni artefacto del modelo cubre RF60–RF62. Único cambio de color: el incremento 3 pasó de `#FA6800`/`#C73500` a `#FFB300`/`#BF360C`.

### 2.4 Árbol de navegación

Decisión del equipo (opción A): se conservan los colores del árbol y cada versión se corta por el color que ya tiene cada nodo. La versión 4 es el árbol Inc. 4 del equipo sin cambios; ninguna versión tiene ramas u hojas que no estén en él. La página "Pantallas Inc3 (bosquejo)" no se incluyó.

| Versión | Nodos de vista | Conectores |
|---|---|---|
| 1 | 62 | 68 |
| 2 | 102 | 107 |
| 3 | 125 | 132 |
| 4 | 144 | 152 |

La versión 3 tiene exactamente los mismos nodos y conectores que el árbol Inc. 3 original del equipo.

| Nodo | Incremento (por color) | Tipo | CU en la etiqueta | Incremento según sección 4 |
|---|---|---|---|---|
| Cerrar sesion | 1 | interfaz | — | — |
| Información Personal | 1 | funcionalidad | — | — |
| Perfil | 1 | interfaz | — | — |
| Cambiar Contraseña | 1 | funcionalidad | — | — |
| Busqueda de usuario | 1 | funcionalidad | — | — |
| Desactivar cuenta | 1 | funcionalidad | — | — |
| Gestión de Usuarios (Submodulo) | 1 | interfaz | — | — |
| Ver perfil | 1 | funcionalidad | — | — |
| Gestión de Usuarios | 1 | interfaz | — | — |
| Gestión de Roles | 1 | interfaz | — | — |
| Busqueda de usuario | 1 | funcionalidad | — | — |
| Agregar o eliminar rol | 1 | funcionalidad | — | — |
| Busqueda de usuario | 1 | funcionalidad | — | — |
| Asignador de Estudiante | 1 | funcionalidad | — | — |
| Gestión de Apoderados | 1 | interfaz | — | — |
| Registrar Admin | 1 | funcionalidad | — | — |
| Registrar Apoderado | 1 | funcionalidad | — | — |
| Registrar Usuario | 1 | interfaz | — | — |
| Registrar Docente | 1 | funcionalidad | — | — |
| Registrar Estudiuante | 1 | funcionalidad | — | — |
| Clonar plan | 1 | funcionalidad | — | — |
| Plan Educativo | 1 | interfaz | — | — |
| Nuevo plan | 1 | funcionalidad | — | — |
| Editar asignatura | 1 | funcionalidad | — | — |
| Asignaturas | 1 | interfaz | — | — |
| Registrar una asignatura | 1 | funcionalidad | — | — |
| Da acceso a los modulos | 1 | funcionalidad | — | — |
| Sideboard | 1 | interfaz | — | — |
| Ver asignaturas de un curso | 1 | funcionalidad | — | — |
| Suspender todas las clases de un curso | 1 | funcionalidad | — | — |
| Suspender una clase de un curso | 1 | funcionalidad | — | — |
| Cursos | 1 | interfaz | — | — |
| Registrar un curso | 1 | funcionalidad | — | — |
| Suspender clases de un docente en un curso | 1 | funcionalidad | — | — |
| Sistema | 1 | interfaz | — | — |
| Base de Datos | 1 | interfaz | — | — |
| Inicio de Sesion | 1 | interfaz | — | — |
| Pantalla inicial | 1 | interfaz | — | — |
| Accesos rápido a los modulos | 1 | funcionalidad | — | — |
| Visualización de Apoderados | 1 | funcionalidad | — | — |
| Visualización de Cursos | 1 | funcionalidad | — | — |
| Editor de bloque de horario | 1 | funcionalidad | — | — |
| visualización de los bloques de horario dependiendo el curso | 1 | funcionalidad | — | — |
| Dashboard | 1 | interfaz | — | — |
| Seleccionar un curso | 1 | funcionalidad | — | — |
| Suspender todas las clases de un curso | 1 | funcionalidad | — | — |
| Visualización de usuario | 1 | funcionalidad | — | — |
| Visualización de Docentes | 1 | funcionalidad | — | — |
| Visualización de Estudiantes | 1 | funcionalidad | — | — |
| Gestion Academica | 1 | interfaz | — | — |
| Horarios | 1 | interfaz | — | — |
| Creador de jornada escolar | 1 | funcionalidad | — | — |
| Parámetros Constitucionales | 1 | interfaz | — | — |
| Guardar los parametros | 1 | funcionalidad | — | — |
| Configuración de bloques | 1 | funcionalidad | — | — |
| visualización de los bloques de horario de todos los cursos | 1 | funcionalidad | — | — |
| Bloques Horarios | 1 | interfaz | — | — |
| Bloque de horarios | 1 | interfaz | — | — |
| Creador de nuevo bloque | 1 | funcionalidad | — | — |
| Evento academicos | 1 | interfaz | — | — |
| Creador de evento académico en el bloque | 1 | funcionalidad | — | — |
| Reportes | 1 | interfaz | — | — |
| Estudiantes asociados CU40 · Apoderado | 2 | interfaz | CU40 | 1 ⚠ |
| Detalle de estudiante CU41 | 2 | interfaz | CU41 | 1 ⚠ |
| Editar datos personales CU19 | 2 | funcionalidad | CU19 | 1 ⚠ |
| Editar fotografía de perfil CU20 | 2 | funcionalidad | CU20 | 1 ⚠ |
| Información complementaria según rol CU17 | 2 | funcionalidad | CU17 | 1 ⚠ |
| Listado de administradores CU2 | 2 | funcionalidad | CU2 | 1 ⚠ |
| Editar administrador (correo, teléfono, estado) CU3 | 2 | funcionalidad | CU3 | 1 ⚠ |
| Gestión de Admins | 2 | interfaz | — | — |
| Filtros avanzados por rol y estado de cuenta CU29 | 2 | funcionalidad | CU29 | 1 ⚠ |
| Búsqueda por nombre, RUT o correo CU28 | 2 | funcionalidad | CU28 | 1 ⚠ |
| Perfil de otro usuario según su rol CU18 | 2 | funcionalidad | CU18 | 1 ⚠ |
| Filtrar por especialidad o estado de cuenta CU31 | 2 | funcionalidad | CU31 | 1 ⚠ |
| Listado de docentes CU30 | 2 | interfaz | CU30 | 1 ⚠ |
| Eliminar todas las asociaciones activas CU9 | 2 | funcionalidad | CU9 | 1 ⚠ |
| Listado de apoderados CU32 | 2 | interfaz | CU32 | 1 ⚠ |
| Eliminar asociación específica CU10 | 2 | funcionalidad | CU10 | 1 ⚠ |
| Filtrar por cantidad de estudiantes asociados CU33 | 2 | funcionalidad | CU33 | 1 ⚠ |
| Estudiantes asociados CU40 · Admin | 2 | interfaz | CU40 | 1 ⚠ |
| Detalle de estudiante CU41 | 2 | interfaz | CU41 | 1 ⚠ |
| Gestión de Estudiantes | 2 | interfaz | — | — |
| Listado de estudiantes CU34 | 2 | funcionalidad | CU34 | 1 ⚠ |
| Filtrado por curso y estado académico CU35 | 2 | funcionalidad | CU35 | 1 ⚠ |
| Búsqueda por nombre o RUT CU36 | 2 | funcionalidad | CU36 | 1 ⚠ |
| Búsqueda combinada y restablecer (Limpiar) CU37 | 2 | funcionalidad | CU37 | 1 ⚠ |
| Edición de ficha estudiantil | 2 | interfaz | — | — |
| Editar curso y estado académico CU38 | 2 | funcionalidad | CU38 | 1 ⚠ |
| Editar asociaciones con apoderados CU39 | 2 | funcionalidad | CU39 | 1 ⚠ |
| Mis cursos y asignaturas CU42 · Docente | 2 | interfaz | CU42 | 1 ⚠ |
| Exportar horario por curso (PDF, Excel, PNG) CU62 | 2 | funcionalidad | CU62 | 2 |
| Horario maestro CU57 | 2 | interfaz | CU57 | 2 |
| Exportar horario maestro (PDF, Excel, PNG) CU60 | 2 | funcionalidad | CU60 | 2 |
| Horario por docente CU58 | 2 | interfaz | CU58 | 2 |
| Exportar horario por docente (PDF, Excel, PNG) CU61 | 2 | funcionalidad | CU61 | 2 |
| Mi horario semanal CU43 · Docente | 2 | interfaz | CU43 | 1 ⚠ |
| Modificar bloque horario CU49 | 2 | funcionalidad | CU49 | 2 |
| Eliminar múltiples bloques horarios CU51 | 2 | funcionalidad | CU51 | 2 |
| Eliminar bloque horario CU50 | 2 | funcionalidad | CU50 | 2 |
| Calendario de eventos institucionales | 2 | interfaz | — | — |
| Registrar evento institucional CU70 | 2 | funcionalidad | CU70 | 2 |
| Eliminar evento institucional CU72 | 2 | funcionalidad | CU72 | 2 |
| Resumen de citaciones y mensajes sin leer Widget opcional · Doc/Apo | 3 | funcionalidad | — | — |
| Filtrar horarios (docente, curso, nivel, asignatura, jornada, día) CU68 · Admin/Doc | 3 | funcionalidad | CU68 | 2 ⚠ |
| Detalle de bloque horario CU69 · Admin/Doc | 3 | interfaz | CU69 | 2 ⚠ |
| Reasignar docente en múltiples bloques CU63 | 3 | funcionalidad | CU63 | 2 ⚠ |
| Selección múltiple de bloques CU63 · CU64 · Admin | 3 | interfaz | CU63, CU64 | 2 ⚠ |
| Modificar múltiples bloques (día, hora, asignatura, docente) CU64 | 3 | funcionalidad | CU64 | 2 ⚠ |
| Suspender bloques por evento institucional CU65 · Admin | 3 | funcionalidad | CU65 | 2 ⚠ |
| Bloques libres disponibles CU67 · Admin | 3 | interfaz | CU67 | 2 ⚠ |
| Suspender jornada completa por evento CU66 · Admin | 3 | funcionalidad | CU66 | 2 ⚠ |
| Modificar evento institucional CU71 · Admin | 3 | funcionalidad | CU71 | 2 ⚠ |
| Enviar mensaje CU73 | 3 | funcionalidad | CU73 | 3 |
| Mensajería CU73 · Docente/Apoderado | 3 | interfaz | CU73 | 3 |
| Bandeja de conversaciones CU73 | 3 | interfaz | CU73 | 3 |
| Chat con contacto CU73 | 3 | interfaz | CU73 | 3 |
| Historial de conversación CU73 | 3 | funcionalidad | CU73 | 3 |
| Confirmar citación CU75 · Apoderado | 3 | funcionalidad | CU75 | 3 |
| Agenda de citaciones CU78 · Doc/Apo | 3 | interfaz | CU78 | 3 |
| Detalle de citación CU75-CU77 · Doc/Apo | 3 | interfaz | CU75, CU77 | 3 |
| Cancelar citación (motivo obligatorio) CU76 · Doc/Apo | 3 | funcionalidad | CU76 | 3 |
| Reprogramar citación (vuelve a pendiente) CU77 · Doc/Apo | 3 | funcionalidad | CU77 | 3 |
| Citaciones CU74-CU79 · Doc/Apo/Admin | 3 | interfaz | CU74, CU79 | 3 |
| Crear citación CU74 · Docente | 3 | funcionalidad | CU74 | 3 |
| Historial y detalle por estudiante CU79 · Doc/Apo/Admin | 3 | interfaz | CU79 | 3 |
| Apoderado titular y suplentes del estudiante CU90 · Admin/Super | 4 | interfaz | CU90 | 1 ⚠ |
| Plan de electivos del período CU108 · Admin | 4 | interfaz | CU108 | 2 ⚠ |
| Estudiantes del curso CU97 · Admin/Docente | 4 | interfaz | CU97 | 4 |
| Profesor jefe del curso CU95 · CU96 · Admin/Super | 4 | interfaz | CU95, CU96 | 4 |
| Designar profesor jefe CU95 · Admin/Super | 4 | funcionalidad | CU95 | 4 |
| Situación final de estudiantes CU98 · CU99 · Prof. jefe/Admin | 4 | interfaz | CU98, CU99 | 4 |
| Cargar situación final por Excel CU99 · Prof. jefe/Admin | 4 | funcionalidad | CU99 | 4 |
| Notificaciones de mensajes y citaciones CU104 · Todos los roles | 4 | interfaz | CU104 | 4 |
| Disponibilidad laboral del docente CU107 · Admin | 4 | interfaz | CU107 | 2 ⚠ |
| Programación de electivos 3° y 4° medio CU106 · Admin | 4 | interfaz | CU106 | 2 ⚠ |
| Clases pendientes de reubicar CU81 · Admin | 4 | interfaz | CU81 | 2 ⚠ |
| Habilitar recepción de mensajes CU85 · Docente | 4 | funcionalidad | CU85 | 3 ⚠ |
| Solicitar citación CU89 · Apoderado | 4 | interfaz | CU89 | 3 ⚠ |
| Horario de atención de apoderados RF55 · Docente | 4 | interfaz | RF55 | — |
| Calendario de evaluaciones CU92 · CU93 · CU94 | 4 | interfaz | CU92, CU93, CU94 | 3 ⚠ |
| Promoción de estudiantes CU100 · CU101 · Admin/Super | 4 | interfaz | CU100, CU101 | 4 |
| Aplicar promoción de estudiante o curso CU100 · CU101 | 4 | funcionalidad | CU100, CU101 | 4 |
| Períodos lectivos CU102 · CU103 · Super Admin | 4 | interfaz | CU102, CU103 | 4 |
| Iniciar nuevo período (respaldo Excel) CU103 · Super Admin | 4 | funcionalidad | CU103 | 4 |

⚠ = el color del nodo no coincide con la sección 4 (43 nodos). No se corrigieron por decisión del equipo; ver sección 3.

## 3. Elementos ambiguos o no asignados — preguntas para el equipo

**Árbol de navegación**

1. Nodos cuyo color contradice la matriz oficial (sección 4). Quedaron con el color del árbol. ¿Se corrige el árbol o se acepta que el árbol refleja el orden de construcción?

| Nodo | Color actual (incremento) | Incremento según sección 4 |
|---|---|---|
| Estudiantes asociados CU40 · Apoderado | 2 | 1 |
| Detalle de estudiante CU41 | 2 | 1 |
| Editar datos personales CU19 | 2 | 1 |
| Editar fotografía de perfil CU20 | 2 | 1 |
| Información complementaria según rol CU17 | 2 | 1 |
| Listado de administradores CU2 | 2 | 1 |
| Editar administrador (correo, teléfono, estado) CU3 | 2 | 1 |
| Filtros avanzados por rol y estado de cuenta CU29 | 2 | 1 |
| Búsqueda por nombre, RUT o correo CU28 | 2 | 1 |
| Perfil de otro usuario según su rol CU18 | 2 | 1 |
| Filtrar por especialidad o estado de cuenta CU31 | 2 | 1 |
| Listado de docentes CU30 | 2 | 1 |
| Eliminar todas las asociaciones activas CU9 | 2 | 1 |
| Listado de apoderados CU32 | 2 | 1 |
| Eliminar asociación específica CU10 | 2 | 1 |
| Filtrar por cantidad de estudiantes asociados CU33 | 2 | 1 |
| Estudiantes asociados CU40 · Admin | 2 | 1 |
| Detalle de estudiante CU41 | 2 | 1 |
| Listado de estudiantes CU34 | 2 | 1 |
| Filtrado por curso y estado académico CU35 | 2 | 1 |
| Búsqueda por nombre o RUT CU36 | 2 | 1 |
| Búsqueda combinada y restablecer (Limpiar) CU37 | 2 | 1 |
| Editar curso y estado académico CU38 | 2 | 1 |
| Editar asociaciones con apoderados CU39 | 2 | 1 |
| Mis cursos y asignaturas CU42 · Docente | 2 | 1 |
| Mi horario semanal CU43 · Docente | 2 | 1 |
| Filtrar horarios (docente, curso, nivel, asignatura, jornada, día) CU68 · Admin/Doc | 3 | 2 |
| Detalle de bloque horario CU69 · Admin/Doc | 3 | 2 |
| Reasignar docente en múltiples bloques CU63 | 3 | 2 |
| Selección múltiple de bloques CU63 · CU64 · Admin | 3 | 2 |
| Modificar múltiples bloques (día, hora, asignatura, docente) CU64 | 3 | 2 |
| Suspender bloques por evento institucional CU65 · Admin | 3 | 2 |
| Bloques libres disponibles CU67 · Admin | 3 | 2 |
| Suspender jornada completa por evento CU66 · Admin | 3 | 2 |
| Modificar evento institucional CU71 · Admin | 3 | 2 |
| Apoderado titular y suplentes del estudiante CU90 · Admin/Super | 4 | 1 |
| Plan de electivos del período CU108 · Admin | 4 | 2 |
| Disponibilidad laboral del docente CU107 · Admin | 4 | 2 |
| Programación de electivos 3° y 4° medio CU106 · Admin | 4 | 2 |
| Clases pendientes de reubicar CU81 · Admin | 4 | 2 |
| Habilitar recepción de mensajes CU85 · Docente | 4 | 3 |
| Solicitar citación CU89 · Apoderado | 4 | 3 |
| Calendario de evaluaciones CU92 · CU93 · CU94 | 4 | 3 |

2. 68 nodos no nombran ningún CU (por ejemplo "Registrar Admin", "Clonar plan", "Creador de nuevo bloque", "Reportes"). Entraron por su color. ¿Qué CU cubre cada uno?
3. En la versión 1 el nodo "Suspender una clase de un curso" (azul) queda sin conector, porque su único camino pasaba por un nodo verde. ¿Es realmente del incremento 1?
4. 39 de los 108 casos de uso no aparecen nombrados en ninguna etiqueta del árbol: CU1, CU4–CU8, CU11–CU16, CU21–CU27, CU44–CU48, CU52–CU56, CU59, CU80, CU82–CU84, CU86–CU88, CU91, CU105. Entre ellos están CU91 y CU105. ¿Están cubiertos por los nodos sin CU o faltan vistas?
5. El árbol original trae conectores sin ancla (75 sin origen, 31 sin destino en el Inc. 4). Se resolvieron por cercanía (12 px). Con ese criterio, 21 nodos del árbol Inc. 4 del equipo no llegan a "Sistema" (p. ej. "Base de Datos", "Parámetros Constitucionales", "Evento academicos" y sus hijos): son líneas que no tocan el nodo en el original. No se movieron.

**Modelo físico**

6. El modelo no tiene tablas para RF55 (horario de atención), RF58/RF59 (calendario de evaluaciones), RF57 (titular y suplentes: Estudiante tiene un solo `FK Apoderado_Usuario_Id`), RF62 (notificaciones) ni electivos más allá de `Asignatura_Es_Electiva`. `SIGAE.sql` sí tiene `horario_atencion`, `evaluacion`, `apoderado_suplente`, `notificacion`, `plan_electivos`, `clase_electivo`, `situacion_final`, entre otras. ¿Se agregan al modelo físico?
7. El borrador `Modelo_fisico_incremento_4.drawio` difiere del Inc. 3 en tres puntos que **no** se aplicaron: (a) `Docente_Carga_Horaria_Semanal` en lugar de `Docente_Carga_Horaria_Maxima`; (b) una sola `Apoderado_Direccion (VARCHAR(200))` en lugar de las cuatro `Usuario_Direccion_*`; (c) `Citacion_Estado` repetida como `VARCHAR(30)` además de `VARCHAR(50)`. Además, la tabla Estudiante del borrador solo tiene dos filas. ¿Cuál es la definición vigente?
8. Las columnas de dirección de Usuario y Estudiante se pasaron del incremento 3 al 1. ¿Correcto?
9. `Historial` no tiene RF propio; se dejó en el 1 como en el original. `FK Profesor_Jefe_Usuario_Id` no tiene línea Usuario→Curso en ningún modelo; no se dibujó.
10. Tres relaciones no están ancladas a tabla en el original (Citacion→Historial, Horario_Asignatura→Historial, Curso→Estudiante). Se dejaron sin anclar.

**Componentes**

11. Sin RF que los justifique: `Dashboard.jsx`, `Reportes.jsx`, registros de auditoría, pruebas Jest (17 y 6 archivos), nota de documentación técnica. Conservan el incremento del original.
12. Las notas "Ampliados en el Incremento 3…" y "horarioController.js se amplía en el Incremento 3 con CU63 a CU69…" contradicen la sección 4 (CU63–CU69 son del 2). Se dejaron sin editar desde la versión 3.
13. La caja "Tablas citacion, conversacion y mensaje / Dirección estructurada en estudiante" quedó entera en el 3, aunque en el modelo físico la dirección pasó al 1.
14. Las pruebas del incremento 3 incluyen `edicionMasivaHorarios` y `consultasHorario`, que prueban funciones del 2 según la sección 4.

**Despliegue**

15. El artefacto "Motor MySQL / Tablas Base de Usuarios y Cursos" es del 1 y menciona cursos; coincide con dejar Curso mínimo en el 1.

## 4. Agregado que no estaba en los modelos base del incremento 3

Solo en el modelo físico, y todo tomado del borrador `Modelo_fisico_incremento_4.drawio` del equipo (nada inventado):

| Tabla | Fila | Aparece desde | Requerimiento |
|---|---|---|---|
| Estudiante | `Estudiante_Ruta_Formacion (VARCHAR(20))` | 1 | CU105 |
| Asignatura | `Asignatura_Es_Electiva (BOOLEAN)` | 2 | CU106–CU108 |
| Usuario | `Docente_Recepcion_Mensajes_Habilitada (BOOLEAN)` | 3 | RF54 |
| Conversacion | `Conversacion_Recepcion_Habilitada (BOOLEAN)` | 3 | RF54 |
| Conversacion | `Conversacion_Recepcion_Hasta (DATETIME)` | 3 | RF54 |
| Curso | `FK Profesor_Jefe_Usuario_Id (INT)` | 4 | RF60 |
| Curso | `Curso_Periodo_Lectivo (VARCHAR(20))` | 4 | RF61 |
| Horario_Asignatura | `Horario_Asignatura_Periodo_Lectivo (VARCHAR(20))` | 4 | RF61 |
| Nivel_Educativo | `Nivel_Educativo_Orden (INT)` | 4 | RF61 |
| Parametro_Institucional | `Parametro_Institucional_Periodo_Vigente (VARCHAR(20))` | 4 | RF61 |
| Parametro_Institucional | `Parametro_Institucional_Periodo_Siguiente (VARCHAR(20))` | 4 | RF61 |
| Parametro_Institucional | `Parametro_Institucional_Cierre_Iniciado (BOOLEAN)` | 4 | RF61 |

Las cinco primeras hacen que la versión 3 del modelo físico tenga cinco filas más que el original (opción A aprobada). Para RF62 no se agregó nada. Componentes y despliegue: versión 4 idéntica a la 3. Árbol: versión 4 es el archivo del equipo.

En los 12 archivos de físico, componentes y despliegue se agregó además la leyenda de colores (celdas `inc_leg_*`).

## 5. Colores del árbol de navegación corregidos

**Ninguno.** Por decisión del equipo se mantuvieron todos los colores del árbol. Únicos ajustes de estilo, solo en las versiones 1 a 3:

| Ajuste | Nodos | Versiones |
|---|---|---|
| Borde punteado morado "ampliado en Inc. 4" devuelto al borde que el nodo tiene en el árbol Inc. 3 (el naranjo `#FF6D00` de "ampliado en Inc. 3" se llevó a `#006EAF`, como hizo el equipo en el Inc. 4) | Dashboard, Sideboard, Plan Educativo, Cursos, Horarios, Guardar los parametros | 1, 2, 3 |
| Ídem | Edición de ficha estudiantil | 2, 3 |
| Ídem (borde `#666666`) | Mensajería, Citaciones | 3 |
| Entradas de leyenda de incrementos posteriores quitadas; título con el número de la versión | Leyenda | 1, 2, 3 |
| Al quitar nodos se quitaron sus conectores; los tramos de línea compartida que quedaban sin nada conectado en un extremo también se quitaron | Conectores | 1, 2, 3 |

## 6. Dependencias cruzadas conocidas

| CU | Incremento oficial | Depende de | Modelo físico y componentes | Árbol |
|---|---|---|---|---|
| CU42, cursos y asignaturas de un docente | 1 | RF33, RF35 (incremento 2) | `TieneAsig`, `Horario_Asignatura` y `cursoController.js` entran en el 2; no se adelantaron | El nodo "Mis cursos y asignaturas / CU42" es verde (2) en el árbol del equipo; **no** quedó en el 1 por la decisión de mantener colores |
| CU43, horario semanal del docente | 1 | RF33, RF35 (incremento 2) | `Horario_Asignatura`, `MiHorario.jsx` y `horarioController.js` entran en el 2 | El nodo "Mi horario semanal / CU43" es verde (2); **no** quedó en el 1 |
| CU91, contactos de titular y suplentes al gestionar una citación | 1 | Citaciones (incremento 3) | `Citacion` y los componentes de citaciones entran en el 3 | No existe nodo para CU91; el nodo de CU90 es morado (4) |

La instrucción original pedía estos tres nodos en el incremento 1 con color del 1; quedó sin aplicar porque después se decidió no cambiar colores del árbol. Si el equipo corrige el árbol, estos son los primeros nodos a mover.

