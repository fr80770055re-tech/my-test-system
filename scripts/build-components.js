// 建立「部件花瓣」資料：找出每個字所屬的部件家族（例如 晴、清、請、情 都含有「青」），
// 並記下共同部件在該字筆順中是第幾筆到第幾筆，讓畫面能把共同部件和不同部件塗成不同顏色。
// 資料來源：CNS11643 全字庫開放資料（部件拆解、筆順序列、Unicode 對照；政府資料開放授權條款第 1 版）
// 需先執行 build-dict.js 與 build-strokes.js。用法：node scripts/build-components.js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { VOCAB_LIST } from '../src/data/vocabdata.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, '.moedict-cache/cns');
const STROKES_DIR = resolve(__dirname, '../public/strokes');
const DICT = JSON.parse(readFileSync(resolve(__dirname, '../src/data/dictData.json'), 'utf-8'));
const OUT_JSON = resolve(__dirname, '../src/data/componentData.json');
const MAX_MEMBERS = 16;

mkdirSync(CACHE_DIR, { recursive: true });

function cnsFile(zipName, member) {
  const zip = resolve(CACHE_DIR, zipName);
  if (!existsSync(zip)) execFileSync('curl', ['-sL', '-o', zip, `https://www.cns11643.gov.tw/opendata/${zipName}`]);
  return execFileSync('unzip', ['-p', zip, member], { maxBuffer: 256 * 1024 * 1024 }).toString('utf-8');
}

const tsv = (text) => text.split(/\r?\n/).map((l) => l.split('\t')).filter((p) => p.length >= 2);

const unicodeToCns = new Map();
for (const member of ['Unicode/CNS2UNICODE_Unicode BMP.txt', 'Unicode/CNS2UNICODE_Unicode 2.txt']) {
  for (const [cns, hex] of tsv(cnsFile('MapingTables.zip', member))) {
    const ch = String.fromCodePoint(parseInt(hex, 16));
    if (!unicodeToCns.has(ch)) unicodeToCns.set(ch, cns);
  }
}
const componentsOf = new Map(tsv(cnsFile('Properties.zip', 'CNS_component.txt')).map(([cns, list]) => [cns, list.trim().split(',')]));
const strokeSeqOf = new Map(tsv(cnsFile('Properties.zip', 'CNS_strokes_sequence.txt')).map(([cns, seq]) => [cns, seq.trim()]));

const chars = [...new Set(VOCAB_LIST)];
const rank = new Map(chars.map((c, i) => [c, i]));
const INITIALS = /^[ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ]/;
const body = (b) => b.replace(/^˙/, '').replace(/[ˊˇˋ]$/, '');
// 韻母相同就視為聲音相近（包ㄅㄠ／跑ㄆㄠ、可ㄎㄜ／河ㄏㄜ），這類形聲字家族最適合一起學
const finals = (c) => new Set((DICT[c]?.readings || []).map((r) => body(r.bopomofo).replace(INITIALS, '')));
const soundsAlike = (a, b) => [...finals(a)].some((f) => f && finals(b).has(f));

// 只收教育部筆順資料存在、且筆畫數與全字庫一致的字，確保塗色位置正確
const info = new Map();
for (const c of chars) {
  const cns = unicodeToCns.get(c);
  const comps = cns && componentsOf.get(cns);
  const seq = cns && strokeSeqOf.get(cns);
  const strokeFile = resolve(STROKES_DIR, `${c.codePointAt(0).toString(16)}.json`);
  if (!comps || !seq || !existsSync(strokeFile)) continue;
  if (JSON.parse(readFileSync(strokeFile, 'utf-8')).length !== seq.length) continue;
  info.set(c, { comps, seq });
}

const byCompKey = new Map();
for (const [c, { comps }] of info) {
  const key = comps.join(',');
  if (!byCompKey.has(key)) byCompKey.set(key, []);
  byCompKey.get(key).push(c);
}

// 找出 C 裡面「剛好是另一個常用字 K」的部件，並定位 K 在 C 筆順中的位置
function containedKeys(c) {
  const { comps, seq } = info.get(c);
  const found = [];
  for (let start = 0; start < comps.length; start++) {
    for (let end = start + 1; end <= comps.length; end++) {
      if (end - start === comps.length) continue;
      for (const k of byCompKey.get(comps.slice(start, end).join(',')) || []) {
        if (k === c) continue;
        const kSeq = info.get(k).seq;
        if (kSeq.length < 2) continue;
        const at = start === 0 ? seq.indexOf(kSeq) : seq.lastIndexOf(kSeq);
        if (at >= 0) found.push({ key: k, range: [at, at + kSeq.length - 1], compLen: end - start });
      }
    }
  }
  return found;
}

const families = new Map();
const candidates = new Map();
for (const c of info.keys()) {
  const found = containedKeys(c);
  candidates.set(c, found);
  for (const { key, range } of found) {
    if (!families.has(key)) families.set(key, new Map());
    if (!families.get(key).has(c)) families.get(key).set(c, [c, ...range]);
  }
}

// 每個字選一個最適合教學的家族：優先同聲旁（讀音相近，如 青→晴），再看家族大小、部件字常不常用
const keyOf = {};
for (const [c, found] of candidates) {
  let best = null;
  let bestScore = -Infinity;
  for (const f of found) {
    const size = [...families.get(f.key).keys()].filter((m) => rank.get(m) < 2500).length;
    if (size < 3) continue;
    // 同聲旁最優先；部件越具體（部件數、筆畫多）越好；成員上百的部首型家族（口、木…）太籠統，扣分
    const score = (soundsAlike(f.key, c) ? 1000 : 0)
      + Math.min(size, 12) * 5
      + f.compLen * 20
      + info.get(f.key).seq.length * 3
      - (size > 40 ? 300 : 0)
      - rank.get(f.key) / 100;
    if (score > bestScore) { bestScore = score; best = f.key; }
  }
  if (best) keyOf[c] = best;
}

const usedKeys = new Set(Object.values(keyOf));
const familyOut = {};
for (const k of usedKeys) {
  familyOut[k] = [...families.get(k).values()].sort((a, b) => rank.get(a[0]) - rank.get(b[0])).slice(0, MAX_MEMBERS);
}

writeFileSync(OUT_JSON, JSON.stringify({ keyOf, families: familyOut }));

const levelCoverage = (from, to) => chars.slice(from, to).filter((c) => keyOf[c]).length;
console.log(`部件資料：可比對 ${info.size} 字，有部件家族的字 ${Object.keys(keyOf).length} 字，家族數 ${usedKeys.size}`);
console.log(`涵蓋：初階 ${levelCoverage(0, 1000)}/1000、中階 ${levelCoverage(1000, 2500)}/1500、高階 ${levelCoverage(2500, chars.length)}/${chars.length - 2500}`);
for (const c of ['晴', '跑', '河', '想', '做', '媽', '洋', '的', '他', '們', '請', '樣', '紅', '放']) {
  const k = keyOf[c];
  console.log(`${c} → 「${k}」家族：${k ? familyOut[k].map(([m]) => m).join('') : '（無）'}`);
}
