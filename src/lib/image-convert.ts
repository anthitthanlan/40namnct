export interface WebpConvertOptions {
  /** Chất lượng nén WebP (1 - 100). Mặc định: 85 (visual lossless, tối ưu dung lượng) */
  quality?: number;
  /** Mức nỗ lực nén CPU (0 - 6). Mặc định: 4 */
  effort?: number;
  /** Chiều kích thước tối đa (px). Nếu ảnh lớn hơn sẽ thu nhỏ giữ tỉ lệ, không upscale. Mặc định: 2560px */
  maxDimension?: number;
}

/**
 * Các định dạng ảnh được hỗ trợ chuyển đổi sang WebP.
 */
export const CONVERTIBLE_IMAGE_EXTS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "tiff",
  "heic",
  "bmp",
]);

/**
 * Kiểm tra xem extension có phải là định dạng ảnh hỗ trợ chuyển đổi sang WebP không.
 */
export function isConvertibleImage(ext: string): boolean {
  return CONVERTIBLE_IMAGE_EXTS.has(ext.toLowerCase().replace(/^\./, ""));
}

/**
 * Chuyển đổi buffer ảnh bất kỳ sang định dạng WebP với các tối ưu chuẩn web.
 * An toàn cho mọi môi trường (Dynamic import sharp trong Node.js, graceful fallback nếu không khả dụng).
 */
export async function convertToWebp(
  buffer: Buffer,
  originalExt?: string,
  options: WebpConvertOptions = {}
): Promise<{ buffer: Buffer; info: Record<string, any> }> {
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default || sharpModule;
    const isGif = originalExt?.toLowerCase().replace(/^\./, "") === "gif";

    let pipeline = sharp(buffer, { animated: isGif });

    // 1. Tự động xoay theo EXIF orientation
    pipeline = pipeline.rotate();

    // 2. Giới hạn kích thước tối đa 2560px
    const maxDim = options.maxDimension ?? 2560;
    pipeline = pipeline.resize({
      width: maxDim,
      height: maxDim,
      fit: "inside",
      withoutEnlargement: true,
    });

    // 3. Xuất WebP tối ưu
    const quality = options.quality ?? 85;
    const effort = options.effort ?? 4;

    const { data, info } = await pipeline
      .webp({
        quality,
        effort,
      })
      .toBuffer({ resolveWithObject: true });

    return { buffer: data, info };
  } catch (err) {
    console.warn("[convertToWebp] sharp không khả dụng trong môi trường runtime này:", err);
    return { buffer, info: {} };
  }
}
