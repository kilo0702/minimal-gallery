import { writeFile, mkdir, readdir, readFile, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';

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

export interface OptimizationResult {
  totalScanned: number;
  convertedCount: number;
  totalOriginalBytes: number;
  totalNewBytes: number;
  savedBytes: number;
  errors: string[];
}

/**
 * Scans all uploads directories for existing legacy images (JPG, JPEG, PNG, BMP, TIFF, HEIC),
 * converts them to modern compressed WebP, updates all SQLite database references (Post, Image, Setting),
 * and deletes old files.
 */
export async function convertAllExistingImagesToWebp(): Promise<OptimizationResult> {
  const result: OptimizationResult = {
    totalScanned: 0,
    convertedCount: 0,
    totalOriginalBytes: 0,
    totalNewBytes: 0,
    savedBytes: 0,
    errors: [],
  };

  const subdirs = ['uploads', 'uploads/posts', 'uploads/wallpaper'];
  const nonWebpRegex = /\.(jpg|jpeg|png|bmp|tiff|heic)$/i;

  for (const subdir of subdirs) {
    const fullDirPath = join(process.cwd(), 'public', subdir);
    if (!existsSync(fullDirPath)) continue;

    let dirEntries;
    try {
      dirEntries = await readdir(fullDirPath, { withFileTypes: true });
    } catch (e) {
      continue;
    }

    for (const entry of dirEntries) {
      if (!entry.isFile()) continue;
      const fileName = entry.name;
      if (fileName.startsWith('.') || !nonWebpRegex.test(fileName)) continue;

      result.totalScanned++;
      const oldFilePath = join(fullDirPath, fileName);
      const oldUrl = `/${subdir}/${fileName}`;
      const baseNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      const newFileName = `${baseNameWithoutExt}.webp`;
      const newFilePath = join(fullDirPath, newFileName);
      const newUrl = `/${subdir}/${newFileName}`;

      try {
        const originalStats = await stat(oldFilePath);
        const originalBytes = originalStats.size;
        result.totalOriginalBytes += originalBytes;

        // Convert to WebP using sharp
        const buffer = await readFile(oldFilePath);
        const webpBuffer = await sharp(buffer)
          .webp({ quality: 85, effort: 4 })
          .toBuffer();

        await writeFile(newFilePath, webpBuffer);
        const newBytes = webpBuffer.byteLength;
        result.totalNewBytes += newBytes;
        result.savedBytes += (originalBytes - newBytes);

        // Update database records
        // 1. Post.imageUrl
        await prisma.post.updateMany({
          where: { imageUrl: oldUrl },
          data: { imageUrl: newUrl },
        });

        // 2. Image.url
        await prisma.image.updateMany({
          where: { url: oldUrl },
          data: { url: newUrl },
        });

        // 3. Setting.value
        await prisma.setting.updateMany({
          where: { value: oldUrl },
          data: { value: newUrl },
        });

        // Delete old file
        await unlink(oldFilePath);
        result.convertedCount++;
      } catch (err: any) {
        console.error(`Failed to convert image ${oldFilePath} to WebP:`, err);
        result.errors.push(`${fileName}: ${err.message || err}`);
      }
    }
  }

  return result;
}

