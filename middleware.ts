import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getSessionCookieName(): string {
  return process.env.AUTH_COOKIE_NAME?.trim() || "cricsmart_session";
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isProtected = pathname.startsWith("/account") || pathname.startsWith("/admin");
  if (!isProtected) {
    return NextResponse.next();
  }

  const cookieName = getSessionCookieName();
  const sessionCookie = req.cookies.get(cookieName)?.value;
  if (sessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};

