# Modelo C4 de SIGAE

Arquitectura de SIGAE (Sistema de Gestión Académica y Escolar) descrita con el
[modelo C4](https://c4model.com/): contexto, contenedores y componentes, más la
vista de despliegue de producción. Los diagramas están en Mermaid y GitHub los
dibuja directamente.

El nivel 4 (código) no se documenta: se lee del propio código. Lo marcado como
*por definir* en `docs/despliegue-produccion.txt` (dominio público, región de AWS)
tampoco aparece aquí.

Colores: azul oscuro = personas, azul = SIGAE, gris = sistemas externos.

---

## Nivel 1 — Contexto del sistema

Quién usa SIGAE y con qué sistemas externos se relaciona.

```mermaid
flowchart TB
    superadmin(["<b>Super Administrador</b><br/>[Persona]<br/>Parámetros institucionales, roles,<br/>bloques horarios y cierre de período"])
    admin(["<b>Administrador</b><br/>[Persona]<br/>Usuarios, estudiantes<br/>y gestión académica"])
    utp(["<b>UTP</b><br/>[Persona]<br/>Administrador o docente con la etiqueta UTP:<br/>solo gestión académica"])
    docente(["<b>Docente</b><br/>[Persona]<br/>Su horario, sus cursos, evaluaciones,<br/>citaciones y mensajes"])
    apoderado(["<b>Apoderado</b><br/>[Persona]<br/>Horario de sus estudiantes,<br/>citaciones y mensajes"])

    sigae["<b>SIGAE</b><br/>[Sistema de software]<br/>Gestión académica y escolar del colegio:<br/>usuarios, cursos, planes, horarios,<br/>citaciones, mensajes y evaluaciones"]

    correo["<b>Correo institucional</b><br/>[Sistema externo: Google Workspace SMTP]<br/>Cuenta noreply@colegiojc.cl"]
    respaldos["<b>Buzón de respaldos</b><br/>[Sistema externo: Gmail + Google Drive]<br/>Cuenta respaldosigae@colegiojc.cl"]

    superadmin -->|"Configura y administra"| sigae
    admin -->|"Administra usuarios y academia"| sigae
    utp -->|"Gestiona planes, cursos y horarios"| sigae
    docente -->|"Consulta y registra"| sigae
    apoderado -->|"Consulta y se comunica"| sigae

    sigae -->|"Envía códigos de verificación<br/>y contraseñas iniciales [SMTP]"| correo
    correo -.->|"Entrega los correos"| docente
    correo -.->|"Entrega los correos"| apoderado
    sigae -->|"Envía el respaldo diario de la base y<br/>el Excel del cierre de período [SMTP]"| respaldos

    classDef persona fill:#08427b,stroke:#052e56,color:#ffffff
    classDef sistema fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef externo fill:#8a8a8a,stroke:#5f5f5f,color:#ffffff
    class superadmin,admin,utp,docente,apoderado persona
    class sigae sistema
    class correo,respaldos externo
```

Notas:

- Los **estudiantes no son usuarios**: no inician sesión. Sus datos los gestiona
  la administración y los consultan docentes y apoderados.
- Una misma persona puede tener varios roles (por ejemplo, docente y apoderado) y
  elige con cuál entra después del login.
- Los códigos de verificación llegan a todos los usuarios; el diagrama solo
  dibuja dos entregas para no recargarlo.
- Los respaldos viajan por el mismo SMTP que los códigos; la copia a Google Drive
  la hace un filtro de Gmail, no SIGAE (`docs/respaldos-por-correo.md`).

---

## Nivel 2 — Contenedores

Las piezas ejecutables y de datos que forman SIGAE.

```mermaid
flowchart TB
    usuarios(["<b>Usuarios</b><br/>[Personas]<br/>Super Administrador, Administrador,<br/>UTP, Docente y Apoderado"])

    subgraph sigae ["SIGAE"]
        direction TB
        nginx["<b>Servidor web y proxy inverso</b><br/>[Contenedor: Nginx + certbot]<br/>Termina HTTPS, sirve la SPA y<br/>reenvía /api y /uploads"]
        spa["<b>Aplicación web (SPA / PWA)</b><br/>[Contenedor: React 19, React Router 7,<br/>Vite, Tailwind CSS]<br/>Interfaz por rol; instalable, con<br/>service worker para la shell"]
        api["<b>API REST</b><br/>[Contenedor: Node.js 22 + Express 4, pm2]<br/>Reglas de negocio, autenticación JWT,<br/>permisos y exportaciones"]
        job["<b>Respaldo diario</b><br/>[Contenedor: script Node.js,<br/>timer / cron]<br/>scripts/enviarRespaldo.js:<br/>volcado comprimido de la base"]
        uploads[("<b>Fotos de perfil</b><br/>[Contenedor: sistema de archivos]<br/>/var/sigae/uploads")]
        db[("<b>Base de datos</b><br/>[Contenedor: MariaDB 10.11]<br/>Usuarios, estudiantes, cursos, planes,<br/>horarios, citaciones, mensajes,<br/>sesiones e historial (33 tablas)")]
    end

    correo["<b>Correo institucional</b><br/>[Sistema externo: Google Workspace SMTP]"]
    respaldos["<b>Buzón de respaldos</b><br/>[Sistema externo: Gmail + Google Drive]"]

    usuarios -->|"Usan [HTTPS]"| nginx
    nginx -->|"Entrega los archivos estáticos (dist/)"| spa
    spa -->|"Llama a /api con Bearer JWT<br/>[JSON / HTTPS]"| nginx
    nginx -->|"Reenvía /api y /uploads<br/>[HTTP, 127.0.0.1:3000]"| api
    api -->|"Guarda y sirve imágenes"| uploads
    api -->|"Lee y escribe<br/>[mysql2, TLS, 3306]"| db
    job -->|"Vuelca la base<br/>[mariadb-dump]"| db
    api -->|"Códigos, contraseñas<br/>y Excel del cierre [SMTP]"| correo
    job -->|"Respaldo .sql.gz [SMTP]"| correo
    correo -->|"Entrega los respaldos"| respaldos

    classDef persona fill:#08427b,stroke:#052e56,color:#ffffff
    classDef contenedor fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef externo fill:#8a8a8a,stroke:#5f5f5f,color:#ffffff
    class usuarios persona
    class nginx,spa,api,job,db,uploads contenedor
    class correo,respaldos externo
```

| Contenedor | Tecnología | Código | Responsabilidad |
| --- | --- | --- | --- |
| Servidor web y proxy | Nginx + certbot | (configuración en el servidor) | HTTPS, `/` → `dist/`, `/api` y `/uploads` → API. Único punto de entrada público. |
| Aplicación web | React 19, React Router 7, Vite 8, Tailwind 4 | `webSIGAE/FrontEnd/` | Interfaz de todos los roles. Se ejecuta en el navegador; guarda el JWT en `localStorage`. El service worker (`public/sw.js`) cachea solo recursos estáticos, nunca `/api` ni `/uploads`. |
| API REST | Node.js 22, Express 4, pm2 (`sigae-api`) | `webSIGAE/BackEnd/` | Toda la lógica de negocio. Genera exportaciones de horarios y el Excel del cierre de período (Puppeteer con Chromium del sistema, pdfkit, exceljs). |
| Respaldo diario | Node.js + `mariadb-dump` | `webSIGAE/BackEnd/scripts/enviarRespaldo.js` | Proceso aparte, programado: vuelca la base y la envía por correo con su SHA-256. |
| Base de datos | MariaDB 10.11 | `webSIGAE/Database/` | Estado del sistema. La API se conecta con un usuario sin DDL (`sigae_app`). |
| Fotos de perfil | Disco del servidor | `UPLOADS_DIR` | Imágenes subidas (hasta 5 MB). No las cubren los snapshots de la base. |

En **desarrollo** no hay Nginx: Vite sirve la SPA en `:5173` y su proxy reenvía
`/api` y `/uploads` a la API en `:3000`; la base es un MariaDB/MySQL local y, sin
`SMTP_HOST`, los códigos se muestran en la consola del backend.

---

## Nivel 3 — Componentes de la API REST

Cada módulo es un grupo de `routes/` + `controllers/` + `utils/` del backend.

```mermaid
flowchart TB
    spa["<b>Aplicación web (SPA)</b><br/>[Contenedor: React]"]

    subgraph api ["API REST  [Node.js + Express]"]
        direction TB

        subgraph transversal ["Entrada y seguridad"]
            direction LR
            http["<b>Servidor HTTP</b><br/>[server.js]<br/>helmet, CORS, redirección a HTTPS,<br/>manejo global de errores"]
            limiter["<b>Límite de intentos</b><br/>[middleware/rateLimiter]<br/>Login, recuperación y códigos"]
            validacion["<b>Validación</b><br/>[middleware/validation]<br/>express-validator"]
            auth["<b>Autorización</b><br/>[middleware/authMiddleware,<br/>utils/permisos]<br/>JWT + sesión activa + rol / UTP"]
        end

        subgraph modulos ["Módulos de negocio"]
            direction LR
            mAuth["<b>Autenticación</b><br/>/api/auth<br/>Login, selección de rol, logout,<br/>recuperación y primer ingreso"]
            mUsuarios["<b>Usuarios</b><br/>/api/usuarios, /api/especialidades<br/>Cuentas, roles, perfil y foto,<br/>disponibilidad, horas PIE"]
            mEstudiantes["<b>Estudiantes</b><br/>/api/estudiantes<br/>Ficha, apoderados,<br/>ruta de formación"]
            mAcademia["<b>Gestión académica</b><br/>/api/cursos, /api/planes,<br/>/api/electivos, /api/colores<br/>Cursos, jefaturas, asignaturas,<br/>planes y electivos"]
            mHorarios["<b>Horarios</b><br/>/api/horarios, /api/bloques,<br/>/api/horario-atencion<br/>Bloques, clases, conflictos,<br/>atención de apoderados"]
            mComunic["<b>Comunicaciones</b><br/>/api/citaciones, /api/mensajes,<br/>/api/evaluaciones, /api/notificaciones<br/>Citaciones, mensajería, calendario<br/>de evaluaciones y campana"]
            mPeriodo["<b>Períodos y promoción</b><br/>/api/promocion<br/>Situación final, promoción,<br/>cierre y limpieza de período"]
            mDashboard["<b>Dashboard</b><br/>/api/dashboard<br/>Indicadores por rol"]
        end

        subgraph soporte ["Servicios compartidos"]
            direction LR
            export["<b>Exportación</b><br/>[exportController]<br/>Horarios a PNG, PDF y Excel<br/>(Puppeteer, pdfkit, exceljs)"]
            codigos["<b>Códigos y contraseñas</b><br/>[utils/codigosVerificacion,<br/>contrasenaInicial, primerIngreso]"]
            mailer["<b>Mailer</b><br/>[utils/mailer]<br/>nodemailer"]
            notif["<b>Notificaciones</b><br/>[utils/notificaciones]"]
            historial["<b>Auditoría</b><br/>[utils/historial]<br/>Tabla historial"]
            fotos["<b>Subida de fotos</b><br/>[middleware/uploadFotoPerfil]<br/>multer + verificación de imagen"]
            pool["<b>Acceso a datos</b><br/>[config/db]<br/>Pool mysql2, SQL parametrizado"]
        end
    end

    db[("<b>Base de datos</b><br/>[MariaDB]")]
    uploads[("<b>Fotos de perfil</b><br/>[Sistema de archivos]")]
    correo["<b>Correo institucional</b><br/>[Google Workspace SMTP]"]

    spa -->|"JSON / HTTPS"| http
    http --> limiter --> validacion --> auth
    auth --> modulos

    mAuth --> codigos
    mUsuarios --> codigos
    mUsuarios --> fotos
    mHorarios --> export
    mPeriodo -->|"Excel del cierre"| mailer
    codigos --> mailer
    mComunic --> notif
    modulos --> historial
    modulos --> pool
    auth -->|"Comprueba la sesión"| pool
    notif --> pool
    historial --> pool

    pool -->|"SQL / TLS"| db
    fotos --> uploads
    mailer -->|"SMTP"| correo

    classDef contenedor fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef componente fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef externo fill:#8a8a8a,stroke:#5f5f5f,color:#ffffff
    class spa,db,uploads contenedor
    class http,limiter,validacion,auth,mAuth,mUsuarios,mEstudiantes,mAcademia,mHorarios,mComunic,mPeriodo,mDashboard,export,codigos,mailer,notif,historial,fotos,pool componente
    class correo externo
```

| Componente | Archivos principales |
| --- | --- |
| Autenticación | `authController`, `passwordController`, `utils/sesion` (en `sesion` se guarda el hash SHA-256 del JWT) |
| Usuarios | `usuarioController`, `disponibilidadLaboralController`, `pieController`, `especialidadController` |
| Estudiantes | `estudianteController`, `apoderadosEstudianteController`, `utils/rutaFormacion` |
| Gestión académica | `cursoController`, `profesorJefeController`, `planController`, `electivoController`, `colorController`, `utils/tramos` |
| Horarios | `horarioController`, `bloquesController`, `conflictosHorarioController`, `horarioAtencionController`, `exportController` |
| Comunicaciones | `citacionController`, `solicitudCitacionController`, `mensajeController`, `evaluacionController`, `notificacionController` |
| Períodos y promoción | `promocionController`, `periodoController`, `utils/periodos`, `utils/situacionFinal`, `utils/limpiezaPeriodo` |
| Autorización | `verifyToken`, `verifyAdmin`, `verifyGestionAcademica`, `verifySuperAdmin`, `verifyPuedeCrearRol` |

No hay capa de repositorio ni ORM: los controladores ejecutan SQL parametrizado
directamente sobre el pool.

---

## Nivel 3 — Componentes de la aplicación web

```mermaid
flowchart TB
    usuario(["<b>Usuario</b><br/>[Persona]"])

    subgraph spa ["Aplicación web  [React + Vite]"]
        direction TB
        router["<b>Enrutador</b><br/>[routes/AppRouter, ProtectedRoute]<br/>Rutas públicas y rutas protegidas por rol"]
        authctx["<b>Contexto de sesión</b><br/>[pages/context/AuthContext]<br/>Usuario, token y rol activo<br/>(localStorage)"]
        layout["<b>Layout principal</b><br/>[layouts/MainLayout]<br/>Sidebar por rol y campana<br/>de notificaciones"]

        subgraph paginas ["Páginas"]
            direction LR
            pAuth["<b>Acceso</b><br/>[pages/auth]<br/>Login, selección de rol,<br/>recuperar contraseña"]
            pUsers["<b>Usuarios</b><br/>[pages/users]<br/>Registro, búsqueda, roles<br/>y perfil"]
            pAcad["<b>Gestión académica</b><br/>[pages/academic]<br/>Cursos, estudiantes, planes,<br/>electivos, horarios, cierre"]
            pCom["<b>Comunicaciones</b><br/>[pages/communications]<br/>Mensajes, citaciones,<br/>calendario de evaluaciones"]
            pDash["<b>Dashboard</b><br/>[pages/dashboard]"]
        end

        comp["<b>Componentes compartidos</b><br/>[components/]<br/>Horario semanal, modales de citación,<br/>editor de tramos, exportación"]
        permisos["<b>Permisos y validaciones</b><br/>[utils/permisos, utils/validaciones]<br/>Mismas reglas que el backend"]
        cliente["<b>Cliente de la API</b><br/>[services/api]<br/>fetch con Bearer JWT; cierra la<br/>sesión si la API responde 401"]
        sw["<b>Service worker</b><br/>[public/sw.js, manifest.json]<br/>PWA: caché de recursos estáticos"]
    end

    api["<b>API REST</b><br/>[Contenedor: Node.js + Express]"]

    usuario --> router
    router --> authctx
    router --> pAuth
    router --> layout
    layout --> paginas
    paginas --> comp
    paginas --> permisos
    layout --> permisos
    paginas --> cliente
    comp --> cliente
    authctx --> cliente
    cliente -->|"JSON / HTTPS"| api

    classDef persona fill:#08427b,stroke:#052e56,color:#ffffff
    classDef contenedor fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef componente fill:#85bbf0,stroke:#5d82a8,color:#000000
    class usuario persona
    class api contenedor
    class router,authctx,layout,pAuth,pUsers,pAcad,pCom,pDash,comp,permisos,cliente,sw componente
```

Los permisos del frontend solo deciden **qué se muestra**; la API vuelve a
comprobar cada permiso en `authMiddleware` y en los controladores.

---

## Despliegue — Producción (marcha blanca)

```mermaid
flowchart TB
    subgraph cliente ["Dispositivo del usuario"]
        navegador["<b>Navegador</b><br/>SPA / PWA de SIGAE"]
    end

    subgraph aws ["Amazon Web Services"]
        subgraph ec2 ["EC2 — Debian 13, t3.small"]
            nginx["<b>Nginx + certbot</b><br/>Puertos 80 y 443"]
            dist[("<b>dist/</b><br/>Frontend compilado")]
            pm2["<b>pm2 → sigae-api</b><br/>Node.js 22, 127.0.0.1:3000"]
            chromium["<b>Chromium</b><br/>/usr/bin/chromium<br/>(exportación a PNG)"]
            timer["<b>Timer / cron</b><br/>enviarRespaldo.js"]
            disco[("<b>/var/sigae/uploads</b><br/>Fotos de perfil")]
        end
        subgraph rds ["Amazon RDS — sin acceso público"]
            mariadb[("<b>MariaDB 10.11</b><br/>Base sigae<br/>Snapshots automáticos")]
        end
    end

    subgraph google ["Google Workspace (colegiojc.cl)"]
        smtp["<b>smtp.gmail.com:465</b><br/>noreply@colegiojc.cl"]
        buzon["<b>respaldosigae@colegiojc.cl</b><br/>Gmail + Drive"]
    end

    codespaces["<b>GitHub Codespaces</b><br/>Compila el frontend (vite build)"]
    tailscale["<b>Tailscale</b><br/>Acceso SSH (puerto 22 cerrado al público)"]

    navegador -->|"HTTPS 443"| nginx
    nginx --> dist
    nginx -->|"/api, /uploads"| pm2
    pm2 --> chromium
    pm2 --> disco
    pm2 -->|"3306, TLS"| mariadb
    timer -->|"mariadb-dump"| mariadb
    pm2 -->|"SMTP"| smtp
    timer -->|"SMTP"| smtp
    smtp --> buzon
    codespaces -.->|"Copia de dist/"| dist
    tailscale -.->|"Administración"| ec2

    classDef nodo fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef externo fill:#8a8a8a,stroke:#5f5f5f,color:#ffffff
    class navegador,nginx,dist,pm2,chromium,timer,disco,mariadb nodo
    class smtp,buzon,codespaces,tailscale externo
```

Detalle paso a paso: [`despliegue-produccion.txt`](despliegue-produccion.txt).

---

## Mantener este documento

Actualízalo en el mismo commit cuando cambie algo de lo que dibuja:

- un rol nuevo o un sistema externo nuevo → nivel 1;
- un proceso, almacén de datos o servicio nuevo → nivel 2 y despliegue;
- un archivo nuevo en `routes/` montado en `server.js`, o una carpeta nueva en
  `FrontEnd/src/pages/` → nivel 3.
