import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const cardId = form.get("cardId");
  const limit = form.get("limit");
  const nickname = form.get("nickname");
  if (!cardId) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const card = await prisma.card.findUnique({ where: { id: String(cardId) }, include: { account: true } });
  if (!card || card.account.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const limitNumber = typeof limit === "string" && limit.trim().length > 0 ? Number(limit) : null;
  if (limitNumber !== null && Number.isNaN(limitNumber)) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  await prisma.card.update({
    where: { id: card.id },
    data: {
      limit: limitNumber,
      nickname: typeof nickname === "string" && nickname.trim().length > 0 ? nickname : null,
    },
  });

  return NextResponse.redirect(new URL("/cards?status=updated", request.url));
}


