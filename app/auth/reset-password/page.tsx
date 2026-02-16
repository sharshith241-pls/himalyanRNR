"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/utils/supabase/client";
import { updatePassword } from "@/utils/auth/actions";
import { validatePassword, validatePasswordMatch } from "@/utils/auth/helpers";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [invalidToken, setInvalidToken] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery session for password reset
    const checkRecoverySession = async () => {
      try {
        if (!supabase) {
          setError("Authentication service not available. Please try again.");
          setInvalidToken(true);
          return;
        }
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Check if we're in a recovery flow (has recovery session)
        if (!session) {
          // No session at all - user needs to request a new recovery link
          setError("Invalid or expired reset link. Please request a new one.");
          setInvalidToken(true);
          return;
        }
        
        // Session exists, check if it's a recovery session by trying to get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError("Invalid recovery session. Please request a new reset link.");
          setInvalidToken(true);
          return;
        }
        
        // Valid recovery session exists, we're ready
        setIsReady(true);
      } catch (err) {
        console.error("Session check error:", err);
        setError("An error occurred. Please try again.");
        setInvalidToken(true);
      }
    };
    
    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!password) {
      setError("Password is required");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password");
      return;
    }

    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      setError(matchError);
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(password);

      if (result.success) {
        setSuccess(result.message || "Password updated successfully!");
        setPassword("");
        setConfirmPassword("");
        
        // Clear any cached auth state and force a hard redirect
        // Wait a bit to show success message
        setTimeout(() => {
          // Clear local storage/session storage of auth data
          if (typeof window !== 'undefined') {
            sessionStorage.clear();
            // Force hard redirect to ensure fresh page load
            window.location.href = "/auth/login?reset=success";
          }
        }, 2000);
      } else {
        setError(result.error || "Failed to update password");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return <div className="text-center">Loading...</div>;
  }

  if (invalidToken) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-center mb-2">
          Invalid Reset Link
        </h1>

        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>

        <div className="text-center text-sm text-gray-600 mt-6">
          <a
            href="/auth/forgot-password"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Request a new reset link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-2">
        Set New Password
      </h1>
      <p className="text-center text-gray-600 mb-2">
        Enter your new password below
      </p>
      <div className="text-center text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-md p-3 mb-4">
        <strong>⚠️ Required:</strong> You must set a new password to complete the reset. This password change cannot be skipped.
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New Password (min 8 characters)
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <a
          href="/auth/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Sign In
        </a>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
