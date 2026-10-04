-- Incremento 3 — Dirección estructurada para usuarios y estudiantes
--
-- Para bases de datos creadas con una versión anterior de SIGAE.sql.
-- Una base recién importada desde SIGAE.sql ya trae estos cambios.
--
--   1. usuario: la dirección deja de ser exclusiva del apoderado y pasa a
--      aplicar a todo usuario (Super Admin, Administrador, Docente y Apoderado).
--      Se renombran las columnas Apoderado_Direccion_* a Usuario_Direccion_*
--      conservando los datos ya registrados.
--   2. estudiante: se incorpora la dirección separada en Estudiante_Calle,
--      Estudiante_Numero, Estudiante_Depto y Estudiante_Comuna (sección 3.3
--      del informe del Incremento 3).
--
-- Uso: mariadb -u root sigae < migracion_inc3_direcciones.sql

ALTER TABLE `usuario`
  CHANGE COLUMN `Apoderado_Direccion_Calle`  `Usuario_Direccion_Calle`  varchar(100) DEFAULT NULL,
  CHANGE COLUMN `Apoderado_Direccion_Numero` `Usuario_Direccion_Numero` varchar(10)  DEFAULT NULL,
  CHANGE COLUMN `Apoderado_Direccion_Depto`  `Usuario_Direccion_Depto`  varchar(20)  DEFAULT NULL,
  CHANGE COLUMN `Apoderado_Direccion_Comuna` `Usuario_Direccion_Comuna` varchar(60)  DEFAULT NULL;

ALTER TABLE `estudiante`
  ADD COLUMN `Estudiante_Calle`  varchar(100) DEFAULT NULL AFTER `Estudiante_Fecha_Eliminacion`,
  ADD COLUMN `Estudiante_Numero` varchar(10)  DEFAULT NULL AFTER `Estudiante_Calle`,
  ADD COLUMN `Estudiante_Depto`  varchar(20)  DEFAULT NULL AFTER `Estudiante_Numero`,
  ADD COLUMN `Estudiante_Comuna` varchar(60)  DEFAULT NULL AFTER `Estudiante_Depto`;
