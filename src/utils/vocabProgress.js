// 識字進度：每個字存成 { b, n, c, w }，放在學生 users 文件的 vocab 欄位。
//   b：熟練等級 0–5（0 = 錯字本），n：下次該複習的日期（日數），c／w：累計第一次作答答對／答錯次數
// 採間隔複習：答對就升一級、隔更久再考；答錯直接回到錯字本，隔天再考。
const INTERVALS = [1, 1, 3, 7, 16, 35];
export const MASTERED_LEVEL = 3;
const MAX_LEVEL = 5;
const MAX_REVIEWS_PER_ROUND = 12;
const NEW_CHAR_WINDOW = 40;

// 以學生裝置的當地日期計算「第幾天」，跨午夜就算新的一天
export function todayNumber() {
  const now = new Date();
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function summarize(progress, chars, today) {
  let mastered = 0, due = 0, seen = 0;
  for (const c of chars) {
    const r = progress[c];
    if (!r) continue;
    seen++;
    if (r.b >= MASTERED_LEVEL) mastered++;
    if (r.n <= today) due++;
  }
  return { mastered, due, seen, total: chars.length };
}

export function mistakeChars(progress) {
  return Object.keys(progress)
    .filter((c) => progress[c].b === 0)
    .sort((a, b) => progress[b].w - progress[a].w || progress[a].n - progress[b].n);
}

export function cardTag(record) {
  if (!record) return 'new';
  return record.b === 0 ? 'mistake' : 'review';
}

// 挑一局的字：先放到期要複習的字（越不熟的越先），再依字頻補新字，不夠再隨機補
export function pickRound(chars, progress, today, size = 20) {
  const reviews = chars
    .filter((c) => progress[c] && progress[c].n <= today)
    .sort((a, b) => progress[a].b - progress[b].b || progress[a].n - progress[b].n)
    .slice(0, MAX_REVIEWS_PER_ROUND);
  const unseen = chars.filter((c) => !progress[c]).slice(0, NEW_CHAR_WINDOW);
  const picked = [...reviews, ...shuffle(unseen).slice(0, size - reviews.length)];
  if (picked.length < size) {
    const chosen = new Set(picked);
    picked.push(...shuffle(chars.filter((c) => !chosen.has(c))).slice(0, size - picked.length));
  }
  return shuffle(picked);
}

// 只有「新字、錯字，或已到期」的字答對才升級，避免提早被抽到時灌等級
export function applyResult(record, correct, today) {
  const prev = record || { b: 0, n: today, c: 0, w: 0 };
  const eligible = !record || prev.b === 0 || prev.n <= today;
  let level;
  if (!correct) level = 0;
  else level = eligible ? Math.min(prev.b + 1, MAX_LEVEL) : prev.b;
  const next = correct && !eligible ? prev.n : today + INTERVALS[level];
  return { b: level, n: next, c: prev.c + (correct ? 1 : 0), w: prev.w + (correct ? 0 : 1) };
}
