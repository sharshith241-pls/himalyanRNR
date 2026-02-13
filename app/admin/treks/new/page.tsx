"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { uploadTrekImage } from "@/utils/supabase/storage";
import Link from "next/link";
import Image from "next/image";

export default function NewTrekPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    description: "",
    price: "",
    duration: "",
    difficulty: "Easy",
    category: "himalayan-treks",
    image_url: "",
    itinerary: "",
    included: "",
    not_included: "",
    important_info: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setError("");

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!supabase) {
        setError("Supabase not configured");
        return;
      }

      // Validate required fields
      if (!formData.title || !formData.location || !formData.price) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Validate image is selected
      if (!selectedFile) {
        setError("Please select an image for the trek");
        setLoading(false);
        return;
      }

      // Upload image
      setUploadingImage(true);
      let imageUrl = "";
      try {
        imageUrl = await uploadTrekImage(selectedFile, formData.title);
      } catch (uploadError: any) {
        setError(`Image upload failed: ${uploadError.message}`);
        setLoading(false);
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to create a trek");
        setLoading(false);
        return;
      }

      const { data, error: insertError } = await supabase.from("treks").insert([
        {
          title: formData.title,
          location: formData.location,
          description: formData.description,
          price: parseFloat(formData.price),
          duration: formData.duration,
          difficulty: formData.difficulty,
          category: formData.category,
          image_url: imageUrl,
          guide_id: user.id,
          itinerary: formData.itinerary,
          included: formData.included,
          not_included: formData.not_included,
          important_info: formData.important_info,
        },
      ]);

      if (insertError) throw insertError;

      router.push("/admin/treks");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create trek");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-8 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/admin/treks" className="text-teal-100 hover:text-white mb-4 inline-block">
            ← Back to Treks
          </Link>
          <h1 className="text-4xl font-bold">➕ Create New Trek</h1>
          <p className="text-teal-100 mt-2">Add a new trek to the platform</p>
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
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Trek Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Sunrise Trek"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500
text-gray-900
    placeholder-opacity-100"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Himalayas"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-gray-900 
                 placeholder-gray-500
    placeholder-opacity-100"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 5000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500
text-gray-900
    placeholder-opacity-100"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g., 2 days"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500
text-gray-900
    placeholder-opacity-100"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500
text-gray-900
    placeholder-opacity-100"
              >
                <option>Easy</option>
                <option>Moderate</option>
                <option>Difficult</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500
text-gray-900
    placeholder-opacity-100"
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
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this trek..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500
text-gray-900
    placeholder-opacity-100"
              />
            </div>

              {/* Itinerary */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Itinerary
                </label>
                <textarea
                  name="itinerary"
                  value={formData.itinerary}
                  onChange={handleChange}
                  placeholder="Day 1: ...\nDay 2: ..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500 text-gray-900 placeholder-opacity-100"
                />
              </div>

              {/* What's Included */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  What's Included (comma separated)
                </label>
                <textarea
                  name="included"
                  value={formData.included}
                  onChange={handleChange}
                  placeholder="Breakfast, Transport, Guide"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500 text-gray-900 placeholder-opacity-100"
                />
              </div>

              {/* What's NOT Included */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  What's NOT Included (comma separated)
                </label>
                <textarea
                  name="not_included"
                  value={formData.not_included}
                  onChange={handleChange}
                  placeholder="Personal expenses, Extra meals"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500 text-gray-900 placeholder-opacity-100"
                />
              </div>

              {/* Important Information */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Important Information
                </label>
                <textarea
                  name="important_info"
                  value={formData.important_info}
                  onChange={handleChange}
                  placeholder="Suitable for ages 10 and above..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none placeholder-gray-500 text-gray-900 placeholder-opacity-100"
                />
              </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Trek Image *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  required
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setImagePreview(null);
                          setSelectedFile(null);
                          const input = document.getElementById("image-upload") as HTMLInputElement;
                          if (input) input.value = "";
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Image
                      </button>
                      <p className="text-sm text-gray-600">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📷</div>
                      <p className="text-gray-600 font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading || uploadingImage ? `${uploadingImage ? "Uploading Image..." : "Creating..."}` : "Create Trek"}
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
