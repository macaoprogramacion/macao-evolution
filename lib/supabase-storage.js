import { supabase } from './supabase';

const BUCKET = 'portfolio-media';

// Max file size for uploads (5GB — Supabase Pro plan limit)
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
// Max video duration in seconds (2 hours)
const MAX_VIDEO_DURATION = 2 * 60 * 60;
// Max image dimension (pixels) for compression
const MAX_IMAGE_DIMENSION = 2400;
// JPEG quality for compressed images
const COMPRESS_QUALITY = 0.85;

/**
 * Get video duration in seconds.
 * @param {File} file
 * @returns {Promise<number>}
 */
function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la duración del video'));
    };
    video.src = url;
  });
}

/**
 * Compress an image file using Canvas API.
 * Returns the original file if it's small enough or not an image.
 * @param {File} file
 * @returns {Promise<File>}
 */
async function compressImageIfNeeded(file) {
  // Only compress images
  if (!file.type.startsWith('image/')) return file;
  // Skip if already small enough (under 5MB)
  if (file.size < 5 * 1024 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    // Scale down if too large
    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: COMPRESS_QUALITY,
    });

    // Only use compressed version if it's actually smaller
    if (blob.size >= file.size) return file;

    const compressedName = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], compressedName, { type: 'image/jpeg' });
  } catch (err) {
    console.warn('Image compression failed, using original:', err);
    return file;
  }
}

/**
 * Upload a single file to Supabase Storage.
 * Images are auto-compressed if larger than 5MB.
 * Returns the permanent public URL.
 * @param {File} file
 * @param {string} folder
 * @param {(progress: number) => void} [onProgress] - callback with 0-100
 */
export async function uploadFileToStorage(file, folder = 'photos', onProgress) {
  // Validate video duration (max 2 hours)
  if (file.type.startsWith('video/')) {
    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_DURATION) {
        const mins = Math.round(duration / 60);
        throw new Error(`Video demasiado largo (${mins} min). Máximo: ${MAX_VIDEO_DURATION / 60} minutos`);
      }
    } catch (err) {
      if (err.message.includes('demasiado largo')) throw err;
      console.warn('No se pudo verificar duración del video:', err);
    }
  }

  // Compress large images before upload
  const processedFile = await compressImageIfNeeded(file);

  if (processedFile.size > MAX_FILE_SIZE) {
    const sizeGB = (processedFile.size / (1024 * 1024 * 1024)).toFixed(1);
    throw new Error(`Archivo muy grande (${sizeGB}GB). Máximo: ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`);
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeName = processedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
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
      xhr.setRequestHeader('Content-Type', processedFile.type || 'application/octet-stream');
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
          let msg = `Upload failed: ${xhr.status}`;
          try { msg = JSON.parse(xhr.responseText)?.message || msg; } catch {}
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error('Upload network error'));
      xhr.send(processedFile);
    });

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  // Default: use Supabase SDK (no progress)
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, processedFile, {
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
