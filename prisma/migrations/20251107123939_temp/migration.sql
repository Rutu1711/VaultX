-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_receiverId_fkey";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
