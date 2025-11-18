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
-- Table structure for table `sach`
--

DROP TABLE IF EXISTS `sach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sach` (
  `ma_sach` bigint NOT NULL AUTO_INCREMENT,
  `ma_sku` varchar(64) NOT NULL,
  `ma_isbn` varchar(32) DEFAULT NULL,
  `ten_sach` varchar(255) NOT NULL,
  `duong_dan_slug` varchar(255) NOT NULL,
  `mo_ta` mediumtext,
  `gia_bia` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gia_ban` decimal(12,2) NOT NULL DEFAULT '0.00',
  `ma_nxb` int DEFAULT NULL,
  `nam_xuat_ban` smallint DEFAULT NULL,
  `so_trang` int DEFAULT NULL,
  `ngon_ngu` varchar(64) DEFAULT NULL,
  `khoi_luong` int DEFAULT NULL,
  `kich_thuoc_rong` int DEFAULT NULL,
  `kich_thuoc_cao` int DEFAULT NULL,
  `do_day` int DEFAULT NULL,
  `anh_bia` varchar(500) DEFAULT NULL,
  `trang_thai` enum('active','inactive') NOT NULL DEFAULT 'active',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ngay_xoa` datetime DEFAULT NULL,
  PRIMARY KEY (`ma_sach`),
  UNIQUE KEY `ma_sku` (`ma_sku`),
  UNIQUE KEY `ma_isbn` (`ma_isbn`),
  KEY `idx_sach_ten` (`ten_sach`),
  KEY `idx_sach_slug` (`duong_dan_slug`),
  KEY `idx_sach_gia` (`gia_ban`),
  KEY `fk_sach_nxb` (`ma_nxb`),
  CONSTRAINT `fk_sach_nxb` FOREIGN KEY (`ma_nxb`) REFERENCES `nha_xuat_ban` (`ma_nxb`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sach`
--

LOCK TABLES `sach` WRITE;
/*!40000 ALTER TABLE `sach` DISABLE KEYS */;
INSERT INTO `sach` VALUES (1,'BOOK-2011-0001',NULL,'Tư duy nhanh và chậm','tư-duy-nhanh-và-chậm','Tác phẩm nổi tiếng của Daniel Kahneman về hệ thống tư duy nhanh/chậm và thiên kiến nhận thức.',189000.00,189000.00,1,2011,600,'Tiếng Việt',600,160,240,35,'https://tse4.mm.bing.net/th/id/OIP.bq4y8rzTP0a5OqV-90iC2AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3','active','2025-11-18 02:58:14','2025-11-18 11:15:50',NULL),(2,'BOOK-1988-0002',NULL,'Nhà giả kim','nhà-giả-kim','Tiểu thuyết truyền cảm hứng về hành trình của Santiago tìm kho báu và định mệnh.',89000.00,89000.00,1,1988,230,'Tiếng Việt',300,140,200,18,'https://bloganchoi.com/wp-content/uploads/2019/11/sach-nha-gia-kim.jpg','active','2025-11-18 02:58:14','2025-11-18 11:15:40',NULL),(3,'BOOK-1967-0003',NULL,'Trăm năm cô đơn','trăm-năm-cô-đơn','Tuyệt tác chủ nghĩa hiện thực kỳ ảo về gia tộc Buendia o Macondo.',165000.00,165000.00,2,1967,520,'Tiếng Việt',550,150,230,32,'https://tse2.mm.bing.net/th/id/OIP.ABCSrqQOZulxZC7_c2q1DAHaL4?w=713&h=1144&rs=1&pid=ImgDetMain&o=7&rm=3','active','2025-11-18 02:58:14','2025-11-18 11:15:35',NULL),(4,'BOOK-2011-0004',NULL,'Sapiens: Lược sử loài người','sapiens:-lược-sử-loài-người','Cai nhin tong quan ve lich su phat trien cua Homo sapiens.',239000.00,239000.00,1,2011,520,'Tiếng Việt',650,160,240,35,'https://cdn0.fahasa.com/media/flashmagazine/images/page_images/sapiens_luoc_su_loai_nguoi/2023_03_21_16_35_44_1-390x510.jpg','active','2025-11-18 02:58:14','2025-11-18 11:15:31',NULL),(5,'BOOK-1997-0005',NULL,'Harry Potter và hòn đá phù thuỷ','harry-potter-và-hòn-đá-phù-thuỷ','Tập 1 series Harry Potter về cậu bé phù thủy nổi tiếng.',119000.00,119000.00,3,1997,320,'Tiếng Việt',420,145,210,22,'https://tse2.mm.bing.net/th/id/OIP.SH7ubdQm4tvsc8l_J9_YHgHaK5?rs=1&pid=ImgDetMain&o=7&rm=3','active','2025-11-18 02:58:14','2025-11-18 11:15:27',NULL),(6,'BOOK-1892-0006',NULL,'Sherlock Holmes - tuyển tập những vụ án hóc búa nhất','sherlock-holmes---tuyển-tập-những-vụ-án-hóc-búa-nhất','Tuyển tập vụ án kinh điển của thám tử Sherlock Holmes và bác sĩ Watson.',99000.00,99000.00,2,1892,380,'Tiếng Việt',450,140,210,24,'https://tse2.mm.bing.net/th/id/OIP.FGRzX9d2xqD6pToAFBB7kQHaKw?rs=1&pid=ImgDetMain&o=7&rm=3','active','2025-11-18 02:58:14','2025-11-18 11:15:23',NULL),(7,'BOOK-1936-0007',NULL,'Đắc nhân tâm','đắc-nhân-tâm','Sách kỹ năng sống kinh điển về nghệ thuật đối nhân xử thế.',89000.00,89000.00,4,1936,320,'Tiếng Việt',350,135,200,20,'https://tse4.mm.bing.net/th/id/OIP.cUYVV92koOJ_3HFiDfTDggHaK1?rs=1&pid=ImgDetMain&o=7&rm=3','active','2025-11-18 02:58:14','2025-11-18 11:15:18',NULL),(8,'BOOK-2010-0008',NULL,'Tôi thấy hoa vàng trên cỏ xanh','tôi-thấy-hoa-vàng-trên-cỏ-xanh','Tiểu thuyết thiếu nhi được yêu thích nhất tại Việt Nam',98000.00,98000.00,3,2010,250,'Tiếng Việt',320,135,200,18,'https://salt.tikicdn.com/ts/product/12/b4/c0/803ac1c09c4baf8b2ca120a401ab558c.jpg','active','2025-11-18 02:58:14','2025-11-18 11:15:13',NULL),(9,'BOOK-1941-009',NULL,'Dế mèn phiêu lưu ký','dế-mèn-phiêu-lưu-ký','“Dế Mèn phiêu lưu ký” là tác phẩm nổi tiếng của Tô Hoài, kể về cuộc phiêu lưu của chú dế Mèn và những bài học quý giá về cuộc sống.',65000.00,65000.00,3,NULL,NULL,'Tiếng Việt',NULL,NULL,NULL,NULL,'https://tse3.mm.bing.net/th/id/OIP.I-LH0cFsNJZ9GtqXVd0oZgHaJp?rs=1&pid=ImgDetMain&o=7&rm=3','active','2025-11-18 10:50:38','2025-11-18 11:15:08',NULL);
/*!40000 ALTER TABLE `sach` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-18 19:44:55
