# SIGAE — Sistema de Gestión Académica y Escolar

> ⚠️ Proyecto en desarrollo activo. No apto para producción.

## ¿Qué es SIGAE?

SIGAE es una plataforma web para la gestión académica y escolar, con módulos para administración, docentes y apoderados. Permite gestionar cursos, asignaturas, citaciones, horarios y comunicaciones internas.

## Stack tecnológico

| Capa                  | Tecnología        |
| --------------------- | ----------------- |
| Frontend              | Vite + React      |
| Backend               | Node.js + Express |
| Base de datos         | MariaDB / MySQL   |
| Entorno de desarrollo | GitHub Codespaces |

---

## 🚀 Primeros pasos

Hay un script de setup por sistema. Ambos hacen lo mismo: crean la base de datos y el usuario `sigae`, importan `SIGAE.sql`, instalan las dependencias del backend y del frontend, escriben `webSIGAE/BackEnd/.env` y hashean las contraseñas de prueba. Se pueden correr cuantas veces quieras; también sirven para **dejar todo al día** cuando algo deja de funcionar.

| Dónde trabajas | Script |
| --- | --- |
| GitHub Codespaces, Linux o macOS | `bash .devcontainer/setup.sh` |
| Windows | `bash win_setup.sh` (desde **Git Bash**) |

### 🐧 GitHub Codespaces / Linux / macOS

En un codespace, `setup.sh` se ejecuta **solo** al abrirlo por primera vez.

> **El proceso tarda entre 2 y 5 minutos.** Si presionas F5 antes de que termine, el proyecto no arrancará correctamente.

Si no esperaste lo suficiente, hubo un error o estás en tu propio Linux/macOS, córrelo a mano desde la raíz del repo:

```bash
bash .devcontainer/setup.sh
```

Si MariaDB no está instalado, el script lo instala (con `apt`, `dnf` o `brew`). Si tu usuario root de MariaDB/MySQL tiene contraseña: `DB_ROOT_PASSWORD=tu_clave bash .devcontainer/setup.sh`.

### 🪟 Windows

**1. Instala esto una sola vez** (si ya lo tienes, sáltatelo):

