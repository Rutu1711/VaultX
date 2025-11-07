import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getSessionUser } from "../../../../lib/auth";

const Body = z.object({
  accountId: z.string(),
  cardNumber: z.string().min(12),
  expiry: z.string().min(4),
  nickname: z.string().optional(),
  limit: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = await request.formData();
  const body = Object.fromEntries(fd) as Record<string, string>;
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const { accountId, cardNumber, expiry, nickname, limit } = parsed.data;
  const account = await prisma.account.findFirst({ where: { id: accountId, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  const limitValue = limit ? Number(limit) : undefined;
  if (limitValue && Number.isNaN(limitValue)) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }
  await prisma.card.create({
    data: {
      accountId,
      cardNumber,
      expiry,
      nickname: nickname?.trim() ? nickname : null,
      limit: limitValue,
    },
  });
  return NextResponse.redirect(new URL("/cards?status=created", request.url));
}


