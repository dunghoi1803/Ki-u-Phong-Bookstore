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
-- Table structure for table `danh_gia`
--

DROP TABLE IF EXISTS `danh_gia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_gia` (
  `ma_danh_gia` bigint NOT NULL AUTO_INCREMENT,
  `ma_sach` bigint NOT NULL,
  `ma_nguoi_dung` bigint NOT NULL,
  `diem_danh_gia` tinyint NOT NULL,
  `tieu_de` varchar(255) DEFAULT NULL,
  `noi_dung` text,
  `duyet_hien_thi` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_danh_gia`),
  UNIQUE KEY `uniq_dg_sach_user` (`ma_sach`,`ma_nguoi_dung`),
  KEY `idx_dg_user` (`ma_nguoi_dung`),
  CONSTRAINT `fk_dg_nd` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_nguoi_dung`) ON DELETE CASCADE,
  CONSTRAINT `fk_dg_sach` FOREIGN KEY (`ma_sach`) REFERENCES `sach` (`ma_sach`) ON DELETE CASCADE,
  CONSTRAINT `chk_diem_danh_gia` CHECK ((`diem_danh_gia` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danh_gia`
--

LOCK TABLES `danh_gia` WRITE;
/*!40000 ALTER TABLE `danh_gia` DISABLE KEYS */;
INSERT INTO `danh_gia` VALUES (1,1,1,4,NULL,'Cuốn sách này vô cùng hữu ích cho tôi trong việc học cách tư duy, xắp sếp suy nghĩ, và tìm ra hướng đi đúng đắn trong những lúc lạc lối.',1,'2025-11-18 12:07:41','2025-11-18 12:07:41'),(2,9,1,1,NULL,'Cuốn sách trẻ con dở tệ, cop nhặt ý tưởng phương Tây về để viết cho trẻ con, cái thời mà 90% dân số còn chả biết chữ. Con nhà giàu thì nó học hẳn tiếng Tây, cần gì phải đọc ba cái chuyện linh tinh này.',1,'2025-11-18 12:09:59','2025-11-18 12:09:59'),(3,6,1,5,NULL,'Chuyện hay, cổ điển, Victorian Era, ái kỉ và kì dị, Sherlock Holmes chắc chắn là 1 trong những hình tượng thám tử tạo nhiều cảm hứng nhất cho những người làm nghệ thuật.',1,'2025-11-18 12:16:06','2025-11-18 12:16:06');
/*!40000 ALTER TABLE `danh_gia` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-18 19:44:56
