"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

interface Trek {
  id: string;
  title: string;
  location: string;
  guide_email?: string;
}

interface Booking {
  id: string;
  trek_id: string;
  user_name: string;
  user_email: string;
  trek?: { title: string };
  created_at: string;
}

export default function GuideDashboard() {
  const router = useRouter();
  const [guideEmail, setGuideEmail] = useState("");
  const [myTreks, setMyTreks] = useState<Trek[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTrek, setSelectedTrek] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const email = localStorage.getItem("guideEmail");
    if (!email) {
      router.push("/guide/login");
      return;
    }
    setGuideEmail(email);
    fetchGuideTreks(email);
  }, [router]);

  const fetchGuideTreks = async (email: string) => {
    try {
      setLoading(true);
      if (!supabase) {
        setError("Database connection failed");
        return;
      }

      const { data: treks, error: treksError } = await supabase
        .from("treks")
        .select("*")
        .eq("guide_email", email);

      if (treksError) {
        console.error("Error fetching treks:", treksError);
        setMyTreks([]);
      } else {
        setMyTreks(treks || []);
        if (treks && treks.length > 0) {
          setSelectedTrek(treks[0].id);
        }
      }

      // Fetch all bookings for this guide's treks
      if (treks && treks.length > 0) {
        const trekIds = treks.map((t) => t.id);
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .in("trek_id", trekIds);

        if (!bookingsError) {
          setBookings(bookingsData || []);
        }
      }
    } catch (err) {
      setError("Failed to load guide data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("guideEmail");
    if (supabase) {
      supabase.auth.signOut();
    }
    router.push("/");
  };

  const selectedTrekData = myTreks.find((t) => t.id === selectedTrek);
  const selectedTrekBookings = bookings.filter((b) => b.trek_id === selectedTrek);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
              👨
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Guide Dashboard</h1>
              <p className="text-sm text-gray-600">{guideEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading guide data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : myTreks.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-blue-700 font-semibold mb-4">
              No treks assigned yet. Contact the administrator to add treks to your account.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar - Trek List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Your Treks</h2>
                <div className="space-y-2">
                  {myTreks.map((trek) => (
                    <button
                      key={trek.id}
                      onClick={() => setSelectedTrek(trek.id)}
                      className={`w-full text-left p-3 rounded-lg transition font-medium ${
                        selectedTrek === trek.id
                          ? "bg-orange-100 text-orange-700 border border-orange-300"
                          : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="truncate">{trek.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedTrek === trek.id && (
                          <span className="font-semibold text-orange-600">
                            {selectedTrekBookings.length} registrations
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {selectedTrekData && (
                <>
                  {/* Trek Info Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          {selectedTrekData.title}
                        </h2>
                        <p className="text-gray-600">
                          Location: {selectedTrekData.location}
                        </p>
                      </div>
                      <Link
                        href={`/guide/trek/${selectedTrekData.id}/manage`}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition font-semibold"
                      >
                        ✏️ Manage Trek
                      </Link>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                      <div className="text-3xl font-bold text-blue-700 mb-2">
                        {selectedTrekBookings.length}
                      </div>
                      <div className="text-blue-600 font-medium">Total Registrations</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                      <div className="text-3xl font-bold text-green-700 mb-2">
                        {selectedTrekBookings.length}
                      </div>
                      <div className="text-green-600 font-medium">Confirmed Bookings</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                      <div className="text-3xl font-bold text-purple-700 mb-2">
                        {myTreks.length}
                      </div>
                      <div className="text-purple-600 font-medium">Total Treks</div>
                    </div>
                  </div>

                  {/* Registrations Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Trek Participants
                    </h3>
                    {selectedTrekBookings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No registrations yet
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Registered Date
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTrekBookings.map((booking) => (
                              <tr
                                key={booking.id}
                                className="border-b border-gray-200 hover:bg-gray-50 transition"
                              >
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                  {booking.user_name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {booking.user_email}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {new Date(booking.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                    Confirmed
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
