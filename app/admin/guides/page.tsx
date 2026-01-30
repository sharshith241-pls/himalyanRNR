"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

interface Guide {
  id: string;
  email: string;
  full_name: string;
  approved: boolean;
  created_at: string;
}

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        if (!supabase) {
          setError("Supabase not configured");
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "guide")
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;
        setGuides(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch guides");
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const approveGuide = async (guideId: string) => {
    setApprovingId(guideId);
    try {
      if (!supabase) {
        setError("Supabase not configured");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ approved: true })
        .eq("id", guideId);

      if (updateError) throw updateError;

      setGuides(guides.map((g) => (g.id === guideId ? { ...g, approved: true } : g)));
    } catch (err: any) {
      setError(err.message || "Failed to approve guide");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">👨‍🏫 Guide Management</h1>
          <p className="text-teal-100 mt-2">Manage and approve trek guides</p>
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
              <p className="text-gray-600 font-medium">Loading guides...</p>
            </div>
          </div>
        ) : guides.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Guides Yet</h3>
            <p className="text-gray-600">Guides will appear here when they register</p>
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
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Registered</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guides.map((guide) => (
                  <tr key={guide.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{guide.full_name || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{guide.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          guide.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {guide.approved ? "✅ Approved" : "⏳ Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{new Date(guide.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {!guide.approved && (
                        <button
                          onClick={() => approveGuide(guide.id)}
                          disabled={approvingId === guide.id}
                          className="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          {approvingId === guide.id ? "Approving..." : "Approve"}
                        </button>
                      )}
                    </td>
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
