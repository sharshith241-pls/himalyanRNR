"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
  estimated_expiry: string;
  notes?: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_percentage: 10,
    max_uses: null as number | null,
    notes: "",
  });

  useEffect(() => {
    // Use onAuthStateChange to securely monitor authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupon_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCoupons(data);
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userId) {
      alert("Must be logged in");
      return;
    }

    try {
      const { error } = await supabase.from("coupon_codes").insert([
        {
          code: newCoupon.code.toUpperCase(),
          discount_percentage: newCoupon.discount_percentage,
          max_uses: newCoupon.max_uses,
          notes: newCoupon.notes,
          created_by: userId,
        },
      ]);

      if (error) {
        alert(`Error: ${error.message}`);
        return;
      }

      alert("✅ Coupon created successfully!");
      setNewCoupon({ code: "", discount_percentage: 10, max_uses: null, notes: "" });
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      console.error("Error creating coupon:", err);
      alert("Failed to create coupon");
    }
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from("coupon_codes")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) {
        alert(`Error: ${error.message}`);
        return;
      }

      fetchCoupons();
    } catch (err) {
      console.error("Error updating coupon:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-teal-600 hover:underline mb-4 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-4xl font-bold mb-2">💰 Coupon Management</h1>
          <p className="text-gray-600">Create and manage discount coupons</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition"
        >
          {showForm ? "Cancel" : "+ Create New Coupon"}
        </button>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">New Coupon</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g., WELCOME10"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Discount (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newCoupon.discount_percentage}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, discount_percentage: parseFloat(e.target.value) })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Max Uses (leave blank for unlimited)</label>
                <input
                  type="number"
                  min="1"
                  value={newCoupon.max_uses || ""}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      max_uses: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Notes</label>
                <textarea
                  placeholder="Details about this coupon..."
                  value={newCoupon.notes}
                  onChange={(e) => setNewCoupon({ ...newCoupon, notes: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Create Coupon
              </button>
            </form>
          </div>
        )}

        {/* Coupons List */}
        {loading ? (
          <div className="text-center text-gray-500">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No coupons created yet</div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  coupon.is_active ? "border-green-500" : "border-red-500"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-teal-600">{coupon.code}</h3>
                    <p className="text-gray-600">{coupon.notes}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{coupon.discount_percentage}%</div>
                    <div className="text-sm text-gray-500">Discount</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-gray-600">Uses:</span>
                    <div className="font-semibold">
                      {coupon.current_uses} / {coupon.max_uses || "∞"}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className={`font-semibold ${coupon.is_active ? "text-green-600" : "text-red-600"}`}>
                      {coupon.is_active ? "✅ Active" : "❌ Inactive"}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Created: {new Date(coupon.created_at).toLocaleDateString()} | Expires:{" "}
                  {new Date(coupon.estimated_expiry).toLocaleDateString()}
                </div>

                <button
                  onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                  className={`px-4 py-2 rounded-lg text-white transition ${
                    coupon.is_active
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {coupon.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
