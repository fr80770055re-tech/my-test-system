// 讀取 public/dict/ 依等級切開的字典（由 scripts/build-dict.js 產生），同一個檔案只下載一次。
// 網址帶版本號：部署新版本時自動換新，平常則可長期快取。
const LEVEL_BOUNDS = [1000, 2500, Infinity];
const cache = new Map();

function fetchJson(name) {
  if (!cache.has(name)) {
    const request = fetch(`${import.meta.env.BASE_URL}dict/${name}?v=${__APP_VERSION__}`)
      .then((res) => {
        if (!res.ok) throw new Error(`字典載入失敗：${name}（HTTP ${res.status}）`);
        return res.json();
      })
      .catch((error) => {
        cache.delete(name);
        throw error;
      });
    cache.set(name, request);
  }
  return cache.get(name);
}

// maxRank：這一局最多會用到第幾個字（含錯誤選項），只下載涵蓋到這裡的等級
export async function loadDict(maxRank) {
  const levels = LEVEL_BOUNDS.findIndex((bound) => maxRank <= bound) + 1;
  const [words, ...parts] = await Promise.all([
    fetchJson('words.json'),
    ...Array.from({ length: levels }, (_, i) => fetchJson(`level-${i + 1}.json`)),
  ]);
  return { dict: Object.assign({}, ...parts), words: new Set(words) };
}
