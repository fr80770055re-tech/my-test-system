// 識字修練場出題：四種題型，錯誤選項刻意挑「容易搞混但一定是錯的」答案。
//   reading 看字選音（主力題型）：錯誤選項優先用同音不同調（ㄊㄜˋ → ㄊㄜˊ、ㄊㄜˇ）
//   word    造詞填空（主力題型）：錯誤選項優先用同音、同部首的字，並排除能組成其他常見詞的字
//   char    看音選字：錯誤選項優先用同部首的字，並排除所有同音字，避免一題兩解
//   flower  部件花瓣：花心是共同部件（如「青」），選項全是同家族的字（晴清請情），靠讀音與造詞分辨
import { shuffle } from './vocabProgress.js';

const TONE_MARKS = ['ˊ', 'ˇ', 'ˋ'];
// 讀音與造詞是識字量測驗的主要題型，各占四成
const TYPE_WEIGHTS = { reading: 4, word: 4, char: 1, flower: 1 };
const MAX_CONTEXT_PETALS = 5;
const INITIALS = /^[ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ]/;
// 「慢慢的走／慢慢地走」兩種寫法都可接受，這兩個字不能互當錯誤選項
const INTERCHANGEABLE = [['的', '地']];
const interchangeable = (a, b) => INTERCHANGEABLE.some((pair) => pair.includes(a) && pair.includes(b));
// 詞語填空只用《國語小字典》的國小程度例詞，避免出現文言或罕用詞
const kidWords = (entry) => (entry.kidWords ? entry.words.filter((w) => w.length >= 2 && w.length <= 4) : []);

export function splitTone(bopomofo) {
  if (bopomofo.startsWith('˙')) return { body: bopomofo.slice(1), tone: '˙' };
  const last = bopomofo.slice(-1);
  return TONE_MARKS.includes(last) ? { body: bopomofo.slice(0, -1), tone: last } : { body: bopomofo, tone: '' };
}

const primaryReading = (entry) => entry.readings[0].bopomofo;
const finalOf = (bopomofo) => splitTone(bopomofo).body.replace(INITIALS, '');
const soundsAlike = (a, b) => a.readings.some((r) => b.readings.some((x) => finalOf(r.bopomofo) === finalOf(x.bopomofo)));
const hasReading = (entry, bopomofo) => entry.readings.some((r) => r.bopomofo === bopomofo);

// pool：可以拿來當錯誤選項的字（同級或更簡單的字，避免出現學生沒學過的罕用字）
export function buildIndexes(dict, pool, components = null) {
  const byRadical = new Map();
  const byBody = new Map();
  const allWords = new Set();
  for (const entry of Object.values(dict)) entry.words.forEach((w) => allWords.add(w));
  for (const c of pool) {
    const entry = dict[c];
    if (!entry) continue;
    if (entry.radical) {
      if (!byRadical.has(entry.radical)) byRadical.set(entry.radical, []);
      byRadical.get(entry.radical).push(c);
    }
    for (const r of entry.readings) {
      const { body } = splitTone(r.bopomofo);
      if (!byBody.has(body)) byBody.set(body, []);
      byBody.get(body).push(c);
    }
  }
  const inPool = pool.filter((c) => dict[c]);
  return { byRadical, byBody, allWords, pool: inPool, poolSet: new Set(inPool), components };
}

// 依序從各候選清單補到 3 個錯誤選項，accept 不通過的一律跳過
function pickDistractors(candidateLists, accept, count = 3) {
  const chosen = [];
  for (const list of candidateLists) {
    for (const item of shuffle(list)) {
      if (chosen.length >= count) return chosen;
      if (!chosen.includes(item) && accept(item)) chosen.push(item);
    }
  }
  return chosen;
}

function readingQuestion(char, entry, dict, idx) {
  const answer = primaryReading(entry);
  const { body, tone } = splitTone(answer);
  const toneVariants = ['', ...TONE_MARKS, '˙']
    .filter((t) => t !== tone)
    .map((t) => (t === '˙' ? `˙${body}` : body + t));
  const others = shuffle(idx.pool).slice(0, 60).map((c) => primaryReading(dict[c]));
  const distractors = [
    ...pickDistractors([toneVariants], (b) => !hasReading(entry, b), 2),
  ];
  distractors.push(...pickDistractors([others], (b) => !hasReading(entry, b) && !distractors.includes(b), 3 - distractors.length));
  return { type: 'reading', targetWord: char, prompt: char, answer, options: shuffle([answer, ...distractors]) };
}

