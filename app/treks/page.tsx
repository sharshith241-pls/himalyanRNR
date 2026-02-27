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
  category: string;
  description?: string;
  image_url?: string;
}

const DEMO_TREKS: Trek[] = [];
// NOTE: Demo treks removed. Only database treks are displayed.

const DIFFICULTY_COLORS: Record<string, string> = {
  "Easy": "bg-green-100 text-green-800",
  "Moderate": "bg-yellow-100 text-yellow-800",
  "Difficult": "bg-red-100 text-red-800",
};

export default function TreksPage() {
  const [treks, setTreks] = useState<Trek[]>(DEMO_TREKS);
  const [filteredTreks, setFilteredTreks] = useState<Trek[]>(DEMO_TREKS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
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
    const fetchTreks = async () => {
      setLoading(true);
      try {
        if (!supabase) {
          setTreks(DEMO_TREKS);
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("treks")
          .select("*");

        if (queryError) {
          setTreks(DEMO_TREKS);
        } else if (data && data.length > 0) {
          setTreks(data);
        } else {
          setTreks(DEMO_TREKS);
        }
      } catch (err) {
        setTreks(DEMO_TREKS);
      } finally {
        setLoading(false);
      }
    };

    fetchTreks();
  }, []);

  const applyFilters = (treksList: Trek[], search: string, sort: string, difficulty: string) => {
    let filtered = treksList;

    // Search filter
    if (search) {
      filtered = filtered.filter((trek) =>
        trek.title.toLowerCase().includes(search.toLowerCase()) ||
        trek.location.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Difficulty filter
    if (difficulty !== "all") {
      filtered = filtered.filter((trek) => trek.difficulty === difficulty);
    }

    // Sort - create a copy to avoid mutating the original array
    filtered = [...filtered];
    if (sort === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      filtered.reverse();
    }

    setFilteredTreks(filtered);
  };

  // Re-apply filters whenever searchQuery, sortBy, or difficultyFilter change
  useEffect(() => {
    applyFilters(treks, searchQuery, sortBy, difficultyFilter);
  }, [searchQuery, sortBy, difficultyFilter, treks]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
            <Link href="/treks" className="text-teal-600 hover:text-teal-700 font-bold transition">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">All Adventures</h1>
          <p className="text-xl font-semibold">Choose your next unforgettable journey</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 space-y-6">
              <div>
                <h3 className="font-black text-xl mb-4 text-gray-900">🔍 Search</h3>
                <input
                  type="text"
                  placeholder="Trek name or location..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <h3 className="font-black text-xl mb-4 text-gray-900">📊 Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-semibold text-gray-900 bg-white cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              <div>
                <h3 className="font-black text-xl mb-4 text-gray-900">📈 Difficulty</h3>
                <div className="space-y-3">
                  {["all", "Easy", "Moderate", "Difficult"].map((diff) => (
                    <label key={diff} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                      <input
                        type="radio"
                        name="difficulty"
                        value={diff}
                        checked={difficultyFilter === diff}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="rounded-full w-5 h-5 cursor-pointer"
                      />
                      <span className="text-base font-bold text-gray-900">
                        {diff === "all" ? "All Levels" : diff}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Treks Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Loading treks...</p>
              </div>
            ) : filteredTreks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-600 text-lg">No treks found matching your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTreks.map((trek) => (
                  <Link
                    key={trek.id}
                    href={`/treks/${trek.id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative bg-gradient-to-br from-teal-300 to-blue-300 h-64 flex items-center justify-center overflow-hidden group">
                      {trek.image_url ? (
                        <div className="absolute inset-0 group-hover:scale-110 transition duration-300">
                          <img
                            src={trek.image_url}
                            alt={trek.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 group-hover:scale-110 transition duration-300">
                          <span className="text-8xl flex items-center justify-center h-full">⛰️</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 right-4 flex justify-between gap-2 z-10">
                        <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {trek.category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </span>
                        <span className={`${DIFFICULTY_COLORS[trek.difficulty]} px-3 py-1 rounded-full text-xs font-bold`}>
                          {trek.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6">
                      <h3 className="font-black text-2xl text-gray-900 mb-4 line-clamp-2 group-hover:text-teal-600 transition leading-tight">
                        {trek.title}
                      </h3>

                      <div className="space-y-3 text-base text-gray-700 mb-6 font-medium">
                        <div className="flex items-center gap-2">
                          <span>📍</span> <span className="font-bold text-gray-900">{trek.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>⏱️</span> <span className="font-bold text-gray-900">{trek.duration}</span>
                        </div>
                        {trek.description && (
                          <div className="flex items-start gap-2">
                            <span>📝</span> <span className="line-clamp-2 text-gray-700 font-medium">{trek.description}</span>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-teal-600">
                            ₹{trek.price.toLocaleString("en-IN")}
                          </span>
                          {trek.original_price && (
                            <span className="text-sm text-gray-700 line-through font-semibold">
                              ₹{trek.original_price.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        <button className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-semibold">
                          Book Now
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
