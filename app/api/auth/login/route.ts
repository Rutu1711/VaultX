import { NextResponse } from "next/server";
import { z } from "zod";
import { setSession, verifyUser } from "../../../../lib/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);
    const user = await verifyUser(email, password);
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    await setSession(user.id);
    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 400 });
  }
}


