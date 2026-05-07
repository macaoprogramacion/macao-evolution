import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "macao_dashboard_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

type DashboardSession = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  avatar_url?: string | null;
  active: boolean;
  issuedAt: string;
  expiresAt: string;
};

function getSecret() {
  return process.env.CUSTOMER_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "macao-dev-secret";
}

function sign(payloadBase64: string) {
  return createHmac("sha256", getSecret()).update(payloadBase64).digest("base64url");
}

function encodeSession(session: DashboardSession) {
  const payloadBase64 = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = sign(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

function decodeSession(token: string): DashboardSession | null {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expected = sign(payloadBase64);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as DashboardSession;
    if (!parsed?.id || !parsed?.role || !parsed?.name || parsed?.active !== true) return null;
    if (!parsed?.issuedAt || !parsed?.expiresAt) return null;
    const expiresAt = new Date(parsed.expiresAt).getTime();
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function GET() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ session: null });

  const session = decodeSession(token);
  if (!session) {
    const response = NextResponse.json({ session: null });
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  // Sliding expiry: refresh the cookie on every valid read
  const issuedAt = new Date(session.issuedAt);
  const newExpiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000);
  const response = NextResponse.json({ session });
  response.cookies.set(
    COOKIE_NAME,
    encodeSession({ ...session, issuedAt: issuedAt.toISOString(), expiresAt: newExpiresAt.toISOString() }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    },
  );
  return response;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { session?: Partial<DashboardSession> } | null;
  const session = body?.session;
  if (!session?.id || !session?.name || !session?.role) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 400 });
  }

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + MAX_AGE_SECONDS * 1000);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    COOKIE_NAME,
    encodeSession({
      id: session.id,
      name: session.name,
      email: session.email,
      phone: session.phone,
      role: session.role,
      avatar_url: session.avatar_url ?? null,
      active: true,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    },
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
