import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await request.formData();
  const cardId = String(form.get("cardId"));
  const card = await prisma.card.findUnique({ where: { id: cardId }, include: { account: true } });
  if (!card || card.account.userId !== user.id) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  await prisma.card.update({ where: { id: cardId }, data: { isFrozen: !card.isFrozen, lastUsedAt: new Date() } });
  return NextResponse.redirect(new URL("/cards?status=updated", request.url));
}


