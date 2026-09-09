# Tarea 1: Validación y Documentación del Modelo Físico de Base de Datos

## Casos de Uso: CU9, CU10, CU30, CU31, CU32, CU33
Este documento valida la compatibilidad y correspondencia de la estructura de tablas y atributos definida en `SIGAE.sql` con las reglas de negocio implementadas en el backend.

---

### 1. Entidades y Atributos Involucrados

| Tabla | Atributo | Tipo de Dato | Restricción / Propiedad | Rol en Casos de Uso |
| :--- | :--- | :--- | :--- | :--- |
| `estudiante` | `Estudiante_Id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Identificador único del estudiante |
| `estudiante` | `Estudiante_Nombre_Completo` | VARCHAR(100) | NOT NULL | Datos de visualización en respuestas JSON |
| `estudiante` | `Apoderado_Usuario_Id` | INT UNSIGNED | NULL, FOREIGN KEY | Clave foránea nullable hacia `usuario(Usuario_Id)`. Soporta asociación y desvinculación (CU9, CU10) |
| `usuario` | `Usuario_Id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Identificador del usuario (apoderado o docente) |
| `usuario` | `Es_Docente` | TINYINT(1) | NOT NULL | Discriminador de rol docente (CU30, CU31) |
| `usuario` | `Docente_Especialidad` | VARCHAR(100) | NULL | Criterio de filtrado curricular por asignatura/área (CU31) |
| `usuario` | `Es_Apoderado` | TINYINT(1) | NOT NULL | Discriminador de rol apoderado (CU32, CU33) |
| `usuario` | `Usuario_Estado_Cuenta` | TINYINT(1) | NOT NULL | Criterio de filtrado de estado activo/inactivo |

---

### 2. Reglas de Persistencia y Consultas Físicas

* **Desvinculación Segura (CU9 y CU10):**
  La columna `estudiante.Apoderado_Usuario_Id` admite valores nulos. La operación se ejecuta mediante actualización lógica (`UPDATE estudiante SET Apoderado_Usuario_Id = NULL WHERE ...`), evitando la eliminación destructiva en cascada y manteniendo intacto el registro académico del alumno.

* **Listado y Filtro de Docentes (CU30 y CU31):**
  Alineado a las cláusulas condicionales `WHERE Es_Docente = 1 AND Docente_Especialidad LIKE ? AND Usuario_Estado_Cuenta = ?`.

* **Listado y Agrupación de Apoderados (CU32 y CU33):**
  Resuelto mediante `LEFT JOIN estudiante ON estudiante.Apoderado_Usuario_Id = usuario.Usuario_Id`, agrupando por `usuario.Usuario_Id` y aplicando filtros sobre la función de agregación `COUNT(estudiante.Estudiante_Id)` en la cláusula `HAVING`.