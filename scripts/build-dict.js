// 一次性把字庫 (src/data/vocabdata.js) 的每個字查好，存成 src/data/dictData.json，
// 並把仍查不到注音的字列成 scripts/dict-missing.csv 供老師手動補齊。
// 用法：node scripts/build-dict.js   （查過的結果會存在快取，中斷後重跑會接續進度）
//
// 資料來源優先順序（每筆讀音都會標 source）：
//   moedict     教育部《重編國語辭典修訂本》（經萌典 API）
//   variant     萌典標示為異體字者，借用正字的讀音與字義
//   crossStrait 教育部《兩岸常用詞典》（經萌典 API）
//   unihan      Unicode Unihan 資料庫 kMandarin（僅有讀音，無字義）
//   manual      老師在 dict-missing.csv 手動填寫
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { VOCAB_LIST } from '../src/data/vocabdata.js';
import { pinyinToZhuyin } from './pinyin-to-zhuyin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, '.moedict-cache');
const OUT_JSON = resolve(__dirname, '../src/data/dictData.json');
// 網站實際讀取的是 public/dict/ 底下依等級切開的精簡版，開局只下載需要的部分
const PUBLIC_DICT_DIR = resolve(__dirname, '../public/dict');
const DICT_LEVEL_BOUNDS = [1000, 2500, Infinity];
const MANUAL_JSON = resolve(__dirname, '../src/data/dictManual.json');
const MISSING_CSV = resolve(__dirname, 'dict-missing.csv');
const CONCURRENCY = 4;
const MAX_DEFS = 5;

mkdirSync(CACHE_DIR, { recursive: true });

const clean = (s) => (s || '').replace(/[`~]/g, '').trim();

async function fetchJson(kind, char) {
  const cacheFile = resolve(CACHE_DIR, `${kind === 'a' ? '' : kind + '-'}${char.codePointAt(0).toString(16)}.json`);
  if (existsSync(cacheFile)) return JSON.parse(readFileSync(cacheFile, 'utf-8'));

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://www.moedict.tw/${kind}/${encodeURIComponent(char)}.json`);
      let result;
      if (res.status === 404) result = { status: 'notfound' };
      else if (res.ok) result = { status: 'ok', data: await res.json() };
      else throw new Error(`HTTP ${res.status}`);
      writeFileSync(cacheFile, JSON.stringify(result));
      return result;
    } catch (err) {
      if (attempt === 3) return { status: 'error', error: String(err) };
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// 從例句「…」中抽出含有該字的詞語，之後做花瓣識字的花瓣用
function extractWords(char, heteronyms) {
  const words = [];
  for (const h of heteronyms) {
    for (const d of h.d || []) {
      for (const ex of d.e || []) {
        for (const m of clean(ex).matchAll(/「([^」]{2,6})」/g)) {
          if (m[1].includes(char) && !words.includes(m[1])) words.push(m[1]);
        }
      }
    }
  }
  return words.slice(0, 8);
}

function toEntry(char, data, source) {
  const heteronyms = (data.h || []).filter((h) => h.b);
  return {
    radical: clean(data.r),
    strokes: data.c ?? null,
    // 兩岸常用詞典會寫成「臺灣音<br>陸⃝大陸音」，只取臺灣音
    readings: heteronyms.map((h) => ({
      bopomofo: clean(h.b).split('<br>')[0],
      pinyin: clean(h.p).split('<br>')[0],
      source,
      defs: (h.d || []).filter((d) => d.f).slice(0, MAX_DEFS).map((d) => ({
        type: clean(d.type),
        def: clean(d.f),
        example: clean((d.e || [])[0]),
      })),
    })),
    words: extractWords(char, heteronyms),
  };
}

// 萌典對異體字（如「峯」）只寫「「峰」的異體字。」而沒有注音，找出它對應的正字
function findStandardForm(data) {
  for (const h of data.h || []) {
    for (const d of h.d || []) {
      const m = clean(d.f).match(/^「(.)」的異體字/u);
      if (m) return m[1];
    }
  }
  return null;
}

// Unihan kMandarin：若有兩個值，第一個是大陸慣用、第二個是臺灣慣用，優先取臺灣
function loadUnihan() {
  const txt = resolve(CACHE_DIR, 'Unihan_Readings.txt');
  if (!existsSync(txt)) {
    const zip = resolve(CACHE_DIR, 'Unihan.zip');
    execFileSync('curl', ['-sL', '-o', zip, 'https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip']);
    writeFileSync(txt, execFileSync('unzip', ['-p', zip, 'Unihan_Readings.txt'], { maxBuffer: 64 * 1024 * 1024 }));
  }
  const map = {};
  for (const line of readFileSync(txt, 'utf-8').split('\n')) {
    const m = line.match(/^U\+([0-9A-F]+)\tkMandarin\t(.+)$/);
    if (m) {
      const values = m[2].trim().split(/\s+/);
      map[String.fromCodePoint(parseInt(m[1], 16))] = values[values.length - 1];
    }
  }
  return map;
}

// 教育部《國語小字典》（國小程度，CC BY-ND 3.0 TW）：字義、例詞比《重編國語辭典》淺白，
// 且解釋文字裡每個字都依上下文標注讀音，可用來統計多音字「最常用的讀音」。
const MINI_URL = 'https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/download/dict_mini_2019_20260626.zip';

const decodeXml = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&amp;/g, '&');

