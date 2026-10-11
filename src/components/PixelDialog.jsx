import React, { useEffect, useRef } from 'react';

// 🌟 像素風對話框：取代瀏覽器原生的 confirm／alert，風格才不會斷掉
// 按 Esc 或點背景會呼叫 onClose；打開時自動聚焦（data-autofocus 優先，否則第一顆按鈕）
const PixelDialog = ({ title, children, actions, onClose }) => {
  const panelRef = useRef(null);
  // 用 ref 記住最新的 onClose，父元件每次重繪傳進新函式時才不會重複搶焦點
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const focusables = () => [...panel.querySelectorAll('button:not([disabled]), select, [href], [tabindex]:not([tabindex="-1"])')];

    // 有標 data-autofocus 的按鈕優先（例如購買時先停在「再想想」，避免按 Enter 就直接花錢）
    (panel.querySelector('[data-autofocus]') || focusables()[0])?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
      // Tab 只在對話框裡面繞圈，不會跑到背後的頁面
      if (e.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);

    // 打開時鎖住背景捲動，關掉後把焦點還給原本的按鈕
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pixel-card pixel-dialog"
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.body}>{children}</div>
        <div style={styles.actions}>{actions}</div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 3000,
    backgroundColor: 'rgba(74, 74, 74, 0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  panel: {
    width: '100%', maxWidth: '400px', padding: '20px',
    fontFamily: '"tearsfont-1.2", "Microsoft JhengHei", sans-serif',
    color: '#4a4a4a', textAlign: 'center',
  },
  title: { margin: '0 0 12px', fontSize: '1.5rem', borderBottom: '4px dashed #4a4a4a', paddingBottom: '10px' },
  body: { fontSize: '1.15rem', lineHeight: 1.5, marginBottom: '18px' },
  actions: { display: 'flex', flexDirection: 'column', gap: '12px' },
};

export default PixelDialog;
