/*
  Warnings:

  - You are about to drop the column `is_banned` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended', 'banned');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_banned",
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "status_reason" VARCHAR(255),
ADD COLUMN     "suspended_until" TIMESTAMP(3);