- [Git para Windows](https://git-scm.com/download/win) (trae **Git Bash**).
- [Node.js LTS](https://nodejs.org).
- [MySQL Server 8](https://dev.mysql.com/downloads/installer/). Anota la contraseña de root que eliges al instalarlo.

Después de instalar, **cierra y vuelve a abrir VS Code**.

**2. Abre una terminal de Git Bash en VS Code** (`` Ctrl+` ``). El repo ya configura Git Bash como terminal por defecto en Windows. Si igual se abre PowerShell, haz clic en la flecha **˅** al lado del **+** y elige **Git Bash**.

> 🚫 **No uses PowerShell ni CMD** para correr los scripts: no son Bash y fallan.

**3. Corre el setup desde la raíz del repo** y escribe la contraseña de root de MySQL cuando te la pida:

```bash
bash win_setup.sh
```

Si algo falla, el script dice qué pasó (contraseña incorrecta, MySQL apagado, no encontró MySQL, etc.).

### ▶️ Iniciar el proyecto

Presiona **F5** o ve al bicho triángulo _Run › Start Debugging_ (`Run All`). Esto levanta el backend y el frontend al mismo tiempo.

| Servicio    | URL                   |
| ----------- | --------------------- |
| Backend API | http://localhost:3000 |
| Frontend    | http://localhost:5173 |

---

## 👤 Usuarios de prueba

> El login se realiza con **RUT** (sin puntos, con guión). Las contraseñas están en texto plano en el dump — recuerda correr el script de hasheo después de importar.

| RUT       | Contraseña     | Nombre             | Rol                 |
| --------- | -------------- | ------------------ | ------------------- |
| 5682711-0 | \`1234\`       | Esperanza Gonzales | Super Admin         |
| 9343727-6 | \`ilovemilf\`  | Carlos Gonzales    | Administrador       |
| 3483606-k | \`Gato123\`    | María Morales      | Docente             |
| 5738925-7 | \`4532\`       | Pedro Fernandez    | Apoderado           |
| 3890710-7 | \`Hamster#23\` | Ana Torres         | Docente             |
| 7135657-4 | \`Cotorra-15\` | Roberto Silva      | Docente             |
| 2258000-0 | \`Perrito@7\`  | Carmen Díaz        | Docente             |
| 8636451-4 | \`Conejo#42\`  | Luis Ramos         | Apoderado           |
| 9230041-2 | \`Tortuga-99\` | Sandra Vera        | Apoderado           |
| 5158743-k | \`Pinguino@5\` | Jorge Campos       | Docente y Apoderado |

---

## 📁 Estructura del proyecto

```
web-dev-SIGAE/
├── .devcontainer/
│   └── setup.sh       # Setup para Codespaces / Linux / macOS
├── win_setup.sh       # Setup para Windows (correr desde Git Bash)
├── docs/              # Documentación del proyecto (ver abajo)
└── webSIGAE/
    ├── BackEnd/       # API Node.js + Express
    ├── FrontEnd/      # App Vite + React
    └── Database/      # SIGAE.sql (único dump de la base de datos)
```

### 📚 Documentación

Toda la documentación, salvo este README, está en `docs/`. No agregues archivos `.md` dentro de `webSIGAE/`.

| Archivo | Para qué sirve |
| --- | --- |
| [`docs/api-citaciones.md`](docs/api-citaciones.md) | Contrato entre frontend y backend del módulo de citaciones (CU74–CU79): endpoints, formato de respuestas y permisos. |
| [`docs/navegacion-sidebar.md`](docs/navegacion-sidebar.md) | Cómo funciona el sidebar (`MainLayout.jsx`), reglas para agregar enlaces y pendientes conocidos. |
| [`docs/tabla-historial.md`](docs/tabla-historial.md) | Estado de la tabla de auditoría `historial` y qué hacer al llegar a la fase alfa. |

---

## 🔧 Variables de entorno

El archivo `webSIGAE/BackEnd/.env` viene en el repo y los scripts de setup lo reescriben con estos valores (si tenías uno distinto, queda respaldado en `.env.bak`). Como el setup crea el usuario `sigae` en la base de datos, **no hace falta editarlo**, tampoco en Windows. Su contenido:

```env
JWT_SECRET=un_secreto_muy_largo_y_seguro
PORT=3000
DB_HOST=127.0.0.1
DB_USER=sigae
DB_PASSWORD=sigae123
DB_NAME=sigae
FRONTEND_URL=http://localhost:5173
```

---

## 🗄️ Base de datos

> 📌 **Hay un solo archivo de base de datos: `webSIGAE/Database/SIGAE.sql`.** No existen migraciones ni scripts aparte. Ese archivo siempre trae el esquema más reciente **y** los usuarios de prueba.

Importar `SIGAE.sql` borra y vuelve a crear todas las tablas de `sigae` (crea la base si no existe). Por eso sirve tanto para instalar desde cero como para **ponerse al día**: si tu base es antigua (por ejemplo, te falta una columna o el backend tira `Unknown column ...`), basta con volver a importarlo.

**¿Cuándo reimportar?** Cada vez que hagas `git pull` y `SIGAE.sql` haya cambiado. Si tienes dudas, reimpórtalo: no pierdes nada del proyecto.

> ⚠️ Lo único que se pierde son los datos que hayas agregado **a mano** en tu base local (usuarios, estudiantes, horarios de prueba, etc.).

### Cómo reimportar

**La forma fácil:** vuelve a correr el setup de tu sistema (`bash .devcontainer/setup.sh` o, en Windows, `bash win_setup.sh` desde Git Bash). Reimporta la base y hashea las contraseñas.

**A mano**, si solo quieres la base de datos. Después de importar, **siempre** corre el script de hasheo: el dump trae las contraseñas en texto plano y el login no funciona hasta hashearlas.

Codespaces / Linux / macOS:

```bash
sudo mariadb -u root < webSIGAE/Database/SIGAE.sql
node webSIGAE/BackEnd/hashPasswords.js
```

Windows, **desde Git Bash** (PowerShell no entiende el `<` y falla con _"El operador '<' está reservado para uso futuro"_):

```bash
mysql -u root -p"TU_CONTRASEÑA_DE_ROOT" < webSIGAE/Database/SIGAE.sql
node webSIGAE/BackEnd/hashPasswords.js
```

- Va **sin espacio** entre `-p` y la contraseña. Si la escribes aparte (solo `-p`), Git Bash a veces se queda pegado sin pedirla.
- Si sale `mysql: command not found`, usa la ruta completa, por ejemplo:
  `"/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" -u root -p"TU_CONTRASEÑA_DE_ROOT" < webSIGAE/Database/SIGAE.sql`
- `hashPasswords.js` usa el usuario `sigae` del `.env`, que crea `win_setup.sh`. Si nunca lo corriste, córrelo primero.

<details>
<summary>¿No tienes Git Bash? Otras opciones en Windows</summary>

- **CMD (Símbolo del sistema)**: el mismo comando `mysql ... < webSIGAE\Database\SIGAE.sql` funciona tal cual.
- **PowerShell**: usa `source` en vez de `<`:
  ```powershell
  mysql -u root -p -e "source webSIGAE/Database/SIGAE.sql"
  ```
  No uses `Get-Content SIGAE.sql | mysql ...`: rompe las tildes y las ñ.
- **MySQL Workbench**: _File › Open SQL Script…_ → `SIGAE.sql` → ejecutar (⚡).

En todos los casos, después corre `node webSIGAE/BackEnd/hashPasswords.js`.

</details>

### Respaldar tus datos locales (opcional)

Si quieres conservar los datos que agregaste a mano, respáldalos **antes** de reimportar (en Windows, desde Git Bash con `mysqldump` en vez de `sudo mariadb-dump`):

```bash
sudo mariadb-dump -u root sigae > ~/respaldo_sigae.sql
```

Para restaurarlo, impórtalo igual que `SIGAE.sql` pero con `~/respaldo_sigae.sql` (ya trae las contraseñas hasheadas, no hace falta el script de hasheo). Ojo: si el esquema cambió entre medio, el respaldo trae el esquema **viejo**.

### Para quien modifique el esquema

Cualquier cambio de tablas o columnas se hace **directamente en `SIGAE.sql`** (manteniendo los usuarios de prueba). No agregues archivos de migración aparte: el equipo trabaja con un solo archivo.

---

## 📦 Deploy

> Sección pendiente. El proyecto aún no tiene un flujo de deploy definido.
