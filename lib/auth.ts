import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "vaultx_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "dev_secret_change_me";
  return new TextEncoder().encode(secret);
}

export async function createUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { name, email, passwordHash } });
}

export async function verifyUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function setSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret());
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    secure,
    sameSite: "lax",
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = payload.sub as string | undefined;
    if (!userId) return null;
    return prisma.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}

type RequireUserOptions = {
  redirectTo?: string;
  throwOnUnauthenticated?: boolean;
};

export async function requireUser(options?: RequireUserOptions) {
  const { redirectTo = "/login", throwOnUnauthenticated = false } =
    options ?? {};
  const user = await getSessionUser();
  if (!user) {
    if (throwOnUnauthenticated) {
      throw new Error("UNAUTHENTICATED");
    }
    redirect(redirectTo);
  }
  return user;
}


