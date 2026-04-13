import { createClient } from "@/lib/supabase/client";

export async function uploadImage(file: File, path: string) {
    const supabase = createClient();
    

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error } = await supabase.storage
    .from("provider-images")
    .upload(filePath, file);

  if (error) {
    console.error("Upload error:", error);
    throw error;
  }

  const { data } = supabase.storage
    .from("provider-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadMultipleImages(files: File[], path: string) {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const url = await uploadImage(file, path);
    uploadedUrls.push(url);
  }

  return uploadedUrls;
}