function charQuestion(char, entry, dict, idx) {
  const prompt = primaryReading(entry);
  const accept = (c) => c !== char && !hasReading(dict[c], prompt) && !interchangeable(c, char);
  const distractors = pickDistractors([idx.byRadical.get(entry.radical) || [], shuffle(idx.pool).slice(0, 60)], accept);
  return { type: 'char', targetWord: char, prompt, answer: char, options: shuffle([char, ...distractors]) };
}

function wordQuestion(char, entry, dict, idx) {
  const words = kidWords(entry);
  const word = words[Math.floor(Math.random() * words.length)];
  const prompt = word.replaceAll(char, '＿');
  const { body } = splitTone(primaryReading(entry));
  const accept = (c) => c !== char && !interchangeable(c, char) && !idx.allWords.has(word.replaceAll(char, c));
  const distractors = pickDistractors(
    [idx.byBody.get(body) || [], idx.byRadical.get(entry.radical) || [], shuffle(idx.pool).slice(0, 60)],
    accept,
  );
  return { type: 'word', targetWord: char, prompt, word, answer: char, options: shuffle([char, ...distractors]) };
}

// 部件家族：回傳共同部件、以及學生程度內的同家族字（聲音相近的排前面）
function familyOf(char, dict, idx) {
  const key = idx.components?.keyOf[char];
  if (!key) return null;
  const members = idx.components.families[key].filter(([m]) => dict[m] && (m === char || idx.poolSet.has(m)));
  const self = members.find(([m]) => m === char);
  if (!self) return null;
  const siblings = members.filter(([m]) => m !== char);
  const alike = siblings.filter(([m]) => soundsAlike(dict[m], dict[char]));
  const ordered = [...alike, ...siblings.filter((x) => !alike.includes(x))];
  return { key, keyStrokeCount: self[2] - self[1] + 1, self, siblings: ordered };
}

const petalOf = ([c, start, end], dict) => ({ char: c, range: [start, end], label: primaryReading(dict[c]) });

// 字卡背面用：這個字排在花瓣第一片並標亮，其餘放同家族的字
export function familyView(char, dict, idx) {
  const fam = familyOf(char, dict, idx);
  if (!fam || fam.siblings.length < 2) return null;
  return {
    key: fam.key,
    keyStrokeCount: fam.keyStrokeCount,
    petals: [{ ...petalOf(fam.self, dict), highlight: true }, ...fam.siblings.slice(0, MAX_CONTEXT_PETALS).map((m) => petalOf(m, dict))],
  };
}

function flowerQuestion(char, entry, dict, idx) {
  const fam = familyOf(char, dict, idx);
  if (!fam) return null;
  const reading = primaryReading(entry);
  const words = kidWords(entry);
  const word = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : null;
  // 同家族、而且「讀音不同」或「放進詞裡不成詞」的字才能當錯誤選項，確保只有一個正確答案
  const accept = (m) => !interchangeable(m, char)
    && !(hasReading(dict[m], reading) && (!word || idx.allWords.has(word.replaceAll(char, m))));
  const distractors = pickDistractors([fam.siblings.map(([m]) => m)], accept);
  if (distractors.length < 3) return null;

  const optionSet = new Set([char, ...distractors]);
  const context = fam.siblings.filter(([m]) => !optionSet.has(m)).slice(0, MAX_CONTEXT_PETALS - 1);
  if (context.length < 2) return null;
  return {
    type: 'flower', targetWord: char, key: fam.key, keyStrokeCount: fam.keyStrokeCount, reading, word,
    petals: shuffle([...context.map((m) => petalOf(m, dict)), { char, range: fam.self.slice(1), label: reading, hidden: true, highlight: true }]),
    answer: char, options: shuffle([...optionSet]),
  };
}

export function makeQuestion(char, dict, idx) {
  const entry = dict[char];
  const types = ['reading', 'char'];
  if (kidWords(entry).length > 0) types.push('word');
  if (idx.components?.keyOf[char]) types.push('flower');

  let roll = Math.random() * types.reduce((sum, t) => sum + TYPE_WEIGHTS[t], 0);
  const type = types.find((t) => (roll -= TYPE_WEIGHTS[t]) < 0) || 'reading';

  const builders = { flower: flowerQuestion, word: wordQuestion, char: charQuestion, reading: readingQuestion };
  const q = builders[type](char, entry, dict, idx);
  // 萬一這個字湊不出合格的題目（家族太小、錯誤選項不足），退回最保險的看字選音
  return q && q.options.length === 4 ? q : readingQuestion(char, entry, dict, idx);
}
