import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const form = await request.formData();
    const senderId = String(form.get("senderId"));
    const receiverAccountNumber = String(form.get("receiverAccountNumber"));
    const amount = Number(form.get("amount"));
    if (!senderId || !receiverAccountNumber || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const sender = await prisma.account.findFirst({ where: { id: senderId, userId: user.id } });
    if (!sender) return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    const receiver = await prisma.account.findUnique({ where: { accountNumber: receiverAccountNumber } });
    if (!receiver) return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    if (Number(sender.balance) < amount) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.account.update({ where: { id: sender.id }, data: { balance: { decrement: amount } } });
      await tx.account.update({ where: { id: receiver.id }, data: { balance: { increment: amount } } });
      await tx.transaction.create({
        data: {
          senderId: sender.id,
          receiverId: receiver.id,
          amount,
          status: "SUCCESS",
          type: "TRANSFER",
          narrative: `Transfer to ${receiver.accountNumber}`,
        },
      });
    });
    return NextResponse.redirect(new URL("/transactions?success=1", request.url));
  } catch (error) {
    console.error("Transfer failed", error);
    return NextResponse.json({ error: "Transfer failed" }, { status: 400 });
  }
}


