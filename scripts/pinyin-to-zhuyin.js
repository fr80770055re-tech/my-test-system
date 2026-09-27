// 把帶聲調符號的漢語拼音（如 xíng）轉成注音（如 ㄒㄧㄥˊ）。無法轉換時回傳 null。
const TONE_MARKS = {
  ā: ['a', 1], á: ['a', 2], ǎ: ['a', 3], à: ['a', 4],
  ē: ['e', 1], é: ['e', 2], ě: ['e', 3], è: ['e', 4],
  ī: ['i', 1], í: ['i', 2], ǐ: ['i', 3], ì: ['i', 4],
  ō: ['o', 1], ó: ['o', 2], ǒ: ['o', 3], ò: ['o', 4],
  ū: ['u', 1], ú: ['u', 2], ǔ: ['u', 3], ù: ['u', 4],
  ǖ: ['ü', 1], ǘ: ['ü', 2], ǚ: ['ü', 3], ǜ: ['ü', 4],
};
const TONE_SYMBOL = { 1: '', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' };

const INITIALS = [
  ['zh', 'ㄓ'], ['ch', 'ㄔ'], ['sh', 'ㄕ'],
  ['b', 'ㄅ'], ['p', 'ㄆ'], ['m', 'ㄇ'], ['f', 'ㄈ'], ['d', 'ㄉ'], ['t', 'ㄊ'], ['n', 'ㄋ'], ['l', 'ㄌ'],
  ['g', 'ㄍ'], ['k', 'ㄎ'], ['h', 'ㄏ'], ['j', 'ㄐ'], ['q', 'ㄑ'], ['x', 'ㄒ'],
  ['r', 'ㄖ'], ['z', 'ㄗ'], ['c', 'ㄘ'], ['s', 'ㄙ'],
];

const FINALS = {
  a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ê: 'ㄝ', ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
  an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ', er: 'ㄦ', ong: 'ㄨㄥ',
  i: 'ㄧ', ia: 'ㄧㄚ', io: 'ㄧㄛ', ie: 'ㄧㄝ', iai: 'ㄧㄞ', iao: 'ㄧㄠ', iu: 'ㄧㄡ', iou: 'ㄧㄡ',
  ian: 'ㄧㄢ', in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ', iong: 'ㄩㄥ',
  u: 'ㄨ', ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', ui: 'ㄨㄟ', uei: 'ㄨㄟ',
  uan: 'ㄨㄢ', un: 'ㄨㄣ', uen: 'ㄨㄣ', uang: 'ㄨㄤ', ueng: 'ㄨㄥ',
  ü: 'ㄩ', üe: 'ㄩㄝ', üan: 'ㄩㄢ', ün: 'ㄩㄣ',
};

// y／w 開頭的零聲母拼法先還原成標準韻母
const Y_W = {
  yi: 'i', ya: 'ia', yo: 'io', ye: 'ie', yai: 'iai', yao: 'iao', you: 'iou', yan: 'ian', yin: 'in',
  yang: 'iang', ying: 'ing', yong: 'iong', yu: 'ü', yue: 'üe', yuan: 'üan', yun: 'ün',
  wu: 'u', wa: 'ua', wo: 'uo', wai: 'uai', wei: 'uei', wan: 'uan', wen: 'uen', wang: 'uang', weng: 'ueng',
};

export function pinyinToZhuyin(pinyin) {
  let tone = 5;
  let s = '';
  for (const ch of pinyin.normalize('NFC').toLowerCase().trim()) {
    if (TONE_MARKS[ch]) { s += TONE_MARKS[ch][0]; tone = TONE_MARKS[ch][1]; }
    else s += ch;
  }
  s = s.replace(/v/g, 'ü').replace(/u:/g, 'ü');
  if (!/^[a-zü]+$/u.test(s)) return null;

  let initial = '';
  let final = s;
  if (Y_W[s]) {
    final = Y_W[s];
  } else {
    for (const [py, zy] of INITIALS) {
      if (s.startsWith(py)) { initial = zy; final = s.slice(py.length); break; }
    }
    // zhi/chi/shi/ri/zi/ci/si 的 i 是空韻，注音不寫
    if (final === 'i' && ['ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ'].includes(initial)) final = '';
    // j/q/x 後面的 u 其實是 ü
    if (['ㄐ', 'ㄑ', 'ㄒ'].includes(initial) && final.startsWith('u')) final = 'ü' + final.slice(1);
  }

  const zyFinal = final === '' ? '' : FINALS[final];
  if (zyFinal === undefined || (!initial && !zyFinal)) return null;
  const body = initial + zyFinal;
  return tone === 5 ? `˙${body}` : body + TONE_SYMBOL[tone];
}
