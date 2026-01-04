import { storagePut } from "./storage";

/**
 * Upload a document to S3 storage
 * @param file - File buffer or base64 string
 * @param leadId - ID of the lead this document belongs to
 * @param filename - Original filename
 * @param fileType - MIME type or file extension
 * @returns Object with document URL and key
 */
export async function uploadLeadDocument(
  file: Buffer | string,
  leadId: number,
  filename: string,
  fileType: string
): Promise<{ url: string; key: string }> {
  // Generate unique key for the document
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `leads/${leadId}/documents/${timestamp}-${sanitizedFilename}`;

  // Convert base64 to buffer if needed
  let buffer: Buffer;
  if (typeof file === "string") {
    // Remove data:...;base64, prefix if present
    const base64Data = file.replace(/^data:[^;]+;base64,/, "");
    buffer = Buffer.from(base64Data, "base64");
  } else {
    buffer = file;
  }

  // Determine content type
  const contentType = getContentType(fileType, filename);

  // Upload to S3
  const result = await storagePut(key, buffer, contentType);

  return {
    url: result.url,
    key: result.key,
  };
}

/**
 * Get content type from file type or filename
 */
function getContentType(fileType: string, filename: string): string {
  // If fileType is already a MIME type, use it
  if (fileType.includes("/")) {
    return fileType;
  }

  // Otherwise, determine from extension
  const ext = fileType.toLowerCase() || filename.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    txt: "text/plain",
    csv: "text/csv",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}
