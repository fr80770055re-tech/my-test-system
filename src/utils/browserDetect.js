// 判斷目前是不是被「內嵌瀏覽器」（LINE、Facebook、Instagram、微信、Android 系統 WebView 等）打開。
// Google 登入會主動封鎖這類內嵌瀏覽器（回傳 disallowed_useragent 錯誤導致登入失敗），
// 常見情境：從 LINE/FB 訊息點連結，或是用某些「QR Code 掃描」App 掃出來、直接用它內建的瀏覽器開啟。
export function isEmbeddedInAppBrowser() {
  const ua = navigator.userAgent || '';

  // 已知會用內嵌瀏覽器開連結、且會被 Google 擋下登入的 App
  const knownInAppPatterns = [
    /Line/i,             // LINE
    /FBAN|FBAV/i,        // Facebook / Messenger
    /Instagram/i,
    /MicroMessenger/i,   // 微信
    /KAKAOTALK/i,
    /NAVER/i,
  ];
  if (knownInAppPatterns.some((re) => re.test(ua))) return true;

  // Android 系統 WebView 的通用標記：很多「QR Code 掃描」App 是直接用系統 WebView 開連結，
  // User-Agent 會帶有 "; wv)"（例如：Mozilla/5.0 (Linux; Android 12; ... ; wv) ...）
  if (/Android/i.test(ua) && /; ?wv\)/i.test(ua)) return true;

  return false;
}

// 判斷是不是手機/平板。
// 新版 iPadOS（13 以後）預設會把 User-Agent 偽裝成桌機版 Mac Safari，
// 單靠 UA 字串會誤判成「電腦」，必須額外用「支援多點觸控的 MacIntel」這個特徵抓出來。
export function isMobileOrTablet() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return false;
}
