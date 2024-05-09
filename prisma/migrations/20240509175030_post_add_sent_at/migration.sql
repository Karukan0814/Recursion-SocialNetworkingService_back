-- AlterTable
ALTER TABLE `Post` ADD COLUMN `sentAt` DATETIME(3) NULL,
    MODIFY `scheduledAt` DATETIME(3) NULL;
