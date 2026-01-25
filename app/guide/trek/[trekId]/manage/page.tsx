"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

interface Itinerary {
  id: string;
  day: number;
  title: string;
  description: string;
}

interface Trek {
  id: string;
  title: string;
  location: string;
  guide_email?: string;
  image_url?: string;
}

export default function GuideManageTrek() {
  const router = useRouter();
  const params = useParams();
  const trekId = params?.trekId as string;

  const [trek, setTrek] = useState<Trek | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [guideEmail, setGuideEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ day: 1, title: "", description: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("guideEmail");
    if (!email) {
      router.push("/guide/login");
      return;
    }
    setGuideEmail(email);
    fetchTrekData(email);
  }, [router, trekId]);

  const fetchTrekData = async (email: string) => {
    try {
      setLoading(true);
      if (!supabase || !trekId) return;

      const { data: trekData, error: trekError } = await supabase
        .from("treks")
        .select("*")
        .eq("id", trekId)
        .eq("guide_email", email)
        .single();

      if (trekError || !trekData) {
        setError("Trek not found or access denied");
        return;
      }

      setTrek(trekData);

      const { data: itineraryData, error: itineraryError } = await supabase
        .from("trek_itinerary")
        .select("*")
        .eq("trek_id", trekId)
        .order("day", { ascending: true });

      if (!itineraryError) {
        setItineraries(itineraryData || []);
      }
    } catch (err) {
      setError("Failed to load trek data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !trekId || !supabase) {
      setError("All fields are required");
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from("trek_itinerary")
        .insert([
          {
            trek_id: trekId,
            day: formData.day,
            title: formData.title,
            description: formData.description,
          },
        ])
        .select();

      if (insertError) {
        setError("Failed to add itinerary");
        return;
      }

      if (data) {
        setItineraries([...itineraries, data[0]]);
        setFormData({ day: 1, title: "", description: "" });
        setShowAddItinerary(false);
        setSuccess("Itinerary added successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Error adding itinerary");
    }
  };

  const handleDeleteItinerary = async (id: string) => {
    if (!confirm("Are you sure you want to delete this itinerary item?")) return;
    if (!supabase) {
      setError("Supabase client is not initialized");
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("trek_itinerary")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setError("Failed to delete itinerary");
        return;
      }

      setItineraries(itineraries.filter((i) => i.id !== id));
      setSuccess("Itinerary deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Error deleting itinerary");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !trekId || !supabase) return;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${trekId}-${Date.now()}.${fileExt}`;
      const filePath = `trek-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("trek-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError("Failed to upload image");
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("trek-images")
        .getPublicUrl(filePath);

      // Update trek with image URL
      const { error: updateError } = await supabase
        .from("treks")
        .update({ image_url: publicUrl.publicUrl })
        .eq("id", trekId);

      if (updateError) {
        setError("Failed to update trek image");
        return;
      }

      if (trek) {
        setTrek({ ...trek, image_url: publicUrl.publicUrl });
      }
      setSuccess("Image uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Error uploading image");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading trek data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {trek?.title || "Manage Trek"}
            </h1>
            <p className="text-sm text-gray-600">Edit itinerary and upload images</p>
          </div>
          <Link
            href="/guide/dashboard"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            {success}
          </div>
        )}

        {trek && (
          <>
            {/* Image Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Trek Image</h2>
              <div className="flex gap-6 items-start">
                <div className="flex-1">
                  {trek.image_url ? (
                    <div className="mb-4">
                      <img
                        src={trek.image_url}
                        alt={trek.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                      <span className="text-gray-400 text-6xl">🖼️</span>
                    </div>
                  )}
                  <label className="block">
                    <span className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition font-semibold cursor-pointer inline-block">
                      {uploadingImage ? "Uploading..." : "📤 Upload Image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Itinerary Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Trek Itinerary</h2>
                <button
                  onClick={() => setShowAddItinerary(!showAddItinerary)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition font-semibold"
                >
                  {showAddItinerary ? "Cancel" : "+ Add Day"}
                </button>
              </div>

              {/* Add Itinerary Form */}
              {showAddItinerary && (
                <form
                  onSubmit={handleAddItinerary}
                  className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.day}
                        onChange={(e) =>
                          setFormData({ ...formData, day: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Trek to Summit"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="Describe this day of the trek..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition font-semibold"
                  >
                    Add Itinerary
                  </button>
                </form>
              )}

              {/* Itinerary List */}
              {itineraries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No itinerary items yet. Add one to get started!
                </div>
              ) : (
                <div className="space-y-4">
                  {itineraries.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold mb-2">
                            Day {item.day}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {item.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => handleDeleteItinerary(item.id)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      <p className="text-gray-700">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
