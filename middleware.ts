import { NextRequest, NextResponse } from "next/server";

function readSession(request: NextRequest): { role: "ADMIN" | "EMPLOYEE" | "MANAGER"; userId: string } | null {
  const raw = request.cookies.get("im_session")?.value;
  if (!raw) return null;

  const index = raw.lastIndexOf(".");
  if (index < 0) return null;

  const payload = raw.slice(0, index);

  try {
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = readSession(request);

  if (!session && (pathname.startsWith("/dashboard") || pathname === "/change-password")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!session) return NextResponse.next();

  if (pathname.startsWith("/dashboard/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/employee", request.url));
  }

  if (pathname.startsWith("/dashboard/employee") && session.role === "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  if (pathname === "/change-password" && session.role === "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/change-password"],
};
