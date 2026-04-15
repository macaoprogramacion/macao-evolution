import { supabase } from './supabase';

const BUCKET = 'portfolio-media';

/**
 * Upload a single file to Supabase Storage.
 * Returns the permanent public URL.
 * @param {File} file
 * @param {string} folder
 * @param {(progress: number) => void} [onProgress] - callback with 0-100
 */
export async function uploadFileToStorage(file, folder = 'photos', onProgress) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${folder}/${timestamp}-${random}-${safeName}`;

  // Use XHR for progress tracking if callback provided
  if (onProgress) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const url = `${supabaseUrl}/storage/v1/object/${BUCKET}/${filePath}`;

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
      xhr.setRequestHeader('apikey', supabaseKey);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('cache-control', 'max-age=3600');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      xhr.onerror = () => reject(new Error('Upload network error'));
      xhr.send(file);
    });

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  // Default: use Supabase SDK (no progress)
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
 * Upload multiple files with overall progress tracking.
 * @param {File[]} files
 * @param {string} folder
 * @param {(progress: number) => void} [onProgress] - callback with 0-100 for overall progress
 * @returns {Promise<string[]>} array of public URLs
 */
export async function uploadMultipleFiles(files, folder = 'photos', onProgress) {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const fileWeight = 1 / files.length;
    const baseProgress = (i / files.length) * 100;

    const url = await uploadFileToStorage(files[i], folder, onProgress ? (fileProgress) => {
      const overall = baseProgress + (fileProgress * fileWeight);
      onProgress(Math.round(overall));
    } : undefined);

    urls.push(url);
  }
  if (onProgress) onProgress(100);
  return urls;
}
