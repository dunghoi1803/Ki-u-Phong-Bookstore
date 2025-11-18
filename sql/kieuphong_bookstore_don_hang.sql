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
-- Table structure for table `don_hang`
--

DROP TABLE IF EXISTS `don_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `don_hang` (
  `ma_don_hang` bigint NOT NULL AUTO_INCREMENT,
  `ma_khach_hang` bigint DEFAULT NULL,
  `ma_don_hang_code` varchar(32) NOT NULL,
  `ten_nguoi_nhan` varchar(120) NOT NULL,
  `so_dien_thoai` varchar(30) DEFAULT NULL,
  `dia_chi_giao_json` json DEFAULT NULL,
  `tong_tien_hang` decimal(12,2) NOT NULL DEFAULT '0.00',
  `chiet_khau` decimal(12,2) NOT NULL DEFAULT '0.00',
  `phi_van_chuyen` decimal(12,2) NOT NULL DEFAULT '0.00',
  `thue` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tong_thanh_toan` decimal(12,2) NOT NULL,
  `trang_thai_thanh_toan` enum('chua_thanh_toan','da_thanh_toan','hoan_tien','mot_phan') NOT NULL DEFAULT 'chua_thanh_toan',
  `trang_thai_don_hang` enum('cho_xac_nhan','da_xac_nhan','dang_chuan_bi','dang_giao','da_giao','da_huy') NOT NULL DEFAULT 'cho_xac_nhan',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_don_hang`),
  UNIQUE KEY `ma_don_hang_code` (`ma_don_hang_code`),
  KEY `idx_dh_trangthai_thoigian` (`trang_thai_don_hang`,`ngay_tao`),
  KEY `idx_dh_khach` (`ma_khach_hang`,`ngay_tao`),
  CONSTRAINT `fk_dh_khach` FOREIGN KEY (`ma_khach_hang`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `don_hang`
--

LOCK TABLES `don_hang` WRITE;
/*!40000 ALTER TABLE `don_hang` DISABLE KEYS */;
INSERT INTO `don_hang` VALUES (1,1,'DH20251117210928','Nguyễn Việt Dũng','0936164255','{\"ward\": \"Phường Bến Nghé\", \"phone\": \"0936164255\", \"district\": \"Quận 1\", \"province\": \"TP Hồ Chí Minh\", \"postal_code\": null, \"address_line\": \"13 Khu 1 tập thể cục cảnh sát kinh tế\", \"shipping_fee\": 0.0, \"receiver_name\": \"Nguyễn Việt Dũng\"}',287000.00,0.00,0.00,0.00,287000.00,'da_thanh_toan','da_giao','2025-11-17 21:09:29','2025-11-18 10:56:44'),(2,1,'DH20251118080605','Nguyễn Việt Dũng','0936164255','{\"ward\": \"Phường Tràng Tiền\", \"phone\": \"0936164255\", \"district\": \"Quận Hoàn Kiếm\", \"province\": \"Hà Nội\", \"postal_code\": null, \"address_line\": \"13 Hàng Bạc\", \"shipping_fee\": 0.0, \"receiver_name\": \"Nguyễn Việt Dũng\"}',357000.00,0.00,0.00,0.00,357000.00,'da_thanh_toan','da_giao','2025-11-18 08:06:06','2025-11-18 10:56:41'),(3,1,'DH20251118083211','Nguyễn Việt Dũng','0936164255','{\"ward\": \"Phường Hàng Bạc\", \"phone\": \"0936164255\", \"district\": \"Quận Hoàn Kiếm\", \"province\": \"Hà Nội\", \"postal_code\": null, \"address_line\": \"13 Hàng Bạc\", \"shipping_fee\": 0.0, \"receiver_name\": \"Nguyễn Việt Dũng\"}',357000.00,0.00,0.00,0.00,357000.00,'da_thanh_toan','da_giao','2025-11-18 08:32:12','2025-11-18 10:56:38');
/*!40000 ALTER TABLE `don_hang` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-18 19:44:59
