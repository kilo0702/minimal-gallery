import { NextResponse } from 'next/server';
import { convertAllExistingImagesToWebp } from '@/lib/media';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subdirs = ['uploads', 'uploads/posts', 'uploads/wallpaper'];
    const nonWebpRegex = /\.(jpg|jpeg|png|bmp|tiff|heic)$/i;
    let legacyImageCount = 0;
    let totalLegacyBytes = 0;

    for (const subdir of subdirs) {
      const fullDirPath = join(process.cwd(), 'public', subdir);
      if (!existsSync(fullDirPath)) continue;

      try {
        const dirEntries = await readdir(fullDirPath, { withFileTypes: true });
        for (const entry of dirEntries) {
          if (entry.isFile() && nonWebpRegex.test(entry.name) && !entry.name.startsWith('.')) {
            legacyImageCount++;
            const s = await stat(join(fullDirPath, entry.name));
            totalLegacyBytes += s.size;
          }
        }
      } catch (err) {}
    }

    return NextResponse.json({
      legacyImageCount,
      totalLegacyBytes,
      needsOptimization: legacyImageCount > 0,
    });
  } catch (error) {
    console.error('Error scanning legacy images:', error);
    return NextResponse.json({ error: 'Failed to scan images' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await convertAllExistingImagesToWebp();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error optimizing images to WebP:', error);
    return NextResponse.json({ error: 'Failed to optimize images' }, { status: 500 });
  }
}
