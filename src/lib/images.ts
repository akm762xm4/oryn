// Utility to generate a small Cloudinary thumbnail URL when possible
// Falls back to original URL for non-Cloudinary links

export function getCloudinaryThumbUrl(
  url: string | undefined,
  options?: { width?: number; height?: number }
): string | undefined {
  if (!url) return url;
  try {
    const { width = 80, height = 80 } = options || {};
    // Cloudinary URLs contain '/upload/' segment; insert transformation after it
    const uploadMarker = "/upload/";
    const idx = url.indexOf(uploadMarker);
    if (idx === -1) return url;
    const prefix = url.slice(0, idx + uploadMarker.length);
    const suffix = url.slice(idx + uploadMarker.length);
    const transformation = `c_thumb,w_${width},h_${height},q_auto,f_auto`;
    return `${prefix}${transformation}/${suffix}`;
  } catch {
    return url;
  }
}
