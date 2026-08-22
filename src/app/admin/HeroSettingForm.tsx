'use client';

import { useState, useRef } from 'react';
import styles from './admin.module.css';

interface HeroSettingFormProps {
  initialTitle: string;
  initialSubtitle1: string;
  initialSubtitle2: string;
  initialBackgroundUrl: string;
  initialSiteName: string;
  initialSiteIconUrl: string;
}

export default function HeroSettingForm({
  initialTitle,
  initialSubtitle1,
  initialSubtitle2,
  initialBackgroundUrl,
  initialSiteName,
  initialSiteIconUrl,
}: HeroSettingFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle1, setSubtitle1] = useState(initialSubtitle1);
  const [subtitle2, setSubtitle2] = useState(initialSubtitle2);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialBackgroundUrl);
  
  const [siteName, setSiteName] = useState(initialSiteName);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState(initialSiteIconUrl);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setIconFile(selectedFile);
      setIconPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    try {
      let backgroundUrl = initialBackgroundUrl;
      let siteIconUrl = initialSiteIconUrl;

      // 1. Upload new background image if selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('oldUrl', initialBackgroundUrl);

        const uploadRes = await fetch('/api/upload/wallpaper', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          backgroundUrl = uploadData.url;
        } else {
          alert('背景圖片上傳失敗');
          setLoading(false);
          return;
        }
      }

      // 1.5 Upload new icon image if selected
      if (iconFile) {
        const formData = new FormData();
        formData.append('file', iconFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          siteIconUrl = uploadData.url;
        } else {
          alert('網站圖示上傳失敗');
          setLoading(false);
          return;
        }
      }

      // 2. Update settings in database
      const settingsToUpdate = [
        { key: 'heroTitle', value: title },
        { key: 'heroSubtitle1', value: subtitle1 },
        { key: 'heroSubtitle2', value: subtitle2 },
        { key: 'heroBackgroundUrl', value: backgroundUrl },
        { key: 'siteName', value: siteName },
        { key: 'siteIconUrl', value: siteIconUrl },
      ];

      for (const setting of settingsToUpdate) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting),
        });
      }

      setSuccessMessage('主畫面設定已成功儲存！');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('儲存失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <div className={styles.sectionTitleIcon}>
            <i className="fa-solid fa-paintbrush"></i>
          </div>
          <div>
            <h2 className={styles.sectionTitle}>主畫面與品牌外觀 (Hero & Branding)</h2>
            <p className={styles.sectionDesc}>設定首頁頂部大圖、主標題、副標題與網站圖示</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Text Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="siteName">
                <i className="fa-solid fa-globe" style={{ color: 'var(--accent)' }}></i> 網站名稱 (Site Title)
              </label>
              <input
                id="siteName"
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className={styles.input}
                placeholder="Photo Journal"
                required
              />
              <span className={styles.inputHelp}>顯示於瀏覽器標籤頁與網站名稱</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="heroTitle">
                <i className="fa-solid fa-heading" style={{ color: 'var(--accent)' }}></i> 主標題 (Hero Title)
              </label>
              <input
                id="heroTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                placeholder="Title"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="heroSubtitle1">
                <i className="fa-regular fa-bookmark" style={{ color: 'var(--accent)' }}></i> 副標題 1 (Subtitle 1)
              </label>
              <input
                id="heroSubtitle1"
                type="text"
                value={subtitle1}
                onChange={(e) => setSubtitle1(e.target.value)}
                className={styles.input}
                placeholder="副標題一"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="heroSubtitle2">
                <i className="fa-regular fa-bookmark" style={{ color: 'var(--accent)' }}></i> 副標題 2 (Subtitle 2)
              </label>
              <input
                id="heroSubtitle2"
                type="text"
                value={subtitle2}
                onChange={(e) => setSubtitle2(e.target.value)}
                className={styles.input}
                placeholder="副標題二"
              />
            </div>
          </div>

          {/* Media / Previews */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Favicon Setting */}
            <div className={styles.mediaPreviewCard}>
              <label className={styles.label}>
                <i className="fa-solid fa-icons" style={{ color: 'var(--accent)' }}></i> 網站圖示 (Favicon)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {iconPreviewUrl && (
                  <img
                    src={iconPreviewUrl}
                    alt="Icon Preview"
                    className={styles.iconPreviewImage}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={iconFileInputRef}
                    onChange={handleIconChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => iconFileInputRef.current?.click()}
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ fontSize: '0.85rem', width: '100%' }}
                  >
                    <i className="fa-solid fa-arrow-up-from-bracket"></i> 選擇新圖示
                  </button>
                  <div className={styles.inputHelp} style={{ marginTop: '4px' }}>
                    建議尺寸 64x64 正方形 PNG/ICO
                  </div>
                </div>
              </div>
            </div>

            {/* Wallpaper Setting */}
            <div className={styles.mediaPreviewCard}>
              <label className={styles.label}>
                <i className="fa-regular fa-image" style={{ color: 'var(--accent)' }}></i> 首頁背景圖片 (Wallpaper)
              </label>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Background Preview"
                  className={styles.mediaPreviewImage}
                />
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`${styles.btn} ${styles.btnSecondary}`}
                style={{ fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-arrow-up-from-bracket"></i> 選擇新背景大圖
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {successMessage && (
            <div className={styles.successBanner}>
              <i className="fa-solid fa-circle-check"></i>
              <span>{successMessage}</span>
            </div>
          )}
          <button type="submit" disabled={loading} className={`${styles.btn} ${styles.btnPrimary}`}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> 儲存中...
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i> 儲存主畫面設定
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

