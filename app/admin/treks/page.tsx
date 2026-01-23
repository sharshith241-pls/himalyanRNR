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
  const [filter, setFilter] = useState("all");

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

      {/* Header */}\n      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-8 shadow-lg\">\n        <div className=\"max-w-7xl mx-auto px-4\">\n          <div className=\"flex justify-between items-center\">\n            <div>\n              <h1 className=\"text-4xl font-bold\">🏔️ Trek Management</h1>\n              <p className=\"text-teal-100 mt-2\">Manage all available treks</p>\n            </div>\n            <Link\n              href=\"/admin/treks/new\"\n              className=\"bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2\"\n            >\n              <span>➕</span>\n              Add New Trek\n            </Link>\n          </div>\n        </div>\n      </div>\n\n      {/* Content */}\n      <div className=\"max-w-7xl mx-auto px-4 py-12\">\n        {error && (\n          <div className=\"mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg\">\n            <p className=\"font-semibold\">⚠️ Error</p>\n            <p className=\"text-sm\">{error}</p>\n          </div>\n        )}\n\n        {loading ? (\n          <div className=\"flex justify-center items-center h-64\">\n            <div className=\"text-center\">\n              <div className=\"inline-block animate-spin text-4xl mb-4\">⏳</div>\n              <p className=\"text-gray-600 font-medium\">Loading treks...</p>\n            </div>\n          </div>\n        ) : treks.length === 0 ? (\n          <div className=\"bg-white rounded-lg shadow-md p-12 text-center\">\n            <div className=\"text-6xl mb-4\">🏜️</div>\n            <h3 className=\"text-2xl font-bold text-gray-800 mb-2\">No Treks Yet</h3>\n            <p className=\"text-gray-600 mb-6\">Get started by creating your first trek</p>\n            <Link\n              href=\"/admin/treks/new\"\n              className=\"inline-block bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all\"\n            >\n              Create First Trek\n            </Link>\n          </div>\n        ) : (\n          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">\n            {treks.map((trek) => (\n              <div\n                key={trek.id}\n                className=\"trek-card bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100\"\n              >\n                {/* Trek Image */}\n                <div className=\"bg-gradient-to-br from-teal-200 to-emerald-200 h-40 flex items-center justify-center\">\n                  <span className=\"text-5xl\">⛰️</span>\n                </div>\n\n                {/* Trek Info */}\n                <div className=\"p-4\">\n                  <h3 className=\"font-bold text-lg text-gray-900 mb-2 line-clamp-2\">\n                    {trek.title}\n                  </h3>\n\n                  <div className=\"space-y-2 text-sm text-gray-600 mb-4\">\n                    <div className=\"flex items-center gap-2\">\n                      <span>📍</span>\n                      <span>{trek.location}</span>\n                    </div>\n                    <div className=\"flex items-center gap-2\">\n                      <span>⏱️</span>\n                      <span>{trek.duration}</span>\n                    </div>\n                    <div className=\"flex items-center gap-2\">\n                      <span>📈</span>\n                      <span>{trek.difficulty}</span>\n                    </div>\n                    <div className=\"flex items-center gap-2\">\n                      <span>💰</span>\n                      <span className=\"font-semibold text-teal-600\">₹{trek.price}</span>\n                    </div>\n                  </div>\n\n                  {/* Actions */}\n                  <div className=\"flex gap-2\">\n                    <Link\n                      href={`/admin/treks/${trek.id}`}\n                      className=\"flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition text-center\"\n                    >\n                      ✏️ Edit\n                    </Link>\n                    <button\n                      onClick={() => deleteTrek(trek.id)}\n                      className=\"flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-600 transition\"\n                    >\n                      🗑️ Delete\n                    </button>\n                  </div>\n                </div>\n              </div>\n            ))}\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}
