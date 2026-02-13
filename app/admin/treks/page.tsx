"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

interface Trek {
  id: string;
  title: string;
  location: string;
  duration: string;
  difficulty: string;
  price: number;
  original_price?: number;
  image_url?: string;
  category: string;
}

export default function AdminTreksPage() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreks = async () => {
      try {
        if (!supabase) {
          setError("Supabase not configured");
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("treks")
          .select("*");

        if (queryError) throw queryError;
        setTreks(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch treks");
      } finally {
        setLoading(false);
      }
    };

    fetchTreks();
  }, []);

  const deleteTrek = async (id: string) => {
    if (!supabase || !confirm("Are you sure you want to delete this trek?")) return;

    try {
      const { error } = await supabase.from("treks").delete().eq("id", id);
      if (error) throw error;
      setTreks(treks.filter((trek) => trek.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .trek-card {
          animation: slideIn 0.4s ease-out forwards;
        }
      `}</style>

      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">🏔️ Trek Management</h1>
              <p className="text-teal-100 mt-2">Manage all available treks</p>
            </div>
            <Link
              href="/admin/treks/new"
              className="bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <span>➕</span>
              Add New Trek
            </Link>
          </div>
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
              <p className="text-gray-600 font-medium">Loading treks...</p>
            </div>
          </div>
        ) : treks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🏜️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Treks Yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first trek</p>
            <Link
              href="/admin/treks/new"
              className="inline-block bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Create First Trek
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treks.map((trek) => (
              <div
                key={trek.id}
                className="trek-card bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="relative h-40 flex items-center justify-center overflow-hidden">
                  {trek.image_url ? (
                    <img
                      src={trek.image_url}
                      alt={trek.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-teal-200 to-emerald-200 w-full h-full flex items-center justify-center">
                      <span className="text-5xl">⛰️</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                    {trek.title}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{trek.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⏱️</span>
                      <span>{trek.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📈</span>
                      <span>{trek.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💰</span>
                      <span className="font-semibold text-teal-600">₹{trek.price}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/treks/${trek.id}`}
                      className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition text-center"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={() => deleteTrek(trek.id)}
                      className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-600 transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
