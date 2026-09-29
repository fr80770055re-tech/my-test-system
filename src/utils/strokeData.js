// 讀取 public/strokes/<Unicode>.json（教育部標準筆順），同一個字只下載一次；網址帶版本號，可長期快取
const cache = new Map();

export function loadStrokes(char) {
  if (!cache.has(char)) {
    const hex = char.codePointAt(0).toString(16);
    cache.set(char, fetch(`${import.meta.env.BASE_URL}strokes/${hex}.json?v=${__APP_VERSION__}`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null));
  }
  return cache.get(char);
}
