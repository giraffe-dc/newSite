/** Спільна валідація медіа: використовується і для локального upload,
 *  і для підтвердження завантаження напряму в хмарне сховище. */

export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export type MediaStorage = "mongo" | "cloudinary";

/** Дозволені типи: ключ — MIME, значення — перевірка сигнатури (magic bytes). */
const CHECKS: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/gif": (b) =>
    b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  "image/webp": (b) =>
    b.length > 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50,
  "image/avif": (b) =>
    b.length > 12 &&
    b[4] === 0x66 &&
    b[5] === 0x74 &&
    b[6] === 0x79 &&
    b[7] === 0x70,
  "image/svg+xml": () => false, // SVG заборонено (вбудований скрипт)
};

export const ALLOWED_IMAGE_TYPES = Object.keys(CHECKS).filter(
  (type) => type !== "image/svg+xml",
);

export function magicBytesMatch(mime: string, bytes: Uint8Array): boolean {
  return CHECKS[mime.toLowerCase()]?.(bytes) === true;
}

/** Формат Cloudinary → MIME. Повертає null для непідтримуваних форматів. */
export function mimeFromFormat(format: string): string | null {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
  };
  return map[format.toLowerCase()] ?? null;
}

/** Розширення для `allowed_formats` у Cloudinary (без крапки). */
export const ALLOWED_CLOUDINARY_FORMATS = ["jpg", "png", "gif", "webp", "avif"];
