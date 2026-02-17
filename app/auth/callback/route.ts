import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=No code provided", request.url));
  }

  try {
    const supabase = await createClient();

    // Exchange the code for a session
    // This automatically sets the session in cookies via the createClient's cookie handler
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      );
    }

    // Check if this is a password recovery flow
    if (searchParams.get("type") === "recovery") {
      // Redirect to reset password page
      // The session cookies are already set by exchangeCodeForSession
      return NextResponse.redirect(
        new URL("/auth/reset-password", request.url)
      );
    }

    // For regular OAuth/email signups, create profile if needed
    if (data.user) {
      try {
        const admin = createServiceRoleClient();
        const { data: profileData } = await admin
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single();

        // If profile doesn't exist, create it (for Google OAuth signups)
        if (!profileData) {
          const fullName = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User";
          
          await admin.from("profiles").insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              role: "user",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (profileErr) {
        console.error("Profile creation error:", profileErr);
        // Don't fail the whole flow if profile creation fails
      }
    }

    // Redirect to home page after successful authentication
    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(
      new URL("/auth/login?error=Authentication failed", request.url)
    );
  }
}
