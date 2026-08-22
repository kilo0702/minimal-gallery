import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: { images: true },
      orderBy: { customDate: 'desc' },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const caption = formData.get('caption') as string;
    const content = formData.get('content') as string;
    const customDateStr = formData.get('customDate') as string;
    const isPinnedStr = formData.get('isPinned') as string;
    const tagsStr = formData.get('tags') as string;
    const type = formData.get('type') as string || 'PHOTO';
    
    const isPinned = isPinnedStr === 'true' || isPinnedStr === 'on';

    if (type === 'PHOTO' && (!files || files.length === 0)) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    const savedImageUrls: string[] = [];

    if (files && files.length > 0) {
      const uploadDir = type === 'TEXT' 
        ? join(process.cwd(), 'public', 'uploads', 'posts') 
        : join(process.cwd(), 'public', 'uploads');
        
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      for (const file of files) {
        if (file.size === 0) continue;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const filePath = join(uploadDir, filename);

        await writeFile(filePath, buffer);
        savedImageUrls.push(type === 'TEXT' ? `/uploads/posts/${filename}` : `/uploads/${filename}`);
      }
    }

    const customDate = customDateStr ? new Date(customDateStr) : new Date();

    const post = await prisma.post.create({
      data: {
        type: type,
        imageUrl: savedImageUrls[0] || '',
        caption: caption || '',
        content: content || null,
        customDate,
        isPinned,
        tags: tagsStr || null,
        images: savedImageUrls.length > 0 ? {
          create: savedImageUrls.map(url => ({ url })),
        } : undefined
      },
      include: { images: true }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
