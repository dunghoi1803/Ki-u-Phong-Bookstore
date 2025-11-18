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
-- Table structure for table `chi_tiet_don_hang`
--

DROP TABLE IF EXISTS `chi_tiet_don_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_don_hang` (
  `ma_chi_tiet` bigint NOT NULL AUTO_INCREMENT,
  `ma_don_hang` bigint NOT NULL,
  `ma_sach` bigint NOT NULL,
  `so_luong` int NOT NULL,
  `don_gia` decimal(12,2) NOT NULL,
  `thanh_tien` decimal(12,2) GENERATED ALWAYS AS ((`so_luong` * `don_gia`)) STORED,
  PRIMARY KEY (`ma_chi_tiet`),
  KEY `idx_ctdh_sach` (`ma_sach`),
  KEY `fk_ctdh_dh` (`ma_don_hang`),
  CONSTRAINT `fk_ctdh_dh` FOREIGN KEY (`ma_don_hang`) REFERENCES `don_hang` (`ma_don_hang`) ON DELETE CASCADE,
  CONSTRAINT `fk_ctdh_sach` FOREIGN KEY (`ma_sach`) REFERENCES `sach` (`ma_sach`),
  CONSTRAINT `chi_tiet_don_hang_chk_1` CHECK ((`so_luong` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chi_tiet_don_hang`
--

LOCK TABLES `chi_tiet_don_hang` WRITE;
/*!40000 ALTER TABLE `chi_tiet_don_hang` DISABLE KEYS */;
INSERT INTO `chi_tiet_don_hang` (`ma_chi_tiet`, `ma_don_hang`, `ma_sach`, `so_luong`, `don_gia`) VALUES (1,1,1,1,189000.00),(2,1,8,1,98000.00),(6,3,5,3,119000.00),(7,2,5,3,119000.00);
/*!40000 ALTER TABLE `chi_tiet_don_hang` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-18 19:44:54
