CREATE DATABASE  IF NOT EXISTS `kieuphong_bookstore` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `kieuphong_bookstore`;
-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: kieuphong_bookstore
-- ------------------------------------------------------
-- Server version	8.0.39

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
-- Table structure for table `gio_hang`
--

DROP TABLE IF EXISTS `gio_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gio_hang` (
  `ma_gio_hang` bigint NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` bigint NOT NULL,
  `trang_thai` enum('hoat_dong','da_chuyen_don','bo_qua') NOT NULL DEFAULT 'hoat_dong',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_gio_hang`),
  KEY `idx_gh_nd` (`ma_nguoi_dung`),
  CONSTRAINT `fk_gh_nd` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gio_hang`
--

LOCK TABLES `gio_hang` WRITE;
/*!40000 ALTER TABLE `gio_hang` DISABLE KEYS */;
INSERT INTO `gio_hang` VALUES (1,1,'da_chuyen_don','2025-11-17 20:51:15','2025-11-17 21:09:29'),(2,2,'hoat_dong','2025-11-17 22:01:23','2025-11-17 22:01:23'),(3,1,'da_chuyen_don','2025-11-17 22:48:19','2025-11-18 08:06:06'),(4,1,'da_chuyen_don','2025-11-18 08:08:10','2025-11-18 08:32:12'),(5,1,'da_chuyen_don','2025-11-18 08:37:08','2025-11-18 08:37:24'),(6,1,'da_chuyen_don','2025-11-18 08:37:31','2025-11-18 08:37:53'),(7,1,'hoat_dong','2025-11-18 08:38:30','2025-11-18 08:38:30');
/*!40000 ALTER TABLE `gio_hang` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-18 19:44:57
