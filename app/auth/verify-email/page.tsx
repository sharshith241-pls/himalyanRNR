"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { completeUserProfile } from "@/utils/auth/actions";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    if (!email) {
      setError("Email not found. Please try registering again.");
      return;
    }

    setLoading(true);

    try {
      const supabase = await createClient();

      // Verify the OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (verifyError) {
        setError("Invalid verification code. Please try again.");
        return;
      }

      if (data.user) {
        // Get user's full name from auth metadata
        const fullName = data.user.user_metadata?.full_name || email.split("@")[0];
        
        // Complete the profile in the database
        const profileResult = await completeUserProfile(data.user.id, email, fullName);

        if (profileResult.success) {
          setOtp("");
          // Show success message and redirect to login
          setTimeout(() => {
            router.push("/auth/login?verified=true");
          }, 1500);
        } else {
          setError("Failed to create profile. Please try again.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Email not found");
      return;
    }

    setResendLoading(true);

    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.resendOtp({
        email,
        type: "signup",
      });

      if (error) {
        setError("Failed to resend code. Please try again.");
      } else {
        setError("");
        setResendTimer(60); // 60 second cooldown
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slideIn 0.6s ease-out forwards; }
        .input-field { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .input-field:focus { box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.1), 0 0 0 1px rgba(255, 149, 0, 0.8); }
      `}</style>

      <div className="w-full max-w-md animate-slide-in">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✉️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Verify Your Email
            </h1>
            <p className="text-gray-600 mt-2">
              We've sent a 6-digit verification code to<br />
              <span className="font-semibold text-gray-900">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-in">
              <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-semibold text-gray-800 mb-2">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                disabled={loading}
                className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-500 mt-2">Enter the 6-digit code from your email</p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-gradient-to-r from-orange-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">Didn't receive the code?</p>
            <button
              onClick={handleResendOtp}
              disabled={resendLoading || resendTimer > 0}
              className="text-orange-600 hover:text-orange-700 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed transition"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/auth/register")}
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              ← Back to Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