function loadMiniDict() {
  const zip = resolve(CACHE_DIR, 'dict_mini.zip');
  const xlsx = resolve(CACHE_DIR, 'dict_mini.xlsx');
  if (!existsSync(xlsx)) {
    execFileSync('curl', ['-sL', '-o', zip, MINI_URL]);
    writeFileSync(xlsx, execFileSync('unzip', ['-p', zip, '*.xlsx'], { maxBuffer: 64 * 1024 * 1024 }));
  }
  const read = (part) => execFileSync('unzip', ['-p', xlsx, part], { maxBuffer: 64 * 1024 * 1024 }).toString('utf-8');

  const shared = [...read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map((m) => decodeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const rows = [...read('xl/worksheets/sheet1.xml').matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((row) => {
    const cells = {};
    for (const c of row[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = (c[3] || '').match(/<v>([\s\S]*?)<\/v>/)?.[1];
      const inline = (c[3] || '').match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
      cells[c[1]] = c[2].includes('t="s"') ? shared[Number(v)] : decodeXml(inline ?? v ?? '');
    }
    return cells;
  });

  const header = rows[0];
  const col = (name) => Object.keys(header).find((k) => header[k] === name);
  const [cChar, cBopo, cText] = [col('單字'), col('注音'), col('解釋')];
  const byChar = {};
  const tally = {};
  for (const row of rows.slice(1)) {
    const char = (row[cChar] || '').trim();
    const text = row[cText] || '';
    if (!char) continue;
    (byChar[char] ||= []).push({ bopomofo: (row[cBopo] || '').trim(), text });
    for (const m of text.matchAll(/&&(\p{Script=Han})(˙?[ㄅ-ㄩ]+[ˊˇˋ]?)/gu)) {
      const t = (tally[m[1]] ||= {});
      t[m[2]] = (t[m[2]] || 0) + 1;
    }
  }
  return { byChar, tally };
}

// 去掉「&&字ㄗˋ&&」這種逐字注音標記，只留文字
const stripAnnotation = (s) => s.replace(/&&(\p{Script=Han})˙?[ㄅ-ㄩ]*[ˊˇˋ]?/gu, '$1').replace(/&&/g, '').trim();

function parseMiniDefs(text) {
  return stripAnnotation(text).split(/\r?\n/).map((line) => line.replace(/^\(\d+\)\s*/, '').trim()).filter(Boolean)
    .slice(0, MAX_DEFS)
    .map((line) => {
      const i = line.indexOf('如：');
      return i < 0 ? { type: '', def: line, example: '' } : { type: '', def: line.slice(0, i).trim(), example: line.slice(i).trim() };
    });
}

function miniWords(char, rows) {
  const words = [];
  for (const row of rows) {
    for (const m of stripAnnotation(row.text).matchAll(/「([^」]+)」/g)) {
      const w = m[1];
      if (w.includes(char) && w.length >= 2 && w.length <= 4 && !/[？！，。、：；…]/.test(w) && !words.includes(w)) words.push(w);
    }
  }
  return words.slice(0, 12);
}

// 用小字典字義取代同讀音的字義、補上小字典獨有的讀音，並把「最常用讀音」排到第一個
function enrich(char, entry, mini, unihan) {
  const rows = mini.byChar[char] || [];
  const readings = entry.readings.map((r) => {
    const row = rows.find((x) => x.bopomofo === r.bopomofo);
    return row ? { ...r, defs: parseMiniDefs(row.text), defSource: 'mini' } : r;
  });
  for (const row of rows) {
    if (row.bopomofo && !readings.some((r) => r.bopomofo === row.bopomofo)) {
      readings.push({ bopomofo: row.bopomofo, pinyin: '', source: 'mini', defs: parseMiniDefs(row.text), defSource: 'mini' });
    }
  }

  const counts = mini.tally[char] || {};
  const unihanZhuyin = unihan[char] && pinyinToZhuyin(unihan[char]);
  const score = (r) => (counts[r.bopomofo] || 0) * 10 + (r.bopomofo === unihanZhuyin ? 1 : 0);
  const best = readings.reduce((top, r) => (score(r) > score(top) ? r : top), readings[0]);
  const ordered = [best, ...readings.filter((r) => r !== best)];

  // 例詞先列最常用讀音的詞，花瓣／填空題較貼近學生熟悉的用法
  const words = miniWords(char, [...rows].sort((a, b) => (b.bopomofo === best.bopomofo) - (a.bopomofo === best.bopomofo)));
  return words.length > 0
    ? { ...entry, readings: ordered, words, kidWords: true }
    : { ...entry, readings: ordered, kidWords: false };
}

// 萌典完全沒收、但確定是異體字的字，直接指定正字
const KNOWN_VARIANTS = { 污: '汙' };

async function resolveChar(char, unihan) {
  const a = await fetchJson('a', char);
  if (a.status === 'error') return { error: `連線失敗（${a.error}）` };

  if (a.status === 'ok' || KNOWN_VARIANTS[char]) {
    const entry = a.status === 'ok' ? toEntry(char, a.data, 'moedict') : { radical: '', strokes: null, readings: [], words: [] };
    if (entry.readings.length > 0) return { entry };

    const standard = KNOWN_VARIANTS[char] || findStandardForm(a.data);
    if (standard) {
      const s = await fetchJson('a', standard);
      if (s.status === 'ok') {
        const std = toEntry(standard, s.data, 'variant');
        if (std.readings.length > 0) return { entry: { ...entry, readings: std.readings, words: std.words, variantOf: standard } };
      }
    }
  }

  const c = await fetchJson('c', char);
  if (c.status === 'ok') {
    const entry = toEntry(char, c.data, 'crossStrait');
    if (entry.readings.length > 0) return { entry };
  }

  const py = unihan[char];
  const zy = py && pinyinToZhuyin(py);
  if (zy) {
    return { entry: { radical: '', strokes: null, readings: [{ bopomofo: zy, pinyin: py, source: 'unihan', defs: [] }], words: [] } };
  }
  return { error: '所有資料來源都查不到注音' };
}

const chars = [...new Set(VOCAB_LIST)];
const unihan = loadUnihan();
const mini = loadMiniDict();
const manual = existsSync(MANUAL_JSON) ? JSON.parse(readFileSync(MANUAL_JSON, 'utf-8')) : {};

// 老師在 dict-missing.csv 填好的注音／常用詞，先收進 dictManual.json，避免下面重寫 CSV 時被清掉
if (existsSync(MISSING_CSV)) {
  const rows = readFileSync(MISSING_CSV, 'utf-8').replace(/^\uFEFF/, '').split(/\r?\n/).slice(1);
  for (const row of rows) {
    const [, char, , bopomofo = '', words = ''] = row.split(',').map((s) => s.trim());
    if (!char || !bopomofo) continue;
    manual[char] = {
      radical: '',
      strokes: null,
      readings: bopomofo.split('/').map((b) => b.trim()).filter(Boolean)
        .map((b) => ({ bopomofo: b, pinyin: '', source: 'manual', defs: [] })),
      words: words.split('、').map((w) => w.trim()).filter(Boolean),
    };
  }
}
writeFileSync(MANUAL_JSON, JSON.stringify(manual, null, 2) + '\n');

const results = new Array(chars.length);
let next = 0, done = 0;
async function worker() {
  while (next < chars.length) {
    const i = next++;
    results[i] = manual[chars[i]] ? { entry: manual[chars[i]] } : await resolveChar(chars[i], unihan);
    if (++done % 500 === 0) console.log(`已處理 ${done}/${chars.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const dict = {};
const missing = [];
const bySource = {};
chars.forEach((char, i) => {
  const { entry, error } = results[i];
  if (error) { missing.push([VOCAB_LIST.indexOf(char) + 1, char, error]); return; }
  dict[char] = enrich(char, entry, mini, unihan);
  const src = entry.readings[0].source;
  bySource[src] = (bySource[src] || 0) + 1;
});

writeFileSync(OUT_JSON, JSON.stringify(dict));

// 精簡版：去掉畫面用不到的拼音、每個讀音只留 3 個字義、例詞只留 8 個
const slim = (e) => ({
  ...e,
  readings: e.readings.map(({ pinyin, ...r }) => ({ ...r, defs: r.defs.slice(0, 3) })), // eslint-disable-line no-unused-vars
  words: e.words.slice(0, 8),
});
mkdirSync(PUBLIC_DICT_DIR, { recursive: true });
let from = 0;
DICT_LEVEL_BOUNDS.forEach((to, i) => {
  const part = Object.fromEntries(chars.slice(from, to).filter((c) => dict[c]).map((c) => [c, slim(dict[c])]));
  writeFileSync(resolve(PUBLIC_DICT_DIR, `level-${i + 1}.json`), JSON.stringify(part));
  from = to;
});
// 出題時用來排除「換個字也能成詞」的錯誤選項，只需要 2–4 字的詞
const allWords = [...new Set(Object.values(dict).flatMap((e) => e.words))].filter((w) => w.length >= 2 && w.length <= 4);
writeFileSync(resolve(PUBLIC_DICT_DIR, 'words.json'), JSON.stringify(allWords));

const csv = ['字頻,字,原因,注音(請填，多音以 / 分隔),常用詞(請填，以、分隔)']
  .concat(missing.map(([rank, char, reason]) => `${rank},${char},${reason},,`))
  .join('\n');
writeFileSync(MISSING_CSV, '\uFEFF' + csv); // 加 BOM，Excel 開啟中文才不會亂碼

const entries = Object.values(dict);
console.log(`\n完成：共 ${chars.length} 字，成功 ${Object.keys(dict).length} 字，仍缺 ${missing.length} 字`);
console.log('讀音來源：', bySource);
console.log(`字義採用國語小字典：${entries.filter((e) => e.readings.some((r) => r.defSource === 'mini')).length} 字`);
console.log(`有國小程度例詞（可出詞語填空）：${entries.filter((e) => e.kidWords).length} 字`);
console.log(`完全沒有例詞：${entries.filter((e) => e.words.length === 0).length} 字`);
