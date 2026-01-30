"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

interface Booking {
  id: string;
  trek_id: string;
  user_name: string;
  user_email: string;
  payment_status: string;
  created_at: string;
  trek?: { title: string };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (!supabase) {
          setError("Supabase not configured");
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("bookings")
          .select("*, trek:trek_id(title)")
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;
        setBookings(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">📅 Booking Management</h1>
          <p className="text-teal-100 mt-2">View all trek bookings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p className="font-semibold">⚠️ Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
              <p className="text-gray-600 font-medium">Loading bookings...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Bookings Yet</h3>
            <p className="text-gray-600">Bookings will appear here when users book treks</p>
            <Link
              href="/admin/dashboard"
              className="mt-6 inline-block bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Trek</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">User Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{booking.trek?.title || booking.trek_id}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{booking.user_name}</td>
                    <td className="px-6 py-4 text-gray-700">{booking.user_email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          booking.payment_status === "completed"
                            ? "bg-green-100 text-green-800"
                            : booking.payment_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.payment_status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{new Date(booking.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
