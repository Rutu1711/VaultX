-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "limit" DECIMAL(65,30),
ADD COLUMN     "nickname" TEXT;

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
