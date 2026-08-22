'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('確定要刪除這篇內容嗎？此動作無法復原。')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('刪除失敗');
      }
    } catch (err) {
      console.error(err);
      alert('刪除時發生錯誤');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
      title="刪除"
    >
      {deleting ? (
        <i className="fa-solid fa-spinner fa-spin"></i>
      ) : (
        <i className="fa-solid fa-trash"></i>
      )}
    </button>
  );
}

