-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TRANSFER', 'CARD_SPEND');

-- AlterTable
ALTER TABLE "Transaction"
    ADD COLUMN     "cardId" TEXT,
    ADD COLUMN     "merchant" TEXT,
    ADD COLUMN     "narrative" TEXT,
    ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'TRANSFER',
    ALTER COLUMN "receiverId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_cardId_idx" ON "Transaction"("cardId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;


