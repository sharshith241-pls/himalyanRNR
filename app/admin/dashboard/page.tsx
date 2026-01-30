"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, loading } = useAdminCheck();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">🎛️ Admin Dashboard</h1>
          <p className="text-teal-100">Manage your platform and content</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Trek Management Card */}
          <Link href="/admin/treks">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border border-gray-100 transform hover:scale-105">
              <div className="text-5xl mb-4">⛰️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Trek Management</h2>
              <p className="text-gray-600 mb-4">Create, edit, and delete treks</p>
              <div className="inline-block bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 transition">
                Manage Treks →
              </div>
            </div>
          </Link>

          {/* Bookings Card */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 opacity-50 cursor-not-allowed">
            <div className="text-5xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bookings</h2>
            <p className="text-gray-600 mb-4">View and manage trek bookings</p>
            <div className="inline-block bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Coming Soon
            </div>
          </div>

          {/* Guides Card */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 opacity-50 cursor-not-allowed">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Guides</h2>
            <p className="text-gray-600 mb-4">Manage guide approvals and profiles</p>
            <div className="inline-block bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Coming Soon
            </div>
          </div>

          {/* Analytics Card */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 opacity-50 cursor-not-allowed">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
            <p className="text-gray-600 mb-4">View platform statistics and reports</p>
            <div className="inline-block bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Coming Soon
            </div>
          </div>

          {/* Users Card */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 opacity-50 cursor-not-allowed">
            <div className="text-5xl mb-4">🧑‍💼</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Users</h2>
            <p className="text-gray-600 mb-4">Manage user accounts and permissions</p>
            <div className="inline-block bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Coming Soon
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 opacity-50 cursor-not-allowed">
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-600 mb-4">Platform configuration and settings</p>
            <div className="inline-block bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Coming Soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
