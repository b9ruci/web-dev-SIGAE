# SIGAE — Sistema de Gestión Académica y Escolar

> ⚠️ Proyecto en desarrollo activo. No apto para producción.

## ¿Qué es SIGAE?

SIGAE es una plataforma web para la gestión académica y escolar, con módulos para administración, docentes y apoderados. Permite gestionar cursos, asignaturas, citaciones, horarios y comunicaciones internas.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Vite + React |
| Backend | Node.js + Express |
| Base de datos | MariaDB / MySQL |
| Entorno de desarrollo | GitHub Codespaces |

---

## 🚀 Primeros pasos (GitHub Codespaces)

### 1. Setup automático

Al abrir el codespace por primera vez, se ejecutará automáticamente `.devcontainer/setup.sh`. Este script instala MariaDB, las dependencias del backend y del frontend, crea el archivo `.env` y prepara la base de datos.

> **El proceso tarda entre 2 y 5 minutos.** Si presionas F5 antes de que termine, el proyecto no arrancará correctamente.

Si no esperaste el tiempo suficiente o hubo un error, puedes correr el setup manualmente:

\`\`\` bash

bash .devcontainer/setup.sh
\`\`\`

### 2. Verificar que todo esté listo (opcional)

\`\`\` bash

ls webSIGAE/BackEnd/node_modules/dotenv   # debe listar archivos
ls webSIGAE/FrontEnd/node_modules/vite    # debe listar archivos
sudo service mariadb status               # debe mostrar "Uptime"
\`\`\`

### 3. Iniciar el proyecto

Presiona **F5** o ve al bicho triángulo *Run › Start Debugging* (`Run All`). Esto levanta el backend y el frontend al mismo tiempo.

| Servicio | URL |
|----------|-----|
| Backend API | http://localhost:3000 |
| Frontend | http://localhost:5173 |

---

## 👤 Usuarios de prueba

> El login se realiza con **RUT** (sin puntos, con guión). Las contraseñas están en texto plano en el dump — recuerda correr el script de hasheo después de importar.

| RUT | Contraseña | Nombre | Rol |
|-----|-----------|--------|-----|
| 5682711-0 | \`1234\` | Esperanza Gonzales | Super Admin |
| 9343727-6 | \`ilovemilf\` | Carlos Gonzales | Administrador |
| 3483606-k | \`Gato123\` | María Morales | Docente |
| 5738925-7 | \`4532\` | Pedro Fernandez | Apoderado |
| 3890710-7 | \`Hamster#23\` | Ana Torres | Docente |
| 7135657-4 | \`Cotorra-15\` | Roberto Silva | Docente |
| 2258000-0 | \`Perrito@7\` | Carmen Díaz | Docente |
| 8636451-4 | \`Conejo#42\` | Luis Ramos | Apoderado |
| 9230041-2 | \`Tortuga-99\` | Sandra Vera | Apoderado |
| 5158743-k | \`Pinguino@5\` | Jorge Campos | Docente y Apoderado |

---

## 📁 Estructura del proyecto

\`\`\`
web-dev-SIGAE/
└── webSIGAE/
    ├── BackEnd/        # API Node.js + Express
    ├── FrontEnd/       # App Vite + React
    └── Database/       # SIGAE.sql (dump inicial)
\`\`\`

---

## 🔧 Variables de entorno

El archivo `.env` se crea automáticamente en `webSIGAE/BackEnd/` durante el setup. Si necesitas recrearlo manualmente:

\`\`\`env
JWT_SECRET=un_secreto_muy_largo_y_seguro
PORT=3000
DB_HOST=127.0.0.1
DB_USER=sigae
DB_PASSWORD=sigae123
DB_NAME=sigae
FRONTEND_URL=http://localhost:5173
\`\`\`

---

## 🗄️ Base de datos

La base de datos se importa automáticamente desde `Database/SIGAE.sql` durante el setup. Si necesitas reimportarla manualmente:

\`\`\`bash
sudo mariadb -u root -e "DROP DATABASE IF EXISTS sigae; CREATE DATABASE sigae;"
sudo mariadb -u root sigae < webSIGAE/Database/SIGAE.sql
node webSIGAE/BackEnd/hashPasswords.js
\`\`\`

> ⚠️ El dump trae contraseñas en texto plano. Siempre corre el script de hasheo después de importar antes de levantar el servidor.

---

## 📦 Deploy

> Sección pendiente. El proyecto aún no tiene un flujo de deploy definido.