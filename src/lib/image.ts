/**
 * In-Memory Image Validator and Sanitizer
 * Enforces magic bytes verification, size boundaries, and metadata (EXIF) stripping.
 * Uploaded images are strictly processed in-memory and NEVER written to disk or logs.
 */

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Megabytes

export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageValidationResult {
  valid: boolean;
  detectedMime?: SupportedImageMime;
  error?: string;
  sanitizedBuffer?: Buffer;
}

/**
 * Validates image buffer using magic bytes signatures.
 */
export function validateImageMagicBytes(buffer: Buffer): { valid: boolean; mime?: SupportedImageMime; error?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'File buffer is too small to be a valid image' };
  }

  // Check JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mime: 'image/jpeg' };
  }

  // Check PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mime: 'image/png' };
  }

  // Check WebP: "RIFF" .... "WEBP"
  const isRiff =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (isRiff && isWebp) {
    return { valid: true, mime: 'image/webp' };
  }

  return { valid: false, error: 'Unsupported file format or invalid magic bytes. Only JPEG, PNG, and WebP are permitted.' };
}

/**
 * Strips JPEG EXIF metadata segment (APP1 / 0xFFE1) to protect user location and device privacy.
 */
export function stripExifFromJpeg(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const pieces: Buffer[] = [buffer.subarray(0, 2)]; // Start with SOI (FF D8)
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];

    // End of image (FF D9) or start of scan (FF DA)
    if (marker === 0xd9 || marker === 0xda) {
      pieces.push(buffer.subarray(offset));
      break;
    }

    if (offset + 4 > buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset + 2);

    // Marker 0xE1 is APP1 (EXIF / XMP) - Skip it!
    if (marker === 0xe1) {
      offset += 2 + segmentLength;
    } else {
      pieces.push(buffer.subarray(offset, offset + 2 + segmentLength));
      offset += 2 + segmentLength;
    }
  }

  return Buffer.concat(pieces);
}

/**
 * Validates base64 string or buffer, validates magic bytes and size, strips EXIF if JPEG.
 */
export function processAndSanitizeImage(
  input: string | Buffer,
  declaredMime?: string,
): ImageValidationResult {
  let buffer: Buffer;

  if (typeof input === 'string') {
    // Strip data URI header if present
    const cleanBase64 = input.replace(/^data:image\/[a-z]+;base64,/, '');
    buffer = Buffer.from(cleanBase64, 'base64');
  } else {
    buffer = input;
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit (${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
    };
  }

  const check = validateImageMagicBytes(buffer);
  if (!check.valid || !check.mime) {
    return {
      valid: false,
      error: check.error || 'Invalid file format.',
    };
  }

  // Verify declared MIME matches detected magic bytes if provided
  if (declaredMime && declaredMime.toLowerCase() !== check.mime) {
    return {
      valid: false,
      error: `MIME type mismatch: declared ${declaredMime} but header contains ${check.mime}`,
    };
  }

  let sanitized = buffer;
  if (check.mime === 'image/jpeg') {
    sanitized = stripExifFromJpeg(buffer);
  }

  return {
    valid: true,
    detectedMime: check.mime,
    sanitizedBuffer: sanitized,
  };
}
