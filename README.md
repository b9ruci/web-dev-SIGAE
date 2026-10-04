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

## 🚀 Primeros pasos (GitHub Codespaces)

### 1. Setup automático

Al abrir el codespace por primera vez, se ejecutará automáticamente `.devcontainer/setup.sh`. Este script instala MariaDB, las dependencias del backend y del frontend, crea el archivo `.env` y prepara la base de datos.

> **El proceso tarda entre 2 y 5 minutos.** Si presionas F5 antes de que termine, el proyecto no arrancará correctamente.

Si no esperaste el tiempo suficiente o hubo un error, puedes correr el setup manualmente:

```bash
bash .devcontainer/setup.sh
```

### 2. Verificar que todo esté listo (opcional)

```bash
ls webSIGAE/BackEnd/node_modules/dotenv # debe listar archivos
ls webSIGAE/FrontEnd/node_modules/vite # debe listar archivos
sudo service mariadb status # debe mostrar "Uptime"
```

### 3. Iniciar el proyecto

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
└── webSIGAE/
├── BackEnd/ # API Node.js + Express
├── FrontEnd/ # App Vite + React
└── Database/ # SIGAE.sql (único dump de la base de datos)
```

---

## 🔧 Variables de entorno

El archivo `.env` se crea automáticamente en `webSIGAE/BackEnd/` durante el setup. Si necesitas recrearlo manualmente:

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

Después de importar, **siempre** corre el script de hasheo: el dump trae las contraseñas en texto plano y el login no funciona hasta hashearlas.

### 🐧 Codespaces / Linux / macOS

La base se importa automáticamente durante `setup.sh`. Para reimportarla a mano:

```bash
sudo mariadb -u root < webSIGAE/Database/SIGAE.sql
node webSIGAE/BackEnd/hashPasswords.js
```

### 🪟 Windows (Visual Studio Code)

> 🚫 **No uses PowerShell** (la terminal que abre VS Code por defecto) para estos comandos: PowerShell no entiende el `<` y falla con _"El operador '<' está reservado para uso futuro"_. Tampoco existe `sudo` en Windows.

Usa **Git Bash**, que viene incluido con Git para Windows. En VS Code: abre la terminal (`` Ctrl+` ``), haz clic en la flecha **˅** al lado del **+** y elige **Git Bash**. Desde la raíz del repo:

```bash
mysql -u root -p"TU_CONTRASEÑA_DE_ROOT" < webSIGAE/Database/SIGAE.sql
node webSIGAE/BackEnd/hashPasswords.js
```

- Va **sin espacio** entre `-p` y la contraseña. Si la escribes aparte (solo `-p`), Git Bash a veces se queda pegado sin pedirla.
- Si instalaste MariaDB en vez de MySQL, cambia `mysql` por `mariadb`.
- Si sale `mysql: command not found`, el programa no está en el PATH. Usa la ruta completa, por ejemplo:
  `"/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" -u root -p"TU_CONTRASEÑA_DE_ROOT" < webSIGAE/Database/SIGAE.sql`
- `hashPasswords.js` se conecta con los datos de `webSIGAE/BackEnd/.env`. En Windows ese archivo no se crea solo: créalo como en [Variables de entorno](#-variables-de-entorno), con el usuario y la contraseña de **tu** MySQL local.

<details>
<summary>¿No tienes Git Bash? Otras opciones</summary>

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
