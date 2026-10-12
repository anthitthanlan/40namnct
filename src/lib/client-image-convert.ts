/**
 * Tiện ích chuyển đổi và tối ưu ảnh sang định dạng WebP trực tiếp trên trình duyệt Client.
 * - Hỗ trợ resize ảnh lớn về kích thước tối đa (mặc định 2560px) giữ nguyên tỉ lệ.
 * - Nén sang WebP với chất lượng 0.85 (chất lượng cao, giảm 70% - 95% dung lượng).
 * - Tự động đọc và xử lý xoay theo EXIF Orientation từ điện thoại (iOS / Android).
 * - Cho phép người dùng tải lên ảnh gốc dung lượng lớn (vd: JPG 33MB) và tính dung lượng
 *   chính xác sau khi chuyển đổi thành WebP (~1MB).
 */

export interface ClientWebpResult {
  file: File;
  originalSize: number;
  isOptimized: boolean;
}

export interface ClientWebpOptions {
  quality?: number;
  maxDimension?: number;
}

export async function convertImageToWebpClient(
  file: File,
  options: ClientWebpOptions = {}
): Promise<ClientWebpResult> {
  const originalSize = file.size;

  // Bỏ qua nếu không phải tệp ảnh
  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|bmp|heic)$/i.test(file.name);
  if (!isImage) {
    return { file, originalSize, isOptimized: false };
  }

  // Bỏ qua GIF để server sharp xử lý giữ nguyên khung hình động
  if (file.type === "image/gif" || /\.gif$/i.test(file.name)) {
    return { file, originalSize, isOptimized: false };
  }

  const quality = options.quality ?? 0.85;
  const maxDim = options.maxDimension ?? 2560;

  try {
    let imgSource: ImageBitmap | HTMLImageElement;
    let width = 0;
    let height = 0;

    // 1. Thử dùng createImageBitmap (hỗ trợ nền luồng riêng, xử lý EXIF orientation)
    if (typeof window !== "undefined" && "createImageBitmap" in window) {
      try {
        imgSource = await createImageBitmap(file, {
          imageOrientation: "from-image",
        });
        width = imgSource.width;
        height = imgSource.height;
      } catch {
        // Fallback sang HTMLImageElement nếu trình duyệt không parse được định dạng bằng createImageBitmap
        imgSource = await loadImageElement(file);
        width = imgSource.naturalWidth || imgSource.width;
        height = imgSource.naturalHeight || imgSource.height;
      }
    } else {
      imgSource = await loadImageElement(file);
      width = imgSource.naturalWidth || imgSource.width;
      height = imgSource.naturalHeight || imgSource.height;
    }

    // 2. Tính toán kích thước mới (giữ tỉ lệ aspect ratio, không phóng to ảnh nhỏ)
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    // 3. Vẽ lên Canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { file, originalSize, isOptimized: false };
    }

    ctx.drawImage(imgSource, 0, 0, width, height);

    // Giải phóng bộ nhớ ImageBitmap nếu có
    if ("close" in imgSource && typeof imgSource.close === "function") {
      imgSource.close();
    }

    // 4. Xuất Blob WebP
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", quality);
    });

    if (!blob) {
      return { file, originalSize, isOptimized: false };
    }

    // Đổi phần mở rộng thành .webp
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const webpFile = new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });

    return { file: webpFile, originalSize, isOptimized: true };
  } catch (err) {
    console.warn("[convertImageToWebpClient] Chuyển đổi WebP thất bại, dùng tệp gốc:", err);
    return { file, originalSize, isOptimized: false };
  }
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
