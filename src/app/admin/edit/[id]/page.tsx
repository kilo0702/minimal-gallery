import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditForm from './EditForm';

export const revalidate = 0;

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const post = await prisma.post.findUnique({
    where: { id },
    include: { images: true }
  });

  if (!post) {
    notFound();
  }

  // Convert Date to string for client component props
  const serializedPost = {
    id: post.id,
    type: post.type,
    imageUrl: post.imageUrl || '',
    images: post.images.map(img => img.url),
    caption: post.caption,
    content: post.content,
    customDate: post.customDate.toISOString(),
    isPinned: post.isPinned,
    tags: post.tags,
  };

  return <EditForm post={serializedPost} />;
}
