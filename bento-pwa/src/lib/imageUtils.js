import { supabase } from './supabaseClient';

/**
 * Compresses and resizes an image to a maximum dimension of 1024px.
 * @param {File} file - The image file to compress.
 * @returns {Promise<Blob>} - The compressed image as a Blob.
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8); // 80% quality
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/**
 * Uploads an image to Supabase Storage and returns the public URL.
 * @param {Blob|File} imageBlob - The image to upload.
 * @param {string} bucketName - The name of the bucket (default: 'images').
 * @param {string} folder - Optional folder path.
 * @returns {Promise<string>} - The public URL of the uploaded image.
 */
export async function uploadImage(imageBlob, bucketName = 'images', folder = 'ingredients') {
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, imageBlob, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Converts a Blob to a Base64 string.
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
