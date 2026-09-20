// 每次執行 build 前自動產生一個新的版本標記，寫進 public/version.json。
// 前端會定期輪詢這個檔案，跟自己載入當下記住的版本比對，
// 不一樣就代表老師已經部署新版本，藉此提示「長開分頁」的使用者重新整理。
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = new Date().toISOString();
const outPath = resolve(__dirname, '../public/version.json');

writeFileSync(outPath, JSON.stringify({ version }));
console.log(`[generate-version] 已產生新版本標記：${version}`);
