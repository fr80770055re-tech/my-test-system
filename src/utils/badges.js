// 識字修練場的徽章（成就）。圖示取自 DOTOWN，與商店角色同一套像素畫風。
// 學生資料：users.stats 存累計數據，users.badges 存 { 徽章 id: 獲得日 }。
import flagImg from '../assets/other_flag_01.png';
import weedImg from '../assets/plant_weed_01.png';
import blueBookImg from '../assets/other_book_07.png';
import openBookImg from '../assets/other_book_05.png';
import bronzeImg from '../assets/other_medal_03.png';
import silverImg from '../assets/other_medal_02.png';
import goldImg from '../assets/other_medal_01.png';
import likeImg from '../assets/other_like_01.png';
import maruImg from '../assets/other_maru_01.png';
import flowerImg from '../assets/plant_flower_pink_01.png';
import morningGloryImg from '../assets/plant_morning_glory_01.png';
import sakuraImg from '../assets/plant_sakura_01.png';
import cherryTreeImg from '../assets/plant_cherry-blossoms_01.png';
import keyImg from '../assets/other_key_02.png';
import { MASTERED_LEVEL } from './vocabProgress.js';

export const BADGES = [
  { id: 'first_step', name: '踏出第一步', desc: '完成第一次識字修練', icon: flagImg, reward: 5, check: (s) => s.rounds >= 1 },
  { id: 'master_10', name: '識字新芽', desc: '掌握 10 個字', icon: weedImg, reward: 10, check: (s, m) => m >= 10 },
  { id: 'master_50', name: '小小書蟲', desc: '掌握 50 個字', icon: blueBookImg, reward: 20, check: (s, m) => m >= 50 },
  { id: 'master_100', name: '百字達人', desc: '掌握 100 個字', icon: openBookImg, reward: 30, check: (s, m) => m >= 100 },
  { id: 'master_300', name: '識字銅牌', desc: '掌握 300 個字', icon: bronzeImg, reward: 50, check: (s, m) => m >= 300 },
  { id: 'master_500', name: '識字銀牌', desc: '掌握 500 個字', icon: silverImg, reward: 80, check: (s, m) => m >= 500 },
  { id: 'master_1000', name: '識字金牌', desc: '掌握 1000 個字', icon: goldImg, reward: 150, check: (s, m) => m >= 1000 },
  { id: 'perfect', name: '完美一擊', desc: '一局第一次作答全部答對', icon: likeImg, reward: 20, check: (s) => s.perfectRounds >= 1 },
  { id: 'rescue_20', name: '錯字剋星', desc: '累計把 20 個字救出錯字本', icon: maruImg, reward: 30, check: (s) => s.rescued >= 20 },
  { id: 'flower_20', name: '花瓣小達人', desc: '累計答對 20 題花瓣識字', icon: flowerImg, reward: 30, check: (s) => s.flowerCorrect >= 20 },
  { id: 'streak_3', name: '持之以恆', desc: '連續 3 天練習', icon: morningGloryImg, reward: 15, check: (s) => s.bestStreak >= 3 },
  { id: 'streak_7', name: '一週不間斷', desc: '連續 7 天練習', icon: sakuraImg, reward: 40, check: (s) => s.bestStreak >= 7 },
  { id: 'streak_30', name: '滿樹花開', desc: '連續 30 天練習', icon: cherryTreeImg, reward: 120, check: (s) => s.bestStreak >= 30 },
  { id: 'hard_try', name: '勇闖高階', desc: '完成一次高階修練', icon: keyImg, reward: 20, check: (s) => s.hardRounds >= 1 },
];

export const countMastered = (vocab) => Object.values(vocab).filter((r) => r.b >= MASTERED_LEVEL).length;

// round：{ perfect, hard, flowerCorrect, rescued }；同一天多玩幾局不會重複累加連續天數
export function updateStats(prev, round, today) {
  const s = { rounds: 0, perfectRounds: 0, hardRounds: 0, flowerCorrect: 0, rescued: 0, streak: 0, bestStreak: 0, lastDay: null, ...prev };
  const streak = s.lastDay === today ? s.streak : s.lastDay === today - 1 ? s.streak + 1 : 1;
  return {
    ...s,
    rounds: s.rounds + 1,
    perfectRounds: s.perfectRounds + (round.perfect ? 1 : 0),
    hardRounds: s.hardRounds + (round.hard ? 1 : 0),
    flowerCorrect: s.flowerCorrect + round.flowerCorrect,
    rescued: s.rescued + round.rescued,
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
    lastDay: today,
  };
}

export const newlyEarned = (earned, stats, mastered) => BADGES.filter((b) => !earned[b.id] && b.check(stats, mastered));
