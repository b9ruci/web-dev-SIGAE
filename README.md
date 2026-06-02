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

### 1. Esperar el setup automático

Al abrir el codespace por primera vez, se ejecutará automáticamente `.devcontainer/setup.sh`. Este script instala MariaDB, las dependencias del backend y del frontend, crea el archivo `.env` y prepara la base de datos.

Verás una terminal con mensajes como:

```
=== Instalando MySQL ===
=== Instalando dependencias Backend ===
=== Instalando dependencias Frontend ===
...
✅ Setup completado. Ya puedes presionar F5.
```

> **No presiones F5 que pasen aproximadamente de 2 a 5 minutos, el comando de setup completado no se puede habilitar en consola por ahora.**

Si da error al ejecutar el debugger (F5), ejecutar el siguiente comando instala todo, de forma automática, accionado de manera manual.

```bash
bash .devcontainer/setup.sh
```

### 2. Verificar que todo esté listo (opcional)

```bash
ls webSIGAE/BackEnd/node_modules/dotenv   # debe listar archivos
ls webSIGAE/FrontEnd/node_modules/vite    # debe listar archivos
sudo service mariadb status               # debe mostrar "Uptime"
```

### 3. Iniciar el proyecto

Presiona **F5** o ve al bicho triángulo *Run › Start Debugging* (`Run All`). Esto levanta el backend y el frontend al mismo tiempo.

| Servicio | URL |
|----------|-----|
| Backend API | http://localhost:3000 |
| Frontend | http://localhost:5173 |

---

## 👤 Usuarios de prueba

| Correo | Contraseña | Rol |
|--------|-----------|-----|
| es.gonzales@jacquescousteau.edu | `1234` | Super Admin |
| ca.gonzales@jacquescousteau.edu | `ilovemilf` | Administrador |
| ma.morales@jacquescousteau.edu | `hash123` | Docente |
| pedrofernandez453@gmail.com | `4532` | Apoderado |

---

## 📁 Estructura del proyecto

```
web-dev-SIGAE/
└── webSIGAE/
    ├── BackEnd/        # API Node.js + Express
    ├── FrontEnd/       # App Vite + React
    └── Database/       # SIGAE.sql (dump inicial)
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

La base de datos se importa automáticamente desde `Database/SIGAE.sql` durante el setup. Si necesitas reimportarla manualmente:

```bash
sudo service mariadb start
sudo mariadb -u root sigae < webSIGAE/Database/SIGAE.sql
```

---

## 📦 Deploy

> Sección pendiente. El proyecto aún no tiene un flujo de deploy definido.
