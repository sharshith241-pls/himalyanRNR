import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

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
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      );
    }

    // Check if this is a password recovery flow by looking at the URL
    // Recovery emails have #access_token and type=recovery in the hash
    if (request.url.includes("type=recovery")) {
      // For password recovery, we have a valid recovery session
      // Redirect to reset password page where user can set new password
      // The recovery session in cookies will be used to update the password
      return NextResponse.redirect(new URL("/auth/reset-password", request.url));
    }

    if (data.user) {
      // Check if profile exists
      const admin = createServiceRoleClient();
      const { data: profileData, error: profileError } = await admin
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      // If profile doesn't exist, create it (for Google OAuth signups)
      if (!profileData && !profileError) {
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
