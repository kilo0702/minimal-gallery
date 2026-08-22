'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '../page.module.css';

const isVideo = (url: string | null) => {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)$/i.test(url);
};

type Post = {
  id: string;
  type: string;
  imageUrl: string | null;
  images?: { id: string; url: string }[];
  caption: string;
  content?: string | null;
  customDate: Date;
  isPinned?: boolean;
  tags?: string | null;
};

export default function GalleryFeed({ posts, marqueeText }: { posts: Post[], marqueeText: string }) {
  const [selectedTab, setSelectedTab] = useState<string>('All');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [displayPost, setDisplayPost] = useState<Post | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });

  // Swipe logic for main image
  const [imageTouchStart, setImageTouchStart] = useState<number | null>(null);

  const handleImagePointerDown = (e: React.PointerEvent) => {
    setImageTouchStart(e.clientX);
    if (e.target instanceof HTMLElement) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handleImagePointerUp = (e: React.PointerEvent) => {
    if (imageTouchStart === null) return;
    const diff = imageTouchStart - e.clientX;
    if (diff > 50 && displayPost && displayPost.images) {
      setSlideDirection('left');
      setCurrentImageIndex((prev) => (prev + 1) % displayPost.images!.length);
    } else if (diff < -50 && displayPost && displayPost.images) {
      setSlideDirection('right');
      setCurrentImageIndex((prev) => (prev - 1 + displayPost.images!.length) % displayPost.images!.length);
    }
    setImageTouchStart(null);
    if (e.target instanceof HTMLElement) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  // Drag logic for thumbnails
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [thumbStartX, setThumbStartX] = useState(0);
  const [thumbScrollLeft, setThumbScrollLeft] = useState(0);
  const [hasDraggedThumb, setHasDraggedThumb] = useState(false);

  const handleThumbPointerDown = (e: React.PointerEvent) => {
    if (thumbnailScrollRef.current) {
      setIsDraggingThumb(true);
      setHasDraggedThumb(false);
      setThumbStartX(e.clientX);
      setThumbScrollLeft(thumbnailScrollRef.current.scrollLeft);
      if (e.target instanceof HTMLElement) {
        e.target.setPointerCapture(e.pointerId);
      }
    }
  };

  const handleThumbPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingThumb || !thumbnailScrollRef.current) return;
    const walk = (e.clientX - thumbStartX) * 1.5;
    if (Math.abs(walk) > 5) setHasDraggedThumb(true);
    thumbnailScrollRef.current.scrollLeft = thumbScrollLeft - walk;
  };

  const handleThumbPointerUp = (e: React.PointerEvent) => {
    setIsDraggingThumb(false);
    if (e.target instanceof HTMLElement) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  // Drag logic for multiple card thumbnails using dataset
  const handleCardThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    el.dataset.isDragging = 'true';
    el.dataset.hasDragged = 'false';
    el.dataset.startX = e.clientX.toString();
    el.dataset.scrollLeft = el.scrollLeft.toString();
  };

  const handleCardThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.dataset.isDragging !== 'true') return;
    const startX = parseFloat(el.dataset.startX || '0');
    const scrollLeft = parseFloat(el.dataset.scrollLeft || '0');
    const walk = (e.clientX - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      el.dataset.hasDragged = 'true';
    }
    el.scrollLeft = scrollLeft - walk;
  };

  const handleCardThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.dataset.isDragging = 'false';
    el.releasePointerCapture(e.pointerId);
  };

  const handleCardThumbClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.dataset.hasDragged === 'true') {
      e.stopPropagation(); // prevent modal open if dragged
      el.dataset.hasDragged = 'false';
    }
  };

  useEffect(() => {
    if (selectedPost) {
      setDisplayPost(selectedPost);
      setCurrentImageIndex(0);
      setSlideDirection(null);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setDisplayPost(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedPost]);

  const filterTabsOptions = useMemo(() => {
    const uniqueYears = new Set(
      posts.map((post) => new Date(post.customDate).getFullYear().toString())
    );
    const yearsArray = Array.from(uniqueYears).sort((a, b) => Number(b) - Number(a));

    const uniqueTags = new Set<string>();
    posts.forEach(post => {
      if (post.tags) {
        post.tags.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) uniqueTags.add(trimmed);
        });
      }
    });
    const tagsArray = Array.from(uniqueTags).sort();

    return ['All', 'Posts', 'Gallery', ...yearsArray, ...tagsArray];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedTab === 'All') return posts;
    if (selectedTab === 'Posts') return posts.filter(post => post.type === 'TEXT');
    if (selectedTab === 'Gallery') return posts.filter(post => post.type === 'PHOTO');

    // Simple heuristic: if it's 4 digits and a number, treat as year
    const isYear = /^\d{4}$/.test(selectedTab);

    if (isYear) {
      return posts.filter(
        (post) => new Date(post.customDate).getFullYear().toString() === selectedTab
      );
    } else {
      return posts.filter(post => {
        if (!post.tags) return false;
        const postTags = post.tags.split(',').map(t => t.trim());
        return postTags.includes(selectedTab);
      });
    }
  }, [posts, selectedTab]);

  const groupedPosts = useMemo(() => {
    const groups: { [year: string]: Post[] } = {};
    const pinnedPosts: Post[] = [];

    filteredPosts.forEach(post => {
      if (post.isPinned) {
        pinnedPosts.push(post);
      } else {
        const year = new Date(post.customDate).getFullYear().toString();
        if (!groups[year]) groups[year] = [];
        groups[year].push(post);
      }
    });

    // Sort years descending
    const result = Object.keys(groups)
      .sort((a, b) => Number(b) - Number(a))
      .map(year => ({
        groupName: year,
        posts: groups[year]
      }));

    if (pinnedPosts.length > 0) {
      result.unshift({
        groupName: '📌 至頂貼文',
        posts: pinnedPosts
      });
    }

    return result;
  }, [filteredPosts]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayPost && displayPost.images) {
      setSlideDirection('left');
      setCurrentImageIndex((prev) => (prev + 1) % displayPost.images!.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayPost && displayPost.images) {
      setSlideDirection('right');
      setCurrentImageIndex((prev) => (prev - 1 + displayPost.images!.length) % displayPost.images!.length);
    }
  };

  const scrollThumbnails = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.stopPropagation();
    if (thumbnailScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      thumbnailScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (posts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No content yet. Go to Dashboard to add some!</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.marqueeContainer}>
        <div className={styles.marqueeContent}>
          {marqueeText}
        </div>
      </div>
      <div className={styles.filterTabs}>
        {filterTabsOptions.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`${styles.filterTab} ${selectedTab === tab ? styles.filterTabActive : ''}`}
          >
            {tab === 'All' ? '全部' : tab}
          </button>
        ))}
      </div>

      <div className={styles.galleryContainer}>
        {groupedPosts.map(({ groupName, posts: groupPosts }) => (
          <div key={groupName} className={styles.yearGroup}>
            <div className={styles.yearDivider}>
              <span className={styles.yearText} style={groupName.includes('📌') ? { color: '#f59e0b' } : {}}>{groupName}</span>
              <div className={styles.line}></div>
            </div>
            <div className={styles.gallery}>
              {groupPosts.map((post, index) => {
                const hasMultipleImages = post.images && post.images.length > 1;
                const isTextPost = post.type === 'TEXT';

                return (
                  <article
                    key={`${selectedTab}-${post.id}`}
                    className={styles.postCard}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setClickPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                      });
                      setSelectedPost(post);
                    }}
                    style={{ cursor: 'pointer', animationDelay: `${index * 0.08}s` }}
                  >
                    <div className={styles.imageWrapper}>
                      {isVideo(post.imageUrl) ? (
                        <video
                          src={post.imageUrl!}
                          autoPlay loop muted playsInline
                          className={styles.image}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Image
                          src={post.imageUrl || '/hero_background.png'}
                          alt={post.caption || 'Photo'}
                          width={600}
                          height={600}
                          className={styles.image}
                          unoptimized
                        />
                      )}
                    </div>

                    {hasMultipleImages && (
                      <div className={styles.cardThumbnailGrid}>
                        <div
                          className={styles.cardThumbnailsScroll}
                          onPointerDown={handleCardThumbPointerDown}
                          onPointerMove={handleCardThumbPointerMove}
                          onPointerUp={handleCardThumbPointerUp}
                          onPointerCancel={handleCardThumbPointerUp}
                          onClick={handleCardThumbClick}
                        >
                          <div className={styles.cardThumbnailIndicator}>
                            <i className="fa-regular fa-images"></i> 1/{post.images!.length}
                          </div>
                          {post.images!.map((img) => (
                            <div key={img.id} className={styles.cardThumbnailItem}>
                              {isVideo(img.url) ? (
                                <video src={img.url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <img src={img.url} alt="thumbnail" onDragStart={(e) => e.preventDefault()} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.cardContent}>
                      <p className={styles.cardDate} suppressHydrationWarning>
                        <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }}></i>
                        {new Date(post.customDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      {isTextPost ? (
                        <p className={styles.cardBody} style={{
                          color: 'var(--muted)',
                          marginTop: '0.5rem',
                          lineHeight: '1.6',
                          fontWeight: 300,
                          fontSize: '0.95rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {post.content || ''}
                        </p>
                      ) : (
                        post.caption && <p className={styles.cardCaption}>{post.caption}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
        {filteredPosts.length === 0 && (
          <div className={styles.emptyState}>
            <p>No content found for {selectedTab}.</p>
          </div>
        )}
      </div>

      {displayPost && (
        <div className={`${styles.modalOverlay} ${isAnimating ? styles.modalOpen : ''}`}>
          <div
            className={styles.modalBackdrop}
            onClick={() => setSelectedPost(null)}
          />

          <div
            className={styles.modalContent}
            style={{
              transformOrigin: `calc(50% + ${clickPos.x}px - 50vw) calc(50% + ${clickPos.y}px - 50vh)`
            }}
          >
            <button
              className={styles.closeButton}
              onClick={() => setSelectedPost(null)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            <div className={styles.modalScrollableArea}>
            {(() => {
              const isGrabbable = displayPost.images && displayPost.images.length > 1;
              return (
                <div
                  className={`${styles.modalImageContainer} ${isGrabbable ? styles.modalImageContainerGrabbable : ''}`}
                  onPointerDown={isGrabbable ? handleImagePointerDown : undefined}
                  onPointerUp={isGrabbable ? handleImagePointerUp : undefined}
                  onPointerCancel={isGrabbable ? handleImagePointerUp : undefined}
                  style={(displayPost.type === 'TEXT' && !displayPost.imageUrl) ? { background: 'var(--background)' } : {}}
                >
              {(() => {
                if (displayPost.type === 'TEXT' && !displayPost.imageUrl) {
                  return (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '4rem', opacity: 0.1 }}>
                      <i className="fa-solid fa-book-open"></i>
                    </div>
                  );
                }

                const mediaUrl = displayPost.images && displayPost.images.length > 0 ? displayPost.images[currentImageIndex].url : (displayPost.imageUrl || '/hero_background.png');
                const animationClass = slideDirection === 'left' ? styles.slideInLeft : (slideDirection === 'right' ? styles.slideInRight : styles.fadeIn);

                if (isVideo(mediaUrl)) {
                  return (
                    <video
                      key={currentImageIndex}
                      src={mediaUrl}
                      controls
                      autoPlay
                      playsInline
                      className={`${styles.modalImage} ${animationClass}`}
                    />
                  );
                }

                return (
                  <img
                    key={currentImageIndex}
                    src={mediaUrl}
                    alt={displayPost.caption || 'Photo'}
                    className={`${styles.modalImage} ${animationClass}`}
                    onDragStart={(e) => e.preventDefault()}
                  />
                );
              })()}

              {displayPost.images && displayPost.images.length > 1 && (
                <>
                  <button className={styles.navButtonLeft} onClick={prevImage}>
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <button className={styles.navButtonRight} onClick={nextImage}>
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </>
              )}
            </div>
            );
          })()}

            <div className={styles.modalRightColumn}>
              <div className={styles.modalTextContainer}>
                <p className={styles.modalDate} suppressHydrationWarning>
                  <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }}></i>
                  {new Date(displayPost.customDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {displayPost.caption && (
                  <p className={styles.modalCaption}>{displayPost.caption}</p>
                )}
                {displayPost.content && (
                  <p className={styles.modalBody}>{displayPost.content}</p>
                )}
              </div>

              {displayPost.images && displayPost.images.length > 1 && (
                <div className={styles.modalThumbnailContainer}>
                  <button className={styles.thumbnailNavLeft} onClick={(e) => scrollThumbnails(e, 'left')}>
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <div
                    className={styles.modalThumbnailScroll}
                    ref={thumbnailScrollRef}
                    onPointerDown={handleThumbPointerDown}
                    onPointerMove={handleThumbPointerMove}
                    onPointerUp={handleThumbPointerUp}
                    onPointerCancel={handleThumbPointerUp}
                  >
                    {displayPost.images.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`${styles.modalThumbnailItem} ${idx === currentImageIndex ? styles.modalThumbnailActive : ''}`}
                        onClick={() => {
                          if (hasDraggedThumb) return;
                          if (idx > currentImageIndex) setSlideDirection('left');
                          else if (idx < currentImageIndex) setSlideDirection('right');
                          setCurrentImageIndex(idx);
                        }}
                        ref={idx === currentImageIndex ? (el) => {
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                          }
                        } : null}
                      >
                        {isVideo(img.url) ? (
                          <video src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                        ) : (
                          <img src={img.url} alt="thumbnail" onDragStart={(e) => e.preventDefault()} />
                        )}
                      </div>
                    ))}
                  </div>
                  <button className={styles.thumbnailNavRight} onClick={(e) => scrollThumbnails(e, 'right')}>
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

