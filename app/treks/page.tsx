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
}

const DEMO_TREKS: Trek[] = [
  {
    id: "1",
    title: "Kids Endurance Camp – Level 2",
    location: "KARNATAKA",
    duration: "1 day",
    difficulty: "Easy",
    price: 3099,
    original_price: 4000,
    category: "sunrise-treks",
    description: "Perfect for kids to build stamina and confidence",
  },
  {
    id: "2",
    title: "Kaiwara Betta Trek",
    location: "KARNATAKA",
    duration: "1 day",
    difficulty: "Easy",
    price: 1399,
    original_price: 1699,
    category: "sunrise-treks",
    description: "Watch the sunrise from a scenic mountain peak",
  },
  {
    id: "3",
    title: "Banasura Trek",
    location: "SOUTH INDIA",
    duration: "2 days",
    difficulty: "Easy",
    price: 5299,
    original_price: 5799,
    category: "all-treks",
    description: "Experience stunning views and serene landscapes",
  },
  {
    id: "4",
    title: "KIDS Discovery Camp Level-1",
    location: "KARNATAKA",
    duration: "2 days",
    difficulty: "Easy",
    price: 2500,
    original_price: 3200,
    category: "all-treks",
    description: "An introductory camping experience for beginners",
  },
];

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
          applyFilters(DEMO_TREKS);
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("treks")
          .select("*");

        if (queryError) {
          setTreks(DEMO_TREKS);
          applyFilters(DEMO_TREKS);
        } else if (data && data.length > 0) {
          setTreks(data);
          applyFilters(data);
        } else {
          setTreks(DEMO_TREKS);
          applyFilters(DEMO_TREKS);
        }
      } catch (err) {
        setTreks(DEMO_TREKS);
        applyFilters(DEMO_TREKS);
      } finally {
        setLoading(false);
      }
    };

    fetchTreks();
  }, []);

  const applyFilters = (treksList: Trek[]) => {
    let filtered = treksList;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((trek) =>
        trek.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trek.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((trek) => trek.difficulty === difficultyFilter);
    }

    // Sort
    if (sortBy === "price-asc") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered = filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      filtered = filtered.reverse();
    }

    setFilteredTreks(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(treks);
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
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-3xl">🏔️</span>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Himalayan Runners
              </h1>
              <p className="text-xs text-gray-600">Adventure Awaits</p>
            </div>
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">All Adventures</h1>
          <p className="text-lg opacity-90">Choose your next unforgettable journey</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">🔍 Search</h3>
                <input
                  type="text"
                  placeholder="Trek name or location..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">📊 Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    applyFilters(treks);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">📈 Difficulty</h3>
                <div className="space-y-2">
                  {["all", "Easy", "Moderate", "Difficult"].map((diff) => (
                    <label key={diff} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="difficulty"
                        value={diff}
                        checked={difficultyFilter === diff}
                        onChange={(e) => {
                          setDifficultyFilter(e.target.value);
                          applyFilters(treks);
                        }}
                        className="rounded-full"
                      />
                      <span className="text-sm font-medium">
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
                    <div className="relative bg-gradient-to-br from-teal-300 to-blue-300 h-64 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 group-hover:scale-110 transition duration-300">
                        <span className="text-8xl flex items-center justify-center h-full">⛰️</span>
                      </div>
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
                      <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-teal-600 transition">
                        {trek.title}
                      </h3>

                      <div className="space-y-3 text-sm text-gray-600 mb-6">
                        <div className="flex items-center gap-2">
                          <span>📍</span> {trek.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>⏱️</span> {trek.duration}
                        </div>
                        {trek.description && (
                          <div className="flex items-start gap-2">
                            <span>📝</span> <span className="line-clamp-2">{trek.description}</span>
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
                            <span className="text-sm text-gray-500 line-through">
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
