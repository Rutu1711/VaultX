import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const Schema = z.object({
  nickname: z.string().min(2),
  accountNumber: z.string().min(10),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const data = Schema.safeParse(Object.fromEntries(form));
  if (!data.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const exists = await prisma.beneficiary.findFirst({
    where: { userId: user.id, accountNumber: data.data.accountNumber },
  });
  if (exists) {
    return NextResponse.redirect(new URL("/transactions?beneficiary=exists", request.url));
  }
  await prisma.beneficiary.create({
    data: { userId: user.id, nickname: data.data.nickname, accountNumber: data.data.accountNumber },
  });
  return NextResponse.redirect(new URL("/transactions?beneficiary=added", request.url));
}


