import { useEffect, useState } from 'react';

// 🌟 判斷目前是不是手機寬度，畫面旋轉或縮放視窗時會即時更新
const MOBILE_QUERY = '(max-width: 768px)';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
