import { storagePut } from "./storage";

/**
 * Upload a photo to S3 storage
 * @param file - File buffer or base64 string
 * @param leadId - ID of the lead this photo belongs to
 * @param filename - Original filename
 * @returns Object with photo URL and key
 */
export async function uploadLeadPhoto(
  file: Buffer | string,
  leadId: number,
  filename: string
): Promise<{ url: string; key: string }> {
  // Generate unique key for the photo
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `leads/${leadId}/photos/${timestamp}-${sanitizedFilename}`;

  // Convert base64 to buffer if needed
  let buffer: Buffer;
  if (typeof file === "string") {
    // Remove data:image/...;base64, prefix if present
    const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
    buffer = Buffer.from(base64Data, "base64");
  } else {
    buffer = file;
  }

  // Upload to S3
  const result = await storagePut(key, buffer, "image/jpeg");

  return {
    url: result.url,
    key: result.key,
  };
}

/**
 * Generate thumbnail from photo (simplified - just returns original for now)
 * In production, you'd use sharp or similar to resize
 */
export async function generateThumbnail(
  photoUrl: string
): Promise<string> {
  // For now, return the original URL
  // In production, implement actual thumbnail generation
  return photoUrl;
}
