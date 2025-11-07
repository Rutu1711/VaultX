import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const name = String(form.get("name"));
  const email = String(form.get("email"));
  await prisma.user.update({ where: { id: user.id }, data: { name, email } });
  return NextResponse.redirect(new URL("/settings", request.url));
}


