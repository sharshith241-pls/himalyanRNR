"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

export default function HomePage() {
  const [treks, setTreks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTreks = async () => {
      const { data, error } = await supabase
        .from("treks")
        .select("*");

      if (error) {
        setError(error.message);
      } else {
        setTreks(data || []);
      }

      setLoading(false);
    };

    fetchTreks();
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Himalayan Runners</h1>

      <ul>
        <li><Link href="/treks">Explore Treks</Link></li>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/register">Register</Link></li>
      </ul>

      <hr />

      <h2>Treks from Supabase</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <pre>{JSON.stringify(treks, null, 2)}</pre>
      )}
    </main>
  );
}
