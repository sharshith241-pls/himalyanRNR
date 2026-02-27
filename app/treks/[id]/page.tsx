"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface Trek {
  id: string;
  title: string;
  location: string;
  duration: string;
  difficulty: string;
  price: number;
  original_price?: number;
  category: string;
  description?: string;
  image_url?: string;
  itinerary?: string;
  included?: string;
  not_included?: string;
  important_info?: string;
  max_participants?: number;
  starting_point?: string;
  ending_point?: string;
}

const DEMO_TREKS: Record<string, Trek> = {};
// NOTE: Demo treks removed. Only database treks are displayed.

export default function TrekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trekId = params.id as string;
  const [trek, setTrek] = useState<Trek | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (!supabase) return;
    // Use onAuthStateChange to securely monitor authentication state
    // This listener is automatically verified by Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchTrek = async () => {
      setLoading(true);
      try {
        if (DEMO_TREKS[trekId]) {
          setTrek(DEMO_TREKS[trekId]);
          setLoading(false);
          return;
        }

        if (!supabase) {
          setTrek(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("treks")
          .select("*")
          .eq("id", trekId)
          .single();

        if (error || !data) {
          setTrek(null);
        } else {
          setTrek(data);
        }
      } catch (err) {
        setTrek(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTrek();
  }, [trekId]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setSession(null);
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <p className="text-gray-600 text-lg">Loading trek details...</p>
        </div>
      </div>
    );
  }

  if (!trek) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-600 text-lg mb-6">Trek not found</p>
          <Link href="/treks" className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition">
            Back to Treks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img src="/logoo.jpeg" alt="Himalayan Runners" className="h-12 w-auto" />
          </Link>

          <div className="flex gap-6 items-center">
            <Link href="/" className="text-gray-700 hover:text-teal-600 font-medium transition">
              Home
            </Link>
            <Link href="/treks" className="text-gray-700 hover:text-teal-600 font-medium transition">
              Explore Treks
            </Link>

            {isAdmin && (
              <Link href="/admin/treks" className="text-orange-600 hover:text-orange-700 font-bold transition bg-orange-50 px-4 py-2 rounded-lg">
                🔧 Admin
              </Link>
            )}

            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:inline">{session.user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-teal-600 font-medium transition"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with Trek Image */}
      <section className="relative bg-gradient-to-br from-teal-400 to-blue-500 h-96 flex items-center justify-center overflow-hidden">
        {trek.image_url ? (
          <>
            <img
              src={trek.image_url}
              alt={trek.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </>
        ) : (
          <div className="absolute inset-0 opacity-20 text-center flex items-center justify-center text-9xl">
            ⛰️
          </div>
        )}
        <div className="relative text-center text-white max-w-4xl px-4">
          <h1 className="text-5xl md:text-6xl font-black mb-4">{trek.title}</h1>
          <p className="text-xl font-semibold">{trek.location}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "⏱️", label: "Duration", value: trek.duration },
                { icon: "📈", label: "Difficulty", value: trek.difficulty },
                { icon: "👥", label: "Max Group", value: `${trek.max_participants} people` },
                { icon: "📍", label: "Location", value: trek.location },
              ].map((stat, i) => (
                <div key={i} className="bg-gradient-to-br from-teal-50 to-blue-50 p-4 rounded-lg border-2 border-teal-200">
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <p className="text-sm font-black text-gray-900 mb-1">{stat.label}</p>
                  <p className="font-black text-lg text-teal-700">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-4xl font-black mb-4 text-gray-900">About This Trek</h2>
              <p className="text-gray-800 text-lg leading-relaxed font-medium">{trek.description}</p>
            </div>

            {/* Itinerary */}
            <div>
              <h2 className="text-4xl font-black mb-4 text-gray-900">📋 Itinerary</h2>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border-l-4 border-teal-600 border-2 border-t-0 border-r-0 border-b-0">
                <p className="text-gray-800 whitespace-pre-line leading-relaxed font-medium text-base">{trek.itinerary}</p>
              </div>
            </div>

            {/* What's Included */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-3xl font-black mb-4 text-gray-900">✅ What's Included</h2>
                <div className="space-y-3">
                  {trek.included?.split(",").map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 hover:bg-green-50 rounded transition">
                      <span className="text-2xl flex-shrink-0">✓</span>
                      <span className="text-gray-800 font-semibold text-base">{item.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-black mb-4 text-gray-900">❌ What's NOT Included</h2>
                <div className="space-y-3">
                  {trek.not_included?.split(",").map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 hover:bg-red-50 rounded transition">
                      <span className="text-2xl flex-shrink-0">✗</span>
                      <span className="text-gray-800 font-semibold text-base">{item.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">ℹ️ Important Information</h3>
              <ul className="space-y-3 text-gray-700">
                {trek.starting_point && (
                  <li>✓ Starting Point: {trek.starting_point}</li>
                )}
                {trek.ending_point && (
                  <li>✓ Ending Point: {trek.ending_point}</li>
                )}

                {trek.important_info && trek.important_info.trim() ? (
                  trek.important_info
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i}>✓ {line}</li>
                    ))
                ) : (
                  <>
                    <li>✓ Suitable for ages 10 and above</li>
                    <li>✓ Professional guides provided throughout</li>
                    <li>✓ First aid kit included</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl p-8 sticky top-24 space-y-6">
              {/* Price Section */}
              <div>
                <p className="text-gray-600 text-sm mb-2">Starting from</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-teal-600">
                    ₹{trek.price.toLocaleString("en-IN")}
                  </span>
                  {trek.original_price && (
                    <span className="text-lg text-gray-700 line-through font-semibold">
                      ₹{trek.original_price.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {trek.original_price && (
                  <p className="text-green-600 font-bold mt-2">
                    Save ₹{(trek.original_price - trek.price).toLocaleString("en-IN")}!
                  </p>
                )}
              </div>

              {/* Checkout Button */}
              <div>
                {session ? (
                  <CheckoutButton
                    trekId={trek.id}
                    trekTitle={trek.title}
                    amount={trek.price}
                    userEmail={session.user.email}
                    userName={session.user.user_metadata?.name || session.user.email}
                    onSuccess={() => {
                      alert("Booking successful! Check your email for confirmation.");
                    }}
                    onError={(error) => {
                      alert(`Booking failed: ${error}`);
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center">
                      Please log in to book this trek
                    </p>
                    <Link
                      href="/auth/login"
                      className="block w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-center py-3 rounded-lg font-bold hover:shadow-lg transition"
                    >
                      Log In to Book
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block w-full border-2 border-teal-600 text-teal-600 text-center py-3 rounded-lg font-bold hover:bg-teal-50 transition"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛡️</span>
                  <span className="text-sm text-gray-700"><strong>Secure</strong> Payment</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <span className="text-sm text-gray-700"><strong>Verified</strong> Guides</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <span className="text-sm text-gray-700"><strong>1000+</strong> Happy Trekkers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Treks Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">More Treks to Explore</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(DEMO_TREKS)
              .filter((t) => t.id !== trek.id)
              .slice(0, 3)
              .map((relatedTrek) => (
                <Link
                  key={relatedTrek.id}
                  href={`/treks/${relatedTrek.id}`}
                  className="group bg-white rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
                >
                  <div className="bg-gradient-to-br from-teal-300 to-blue-300 h-40 flex items-center justify-center">
                    <span className="text-6xl">⛰️</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-teal-600 transition">
                      {relatedTrek.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">{relatedTrek.location}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-teal-600">
                        ₹{relatedTrek.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">
                        {relatedTrek.duration}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/treks"
              className="inline-block bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition"
            >
              View All Treks
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
