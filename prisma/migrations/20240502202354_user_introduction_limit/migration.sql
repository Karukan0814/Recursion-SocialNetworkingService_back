/*
  Warnings:

  - You are about to alter the column `introduction` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(200)`.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `introduction` VARCHAR(200) NULL;
