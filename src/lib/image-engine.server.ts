import jpeg from "jpeg-js";
import UPNG from "upng-js";

export type OutputFormat = "jpeg" | "png";

export interface RawImage {
  width: number;
  height: number;
  data: Uint8Array; // RGBA
}

export function decodeImage(bytes: Uint8Array, mimeType: string): RawImage {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    const decoded = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
    return { width: decoded.width, height: decoded.height, data: new Uint8Array(decoded.data) };
  }
  if (mimeType === "image/png") {
    const img = UPNG.decode(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    const rgba = UPNG.toRGBA8(img)[0] as ArrayBuffer;
    return { width: img.width, height: img.height, data: new Uint8Array(rgba) };
  }
  throw new Error(`Unsupported input format: ${mimeType}`);
}

/** Bilinear resize of an RGBA buffer. */
export function resizeImage(image: RawImage, targetWidth: number, targetHeight: number): RawImage {
  const { width: sw, height: sh, data: src } = image;
  if (targetWidth === sw && targetHeight === sh) return image;

  const out = new Uint8Array(targetWidth * targetHeight * 4);
  const xRatio = sw / targetWidth;
  const yRatio = sh / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    const sy = Math.min(sh - 1, (y + 0.5) * yRatio - 0.5);
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(sh - 1, y0 + 1);
    const wy = sy - y0;

    for (let x = 0; x < targetWidth; x++) {
      const sx = Math.min(sw - 1, (x + 0.5) * xRatio - 0.5);
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(sw - 1, x0 + 1);
      const wx = sx - x0;

      const i00 = (y0 * sw + x0) * 4;
      const i01 = (y0 * sw + x1) * 4;
      const i10 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;
      const o = (y * targetWidth + x) * 4;

      for (let c = 0; c < 4; c++) {
        const top = src[i00 + c]! * (1 - wx) + src[i01 + c]! * wx;
        const bottom = src[i10 + c]! * (1 - wx) + src[i11 + c]! * wx;
        out[o + c] = Math.round(top * (1 - wy) + bottom * wy);
      }
    }
  }

  return { width: targetWidth, height: targetHeight, data: out };
}

export function encodeImage(image: RawImage, format: OutputFormat, quality: number): Uint8Array {
  if (format === "jpeg") {
    const encoded = jpeg.encode(
      { data: image.data as unknown as Buffer, width: image.width, height: image.height },
      Math.min(100, Math.max(30, quality)),
    );
    return new Uint8Array(encoded.data);
  }

  // PNG: quantise when the user asked for lossy-ish quality, otherwise stay lossless.
  const colours = quality >= 90 ? 0 : quality >= 70 ? 256 : 128;
  const buf = UPNG.encode(
    [image.data.buffer.slice(image.data.byteOffset, image.data.byteOffset + image.data.byteLength) as ArrayBuffer],
    image.width,
    image.height,
    colours,
  );
  return new Uint8Array(buf);
}

export interface OptimizeOptions {
  maxWidth?: number | undefined;
  quality: number;
  format: OutputFormat;
}

export function optimizeBytes(bytes: Uint8Array, mimeType: string, options: OptimizeOptions) {
  const decoded = decodeImage(bytes, mimeType);

  let working = decoded;
  if (options.maxWidth && decoded.width > options.maxWidth) {
    const targetWidth = Math.round(options.maxWidth);
    const targetHeight = Math.max(1, Math.round((decoded.height * targetWidth) / decoded.width));
    working = resizeImage(decoded, targetWidth, targetHeight);
  }

  const output = encodeImage(working, options.format, options.quality);

  return {
    bytes: output,
    width: working.width,
    height: working.height,
    sourceWidth: decoded.width,
    sourceHeight: decoded.height,
  };
}
