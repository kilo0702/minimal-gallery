import { prisma } from '@/lib/prisma';
import styles from './page.module.css';
import GalleryFeed from './components/GalleryFeed';

export const revalidate = 0; // Disable static rendering to see new posts immediately

export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { customDate: 'desc' },
    include: { images: true },
  });

  const allSettings = await prisma.setting.findMany();
  const settingsMap = allSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const marqueeText = settingsMap['marqueeText'] || '🌟 這是跑馬燈測試文字 🌟 可以在這裡放最新消息或公告 ✨ 此為預設文字，稍後可以自行修改 🚀';
  const heroTitle = settingsMap['heroTitle'] || 'Title There';
  const heroSubtitle1 = settingsMap['heroSubtitle1'] || '副標題一 (Subtitle 1)';
  const heroSubtitle2 = settingsMap['heroSubtitle2'] || '副標題二 (Subtitle 2)';
  const heroBackgroundUrl = settingsMap['heroBackgroundUrl'] || '/hero_background.png';

  return (
    <>
      <div className={styles.heroBackground} style={{ backgroundImage: `url('${heroBackgroundUrl}')` }}></div>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>{heroTitle}</h1>
          <p className={styles.subtitle}>{heroSubtitle1}</p>
          <p className={styles.subtitle}>{heroSubtitle2}</p>
        </header>

        <GalleryFeed posts={posts} marqueeText={marqueeText} />
      </main>
    </>
  );
}
