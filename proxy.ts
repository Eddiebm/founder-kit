import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./app/lib/auth";

const PROTECTED = ["/grants", "/wizard", "/register", "/billing"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("app_session")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifyToken(token);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/grants/:path*", "/wizard/:path*", "/register/:path*", "/billing/:path*"],
};
