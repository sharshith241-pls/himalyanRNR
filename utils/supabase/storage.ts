import { supabase } from "./client";

export const uploadTrekImage = async (file: File, trekTitle: string) => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Generate a unique filename
  const timestamp = Date.now();
  const sanitizedTitle = trekTitle.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const filename = `${sanitizedTitle}-${timestamp}-${Math.random().toString(36).substr(2, 9)}.${file.name.split(".").pop()}`;
  const filepath = `trek-images/${filename}`;

  try {
    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from("trek-images")
      .upload(filepath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("trek-images")
      .getPublicUrl(filepath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const deleteTrekImage = async (imageUrl: string) => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    // Extract filepath from URL
    const urlParts = imageUrl.split("/");
    const filepath = `trek-images/${urlParts[urlParts.length - 1]}`;

    const { error } = await supabase.storage
      .from("trek-images")
      .remove([filepath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};
