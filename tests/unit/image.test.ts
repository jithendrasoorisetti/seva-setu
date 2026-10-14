import { describe, it, expect } from 'vitest';
import {
  validateImageMagicBytes,
  stripExifFromJpeg,
  processAndSanitizeImage,
  MAX_IMAGE_SIZE_BYTES,
} from '@/lib/image';

describe('Image Sanitizer & Magic Bytes Validator', () => {
  // Construct minimal valid headers
  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const validWebp = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // file size
    0x57, 0x45, 0x42, 0x50, // "WEBP"
    0x56, 0x50, 0x38, 0x20, // "VP8 "
  ]);

  it('detects valid JPEG by magic bytes', () => {
    const res = validateImageMagicBytes(validJpeg);
    expect(res.valid).toBe(true);
    expect(res.mime).toBe('image/jpeg');
  });

  it('detects valid PNG by magic bytes', () => {
    const res = validateImageMagicBytes(validPng);
    expect(res.valid).toBe(true);
    expect(res.mime).toBe('image/png');
  });

  it('detects valid WebP by magic bytes', () => {
    const res = validateImageMagicBytes(validWebp);
    expect(res.valid).toBe(true);
    expect(res.mime).toBe('image/webp');
  });

  it('rejects spoofed file (text content pretending to be image)', () => {
    const fakeFile = Buffer.from('GIF89a this is actually executable or text code');
    const res = validateImageMagicBytes(fakeFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Unsupported file format');
  });

  it('rejects files with length under 12 bytes', () => {
    const tiny = Buffer.from([0xff, 0xd8]);
    const res = validateImageMagicBytes(tiny);
    expect(res.valid).toBe(false);
  });

  it('rejects files exceeding 5MB limit', () => {
    const oversizedBuffer = Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1024);
    // write jpeg header
    oversizedBuffer[0] = 0xff;
    oversizedBuffer[1] = 0xd8;
    oversizedBuffer[2] = 0xff;
    const res = processAndSanitizeImage(oversizedBuffer);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds 5MB limit');
  });

  it('rejects MIME mismatch if client claims PNG but uploaded JPEG', () => {
    const res = processAndSanitizeImage(validJpeg, 'image/png');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('MIME type mismatch');
  });

  it('strips APP1 (EXIF) segment from JPEG buffer in memory', () => {
    // Construct JPEG with APP1 marker (FF E1, length 8) containing fake GPS data
    const jpegWithExif = Buffer.concat([
      Buffer.from([0xff, 0xd8]), // SOI
      Buffer.from([0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66]), // APP1 Exif segment
      Buffer.from([0xff, 0xda, 0x00, 0x03, 0x01]), // SOS (Start of scan)
      Buffer.from([0xff, 0xd9]), // EOI
    ]);

    const stripped = stripExifFromJpeg(jpegWithExif);
    expect(stripped.includes(Buffer.from([0xff, 0xe1]))).toBe(false);
    expect(stripped[0]).toBe(0xff);
    expect(stripped[1]).toBe(0xd8);
  });
});
