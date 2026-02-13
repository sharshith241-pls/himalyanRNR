"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { useAdminCheck } from "@/hooks/useAdminCheck";

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
  description?: string;
}

const DEMO_TREKS: Trek[] = [];
// NOTE: Demo treks removed. Only database treks are displayed.

const CATEGORIES = [
  { id: "all-treks", name: "All Treks", icon: "🌍" },
  { id: "sunrise-treks", name: "Sunrise Treks", icon: "🌅" },
  { id: "backpacking", name: "Backpacking Trips", icon: "🎒" },
  { id: "himalayan-treks", name: "Himalayan Treks", icon: "⛰️" },
  { id: "monsoon-treks", name: "Monsoon Treks", icon: "🌧️" },
  { id: "yatra", name: "Yatra", icon: "🚴" },
];

export default function HomePage() {
  const [treks, setTreks] = useState<Trek[]>(DEMO_TREKS);
  const [filteredTreks, setFilteredTreks] = useState<Trek[]>(DEMO_TREKS);
  const [selectedCategory, setSelectedCategory] = useState("all-treks");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    const getSession = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        setSession(data?.session);
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    const fetchTreks = async () => {
      setLoading(true);
      try {
        if (!supabase) {
          setTreks(DEMO_TREKS);
          filterTreks(DEMO_TREKS, "all-treks");
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("treks")
          .select("*");

        if (queryError) {
          setTreks(DEMO_TREKS);
          filterTreks(DEMO_TREKS, "all-treks");
        } else if (data && data.length > 0) {
          setTreks(data);
          filterTreks(data, "all-treks");
        } else {
          setTreks(DEMO_TREKS);
          filterTreks(DEMO_TREKS, "all-treks");
        }
      } catch (err) {
        setTreks(DEMO_TREKS);
        filterTreks(DEMO_TREKS, "all-treks");
      } finally {
        setLoading(false);
      }
    };

    fetchTreks();
  }, []);

  const filterTreks = (treksList: Trek[], category: string) => {
    if (category === "all-treks") {
      setFilteredTreks(treksList);
    } else {
      setFilteredTreks(treksList.filter((trek) => trek.category === category));
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    filterTreks(treks, categoryId);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setSession(null);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .animate-slide-in { animation: slideInLeft 0.8s ease-out forwards; }
      `}</style>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition">
            <img 
              src="/logoo.jpeg" 
              alt="Himalayan Runners Logo" 
              className="h-12 w-auto"
            />
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

            {/* Guide Portal link removed from landing page header */}

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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:60px_60px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="animate-fade-in space-y-6">
            <h2 className="text-5xl md:text-7xl font-black text-white drop-shadow-lg">
              Explore the Himalayas
            </h2>
            <p className="text-2xl text-white max-w-2xl mx-auto font-bold drop-shadow-md">
              Discover breathtaking mountain trails, connect with nature, and create unforgettable memories with Himalayan Runners
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/treks"
                className="bg-white text-teal-600 px-8 py-4 rounded-lg font-bold hover:shadow-2xl transition transform hover:scale-105"
              >
                Start Exploring
              </Link>
              <Link
                href="#treks"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-teal-600 transition"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-4xl font-black text-center mb-12 text-gray-900">Why Choose Himalayan Runners?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🏆", title: "Expert Guides", desc: "Experienced mountain guides with years of expertise" },
              { icon: "🛡️", title: "Safe & Secure", desc: "Top-notch safety equipment and protocols" },
              { icon: "👥", title: "Community", desc: "Join thousands of adventure enthusiasts" },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1 border-t-4 border-teal-600">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h4 className="text-2xl font-black mb-3 text-gray-900">{feature.title}</h4>
                <p className="text-gray-700 font-medium text-base leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section id="treks" className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-black text-center mb-12 text-gray-900">Explore by Category</h2>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-6 py-3 rounded-full font-semibold transition transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-teal-500"
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>

          {/* Treks Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading amazing treks...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTreks.map((trek) => (
                <Link
                  key={trek.id}
                  href={`/treks/${trek.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition transform hover:-translate-y-2"
                >
                  {/* Image */}
                  <div className="relative bg-gradient-to-br from-teal-300 to-blue-300 h-48 flex items-center justify-center overflow-hidden">
                    {trek.image_url ? (
                      <img
                        src={trek.image_url}
                        alt={trek.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 group-hover:scale-110 transition duration-300">
                        <span className="text-6xl flex items-center justify-center h-full">⛰️</span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                      {trek.category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-black text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-teal-600 transition leading-tight">
                      {trek.title}
                    </h3>

                    <div className="space-y-2 text-base text-gray-700 mb-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span>📍</span> <span className="font-bold text-gray-900">{trek.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⏱️</span> <span className="font-bold text-gray-900">{trek.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📈</span> <span className="font-bold text-gray-900">{trek.difficulty}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl font-bold text-teal-600">
                        ₹{trek.price.toLocaleString("en-IN")}
                      </span>
                      {trek.original_price && (
                        <span className="text-sm text-gray-700 line-through font-semibold">
                          ₹{trek.original_price.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    <button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2 rounded-lg group-hover:shadow-lg transition font-semibold">
                      View Details
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black mb-4">Ready for Your Adventure?</h2>
          <p className="text-xl mb-8 font-semibold">Join thousands of trekkers who have experienced the magic of the Himalayas</p>
          <Link
            href="/treks"
            className="inline-block bg-white text-teal-600 px-8 py-4 rounded-lg font-bold hover:shadow-2xl transition transform hover:scale-105"
          >
            Explore All Treks
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-black mb-4 text-lg">Himalayan Runners</h4>
              <p className="text-sm text-gray-200">Your gateway to unforgettable mountain adventures.</p>
            </div>
            <div>
              <h4 className="text-white font-black mb-4 text-lg">Quick Links</h4>
              <ul className="text-sm space-y-2">
                <li><Link href="/treks" className="text-gray-200 hover:text-white transition font-medium">All Treks</Link></li>
                <li><Link href="/auth/login" className="text-gray-200 hover:text-white transition font-medium">Login</Link></li>
                <li><Link href="/auth/register" className="text-gray-200 hover:text-white transition font-medium">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black mb-4 text-lg">Contact</h4>
              <p className="text-sm text-gray-200">Email: ranamadan295@gmail.com</p>
              <p className="text-sm text-gray-200">Phone: +91-9410559511</p>
            </div>
            <div>
              <h4 className="text-white font-black mb-4 text-lg">Follow Us</h4>
              <div className="flex gap-4">
                <a 
                  href="https://www.facebook.com/1508234205942047" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition transform hover:scale-110"
                  title="Follow us on Facebook"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5c-.563-.074-2.324-.216-4.495-.216-4.814 0-7.115 2.993-7.115 8.499v2.817z" />
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/himalayanrunners" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 hover:shadow-lg rounded-full flex items-center justify-center transition transform hover:scale-110"
                  title="Follow us on Instagram"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.69.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2025 Himalayan Runners. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
