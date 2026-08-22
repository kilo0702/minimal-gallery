import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import styles from './admin.module.css';
import DeleteButton from './DeleteButton';
import MarqueeSettingForm from './MarqueeSettingForm';
import HeroSettingForm from './HeroSettingForm';

export const revalidate = 0;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Determine current active tab (default to 'PHOTO' for backward compatibility or when visiting /admin directly)
  const resolvedParams = await searchParams;
  const tab = resolvedParams.tab === 'text' ? 'TEXT' : 'PHOTO';

  const [posts, totalPhotos, totalTexts, totalPinned, allSettings] = await Promise.all([
    prisma.post.findMany({
      where: { type: tab },
      orderBy: { customDate: 'desc' },
    }),
    prisma.post.count({ where: { type: 'PHOTO' } }),
    prisma.post.count({ where: { type: 'TEXT' } }),
    prisma.post.count({ where: { isPinned: true } }),
    prisma.setting.findMany(),
  ]);

  const settingsMap = allSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const initialMarqueeText = settingsMap['marqueeText'] || '🌟 這是跑馬燈測試文字 🌟 可以在這裡放最新消息或公告 ✨ 此為預設文字，稍後可以自行修改 🚀';
  const initialHeroTitle = settingsMap['heroTitle'] || 'Title There';
  const initialHeroSubtitle1 = settingsMap['heroSubtitle1'] || '副標題一 (Subtitle 1)';
  const initialHeroSubtitle2 = settingsMap['heroSubtitle2'] || '副標題二 (Subtitle 2)';
  const initialHeroBackgroundUrl = settingsMap['heroBackgroundUrl'] || '/hero_background.png';
  const initialSiteName = settingsMap['siteName'] || 'Photo Journal';
  const initialSiteIconUrl = settingsMap['siteIconUrl'] || '/favicon.ico';

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <header className={styles.topNav}>
        <div className={styles.brandArea}>
          <div className={styles.brandIcon}>
            <i className="fa-solid fa-sliders"></i>
          </div>
          <div>
            <h1 className={styles.title}>Admin Control Center</h1>
            <p className={styles.subtitle}>管理網站內容、外觀與即時公告設定</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link href="/" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnViewSite}`} target="_blank">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            <span>前往前台</span>
          </Link>
          <Link href="/admin/new" className={`${styles.btn} ${styles.btnPrimary}`}>
            <i className="fa-regular fa-image"></i>
            <span>發布影集</span>
          </Link>
          <Link href="/admin/new-text" className={`${styles.btn} ${styles.btnAccent}`}>
            <i className="fa-solid fa-pen-nib"></i>
            <span>發布貼文</span>
          </Link>
        </div>
      </header>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPhoto}`}>
            <i className="fa-regular fa-image"></i>
          </div>
          <div>
            <div className={styles.statValue}>{totalPhotos}</div>
            <div className={styles.statLabel}>影集照片 (Gallery)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPost}`}>
            <i className="fa-solid fa-pen-nib"></i>
          </div>
          <div>
            <div className={styles.statValue}>{totalTexts}</div>
            <div className={styles.statLabel}>文字貼文 (Posts)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPinned}`}>
            <i className="fa-solid fa-thumbtack"></i>
          </div>
          <div>
            <div className={styles.statValue}>{totalPinned}</div>
            <div className={styles.statLabel}>置頂貼文 (Pinned)</div>
          </div>
        </div>
      </div>

      {/* Hero Settings */}
      <HeroSettingForm
        initialTitle={initialHeroTitle}
        initialSubtitle1={initialHeroSubtitle1}
        initialSubtitle2={initialHeroSubtitle2}
        initialBackgroundUrl={initialHeroBackgroundUrl}
        initialSiteName={initialSiteName}
        initialSiteIconUrl={initialSiteIconUrl}
      />

      {/* Marquee Settings */}
      <MarqueeSettingForm initialText={initialMarqueeText} />

      {/* Content Management Section */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <div className={styles.sectionTitleIcon}>
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <h2 className={styles.sectionTitle}>內容管理 (Content Management)</h2>
              <p className={styles.sectionDesc}>管理目前已發布的相片與文字貼文，支援快速編輯與置頂設定</p>
            </div>
          </div>

          <div className={styles.toggleContainer}>
            <Link
              href="/admin?tab=photo"
              className={`${styles.toggleBtn} ${tab === 'PHOTO' ? styles.toggleBtnActive : ''}`}
            >
              <i className="fa-regular fa-image"></i> Gallery 影集 ({totalPhotos})
            </Link>
            <Link
              href="/admin?tab=text"
              className={`${styles.toggleBtn} ${tab === 'TEXT' ? styles.toggleBtnActive : ''}`}
            >
              <i className="fa-solid fa-pen-nib"></i> Posts 貼文 ({totalTexts})
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className={styles.emptyState}>
            <i className={`fa-regular ${tab === 'PHOTO' ? 'fa-image' : 'fa-pen-to-square'} ${styles.emptyStateIcon}`}></i>
            <p>目前還沒有任何{tab === 'PHOTO' ? '影集照片' : '文字貼文'}。</p>
            <Link
              href={tab === 'PHOTO' ? '/admin/new' : '/admin/new-text'}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ marginTop: '0.5rem' }}
            >
              <i className="fa-solid fa-plus"></i> 立即新增第一篇
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th} style={{ width: '90px' }}>預覽</th>
                    <th className={styles.th}>標題與內容</th>
                    <th className={styles.th} style={{ width: '130px' }}>發布日期</th>
                    <th className={styles.th} style={{ width: '180px' }}>標籤</th>
                    <th className={styles.th} style={{ width: '110px', textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className={styles.tr}>
                      <td className={styles.td}>
                        {post.imageUrl ? (
                          <Image
                            src={post.imageUrl}
                            alt="preview"
                            width={68}
                            height={68}
                            className={styles.postThumbnail}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.postThumbnailPlaceholder}>
                            <i className="fa-solid fa-book-open"></i>
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        {post.isPinned && (
                          <div className={styles.pinnedBadge}>
                            <i className="fa-solid fa-thumbtack"></i> 置頂貼文
                          </div>
                        )}
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {post.caption || '(無標題)'}
                        </div>
                        {post.type === 'TEXT' && post.content && (
                          <div
                            style={{
                              fontSize: '0.825rem',
                              color: 'var(--muted)',
                              marginTop: '4px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: '1.4',
                            }}
                          >
                            {post.content}
                          </div>
                        )}
                      </td>
                      <td className={styles.td} style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }}></i>
                        {new Date(post.customDate).toLocaleDateString()}
                      </td>
                      <td className={styles.td}>
                        {post.tags ? (
                          post.tags
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .map((tag) => (
                              <span key={tag} className={styles.tagChip}>
                                #{tag}
                              </span>
                            ))
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>-</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                          <Link
                            href={`/admin/edit/${post.id}`}
                            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`}
                            title="編輯"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </Link>
                          <DeleteButton id={post.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (Portrait Optimized) */}
            <div className={styles.mobilePostList}>
              {posts.map((post) => (
                <div key={post.id} className={styles.mobilePostCard}>
                  <div className={styles.mobilePostHeader}>
                    {post.imageUrl ? (
                      <Image
                        src={post.imageUrl}
                        alt="preview"
                        width={68}
                        height={68}
                        className={styles.postThumbnail}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.postThumbnailPlaceholder}>
                        <i className="fa-solid fa-book-open"></i>
                      </div>
                    )}
                    <div className={styles.mobilePostInfo}>
                      {post.isPinned && (
                        <div className={styles.pinnedBadge}>
                          <i className="fa-solid fa-thumbtack"></i> 置頂
                        </div>
                      )}
                      <div className={styles.mobilePostTitle}>
                        {post.caption || '(無標題)'}
                      </div>
                      {post.type === 'TEXT' && post.content && (
                        <div className={styles.mobilePostContent}>
                          {post.content}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.mobilePostMeta}>
                    <span>
                      <i className="fa-regular fa-calendar" style={{ marginRight: '4px' }}></i>
                      {new Date(post.customDate).toLocaleDateString()}
                    </span>
                    {post.tags && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {post.tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((tag) => (
                            <span key={tag} className={styles.tagChip}>
                              #{tag}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.mobilePostActions}>
                    <Link
                      href={`/admin/edit/${post.id}`}
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                    >
                      <i className="fa-solid fa-pen-to-square"></i> 編輯
                    </Link>
                    <DeleteButton id={post.id} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
