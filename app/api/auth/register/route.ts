import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, setSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = RegisterSchema.parse(body);
    const user = await createUser(name, email, password);
    // create a default account for the user
    const accountNumber = `VX${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    await prisma.account.create({ data: { userId: user.id, accountNumber, balance: 1000 } });
    await setSession(user.id);
    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


