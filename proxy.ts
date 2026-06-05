import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/dashboard"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", nextUrl);
    if (pathname !== "/login") {
      url.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(url);
  }

  // Admin-only sub-tree.
  if (pathname.startsWith("/dashboard/admin") && req.auth?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Note: we intentionally do NOT redirect /login or /register when already
  // logged in. The server action that signs you in handles its own redirect,
  // and proxy-level redirects race with it during the cookie set/read window
  // — Chrome throttles the back-and-forth and the page never settles.
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, and the auth API route handler.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$).*)",
  ],
};
