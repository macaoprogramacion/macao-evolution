import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "macao_customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type CustomerSession = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "cliente" | "representante";
  loggedInAt: string;
};

function getSecret() {
  return process.env.CUSTOMER_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "macao-dev-secret";
}

function sign(payloadBase64: string) {
  return createHmac("sha256", getSecret()).update(payloadBase64).digest("base64url");
}

function encodeSession(session: CustomerSession) {
  const payloadBase64 = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = sign(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

function decodeSession(token: string): CustomerSession | null {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expected = sign(payloadBase64);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as CustomerSession;
    if (!parsed?.id || !parsed?.email || !parsed?.role) return null;
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

  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { session?: CustomerSession } | null;
  const session = body?.session;

  if (!session?.id || !session?.email || !session?.role || !session?.name) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 400 });
  }

  const token = encodeSession(session);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

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
