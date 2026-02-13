"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@/utils/auth/actions";
import { validateEmail } from "@/utils/auth/helpers";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", selectedRole);

      const result = await signIn(formData);

      if (result.success) {
        setSuccess("Login successful! Redirecting...");
        // Redirect based on role/approved returned from server
        const role = (result as any).role || 'user';
        const approved = (result as any).approved || false;

        setTimeout(() => {
          if (role === 'admin') {
            // Admin account — redirect to admin dashboard
            router.push('/admin/dashboard');
          } else if (role === 'guide' && approved) router.push('/guide/dashboard');
          else if (role === 'guide' && !approved) router.push('/pending-approval');
          else router.push('/');
        }, 800);
      } else {
        setError(result.error || "Login failed");
        setSuccess("");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
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
            <img src="/logo.png" alt="Himalayan Runners" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">
              Himalayan Runners
            </h1>
            <p className="text-gray-600 mt-2">Welcome back, explorer!</p>
          </div>

          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-semibold text-gray-800 mb-2">
              Sign in as
            </label>
            <select
  id="role"
  value={selectedRole}
  onChange={(e) => setSelectedRole(e.target.value)}
  disabled={loading}
  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg 
             focus:border-orange-500 focus:outline-none 
             text-gray-800 shadow-sm appearance-none"
>
  <option value="user" className="bg-white text-gray-800">
    User
  </option>
  <option value="admin" className="bg-white text-gray-800">
    Admin
  </option>
</select>

            
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-in">
              <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-slide-in">
              <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                <span>✓</span> {success}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link
              href="/auth/forgot-password"
              className="block text-sm text-orange-600 hover:text-orange-700 font-medium transition"
            >
              Forgot password?
            </Link>
            <div className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-orange-600 hover:text-orange-700 font-bold transition"
              >
                Create one now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
