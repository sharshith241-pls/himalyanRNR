"use client";

import Link from "next/link";
import { useState } from "react";
import { resetPasswordForEmail } from "@/utils/auth/actions";
import { validateEmail } from "@/utils/auth/helpers";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);

      const result = await resetPasswordForEmail(formData);

      if (result.success) {
        setSuccess(result.message || "Password reset email sent!");
        setEmail("");
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-2">
        Reset Password
      </h1>
      <p className="text-center text-gray-600 mb-4">
        Enter your email to receive a password reset link
      </p>
      
      <div className="text-center text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-md p-3 mb-6">
        <strong>ℹ️ Note:</strong> Password reset links are only sent to registered accounts. Check your email (including spam folder) for the reset link.
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
          {success}
          <div className="mt-2 text-sm font-medium">
            ✓ Please check your email (including spam/junk folder) for the reset link. The link expires in 24 hours.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Remember your password?{" "}
        <Link
          href="/auth/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
