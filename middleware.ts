import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export async function middleware(request: NextRequest) {
  // Skip middleware for auth callback to preserve PKCE flow
  if (request.nextUrl.pathname === "/auth/callback") {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  // If Supabase env vars are missing, skip auth but allow page to load
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Middleware: Missing Supabase environment variables");
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh the session to ensure it's valid
    // Add timeout to prevent hanging if Supabase is slow
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase timeout")), 5000)
    );
    
    await Promise.race([
      supabase.auth.getSession(),
      timeoutPromise
    ]);
  } catch (error) {
    // If Supabase fails, still allow the page to load
    console.error("Middleware auth error:", error);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run middleware on all routes except api and static files
    "/((?!_next/static|_next/image|favicon.ico|logoo.jpeg).*)",
  ],
};
