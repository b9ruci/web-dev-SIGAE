# Tabla `historial` — estado y activación pendiente

La tabla `historial` (definida en `SIGAE.sql`) es un registro de auditoría genérico:
guarda `Historial_Valor_Anterior`, `Historial_Valor_Nuevo`, `Historial_Atributo_Modificado`,
fecha/hora del cambio y el usuario responsable, con referencias opcionales a
`Usuario_Id`, `Estudiante_Id`, `Citacion_Id` y `Horario_Asignatura_Id`.

## Estado actual

**Ningún controlador del backend escribe en esta tabla todavía.** Varios casos de uso
del Incremento 2 (CU9, CU10, CU39, entre otros) mencionan en su descripción o
poscondición que el sistema "registra trazabilidad" o "mantiene la integridad
histórica" de los cambios, pero esas operaciones hoy solo actualizan la tabla
correspondiente (`estudiante`, `usuario`, etc.) sin dejar ningún registro en
`historial`.

## Por qué no se activa todavía

Se decidió **postergar intencionalmente** la escritura en `historial` hasta la fase
de pruebas alfa del proyecto. Activarla antes, durante el desarrollo normal, llenaría
la tabla con datos de prueba y de debugging (cambios hechos por el equipo mientras
prueba funcionalidades, reseteos de datos, etc.), contaminando lo que debería ser un
registro de auditoría limpio una vez que el sistema empiece a probarse con datos
reales de alfa.

## Qué hacer al llegar a la fase de alfa

Cuando el equipo dé inicio a las pruebas de alfa:

1. Revisar cada controlador que modifique `estudiante`, `usuario`, `citacion` o
   `horario_asignatura` y agregar el `INSERT INTO historial (...)` correspondiente,
   registrando el valor anterior, el valor nuevo, el atributo modificado y el
   `Usuario_Responsable_Id` (quien ejecutó la acción, tomado de `req.user.id`).
2. Priorizar los casos de uso que ya documentan explícitamente esta trazabilidad en
   sus diagramas de secuencia: CU9, CU10 y CU39 (gestión de asociaciones
   apoderado-estudiante) son los primeros candidatos, ya que sus flujos correctos
   incluyen literalmente el paso "registra trazabilidad" antes de confirmar el
   cambio al usuario.
3. Verificar que las pruebas unitarias existentes (`tests/asociaciones.test.js`,
   etc.) se actualicen para reflejar la escritura en `historial` una vez conectada.

Hasta entonces, tratar la ausencia de registros en `historial` como algo esperado,
no como un bug.
