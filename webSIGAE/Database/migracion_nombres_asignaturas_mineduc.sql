-- Nombres oficiales Mineduc para las asignaturas de ejemplo
--
-- Para bases de datos creadas con una versión anterior de SIGAE.sql.
-- Una base recién importada desde SIGAE.sql ya trae estos cambios.
--
-- Renombra las asignaturas de ejemplo que no usaban el nombre de las Bases
-- Curriculares (Decreto 2960/2012 y Bases 7° básico a 2° medio):
--   Matemáticas -> Matemática
--   Historia    -> Historia, Geografía y Ciencias Sociales
-- Se conservan los Id, así que los planes y horarios que las usan no cambian.
-- No se agregan asignaturas: cada colegio registra las que imparte.
-- Si el nombre oficial ya existe (creado a mano), esa fila no se modifica.
--
-- Uso: mariadb -u root sigae < migracion_nombres_asignaturas_mineduc.sql

-- Los nombres llevan tildes: sin esto el cliente puede enviarlos en latin1
SET NAMES utf8mb4;

UPDATE `asignatura` a
  LEFT JOIN `asignatura` existente
    ON existente.`Asignatura_Nombre` = 'Matemática'
SET a.`Asignatura_Nombre` = 'Matemática'
WHERE a.`Asignatura_Nombre` = 'Matemáticas'
  AND existente.`Asignatura_Id` IS NULL;

UPDATE `asignatura` a
  LEFT JOIN `asignatura` existente
    ON existente.`Asignatura_Nombre` = 'Historia, Geografía y Ciencias Sociales'
SET a.`Asignatura_Nombre` = 'Historia, Geografía y Ciencias Sociales'
WHERE a.`Asignatura_Nombre` = 'Historia'
  AND existente.`Asignatura_Id` IS NULL;
