"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

interface Trek {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  advance_price: number;
  duration: string;
  difficulty: string;
  category: string;
  image_url: string;
  itinerary?: string;
  included?: string;
  not_included?: string;
  important_info?: string;
}

interface Itinerary {
  id?: string;
  day: number;
  title: string;
  description: string;
}

interface GuideContact {
  guide_name: string;
  guide_email: string;
  guide_phone: string;
  guide_notes: string;
}

export default function EditTrekPage() {
  const router = useRouter();
  const params = useParams();
  const trekId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [guideContact, setGuideContact] = useState<GuideContact>({ guide_name: "", guide_email: "", guide_phone: "", guide_notes: "" });

  const [formData, setFormData] = useState<Trek>({
    id: "",
    title: "",
    location: "",
    description: "",
    price: 0,
    advance_price: 0,
    duration: "",
    difficulty: "Easy",
    category: "himalayan-treks",
    image_url: "",
    itinerary: "",
    included: "",
    not_included: "",
    important_info: "",
  });

  useEffect(() => {
    const fetchTrek = async () => {
      try {
        if (!supabase) {
          setError("Supabase not configured");
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase.from("treks").select("*").eq("id", trekId).single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Trek not found");

        setFormData({ ...data, advance_price: data.advance_price || 0 });
        const { data: itineraryData, error: itineraryError } = await supabase
          .from("trek_itinerary")
          .select("id, day, title, description")
          .eq("trek_id", trekId)
          .order("day", { ascending: true });
        if (itineraryError) throw itineraryError;
        setItineraries(itineraryData || [{ day: 1, title: "", description: "" }]);
        const { data: guideData } = await supabase.from("trek_guide_contacts").select("guide_name, guide_email, guide_phone, guide_notes").eq("trek_id", trekId).maybeSingle();
        if (guideData) setGuideContact(guideData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch trek");
        setLoading(false);
      }
    };

    if (trekId) fetchTrek();
  }, [trekId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === "price" ? parseFloat(e.target.value) : e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!supabase) {
        setError("Supabase not configured");
        return;
      }

      const { id, ...trekFields } = formData;
      const { error: updateError } = await supabase.from("treks").update({ ...trekFields, itinerary: "" }).eq("id", trekId);

      if (updateError) throw updateError;

      const { error: deleteItinerariesError } = await supabase.from("trek_itinerary").delete().eq("trek_id", trekId);
      if (deleteItinerariesError) throw deleteItinerariesError;
      const itineraryRows = itineraries
        .filter((item) => item.title.trim() || item.description.trim())
        .map((item, index) => ({ trek_id: trekId, day: index + 1, title: item.title, description: item.description }));
      if (itineraryRows.length) {
        const { error: insertItinerariesError } = await supabase.from("trek_itinerary").insert(itineraryRows);
        if (insertItinerariesError) throw insertItinerariesError;
      }
      if (guideContact.guide_name.trim()) {
        const { error: guideError } = await supabase.from("trek_guide_contacts").upsert({
          trek_id: trekId,
          ...guideContact,
          guide_email: guideContact.guide_email.trim() || null,
          guide_phone: guideContact.guide_phone.trim() || null,
          guide_notes: guideContact.guide_notes.trim() || null,
        });
        if (guideError) throw guideError;
      }

      router.push("/admin/treks");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update trek");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Loading trek...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-8 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/admin/treks" className="text-teal-100 hover:text-white mb-4 inline-block">
            ← Back to Treks
          </Link>
          <h1 className="text-4xl font-bold">✏️ Edit Trek</h1>
          <p className="text-teal-100 mt-2">Update trek details</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
              <p className="font-semibold">⚠️ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Trek Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Advance Payment (₹)</label>
              <input type="number" name="advance_price" value={formData.advance_price} min="1" max={formData.price || undefined} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900" required />
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
              <h3 className="font-bold text-gray-900">Guide Contact (shown only after booking)</h3>
              <input value={guideContact.guide_name} onChange={(e) => setGuideContact({ ...guideContact, guide_name: e.target.value })} placeholder="Guide name" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900" required />
              <input type="email" value={guideContact.guide_email} onChange={(e) => setGuideContact({ ...guideContact, guide_email: e.target.value })} placeholder="Guide email" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900" />
              <input value={guideContact.guide_phone} onChange={(e) => setGuideContact({ ...guideContact, guide_phone: e.target.value })} placeholder="Guide phone" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900" />
              <textarea value={guideContact.guide_notes} onChange={(e) => setGuideContact({ ...guideContact, guide_notes: e.target.value })} placeholder="Meeting instructions or other guide notes" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
              >
                <option>Easy</option>
                <option>Moderate</option>
                <option>Difficult</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
              >
                <option value="himalayan-treks">Himalayan Treks</option>
                <option value="sunrise-treks">Sunrise Treks</option>
                <option value="backpacking">Backpacking Trips</option>
                <option value="monsoon-treks">Monsoon Treks</option>
                <option value="yatra">Yatra</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
              />
            </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-800">Day-wise Itinerary</label>
                  <button type="button" onClick={() => setItineraries([...itineraries, { day: itineraries.length + 1, title: "", description: "" }])} className="text-sm font-semibold text-teal-700">+ Add day</button>
                </div>
                <div className="space-y-4">
                  {itineraries.map((item, index) => (
                    <div key={item.id || index} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-800">Day {index + 1}</span>
                        {itineraries.length > 1 && <button type="button" onClick={() => setItineraries(itineraries.filter((_, itemIndex) => itemIndex !== index))} className="text-sm text-red-600">Remove</button>}
                      </div>
                      <input value={item.title} onChange={(e) => setItineraries(itineraries.map((current, itemIndex) => itemIndex === index ? { ...current, title: e.target.value } : current))} placeholder="Day title" className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg text-gray-900" />
                      <textarea value={item.description || ""} onChange={(e) => setItineraries(itineraries.map((current, itemIndex) => itemIndex === index ? { ...current, description: e.target.value } : current))} placeholder="Describe this day's itinerary" rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900" />
                    </div>
                  ))}
                </div>
              </div>

              {/* What's Included */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">What's Included (comma separated)</label>
                <textarea
                  name="included"
                  value={formData.included || ""}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
                />
              </div>

              {/* What's NOT Included */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">What's NOT Included (comma separated)</label>
                <textarea
                  name="not_included"
                  value={formData.not_included || ""}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
                />
              </div>

              {/* Important Information */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Important Information</label>
                <textarea
                  name="important_info"
                  value={formData.important_info || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
                />
              </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Image URL</label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href="/admin/treks"
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
