import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes Supabase session cookies and gates the staff/admin screens.
// API routes are not matched here — they return JSON 401/403 themselves.

/**
 * Staff allow-list, duplicated from lib/supabase/auth.ts.
 *
 * Middleware runs on the edge runtime and cannot import that module, which
 * pulls in "server-only". Keep the two in step; lib/guards.ts is what actually
 * protects the data, and this only decides whether the page renders.
 *
 * No allow-list configured means we cannot tell staff from strangers, so
 * nobody gets in.
 */
function isAllowed(email: string | undefined): boolean {
  if (!email) return false;
  const entries = [process.env.STAFF_EMAILS, process.env.ADMIN_EMAILS]
    .flatMap((raw) => (raw ?? "").split(","))
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return entries.includes(email.toLowerCase());
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (
          list: { name: string; value: string; options: CookieOptions }[]
        ) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = path.startsWith("/staff") || path.startsWith("/admin");

  if (!user && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Signed in is not the same as staff. Supabase enables email sign-ups by
  // default, so without this anyone who self-registered could load /staff and
  // read every open order, customer name, and customer phone number. The API
  // routes behind the screen enforce the same allow-list; this stops the page
  // from rendering at all.
  if (user && needsAuth && !isAllowed(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("denied", "1");
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/staff";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/staff/:path*", "/admin/:path*", "/login"],
};
