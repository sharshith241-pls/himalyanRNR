"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

interface AdminStats {
  totalTreks: number;
  totalBookings: number;
  totalGuides: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalTreks: 0,
    totalBookings: 0,
    totalGuides: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!supabase) {
          setError("Supabase not configured");
          setLoading(false);
          return;
        }

        const [treks, bookings, guides, users] = await Promise.all([
          supabase.from("treks").select("id", { count: "exact", head: true }),
          supabase.from("bookings").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "guide"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
        ]);

        setStats({
          totalTreks: treks.count || 0,
          totalBookings: bookings.count || 0,
          totalGuides: guides.count || 0,
          totalUsers: users.count || 0,
        });
      } catch (err: any) {
        setError(err.message || "Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">📊 Admin Dashboard</h1>
          <p className="text-teal-100 mt-2">Welcome to the Himalayan Runner Admin Portal</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p className="font-semibold">⚠️ Error: {error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Treks</p>
                <p className="text-3xl font-bold text-teal-600 mt-2">{stats.totalTreks}</p>
              </div>
              <div className="text-4xl">🏔️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.totalBookings}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Guides</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalGuides}</p>
              </div>
              <div className="text-4xl">👨‍🏫</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/treks"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer border-l-4 border-teal-600"
          >
            <div className="text-4xl mb-4">🏔️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Treks</h3>
            <p className="text-gray-600">Add, edit, or delete treks from the platform</p>
            <div className="mt-4 text-teal-600 font-semibold">View Treks →</div>
          </Link>

          <Link
            href="/admin/bookings"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer border-l-4 border-emerald-600"
          >
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">View Bookings</h3>
            <p className="text-gray-600">Monitor and manage all trek bookings</p>
            <div className="mt-4 text-emerald-600 font-semibold">View Bookings →</div>
          </Link>

          <Link
            href="/admin/guides"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer border-l-4 border-blue-600"
          >
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Guides</h3>
            <p className="text-gray-600">Manage guide profiles and assignments</p>
            <div className="mt-4 text-blue-600 font-semibold">View Guides →</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
