import { useEffect, useState } from 'react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 每 5 分鐘檢查一次，適合學校端長開分頁的情境

// 定期輪詢 /version.json，跟這次載入頁面時打包進來的 __APP_VERSION__ 比對，
// 偵測到不一樣（代表老師已經部署新版本）就回傳 true，讓畫面顯示「有新版本」的提示條。
export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.version && data.version !== __APP_VERSION__) {
          setHasUpdate(true);
        }
      } catch {
        // 沒連上網或伺服器暫時失敗就先略過，等下一次輪詢再試
      }
    };

    const intervalId = setInterval(checkVersion, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return hasUpdate;
}
