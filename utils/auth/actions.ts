"use server";

import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { getErrorMessage } from "./helpers";

export async function signInWithGoogle() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true, url: data?.url };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  try {
    const supabase = await createClient();

    // Sign up with email confirmation disabled - we'll handle verification manually
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/verify-email?email=${encodeURIComponent(email)}`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    // Return success with email - user needs to verify before account is fully active
    return {
      success: true,
      message: "Account created! Please verify your email to continue.",
      email: email,
      userId: data.user?.id,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function completeUserProfile(userId: string, email: string, fullName: string) {
  try {
    const admin = createServiceRoleClient();
    
    // Save user profile to the `profiles` table after email verification
    const { error: profileError } = await admin
      .from("profiles")
      .insert([
        {
          id: userId,
          email: email,
          full_name: fullName,
          role: 'user',
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      console.error("Error saving profile:", profileError);
      return { success: false, error: getErrorMessage(profileError) };
    }

    return { success: true, message: "Profile created successfully!" };
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
    // Use service-role client to bypass RLS policies
    const userId = data?.user?.id;
    if (!userId) return { success: true };

    const admin = createServiceRoleClient();
    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .select("role, approved")
      .eq("id", userId)
      .single();

    if (profileError) {
      // if profile not found, default to regular user
      console.error("Profile fetch error:", profileError);
      return { success: true, role: "user" };
    }

    // If the client specifically requested an admin sign-in, enforce it server-side
    if (requestedRole === "admin" && profileData?.role !== "admin") {
      return { success: false, error: "This account is not an admin." };
    }

    console.log("User role from database:", profileData?.role);
    return { success: true, role: profileData?.role || "user", approved: profileData?.approved || false };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function resetPasswordForEmail(formData: FormData) {
  const email = formData.get("email") as string;

  try {
    const supabase = await createClient();

    // Security: Verify email exists in profiles table before sending reset email
    // This prevents email enumeration attacks
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    // Return same success message regardless of whether email exists
    // This prevents information disclosure about registered emails
    if (profileError || !profileData) {
      // Email doesn't exist in profiles table - silently succeed to prevent user enumeration
      return {
        success: true,
        message: "Check your email for a password reset link.",
      };
    }

    // Email exists, proceed with password reset
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
