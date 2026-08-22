'use client';

import { useState } from 'react';
import styles from './admin.module.css';

export default function MarqueeSettingForm({ initialText }: { initialText: string }) {
  const [marqueeText, setMarqueeText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'marqueeText', value: marqueeText }),
      });

      if (res.ok) {
        setSuccessMessage('跑馬燈文字已成功儲存！');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('儲存失敗');
      }
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
            <i className="fa-solid fa-bullhorn"></i>
          </div>
          <div>
            <h2 className={styles.sectionTitle}>跑馬燈即時公告 (Marquee Announcement)</h2>
            <p className={styles.sectionDesc}>顯示於首頁頂部的橫向捲動廣播文字</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="marqueeText">
            <i className="fa-solid fa-message" style={{ color: 'var(--accent)' }}></i> 公告文字內容
          </label>
          <input
            id="marqueeText"
            type="text"
            value={marqueeText}
            onChange={(e) => setMarqueeText(e.target.value)}
            className={styles.input}
            placeholder="請輸入跑馬燈顯示的文字或最新消息..."
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            {successMessage && (
              <div className={styles.successBanner}>
                <i className="fa-solid fa-circle-check"></i>
                <span>{successMessage}</span>
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} className={`${styles.btn} ${styles.btnPrimary}`}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> 儲存中...
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i> 儲存跑馬燈
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

