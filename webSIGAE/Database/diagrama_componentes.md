# Tarea 2: Diagrama de Componentes (Vista de Desarrollo)

## Arquitectura de Módulos - CU9, CU10, CU30, CU31, CU32, CU33
Este documento representa la estructura interna de los componentes del backend implementados bajo Node.js y Express, su separación de responsabilidades en capas y su conexión con la persistencia.

---

### 1. Descripción de Capas y Componentes

* **Capa de Enrutamiento (`routes/`):**
  * `estudianteRoutes.js`: Define y delega las solicitudes de desvinculación individual (`DELETE /:id/apoderado`) y masiva (`DELETE /apoderados/desvincular-masivo`).
  * `usuarioRoutes.js`: Define los endpoints de consulta y filtrado para docentes (`GET /docentes`) y apoderados (`GET /apoderados`).

* **Capa Lógica de Negocio (`controllers/`):**
  * `estudianteController.js`: Valida datos de entrada (IDs válidos, arreglos de desvinculación), ejecuta la lógica de desasociación y gestiona respuestas HTTP (200, 400, 404, 500).
  * `usuarioController.js`: Interpreta parámetros de consulta (`query params`), construye dinámicamente las cláusulas SQL (`WHERE`, `HAVING`) y formatea los resultados para el cliente.

* **Capa de Acceso a Datos (`config/`):**
  * `db.js`: Pool de conexiones administrado por `mysql2/promise`, encargado de optimizar y abrir transacciones concurrentes con la base de datos.

* **Capa de Persistencia (Base de Datos):**
  * `MySQL (SIGAE)`: Almacena las tablas relacionales `usuario` y `estudiante` donde se persisten los estados y claves foráneas `Apoderado_Usuario_Id`.

---

### 2. Diagrama de Componentes (UML / Mermaid)

```mermaid
graph TD
    Client[Cliente / Frontend React] -->|Peticiones HTTP REST / JSON| Router[Express Router]

    subgraph Backend_Node_Express [Backend SIGAE - Node.js / Express]
        subgraph Capa_Enrutamiento [Capa de Enrutamiento]
            Router --> R_Est[estudianteRoutes.js]
            Router --> R_Usu[usuarioRoutes.js]
        end

        subgraph Capa_Controladores [Capa de Lógica de Negocio]
            R_Est --> C_Est[estudianteController.js\n- desvincularApoderado (CU9)\n- desvincularApoderadoMasivo (CU10)]
            R_Usu --> C_Usu[usuarioController.js\n- getDocentes (CU30/CU31)\n- getApoderados (CU32/CU33)]
        end

        subgraph Capa_Acceso_Datos [Capa de Infraestructura y Conectividad]
            C_Est --> DB_Config[config/db.js\nPool mysql2/promise]
            C_Usu --> DB_Config
        end
    end

    subgraph Base_Datos_Relacional [Persistencia]
        DB_Config -->|Consultas y Actualizaciones SQL| BD[(MySQL - SIGAE\nTablas: estudiante, usuario)]
    end