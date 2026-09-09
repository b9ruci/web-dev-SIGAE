# Tarea 3: Clasificación y Selección de Casos de Uso

Este documento especifica la lógica funcional, actores, precondiciones, flujo de eventos y excepciones implementadas y probadas en el backend para los casos de uso seleccionados del sistema SIGAE.

---

## 1. Módulo: Gestión de Asociaciones Estudiante - Apoderado

### CU9: Desvincular Apoderado Individual
* **Actor Principal:** Administrador / Super Admin.
* **Precondiciones:**
  1. El usuario solicitante cuenta con token de autenticación válido y permisos administrativos.
  2. El estudiante existe en la tabla `estudiante` y registra un `Apoderado_Usuario_Id` asignado.
* **Flujo Principal:**
  1. El administrador envía una solicitud `DELETE /api/estudiantes/:id/apoderado`.
  2. El controlador valida el identificador numérico del estudiante.
  3. Se ejecuta la consulta de actualización lógica: `UPDATE estudiante SET Apoderado_Usuario_Id = NULL WHERE Estudiante_Id = ?`.
  4. El sistema confirma la desvinculación y retorna código HTTP 200 con mensaje de éxito y datos del estudiante actualizado.
* **Postcondiciones:** El estudiante permanece en el sistema con `Apoderado_Usuario_Id = NULL`.
* **Excepciones:**
  * **E1 (ID Inválido o inexistente):** Si el estudiante no existe, retorna código HTTP 404 (`Estudiante no encontrado`).
  * **E2 (Sin asociación previa):** Si el campo ya era nulo, retorna código HTTP 400 informando que no poseía apoderado vinculado.

---

### CU10: Desvincular Apoderado Masivo
* **Actor Principal:** Administrador / Super Admin.
* **Precondiciones:**
  1. El usuario solicitante cuenta con sesión activa y permisos administrativos.
  2. Se envía un arreglo de identificadores de estudiantes a desvincular.
* **Flujo Principal:**
  1. El administrador envía una solicitud `DELETE /api/estudiantes/apoderados/desvincular-masivo` con el cuerpo `{ "estudianteIds": [id1, id2, ...] }`.
  2. El controlador verifica que la lista contenga elementos y que sean IDs numéricos válidos.
  3. Se ejecuta la actualización en lote mediante `UPDATE estudiante SET Apoderado_Usuario_Id = NULL WHERE Estudiante_Id IN (...)`.
  4. El sistema retorna código HTTP 200 detallando el total de registros desvinculados exitosamente.
* **Postcondiciones:** Todos los estudiantes listados quedan con `Apoderado_Usuario_Id = NULL`.
* **Excepciones:**
  * **E1 (Cuerpo vacío o malformado):** Si el arreglo no contiene elementos válidos, retorna HTTP 400 (`Arreglo de IDs inválido o vacío`).
  * **E2 (Fallo de persistencia):** En caso de error de conexión en la transacción, se aborta y retorna HTTP 500.

---

## 2. Módulo: Filtros y Consulta de Usuarios

### CU30: Listar Docentes
* **Actor Principal:** Administrador / Personal Directivo.
* **Precondiciones:** El usuario emisor está autenticado en la plataforma.
* **Flujo Principal:**
  1. El usuario solicita `GET /api/usuarios/docentes`.
  2. El sistema consulta los registros donde `Es_Docente = 1`.
  3. Se retorna código HTTP 200 con el listado JSON de docentes y sus datos curriculares.
* **Postcondiciones:** El sistema presenta la nómina docente sin alterar estados en base de datos.

---

### CU31: Filtrar Docentes
* **Actor Principal:** Administrador / Personal Directivo.
* **Precondiciones:** Acceso al módulo de listado de docentes.
* **Flujo Principal:**
  1. El cliente envía `GET /api/usuarios/docentes?especialidad=...&estado=...`.
  2. El controlador valida y parametriza los filtros contra inyección SQL.
  3. Se ejecuta la consulta aplicando `AND Docente_Especialidad LIKE ?` y `AND Usuario_Estado_Cuenta = ?`.
  4. El sistema retorna HTTP 200 con los registros coincidentes.
* **Excepciones:**
  * **E1 (Sin coincidencias):** Si ningún registro calza con los criterios, retorna HTTP 200 con arreglo vacío y mensaje informativo: `No existen docentes asociados a los criterios ingresados`.

---

### CU32: Listar Apoderados
* **Actor Principal:** Administrador / Docente.
* **Precondiciones:** Usuario autenticado en el sistema.
* **Flujo Principal:**
  1. El cliente envía `GET /api/usuarios/apoderados`.
  2. El sistema realiza un `LEFT JOIN` entre `usuario` y `estudiante` donde `Es_Apoderado = 1`, agrupando por `Usuario_Id` y calculando `COUNT(Estudiante_Id) AS Total_Estudiantes_Asociados`.
  3. Se retorna HTTP 200 con la colección completa de apoderados y sus cargas asignadas.

---

### CU33: Filtrar Apoderados por Cantidad de Estudiantes Asociados
* **Actor Principal:** Administrador / Docente.
* **Precondiciones:** Acceso al listado de apoderados.
* **Flujo Principal:**
  1. El cliente solicita `GET /api/usuarios/apoderados?cantidadEstudiantes=N`.
  2. El controlador valida que el valor sea un entero positivo.
  3. Se aplica la cláusula de agregación `HAVING Total_Estudiantes_Asociados = ?`.
  4. El sistema retorna HTTP 200 con los apoderados que cumplen la condición exacta.
* **Excepciones:**
  * **E1 (Sin resultados):** Retorna HTTP 200 con arreglo vacío y mensaje: `No existen apoderados asociados a los criterios ingresados`.