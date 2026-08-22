import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    
    const caption = formData.get('caption') as string;
    const content = formData.get('content') as string;
    const customDate = formData.get('customDate') as string;
    const isPinnedStr = formData.get('isPinned') as string | null;
    const tagsStr = formData.get('tags') as string;
    const existingImages = formData.getAll('existingImages') as string[];
    const newFiles = formData.getAll('images') as File[];
    
    const isPinned = isPinnedStr === 'true' || isPinnedStr === 'on';

    const post = await prisma.post.findUnique({
      where: { id },
      include: { images: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 1. Find images to delete
    const imagesToDelete = post.images.filter(img => !existingImages.includes(img.url));
    
    for (const img of imagesToDelete) {
      if (img.url.startsWith('/uploads/')) {
        const filename = img.url.replace('/uploads/', '');
        const filePath = join(process.cwd(), 'public', 'uploads', filename);
        try { await unlink(filePath); } catch (err) {}
      }
    }

    // Delete from DB
    if (imagesToDelete.length > 0) {
      await prisma.image.deleteMany({
        where: { id: { in: imagesToDelete.map(img => img.id) } }
      });
    }

    // 2. Process new files
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const newlySavedUrls: string[] = [];
    for (const file of newFiles) {
      if (file.size === 0) continue;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const filePath = join(uploadDir, filename);

      await writeFile(filePath, buffer);
      newlySavedUrls.push(`/uploads/${filename}`);
    }

    // Create new images in DB
    if (newlySavedUrls.length > 0) {
      await prisma.image.createMany({
        data: newlySavedUrls.map(url => ({ url, postId: id }))
      });
    }

    // 3. Determine new primary imageUrl
    const finalImageUrls = [...existingImages, ...newlySavedUrls];
    const newPrimaryImageUrl = finalImageUrls[0] || '';

    // 4. Update Post
    const dataToUpdate: any = { imageUrl: newPrimaryImageUrl };
    if (caption !== undefined && caption !== null) dataToUpdate.caption = caption;
    if (content !== undefined) dataToUpdate.content = content || null;
    if (customDate !== undefined) dataToUpdate.customDate = new Date(customDate);
    dataToUpdate.isPinned = isPinned;
    if (tagsStr !== null && tagsStr !== undefined) dataToUpdate.tags = tagsStr || null;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: dataToUpdate,
      include: { images: true }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({ 
      where: { id },
      include: { images: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Attempt to delete physical files
    for (const img of post.images) {
      if (img.url.startsWith('/uploads/')) {
        const filename = img.url.replace('/uploads/', '');
        const filePath = join(process.cwd(), 'public', 'uploads', filename);
        try { await unlink(filePath); } catch (err) {}
      }
    }
    
    // Legacy fallback
    if (post.imageUrl && post.imageUrl.startsWith('/uploads/') && !post.images.find(img => img.url === post.imageUrl)) {
      const filename = post.imageUrl.replace('/uploads/', '');
      const filePath = join(process.cwd(), 'public', 'uploads', filename);
      try { await unlink(filePath); } catch (err) {}
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
