import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const NEW_HOST = "www.jonathanarache.com";
const LEGACY_HOSTS = new Set([
  "macaooffroad.com",
  "www.macaooffroad.com",
  "macaoadventurepark.com",
  "www.macaoadventurepark.com",
]);

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host")?.toLowerCase() || "";
  const host = hostHeader.split(":")[0];

  if (LEGACY_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = NEW_HOST;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
