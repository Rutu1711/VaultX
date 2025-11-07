import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const id = form.get("id");
  if (!id) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const beneficiary = await prisma.beneficiary.findUnique({ where: { id: String(id) } });
  if (!beneficiary || beneficiary.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.beneficiary.delete({ where: { id: beneficiary.id } });
  return NextResponse.redirect(new URL("/transactions?beneficiary=deleted", request.url));
}


