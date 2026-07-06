/*
  Warnings:

  - A unique constraint covering the columns `[sandboxId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sandboxId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "sandboxId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_sandboxId_key" ON "Project"("sandboxId");
