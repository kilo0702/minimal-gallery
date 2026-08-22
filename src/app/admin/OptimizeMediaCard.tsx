'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';

interface ScanData {
  legacyImageCount: number;
  totalLegacyBytes: number;
  needsOptimization: boolean;
}

interface OptResult {
  convertedCount: number;
  totalOriginalBytes: number;
  totalNewBytes: number;
  savedBytes: number;
  errors: string[];
}

export default function OptimizeMediaCard() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [result, setResult] = useState<OptResult | null>(null);

  const checkStatus = async () => {
    try {
      setChecking(true);
      const res = await fetch('/api/admin/optimize');
      if (res.ok) {
        const data = await res.json();
        setScanData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleOptimize = async () => {
    try {
      setLoading(true);
      setResult(null);
      const res = await fetch('/api/admin/optimize', { method: 'POST' });
      if (res.ok) {
        const data: OptResult = await res.json();
        setResult(data);
        await checkStatus();
      } else {
        alert('轉換圖片時發生錯誤');
      }
    } catch (err) {
      console.error(err);
      alert('無法連接最佳化 API');
    } finally {
      setLoading(false);
    }
  };

  const formatMB = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className={styles.sectionCard} style={{ marginTop: '1.25rem', borderLeft: '4px solid var(--accent)' }}>
      <div className={styles.sectionHeader} style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div className={styles.sectionTitleGroup}>
          <div className={styles.sectionTitleIcon} style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent)' }}>
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              媒體自檢與 WebP 最佳化
              {checking ? (
                <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.7 }}>
                  <i className="fa-solid fa-spinner fa-spin"></i> 檢測中...
                </span>
              ) : scanData?.needsOptimization ? (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(234, 179, 8, 0.2)',
                  color: '#eab308'
                }}>
                  發現 {scanData.legacyImageCount} 張未最佳化圖片 ({formatMB(scanData.totalLegacyBytes)})
                </span>
              ) : (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#22c55e'
                }}>
                  <i className="fa-solid fa-check"></i> 全站圖片均已是 WebP 格式
                </span>
              )}
            </h2>
            <p className={styles.sectionDesc}>
              自動掃描現有非 WebP 格式照片（JPG / PNG 等），一鍵轉為現代 WebP 格式並自動更新資料庫關聯
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleOptimize}
            disabled={loading || checking || !scanData?.needsOptimization}
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{
              opacity: (!scanData?.needsOptimization && !loading) ? 0.6 : 1,
              cursor: (!scanData?.needsOptimization && !loading) ? 'default' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> 轉換最佳化中...
              </>
            ) : (
              <>
                <i className="fa-solid fa-bolt-lightning"></i> 一鍵全數轉為 WebP
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          borderRadius: '12px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: 'var(--foreground)',
          fontSize: '0.9rem'
        }}>
          <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-circle-check"></i> 最佳化完成！
          </div>
          <div>
            共成功轉換 <strong>{result.convertedCount}</strong> 張圖片，原本體積 <strong>{formatMB(result.totalOriginalBytes)}</strong> 壓縮為 <strong>{formatMB(result.totalNewBytes)}</strong>，為您節省了 <strong>{formatMB(result.savedBytes)}</strong> 空間！
          </div>
        </div>
      )}
    </div>
  );
}
