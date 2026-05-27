-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: sigae
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `afecta`
--

DROP TABLE IF EXISTS `afecta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `afecta` (
  `Afecta_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Estado_Bloque` varchar(50) NOT NULL,
  `Bloque_Horario_Id` int unsigned NOT NULL,
  `Evento_Institucional_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Afecta_Id`),
  KEY `fk_Afecta_Bloque_Horario_idx` (`Bloque_Horario_Id`),
  KEY `fk_Afecta_Evento_Institucional_idx` (`Evento_Institucional_Id`),
  CONSTRAINT `fk_Afecta_Bloque_Horario` FOREIGN KEY (`Bloque_Horario_Id`) REFERENCES `bloque_horario` (`Bloque_Horario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Afecta_Evento_Institucional` FOREIGN KEY (`Evento_Institucional_Id`) REFERENCES `evento_institucional` (`Evento_Institucional_Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=111111112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `afecta`
--

LOCK TABLES `afecta` WRITE;
/*!40000 ALTER TABLE `afecta` DISABLE KEYS */;
INSERT INTO `afecta` VALUES (111111111,'Suspendido',11111111,1111111);
/*!40000 ALTER TABLE `afecta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asignatura`
--

DROP TABLE IF EXISTS `asignatura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignatura` (
  `Asignatura_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Asignatura_Nombre` varchar(100) NOT NULL,
  `Asignatura_Prioridad_Academica` varchar(50) NOT NULL,
  PRIMARY KEY (`Asignatura_Id`),
  UNIQUE KEY `Asignatura_Nombre_UNIQUE` (`Asignatura_Nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=2223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignatura`
--

LOCK TABLES `asignatura` WRITE;
/*!40000 ALTER TABLE `asignatura` DISABLE KEYS */;
INSERT INTO `asignatura` VALUES (2222,'Matemáticas','Alta');
/*!40000 ALTER TABLE `asignatura` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bloque_horario`
--

DROP TABLE IF EXISTS `bloque_horario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloque_horario` (
  `Bloque_Horario_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Bloque_Horario_Hora_Inicio` time NOT NULL,
  `Bloque_Horario_Tipo` varchar(50) NOT NULL,
  `Bloque_Horario_Hora_Fin` time NOT NULL,
  `Bloque_Horario_Jornada` varchar(50) NOT NULL,
  `Parametro_Institucional_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Bloque_Horario_Id`),
  KEY `fk_Bloque_Horario_Parametro_Institucional_idx` (`Parametro_Institucional_Id`),
  CONSTRAINT `fk_Bloque_Horario_Parametro_Institucional` FOREIGN KEY (`Parametro_Institucional_Id`) REFERENCES `parametro_institucional` (`Parametro_Institucional_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11111112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bloque_horario`
--

LOCK TABLES `bloque_horario` WRITE;
/*!40000 ALTER TABLE `bloque_horario` DISABLE KEYS */;
INSERT INTO `bloque_horario` VALUES (11111111,'09:15:00','Clase','10:00:00','Mañana',111111);
/*!40000 ALTER TABLE `bloque_horario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `citacion`
--

DROP TABLE IF EXISTS `citacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citacion` (
  `Citacion_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Citacion_Tramo_Horario` varchar(100) NOT NULL,
  `Citacion_Fecha` date NOT NULL,
  `Citacion_Motivo` text NOT NULL,
  `Citacion_Fecha_Confirmacion` date DEFAULT NULL,
  `Citacion_Observaciones_Posteriores` text,
  `Citacion_Estado` varchar(50) NOT NULL,
  `Citacion_Motivo_Cancelacion` text,
  `Citacion_Modalidad` varchar(50) NOT NULL,
  `Estudiante_Id` int unsigned NOT NULL,
  `Apoderado_Usuario_Id` int unsigned NOT NULL,
  `Docente_Usuario_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Citacion_Id`),
  KEY `fk_Citacion_Estudiante_idx` (`Estudiante_Id`),
  KEY `fk_Citacion_Usuario_idx` (`Apoderado_Usuario_Id`),
  KEY `fk_Citacion_Docente_Usuario_idx` (`Docente_Usuario_Id`),
  CONSTRAINT `fk_Citacion_Apoderado_Usuario` FOREIGN KEY (`Apoderado_Usuario_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Citacion_Docente_Usuario` FOREIGN KEY (`Docente_Usuario_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Citacion_Estudiante` FOREIGN KEY (`Estudiante_Id`) REFERENCES `estudiante` (`Estudiante_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citacion`
--

LOCK TABLES `citacion` WRITE;
/*!40000 ALTER TABLE `citacion` DISABLE KEYS */;
INSERT INTO `citacion` VALUES (33,'17:00 - 17:30','2026-06-20','Bullying',NULL,NULL,'Pendiente de confirmación',NULL,'Presencial',222222222,4,3);
/*!40000 ALTER TABLE `citacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversacion`
--

DROP TABLE IF EXISTS `conversacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversacion` (
  `Conversacion_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Conversacion_Fecha_Inicio` date NOT NULL,
  `Conversacion_Estado` tinyint(1) NOT NULL,
  `Docente_Usuario_Id` int unsigned NOT NULL,
  `Apoderado_Usuario_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Conversacion_Id`),
  KEY `fk Conversacion_Usuario_idx` (`Docente_Usuario_Id`),
  KEY `fk Conversacion_Apoderado_idx` (`Apoderado_Usuario_Id`),
  CONSTRAINT `fk_Conversacion_Apoderado` FOREIGN KEY (`Apoderado_Usuario_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Conversacion_Docente` FOREIGN KEY (`Docente_Usuario_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversacion`
--

LOCK TABLES `conversacion` WRITE;
/*!40000 ALTER TABLE `conversacion` DISABLE KEYS */;
INSERT INTO `conversacion` VALUES (1111,'2026-04-11',0,3,4);
/*!40000 ALTER TABLE `conversacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `curso`
--

DROP TABLE IF EXISTS `curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curso` (
  `Curso_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Curso_Seccion` varchar(10) NOT NULL,
  `Curso_Nombre` varchar(100) NOT NULL,
  `Nivel_Educativo_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Curso_Id`),
  UNIQUE KEY `Curso_Nombre_UNIQUE` (`Curso_Nombre`),
  KEY `fk_Curso_Nivel_Educativo_idx` (`Nivel_Educativo_Id`),
  CONSTRAINT `fk_Curso_Nivel_Educativo` FOREIGN KEY (`Nivel_Educativo_Id`) REFERENCES `nivel_educativo` (`Nivel_Educativo_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso`
--

LOCK TABLES `curso` WRITE;
/*!40000 ALTER TABLE `curso` DISABLE KEYS */;
INSERT INTO `curso` VALUES (222,'A','1ero Básico A',22);
/*!40000 ALTER TABLE `curso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estudiante`
--

DROP TABLE IF EXISTS `estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estudiante` (
  `Estudiante_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Estudiante_Nombre_Completo` varchar(100) NOT NULL,
  `Estudiante_RUT` varchar(20) NOT NULL,
  `Estudiante_Estado_Academico` varchar(50) NOT NULL,
  `Curso_Id` int unsigned NOT NULL,
  `Apoderado_Usuario_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Estudiante_Id`),
  UNIQUE KEY `Estudiante_RUT_UNIQUE` (`Estudiante_RUT`),
  KEY `fk_Estudiante_Curso_idx` (`Curso_Id`),
  KEY `fk_Estudiante_Apoderado_idx` (`Apoderado_Usuario_Id`),
  CONSTRAINT `fk_Estudiante_Apoderado` FOREIGN KEY (`Apoderado_Usuario_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Estudiante_Curso` FOREIGN KEY (`Curso_Id`) REFERENCES `curso` (`Curso_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=222222223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estudiante`
--

LOCK TABLES `estudiante` WRITE;
/*!40000 ALTER TABLE `estudiante` DISABLE KEYS */;
INSERT INTO `estudiante` VALUES (222222222,'Diego Martin Perez Castro','268283655','Regular',222,4);
/*!40000 ALTER TABLE `estudiante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evento_institucional`
--

DROP TABLE IF EXISTS `evento_institucional`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento_institucional` (
  `Evento_Institucional_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Evento_Institucional_Impacto_Clases` varchar(100) NOT NULL,
  `Evento_Institucional_Fecha` date NOT NULL,
  `Evento_Institucional_Nombre` varchar(100) NOT NULL,
  `Evento_Institucional_Descripcion` text NOT NULL,
  PRIMARY KEY (`Evento_Institucional_Id`)
) ENGINE=InnoDB AUTO_INCREMENT=1111112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento_institucional`
--

LOCK TABLES `evento_institucional` WRITE;
/*!40000 ALTER TABLE `evento_institucional` DISABLE KEYS */;
INSERT INTO `evento_institucional` VALUES (1111111,'Salida anticipada','2026-12-10','Licenciatura 4tos Medios','Ceremonia de graduación de estudiantes de 4to año medio');
/*!40000 ALTER TABLE `evento_institucional` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial`
--

DROP TABLE IF EXISTS `historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial` (
  `Historial_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Historial_Valor_Anterior` text NOT NULL,
  `Historial_Hora_Registro` time NOT NULL,
  `Historial_Descripcion_Cambio` text NOT NULL,
  `Historial_Atributo_Modificado` varchar(100) NOT NULL,
  `Historial_Valor_Nuevo` text NOT NULL,
  `Historial_Fecha_Registro` date NOT NULL,
  `Usuario_Id` int unsigned DEFAULT NULL,
  `Estudiante_Id` int unsigned DEFAULT NULL,
  `Citacion_Id` int unsigned DEFAULT NULL,
  `Horario_Asignatura_Id` int unsigned DEFAULT NULL,
  `Usuario_Responsable_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Historial_Id`),
  KEY `fk_Historial_Usuario_idx` (`Usuario_Id`),
  KEY `fk_Historial_Estudiante_idx` (`Estudiante_Id`),
  KEY `fk_Historial_Citacion_idx` (`Citacion_Id`),
  KEY `fk_Historial_Horario_Asignatura_idx` (`Horario_Asignatura_Id`),
  KEY `fk_Historial_Usuario_Responsable_idx` (`Usuario_Responsable_Id`),
  CONSTRAINT `fk_Historial_Citacion` FOREIGN KEY (`Citacion_Id`) REFERENCES `citacion` (`Citacion_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Historial_Estudiante` FOREIGN KEY (`Estudiante_Id`) REFERENCES `estudiante` (`Estudiante_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Historial_Horario_Asignatura` FOREIGN KEY (`Horario_Asignatura_Id`) REFERENCES `horario_asignatura` (`Horario_Asignatura_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Historial_Usuario` FOREIGN KEY (`Usuario_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Historial_Usuario_Responsable` FOREIGN KEY (`Usuario_Responsable_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=334 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial`
--

LOCK TABLES `historial` WRITE;
/*!40000 ALTER TABLE `historial` DISABLE KEYS */;
INSERT INTO `historial` VALUES (333,'979746782','16:00:00','Cambio de número de teléfono','Usuario_Telefono','923465924','2026-06-16',2,NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `historial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horario_asignatura`
--

DROP TABLE IF EXISTS `horario_asignatura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horario_asignatura` (
  `Horario_Asignatura_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Horario_Asignatura_Dia_Semana` varchar(20) NOT NULL,
  `Horario_Asignatura_Estado` varchar(50) NOT NULL,
  `Curso_Id` int unsigned NOT NULL,
  `Usuario_Id` int unsigned NOT NULL,
  `Bloque_Horario_Id` int unsigned NOT NULL,
  `Asignatura_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Horario_Asignatura_Id`),
  KEY `fk_Horario_Asignatura_Curso_idx` (`Curso_Id`),
  KEY `fk_Horario_Asignatura_Usuario_idx` (`Usuario_Id`),
  KEY `fk_Horario_Asignatura_Bloque_Horario_idx` (`Bloque_Horario_Id`),
  KEY `fk_Horario_Asignatura_Asignatura_idx` (`Asignatura_Id`),
  CONSTRAINT `fk_Horario_Asignatura_Asignatura` FOREIGN KEY (`Asignatura_Id`) REFERENCES `asignatura` (`Asignatura_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Horario_Asignatura_Bloque_Horario` FOREIGN KEY (`Bloque_Horario_Id`) REFERENCES `bloque_horario` (`Bloque_Horario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Horario_Asignatura_Curso` FOREIGN KEY (`Curso_Id`) REFERENCES `curso` (`Curso_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Horario_Asignatura_Usuario` FOREIGN KEY (`Usuario_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=222223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horario_asignatura`
--

LOCK TABLES `horario_asignatura` WRITE;
/*!40000 ALTER TABLE `horario_asignatura` DISABLE KEYS */;
INSERT INTO `horario_asignatura` VALUES (222222,'Lunes','Activo',222,3,11111111,2222);
/*!40000 ALTER TABLE `horario_asignatura` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incluyeasig`
--

DROP TABLE IF EXISTS `incluyeasig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incluyeasig` (
  `IncluyeAsig_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Horas_Semanales_Requeridas` int NOT NULL,
  `Tipo` varchar(50) NOT NULL,
  `Asignatura_Id` int unsigned NOT NULL,
  `Plan_Educativo_Id` int unsigned NOT NULL,
  PRIMARY KEY (`IncluyeAsig_Id`),
  KEY `fk_IncluyeAsig_Asignatura_idx` (`Asignatura_Id`),
  KEY `fk_IncluyeAsig_Plan_Educativo_idx` (`Plan_Educativo_Id`),
  CONSTRAINT `fk_IncluyeAsig_Asignatura` FOREIGN KEY (`Asignatura_Id`) REFERENCES `asignatura` (`Asignatura_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_IncluyeAsig_Plan_Educativo` FOREIGN KEY (`Plan_Educativo_Id`) REFERENCES `plan_educativo` (`Plan_Educativo_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22222223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incluyeasig`
--

LOCK TABLES `incluyeasig` WRITE;
/*!40000 ALTER TABLE `incluyeasig` DISABLE KEYS */;
INSERT INTO `incluyeasig` VALUES (22222222,6,'Obligatorio',2222,2222222);
/*!40000 ALTER TABLE `incluyeasig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensaje`
--

DROP TABLE IF EXISTS `mensaje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensaje` (
  `Mensaje_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Mensaje_Contenido` text NOT NULL,
  `Mensaje_Fecha_Envio` date NOT NULL,
  `Mensaje_Hora_Envio` time NOT NULL,
  `Mensaje_Estado` varchar(50) NOT NULL,
  `Mensaje_Remitente_Rol` varchar(50) NOT NULL,
  `Conversacion_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Mensaje_Id`),
  KEY `fk_Mensaje_Conversacion_idx` (`Conversacion_Id`),
  CONSTRAINT `fk_Mensaje_Conversacion` FOREIGN KEY (`Conversacion_Id`) REFERENCES `conversacion` (`Conversacion_Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensaje`
--

LOCK TABLES `mensaje` WRITE;
/*!40000 ALTER TABLE `mensaje` DISABLE KEYS */;
INSERT INTO `mensaje` VALUES (11111,'Muchas gracias profesor por la información','2026-04-11','09:30:05','Leído','Apoderado',1111);
/*!40000 ALTER TABLE `mensaje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nivel_educativo`
--

DROP TABLE IF EXISTS `nivel_educativo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nivel_educativo` (
  `Nivel_Educativo_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Nivel_Educativo_Nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`Nivel_Educativo_Id`),
  UNIQUE KEY `Nivel_Educativo_Nombre_UNIQUE` (`Nivel_Educativo_Nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nivel_educativo`
--

LOCK TABLES `nivel_educativo` WRITE;
/*!40000 ALTER TABLE `nivel_educativo` DISABLE KEYS */;
INSERT INTO `nivel_educativo` VALUES (22,'1ero Básico');
/*!40000 ALTER TABLE `nivel_educativo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parametro_institucional`
--

DROP TABLE IF EXISTS `parametro_institucional`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametro_institucional` (
  `Parametro_Institucional_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Parametro_Institucional_Duracion_Bloque` int NOT NULL,
  `Parametro_Institucional_Inicio_Jornada` time NOT NULL,
  `Parametro_Institucional_Fin_Jornada` time NOT NULL,
  `Parametro_Institucional_Bloques_Maximos_Diarios` int NOT NULL,
  `Parametro_Institucional_Duracion_Recreo` int NOT NULL,
  PRIMARY KEY (`Parametro_Institucional_Id`)
) ENGINE=InnoDB AUTO_INCREMENT=111112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parametro_institucional`
--

LOCK TABLES `parametro_institucional` WRITE;
/*!40000 ALTER TABLE `parametro_institucional` DISABLE KEYS */;
INSERT INTO `parametro_institucional` VALUES (111111,45,'08:30:00','16:30:00',8,15);
/*!40000 ALTER TABLE `parametro_institucional` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plan_educativo`
--

DROP TABLE IF EXISTS `plan_educativo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_educativo` (
  `Plan_Educativo_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Plan_Educativo_Periodo_Lectivo` varchar(50) NOT NULL,
  `Nivel_Educativo_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Plan_Educativo_Id`),
  KEY `fk_Plan_Educativo_Nivel_Educativo_idx` (`Nivel_Educativo_Id`),
  CONSTRAINT `fk_Plan_Educativo_Nivel_Educativo` FOREIGN KEY (`Nivel_Educativo_Id`) REFERENCES `nivel_educativo` (`Nivel_Educativo_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2222223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plan_educativo`
--

LOCK TABLES `plan_educativo` WRITE;
/*!40000 ALTER TABLE `plan_educativo` DISABLE KEYS */;
INSERT INTO `plan_educativo` VALUES (2222222,'2026',22);
/*!40000 ALTER TABLE `plan_educativo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesion`
--

DROP TABLE IF EXISTS `sesion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesion` (
  `Sesion_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Sesion_Token_Acceso` varchar(255) NOT NULL,
  `Sesion_Fecha_Inicio` datetime NOT NULL,
  `Sesion_Fecha_Expiracion` datetime DEFAULT NULL,
  `Sesion_Direccion_IP` varchar(45) NOT NULL,
  `Sesion_Estado` tinyint(1) NOT NULL,
  `Sesion_Dispositivo` varchar(100) NOT NULL,
  `Sesion_Token_Expiracion` datetime NOT NULL,
  `Usuario_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Sesion_Id`),
  UNIQUE KEY `Sesion_Token_Acceso_UNIQUE` (`Sesion_Token_Acceso`),
  KEY `fk_Sesion_Usuario_idx` (`Usuario_Id`),
  CONSTRAINT `fk_Sesion_Usuario` FOREIGN KEY (`Usuario_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesion`
--

LOCK TABLES `sesion` WRITE;
/*!40000 ALTER TABLE `sesion` DISABLE KEYS */;
INSERT INTO `sesion` VALUES (11,'Token001','2026-05-24 08:00:00','2026-05-24 10:00:00','192.168.1.10',0,'Computador','2026-05-24 10:00:00',1);
/*!40000 ALTER TABLE `sesion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_recuperacion`
--

DROP TABLE IF EXISTS `solicitud_recuperacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_recuperacion` (
  `Solicitud_Recuperacion_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Solicitud_Recuperacion_Fecha_Expiracion` datetime NOT NULL,
  `Solicitud_Recuperacion_Token` varchar(255) NOT NULL,
  `Solicitud_Recuperacion_Fecha_Creacion` datetime NOT NULL,
  `Solicitud_Recuperacion_Estado` varchar(50) NOT NULL,
  `Usuario_Id` int unsigned NOT NULL,
  PRIMARY KEY (`Solicitud_Recuperacion_Id`),
  UNIQUE KEY `Solicitud_Recuperacion_Token_UNIQUE` (`Solicitud_Recuperacion_Token`),
  KEY `fk_Solicitud_Recuperacion_Usuario_idx` (`Usuario_Id`),
  CONSTRAINT `fk_Solicitud_Recuperacion_Usuario` FOREIGN KEY (`Usuario_Id`) REFERENCES `usuario` (`Usuario_Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_recuperacion`
--

LOCK TABLES `solicitud_recuperacion` WRITE;
/*!40000 ALTER TABLE `solicitud_recuperacion` DISABLE KEYS */;
INSERT INTO `solicitud_recuperacion` VALUES (111,'2026-05-24 20:00:00','RecuP001','2026-05-24 19:30:00','En Proceso',2);
/*!40000 ALTER TABLE `solicitud_recuperacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tieneasig`
--

DROP TABLE IF EXISTS `tieneasig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tieneasig` (
  `tieneasig_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Estado_Asignacion` varchar(50) NOT NULL,
  `Curso_Id` int unsigned NOT NULL,
  `Asignatura_Id` int unsigned NOT NULL,
  PRIMARY KEY (`tieneasig_Id`),
  KEY `fk_TieneAsig_Curso_idx` (`Curso_Id`),
  KEY `fk_TieneAsig_Asignatura_idx` (`Asignatura_Id`),
  CONSTRAINT `fk_TieneAsig_Asignatura` FOREIGN KEY (`Asignatura_Id`) REFERENCES `asignatura` (`Asignatura_Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_TieneAsig_Curso` FOREIGN KEY (`Curso_Id`) REFERENCES `curso` (`Curso_Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tieneasig`
--

LOCK TABLES `tieneasig` WRITE;
/*!40000 ALTER TABLE `tieneasig` DISABLE KEYS */;
INSERT INTO `tieneasig` VALUES (22222,'Activa',222,2222);
/*!40000 ALTER TABLE `tieneasig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `Usuario_Id` int unsigned NOT NULL AUTO_INCREMENT,
  `Usuario_RUT` varchar(20) NOT NULL,
  `Usuario_Telefono` varchar(20) NOT NULL,
  `Usuario_Nombre_Completo` varchar(100) NOT NULL,
  `Usuario_Correo` varchar(100) NOT NULL,
  `Usuario_Estado_Cuenta` tinyint(1) NOT NULL,
  `Usuario_Contraseña` varchar(200) NOT NULL,
  `Usuario_Foto_Perfil` varchar(255) DEFAULT NULL,
  `Es_Docente` tinyint(1) NOT NULL,
  `Docente_Carga_Horaria_Maxima` int DEFAULT NULL,
  `Docente_Especialidad` varchar(100) DEFAULT NULL,
  `Es_Administrador` tinyint(1) NOT NULL,
  `Administrador_Tipo` varchar(20) DEFAULT NULL,
  `Es_Apoderado` tinyint(1) NOT NULL,
  `Apoderado_Direccion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`Usuario_Id`),
  UNIQUE KEY `Usuario_RUT_UNIQUE` (`Usuario_RUT`),
  UNIQUE KEY `Usuario_Correo_UNIQUE` (`Usuario_Correo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'12345678-9','961900000','Esperanza Penelope Gonzales Farias','es.gonzales@jacquescousteau.edu',1,'1234',NULL,0,NULL,NULL,1,'Super Admin',0,NULL),(2,'21717363-3','979746782','Carlos Vicente Gonzales Muñoz','ca.gonzales@jacquescousteau.edu',1,'ilovemilf',NULL,0,NULL,NULL,1,'Administrador Normal',0,NULL),(3,'19111111-1','946789765','María Claudia Morales Rojas','ma.morales@jacquescousteau.edu',1,'hash123',NULL,1,38,'Matemáticas',0,NULL,0,NULL),(4,'159395855','944706559','Pedro Humberto Fernandez Soto','pedrofernandez453@gmail.com',1,'4532',NULL,0,NULL,NULL,0,NULL,1,'Avenida Concha y Toro 134, Puente Alto');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-24 21:55:58
