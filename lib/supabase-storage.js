import { supabase } from './supabase';

const BUCKET = 'portfolio-media';

/**
 * Upload a single file to Supabase Storage.
 * Returns the permanent public URL.
 */
export async function uploadFileToStorage(file, folder = 'photos') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${folder}/${timestamp}-${random}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Upload multiple files in parallel.
 * Returns an array of permanent public URLs.
 */
export async function uploadMultipleFiles(files, folder = 'photos') {
  return Promise.all(files.map(file => uploadFileToStorage(file, folder)));
}
