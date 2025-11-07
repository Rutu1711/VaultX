import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getSessionUser } from "../../../../lib/auth";

const Body = z.object({ accountId: z.string(), cardNumber: z.string().min(12), expiry: z.string().min(4) });

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = await request.formData();
  const body = Object.fromEntries(fd) as Record<string, string>;
  const { accountId, cardNumber, expiry } = Body.parse(body);
  const account = await prisma.account.findFirst({ where: { id: accountId, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  await prisma.card.create({ data: { accountId, cardNumber, expiry } });
  return NextResponse.redirect(new URL("/cards", request.url));
}


