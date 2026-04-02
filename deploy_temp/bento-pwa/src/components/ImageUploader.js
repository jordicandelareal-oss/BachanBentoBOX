import { supabase } from '../lib/supabaseClient'

export async function compressToWebP(file, maxPx = 1080, quality = 0.82) {
  const img = await createImageBitmap(file)
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
  const canvas = new OffscreenCanvas(
    Math.round(img.width * scale),
    Math.round(img.height * scale)
  )
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality })
  return blob
}

export async function uploadRecipeImage(file, recipeId) {
  try {
    const webpBlob = await compressToWebP(file)
    const fileName = `recipes/${recipeId}-${Date.now()}.webp`

    const { data, error } = await supabase.storage
      .from('bento-images')
      .upload(fileName, webpBlob, { contentType: 'image/webp', upsert: true })

    if (error) throw error

    // Generate public URL
    const { data: publicUrlData } = supabase.storage
      .from('bento-images')
      .getPublicUrl(fileName)

    // Update recipe record with image URL
    await supabase
      .from('recipes')
      .update({ image_url: publicUrlData.publicUrl })
      .eq('id', recipeId)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}
