import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getSessionUser } from "../../../../lib/auth";

const Body = z.object({
  cardId: z.string().min(1),
  amount: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val !== "", "Amount is required"),
  merchant: z.string().min(2, "Merchant name is too short"),
  narrative: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const raw = Object.fromEntries(form) as Record<string, string>;
  const parsed = Body.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/cards?status=invalid", request.url));
  }

  const { cardId, amount, merchant, narrative } = parsed.data;
  const amountValue = Number(amount);

  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    return NextResponse.redirect(new URL("/cards?status=invalid", request.url));
  }

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { account: true },
  });

  if (!card || card.account.userId !== user.id) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (card.isFrozen) {
    return NextResponse.redirect(new URL("/cards?status=frozen", request.url));
  }

  const balance = Number(card.account.balance);
  if (balance < amountValue) {
    return NextResponse.redirect(new URL("/cards?status=insufficient", request.url));
  }

  const limitValue = card.limit ? Number(card.limit) : undefined;

  if (limitValue !== undefined) {
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const spending = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        cardId: card.id,
        type: "CARD_SPEND",
        createdAt: { gte: windowStart },
      },
    });
    const spent = spending._sum.amount ? Number(spending._sum.amount) : 0;
    if (spent + amountValue > limitValue) {
      return NextResponse.redirect(new URL("/cards?status=limit", request.url));
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: card.accountId },
      data: { balance: { decrement: amountValue } },
    });

    await tx.transaction.create({
      data: {
        senderId: card.accountId,
        receiverId: null,
        cardId: card.id,
        type: "CARD_SPEND",
        merchant,
        narrative: narrative?.trim() ? narrative.trim() : `Card spend at ${merchant}`,
        amount: amountValue,
        status: "SUCCESS",
      },
    });

    await tx.card.update({
      where: { id: card.id },
      data: { lastUsedAt: new Date() },
    });
  });

  return NextResponse.redirect(new URL("/cards?status=spent", request.url));
}


