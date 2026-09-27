// 識字修練場出題：三種題型，錯誤選項刻意挑「容易搞混但一定是錯的」答案。
//   reading 看字選音：錯誤選項優先用同音不同調（ㄊㄜˋ → ㄊㄜˊ、ㄊㄜˇ）
//   char    看音選字：錯誤選項優先用同部首的字，並排除所有同音字，避免一題兩解
//   word    詞語填空：錯誤選項優先用同音、同部首的字，並排除能組成其他常見詞的字
import { shuffle } from './vocabProgress.js';

const TONE_MARKS = ['ˊ', 'ˇ', 'ˋ'];
const TYPE_WEIGHTS = { reading: 4, char: 3, word: 3 };
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
const hasReading = (entry, bopomofo) => entry.readings.some((r) => r.bopomofo === bopomofo);

// pool：可以拿來當錯誤選項的字（同級或更簡單的字，避免出現學生沒學過的罕用字）
export function buildIndexes(dict, pool) {
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
  return { byRadical, byBody, allWords, pool: pool.filter((c) => dict[c]) };
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

export function makeQuestion(char, dict, idx) {
  const entry = dict[char];
  const types = ['reading', 'char'];
  if (kidWords(entry).length > 0) types.push('word');

  let roll = Math.random() * types.reduce((sum, t) => sum + TYPE_WEIGHTS[t], 0);
  const type = types.find((t) => (roll -= TYPE_WEIGHTS[t]) < 0) || 'reading';

  const q = type === 'word' ? wordQuestion(char, entry, dict, idx)
    : type === 'char' ? charQuestion(char, entry, dict, idx)
      : readingQuestion(char, entry, dict, idx);
  // 萬一錯誤選項湊不滿（極少數字），退回最保險的看字選音
  return q.options.length === 4 || type === 'reading' ? q : readingQuestion(char, entry, dict, idx);
}
