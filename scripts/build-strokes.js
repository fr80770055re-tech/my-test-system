// 下載教育部《常用國字標準字體筆順》資料（g0v/zh-stroke-data 整理自 stroke-order.learningweb.moe.edu.tw），
// 轉成精簡格式存到 public/strokes/<Unicode 十六進位>.json，識字修練場翻字卡時再按需載入。
// 用法：node scripts/build-strokes.js   （下載過的原始檔會快取，重跑不會重抓）
//
// 輸出格式：[{ d: "M.. L.. Q.. Z", t: [[x, y, size], ...] }, ...]，座標系 2048×2048
//   d：該筆畫的外框（用來裁切），t：筆畫中心線軌跡（用來做描寫動畫）
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { VOCAB_LIST } from '../src/data/vocabdata.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = resolve(__dirname, '.moedict-cache/strokes-raw');
const OUT_DIR = resolve(__dirname, '../public/strokes');
const REPO = 'g0v/zh-stroke-data';
const CONCURRENCY = 8;

mkdirSync(RAW_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const hexOf = (char) => char.codePointAt(0).toString(16);
const n = (v) => Math.round(v);

function toPath(outline) {
  return outline.map((c) => {
    if (c.type === 'M' || c.type === 'L') return `${c.type}${n(c.x)} ${n(c.y)}`;
    if (c.type === 'Q') return `Q${n(c.begin.x)} ${n(c.begin.y)} ${n(c.end.x)} ${n(c.end.y)}`;
    if (c.type === 'C') return `C${n(c.begin.x)} ${n(c.begin.y)} ${n(c.mid.x)} ${n(c.mid.y)} ${n(c.end.x)} ${n(c.end.y)}`;
    throw new Error(`未知的路徑指令 ${c.type}`);
  }).join('') + 'Z';
}

async function getAvailable() {
  const cache = resolve(RAW_DIR, '_tree.json');
  if (!existsSync(cache)) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/git/trees/master?recursive=1`);
    if (!res.ok) throw new Error(`無法取得檔案清單：HTTP ${res.status}`);
    writeFileSync(cache, await res.text());
  }
  const tree = JSON.parse(readFileSync(cache, 'utf-8'));
  return new Set(tree.tree.map((f) => f.path.match(/^json\/([0-9a-f]+)\.json$/)?.[1]).filter(Boolean));
}

async function getRaw(hex) {
  const cache = resolve(RAW_DIR, `${hex}.json`);
  if (existsSync(cache)) return JSON.parse(readFileSync(cache, 'utf-8'));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${REPO}/master/json/${hex}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      writeFileSync(cache, text);
      return JSON.parse(text);
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

const available = await getAvailable();
const chars = [...new Set(VOCAB_LIST)];
const targets = chars.filter((c) => available.has(hexOf(c)));
const failed = [];
let next = 0, done = 0;

async function worker() {
  while (next < targets.length) {
    const char = targets[next++];
    const hex = hexOf(char);
    try {
      const raw = await getRaw(hex);
      const strokes = raw.map((s) => ({ d: toPath(s.outline), t: s.track.map((p) => [n(p.x), n(p.y), p.size ?? 0]) }));
      writeFileSync(resolve(OUT_DIR, `${hex}.json`), JSON.stringify(strokes));
    } catch (err) {
      failed.push(`${char}（${err.message}）`);
    }
    if (++done % 500 === 0) console.log(`已處理 ${done}/${targets.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const files = readdirSync(OUT_DIR).filter((f) => f.endsWith('.json'));
const totalKB = Math.round(files.reduce((sum, f) => sum + statSync(resolve(OUT_DIR, f)).size, 0) / 1024);
const noStroke = chars.filter((c) => !available.has(hexOf(c)));

console.log(`\n完成：字庫 ${chars.length} 字，有標準筆順 ${files.length} 字，共 ${totalKB} KB`);
console.log(`教育部筆順資料未收錄：${noStroke.length} 字`);
if (failed.length) console.log(`下載或轉換失敗：${failed.join('、')}`);
