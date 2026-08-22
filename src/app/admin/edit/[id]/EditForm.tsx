'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../admin.module.css';

type SerializedPost = {
  id: string;
  type?: string;
  imageUrl: string;
  images: string[];
  caption: string;
  content: string | null;
  customDate: string;
  isPinned?: boolean;
  tags?: string | null;
};

export default function EditForm({ post }: { post: SerializedPost }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(
    post.images.length > 0 ? post.images : (post.imageUrl ? [post.imageUrl] : [])
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState<boolean>(Boolean(post.isPinned));

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setNewFiles(prev => [...prev, ...selectedFiles]);
      const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setNewPreviewUrls(prev => [...prev, ...newUrls]);
    }
    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviewUrls(prev => {
      const urls = [...prev];
      URL.revokeObjectURL(urls[index]);
      urls.splice(index, 1);
      return urls;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    if (post.type !== 'TEXT' && existingImages.length === 0 && newFiles.length === 0) {
      alert('請至少保留一張相片！');
      return;
    }

    setLoading(true);
    const formData = new FormData(formRef.current);

    // Append existing images
    existingImages.forEach(url => {
      formData.append('existingImages', url);
    });

    // Append new files
    newFiles.forEach(file => {
      formData.append('images', file);
    });

    // Explicitly set isPinned value
    formData.set('isPinned', isPinned ? 'true' : 'false');

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        window.location.href = `/admin?tab=${post.type === 'TEXT' ? 'text' : 'photo'}`;
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('更新內容失敗');
    } finally {
      setLoading(false);
    }
  };

  const backUrl = `/admin?tab=${post.type === 'TEXT' ? 'text' : 'photo'}`;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.topNav}>
        <div className={styles.brandArea}>
          <div
            className={styles.brandIcon}
            style={
              post.type === 'TEXT'
                ? { background: 'linear-gradient(135deg, #a855f7, #6366f1)' }
                : { background: 'linear-gradient(135deg, var(--accent), #38bdf8)' }
            }
          >
            <i className={post.type === 'TEXT' ? 'fa-solid fa-pen-nib' : 'fa-regular fa-image'}></i>
          </div>
          <div>
            <h1 className={styles.title}>
              {post.type === 'TEXT' ? '編輯隨筆貼文 (Edit Post)' : '編輯影集照片 (Edit Photo)'}
            </h1>
            <p className={styles.subtitle}>修改內容資料、照片、標籤與置頂狀態</p>
          </div>
        </div>

        <div>
          <Link href={backUrl} className={`${styles.btn} ${styles.btnSecondary}`}>
            <i className="fa-solid fa-arrow-left"></i> 返回後台總覽
          </Link>
        </div>
      </header>

      {/* Form Card */}
      <div className={styles.sectionCard}>
        <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
          {/* Images Section */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fa-solid fa-images" style={{ color: 'var(--accent)' }}></i> 照片管理 {post.type === 'TEXT' ? '(選填)' : ''}
            </label>

            <input
              type="file"
              accept="image/*,video/*"
              multiple
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />

            {(existingImages.length > 0 || newPreviewUrls.length > 0) && (
              <div className={styles.imageGrid} style={{ marginBottom: '1rem' }}>
                {existingImages.map((url, index) => {
                  const isVid = /\.(mp4|webm|mov|ogg|m4v|mkv|avi)(\?.*)?$/i.test(url);
                  return (
                    <div key={url} className={styles.previewImageWrapper}>
                      {isVid ? (
                        <video src={url} muted playsInline className={styles.previewImageSmall} style={{ objectFit: 'cover' }} />
                      ) : (
                        <img src={url} alt={`Existing ${index}`} className={styles.previewImageSmall} />
                      )}
                      <button
                        type="button"
                        className={styles.removeImageBtn}
                        onClick={() => removeExistingImage(index)}
                        title="刪除既有檔案"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  );
                })}
                {newPreviewUrls.map((url, index) => {
                  const file = newFiles[index];
                  const isVid = (file && file.type.startsWith('video/')) || /\.(mp4|webm|mov|ogg|m4v|mkv|avi)(\?.*)?$/i.test(url);
                  return (
                    <div key={url} className={styles.previewImageWrapper}>
                      {isVid ? (
                        <video src={url} muted playsInline className={styles.previewImageSmall} style={{ objectFit: 'cover' }} />
                      ) : (
                        <img src={url} alt={`New Preview ${index}`} className={styles.previewImageSmall} />
                      )}
                      <button
                        type="button"
                        className={styles.removeImageBtn}
                        onClick={() => removeNewImage(index)}
                        title="取消新增檔案"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className={styles.uploadDropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              <i className={`fa-solid fa-cloud-arrow-up ${styles.uploadDropzoneIcon}`}></i>
              <div className={styles.uploadDropzoneTitle}>點擊添加更多相片或影片</div>
              <div className={styles.uploadDropzoneSubtitle}>支援 JPG, PNG, WEBP, MP4 格式</div>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="caption">
                <i className="fa-solid fa-heading" style={{ color: 'var(--accent)' }}></i> {post.type === 'TEXT' ? '標題 (選填)' : '標題 (Title)'}
              </label>
              <input
                type="text"
                id="caption"
                name="caption"
                defaultValue={post.caption}
                className={styles.input}
                placeholder={post.type === 'TEXT' ? '文章標題 (選填)' : '相簿標題'}
                required={post.type !== 'TEXT'}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="customDate">
                <i className="fa-regular fa-calendar" style={{ color: 'var(--accent)' }}></i> 日期 (Date)
              </label>
              <input
                type="date"
                id="customDate"
                name="customDate"
                defaultValue={post.customDate.split('T')[0]}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="tags">
              <i className="fa-solid fa-tags" style={{ color: 'var(--accent)' }}></i> 自訂標籤 (Tabs)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              defaultValue={post.tags || ''}
              className={styles.input}
              placeholder="e.g. 旅行, 美食, 風景 (請用逗號分隔)"
            />
            <span className={styles.inputHelp}>在前台會自動轉換為標籤篩選按鈕</span>
          </div>

          {/* Pinned Card */}
          <div
            className={styles.checkboxCard}
            onClick={() => setIsPinned(!isPinned)}
          >
            <div className={styles.checkboxContent}>
              <div className={styles.checkboxIcon}>
                <i className="fa-solid fa-thumbtack"></i>
              </div>
              <div>
                <div className={styles.checkboxTitle}>設定為至頂貼文 (Pinned)</div>
                <div className={styles.checkboxDesc}>開啟後將優先固定顯示在首頁至頂區塊</div>
              </div>
            </div>
            <input
              type="checkbox"
              id="isPinned"
              name="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className={styles.customCheckbox}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="content">
              <i className="fa-solid fa-align-left" style={{ color: 'var(--accent)' }}></i> {post.type === 'TEXT' ? '內容本文 (Body)' : '詳細備註與描述 (選填)'}
            </label>
            <textarea
              id="content"
              name="content"
              rows={post.type === 'TEXT' ? 8 : 5}
              defaultValue={post.content || ''}
              className={styles.textarea}
              placeholder="輸入內容故事或備註..."
              required={post.type === 'TEXT'}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link href={backUrl} className={`${styles.btn} ${styles.btnSecondary}`}>
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> 儲存中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i> 儲存變更
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

