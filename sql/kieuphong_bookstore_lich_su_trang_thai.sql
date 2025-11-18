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
-- Table structure for table `lich_su_trang_thai`
--

DROP TABLE IF EXISTS `lich_su_trang_thai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_trang_thai` (
  `ma_lich_su` bigint NOT NULL AUTO_INCREMENT,
  `ma_don_hang` bigint NOT NULL,
  `trang_thai_cu` varchar(32) DEFAULT NULL,
  `trang_thai_moi` varchar(32) NOT NULL,
  `nguoi_thay_doi` bigint DEFAULT NULL,
  `thoi_gian` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ghi_chu` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`ma_lich_su`),
  KEY `idx_ls_dh` (`ma_don_hang`,`thoi_gian`),
  KEY `fk_ls_nd` (`nguoi_thay_doi`),
  CONSTRAINT `fk_ls_dh` FOREIGN KEY (`ma_don_hang`) REFERENCES `don_hang` (`ma_don_hang`) ON DELETE CASCADE,
  CONSTRAINT `fk_ls_nd` FOREIGN KEY (`nguoi_thay_doi`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_su_trang_thai`
--

LOCK TABLES `lich_su_trang_thai` WRITE;
/*!40000 ALTER TABLE `lich_su_trang_thai` DISABLE KEYS */;
INSERT INTO `lich_su_trang_thai` VALUES (1,1,'cho_xac_nhan','da_huy',1,'2025-11-18 08:03:17','Khách hàng hủy đơn hàng từ giao diện tài khoản'),(2,3,'cho_xac_nhan','da_giao',2,'2025-11-18 10:56:30','Admin updated order status from dashboard'),(3,2,'cho_xac_nhan','da_giao',2,'2025-11-18 10:56:33','Admin updated order status from dashboard'),(4,1,'da_huy','da_giao',2,'2025-11-18 10:56:35','Admin updated order status from dashboard'),(5,3,'da_giao','da_giao',2,'2025-11-18 10:56:38','Admin updated payment status to da_thanh_toan'),(6,2,'da_giao','da_giao',2,'2025-11-18 10:56:41','Admin updated payment status to da_thanh_toan'),(7,1,'da_giao','da_giao',2,'2025-11-18 10:56:44','Admin updated payment status to da_thanh_toan');
/*!40000 ALTER TABLE `lich_su_trang_thai` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-18 19:44:58
