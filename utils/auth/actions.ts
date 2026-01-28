"use server";

import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { getErrorMessage } from "./helpers";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    // Save user profile to the `profiles` table (explicit role: 'user')
    // Use the service-role client for this insert so RLS does not block it.
    if (data.user) {
      try {
        const admin = createServiceRoleClient();
        const { error: profileError } = await admin
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: 'user',
              created_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error("Error saving profile with service role:", profileError);
          return { success: false, error: getErrorMessage(profileError) };
        }
      } catch (err) {
        // If service-role is not configured, fall back to best-effort insert with the current client.
        console.error("Service role insert failed or not configured, falling back to regular client:", err);
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: 'user',
              created_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error("Error saving profile with fallback client:", profileError);
          return { success: false, error: "Database error saving new user. Ensure SUPABASE_SERVICE_ROLE_KEY is set on the server." };
        }
      }
    }

    return {
      success: true,
      message: "Account created! Please check your email to confirm.",
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const supabase = await createClient();

    const requestedRole = (formData.get("role") as string) || undefined;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    // After successful sign in, fetch profile role and approved status
    const userId = data?.user?.id;
    if (!userId) return { success: true };

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, approved")
      .eq("id", userId)
      .single();

    if (profileError) {
      // if profile not found, default to regular user
      return { success: true, role: "user" };
    }

    // If the client specifically requested an admin sign-in, enforce it server-side
    if (requestedRole === "admin" && profileData?.role !== "admin") {
      return { success: false, error: "This account is not an admin." };
    }

    return { success: true, role: profileData?.role || "user", approved: profileData?.approved || false };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function resetPasswordForEmail(formData: FormData) {
  const email = formData.get("email") as string;

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return {
      success: true,
      message: "Check your email for a password reset link.",
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true, message: "Password updated successfully!" };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
