import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const cardId = String(form.get("cardId"));
  const card = await prisma.card.findFirst({ where: { id: cardId, account: { userId: user.id } } });
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
  await prisma.card.delete({ where: { id: cardId } });
  return NextResponse.redirect(new URL("/cards?status=deleted", request.url));
}


