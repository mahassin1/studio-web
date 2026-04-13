import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({ 
            name,
            value,
            ...options,
          });

          response = NextResponse.next({
            request,
          });

          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });

          response = NextResponse.next({
            request,
          });

          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isDashboardRoute =
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/client");
  const isBookingRoute =
    pathname.includes("/book") || pathname === "/booking-confirmation";
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  if ((isDashboardRoute || isBookingRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
  const role = user.user_metadata?.role;

  const url = request.nextUrl.clone();
  url.pathname =
    role === "provider"
      ? "/dashboard"
      : "/client/appointments";

  return NextResponse.redirect(url);
}

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/booking-confirmation",
    "/b/:path*/book",
  ],
};