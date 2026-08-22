'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../admin.module.css';

export default function NewTextPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const urls = [...prev];
      URL.revokeObjectURL(urls[index]);
      urls.splice(index, 1);
      return urls;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    setLoading(true);
    const formData = new FormData(formRef.current);
    formData.append('type', 'TEXT');
    formData.delete('image'); // Remove default single image input

    files.forEach(file => {
      formData.append('images', file);
    });

    formData.set('isPinned', isPinned ? 'true' : 'false');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        window.location.href = '/admin?tab=text';
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('發布貼文失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.topNav}>
        <div className={styles.brandArea}>
          <div className={styles.brandIcon} style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
            <i className="fa-solid fa-pen-nib"></i>
          </div>
          <div>
            <h1 className={styles.title}>新增隨筆貼文 (New Post)</h1>
            <p className={styles.subtitle}>撰寫心情短文、隨筆筆記或搭配插圖的動態</p>
          </div>
        </div>

        <div>
          <Link href="/admin?tab=text" className={`${styles.btn} ${styles.btnSecondary}`}>
            <i className="fa-solid fa-arrow-left"></i> 返回後台總覽
          </Link>
        </div>
      </header>

      {/* Form Card */}
      <div className={styles.sectionCard}>
        <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="caption">
                <i className="fa-solid fa-heading" style={{ color: 'var(--accent)' }}></i> 標題 (選填)
              </label>
              <input
                type="text"
                id="caption"
                name="caption"
                className={styles.input}
                placeholder="例如：今日的午後隨筆"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="customDate">
                <i className="fa-regular fa-calendar" style={{ color: 'var(--accent)' }}></i> 發布日期 (Date)
              </label>
              <input
                type="date"
                id="customDate"
                name="customDate"
                defaultValue={new Date().toISOString().split('T')[0]}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="content">
              <i className="fa-solid fa-align-left" style={{ color: 'var(--accent)' }}></i> 內容本文 (Body)
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              className={styles.textarea}
              placeholder="在此寫下你想分享的文字、心情或故事..."
              required
            />
          </div>

          {/* Optional Photos */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fa-regular fa-images" style={{ color: 'var(--accent)' }}></i> 附加插圖照片 (選填，可多選)
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*,video/*"
              multiple
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />

            <div
              className={styles.uploadDropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              <i className={`fa-regular fa-image ${styles.uploadDropzoneIcon}`}></i>
              <div className={styles.uploadDropzoneTitle}>點擊或拖曳插圖至此處 (選填)</div>
              <div className={styles.uploadDropzoneSubtitle}>支援多張相片或短片附加</div>
            </div>

            {previewUrls.length > 0 && (
              <div className={styles.imageGrid}>
                {previewUrls.map((url, index) => (
                  <div key={url} className={styles.previewImageWrapper}>
                    <img src={url} alt={`Preview ${index}`} className={styles.previewImageSmall} />
                    <button
                      type="button"
                      className={styles.removeImageBtn}
                      onClick={() => removeImage(index)}
                      title="移除相片"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="tags">
              <i className="fa-solid fa-tags" style={{ color: 'var(--accent)' }}></i> 自訂標籤 (Tabs)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className={styles.input}
              placeholder="e.g. 隨筆, 日常 (請用逗號分隔)"
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link href="/admin?tab=text" className={`${styles.btn} ${styles.btnSecondary}`}>
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.btn} ${styles.btnAccent}`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> 發布中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i> 發布貼文
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

