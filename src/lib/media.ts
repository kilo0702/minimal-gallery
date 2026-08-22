import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

/**
 * Checks if a URL or filename represents a video format.
 */
export const isVideoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg|m4v|mkv|avi)(\?.*)?$/i.test(url);
};

/**
 * Saves an uploaded file to disk:
 * - If the file is an image (JPG, PNG, GIF, BMP, TIFF, HEIC, WEBP), it automatically converts it to WebP with 85% quality.
 * - If the file is SVG, it is saved directly without rasterization.
 * - If the file is a video (MP4, WEBM, MOV, etc.), it is saved with its original video format.
 *
 * @param file The uploaded File object
 * @param relativeSubdir Subdirectory relative to public/ (e.g. 'uploads', 'uploads/posts', 'uploads/wallpaper')
 * @returns The relative public URL path (e.g. '/uploads/1779...-photo.webp')
 */
export async function saveMediaFile(file: File, relativeSubdir: string = 'uploads'): Promise<string> {
  const uploadDir = join(process.cwd(), 'public', relativeSubdir);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const rawBaseName = file.name
    .substring(0, file.name.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9_-]/g, '') || 'file';
  const originalExt = (file.name.split('.').pop() || '').toLowerCase();

  const isVideo = file.type.startsWith('video/') || isVideoUrl(file.name);
  const isSvg = file.type === 'image/svg+xml' || originalExt === 'svg';

  if (isVideo) {
    // Preserve original video format
    const filename = `${uniqueSuffix}-${rawBaseName}.${originalExt || 'mp4'}`;
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    return `/${relativeSubdir}/${filename}`;
  }

  if (isSvg) {
    // Preserve SVG vector format
    const filename = `${uniqueSuffix}-${rawBaseName}.svg`;
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    return `/${relativeSubdir}/${filename}`;
  }

  // Convert all raster images to WebP
  try {
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    const filename = `${uniqueSuffix}-${rawBaseName}.webp`;
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, webpBuffer);
    return `/${relativeSubdir}/${filename}`;
  } catch (error) {
    console.warn('Sharp WebP conversion failed, falling back to original buffer:', error);
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    return `/${relativeSubdir}/${filename}`;
  }
}
