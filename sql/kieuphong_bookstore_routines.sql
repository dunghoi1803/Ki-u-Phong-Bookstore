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
-- Temporary view structure for view `vw_doanh_thu_thang`
--

DROP TABLE IF EXISTS `vw_doanh_thu_thang`;
/*!50001 DROP VIEW IF EXISTS `vw_doanh_thu_thang`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_doanh_thu_thang` AS SELECT 
 1 AS `thang_nam`,
 1 AS `so_don_hang`,
 1 AS `tong_doanh_thu`,
 1 AS `hoan_tien`,
 1 AS `doanh_thu_thuan`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_sach_ban_chay`
--

DROP TABLE IF EXISTS `vw_sach_ban_chay`;
/*!50001 DROP VIEW IF EXISTS `vw_sach_ban_chay`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_sach_ban_chay` AS SELECT 
 1 AS `thang_nam`,
 1 AS `ma_sach`,
 1 AS `so_luong_ban`,
 1 AS `doanh_thu`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_chi_tieu_khach_hang`
--

DROP TABLE IF EXISTS `vw_chi_tieu_khach_hang`;
/*!50001 DROP VIEW IF EXISTS `vw_chi_tieu_khach_hang`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_chi_tieu_khach_hang` AS SELECT 
 1 AS `thang_nam`,
 1 AS `ma_khach_hang`,
 1 AS `so_don_hang`,
 1 AS `tong_chi_tieu`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vw_doanh_thu_thang`
--

/*!50001 DROP VIEW IF EXISTS `vw_doanh_thu_thang`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_doanh_thu_thang` AS select date_format(`don_hang`.`ngay_tao`,'%Y-%m') AS `thang_nam`,count(0) AS `so_don_hang`,sum(`don_hang`.`tong_thanh_toan`) AS `tong_doanh_thu`,sum((case when (`don_hang`.`trang_thai_thanh_toan` = 'hoan_tien') then `don_hang`.`tong_thanh_toan` else 0 end)) AS `hoan_tien`,sum((case when (`don_hang`.`trang_thai_don_hang` = 'da_giao') then `don_hang`.`tong_thanh_toan` else 0 end)) AS `doanh_thu_thuan` from `don_hang` group by date_format(`don_hang`.`ngay_tao`,'%Y-%m') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_sach_ban_chay`
--

/*!50001 DROP VIEW IF EXISTS `vw_sach_ban_chay`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_sach_ban_chay` AS select date_format(`dh`.`ngay_tao`,'%Y-%m') AS `thang_nam`,`ctdh`.`ma_sach` AS `ma_sach`,sum(`ctdh`.`so_luong`) AS `so_luong_ban`,sum(`ctdh`.`thanh_tien`) AS `doanh_thu` from (`don_hang` `dh` join `chi_tiet_don_hang` `ctdh` on((`ctdh`.`ma_don_hang` = `dh`.`ma_don_hang`))) where (`dh`.`trang_thai_don_hang` = 'da_giao') group by date_format(`dh`.`ngay_tao`,'%Y-%m'),`ctdh`.`ma_sach` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_chi_tieu_khach_hang`
--

/*!50001 DROP VIEW IF EXISTS `vw_chi_tieu_khach_hang`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_chi_tieu_khach_hang` AS select date_format(`dh`.`ngay_tao`,'%Y-%m') AS `thang_nam`,`dh`.`ma_khach_hang` AS `ma_khach_hang`,count(0) AS `so_don_hang`,sum(`dh`.`tong_thanh_toan`) AS `tong_chi_tieu` from `don_hang` `dh` where ((`dh`.`trang_thai_don_hang` = 'da_giao') and (`dh`.`ma_khach_hang` is not null)) group by date_format(`dh`.`ngay_tao`,'%Y-%m'),`dh`.`ma_khach_hang` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-18 19:45:00
