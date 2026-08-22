import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const oldUrl = formData.get('oldUrl') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'wallpaper');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Delete old file if it exists and is within the wallpaper directory
    if (oldUrl && oldUrl.startsWith('/uploads/wallpaper/')) {
      try {
        const oldFilename = oldUrl.replace('/uploads/wallpaper/', '');
        // Prevent path traversal
        if (!oldFilename.includes('/') && !oldFilename.includes('\\')) {
          const oldFilePath = join(uploadDir, oldFilename);
          if (existsSync(oldFilePath)) {
            await unlink(oldFilePath);
          }
        }
      } catch (err) {
        console.error('Error deleting old wallpaper:', err);
        // Continue uploading even if deletion fails
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);
    const url = `/uploads/wallpaper/${filename}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error('Error uploading wallpaper file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
