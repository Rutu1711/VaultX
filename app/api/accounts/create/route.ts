import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accountNumber = `VX${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  await prisma.account.create({ data: { userId: user.id, accountNumber, balance: 0 } });
  return NextResponse.redirect(new URL("/dashboard?created=1", request.url));
}


