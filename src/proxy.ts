import { NextResponse, type NextRequest } from "next/server";

export const RUN_COOKIE = "sc_run";

/**
 * Gives each visitor a run id, so everyone rescues their own copy of the farm's day.
 * The id is added to the request too, so the very first render already sees it.
 */
export function proxy(req: NextRequest) {
  if (req.cookies.get(RUN_COOKIE)?.value) return NextResponse.next();
  const id = crypto.randomUUID();
  const headers = new Headers(req.headers);
  headers.set("cookie", [req.headers.get("cookie"), `${RUN_COOKIE}=${id}`].filter(Boolean).join("; "));
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set(RUN_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}

export const config = { matcher: ["/today", "/loads/:path*", "/buyers/:path*", "/money", "/rules", "/api/files/:path*"] };
