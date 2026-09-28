-- Migración 001: dirección particular estructurada (Glosario 6.1.2)
--
-- Reemplaza la columna de texto libre `Apoderado_Direccion` por cuatro columnas:
-- calle, número, departamento/casa (opcional) y comuna.
--
-- Solo es necesaria para bases de datos creadas ANTES de este cambio. Una base
-- importada desde el SIGAE.sql actual ya trae el esquema nuevo.
--
-- Uso:
--   sudo mariadb -u root sigae < webSIGAE/Database/migraciones/001_direccion_estructurada.sql

ALTER TABLE `usuario`
  ADD COLUMN `Apoderado_Direccion_Calle`  varchar(100) DEFAULT NULL AFTER `Apoderado_Direccion`,
  ADD COLUMN `Apoderado_Direccion_Numero` varchar(10)  DEFAULT NULL AFTER `Apoderado_Direccion_Calle`,
  ADD COLUMN `Apoderado_Direccion_Depto`  varchar(20)  DEFAULT NULL AFTER `Apoderado_Direccion_Numero`,
  ADD COLUMN `Apoderado_Direccion_Comuna` varchar(60)  DEFAULT NULL AFTER `Apoderado_Direccion_Depto`;

-- Conversión best-effort del formato previo "Calle Número, Comuna":
--   comuna = texto después de la última coma
--   número = última palabra antes de la coma
--   calle  = resto antes del número
-- Las direcciones que no sigan ese formato quedan completas en la calle para
-- revisarlas a mano (se listan con la consulta del final).
UPDATE `usuario`
SET
  `Apoderado_Direccion_Comuna` = TRIM(SUBSTRING_INDEX(`Apoderado_Direccion`, ',', -1)),
  `Apoderado_Direccion_Numero` = TRIM(SUBSTRING_INDEX(TRIM(SUBSTRING_INDEX(`Apoderado_Direccion`, ',', 1)), ' ', -1)),
  `Apoderado_Direccion_Calle`  = TRIM(SUBSTRING(
      TRIM(SUBSTRING_INDEX(`Apoderado_Direccion`, ',', 1)),
      1,
      CHAR_LENGTH(TRIM(SUBSTRING_INDEX(`Apoderado_Direccion`, ',', 1)))
        - CHAR_LENGTH(SUBSTRING_INDEX(TRIM(SUBSTRING_INDEX(`Apoderado_Direccion`, ',', 1)), ' ', -1))
    ))
WHERE `Apoderado_Direccion` REGEXP '^.+ [0-9]+[A-Za-z]?, *.+$';

UPDATE `usuario`
SET `Apoderado_Direccion_Calle` = LEFT(`Apoderado_Direccion`, 100)
WHERE `Apoderado_Direccion` IS NOT NULL
  AND `Apoderado_Direccion_Calle` IS NULL;

-- Direcciones que requieren revisión manual (falta número o comuna)
SELECT `Usuario_Id`, `Usuario_Nombre_Completo`, `Apoderado_Direccion`
FROM `usuario`
WHERE `Apoderado_Direccion` IS NOT NULL
  AND (`Apoderado_Direccion_Numero` IS NULL OR `Apoderado_Direccion_Comuna` IS NULL);

ALTER TABLE `usuario` DROP COLUMN `Apoderado_Direccion`;
