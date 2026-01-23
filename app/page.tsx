"use client";

import { useEffect, useState } from "react";
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
    image_url: "/trek1.jpg",
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
    image_url: "/trek2.jpg",
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
    image_url: "/trek3.jpg",
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
    image_url: "/trek4.jpg",
  },
];

const CATEGORIES = [
  { id: "all-treks", name: "All Treks", icon: "🌍" },
  { id: "sunrise-treks", name: "Sunrise Treks", icon: "🌅" },
  { id: "backpacking", name: "Backpacking Trips", icon: "🎒" },
  { id: "himalayan", name: "Himalayan Treks", icon: "⛰️" },
  { id: "monsoon", name: "Monsoon Treks", icon: "🌧️" },
  { id: "yatra", name: "Yatra", icon: "🚴" },
];

export default function HomePage() {
  const [treks, setTreks] = useState<Trek[]>(DEMO_TREKS);
  const [filteredTreks, setFilteredTreks] = useState<Trek[]>(DEMO_TREKS);
  const [selectedCategory, setSelectedCategory] = useState("all-treks");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreks = async () => {
      setLoading(true);
      try {
        if (!supabase) {
          console.log("Using demo data - Supabase not configured");
          setTreks(DEMO_TREKS);
          filterTreks(DEMO_TREKS, "all-treks");
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("treks")
          .select("*");

        if (queryError) {
          console.log("Supabase query error, using demo data:", queryError);
          setTreks(DEMO_TREKS);
          filterTreks(DEMO_TREKS, "all-treks");
        } else if (data && data.length > 0) {
          setTreks(data);
          filterTreks(data, "all-treks");
        } else {
          console.log("No data from Supabase, using demo data");
          setTreks(DEMO_TREKS);
          filterTreks(DEMO_TREKS, "all-treks");
        }
      } catch (err) {
        console.error("Error fetching treks:", err);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-teal-600">🏔️</h1>
            <h1 className="text-2xl font-bold text-gray-900">Himalayan Runners</h1>
          </div>
          <div className="flex gap-8 items-center">
            <Link href="/" className="text-gray-700 hover:text-teal-600">
              Home
            </Link>
            <Link href="/treks" className="text-gray-700 hover:text-teal-600">
              Treks
            </Link>
            <Link
              href="/auth/login"
              className="text-gray-700 hover:text-teal-600"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Explore Treks by Category
          </h2>
          <p className="text-gray-600 mb-8">
            Find your next adventure based on what you love.
          </p>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  selectedCategory === category.id
                    ? "bg-teal-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-teal-600"
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Treks Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading treks...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTreks.map((trek) => (
              <Link
                key={trek.id}
                href={`/treks/${trek.id}`}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
              >
                {/* Trek Image */}
                <div className="relative bg-gradient-to-br from-teal-200 to-blue-200 h-48 flex items-center justify-center">
                  <div className="absolute top-3 left-3 bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {trek.category
                      .split("-")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </div>
                  <span className="text-6xl">🏔️</span>
                </div>

                {/* Trek Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
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
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-teal-600">
                      ₹{trek.price}
                    </span>
                    {trek.original_price && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{trek.original_price}
                      </span>
                    )}
                  </div>

                  <button className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition font-medium">
                    Enquire Now
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 Himalayan Runners. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
