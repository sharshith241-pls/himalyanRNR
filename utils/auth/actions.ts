"use server";

import { createClient } from "@/utils/supabase/server";
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

    // Save user profile to the database
    if (data.user) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          {
            id: data.user.id,
            email: email,
            full_name: fullName,
            created_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        console.error("Error saving profile:", profileError);
        // Don't fail signup if profile save fails, but log it
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
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
